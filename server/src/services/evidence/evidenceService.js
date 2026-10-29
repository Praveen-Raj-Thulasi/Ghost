// src/services/evidence/evidenceService.js
import Evidence from "../../models/Evidence.js";

/**
 * Persist a collection of evidence objects.
 * `evidenceArray` should contain objects with the shape required by the Evidence model:
 *   {
 *     investigationId,
 *     type,
 *     title,
 *     sourcePath,
 *     lineStart,
 *     lineEnd,
 *     commitHash,
 *     excerpt,
 *     metadata,
 *     confidence,
 *   }
 */
export async function saveEvidence(evidenceArray) {
  if (!Array.isArray(evidenceArray) || evidenceArray.length === 0) return [];
  // Use insertMany for efficiency – it returns the created docs.
  const docs = await Evidence.insertMany(evidenceArray, { ordered: false }).catch((err) => {
    // If some docs fail validation we still want to surface the error.
    console.error("Evidence save error:", err);
    throw err;
  });
  return docs;
}

export const evidenceService = { saveEvidence };
