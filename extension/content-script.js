
// SecureVault Extension Content Script

// Identify login forms on the page
function findLoginForms() {
  const forms = document.querySelectorAll('form');
  const loginForms = [];

  forms.forEach(form => {
    // Check if the form has password fields
    const passwordFields = form.querySelectorAll('input[type="password"]:not([disabled]):not([readonly])');
    if (passwordFields.length > 0) {
      // Find username/email field (usually comes before password field)
      let usernameField = null;
      const inputFields = form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input:not([type])');
      
      for (const field of inputFields) {
        if (field.disabled || field.readOnly) continue;
        
        const fieldId = (field.id || '').toLowerCase();
        const fieldName = (field.name || '').toLowerCase();
        const fieldClass = (field.className || '').toLowerCase();
        const placeholder = (field.placeholder || '').toLowerCase();
        const label = getLabelForField(field);
        
        // Look for common username/email field identifiers
        const identifiers = [
          'user', 'email', 'login', 'account', 'username', 'mail',
          'signin', 'phone', 'mobile', 'tel'
        ];
        
        const hasIdentifier = identifiers.some(identifier => 
          fieldId.includes(identifier) || 
          fieldName.includes(identifier) ||
          fieldClass.includes(identifier) ||
          placeholder.includes(identifier) ||
          label.includes(identifier)
        );
        
        if (hasIdentifier) {
          usernameField = field;
          break;
        }
      }
      
      // If no username field found, take the first visible input field that comes before password
      if (!usernameField) {
        const allInputs = Array.from(form.querySelectorAll('input[type="text"], input[type="email"], input:not([type])'));
        const passwordPosition = Array.from(form.querySelectorAll('*')).indexOf(passwordFields[0]);
        
        for (const field of allInputs) {
          if (field.disabled || field.readOnly) continue;
          const fieldPosition = Array.from(form.querySelectorAll('*')).indexOf(field);
          if (fieldPosition < passwordPosition && isVisible(field)) {
            usernameField = field;
            break;
          }
        }
      }
      
      if (usernameField && isVisible(usernameField) && isVisible(passwordFields[0])) {
        loginForms.push({
          form: form,
          usernameField: usernameField,
          passwordField: passwordFields[0]
        });
      }
    }
  });
  
  return loginForms;
}

// Helper function to get label text for a field
function getLabelForField(field) {
  let label = '';
  
  // Check for label element
  if (field.id) {
    const labelElement = document.querySelector(`label[for="${field.id}"]`);
    if (labelElement) {
      label = labelElement.textContent || '';
    }
  }
  
  // Check for parent label
  const parentLabel = field.closest('label');
  if (parentLabel) {
    label = parentLabel.textContent || '';
  }
  
  // Check for preceding text
  if (!label && field.previousElementSibling) {
    label = field.previousElementSibling.textContent || '';
  }
  
  return label.toLowerCase();
}

// Helper function to check if element is visible
function isVisible(element) {
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && 
         style.visibility !== 'hidden' && 
         style.opacity !== '0' &&
         element.offsetWidth > 0 && 
         element.offsetHeight > 0;
}

// Fill credentials into login form with better event simulation
function fillCredentials(credentials) {
  const loginForms = findLoginForms();
  
  if (loginForms.length > 0) {
    const { usernameField, passwordField } = loginForms[0];
    
    // Focus and fill username field
    usernameField.focus();
    usernameField.value = credentials.username;
    
    // Trigger events for better compatibility
    const events = ['input', 'change', 'blur'];
    events.forEach(eventType => {
      usernameField.dispatchEvent(new Event(eventType, { bubbles: true }));
    });
    
    // Small delay before filling password
    setTimeout(() => {
      passwordField.focus();
      passwordField.value = credentials.password;
      
      events.forEach(eventType => {
        passwordField.dispatchEvent(new Event(eventType, { bubbles: true }));
      });
      
      // Focus back to username for better UX
      setTimeout(() => {
        usernameField.focus();
      }, 100);
    }, 100);
    
    return true;
  }
  
  return false;
}

// Listen for password changes to offer saving
function setupPasswordChangeDetection() {
  let formSubmissionData = {};
  
  // Monitor form submissions
  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (form.tagName !== 'FORM') return;
    
    const passwordFields = form.querySelectorAll('input[type="password"]');
    
    if (passwordFields.length > 0) {
      let newPassword = '';
      let username = '';
      
      // Get password value
      for (const passwordField of passwordFields) {
        if (passwordField.value && passwordField.value.length > 0) {
          newPassword = passwordField.value;
          break;
        }
      }
      
      // Find username field
      const usernameField = form.querySelector('input[type="text"], input[type="email"], input:not([type])');
      if (usernameField && usernameField.value) {
        username = usernameField.value;
      }
      
      if (newPassword && username) {
        const website = window.location.hostname;
        
        // Store for potential saving
        formSubmissionData = {
          website,
          username,
          password: newPassword
        };
        
        // Delay to allow form submission to complete
        setTimeout(() => {
          // Check if we're still on the same page (form didn't redirect)
          if (window.location.hostname === website) {
            chrome.runtime.sendMessage({
              action: 'savePassword',
              data: formSubmissionData
            });
          }
        }, 1000);
      }
    }
  }, true);
}

// Show autofill notification to user
function showAutofillNotification(credentials) {
  // Remove any existing notifications
  const existingNotification = document.querySelector('.securevault-notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  const notificationDiv = document.createElement('div');
  notificationDiv.className = 'securevault-notification';
  notificationDiv.innerHTML = `
    <div style="position: fixed; top: 20px; right: 20px; background: white; border: 2px solid #3F51B5; 
                border-radius: 8px; padding: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); z-index: 999999; 
                width: 320px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                animation: slideIn 0.3s ease-out;">
      <style>
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      </style>
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <div style="width: 24px; height: 24px; background: #3F51B5; border-radius: 50%; 
                    display: flex; align-items: center; justify-content: center; margin-right: 12px;">
          <span style="color: white; font-weight: bold; font-size: 14px;">🔐</span>
        </div>
        <div style="font-weight: 600; color: #333; font-size: 16px;">SecureVault</div>
      </div>
      <p style="margin: 8px 0; font-size: 14px; color: #666; line-height: 1.4;">
        Autofill login credentials for <strong>${credentials.username}</strong>?
      </p>
      <div style="display: flex; justify-content: flex-end; margin-top: 16px; gap: 8px;">
        <button id="sv-autofill-no" style="background: #f5f5f5; border: 1px solid #ddd; padding: 8px 16px; 
                 border-radius: 4px; cursor: pointer; font-size: 14px; color: #666;">
          Not now
        </button>
        <button id="sv-autofill-yes" style="background: #3F51B5; color: white; border: none; 
                 padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 500;">
          Autofill
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(notificationDiv);
  
  // Add event listeners to buttons
  document.getElementById('sv-autofill-yes').addEventListener('click', () => {
    fillCredentials(credentials);
    notificationDiv.remove();
  });
  
  document.getElementById('sv-autofill-no').addEventListener('click', () => {
    notificationDiv.remove();
  });
  
  // Auto-remove after 15 seconds
  setTimeout(() => {
    if (document.body.contains(notificationDiv)) {
      notificationDiv.remove();
    }
  }, 15000);
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (message.action === 'fillCredentials') {
      const result = fillCredentials(message.credentials);
      sendResponse({ success: result });
    }
    
    if (message.action === 'checkForLoginForm') {
      const loginForms = findLoginForms();
      if (loginForms.length > 0) {
        // Notify background script that we found a login form
        chrome.runtime.sendMessage({
          action: 'loginFormFound',
          url: window.location.origin
        });
      }
      sendResponse({ found: loginForms.length > 0 });
    }
    
    if (message.action === 'showAutofillNotification') {
      showAutofillNotification(message.credentials);
      sendResponse({ success: true });
    }
  } catch (error) {
    console.error('SecureVault content script error:', error);
    sendResponse({ success: false, error: error.message });
  }
  
  return true;
});

// Initialize
(function() {
  console.log('SecureVault content script loaded');
  
  // Setup password detection
  setupPasswordChangeDetection();
  
  // Check for login forms when DOM is ready
  function checkForForms() {
    const loginForms = findLoginForms();
    if (loginForms.length > 0) {
      chrome.runtime.sendMessage({
        action: 'loginFormFound',
        url: window.location.origin
      });
    }
  }
  
  // Check immediately if DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkForForms);
  } else {
    checkForForms();
  }
  
  // Also check when new content is dynamically added
  const observer = new MutationObserver((mutations) => {
    let shouldCheck = false;
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.querySelector && (node.querySelector('form') || node.querySelector('input[type="password"]'))) {
              shouldCheck = true;
              break;
            }
          }
        }
      }
    });
    
    if (shouldCheck) {
      setTimeout(checkForForms, 500); // Delay to allow form setup
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();
