// src/models/Investigation.js
import mongoose from "mongoose";

/**
 * Core investigation record.
 * Fields are deliberately flexible – we store raw JSON blobs for metadata and commit
 * snapshots so the timeline endpoint can serve them without re‑reading the repo.
 */
const investigationSchema = new mongoose.Schema(
  {
    // Human‑readable title – optional; if omitted we fall back to the repository URL.
    name: { type: String, default: null },
    // Source info – either a local path or a remote HTTPS URL.
    source: { type: String, required: true },
    sourceType: { type: String, enum: ["local", "remote"], required: true },
    // Optional explicit labels for UI display.
    repositoryUrl: { type: String },
    localRepositoryLabel: { type: String },
    // Flexible JSON captured after the repository is inspected.
    repositoryMetadata: { type: mongoose.Schema.Types.Mixed },
    // Full commit‑log snapshot (array of objects) used by the /timeline endpoint.
    commitsSnapshot: { type: [mongoose.Schema.Types.Mixed], default: [] },
    analysisProfile: { type: String, enum: ["quick", "standard", "deep"], default: "standard" },
    status: {
      type: String,
      enum: ["queued", "collecting", "analyzing", "persisting", "completed", "failed", "canceled"],
      default: "queued",
    },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    startedAt: { type: Date },
    completedAt: { type: Date },
    lastError: { type: String },
    analyzedCommitCount: { type: Number, default: 0 },
    findingCount: { type: Number, default: 0 },
    evidenceCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Investigation", investigationSchema);
