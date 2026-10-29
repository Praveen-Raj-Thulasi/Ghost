// src/server.js
import http from "http";
import app from "./app.js";
import { env } from "./utils/env.js";
import { connectMongo, closeMongo } from "./config/database.js";

let server;
let isShuttingDown = false;

const start = async () => {
  try {
    // If demo mode without DB is desired, allow skipping connection via env variable
    if (process.env.DEMO_MODE !== "true") {
      await connectMongo();
    } else {
      console.log("⚡ DEMO_MODE enabled – skipping MongoDB connection");
    }

    const port = env.PORT;
    server = http.createServer(app);
    server.listen(port, () => {
      console.log(`🚀 Server listening on http://localhost:${port}`);
    });
  } catch (err) {
    console.error("❌ Server failed to start:", err.message);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal) => {
  if (isShuttingDown) return; // prevent double calls
  isShuttingDown = true;
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully…`);
  if (server) {
    server.close((err) => {
      if (err) console.error("Error closing HTTP server:", err);
      else console.log("🛑 HTTP server closed");
    });
  }
  try {
    await closeMongo();
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

start();
