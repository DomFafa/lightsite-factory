import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { requireEnv, loadEnv } from "../utils/env";

const execFileAsync = promisify(execFile);

export type CloudflareDeployResult = {
  deployment_url?: string;
  project_name: string;
  stdout: string;
  stderr: string;
};

export function getCloudflarePagesProjectName(siteId: string): string {
  const normalized = siteId.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
  return /^[a-z]/.test(normalized) ? normalized : `lightsite-${normalized}`;
}

export async function deployToCloudflarePages(args: {
  siteDir: string;
  projectName: string;
  cwd?: string;
}): Promise<CloudflareDeployResult> {
  loadEnv(args.cwd);
  requireEnv("CLOUDFLARE_ACCOUNT_ID");
  requireEnv("CLOUDFLARE_API_TOKEN");

  const projectName = getCloudflarePagesProjectName(args.projectName);
  try {
    const result = await runWranglerDeploy(args.siteDir, projectName, args.cwd);
    return {
      deployment_url: extractDeploymentUrl(`${result.stdout}\n${result.stderr}`),
      project_name: projectName,
      stdout: result.stdout,
      stderr: result.stderr
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/Project not found|8000007/i.test(message)) throw error;
    await execFileAsync(
      "pnpm",
      ["exec", "wrangler", "pages", "project", "create", projectName, "--production-branch", "main"],
      {
        cwd: args.cwd ?? process.cwd(),
        env: process.env,
        maxBuffer: 1024 * 1024 * 4
      }
    );
    const result = await runWranglerDeploy(args.siteDir, projectName, args.cwd);
    return {
      deployment_url: extractDeploymentUrl(`${result.stdout}\n${result.stderr}`),
      project_name: projectName,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }
}

async function runWranglerDeploy(
  siteDir: string,
  projectName: string,
  cwd?: string
): Promise<{ stdout: string; stderr: string }> {
  return execFileAsync(
    "pnpm",
    [
      "exec",
      "wrangler",
      "pages",
      "deploy",
      siteDir,
      "--project-name",
      projectName,
      "--commit-dirty=true"
    ],
    {
      cwd: cwd ?? process.cwd(),
      env: process.env,
      maxBuffer: 1024 * 1024 * 4
    }
  );
}

function extractDeploymentUrl(output: string): string | undefined {
  return output.match(/https:\/\/[^\s]+\.pages\.dev[^\s]*/)?.[0] ?? output.match(/https:\/\/[^\s]+/)?.[0];
}
