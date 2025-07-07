// SecureVault Extension Background Script

// Ensure this API_BASE_URL matches your Replit project's external URL
// Example: 'https://your-replit-id.your-username.replit.dev/api'
const API_BASE_URL = 'https://411d76d3-1f86-4d42-9b6f-9db0e512fdcf-00-26t1rmmq2zd9x.spock.replit.dev/api';

// ALL PREVIOUS WEBSOCKET-RELATED CODE HAS BEEN REMOVED FROM THIS FILE.
// There should be no 'ws' variable, no 'connectWebSocket' function,
// and no call to 'connectWebSocket()' in this entire file.

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[Background] SecureVault Extension installed');
    chrome.storage.local.set({
      settings: {
        autoFillOnPageLoad: true,
        autoLockTimeout: '5',
        biometricAuth: false,
        passwordSuggestions: true,
        defaultPasswordLength: '12'
      },
      lastSync: new Date().toISOString(), // Initialize lastSync on install
      apiBaseUrl: API_BASE_URL
    });
  } else if (details.reason === 'update') {
    console.log('[Background] SecureVault Extension updated');
  }
});

async function makeAPIRequest(endpoint, options = {}) {
  console.log(`[Background] Making API request to: ${API_BASE_URL}${endpoint}`, options);
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
      credentials: 'include' // Ensure cookies are sent
    });
    // Handle 401 Unauthorized for all API requests
    if (response.status === 401) {
      console.warn('[Background] Authentication expired or unauthorized. Logging out...');
      chrome.storage.local.set({ isLoggedIn: false, userId: null, lastSync: null });
      // Optionally, notify popup or content scripts to update UI
      chrome.runtime.sendMessage({ action: 'loggedOut' });
      throw new Error('Unauthorized');
    }
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${response.statusText} - ${errorText}`);
    }
    const jsonResponse = await response.json();
    console.log(`[Background] API response from ${endpoint}:`, jsonResponse);
    return jsonResponse;
  } catch (error) {
    console.error(`[Background] API request error for ${endpoint}:`, error);
    throw error;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(`[Background] Message received: ${message.action}`, message);

  switch (message.action) {
    case 'getCurrentTab':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        sendResponse({ url: tabs?.[0]?.url || '', tabId: tabs?.[0]?.id || null });
      });
      return true; // Indicates that sendResponse will be called asynchronously

    case 'fillCredentials':
      console.log(`[Background] Sending fillCredentials to tab ${message.tabId}`);
      chrome.tabs.sendMessage(message.tabId, {
        action: 'fillCredentials',
        credentials: message.credentials
      });
      sendResponse({ success: true });
      break;

    case 'savePassword':
      makeAPIRequest('/passwords', {
        method: 'POST',
        body: JSON.stringify(message.data)
      }).then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'getPasswordsForSite':
      // message.url is already the hostname from content-script.js
      const hostname = message.url; 
      console.log(`[Background] Requesting passwords for site: ${hostname}`);
      // Use query parameter as per server/routes.ts update
      makeAPIRequest(`/extension/passwords?domain=${encodeURIComponent(hostname)}`)
        .then(result => {
          console.log(`[Background] Received passwords for ${hostname}:`, result);
          sendResponse({ success: true, data: result });
        })
        .catch(error => {
          console.error(`[Background] Failed to get passwords for ${hostname}:`, error);
          sendResponse({ success: false, error: error.message });
        });
      return true;

    case 'getRecentPasswords':
      makeAPIRequest('/passwords/recent')
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'getSettings':
      makeAPIRequest('/settings')
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'updateSettings':
      makeAPIRequest('/settings', {
        method: 'POST',
        body: JSON.stringify(message.settings)
      }).then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'syncData': // New message action to trigger manual sync from popup/options
      console.log('[Background] Manual syncData triggered.');
      syncData();
      sendResponse({ success: true });
      return true;

    case 'loginFormFound':
      console.log(`[Background] Login form found on: ${message.url}. Requesting credentials.`);
      // message.url is already the hostname from content-script.js
      const foundHostname = message.url;
      makeAPIRequest(`/extension/passwords?domain=${encodeURIComponent(foundHostname)}`)
        .then(result => {
          console.log(`[Background] Received credentials for autofill on ${foundHostname}:`, result);
          if (result && result.length > 0) {
            // Assuming the first match is the best one for autofill
            console.log(`[Background] Sending showAutofillNotification to tab ${sender.tab.id}`);
            chrome.tabs.sendMessage(sender.tab.id, {
              action: 'showAutofillNotification',
              credentials: result[0] // Send the first matching credential
            });
          } else {
            console.log(`[Background] No credentials found for ${foundHostname}.`);
          }
        }).catch(error => console.error(`[Background] Failed to get credentials for login form on ${foundHostname}:`, error));
      break; // No sendResponse needed as this is a fire-and-forget from content script
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log(`[Background] Tab updated: ${tab.url}`);
    chrome.storage.local.get(['settings'], (result) => {
      if (result.settings?.autoFillOnPageLoad) {
        console.log('[Background] Auto-fill on page load enabled. Checking for login form...');
        chrome.tabs.sendMessage(tabId, {
          action: 'checkForLoginForm',
          url: tab.url // Send full URL to content script, content script will extract hostname
        });
      }
    });
  }
});

// Removed the chrome.runtime.onMessage listener for 'loginFormFound' that was duplicated
// and moved its logic into the main onMessage listener's switch case.

chrome.alarms.create('autoLock', { periodInMinutes: 1 });
chrome.alarms.create('dataSync', { periodInMinutes: 15 }); // Create an alarm for data synchronization every 15 minutes

chrome.alarms.onAlarm.addListener((alarm) => {
  console.log(`[Background] Alarm triggered: ${alarm.name}`);
  if (alarm.name === 'autoLock') {
    chrome.storage.local.get(['lastActivity', 'settings'], (result) => {
      const lastActivityTime = new Date(result.lastActivity || '').getTime();
      const currentTime = Date.now();
      const timeout = parseInt(result.settings?.autoLockTimeout || '5', 10);
      if ((currentTime - lastActivityTime) / 60000 >= timeout) {
        chrome.storage.local.set({ isLocked: true });
        console.log('[Background] Extension locked due to inactivity.');
      }
    });
  } else if (alarm.name === 'dataSync') {
    syncData(); // Trigger data synchronization
  }
});

async function syncData() {
  chrome.storage.local.get(['lastSync'], async (result) => {
    const lastSyncTimestamp = result.lastSync || new Date(0).toISOString(); // Use epoch if no lastSync found
    console.log(`[Sync] Initiating data sync since: ${lastSyncTimestamp}`);
    try {
      const syncResponse = await makeAPIRequest('/extension/sync-data', {
        method: 'POST',
        body: JSON.stringify({ lastSyncTimestamp })
      });

      console.log('[Sync] Sync response:', syncResponse);

      const { updatedPasswords, updatedUserSettings, serverTime } = syncResponse;

      // Update passwords in local storage
      chrome.storage.local.get(['passwords'], (storageResult) => {
        const currentPasswords = storageResult.passwords || [];
        const newPasswordsMap = new Map(currentPasswords.map(p => [p.id, p]));

        updatedPasswords.forEach(p => {
          if (p.isDeleted) { // Assuming a 'isDeleted' flag for deleted items
            newPasswordsMap.delete(p.id);
          } else {
            newPasswordsMap.set(p.id, p);
          }
        });

        chrome.storage.local.set({ passwords: Array.from(newPasswordsMap.values()) }, () => {
          console.log(`[Sync] Updated ${updatedPasswords.length} passwords.`);
        });
      });

      // Update user settings in local storage if provided
      if (updatedUserSettings) {
        chrome.storage.local.set({ userSettings: updatedUserSettings }, () => {
          console.log('[Sync] Updated user settings.');
        });
      }

      // Store the new server time as the last sync timestamp
      chrome.storage.local.set({ lastSync: serverTime }, () => {
        console.log(`[Sync] Data synchronization complete. New lastSync: ${serverTime}`);
      });

      // Optionally, send a message to other parts of the extension (e.g., popup) to refresh data
      // This is the source of "Could not establish connection" if popup is closed.
      // It's generally harmless for core sync.
      chrome.runtime.sendMessage({ action: 'dataSynced' }).catch(err => {
          if (err.message === "Could not establish connection. Receiving end does not exist.") {
              console.warn("[Background] Popup not open to receive dataSynced message.");
          } else {
              console.error("[Background] Error sending dataSynced message:", err);
          }
      });

    } catch (error) {
      console.error('[Sync] Data synchronization failed:', error);
      // If error is 401 Unauthorized, makeAPIRequest already handles logout.
    }
  });
}

// Initial sync on startup
syncData();
