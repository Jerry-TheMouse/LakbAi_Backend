import 'dotenv/config'; // This MUST be the very first line!
import express from "express";
import cors from "cors"; 
import path from "path";
import { fileURLToPath } from "url";
import apiRoutes from './server/routes.js';
import { connectDB } from './server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  // Uses environment PORT if available, otherwise defaults to 3000
  const PORT = process.env.PORT || 3000;

  console.log("Starting LakbAi server...");

  // Connect to MongoDB
  await connectDB();

  // CORS Middleware
  app.use(cors());

  // Middleware to parse incoming JSON payloads
  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.use("/api", apiRoutes);

  // Health check route for Render (replaces the old Vite/static file logic)
  app.get("/", (req, res) => {
    res.status(200).json({ 
      status: "success", 
      message: "LakbAi Backend API is running successfully." 
    });
  });

  // Catch-all route to handle 404s gracefully
  app.get("*", (req, res) => {
    res.status(404).json({ 
      error: "Route not found. Please use the /api endpoints." 
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LakbAi Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});