
/* import { db } from './db';
import { passwords, settings } from '@shared/schema';
import { eq } from 'drizzle-orm';

export const storage = {
  async getPasswordByWebsite(website: string) {
    try {
      const result = await db
        .select()
        .from(passwords)
        .where(eq(passwords.website, website))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('Error getting password by website:', error);
      return null;
    }
  },

  async getRecentPasswords() {
    try {
      const result = await db
        .select()
        .from(passwords)
        .orderBy(passwords.createdAt)
        .limit(10);
      
      return result;
    } catch (error) {
      console.error('Error getting recent passwords:', error);
      // Return empty array instead of throwing
      return [];
    }
  },

  async createPassword(data: typeof passwords.$inferInsert) {
    try {
      const result = await db
        .insert(passwords)
        .values({
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning();
      
      return result[0];
    } catch (error) {
      console.error('Error creating password:', error);
      throw new Error('Failed to create password');
    }
  },

  async updatePassword(id: number, data: Partial<typeof passwords.$inferInsert>) {
    try {
      const result = await db
        .update(passwords)
        .set({
          ...data,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(passwords.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error('Error updating password:', error);
      throw new Error('Failed to update password');
    }
  },

  async deletePassword(id: number) {
    try {
      await db
        .delete(passwords)
        .where(eq(passwords.id, id));
      
      return true;
    } catch (error) {
      console.error('Error deleting password:', error);
      throw new Error('Failed to delete password');
    }
  },

  async getSettings() {
    try {
      const result = await db
        .select()
        .from(settings)
        .limit(1);
      
      // Return default settings if none exist
      if (result.length === 0) {
        const defaultSettings = {
          autoFillOnPageLoad: true,
          autoLockTimeout: '5',
          biometricAuth: false,
          passwordSuggestions: true,
          defaultPasswordLength: '12',
          syncWithNativeApp: true,
          syncFrequency: 'daily',
          lastSynced: new Date().toISOString(),
        };
        
        // Create default settings
        const created = await db
          .insert(settings)
          .values(defaultSettings)
          .returning();
        
        return created[0];
      }
      
      return result[0];
    } catch (error) {
      console.error('Error getting settings:', error);
      // Return default settings on error
      return {
        id: 1,
        autoFillOnPageLoad: true,
        autoLockTimeout: '5',
        biometricAuth: false,
        passwordSuggestions: true,
        defaultPasswordLength: '12',
        syncWithNativeApp: true,
        syncFrequency: 'daily',
        lastSynced: new Date().toISOString(),
      };
    }
  },

  async updateSettings(data: typeof settings.$inferInsert) {
    try {
      // First check if settings exist
      const existing = await db
        .select()
        .from(settings)
        .limit(1);
      
      if (existing.length === 0) {
        // Create new settings
        const result = await db
          .insert(settings)
          .values(data)
          .returning();
        
        return result[0];
      } else {
        // Update existing settings
        const result = await db
          .update(settings)
          .set(data)
          .where(eq(settings.id, existing[0].id))
          .returning();
        
        return result[0];
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      throw new Error('Failed to update settings');
    }
  },
};
*/