// src/models/Job.js
import mongoose from "mongoose";

const JobSchema = new mongoose.Schema(
  {
    investigationId: { type: mongoose.Schema.Types.ObjectId, ref: "Investigation", required: true },
    status: {
      type: String,
      enum: ["queued", "collecting", "analyzing", "persisting", "completed", "failed", "canceled"],
      default: "queued",
    },
    progressMessage: { type: String, default: "" },
    progressData: { type: mongoose.Schema.Types.Mixed, default: {} }, // e.g., {processed:3,total:10}
    error: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Job", JobSchema);
