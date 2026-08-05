#!/usr/bin/env node

/**
 * One-shot headed Reddit login. Saves session into data/reddit-browser-profile.
 * Usage: npm run reddit:login
 */

import { loadProjectEnv } from "./lib/env.mjs";
import { interactiveLogin, getProfileDir } from "./lib/reddit-browser.mjs";

loadProjectEnv();

async function main() {
  console.log("Opening headed Chromium for Reddit login…");
  console.log(`Profile will be saved to: ${getProfileDir()}`);
  const { username } = await interactiveLogin();
  console.log(`\nDone. Logged in as /u/${username}. You can now run: pnpm reddit:engage`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exitCode = 1;
});
