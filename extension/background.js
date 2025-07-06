// SecureVault Extension Background Script

const API_BASE_URL = 'https://411d76d3-1f86-4d42-9b6f-9db0e512fdcf-00-26t1rmmq2zd9x.spock.replit.dev/api';
const WS_URL = 'wss://411d76d3-1f86-4d42-9b6f-9db0e512fdcf-00-26t1rmmq2zd9x.spock.replit.dev/ws';

let ws;

function connectWebSocket() {
  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log('[WS] Connected to SecureVault backend');
    ws.send(JSON.stringify({ type: 'extension_connected' }));
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('[WS] Message from backend:', data);
  };

  ws.onclose = () => {
    console.warn('[WS] Disconnected. Reconnecting in 5s...');
    setTimeout(connectWebSocket, 5000);
  };

  ws.onerror = (err) => {
    console.error('[WS] Error:', err);
    ws.close();
  };
}

connectWebSocket();

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('SecureVault Extension installed');
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
    console.log('SecureVault Extension updated');
  }
});

async function makeAPIRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
      credentials: 'include' // Ensure cookies are sent
    });
    // Handle 401 Unauthorized for all API requests
    if (response.status === 401) {
      console.warn('Authentication expired or unauthorized. Logging out...');
      chrome.storage.local.set({ isLoggedIn: false, userId: null, lastSync: null });
      // Optionally, notify popup or content scripts to update UI
      chrome.runtime.sendMessage({ action: 'loggedOut' });
      throw new Error('Unauthorized');
    }
    if (!response.ok) throw new Error(`API request failed: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'getCurrentTab':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        sendResponse({ url: tabs?.[0]?.url || '', tabId: tabs?.[0]?.id || null });
      });
      return true;

    case 'fillCredentials':
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
      const hostname = new URL(message.url).hostname;
      makeAPIRequest(`/passwords/site/${encodeURIComponent(hostname)}`)
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
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
      syncData();
      sendResponse({ success: true });
      return true;
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    chrome.storage.local.get(['settings'], (result) => {
      if (result.settings?.autoFillOnPageLoad) {
        chrome.tabs.sendMessage(tabId, {
          action: 'checkForLoginForm',
          url: tab.url
        });
      }
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === 'loginFormFound') {
    const hostname = new URL(message.url).hostname;
    makeAPIRequest(`/passwords/site/${encodeURIComponent(hostname)}`)
      .then(result => {
        if (result) {
          chrome.tabs.sendMessage(sender.tab.id, {
            action: 'showAutofillNotification',
            credentials: result
          });
        }
      }).catch(error => console.error('Failed to get credentials:', error));
  }
});

chrome.alarms.create('autoLock', { periodInMinutes: 1 });
chrome.alarms.create('dataSync', { periodInMinutes: 15 }); // Create an alarm for data synchronization every 15 minutes

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'autoLock') {
    chrome.storage.local.get(['lastActivity', 'settings'], (result) => {
      const lastActivityTime = new Date(result.lastActivity || '').getTime();
      const currentTime = Date.now();
      const timeout = parseInt(result.settings?.autoLockTimeout || '5', 10);
      if ((currentTime - lastActivityTime) / 60000 >= timeout) {
        chrome.storage.local.set({ isLocked: true });
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
      chrome.runtime.sendMessage({ action: 'dataSynced' });

    } catch (error) {
      console.error('[Sync] Data synchronization failed:', error);
      // If error is 401 Unauthorized, makeAPIRequest already handles logout.
    }
  });
}

// Initial sync on startup
syncData();