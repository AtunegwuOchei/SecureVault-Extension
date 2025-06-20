import type { Express } from "express";
import { createServer, type Server } from "http";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth route (still needed for extension to log in to web app)
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    // Simple mock auth for development
    if (password === "password") {
      res.json({ success: true, token: "demo_token" });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // WebSocket-friendly status check route
  app.get("/api/ping", (_req, res) => {
    res.json({ status: "SecureVault API is running" });
  });

  const httpServer = createServer(app);
  return httpServer;
}
