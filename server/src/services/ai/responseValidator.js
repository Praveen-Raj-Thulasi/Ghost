// src/services/ai/responseValidator.js
import { z } from "zod";

/**
 * Zod schema that defines the contract for AI responses.
 * All providers must return an object that matches this schema.
 */
export const AiResponseSchema = z.object({
  answer: z.string(),
  claims: z.array(
    z.object({
      text: z.string(),
      evidenceIds: z.array(z.string()).nonempty(),
      kind: z.enum(["observation", "inference", "hypothesis"]),
      confidence: z.number().min(0).max(1),
    })
  ),
  uncertainties: z.array(z.string()),
  suggestedNextSteps: z.array(z.string()),
});

// Export a Zod validator object that can be used with safeParse
export const responseValidator = AiResponseSchema;
