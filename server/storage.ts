import { 
  users, type User, type InsertUser,
  passwords, type Password, type InsertPassword,
  settings, type Settings, type InsertSettings
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Interface for storage operations
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

// Database implementation of storage
export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Password methods
  async getPassword(id: number): Promise<Password | undefined> {
    const [password] = await db.select().from(passwords).where(eq(passwords.id, id));
    return password;
  }
  
  async getPasswordByWebsite(website: string): Promise<Password | undefined> {
    const [password] = await db.select().from(passwords).where(eq(passwords.website, website));
    return password;
  }
  
  async getRecentPasswords(): Promise<Password[]> {
    const recentPasswords = await db
      .select()
      .from(passwords)
      .orderBy(passwords.updatedAt)
      .limit(5);
    return recentPasswords.reverse(); // Show newest first
  }
  
  async createPassword(insertPassword: InsertPassword): Promise<Password> {
    const [password] = await db
      .insert(passwords)
      .values(insertPassword)
      .returning();
    return password;
  }
  
  async updatePassword(id: number, insertPassword: InsertPassword): Promise<Password> {
    const [updatedPassword] = await db
      .update(passwords)
      .set({
        ...insertPassword,
        updatedAt: new Date()
      })
      .where(eq(passwords.id, id))
      .returning();
    
    if (!updatedPassword) {
      throw new Error(`Password with id ${id} not found`);
    }
    
    return updatedPassword;
  }
  
  async deletePassword(id: number): Promise<void> {
    await db.delete(passwords).where(eq(passwords.id, id));
  }
  
  // Settings methods
  async getSettings(): Promise<Settings | undefined> {
    const [settingsData] = await db.select().from(settings).limit(1);
    return settingsData;
  }
  
  async updateSettings(insertSettings: InsertSettings): Promise<Settings> {
    // Check if settings exist for this user
    const [existingSettings] = await db
      .select()
      .from(settings)
      .where(eq(settings.userId, insertSettings.userId));
    
    if (existingSettings) {
      // Update existing settings
      const [updatedSettings] = await db
        .update(settings)
        .set({
          ...insertSettings,
          updatedAt: new Date()
        })
        .where(eq(settings.id, existingSettings.id))
        .returning();
      return updatedSettings;
    } else {
      // Create new settings
      const [newSettings] = await db
        .insert(settings)
        .values(insertSettings)
        .returning();
      return newSettings;
    }
  }
}

export const storage = new DatabaseStorage();
