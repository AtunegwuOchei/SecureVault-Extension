import { useCallback } from 'react';
import { PasswordEntry } from '@/types';

// In a real browser extension this would use the browser extension APIs
// For this demo, we're simulating the extension behavior

export function useExtensionMessaging() {
  /**
   * Gets the current active tab URL
   */
  const getCurrentTab = useCallback(async (): Promise<string> => {
    // Simulate getting the current tab URL
    // In a real extension, this would use browser.tabs.query or chrome.tabs.query
    const mockDomains = [
      'example.com', 
      'gmail.com', 
      'amazon.com', 
      'netflix.com', 
      'facebook.com'
    ];
    const randomIndex = Math.floor(Math.random() * mockDomains.length);
    return mockDomains[randomIndex];
  }, []);
  
  /**
   * Communicates with native app to fill credentials on a site
   */
  const autofillCredentials = useCallback(async (site: string, username: string, password: string): Promise<boolean> => {
    // Simulate autofill action
    // In a real extension, this would inject scripts into the active tab
    console.log(`Autofilling ${username} on ${site}`);
    return true;
  }, []);
  
  /**
   * Triggers sync with the native app
   */
  const triggerSync = useCallback(async (): Promise<void> => {
    // Simulate syncing with native app
    // In a real extension, this would use native messaging
    console.log('Syncing with native app');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
  }, []);
  
  /**
   * Gets credentials for a specific website from the native app
   */
  const getCredentialsForSite = useCallback(async (site: string): Promise<PasswordEntry | null> => {
    // Simulate getting credentials from native app
    // In a real extension, this would use native messaging
    
    // For demo purposes, return credentials for example.com
    if (site === 'example.com') {
      return {
        id: '1',
        website: 'example.com',
        username: 'john.doe@email.com',
        password: 'SecureP@ssw0rd',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    
    // For other sites, randomly decide if we have credentials
    const hasCredentials = Math.random() > 0.5;
    if (hasCredentials) {
      return {
        id: '2',
        website: site,
        username: `user@${site}`,
        password: 'AnotherP@ssw0rd',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    
    return null;
  }, []);
  
  /**
   * Gets recent passwords from the native app
   */
  const getRecentPasswords = useCallback(async (): Promise<PasswordEntry[]> => {
    // Simulate getting recent passwords from native app
    // In a real extension, this would use native messaging
    return [
      {
        id: '1',
        website: 'gmail.com',
        username: 'user@gmail.com',
        password: 'GmailP@ssw0rd',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        website: 'amazon.com',
        username: 'johndoe22',
        password: 'AmazonP@ssw0rd',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        website: 'netflix.com',
        username: 'john.doe@email.com',
        password: 'NetflixP@ssw0rd',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }, []);
  
  /**
   * Saves a new password to the native app
   */
  const savePassword = useCallback(async (entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<PasswordEntry> => {
    // Simulate saving password to native app
    // In a real extension, this would use native messaging
    console.log('Saving password for', entry.website);
    
    return {
      ...entry,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, []);

  return {
    getCurrentTab,
    autofillCredentials,
    triggerSync,
    getCredentialsForSite,
    getRecentPasswords,
    savePassword,
  };
}
