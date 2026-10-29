// src/analyzer.js
import { resolveLocalRepository } from "../server/src/services/git/repositoryService.js";
import { getProjectMetadata } from "../server/src/services/analysis/projectMetadata.js";
import { getCommits } from "../server/src/services/git/commitService.js";
import { scanUnfinishedWork } from "../server/src/services/analysis/unfinishedWorkScanner.js";
import { analyzeActivity } from "../server/src/services/analysis/activityAnalyzer.js";
import { generateEvidenceId } from "../server/src/services/git/repositoryService.js";
import { z } from "zod";

// Schema for the exported report
const ReportSchema = z.object({
  schemaVersion: z.string().default("1.0"),
  generatedAt: z.string().datetime(),
  repositoryMetadata: z.object({}).passthrough(),
  analysisProfile: z.enum(["quick", "standard", "deep"]).default("standard"),
  commits: z.array(z.object({}).passthrough()),
  findings: z.array(
    z.object({
      category: z.string(),
      severity: z.string(),
      confidence: z.number(),
      description: z.string(),
      evidence: z.object({
        type: z.string(),
        title: z.string(),
        sourcePath: z.string().nullable(),
        lineStart: z.number().nullable(),
        lineEnd: z.number().nullable(),
        commitHash: z.string().nullable(),
        excerpt: z.string().nullable(),
        confidence: z.number(),
      }),
    })
  ),
  activity: z.object({}).passthrough(),
  analyzerVersion: z.string().default("0.1.0"),
});

/**
 * Perform a full analysis of a local repository without persisting to DB.
 * Returns a plain JS object that matches ReportSchema.
 */
export async function analyzeLocalRepository({ repoPath, profile = "standard", maxCommits = undefined }) {
  // Resolve and verify repository
  const absRepo = await resolveLocalRepository(repoPath);

  // 1️⃣ Metadata
  const metadata = await getProjectMetadata(absRepo);

  // 2️⃣ Commits (respect env MAX_COMMITS if not overridden)
  const commitOpts = {};
  if (maxCommits) commitOpts.max = Number(maxCommits);
  const commits = await getCommits(absRepo, commitOpts);

  // 3️⃣ Activity analysis
  const activity = analyzeActivity(commits);

  // 4️⃣ Unfinished‑work scan (findings + evidence)
  const { findings, evidence } = await scanUnfinishedWork(absRepo);

  // Assemble findings with deterministic evidence IDs
  const findingsWithEvidence = findings.map((f, idx) => {
    const ev = evidence[idx];
    const evidenceId = generateEvidenceId(ev.evidenceDoc.type, ev.evidenceDoc.title, ev.evidenceDoc.sourcePath ?? "");
    return {
      category: f.category,
      severity: f.severity,
      confidence: f.confidence,
      description: f.explanation,
      evidence: {
        ...ev.evidenceDoc,
        confidence: ev.evidenceDoc.confidence ?? 0.9,
        // Expose deterministic ID (optional for import)
        id: evidenceId,
      },
    };
  });

  return ReportSchema.parse({
    schemaVersion: "1.0",
    generatedAt: new Date().toISOString(),
    repositoryMetadata: metadata,
    analysisProfile: profile,
    commits,
    findings: findingsWithEvidence,
    activity,
    analyzerVersion: "0.1.0",
  });
}

export { ReportSchema };
