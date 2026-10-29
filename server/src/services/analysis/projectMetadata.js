// src/services/analysis/projectMetadata.js
import fs from "fs/promises";
import path from "path";
import { repositoryService } from "../git/repositoryService.js";

/**
 * Gather high‑level repository metadata.
 * Returns an object with the fields described in the spec.
 */
export async function getProjectMetadata(repoPath) {
  const result = {};

  // Repository name (directory name)
  result.name = path.basename(repoPath);

  // Default branch – use "git rev-parse --abbrev-ref HEAD"
  try {
    const defaultBranch = await repositoryService.runGit(["rev-parse", "--abbrev-ref", "HEAD"], repoPath);
    result.defaultBranch = defaultBranch;
  } catch {
    result.defaultBranch = null;
  }

  // List branches
  try {
    const branchList = await repositoryService.runGit(["branch", "--format=%(refname:short)"], repoPath);
    result.branches = branchList.split("\n").filter(Boolean);
  } catch {
    result.branches = [];
  }

  // Detect manifests (package.json, pyproject.toml, etc.)
  const manifests = [];
  const possible = ["package.json", "requirements.txt", "setup.py", "pyproject.toml", "Cargo.toml"]; // extend as needed
  for (const file of possible) {
    try {
      await fs.access(path.join(repoPath, file));
      manifests.push(file);
    } catch {}
  }
  result.manifests = manifests;

  // README presence
  const readmeCandidates = ["README.md", "README.txt", "README"];
  result.readme = null;
  for (const r of readmeCandidates) {
    try {
      await fs.access(path.join(repoPath, r));
      result.readme = r;
      break;
    } catch {}
  }

  // Test configuration indicators (jest, mocha, etc.)
  const testIndicators = [];
  const testFiles = ["jest.config.js", "mocha.opts", "package.json"]; // simplistic detection
  for (const tf of testFiles) {
    try {
      const content = await fs.readFile(path.join(repoPath, tf), "utf8");
      if (tf === "package.json" && /"test"\s*:/i.test(content)) testIndicators.push("npm test script");
      else if (/jest|mocha|ava|tap/.test(content)) testIndicators.push(tf);
    } catch {}
  }
  result.testIndicators = testIndicators;

  // Count files by extension (limited to top‑level for performance)
  try {
    const entries = await fs.readdir(repoPath, { withFileTypes: true });
    const extCounts = {};
    for (const e of entries) {
      if (e.isFile()) {
        const ext = path.extname(e.name).toLowerCase();
        extCounts[ext] = (extCounts[ext] || 0) + 1;
      }
    }
    result.fileExtensionCounts = extCounts;
  } catch {
    result.fileExtensionCounts = {};
  }

  return result;
}

export const projectMetadata = { getProjectMetadata };
