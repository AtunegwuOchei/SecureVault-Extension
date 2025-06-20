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
      lastSync: new Date().toISOString(),
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
      ...options
    });
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
  }
});
