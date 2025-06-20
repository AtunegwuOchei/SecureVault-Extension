
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { sql } from "drizzle-orm";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_rJ0c6vnBQHIV@ep-patient-hat-abrzz4ri-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require",
});

const db = drizzle({ client: pool });

async function setupDatabase() {
  try {
    console.log("Setting up database tables...");
    
    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT
      )
    `);
    
    // Create passwords table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS passwords (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL DEFAULT 1,
        website TEXT NOT NULL,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    
    // Create settings table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL DEFAULT 1,
        extension_settings JSONB NOT NULL DEFAULT '{}',
        sync_settings JSONB NOT NULL DEFAULT '{}',
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    
    // Insert a default user if none exists
    const existingUser = await db.execute(sql`SELECT id FROM users LIMIT 1`);
    if (existingUser.rows.length === 0) {
      await db.execute(sql`
        INSERT INTO users (username, password, email) 
        VALUES ('demo_user', 'password', 'demo@example.com')
      `);
      console.log("Created default user");
    }
    
    // Insert default settings if none exist
    const existingSettings = await db.execute(sql`SELECT id FROM settings LIMIT 1`);
    if (existingSettings.rows.length === 0) {
      await db.execute(sql`
        INSERT INTO settings (user_id, extension_settings, sync_settings) 
        VALUES (
          1, 
          '{"autoFillOnPageLoad": true, "passwordSuggestions": true, "defaultPasswordLength": "12"}',
          '{"syncWithNativeApp": true, "syncFrequency": "daily"}'
        )
      `);
      console.log("Created default settings");
    }
    
    console.log("Database setup completed successfully!");
    
  } catch (error) {
    console.error("Error setting up database:", error);
  } finally {
    await pool.end();
  }
}

setupDatabase();
