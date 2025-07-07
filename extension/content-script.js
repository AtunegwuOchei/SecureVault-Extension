// SecureVault Extension Content Script

/**
 * This script scans pages for login forms, handles autofill and password save functionality,
 * and communicates securely with the extension background script.
 */

console.log('[Content Script] SecureVault Content script loaded.');

// Find login forms on the current page
function findLoginForms() {
  console.log('[Content Script] findLoginForms: Scanning for forms...');
  const forms = document.querySelectorAll('form');
  const loginForms = [];

  forms.forEach(form => {
    const passwordFields = form.querySelectorAll('input[type="password"]:not([disabled]):not([readonly])');
    if (passwordFields.length > 0) {
      console.log(`[Content Script] findLoginForms: Found form with password fields. Form:`, form);
      let usernameField = null;
      // Also include 'search' type for username fields, common for search bars that might be misused
      const inputFields = form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="search"], input:not([type])');

      for (const field of inputFields) {
        if (field.disabled || field.readOnly) continue;

        const id = (field.id || '').toLowerCase();
        const name = (field.name || '').toLowerCase();
        const className = (field.className || '').toLowerCase();
        const placeholder = (field.placeholder || '').toLowerCase();
        const label = getLabelForField(field);

        const identifiers = ['user', 'email', 'login', 'account', 'username', 'mail', 'signin', 'phone', 'mobile', 'tel'];

        const hasMatch = identifiers.some(keyword =>
          id.includes(keyword) ||
          name.includes(keyword) ||
          className.includes(keyword) ||
          placeholder.includes(keyword) ||
          label.includes(keyword)
        );

        if (hasMatch) {
          usernameField = field;
          console.log(`[Content Script] findLoginForms: Found potential username field:`, usernameField);
          break;
        }
      }

      if (!usernameField) {
        // Fallback: look for a text input before the password field
        const allInputs = Array.from(inputFields);
        const passwordIndex = Array.from(form.querySelectorAll('*')).indexOf(passwordFields[0]);

        for (const field of allInputs) {
          const index = Array.from(form.querySelectorAll('*')).indexOf(field);
          if (index < passwordIndex && isVisible(field)) {
            usernameField = field;
            console.log(`[Content Script] findLoginForms: Fallback: Found username field before password:`, usernameField);
            break;
          }
        }
      }

      if (usernameField && isVisible(usernameField) && isVisible(passwordFields[0])) {
        loginForms.push({ form, usernameField, passwordField: passwordFields[0] });
        console.log(`[Content Script] findLoginForms: Valid login form detected:`, { usernameField, passwordField: passwordFields[0] });
      } else {
        console.log(`[Content Script] findLoginForms: Form found but not valid for autofill (username or password field not visible/found):`, { usernameField, passwordField: passwordFields[0] });
      }
    }
  });
  console.log(`[Content Script] findLoginForms: Found ${loginForms.length} login forms.`);
  return loginForms;
}

function getLabelForField(field) {
  let label = '';
  if (field.id) {
    const el = document.querySelector(`label[for="${field.id}"]`);
    if (el) label = el.textContent || '';
  }
  const parentLabel = field.closest('label');
  if (parentLabel) label = parentLabel.textContent || '';
  if (!label && field.previousElementSibling) label = field.previousElementSibling.textContent || '';
  return label.toLowerCase();
}

function isVisible(el) {
  const style = window.getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && el.offsetWidth > 0 && el.offsetHeight > 0;
}

function fillCredentials({ username, password }) {
  console.log(`[Content Script] Attempting to fill credentials for username: ${username}`);
  const loginForms = findLoginForms();
  if (loginForms.length === 0) {
    console.warn('[Content Script] fillCredentials: No login forms found to fill.');
    return false;
  }

  const { usernameField, passwordField } = loginForms[0];

  usernameField.focus();
  usernameField.value = username;
  console.log(`[Content Script] Filled username field:`, usernameField);
  ['input', 'change', 'blur'].forEach(event => usernameField.dispatchEvent(new Event(event, { bubbles: true })));

  setTimeout(() => {
    passwordField.focus();
    passwordField.value = password;
    console.log(`[Content Script] Filled password field:`, passwordField);
    ['input', 'change', 'blur'].forEach(event => passwordField.dispatchEvent(new Event(event, { bubbles: true })));
    setTimeout(() => usernameField.focus(), 100); // Refocus username field after filling
  }, 100);

  console.log('[Content Script] Credentials filling initiated.');
  return true;
}

function setupPasswordChangeDetection() {
  console.log('[Content Script] Setting up password change detection...');
  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!form || form.tagName !== 'FORM') return;

    const passwordFields = form.querySelectorAll('input[type="password"]');
    const usernameField = form.querySelector('input[type="text"], input[type="email"], input:not([type])');
    const password = [...passwordFields].find(field => field.value)?.value;
    const username = usernameField?.value;

    if (password && username) {
      console.log('[Content Script] Submit event: Password and username found. Attempting to save.');
      const website = window.location.hostname;
      const data = { url: website, username, encryptedPassword: password }; // Ensure 'url' and 'encryptedPassword' match schema

      setTimeout(() => {
        // Double check hostname in case of redirects
        if (window.location.hostname === website) {
          console.log('[Content Script] Sending savePassword message to background:', data);
          chrome.runtime.sendMessage({ action: 'savePassword', data })
            .then(response => {
              if (response && response.success) {
                console.log('[Content Script] Password saved successfully:', response.data);
              } else {
                console.error('[Content Script] Failed to save password:', response?.error);
              }
            })
            .catch(err => console.error('[Content Script] Error sending savePassword message:', err));
        }
      }, 1000);
    }
  }, true); // Use capture phase to ensure this listener runs before others
}

function showAutofillNotification({ username, password }) {
  console.log('[Content Script] Showing autofill notification...');
  const existing = document.querySelector('.securevault-notification');
  if (existing) existing.remove();

  const box = document.createElement('div');
  box.className = 'securevault-notification';
  box.innerHTML = `
    <div style="position:fixed;top:20px;right:20px;background:#fff;border:2px solid #3F51B5;border-radius:8px;padding:16px;box-shadow:0 4px 20px rgba(0,0,0,0.15);z-index:999999;width:320px;font-family:sans-serif;animation:slideIn 0.3s ease-out;">
      <style>
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      </style>
      <div style="display:flex;align-items:center;margin-bottom:12px;">
        <div style="width:24px;height:24px;background:#3F51B5;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-right:12px;">
          <span style="color:#fff;font-weight:bold;font-size:14px;">🔐</span>
        </div>
        <div style="font-weight:600;color:#333;font-size:16px;">SecureVault</div>
      </div>
      <p style="margin:8px 0;font-size:14px;color:#666;line-height:1.4;">
        Autofill login credentials for <strong>${username}</strong>?
      </p>
      <div style="display:flex;justify-content:flex-end;margin-top:16px;gap:8px;">
        <button id="sv-autofill-no" style="background:#f5f5f5;border:1px solid #ddd;padding:8px 16px;border-radius:4px;cursor:pointer;font-size:14px;color:#666;">Not now</button>
        <button id="sv-autofill-yes" style="background:#3F51B5;color:white;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;font-size:14px;font-weight:500;">Autofill</button>
      </div>
    </div>
  `;

  document.body.appendChild(box);
  document.getElementById('sv-autofill-yes').addEventListener('click', () => {
    fillCredentials({ username, password });
    box.remove();
  });
  document.getElementById('sv-autofill-no').addEventListener('click', () => box.remove());
  setTimeout(() => {
    console.log('[Content Script] Autofill notification timed out.');
    box.remove();
  }, 15000);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(`[Content Script] Message received from background: ${message.action}`, message);
  try {
    if (message.action === 'fillCredentials') {
      const success = fillCredentials(message.credentials);
      sendResponse({ success });
    }
    if (message.action === 'checkForLoginForm') {
      console.log('[Content Script] Received checkForLoginForm. Running findLoginForms...');
      const found = findLoginForms().length > 0;
      if (found) {
        console.log(`[Content Script] Login form found. Sending loginFormFound message for ${window.location.hostname}.`);
        // Send hostname, not origin, for consistency
        chrome.runtime.sendMessage({ action: 'loginFormFound', url: window.location.hostname });
      } else {
        console.log('[Content Script] No login form found.');
      }
      sendResponse({ found });
    }
    if (message.action === 'showAutofillNotification') {
      showAutofillNotification(message.credentials);
      sendResponse({ success: true });
    }
  } catch (err) {
    console.error('[SecureVault] Content script error:', err);
    sendResponse({ success: false, error: err.message });
  }
  return true; // Indicates that sendResponse will be called asynchronously
});

(function initialize() {
  console.log('[Content Script] Initializing...');
  setupPasswordChangeDetection();

  const check = () => {
    console.log('[Content Script] Initial check for login forms...');
    const loginForms = findLoginForms();
    if (loginForms.length > 0) {
      console.log(`[Content Script] Login form(s) found on initial check. Sending loginFormFound message for ${window.location.hostname}.`);
      // Send hostname, not origin, for consistency
      chrome.runtime.sendMessage({ action: 'loginFormFound', url: window.location.hostname });
    } else {
      console.log('[Content Script] No login forms found on initial check.');
    }
  };

  // Use a slight delay to ensure DOM is fully ready and stable
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(check, 500));
  } else {
    setTimeout(check, 500);
  }

  // Observe DOM changes for dynamically loaded forms
  new MutationObserver((mutations) => {
    let formsAdded = false;
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.querySelector('form') || node.querySelector('input[type="password"]')) {
              formsAdded = true;
              break;
            }
          }
        }
      }
      if (formsAdded) break;
    }
    if (formsAdded) {
      console.log('[Content Script] DOM Mutation detected: New forms/password fields added. Re-checking...');
      setTimeout(check, 500); // Re-check after a short delay
    }
  }).observe(document.body, { childList: true, subtree: true });
})();
