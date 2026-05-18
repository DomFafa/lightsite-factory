import { getRunPaths } from "./run-paths";
import { RunMeta, RunMetaSchema } from "./run-meta";
import { readJson } from "../utils/json";

export function readRun(runPathOrSiteId: string, cwd = process.cwd()): RunMeta {
  const paths = getRunPaths(runPathOrSiteId, cwd);
  return readJson<RunMeta>(paths.runJson, RunMetaSchema);
}
