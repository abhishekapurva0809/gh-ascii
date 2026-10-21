import { execSync } from "node:child_process";

const API = "https://api.github.com";

export interface LinesOfCode {
  total: number;
  additions: number;
  deletions: number;
}

export interface GitHubStats {
  login: string;
  name: string;
  avatarUrl: string;
  createdAt: string;
  location: string | null;
  company: string | null;
  blog: string | null;
  email: string | null;
  twitter: string | null;
  followers: number;
  following: number;
  publicRepos: number;
  stars: number;
  languages: string[];
  commits: number | null;
  linesOfCode?: LinesOfCode | null;
}

export class GitHubUserNotFound extends Error {
  constructor(login: string) {
    super(`GitHub user "${login}" not found`);
  }
}

/**
 * Resolve an active GitHub token from environment variables or local git credentials.
 */
function getGitHubToken(): string | null {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  if (process.env.PROFILE_REPO_PAT) return process.env.PROFILE_REPO_PAT;
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;

  // In local development, attempt to read stored credentials from git credential helper
  try {
    const creds = execSync("git credential fill", {
      input: "protocol=https\nhost=github.com\n",
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    });
    for (const line of creds.split("\n")) {
      if (line.startsWith("password=")) {
        return line.substring("password=".length).trim();
      }
    }
  } catch {
    // Git credential helper not available or no credentials stored
  }

  return null;
}

function ghHeaders(accept = "application/vnd.github+json"): HeadersInit {
  const headers: Record<string, string> = {
    Accept: accept,
    "User-Agent": "gh-ascii",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = getGitHubToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

interface RepoSummary {
  name: string;
  owner: { login: string };
  fork: boolean;
  private?: boolean;
  stargazers_count: number;
  language: string | null;
}

async function fetchRepos(login: string, token: string | null): Promise<RepoSummary[]> {
  const headers = ghHeaders();
  // If authenticated, /user/repos returns both public and private repositories
  if (token) {
    try {
      const res = await fetch(
        `${API}/user/repos?per_page=100&affiliation=owner,collaborator`,
        { headers, next: { revalidate: 3600 } }
      );
      if (res.ok) {
        const repos = await res.json();
        if (Array.isArray(repos) && repos.length > 0) return repos;
      }
    } catch {}
  }

  const res = await fetch(
    `${API}/users/${login}/repos?per_page=100&sort=pushed`,
    { headers, next: { revalidate: 3600 } }
  );
  if (!res.ok) return [];
  return res.json();
}

/**
 * Fetch total commits till the first day on GitHub (including public and private commits).
 * Uses GitHub GraphQL API across all contribution years, with fallbacks.
 */
async function fetchTotalCommits(
  login: string,
  createdAt: string,
  token: string | null
): Promise<number | null> {
  // 1. Primary: GitHub GraphQL API across all contribution years
  if (token) {
    try {
      const startYear = new Date(createdAt).getFullYear();
      const endYear = new Date().getFullYear();

      let yearQueries = "";
      for (let y = startYear; y <= endYear; y++) {
        yearQueries += `
          y${y}: contributionsCollection(from: "${y}-01-01T00:00:00Z", to: "${y}-12-31T23:59:59Z") {
            totalCommitContributions
            restrictedContributionsCount
          }
        `;
      }

      const query = `query {
        user(login: "${login}") {
          ${yearQueries}
        }
      }`;

      const res = await fetch(`${API}/graphql`, {
        method: "POST",
        headers: {
          "User-Agent": "gh-ascii",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        next: { revalidate: 3600 },
        body: JSON.stringify({ query }),
      });

      if (res.ok) {
        const json = await res.json();
        const userData = json.data?.user;
        if (userData) {
          let totalCommits = 0;
          for (let y = startYear; y <= endYear; y++) {
            const yData = userData[`y${y}`];
            if (yData) {
              const pub = typeof yData.totalCommitContributions === "number" ? yData.totalCommitContributions : 0;
              const priv = typeof yData.restrictedContributionsCount === "number" ? yData.restrictedContributionsCount : 0;
              totalCommits += pub + priv;
            }
          }
          return totalCommits;
        }
      }
    } catch {
      // Fallback below
    }
  }

  // 2. Fallback: Search commits endpoint
  try {
    const res = await fetch(
      `${API}/search/commits?q=author:${login}&per_page=1`,
      { headers: ghHeaders(), next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const data = await res.json();
      if (typeof data.total_count === "number") return data.total_count;
    }
  } catch {}

  return null;
}

/**
 * Calculate total Lines of Code on GitHub (net lines, additions, deletions)
 * across all repositories contributed to by the user.
 */
async function fetchLinesOfCode(
  login: string,
  repos: RepoSummary[],
  token: string | null
): Promise<LinesOfCode | null> {
  const headers = ghHeaders();

  try {
    const results = await Promise.all(
      repos.map(async (repo) => {
        const owner = repo.owner?.login || login;
        const url = `${API}/repos/${owner}/${repo.name}/stats/contributors`;

        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const res = await fetch(url, { headers, next: { revalidate: 3600 } });
            if (res.status === 200) {
              const data = await res.json();
              if (Array.isArray(data)) {
                const userContrib = data.find(
                  (c) => c.author && c.author.login.toLowerCase() === login.toLowerCase()
                );
                if (userContrib && Array.isArray(userContrib.weeks)) {
                  let a = 0;
                  let d = 0;
                  for (const w of userContrib.weeks) {
                    a += w.a || 0;
                    d += w.d || 0;
                  }
                  return { additions: a, deletions: d };
                }
              }
              return { additions: 0, deletions: 0 };
            }
            if (res.status === 202) {
              // Wait briefly if GitHub is generating statistics
              await new Promise((r) => setTimeout(r, 1200));
              continue;
            }
          } catch {}
          break;
        }
        return { additions: 0, deletions: 0 };
      })
    );

    let additions = 0;
    let deletions = 0;
    for (const r of results) {
      additions += r.additions;
      deletions += r.deletions;
    }

    if (additions > 0 || deletions > 0) {
      return {
        total: additions - deletions,
        additions,
        deletions,
      };
    }
  } catch {}

  return null;
}

export async function fetchStats(login: string): Promise<GitHubStats> {
  const token = getGitHubToken();
  const userRes = await fetch(`${API}/users/${login}`, {
    headers: ghHeaders(),
    next: { revalidate: 3600 },
  });

  if (userRes.status === 404) throw new GitHubUserNotFound(login);
  if (!userRes.ok) {
    if (userRes.status === 403) {
      console.warn(
        `⚠️ GitHub API rate limit reached for unauthenticated request. Using fallback stats for @${login}. Set GITHUB_TOKEN environment variable to avoid rate limits.`
      );
      return {
        login,
        name: login,
        avatarUrl: `https://github.com/${login}.png`,
        createdAt: new Date().toISOString(),
        location: null,
        company: null,
        blog: null,
        email: null,
        twitter: null,
        followers: 0,
        following: 0,
        publicRepos: 0,
        stars: 0,
        languages: ["TypeScript", "JavaScript"],
        commits: null,
        linesOfCode: null,
      };
    }
    throw new Error(`GitHub API error: ${userRes.status} ${await userRes.text()}`);
  }
  const user = await userRes.json();

  const repos = await fetchRepos(login, token);

  const [commits, linesOfCode] = await Promise.all([
    fetchTotalCommits(login, user.created_at, token),
    fetchLinesOfCode(login, repos, token),
  ]);

  const stars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);

  const langCounts = new Map<string, number>();
  for (const repo of repos) {
    if (repo.fork || !repo.language) continue;
    langCounts.set(repo.language, (langCounts.get(repo.language) ?? 0) + 1);
  }
  const languages = [...langCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([lang]) => lang);

  return {
    login: user.login,
    name: user.name || user.login,
    avatarUrl: user.avatar_url,
    createdAt: user.created_at,
    location: user.location || null,
    company: user.company || null,
    blog: user.blog || null,
    email: user.email || null,
    twitter: user.twitter_username || null,
    followers: user.followers,
    following: typeof user.following === "number" ? user.following : 0,
    publicRepos: user.public_repos,
    stars,
    languages,
    commits,
    linesOfCode,
  };
}

export function accountUptime(createdAt: string, now = new Date()): string {
  const created = new Date(createdAt);
  let years = now.getFullYear() - created.getFullYear();
  let months = now.getMonth() - created.getMonth();
  let days = now.getDate() - created.getDate();
  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} year${years === 1 ? "" : "s"}`);
  if (months > 0) parts.push(`${months} month${months === 1 ? "" : "s"}`);
  parts.push(`${days} day${days === 1 ? "" : "s"}`);
  return parts.join(", ");
}
