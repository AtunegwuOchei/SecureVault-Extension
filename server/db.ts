
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { passwords, settings } from '@shared/schema';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';

const sqlite = new Database('database.sqlite');

export const db = drizzle(sqlite);

// Create tables if they don't exist
try {
  // Create passwords table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS passwords (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      website TEXT NOT NULL,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  // Create settings table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      autoFillOnPageLoad INTEGER DEFAULT 1,
      autoLockTimeout TEXT DEFAULT '5',
      biometricAuth INTEGER DEFAULT 0,
      passwordSuggestions INTEGER DEFAULT 1,
      defaultPasswordLength TEXT DEFAULT '12',
      syncWithNativeApp INTEGER DEFAULT 1,
      syncFrequency TEXT DEFAULT 'daily',
      lastSynced TEXT
    )
  `);

  console.log('Database tables initialized successfully');
} catch (error) {
  console.error('Error initializing database:', error);
}
