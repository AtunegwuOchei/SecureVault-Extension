import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertPasswordSchema, insertSettingsSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get passwords for a site
  app.get("/api/passwords/site/:site", async (req, res) => {
    try {
      const site = req.params.site;
      const password = await storage.getPasswordByWebsite(site);
      res.json(password);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch password" });
    }
  });

  // Get recent passwords
  app.get("/api/passwords/recent", async (req, res) => {
    try {
      const passwords = await storage.getRecentPasswords();
      res.json(passwords);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent passwords" });
    }
  });

  // Add new password
  app.post("/api/passwords", async (req, res) => {
    try {
      const validatedData = insertPasswordSchema.parse(req.body);
      const password = await storage.createPassword(validatedData);
      res.status(201).json(password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid password data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create password" });
      }
    }
  });

  // Update password
  app.put("/api/passwords/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertPasswordSchema.parse(req.body);
      const password = await storage.updatePassword(id, validatedData);
      res.json(password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid password data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update password" });
      }
    }
  });

  // Delete password
  app.delete("/api/passwords/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePassword(id);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete password" });
    }
  });

  // Get settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Update settings
  app.post("/api/settings", async (req, res) => {
    try {
      const validatedData = insertSettingsSchema.parse(req.body);
      const settings = await storage.updateSettings(validatedData);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid settings data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update settings" });
      }
    }
  });

  // Auth routes
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

  const httpServer = createServer(app);

  return httpServer;
}
