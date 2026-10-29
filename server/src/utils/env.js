// src/utils/env.js
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: ".env" }); // loads .env in project root (server dir)

const envSchema = z.object({
  PORT: z.string().regex(/^\d+$/).transform(Number).default("5000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  MONGODB_URI: z.string().url().nonempty(),
  CLIENT_ORIGIN: z.string().url().nonempty(),
  AI_ENABLED: z.enum(["true", "false"]).default("false"),
  AI_PROVIDER: z.string().default("none"),
  OLLAMA_BASE_URL: z.string().url().optional(),
  OLLAMA_MODEL: z.string().optional(),
  AI_TIMEOUT_MS: z.string().regex(/^\d+$/).transform(Number).default("30000"),
  MAX_COMMITS: z.string().regex(/^\d+$/).transform(Number).default("1000"),
  MAX_REPOSITORY_SIZE_MB: z.string().regex(/^\d+$/).transform(Number).default("200"),
  ANALYSIS_CONCURRENCY: z.string().regex(/^\d+$/).transform(Number).default("1")
});

export const env = envSchema.parse(process.env);
