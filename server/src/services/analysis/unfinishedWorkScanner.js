// src/services/analysis/unfinishedWorkScanner.js
import fs from "fs/promises";
import path from "path";
import { repositoryService } from "../git/repositoryService.js";
import { generateEvidenceId } from "../git/repositoryService.js";

// Allowed text extensions (add more as needed)
const ALLOWED_EXT = [
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".md",
  ".txt",
  ".json",
];

const MAX_FILE_SIZE = 200 * 1024; // 200KB

const TODO_REGEX = /\b(TODO|FIXME|HACK|XXX)\b[:\s]?([^\n]*)/i;
const NOT_IMPL_REGEX = /\b(not\s+implemented|placeholder|TODO|FIXME)\b/i;
const SKIPPED_TEST_REGEX = /\bskip\b|\bskipTest\b|\bskip\.test\b/i;

/** Recursively walk a directory, respecting exclusions */
async function walk(dir, repoRoot, findings = [], evidence = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(repoRoot, fullPath);

    // Exclude dangerous or irrelevant paths
    if (relPath.startsWith(".git") || relPath.startsWith("node_modules") || relPath.startsWith("dist") || relPath.startsWith("build")) continue;
    if (entry.isDirectory()) {
      await walk(fullPath, repoRoot, findings, evidence);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!ALLOWED_EXT.includes(ext)) continue;
      const stat = await fs.stat(fullPath);
      if (stat.size > MAX_FILE_SIZE) continue;

      const content = await fs.readFile(fullPath, "utf8");
      const lines = content.split(/\r?\n/);
      lines.forEach((line, idx) => {
        const todoMatch = line.match(TODO_REGEX);
        if (todoMatch) {
          const [, tag, rest] = todoMatch;
          const excerpt = line.trim();
          const evidenceId = generateEvidenceId(repoRoot, relPath, idx + 1, excerpt);
          const evidenceDoc = {
            type: "file",
            title: `${tag} marker`
          };
          evidence.push({ evidenceId, evidenceDoc });
          findings.push({
            category: tag.toLowerCase(),
            filePath: relPath,
            line: idx + 1,
            excerpt,
            severity: "medium",
            confidence: 0.9,
            detectionMethod: "regex",
            explanation: `Found ${tag} marker in code.`,
            suggestedAction: "Review and implement or remove the marker.",
            evidenceId,
          });
        } else if (NOT_IMPL_REGEX.test(line)) {
          const excerpt = line.trim();
          const evidenceId = generateEvidenceId(repoRoot, relPath, idx + 1, excerpt);
          const evidenceDoc = { type: "file", title: "Not‑implemented marker" };
          evidence.push({ evidenceId, evidenceDoc });
          findings.push({
            category: "partial",
            filePath: relPath,
            line: idx + 1,
            excerpt,
            severity: "high",
            confidence: 0.95,
            detectionMethod: "regex",
            explanation: "Potential unfinished implementation detected.",
            suggestedAction: "Complete the implementation or remove placeholder.",
            evidenceId,
          });
        } else if (SKIPPED_TEST_REGEX.test(line)) {
          const excerpt = line.trim();
          const evidenceId = generateEvidenceId(repoRoot, relPath, idx + 1, excerpt);
          evidence.push({ evidenceId, evidenceDoc: { type: "file", title: "Skipped test" } });
          findings.push({
            category: "skipped_test",
            filePath: relPath,
            line: idx + 1,
            excerpt,
            severity: "low",
            confidence: 0.85,
            detectionMethod: "regex",
            explanation: "Test appears to be deliberately skipped.",
            suggestedAction: "Investigate why the test is skipped; enable if appropriate.",
            evidenceId,
          });
        }
      });
    }
  }
  return { findings, evidence };
}

export async function scanUnfinishedWork(repoPath) {
  const { findings, evidence } = await walk(repoPath, repoPath);
  return { findings, evidence };
}

export const unfinishedWorkScanner = { scanUnfinishedWork };
