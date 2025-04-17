import { users, profiles, settings, type User, type InsertUser, type Profile, type InsertProfile, type Settings, type InsertSettings, type UpdateProfile } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import fs from "fs";
import path from "path";

const MemoryStore = createMemoryStore(session);

// Interface for storage operations
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Profile methods
  getProfiles(userId: number): Promise<Profile[]>;
  getProfile(id: number): Promise<Profile | undefined>;
  getProfileByLabel(label: string, userId: number): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(id: number, profile: UpdateProfile): Promise<Profile>;
  deleteProfile(id: number): Promise<void>;

  // Settings methods
  getSettings(userId: number): Promise<Settings | undefined>;
  createSettings(settings: InsertSettings): Promise<Settings>;
  updateSettings(id: number, settings: Partial<InsertSettings>): Promise<Settings>;

  sessionStore: session.SessionStore;

  // Data persistence
  saveData(): Promise<void>;
  loadData(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private profiles: Map<number, Profile>;
  private settingsMap: Map<number, Settings>;
  private userCurrentId: number;
  private profileCurrentId: number;
  private settingsCurrentId: number;
  sessionStore: session.SessionStore;
  private dataDirectory: string;
  private dataFilePath: string;

  constructor() {
    this.users = new Map();
    this.profiles = new Map();
    this.settingsMap = new Map();
    this.userCurrentId = 1;
    this.profileCurrentId = 1;
    this.settingsCurrentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });

    // Set up data directory for persistent storage
    const appDir = path.join(process.env.APPDATA || process.env.HOME || __dirname, 'whatsapp-manager');
    this.dataDirectory = appDir;
    this.dataFilePath = path.join(appDir, 'data.json');
    
    // Ensure directory exists
    if (!fs.existsSync(appDir)) {
      fs.mkdirSync(appDir, { recursive: true });
    }

    // Load data on initialization
    this.loadData().catch(err => console.error('Failed to load data:', err));
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    await this.saveData();
    return user;
  }

  // Profile methods
  async getProfiles(userId: number): Promise<Profile[]> {
    return Array.from(this.profiles.values()).filter(
      (profile) => profile.userId === userId
    );
  }

  async getProfile(id: number): Promise<Profile | undefined> {
    return this.profiles.get(id);
  }

  async getProfileByLabel(label: string, userId: number): Promise<Profile | undefined> {
    return Array.from(this.profiles.values()).find(
      (profile) => profile.label === label && profile.userId === userId
    );
  }

  async createProfile(insertProfile: InsertProfile): Promise<Profile> {
    const id = this.profileCurrentId++;
    const createdAt = new Date().toISOString();
    const profile: Profile = { ...insertProfile, id, status: 'disconnected', createdAt, sessionData: null, lastActive: null };
    this.profiles.set(id, profile);
    await this.saveData();
    return profile;
  }

  async updateProfile(id: number, updateData: UpdateProfile): Promise<Profile> {
    const profile = await this.getProfile(id);
    if (!profile) {
      throw new Error(`Profile with ID ${id} not found`);
    }

    const updatedProfile: Profile = { ...profile, ...updateData };
    this.profiles.set(id, updatedProfile);
    await this.saveData();
    return updatedProfile;
  }

  async deleteProfile(id: number): Promise<void> {
    const profile = await this.getProfile(id);
    if (!profile) {
      throw new Error(`Profile with ID ${id} not found`);
    }

    this.profiles.delete(id);
    await this.saveData();
  }

  // Settings methods
  async getSettings(userId: number): Promise<Settings | undefined> {
    return Array.from(this.settingsMap.values()).find(
      (settings) => settings.userId === userId
    );
  }

  async createSettings(insertSettings: InsertSettings): Promise<Settings> {
    const id = this.settingsCurrentId++;
    const settings: Settings = { ...insertSettings, id };
    this.settingsMap.set(id, settings);
    await this.saveData();
    return settings;
  }

  async updateSettings(id: number, updateData: Partial<InsertSettings>): Promise<Settings> {
    const settings = this.settingsMap.get(id);
    if (!settings) {
      throw new Error(`Settings with ID ${id} not found`);
    }

    const updatedSettings: Settings = { ...settings, ...updateData };
    this.settingsMap.set(id, updatedSettings);
    await this.saveData();
    return updatedSettings;
  }

  // Data persistence
  async saveData(): Promise<void> {
    const data = {
      users: Array.from(this.users.values()),
      profiles: Array.from(this.profiles.values()),
      settings: Array.from(this.settingsMap.values()),
      counters: {
        userCurrentId: this.userCurrentId,
        profileCurrentId: this.profileCurrentId,
        settingsCurrentId: this.settingsCurrentId
      }
    };

    try {
      await fs.promises.writeFile(this.dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving data:', error);
      throw error;
    }
  }

  async loadData(): Promise<void> {
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const fileData = await fs.promises.readFile(this.dataFilePath, 'utf8');
        const data = JSON.parse(fileData);
        
        // Clear existing data
        this.users.clear();
        this.profiles.clear();
        this.settingsMap.clear();
        
        // Load users
        if (data.users && Array.isArray(data.users)) {
          data.users.forEach((user: User) => {
            this.users.set(user.id, user);
          });
        }
        
        // Load profiles
        if (data.profiles && Array.isArray(data.profiles)) {
          data.profiles.forEach((profile: Profile) => {
            this.profiles.set(profile.id, profile);
          });
        }
        
        // Load settings
        if (data.settings && Array.isArray(data.settings)) {
          data.settings.forEach((setting: Settings) => {
            this.settingsMap.set(setting.id, setting);
          });
        }
        
        // Update counters
        if (data.counters) {
          this.userCurrentId = data.counters.userCurrentId || 1;
          this.profileCurrentId = data.counters.profileCurrentId || 1;
          this.settingsCurrentId = data.counters.settingsCurrentId || 1;
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Continue with empty data if load fails
    }
  }
}

export const storage = new MemStorage();
