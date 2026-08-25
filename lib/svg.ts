import { accountUptime, type GitHubStats } from "./github";
import type { Theme } from "./ascii";
import { profileConfig, type ProfileConfig } from "../profile.config";

const FONT_SIZE = 14;
const LINE_HEIGHT = 18;
const CHAR_WIDTH = FONT_SIZE * 0.6;
// The ASCII art renders at a smaller size so it can carry ~2x the resolution
// in the same footprint. Cell aspect (6x12) matches CHAR_ASPECT in ascii.ts.
const ASCII_FONT_SIZE = 8;
const ASCII_CHAR_WIDTH = 4.8;
const ASCII_LINE_HEIGHT = 9.6;
const PAD = 24;
const GAP = 28;

const PALETTES = {
  dark: {
    bg: "#0d1117",
    border: "#30363d",
    ascii: "#c9d1d9",
    header: "#58a6ff",
    rule: "#3d444d",
    key: "#ffa657",
    dots: "#484f58",
    value: "#c9d1d9",
    number: "#79c0ff",
  },
  light: {
    bg: "#ffffff",
    border: "#d0d7de",
    ascii: "#24292f",
    header: "#0969da",
    rule: "#d0d7de",
    key: "#953800",
    dots: "#8c959f",
    value: "#24292f",
    number: "#0550ae",
  },
} satisfies Record<Theme, Record<string, string>>;

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface Span {
  text: string;
  color: string;
}

type Line = Span[];

function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, Math.max(1, max - 1)) + "…" : value;
}

function buildInfoLines(
  stats: GitHubStats,
  theme: Theme,
  cfg: ProfileConfig = profileConfig
): { lines: Line[]; infoCols: number } {
  const c = PALETTES[theme];
  const items: Array<
    | { type: "header"; text: string }
    | { type: "kv"; key: string; value: string; valueColor?: string }
    | { type: "kv2"; k1: string; v1: string; k2: string; v2: string }
    | { type: "blank" }
  > = [];

  // Header
  items.push({ type: "header", text: `${stats.login}@github` });

  // Environment Section
  const env = cfg.env || {};
  const uptimeVal =
    !env.uptime || env.uptime === "auto"
      ? accountUptime(stats.createdAt)
      : env.uptime;

  items.push({ type: "kv", key: "OS", value: env.os || "Linux / Windows" });
  items.push({ type: "kv", key: "Uptime", value: uptimeVal });
  if (env.host) items.push({ type: "kv", key: "Host", value: env.host });
  if (env.kernel) items.push({ type: "kv", key: "Kernel", value: env.kernel });
  if (env.ide) items.push({ type: "kv", key: "IDE", value: env.ide });

  // Languages Section
  const langs = cfg.languages || {};
  const progLangs =
    langs.programming && langs.programming.length > 0
      ? langs.programming.join(", ")
      : stats.languages.join(", ");

  items.push({ type: "blank" });
  items.push({ type: "header", text: "Languages" });
  if (progLangs) items.push({ type: "kv", key: "Languages.Programming", value: progLangs });
  if (langs.web && langs.web.length > 0)
    items.push({ type: "kv", key: "Languages.Web", value: langs.web.join(", ") });
  if (langs.tools && langs.tools.length > 0)
    items.push({ type: "kv", key: "Languages.Tools", value: langs.tools.join(", ") });
  if (langs.real && langs.real.length > 0)
    items.push({ type: "kv", key: "Languages.Real", value: langs.real.join(", ") });

  // Hobbies Section
  const hobbies = cfg.hobbies || {};
  if (
    (hobbies.software && hobbies.software.length > 0) ||
    (hobbies.hardware && hobbies.hardware.length > 0)
  ) {
    items.push({ type: "blank" });
    items.push({ type: "header", text: "Hobbies" });
    if (hobbies.software && hobbies.software.length > 0)
      items.push({ type: "kv", key: "Hobbies.Software", value: hobbies.software.join(", ") });
    if (hobbies.hardware && hobbies.hardware.length > 0)
      items.push({ type: "kv", key: "Hobbies.Hardware", value: hobbies.hardware.join(", ") });
  }

  // Contact Section
  const contact = cfg.contact || {};
  items.push({ type: "blank" });
  items.push({ type: "header", text: "Contact" });
  if (contact.email || stats.email)
    items.push({ type: "kv", key: "Email", value: contact.email || stats.email! });
  if (contact.website || stats.blog)
    items.push({ type: "kv", key: "Website", value: contact.website || stats.blog! });
  items.push({ type: "kv", key: "GitHub", value: contact.github || `github.com/${stats.login}` });
  if (contact.linkedin) items.push({ type: "kv", key: "LinkedIn", value: contact.linkedin });
  if (contact.discord) items.push({ type: "kv", key: "Discord", value: contact.discord });

  // GitHub Statistics Section
  items.push({ type: "blank" });
  items.push({ type: "header", text: "GitHub Statistics" });
  const n = (val: number) => val.toLocaleString("en-US");
  items.push({
    type: "kv2",
    k1: "Repositories",
    v1: n(stats.publicRepos),
    k2: "Stars",
    v2: n(stats.stars),
  });

  const commitsVal = stats.commits !== null ? n(stats.commits) : "N/A";
  items.push({
    type: "kv2",
    k1: "Commits",
    v1: commitsVal,
    k2: "Followers",
    v2: n(stats.followers),
  });

  if (typeof stats.following === "number") {
    items.push({
      type: "kv",
      key: "Following",
      value: n(stats.following),
      valueColor: c.number,
    });
  }

  // Calculate required column width dynamically
  let maxNeeded = 60;
  for (const item of items) {
    if (item.type === "header") {
      maxNeeded = Math.max(maxNeeded, item.text.length + 8);
    } else if (item.type === "kv") {
      maxNeeded = Math.max(maxNeeded, item.key.length + item.value.length + 8);
    } else if (item.type === "kv2") {
      const half = item.k1.length + item.v1.length + item.k2.length + item.v2.length + 14;
      maxNeeded = Math.max(maxNeeded, half);
    }
  }

  const infoCols = Math.min(85, Math.max(60, maxNeeded));

  // Render lines with infoCols width
  const lines: Line[] = [];

  for (const item of items) {
    if (item.type === "blank") {
      lines.push([]);
    } else if (item.type === "header") {
      const label = ` ${item.text} `;
      const fill = "─".repeat(Math.max(0, infoCols - label.length - 1));
      lines.push([
        { text: "─", color: c.rule },
        { text: label, color: c.header },
        { text: fill, color: c.rule },
      ]);
    } else if (item.type === "kv") {
      const val = truncate(item.value, infoCols - item.key.length - 8);
      const dotCount = Math.max(2, infoCols - item.key.length - val.length - 6);
      lines.push([
        { text: `. ${item.key}: `, color: c.key },
        { text: ".".repeat(dotCount), color: c.dots },
        { text: ` ${val}`, color: item.valueColor || c.value },
      ]);
    } else if (item.type === "kv2") {
      const half = Math.floor((infoCols - 3) / 2);
      const part = (key: string, value: string): Line => {
        const val = truncate(value, half - key.length - 6);
        const dotCount = Math.max(2, half - key.length - val.length - 6);
        return [
          { text: `. ${key}: `, color: c.key },
          { text: ".".repeat(dotCount), color: c.dots },
          { text: ` ${val}`, color: c.number },
        ];
      };
      lines.push([
        ...part(item.k1, item.v1),
        { text: " | ", color: c.rule },
        ...part(item.k2, item.v2),
      ]);
    }
  }

  return { lines, infoCols };
}

export function renderSvg(
  stats: GitHubStats,
  asciiLines: string[],
  theme: Theme,
  config: ProfileConfig = profileConfig
): string {
  const c = PALETTES[theme];
  const { lines: infoLines, infoCols } = buildInfoLines(stats, theme, config);

  const asciiCols = Math.max(...asciiLines.map((l) => l.length), 1);
  const infoX = PAD + asciiCols * ASCII_CHAR_WIDTH + GAP;
  const width = Math.round(infoX + infoCols * CHAR_WIDTH + PAD);

  const asciiHeight = asciiLines.length * ASCII_LINE_HEIGHT;
  const infoHeight = infoLines.length * LINE_HEIGHT;
  const contentHeight = Math.max(asciiHeight, infoHeight);
  const height = PAD * 2 + contentHeight;

  // Vertically center whichever column is shorter.
  const asciiTop = PAD + (contentHeight - asciiHeight) / 2;
  const infoTop = PAD + (contentHeight - infoHeight) / 2;

  const fontFamily = `font-family="'Consolas', 'Menlo', 'DejaVu Sans Mono', monospace" xml:space="preserve"`;
  const asciiAttrs = `${fontFamily} font-size="${ASCII_FONT_SIZE}"`;
  const infoAttrs = `${fontFamily} font-size="${FONT_SIZE}"`;

  const asciiText = asciiLines
    .map((line, i) => {
      if (!line) return "";
      const y = asciiTop + (i + 1) * ASCII_LINE_HEIGHT - 3;
      return `<text x="${PAD}" y="${y}" fill="${c.ascii}" ${asciiAttrs}>${escapeXml(line)}</text>`;
    })
    .filter(Boolean)
    .join("\n  ");

  const infoText = infoLines
    .map((spans, i) => {
      if (spans.length === 0) return "";
      const y = infoTop + (i + 1) * LINE_HEIGHT - 4;
      const tspans = spans
        .map((s) => `<tspan fill="${s.color}">${escapeXml(s.text)}</tspan>`)
        .join("");
      return `<text x="${infoX}" y="${y}" ${infoAttrs}>${tspans}</text>`;
    })
    .filter(Boolean)
    .join("\n  ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="ASCII GitHub profile card for ${escapeXml(stats.login)}">
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="8" fill="${c.bg}" stroke="${c.border}"/>
  ${asciiText}
  ${infoText}
</svg>`;
}
