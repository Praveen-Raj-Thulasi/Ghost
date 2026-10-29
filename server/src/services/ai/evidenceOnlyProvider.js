// src/services/ai/evidenceOnlyProvider.js
import { responseValidator } from "./responseValidator.js";

/**
 * Provider that returns a deterministic, evidence‑only response.
 * It never calls an LLM – useful when AI is disabled or unavailable.
 * The contract matches the same shape as the Ollama provider.
 */
export const evidenceOnlyProvider = {
  async generate({ prompt, evidence = [] }) {
    // Simple deterministic answer: list evidence titles.
    const evidenceList = evidence.map((e, i) => `#${i + 1} ${e.title || "(untitled)"}`).join("\n");
    const answer = `Based on the supplied evidence, the following items are relevant:\n${evidenceList}`;

    const response = {
      answer,
      claims: evidence.map((e) => ({
        text: e.title || "(no title)",
        evidenceIds: [e.id],
        kind: "observation",
        confidence: e.confidence ?? 1,
      })),
      uncertainties: [],
      suggestedNextSteps: [],
    };

    // Validate structure – will throw if invalid.
    const valid = responseValidator.safeParse(response);
    if (!valid.success) {
      throw new Error(`Evidence‑only response validation failed: ${valid.error.message}`);
    }
    return valid.data;
  },
};
