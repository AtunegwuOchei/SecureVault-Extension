// SecureVault Extension Content Script

/**
 * This script scans pages for login forms, handles autofill and password save functionality,
 * and communicates securely with the extension background script.
 */

// Find login forms on the current page
function findLoginForms() {
  const forms = document.querySelectorAll('form');
  const loginForms = [];

  forms.forEach(form => {
    const passwordFields = form.querySelectorAll('input[type="password"]:not([disabled]):not([readonly])');
    if (passwordFields.length > 0) {
      let usernameField = null;
      const inputFields = form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input:not([type])');

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
          break;
        }
      }

      if (!usernameField) {
        const allInputs = Array.from(inputFields);
        const passwordIndex = Array.from(form.querySelectorAll('*')).indexOf(passwordFields[0]);

        for (const field of allInputs) {
          const index = Array.from(form.querySelectorAll('*')).indexOf(field);
          if (index < passwordIndex && isVisible(field)) {
            usernameField = field;
            break;
          }
        }
      }

      if (usernameField && isVisible(usernameField) && isVisible(passwordFields[0])) {
        loginForms.push({ form, usernameField, passwordField: passwordFields[0] });
      }
    }
  });

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
  const loginForms = findLoginForms();
  if (loginForms.length === 0) return false;

  const { usernameField, passwordField } = loginForms[0];

  usernameField.focus();
  usernameField.value = username;
  ['input', 'change', 'blur'].forEach(event => usernameField.dispatchEvent(new Event(event, { bubbles: true })));

  setTimeout(() => {
    passwordField.focus();
    passwordField.value = password;
    ['input', 'change', 'blur'].forEach(event => passwordField.dispatchEvent(new Event(event, { bubbles: true })));
    setTimeout(() => usernameField.focus(), 100);
  }, 100);

  return true;
}

function setupPasswordChangeDetection() {
  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!form || form.tagName !== 'FORM') return;

    const passwordFields = form.querySelectorAll('input[type="password"]');
    const usernameField = form.querySelector('input[type="text"], input[type="email"], input:not([type])');
    const password = [...passwordFields].find(field => field.value)?.value;
    const username = usernameField?.value;

    if (password && username) {
      const website = window.location.hostname;
      const data = { website, username, password };

      setTimeout(() => {
        if (window.location.hostname === website) {
          chrome.runtime.sendMessage({ action: 'savePassword', data });
        }
      }, 1000);
    }
  }, true);
}

function showAutofillNotification({ username, password }) {
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
  setTimeout(() => box.remove(), 15000);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (message.action === 'fillCredentials') {
      const success = fillCredentials(message.credentials);
      sendResponse({ success });
    }
    if (message.action === 'checkForLoginForm') {
      const found = findLoginForms().length > 0;
      if (found) {
        chrome.runtime.sendMessage({ action: 'loginFormFound', url: window.location.origin });
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
  return true;
});

(function initialize() {
  console.log('[SecureVault] Content script loaded');
  setupPasswordChangeDetection();

  const check = () => {
    if (findLoginForms().length > 0) {
      chrome.runtime.sendMessage({ action: 'loginFormFound', url: window.location.origin });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', check);
  } else {
    check();
  }

  new MutationObserver((mutations) => {
    if (mutations.some(m => [...m.addedNodes].some(node => node.nodeType === Node.ELEMENT_NODE && (node.querySelector?.('form') || node.querySelector?.('input[type="password"]'))))) {
      setTimeout(check, 500);
    }
  }).observe(document.body, { childList: true, subtree: true });
})();
