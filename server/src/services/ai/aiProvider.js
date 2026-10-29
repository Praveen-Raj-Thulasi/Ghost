// src/services/ai/aiProvider.js
import { env } from "../utils/env.js";
import { ollamaProvider } from "./ollamaProvider.js";
import { evidenceOnlyProvider } from "./evidenceOnlyProvider.js";

/**
 * Factory that returns the active AI provider based on server configuration.
 * Supported providers:
 *   - "ollama": local Ollama model via HTTP API
 *   - "evidenceOnly": bypass AI, return evidence‑only responses
 *   - any other value or "none": disables AI (returns null provider)
 */
export function getAiProvider() {
  const providerName = (env.AI_PROVIDER || "none").toLowerCase();
  switch (providerName) {
    case "ollama":
      return ollamaProvider;
    case "evidenceonly":
    case "evidence_only":
    case "evidence-only":
      return evidenceOnlyProvider;
    default:
      // No AI enabled – callers should handle null gracefully
      return null;
  }
}

export const isAiEnabled = env.AI_ENABLED === "true" && getAiProvider() !== null;
