import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { WhatsAppManager } from "./whatsapp";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Set up authentication
  setupAuth(app);
  
  // Initialize WhatsApp manager
  const whatsAppManager = new WhatsAppManager(httpServer);
  
  // Get profiles
  app.get("/api/profiles", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const profiles = await storage.getProfiles(req.user.id);
      
      // Enrich profiles with session status
      const enrichedProfiles = profiles.map(profile => {
        const session = whatsAppManager.getSessionStatus(profile.id);
        return {
          ...profile,
          sessionStatus: session ? session.status : 'unknown'
        };
      });
      
      res.json(enrichedProfiles);
    } catch (error) {
      next(error);
    }
  });
  
  // Create profile
  app.post("/api/profiles", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const profileData = {
        ...req.body,
        userId: req.user.id
      };
      
      const profile = await storage.createProfile(profileData);
      res.status(201).json(profile);
    } catch (error) {
      next(error);
    }
  });
  
  // Update profile
  app.patch("/api/profiles/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const profileId = parseInt(req.params.id);
      const profile = await storage.getProfile(profileId);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      if (profile.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedProfile = await storage.updateProfile(profileId, req.body);
      res.json(updatedProfile);
    } catch (error) {
      next(error);
    }
  });
  
  // Delete profile
  app.delete("/api/profiles/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const profileId = parseInt(req.params.id);
      const profile = await storage.getProfile(profileId);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      if (profile.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Destroy WhatsApp client if exists
      await whatsAppManager.destroyClient(profileId);
      
      // Delete profile from storage
      await storage.deleteProfile(profileId);
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
  
  // Initialize WhatsApp for a profile
  app.post("/api/profiles/:id/connect", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const profileId = parseInt(req.params.id);
      const profile = await storage.getProfile(profileId);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      if (profile.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await whatsAppManager.initializeProfile(profile);
      
      res.json({ message: "Initializing WhatsApp client" });
    } catch (error) {
      next(error);
    }
  });
  
  // Reconnect WhatsApp for a profile
  app.post("/api/profiles/:id/reconnect", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const profileId = parseInt(req.params.id);
      const profile = await storage.getProfile(profileId);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      if (profile.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await whatsAppManager.reconnectProfile(profileId);
      
      res.json({ message: "Reconnecting WhatsApp client" });
    } catch (error) {
      next(error);
    }
  });
  
  // Get profile sessions status
  app.get("/api/sessions", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const sessions = whatsAppManager.getAllSessions();
      
      // Only return sessions for user's profiles
      const userProfiles = await storage.getProfiles(req.user.id);
      const userProfileIds = new Set(userProfiles.map(p => p.id));
      
      const filteredSessions = sessions.filter(session => 
        userProfileIds.has(session.profileId)
      );
      
      res.json(filteredSessions);
    } catch (error) {
      next(error);
    }
  });
  
  // Send WhatsApp message
  app.post("/api/profiles/:id/send", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const profileId = parseInt(req.params.id);
      const profile = await storage.getProfile(profileId);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      if (profile.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { to, message } = req.body;
      
      if (!to || !message) {
        return res.status(400).json({ message: "Missing required fields: to, message" });
      }
      
      const messageId = await whatsAppManager.sendMessage(profileId, to, message);
      
      res.json({ 
        success: true, 
        messageId,
        to,
        message
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Direct URL for sending messages
  app.get("/send", async (req, res, next) => {
    try {
      const { from, to, message, user, pass } = req.query;
      
      if (!from || !to || !message) {
        return res.status(400).send(`
          <html>
            <head><title>Error</title></head>
            <body>
              <h1>Error: Missing Parameters</h1>
              <p>Required parameters: from, to, message</p>
              <p>Optional parameters: user, pass (if authentication is enabled)</p>
            </body>
          </html>
        `);
      }
      
      // Check authentication if required
      const settings = await storage.getSettings(1); // Get first user's settings for auth check
      
      if (settings && settings.username && settings.password) {
        if (!user || !pass || user !== settings.username || pass !== settings.password) {
          return res.status(401).send(`
            <html>
              <head><title>Authentication Error</title></head>
              <body>
                <h1>Authentication Error</h1>
                <p>Invalid username or password</p>
              </body>
            </html>
          `);
        }
      }
      
      // Find profile by label
      const profiles = await storage.getProfiles(1); // Use first user's profiles
      const profile = profiles.find(p => p.label === from);
      
      if (!profile) {
        return res.status(404).send(`
          <html>
            <head><title>Profile Not Found</title></head>
            <body>
              <h1>Profile Not Found</h1>
              <p>No profile found with label: ${from}</p>
            </body>
          </html>
        `);
      }
      
      try {
        const messageId = await whatsAppManager.sendMessage(
          profile.id, 
          to as string, 
          message as string
        );
        
        return res.send(`
          <html>
            <head><title>Message Sent</title></head>
            <body>
              <h1>Message Sent Successfully</h1>
              <p>From: ${from}</p>
              <p>To: ${to}</p>
              <p>Message ID: ${messageId}</p>
            </body>
          </html>
        `);
      } catch (error) {
        return res.status(500).send(`
          <html>
            <head><title>Error</title></head>
            <body>
              <h1>Error Sending Message</h1>
              <p>${(error as Error).message}</p>
            </body>
          </html>
        `);
      }
    } catch (error) {
      next(error);
    }
  });
  
  // Get settings
  app.get("/api/settings", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      let settings = await storage.getSettings(req.user.id);
      
      if (!settings) {
        // Create default settings if none exist
        settings = await storage.createSettings({
          port: 85,
          username: "",
          password: "",
          browserPath: "",
          userId: req.user.id
        });
      }
      
      res.json(settings);
    } catch (error) {
      next(error);
    }
  });
  
  // Update settings
  app.patch("/api/settings/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const settingsId = parseInt(req.params.id);
      const settings = await storage.getSettings(req.user.id);
      
      if (!settings || settings.id !== settingsId) {
        return res.status(404).json({ message: "Settings not found" });
      }
      
      const updatedSettings = await storage.updateSettings(settingsId, req.body);
      res.json(updatedSettings);
    } catch (error) {
      next(error);
    }
  });

  // Initialize all saved profiles for the authenticated user on startup
  app.get("/api/initialize-all-profiles", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      await whatsAppManager.initializeAllSavedProfiles(req.user.id);
      
      res.json({ message: "Initializing all saved profiles" });
    } catch (error) {
      next(error);
    }
  });
  
  return httpServer;
}
