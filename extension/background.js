// SecureKeeper Extension Background Script

// Listen for installation or update events
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // First time installation
    console.log('SecureKeeper Extension installed');
    
    // Set default settings
    chrome.storage.local.set({
      'settings': {
        autoFillOnPageLoad: true,
        autoLockTimeout: '5',
        biometricAuth: false,
        passwordSuggestions: true,
        defaultPasswordLength: '12'
      },
      'lastSync': new Date().toISOString()
    });
  } else if (details.reason === 'update') {
    console.log('SecureKeeper Extension updated');
  }
});

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
  }
  
  if (message.action === 'savePassword') {
    // Store the password securely and sync with native app
    console.log('Saving password for:', message.data.website);
    // In a real implementation, this would securely store the data
    // and communicate with the native app
    sendResponse({ success: true });
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

// Set up alarm for auto-lock timeout
chrome.alarms.create('autoLock', { periodInMinutes: 5 });

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