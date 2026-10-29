// src/services/git/repositoryService.js
import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { env } from "../utils/env.js";

/**
 * Validate that a remote URL is a safe HTTPS git URL from an allowed host.
 * Allowed hosts: github.com, gitlab.com, codeberg.org
 */
function isAllowedGitUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const allowed = ["github.com", "gitlab.com", "codeberg.org"]; // extend as needed
    if (!allowed.includes(parsed.hostname)) return false;
    // disallow credentials in URL
    if (parsed.username || parsed.password) return false;
    // block localhost and private IP ranges – hostname check sufficient for typical hosts
    return true;
  } catch {
    return false;
  }
}

/**
 * Clone a remote repository into a temporary directory.
 * Returns the absolute path to the cloned repo.
 */
export async function cloneRepository(remoteUrl) {
  if (!isAllowedGitUrl(remoteUrl)) {
    throw new Error("Remote URL is not allowed or not a valid HTTPS Git URL");
  }
  // create a unique temp directory
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "repo-seance-"));
  const repoDir = path.join(tmpDir, "repo");
  await fs.mkdir(repoDir);

  // shallow clone without tags or submodules
  await runGit(["clone", "--depth", "1", "--no-tags", remoteUrl, repoDir]);
  return repoDir;
}

/**
 * Resolve a local repository path, ensuring it exists and contains a .git folder.
 */
export async function resolveLocalRepository(localPath) {
  const absPath = path.resolve(localPath);
  const gitPath = path.join(absPath, ".git");
  try {
    const stat = await fs.stat(gitPath);
    if (!stat.isDirectory()) throw new Error();
  } catch {
    throw new Error(`Path ${absPath} does not appear to be a Git repository`);
  }
  return absPath;
}

/** Helper to run a git command and capture stdout */
function runGit(args, cwd = undefined) {
  return new Promise((resolve, reject) => {
    const git = spawn("git", args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    git.stdout.on("data", (data) => (stdout += data.toString()));
    git.stderr.on("data", (data) => (stderr += data.toString()));
    git.on("error", reject);
    git.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`git ${args.join(" ")} failed: ${stderr.trim()}`));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

/**
 * Generate a reproducible stable ID for a piece of evidence based on its content.
 * Uses SHA‑256 of a deterministic string.
 */
export function generateEvidenceId(...parts) {
  const hash = crypto.createHash("sha256");
  hash.update(parts.join("|"));
  return hash.digest("hex");
}

export const repositoryService = {
  isAllowedGitUrl,
  cloneRepository,
  resolveLocalRepository,
  runGit,
  generateEvidenceId,
};
