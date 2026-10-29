// src/config/database.js
import mongoose from "mongoose";
import { env } from "../utils/env.js"; // We'll create a simple env helper

const connectMongo = async () => {
  const uri = env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI not set in environment");
  }
  try {
    await mongoose.connect(uri, {
      // useNewUrlParser and useUnifiedTopology are defaults in Mongoose 7
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
    });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    throw err;
  }
};

// Graceful shutdown helper
const closeMongo = async () => {
  try {
    await mongoose.disconnect();
    console.log("🛑 MongoDB disconnected");
  } catch (e) {
    console.error("Error during MongoDB disconnect:", e);
  }
};

export { connectMongo, closeMongo };
