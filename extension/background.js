
// SecureVault Extension Background Script

const API_BASE_URL = 'https://411d76d3-1f86-4d42-9b6f-9db0e512fdcf-00-26t1rmmq2zd9x.spock.replit.dev/api';

// Listen for installation or update events
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // First time installation
    console.log('SecureVault Extension installed');
    
    // Set default settings
    chrome.storage.local.set({
      'settings': {
        autoFillOnPageLoad: true,
        autoLockTimeout: '5',
        biometricAuth: false,
        passwordSuggestions: true,
        defaultPasswordLength: '12'
      },
      'lastSync': new Date().toISOString(),
      'apiBaseUrl': API_BASE_URL
    });
  } else if (details.reason === 'update') {
    console.log('SecureVault Extension updated');
  }
});

// API helper functions
async function makeAPIRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getCurrentTab') {
    // Get the current active tab URL
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        sendResponse({ url: tabs[0].url, tabId: tabs[0].id });
      } else {
        sendResponse({ url: '', tabId: null });
      }
    });
    return true; // Required for async response
  }
  
  if (message.action === 'fillCredentials') {
    // Send credentials to the content script for autofill
    chrome.tabs.sendMessage(message.tabId, {
      action: 'fillCredentials',
      credentials: message.credentials
    });
    sendResponse({ success: true });
  }
  
  if (message.action === 'savePassword') {
    // Store the password securely via API
    console.log('Saving password for:', message.data.website);
    
    makeAPIRequest('/passwords', {
      method: 'POST',
      body: JSON.stringify({
        website: message.data.website,
        username: message.data.username,
        password: message.data.password
      })
    }).then(result => {
      sendResponse({ success: true, data: result });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    
    return true;
  }
  
  if (message.action === 'getPasswordsForSite') {
    const hostname = new URL(message.url).hostname;
    
    makeAPIRequest(`/passwords/site/${encodeURIComponent(hostname)}`)
      .then(result => {
        sendResponse({ success: true, data: result });
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    
    return true;
  }
  
  if (message.action === 'getRecentPasswords') {
    makeAPIRequest('/passwords/recent')
      .then(result => {
        sendResponse({ success: true, data: result });
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    
    return true;
  }
  
  if (message.action === 'getSettings') {
    makeAPIRequest('/settings')
      .then(result => {
        sendResponse({ success: true, data: result });
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    
    return true;
  }
  
  if (message.action === 'updateSettings') {
    makeAPIRequest('/settings', {
      method: 'POST',
      body: JSON.stringify(message.settings)
    }).then(result => {
      sendResponse({ success: true, data: result });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    
    return true;
  }
});

// Check for page loads to offer autofill
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Get settings to check if autofill is enabled
    chrome.storage.local.get(['settings'], (result) => {
      const settings = result.settings || {};
      
      if (settings.autoFillOnPageLoad) {
        // Check if we have credentials for this site
        chrome.tabs.sendMessage(tabId, {
          action: 'checkForLoginForm',
          url: tab.url
        });
      }
    });
  }
});

// Handle login form detection from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'loginFormFound') {
    // Check if we have credentials for this site
    const hostname = new URL(message.url).hostname;
    
    makeAPIRequest(`/passwords/site/${encodeURIComponent(hostname)}`)
      .then(result => {
        if (result) {
          // Send autofill notification to content script
          chrome.tabs.sendMessage(sender.tab.id, {
            action: 'showAutofillNotification',
            credentials: result
          });
        }
      }).catch(error => {
        console.error('Failed to get credentials for site:', error);
      });
  }
});

// Set up alarm for auto-lock timeout
chrome.alarms.create('autoLock', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'autoLock') {
    // Check last activity time and lock if needed
    chrome.storage.local.get(['lastActivity', 'settings'], (result) => {
      const lastActivity = result.lastActivity || new Date().toISOString();
      const settings = result.settings || {};
      const autoLockTimeout = parseInt(settings.autoLockTimeout || '5', 10);
      
      const lastActivityTime = new Date(lastActivity).getTime();
      const currentTime = new Date().getTime();
      const timeDiff = (currentTime - lastActivityTime) / (1000 * 60); // in minutes
      
      if (timeDiff >= autoLockTimeout) {
        // Lock the extension
        chrome.storage.local.set({ 'isLocked': true });
      }
    });
  }
});
