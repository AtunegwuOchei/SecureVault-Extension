
import { useCallback } from 'react';
import { PasswordEntry } from '@/types';

declare global {
  interface Window {
    chrome?: {
      runtime?: {
        sendMessage: (message: any, callback?: (response: any) => void) => void;
      };
    };
  }
}

export function useExtensionMessaging() {
  const isExtensionContext = useCallback(() => {
    return typeof window !== 'undefined' && 
           window.chrome && 
           window.chrome.runtime && 
           window.chrome.runtime.sendMessage;
  }, []);

  /**
   * Gets the current active tab URL
   */
  const getCurrentTab = useCallback(async (): Promise<string> => {
    if (!isExtensionContext()) {
      // Fallback for web app context
      return window.location.hostname;
    }

    return new Promise((resolve) => {
      window.chrome!.runtime!.sendMessage(
        { action: 'getCurrentTab' },
        (response) => {
          if (response && response.url) {
            try {
              const hostname = new URL(response.url).hostname;
              resolve(hostname);
            } catch {
              resolve('unknown-site.com');
            }
          } else {
            resolve('unknown-site.com');
          }
        }
      );
    });
  }, [isExtensionContext]);
  
  /**
   * Communicates with native app to fill credentials on a site
   */
  const autofillCredentials = useCallback(async (site: string, username: string, password: string): Promise<boolean> => {
    if (!isExtensionContext()) {
      console.log(`Would autofill ${username} on ${site} (not in extension context)`);
      return true;
    }

    return new Promise((resolve) => {
      window.chrome!.runtime!.sendMessage(
        { 
          action: 'fillCredentials',
          credentials: { username, password },
          tabId: null // Will be handled by background script
        },
        (response) => {
          resolve(response?.success || false);
        }
      );
    });
  }, [isExtensionContext]);
  
  /**
   * Triggers sync with the native app
   */
  const triggerSync = useCallback(async (): Promise<void> => {
    console.log('Triggering sync...');
    await new Promise(resolve => setTimeout(resolve, 500));
  }, []);
  
  /**
   * Gets credentials for a specific website from the native app
   */
  const getCredentialsForSite = useCallback(async (site: string): Promise<PasswordEntry | null> => {
    if (!isExtensionContext()) {
      // Fallback mock data for web app
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
      return null;
    }

    return new Promise((resolve) => {
      window.chrome!.runtime!.sendMessage(
        { 
          action: 'getPasswordsForSite',
          url: `https://${site}`
        },
        (response) => {
          if (response?.success && response.data) {
            resolve(response.data);
          } else {
            resolve(null);
          }
        }
      );
    });
  }, [isExtensionContext]);
  
  /**
   * Gets recent passwords from the native app
   */
  const getRecentPasswords = useCallback(async (): Promise<PasswordEntry[]> => {
    if (!isExtensionContext()) {
      // Fallback mock data for web app
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
      ];
    }

    return new Promise((resolve) => {
      window.chrome!.runtime!.sendMessage(
        { action: 'getRecentPasswords' },
        (response) => {
          if (response?.success && response.data) {
            resolve(Array.isArray(response.data) ? response.data : []);
          } else {
            resolve([]);
          }
        }
      );
    });
  }, [isExtensionContext]);
  
  /**
   * Saves a new password to the native app
   */
  const savePassword = useCallback(async (entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<PasswordEntry> => {
    if (!isExtensionContext()) {
      // Fallback for web app context
      console.log('Saving password for', entry.website);
      return {
        ...entry,
        id: Math.random().toString(36).substring(2, 9),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return new Promise((resolve, reject) => {
      window.chrome!.runtime!.sendMessage(
        { 
          action: 'savePassword',
          data: entry
        },
        (response) => {
          if (response?.success) {
            resolve({
              ...entry,
              id: response.data?.id || Math.random().toString(36).substring(2, 9),
              createdAt: response.data?.createdAt || new Date().toISOString(),
              updatedAt: response.data?.updatedAt || new Date().toISOString(),
            });
          } else {
            reject(new Error(response?.error || 'Failed to save password'));
          }
        }
      );
    });
  }, [isExtensionContext]);

  return {
    getCurrentTab,
    autofillCredentials,
    triggerSync,
    getCredentialsForSite,
    getRecentPasswords,
    savePassword,
    isExtensionContext: isExtensionContext(),
  };
}
