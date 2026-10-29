// src/services/analysis/repositoryAnalyzer.js
import { resolveLocalRepository, cloneRepository } from "../git/repositoryService.js";
import { getProjectMetadata } from "./projectMetadata.js";
import { getCommits } from "../git/commitService.js";
import { scanUnfinishedWork } from "./unfinishedWorkScanner.js";
import { analyzeActivity } from "./activityAnalyzer.js";
import { saveEvidence } from "../../services/evidence/evidenceService.js";
import Finding from "../../models/Finding.js";
import Investigation from "../../models/Investigation.js";
import { env } from "../../utils/env.js";

/**
 * Core analysis orchestrator.
 * `source` can be either a local path or a remote HTTPS URL.
 * Returns an object containing metadata, commits, activity, findings and persisted evidence IDs.
 */
export async function analyzeRepository({ source, sourceType, investigationId }) {
  // Resolve the repository location safely
  let repoPath;
  if (sourceType === "local") {
    repoPath = await resolveLocalRepository(source);
  } else if (sourceType === "remote") {
    repoPath = await cloneRepository(source);
  } else {
    throw new Error("sourceType must be 'local' or 'remote'");
  }

  // 1️⃣ Gather repository‑level metadata
  const metadata = await getProjectMetadata(repoPath);

  // 2️⃣ Extract commits (respect MAX_COMMITS limit from env)
  const commits = await getCommits(repoPath);

  // 3️⃣ Activity heuristic analysis
  const activity = analyzeActivity(commits);

  // 4️⃣ Scan for unfinished‑work findings
  const { findings, evidence } = await scanUnfinishedWork(repoPath);

  // 5️⃣ Persist evidence documents
  const evidenceDocs = evidence.map((e) => ({
    investigationId,
    type: e.evidenceDoc.type,
    title: e.evidenceDoc.title,
    sourcePath: e.evidenceDoc.sourcePath || null,
    lineStart: e.evidenceDoc.lineStart || null,
    lineEnd: e.evidenceDoc.lineEnd || null,
    commitHash: e.evidenceDoc.commitHash || null,
    excerpt: e.evidenceDoc.excerpt || null,
    metadata: {},
    confidence: e.evidenceDoc.confidence || 0.9,
  }));
  const persistedEvidence = await saveEvidence(evidenceDocs);

  // 6️⃣ Persist findings, linking to evidence IDs
  const persistedFindings = [];
  for (const f of findings) {
    const ev = persistedEvidence.find((e) => e._id.toString() === f.evidenceId);
    const evidenceId = ev ? ev._id : null;
    const doc = await Finding.create({
      investigationId,
      title: `${f.category.toUpperCase()} in ${f.filePath}`,
      category: f.category,
      severity: f.severity,
      confidence: f.confidence,
      description: f.explanation,
      evidenceIds: evidenceId ? [evidenceId] : [],
      suggestedAction: f.suggestedAction,
    });
    persistedFindings.push(doc);
  }

  // 7️⃣ Update investigation record with summary info (if provided)
  await Investigation.findByIdAndUpdate(investigationId, {
    repositoryMetadata: metadata,
    analyzedCommitCount: commits.length,
    findingCount: persistedFindings.length,
    evidenceCount: persistedEvidence.length,
    status: "completed",
    completedAt: new Date(),
  });

  // Cleanup temporary repo if it was cloned remotely
  if (sourceType === "remote") {
    // Remove the temporary directory – best‑effort, ignore errors
    const { rm } = await import("fs/promises");
    await rm(repoPath, { recursive: true, force: true }).catch(() => {});
  }

  return {
    metadata,
    commits,
    activity,
    findings: persistedFindings,
    evidence: persistedEvidence,
  };
}

export const repositoryAnalyzer = { analyzeRepository };
