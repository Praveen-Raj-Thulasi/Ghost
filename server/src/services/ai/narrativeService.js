// src/services/ai/narrativeService.js
import Investigation from "../../models/Investigation.js";
import Evidence from "../../models/Evidence.js";
import { getAiProvider, isAiEnabled } from "./aiProvider.js";
import { responseValidator } from "./responseValidator.js";
import { env } from "../utils/env.js";

/**
 * Retrieve a limited set of evidence for an investigation, ordered by confidence.
 * This deterministic function ensures the same evidence set for identical inputs.
 */
async function getRelevantEvidence(investigationId, max = 10) {
  const evidenceDocs = await Evidence.find({ investigationId })
    .sort({ confidence: -1, createdAt: 1 })
    .limit(max)
    .lean();
  // Map to plain objects expected by providers (include id for reference)
  return evidenceDocs.map((doc) => ({
    id: doc._id.toString(),
    title: doc.title,
    type: doc.type,
    sourcePath: doc.sourcePath,
    lineStart: doc.lineStart,
    lineEnd: doc.lineEnd,
    commitHash: doc.commitHash,
    excerpt: doc.excerpt,
    confidence: doc.confidence ?? 1,
    metadata: doc.metadata,
  }));
}

/**
 * Core entry point for a user question about an investigation.
 * It loads the investigation, gathers evidence, delegates to the active AI provider
 * (or evidence‑only fallback), validates the structured response, and returns it.
 *
 * @param {string} investigationId – Mongo ObjectId string of the investigation.
 * @param {string} userPrompt – The natural‑language question from the UI.
 * @returns {Promise<Object>} – Validated AI response matching AiResponseSchema.
 */
export async function answerQuestion({ investigationId, userPrompt }) {
  // Load investigation to ensure it exists and is accessible.
  const investigation = await Investigation.findById(investigationId).lean();
  if (!investigation) {
    throw new Error(`Investigation ${investigationId} not found`);
  }

  // Retrieve relevant evidence (deterministic ranking).
  const evidence = await getRelevantEvidence(investigationId, env.MAX_EVIDENCE_CONTEXT || 10);

  // Choose provider.
  const provider = getAiProvider();
  if (!provider) {
    // AI disabled – fall back to evidenceOnlyProvider if available.
    const { evidenceOnlyProvider } = await import("./evidenceOnlyProvider.js");
    return evidenceOnlyProvider.generate({ prompt: userPrompt, evidence });
  }

  // Generate response via provider (Ollama or custom).
  const rawResponse = await provider.generate({ prompt: userPrompt, evidence });

  // Validate response against schema – responseValidator is a Zod schema.
  const validation = responseValidator.safeParse(rawResponse);
  if (!validation.success) {
    throw new Error(`AI response validation error: ${validation.error.message}`);
  }

  return validation.data;
}

export const narrativeService = { answerQuestion };
