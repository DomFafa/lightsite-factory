import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { requireEnv, loadEnv } from "../utils/env";

const execFileAsync = promisify(execFile);

export type CloudflareDeployResult = {
  deployment_url?: string;
  stdout: string;
  stderr: string;
};

export async function deployToCloudflarePages(args: {
  siteDir: string;
  projectName: string;
  cwd?: string;
}): Promise<CloudflareDeployResult> {
  loadEnv(args.cwd);
  requireEnv("CLOUDFLARE_ACCOUNT_ID");
  requireEnv("CLOUDFLARE_API_TOKEN");

  const { stdout, stderr } = await execFileAsync(
    "pnpm",
    [
      "exec",
      "wrangler",
      "pages",
      "deploy",
      args.siteDir,
      "--project-name",
      args.projectName
    ],
    {
      cwd: args.cwd ?? process.cwd(),
      env: process.env,
      maxBuffer: 1024 * 1024 * 4
    }
  );

  return {
    deployment_url: extractDeploymentUrl(`${stdout}\n${stderr}`),
    stdout,
    stderr
  };
}

function extractDeploymentUrl(output: string): string | undefined {
  return output.match(/https:\/\/[^\s]+\.pages\.dev[^\s]*/)?.[0] ?? output.match(/https:\/\/[^\s]+/)?.[0];
}
