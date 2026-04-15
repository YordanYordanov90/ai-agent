// lib/tools/github.ts
import { createGithubTools } from "@github-tools/sdk";

// Official Vercel GitHub tools (42 tools ready)
const githubToken = process.env.GITHUB_TOKEN;

export const githubTools = githubToken
  ? createGithubTools({
      token: githubToken,
    })
  : {};
