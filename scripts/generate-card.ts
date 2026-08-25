import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fetchStats } from "../lib/github";
import { avatarToAscii } from "../lib/ascii";
import { renderSvg } from "../lib/svg";
import { profileConfig } from "../profile.config";

async function main() {
  const username = process.env.GITHUB_USERNAME || profileConfig.username || "abhishekapurva0809";
  console.log(`🚀 Generating GitHub profile card for @${username}...`);

  try {
    const stats = await fetchStats(username);
    console.log(`✅ Fetched stats for @${stats.login} (${stats.publicRepos} repos, ${stats.stars} stars, ${stats.followers} followers, ${stats.following} following)`);

    console.log(`🎨 Rendering ASCII avatar for dark theme...`);
    const darkAscii = await avatarToAscii(stats.avatarUrl, "dark", 100);
    const darkSvg = renderSvg(stats, darkAscii, "dark", profileConfig);

    console.log(`🎨 Rendering ASCII avatar for light theme...`);
    const lightAscii = await avatarToAscii(stats.avatarUrl, "light", 100);
    const lightSvg = renderSvg(stats, lightAscii, "light", profileConfig);

    const rootDir = process.cwd();
    const darkPath = join(rootDir, "dark_mode.svg");
    const lightPath = join(rootDir, "light_mode.svg");

    await writeFile(darkPath, darkSvg, "utf-8");
    await writeFile(lightPath, lightSvg, "utf-8");

    console.log(`✨ Successfully generated:`);
    console.log(`   - ${darkPath} (${Buffer.byteLength(darkSvg)} bytes)`);
    console.log(`   - ${lightPath} (${Buffer.byteLength(lightSvg)} bytes)`);
  } catch (error) {
    console.error(`❌ Error generating profile card:`, error);
    process.exit(1);
  }
}

main();
