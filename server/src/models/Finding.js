// src/models/Finding.js
import mongoose from "mongoose";

const findingSchema = new mongoose.Schema(
  {
    investigationId: { type: mongoose.Schema.Types.ObjectId, ref: "Investigation", required: true },
    title: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "todo",
        "fixme",
        "partial",
        "unmerged_branch",
        "doc_mismatch",
        "skipped_test",
        "config_issue",
        "historical_anomaly",
        "other"
      ],
      required: true
    },
    severity: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    confidence: { type: Number, min: 0, max: 1 },
    description: { type: String },
    evidenceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Evidence" }],
    suggestedAction: { type: String },
    status: { type: String, enum: ["open", "reviewed", "dismissed", "resolved"], default: "open" },
    dismissalReason: { type: String },
    notes: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model("Finding", findingSchema);
