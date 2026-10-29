// src/services/ai/ollamaProvider.js
import fetch from "node-fetch";
import { env } from "../utils/env.js";
import { responseValidator } from "./responseValidator.js";

/**
 * OllamaProvider encapsulates communication with a locally‑running Ollama server.
 * All calls respect the configured timeout and size limits.
 */
export const ollamaProvider = {
  /**
   * Check whether the Ollama endpoint appears reachable.
   */
  async getStatus() {
    if (!env.OLLAMA_BASE_URL) {
      return { ok: false, error: "OLLAMA_BASE_URL not configured" };
    }
    try {
      const res = await fetch(`${env.OLLAMA_BASE_URL}/api/version`, { timeout: env.AI_TIMEOUT_MS });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return { ok: true, version: data.version };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },

  /**
   * Retrieve a list of models available on the Ollama server.
   */
  async listModels() {
    if (!env.OLLAMA_BASE_URL) return [];
    try {
      const res = await fetch(`${env.OLLAMA_BASE_URL}/api/tags`, { timeout: env.AI_TIMEOUT_MS });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { models } = await res.json();
      return models.map((m) => m.name);
    } catch {
      return [];
    }
  },

  /**
   * Send a prompt to Ollama and receive a structured response.
   * `evidence` should be an array of objects that will be injected into the prompt.
   */
  async generate({ prompt, evidence = [] }) {
    const base = env.OLLAMA_BASE_URL;
    const model = env.OLLAMA_MODEL || "llama2";
    if (!base) {
      throw new Error("OLLAMA_BASE_URL not configured");
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.AI_TIMEOUT_MS);
    const requestBody = {
      model,
      prompt,
      stream: false,
    };
    // The evidence is passed as a JSON block appended to the prompt – the model is instructed to use it.
    const fullPrompt = `${prompt}\n\n---BEGIN EVIDENCE---\n${JSON.stringify(evidence, null, 2)}\n---END EVIDENCE---`;
    requestBody.prompt = fullPrompt;
    try {
      const res = await fetch(`${base}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Ollama error ${res.status}: ${txt}`);
      }
      let text = await res.text();
      // Enforce size limit (default 64KB)
      const maxSize = 64 * 1024;
      if (text.length > maxSize) {
        text = text.slice(0, maxSize);
      }
      // Try to parse JSON – the model is instructed to output the contract.
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        // If parsing fails, wrap raw text as answer only.
        parsed = { answer: text };
      }
      // Validate the structure; throws if invalid.
      const valid = responseValidator.safeParse(parsed);
      if (!valid.success) {
        throw new Error(`Response validation failed: ${valid.error.message}`);
      }
      return valid.data;
    } catch (err) {
      // Normalise errors for callers.
      if (err.name === "AbortError") {
        throw new Error(`Ollama request timed out after ${env.AI_TIMEOUT_MS}ms`);
      }
      throw new Error(`Ollama provider error: ${err.message}`);
    }
  },
};
