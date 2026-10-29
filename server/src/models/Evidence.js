// src/models/Evidence.js
import mongoose from "mongoose";

const evidenceSchema = new mongoose.Schema(
  {
    investigationId: { type: mongoose.Schema.Types.ObjectId, ref: "Investigation", required: true },
    type: { type: String, enum: ["commit", "file", "documentation", "branch", "configuration", "test"], required: true },
    title: { type: String, required: true },
    sourcePath: { type: String },
    lineStart: { type: Number },
    lineEnd: { type: Number },
    commitHash: { type: String },
    excerpt: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
    confidence: { type: Number, min: 0, max: 1 },
    observedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model("Evidence", evidenceSchema);
