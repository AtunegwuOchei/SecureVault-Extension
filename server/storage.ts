import { 
  users, type User, type InsertUser,
  passwords, type Password, type InsertPassword,
  settings, type Settings, type InsertSettings
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Password methods
  getPassword(id: number): Promise<Password | undefined>;
  getPasswordByWebsite(website: string): Promise<Password | undefined>;
  getRecentPasswords(): Promise<Password[]>;
  createPassword(password: InsertPassword): Promise<Password>;
  updatePassword(id: number, password: InsertPassword): Promise<Password>;
  deletePassword(id: number): Promise<void>;
  
  // Settings methods
  getSettings(): Promise<Settings | undefined>;
  updateSettings(settings: InsertSettings): Promise<Settings>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private passwords: Map<number, Password>;
  private settingsMap: Map<number, Settings>;
  private userIdCounter: number;
  private passwordIdCounter: number;
  private settingsIdCounter: number;

  constructor() {
    this.users = new Map();
    this.passwords = new Map();
    this.settingsMap = new Map();
    this.userIdCounter = 1;
    this.passwordIdCounter = 1;
    this.settingsIdCounter = 1;
    
    // Add some demo data
    this.initializeDemoData();
  }
  
  private initializeDemoData() {
    // Create a demo user
    const demoUser: User = {
      id: this.userIdCounter++,
      username: "demo",
      password: "password",
      email: "demo@example.com",
    };
    this.users.set(demoUser.id, demoUser);
    
    // Create some demo passwords
    const websites = ["example.com", "gmail.com", "amazon.com", "netflix.com"];
    websites.forEach(website => {
      const password: Password = {
        id: this.passwordIdCounter++,
        userId: demoUser.id,
        website,
        username: website === "amazon.com" ? "johndoe22" : "john.doe@email.com",
        password: `Secure${website.charAt(0).toUpperCase()}@ssw0rd`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.passwords.set(password.id, password);
    });
    
    // Create demo settings
    const demoSettings: Settings = {
      id: this.settingsIdCounter++,
      userId: demoUser.id,
      extensionSettings: {
        autoFillOnPageLoad: true,
        autoLockTimeout: "15",
        biometricAuth: true,
        passwordSuggestions: true,
        defaultPasswordLength: "16",
      },
      syncSettings: {
        syncWithNativeApp: true,
        syncFrequency: "realtime",
        lastSynced: new Date().toISOString(),
      },
      updatedAt: new Date(),
    };
    this.settingsMap.set(demoSettings.id, demoSettings);
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
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Password methods
  async getPassword(id: number): Promise<Password | undefined> {
    return this.passwords.get(id);
  }
  
  async getPasswordByWebsite(website: string): Promise<Password | undefined> {
    return Array.from(this.passwords.values()).find(
      (password) => password.website === website,
    );
  }
  
  async getRecentPasswords(): Promise<Password[]> {
    return Array.from(this.passwords.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 5);
  }
  
  async createPassword(insertPassword: InsertPassword): Promise<Password> {
    const id = this.passwordIdCounter++;
    const now = new Date();
    const password: Password = { 
      ...insertPassword, 
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.passwords.set(id, password);
    return password;
  }
  
  async updatePassword(id: number, insertPassword: InsertPassword): Promise<Password> {
    const existingPassword = this.passwords.get(id);
    if (!existingPassword) {
      throw new Error(`Password with id ${id} not found`);
    }
    
    const updatedPassword: Password = {
      ...existingPassword,
      ...insertPassword,
      updatedAt: new Date(),
    };
    
    this.passwords.set(id, updatedPassword);
    return updatedPassword;
  }
  
  async deletePassword(id: number): Promise<void> {
    this.passwords.delete(id);
  }
  
  // Settings methods
  async getSettings(): Promise<Settings | undefined> {
    // For demo purposes, just return the first settings
    return Array.from(this.settingsMap.values())[0];
  }
  
  async updateSettings(insertSettings: InsertSettings): Promise<Settings> {
    let settings = Array.from(this.settingsMap.values()).find(
      (s) => s.userId === insertSettings.userId,
    );
    
    if (settings) {
      // Update existing settings
      const updatedSettings: Settings = {
        ...settings,
        ...insertSettings,
        updatedAt: new Date(),
      };
      this.settingsMap.set(settings.id, updatedSettings);
      return updatedSettings;
    } else {
      // Create new settings
      const id = this.settingsIdCounter++;
      settings = { 
        ...insertSettings, 
        id,
        updatedAt: new Date(),
      };
      this.settingsMap.set(id, settings);
      return settings;
    }
  }
}

export const storage = new MemStorage();
