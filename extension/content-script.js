// SecureKeeper Extension Content Script

// Identify login forms on the page
function findLoginForms() {
  const forms = document.querySelectorAll('form');
  const loginForms = [];

  forms.forEach(form => {
    // Check if the form has password fields
    const passwordFields = form.querySelectorAll('input[type="password"]');
    if (passwordFields.length > 0) {
      // Find username/email field (usually comes before password field)
      let usernameField = null;
      const inputFields = form.querySelectorAll('input[type="text"], input[type="email"]');
      
      for (const field of inputFields) {
        const fieldId = field.id.toLowerCase();
        const fieldName = field.name.toLowerCase();
        const fieldClass = field.className.toLowerCase();
        
        // Look for common username/email field identifiers
        if (fieldId.includes('user') || fieldId.includes('email') || 
            fieldName.includes('user') || fieldName.includes('email') ||
            fieldClass.includes('user') || fieldClass.includes('email')) {
          usernameField = field;
          break;
        }
      }
      
      // If no username field found, take the input field that comes before password
      if (!usernameField && passwordFields[0].previousElementSibling) {
        const prevField = passwordFields[0].previousElementSibling;
        if (prevField.tagName === 'INPUT') {
          usernameField = prevField;
        }
      }
      
      if (usernameField) {
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

// Fill credentials into login form
function fillCredentials(credentials) {
  const loginForms = findLoginForms();
  
  if (loginForms.length > 0) {
    const { usernameField, passwordField } = loginForms[0];
    
    // Fill in the username field
    usernameField.value = credentials.username;
    usernameField.dispatchEvent(new Event('input', { bubbles: true }));
    usernameField.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Fill in the password field
    passwordField.value = credentials.password;
    passwordField.dispatchEvent(new Event('input', { bubbles: true }));
    passwordField.dispatchEvent(new Event('change', { bubbles: true }));
    
    return true;
  }
  
  return false;
}

// Listen for password changes to offer saving
function setupPasswordChangeDetection() {
  const forms = document.querySelectorAll('form');
  
  forms.forEach(form => {
    form.addEventListener('submit', (event) => {
      const passwordFields = form.querySelectorAll('input[type="password"]');
      
      if (passwordFields.length > 0) {
        // Check if this might be a password change or new account
        let newPassword = '';
        let username = '';
        
        // Find the password and username values
        if (passwordFields.length >= 1) {
          newPassword = passwordFields[0].value;
          
          // Try to find username field
          const usernameField = form.querySelector('input[type="text"], input[type="email"]');
          if (usernameField) {
            username = usernameField.value;
          }
        }
        
        if (newPassword && username) {
          // Get the current website
          const website = window.location.origin;
          
          // Send message to background script to offer saving
          chrome.runtime.sendMessage({
            action: 'offerSavePassword',
            data: {
              website,
              username,
              password: newPassword
            }
          });
        }
      }
    });
  });
}

// Show autofill notification to user
function showAutofillNotification(credentials) {
  const notificationDiv = document.createElement('div');
  notificationDiv.className = 'securekeeper-notification';
  notificationDiv.innerHTML = `
    <div style="position: fixed; top: 10px; right: 10px; background: white; border: 1px solid #ccc; 
                border-radius: 5px; padding: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 9999; 
                width: 280px; font-family: Arial, sans-serif;">
      <div style="display: flex; align-items: center; margin-bottom: 10px;">
        <div style="width: 20px; height: 20px; background: #3F51B5; border-radius: 50%; 
                    display: flex; align-items: center; justify-content: center; margin-right: 10px;">
          <span style="color: white; font-weight: bold; font-size: 14px;">S</span>
        </div>
        <div style="font-weight: bold;">SecureKeeper</div>
      </div>
      <p style="margin: 5px 0; font-size: 14px;">Would you like to autofill credentials for this site?</p>
      <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
        <button id="sk-autofill-no" style="background: #f1f1f1; border: none; padding: 5px 10px; 
                 border-radius: 3px; margin-right: 5px; cursor: pointer;">No</button>
        <button id="sk-autofill-yes" style="background: #3F51B5; color: white; border: none; 
                 padding: 5px 10px; border-radius: 3px; cursor: pointer;">Yes</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(notificationDiv);
  
  // Add event listeners to buttons
  document.getElementById('sk-autofill-yes').addEventListener('click', () => {
    fillCredentials(credentials);
    notificationDiv.remove();
  });
  
  document.getElementById('sk-autofill-no').addEventListener('click', () => {
    notificationDiv.remove();
  });
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (document.body.contains(notificationDiv)) {
      notificationDiv.remove();
    }
  }, 10000);
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
  }
  
  if (message.action === 'showAutofillNotification') {
    showAutofillNotification(message.credentials);
  }
  
  return true;
});

// Initialize
(function() {
  console.log('SecureKeeper content script loaded');
  setupPasswordChangeDetection();
  
  // Check for login forms on page load
  const loginForms = findLoginForms();
  if (loginForms.length > 0) {
    // Notify background script that we found a login form
    chrome.runtime.sendMessage({
      action: 'loginFormFound',
      url: window.location.origin
    });
  }
})();