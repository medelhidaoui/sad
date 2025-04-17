import { Client } from 'whatsapp-web.js';
import { WebSocketServer } from 'ws';
import { Server } from 'http';
import path from 'path';
import fs from 'fs';
import { Profile, WhatsAppSession } from '@shared/schema';
import { storage } from './storage';

export class WhatsAppManager {
  private wss: WebSocketServer;
  private clients: Map<number, Client> = new Map();
  private sessions: Map<number, WhatsAppSession> = new Map();
  private sessionDirectory: string;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    
    // Set up session directory in user's app data folder
    const appDir = path.join(process.env.APPDATA || process.env.HOME || __dirname, 'whatsapp-manager', 'sessions');
    this.sessionDirectory = appDir;
    
    if (!fs.existsSync(appDir)) {
      fs.mkdirSync(appDir, { recursive: true });
    }
    
    this.setupWebSocket();
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws) => {
      console.log('WebSocket client connected');
      
      // Send current sessions data
      const sessionsArray = Array.from(this.sessions.values());
      ws.send(JSON.stringify({ type: 'sessions', data: sessionsArray }));
      
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());
          
          if (data.type === 'reconnect') {
            const profileId = data.profileId;
            await this.reconnectProfile(profileId);
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      });
      
      ws.on('close', () => {
        console.log('WebSocket client disconnected');
      });
    });
  }

  private broadcastSessionUpdate(session: WhatsAppSession) {
    this.sessions.set(session.profileId, session);
    
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ 
          type: 'session-update', 
          data: session 
        }));
      }
    });
  }

  async initializeProfile(profile: Profile): Promise<string | null> {
    const profileId = profile.id;
    
    // Check if client already exists
    if (this.clients.has(profileId)) {
      return null;
    }
    
    const sessionDir = path.join(this.sessionDirectory, `profile-${profileId}`);
    
    // Initialize the client with puppeteer options
    const client = new Client({
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      }
    });
    
    // Create session object
    const session: WhatsAppSession = {
      profileId,
      status: 'initializing'
    };
    
    this.sessions.set(profileId, session);
    this.broadcastSessionUpdate(session);
    
    // Set up event listeners
    client.on('qr', (qr) => {
      console.log(`QR Code received for profile ${profileId}`);
      session.qrCode = qr;
      session.status = 'qr_ready';
      this.broadcastSessionUpdate(session);
    });
    
    client.on('ready', async () => {
      console.log(`Client for profile ${profileId} is ready`);
      session.status = 'connected';
      session.qrCode = undefined;
      this.broadcastSessionUpdate(session);
      
      // Update profile status in storage
      await storage.updateProfile(profileId, { 
        label: profile.label,
        status: 'connected',
        lastActive: new Date().toISOString()
      });
    });
    
    client.on('authenticated', () => {
      console.log(`Client for profile ${profileId} authenticated`);
      session.status = 'authenticated';
      this.broadcastSessionUpdate(session);
    });
    
    client.on('auth_failure', async (msg) => {
      console.error(`Authentication failure for profile ${profileId}:`, msg);
      session.status = 'disconnected';
      session.qrCode = undefined;
      this.broadcastSessionUpdate(session);
      
      // Update profile status in storage
      await storage.updateProfile(profileId, { 
        label: profile.label,
        status: 'disconnected'
      });
      
      // Remove client
      this.clients.delete(profileId);
    });
    
    client.on('disconnected', async () => {
      console.log(`Client for profile ${profileId} disconnected`);
      session.status = 'disconnected';
      session.qrCode = undefined;
      this.broadcastSessionUpdate(session);
      
      // Update profile status in storage
      await storage.updateProfile(profileId, { 
        label: profile.label,
        status: 'disconnected'
      });
      
      // Remove client
      this.clients.delete(profileId);
    });
    
    // Initialize client
    try {
      this.clients.set(profileId, client);
      await client.initialize();
      
      // Return the QR code if available
      return session.qrCode || null;
    } catch (error) {
      console.error(`Error initializing WhatsApp client for profile ${profileId}:`, error);
      session.status = 'error';
      this.broadcastSessionUpdate(session);
      this.clients.delete(profileId);
      
      // Update profile status in storage
      await storage.updateProfile(profileId, { 
        label: profile.label,
        status: 'error'
      });
      
      throw error;
    }
  }

  async reconnectProfile(profileId: number): Promise<string | null> {
    const profile = await storage.getProfile(profileId);
    if (!profile) {
      throw new Error(`Profile with ID ${profileId} not found`);
    }
    
    // If client exists, destroy it first
    if (this.clients.has(profileId)) {
      const client = this.clients.get(profileId);
      try {
        await client?.destroy();
      } catch (error) {
        console.error(`Error destroying WhatsApp client for profile ${profileId}:`, error);
      }
      this.clients.delete(profileId);
    }
    
    // Initialize new client
    return this.initializeProfile(profile);
  }

  async sendMessage(profileId: number, to: string, message: string): Promise<string> {
    const client = this.clients.get(profileId);
    if (!client) {
      throw new Error('WhatsApp client not found or not initialized');
    }
    
    // Get profile to use for update
    const profile = await storage.getProfile(profileId);
    if (!profile) {
      throw new Error(`Profile with ID ${profileId} not found`);
    }
    
    // Format number
    let formattedNumber = to.replace(/\D/g, '');
    
    // Make sure it has the @ suffix for WhatsApp
    if (!formattedNumber.includes('@c.us')) {
      formattedNumber = `${formattedNumber}@c.us`;
    }
    
    try {
      // Check if number exists on WhatsApp
      const isRegistered = await client.isRegisteredUser(formattedNumber);
      if (!isRegistered) {
        throw new Error(`The number ${to} is not registered on WhatsApp`);
      }
      
      // Send message
      const response = await client.sendMessage(formattedNumber, message);
      
      // Update last active
      await storage.updateProfile(profileId, {
        label: profile.label,
        lastActive: new Date().toISOString()
      });
      
      return response.id._serialized;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }

  async destroyClient(profileId: number): Promise<void> {
    const client = this.clients.get(profileId);
    if (client) {
      try {
        await client.destroy();
        this.clients.delete(profileId);
        
        const session = this.sessions.get(profileId);
        if (session) {
          session.status = 'disconnected';
          session.qrCode = undefined;
          this.broadcastSessionUpdate(session);
        }
        
        // Get profile for update
        const profile = await storage.getProfile(profileId);
        if (profile) {
          // Update profile status in storage
          await storage.updateProfile(profileId, { 
            label: profile.label,
            status: 'disconnected'
          });
        }
      } catch (error) {
        console.error(`Error destroying WhatsApp client for profile ${profileId}:`, error);
        throw error;
      }
    }
  }

  async initializeAllSavedProfiles(userId: number): Promise<void> {
    const profiles = await storage.getProfiles(userId);
    
    for (const profile of profiles) {
      try {
        if (profile.sessionData) {
          console.log(`Auto-connecting profile: ${profile.label}`);
          await this.initializeProfile(profile);
        }
      } catch (error) {
        console.error(`Error auto-connecting profile ${profile.id}:`, error);
      }
    }
  }

  getSessionStatus(profileId: number): WhatsAppSession | undefined {
    return this.sessions.get(profileId);
  }

  getAllSessions(): WhatsAppSession[] {
    return Array.from(this.sessions.values());
  }
}
