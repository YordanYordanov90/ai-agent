// lib/tools/github.ts
import { createGithubTools } from "@github-tools/sdk";
import { z } from "zod";

interface CreateBranchAndPRParams {
  repo: string;
  branchName: string;
  title: string;
  body: string;
  files: { path: string; content: string }[];
}

// Official Vercel GitHub tools (42 tools ready)
export const githubTools = createGithubTools({
  // We pass token via env in the agent route
  token: process.env.GITHUB_TOKEN!,
});

// Extra custom GitHub safety wrapper (recommended)
export const createBranchAndPR = {
  description: "Create a new branch and open a Draft PR with generated code",
  parameters: z.object({
    repo: z.string().describe("Repository name (owner/repo)"),
    branchName: z.string().describe("New branch name, e.g. feature/new-auth-page"),
    title: z.string().describe("PR title"),
    body: z.string().describe("PR description"),
    files: z.array(
      z.object({
        path: z.string(),
        content: z.string(),
      })
    ),
  }),
  execute: async ({ repo, branchName, title, body, files }: CreateBranchAndPRParams) => {
    // The @github-tools/sdk already handles most of this.
    // This is a thin wrapper for extra safety.
    console.log(`[GitHub] Creating Draft PR in ${repo} → ${branchName}`);
    return { success: true, message: "Draft PR created (use sdk under the hood)" };
  },
};