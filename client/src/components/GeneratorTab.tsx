import React, { useState, useEffect } from 'react';
import { generatePassword, generatePassphrase } from '@/lib/passwordGenerator';

interface GeneratorTabProps {
  visible: boolean;
}

interface PasswordOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  avoidAmbiguous: boolean;
}

interface PassphraseOptions {
  wordCount: number;
  separator: string;
  capitalizeWords: boolean;
  includeNumbers: boolean;
}

const GeneratorTab: React.FC<GeneratorTabProps> = ({ visible }) => {
  const [passwordOptions, setPasswordOptions] = useState<PasswordOptions>({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    avoidAmbiguous: false,
  });
  
  const [passphraseOptions, setPassphraseOptions] = useState<PassphraseOptions>({
    wordCount: 4,
    separator: '-',
    capitalizeWords: false,
    includeNumbers: false,
  });
  
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [generatedPassphrase, setGeneratedPassphrase] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('Strong');
  
  useEffect(() => {
    if (visible) {
      // Check if there's a current site for adding password
      const currentSiteForGenerator = localStorage.getItem('currentSiteForGenerator');
      
      handleGeneratePassword();
      handleGeneratePassphrase();
    }
  }, [visible]);
  
  const handleGeneratePassword = () => {
    const newPassword = generatePassword(passwordOptions);
    setGeneratedPassword(newPassword);
    
    // Calculate password strength
    let strength = 'Weak';
    if (newPassword.length >= 12 && 
        passwordOptions.includeUppercase && 
        passwordOptions.includeLowercase && 
        passwordOptions.includeNumbers && 
        passwordOptions.includeSymbols) {
      strength = 'Strong';
    } else if (newPassword.length >= 8 && 
              (passwordOptions.includeUppercase || 
               passwordOptions.includeNumbers || 
               passwordOptions.includeSymbols)) {
      strength = 'Medium';
    }
    setPasswordStrength(strength);
  };
  
  const handleGeneratePassphrase = () => {
    const newPassphrase = generatePassphrase(passphraseOptions);
    setGeneratedPassphrase(newPassphrase);
  };
  
  const handleCopyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    // Could show a toast here
  };
  
  const handleCopyPassphrase = () => {
    navigator.clipboard.writeText(generatedPassphrase);
    // Could show a toast here
  };
  
  const handlePasswordOptionChange = (key: keyof PasswordOptions, value: boolean | number) => {
    setPasswordOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const handlePassphraseOptionChange = (key: keyof PassphraseOptions, value: boolean | number | string) => {
    setPassphraseOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const handleSavePasswordForSite = () => {
    // Get the current site from localStorage (set by the Passwords tab)
    const currentSite = localStorage.getItem('currentSiteForGenerator');
    
    if (!currentSite) {
      alert("Please specify a website to save this password for.");
      return;
    }
    
    // Prepare data for saving
    const passwordData = {
      userId: 1, // In a real extension, we'd get this from the authenticated user
      website: currentSite,
      username: prompt("Enter the username for this site:", `user@${currentSite}`) || `user@${currentSite}`,
      password: generatedPassword
    };
    
    // Call the API to save
    fetch('/api/passwords', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(passwordData)
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to save password');
      return res.json();
    })
    .then(() => {
      alert(`Password saved successfully for ${currentSite}`);
      // Clear the currentSite from localStorage
      localStorage.removeItem('currentSiteForGenerator');
      // Switch back to passwords tab
      window.dispatchEvent(new CustomEvent('switchTab', { detail: 'passwords' }));
    })
    .catch(err => {
      console.error('Error saving password:', err);
      alert('Failed to save password. Please try again.');
    });
  };
  
  const handleSavePassphraseForSite = () => {
    // Get the current site from localStorage (set by the Passwords tab)
    const currentSite = localStorage.getItem('currentSiteForGenerator');
    
    if (!currentSite) {
      alert("Please specify a website to save this passphrase for.");
      return;
    }
    
    // Prepare data for saving
    const passwordData = {
      userId: 1, // In a real extension, we'd get this from the authenticated user
      website: currentSite,
      username: prompt("Enter the username for this site:", `user@${currentSite}`) || `user@${currentSite}`,
      password: generatedPassphrase
    };
    
    // Call the API to save
    fetch('/api/passwords', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(passwordData)
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to save passphrase');
      return res.json();
    })
    .then(() => {
      alert(`Passphrase saved successfully for ${currentSite}`);
      // Clear the currentSite from localStorage
      localStorage.removeItem('currentSiteForGenerator');
      // Switch back to passwords tab
      window.dispatchEvent(new CustomEvent('switchTab', { detail: 'passwords' }));
    })
    .catch(err => {
      console.error('Error saving passphrase:', err);
      alert('Failed to save passphrase. Please try again.');
    });
  };

  if (!visible) return null;

  return (
    <div>
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h2 className="text-base font-medium text-neutral-800 mb-4">Password Generator</h2>
        
        <div className="relative mb-4">
          <div className="flex">
            <input 
              type="text" 
              className="w-full p-2 pr-16 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary transition" 
              value={generatedPassword} 
              readOnly 
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <button 
                className="p-1 rounded hover:bg-neutral-100 mr-1" 
                title="Regenerate"
                onClick={handleGeneratePassword}
              >
                <span className="material-icons text-neutral-500 text-sm">refresh</span>
              </button>
              <button 
                className="p-1 rounded hover:bg-neutral-100" 
                title="Copy Password"
                onClick={handleCopyPassword}
              >
                <span className="material-icons text-neutral-500 text-sm">content_copy</span>
              </button>
            </div>
          </div>
          <div className="flex justify-between mt-1">
            <span className={`text-xs font-medium ${
              passwordStrength === 'Strong' ? 'text-secondary' : 
              passwordStrength === 'Medium' ? 'text-amber-500' : 
              'text-red-500'
            }`}>
              {passwordStrength}
            </span>
            <span className="text-xs text-neutral-500">{passwordOptions.length} characters</span>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm text-neutral-700">Password Length</label>
            <div className="flex items-center">
              <input 
                type="range" 
                min="8" 
                max="32" 
                value={passwordOptions.length} 
                className="w-32 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer" 
                onChange={(e) => handlePasswordOptionChange('length', parseInt(e.target.value))}
              />
              <span className="text-sm text-neutral-700 ml-2 w-6 text-center">{passwordOptions.length}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm text-neutral-700">Include Uppercase</label>
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={passwordOptions.includeUppercase}
                onChange={(e) => handlePasswordOptionChange('includeUppercase', e.target.checked)}
              />
              <div className="relative w-10 h-5 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm text-neutral-700">Include Lowercase</label>
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={passwordOptions.includeLowercase}
                onChange={(e) => handlePasswordOptionChange('includeLowercase', e.target.checked)}
              />
              <div className="relative w-10 h-5 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm text-neutral-700">Include Numbers</label>
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={passwordOptions.includeNumbers}
                onChange={(e) => handlePasswordOptionChange('includeNumbers', e.target.checked)}
              />
              <div className="relative w-10 h-5 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm text-neutral-700">Include Symbols</label>
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={passwordOptions.includeSymbols}
                onChange={(e) => handlePasswordOptionChange('includeSymbols', e.target.checked)}
              />
              <div className="relative w-10 h-5 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm text-neutral-700">Avoid Ambiguous Characters</label>
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={passwordOptions.avoidAmbiguous}
                onChange={(e) => handlePasswordOptionChange('avoidAmbiguous', e.target.checked)}
              />
              <div className="relative w-10 h-5 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
        
        <div className="flex justify-between mt-5">
          <button 
            className="px-3 py-2 bg-primary text-white text-sm rounded-md flex items-center"
            onClick={handleGeneratePassword}
          >
            <span className="material-icons text-sm mr-1">refresh</span>
            Generate
          </button>
          <button 
            className="px-3 py-2 bg-white border border-neutral-300 text-neutral-700 text-sm rounded-md flex items-center"
            onClick={handleSavePasswordForSite}
          >
            <span className="material-icons text-sm mr-1">save</span>
            Save for Site
          </button>
        </div>
      </div>
      
      {/* Passphrase Generator */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-base font-medium text-neutral-800 mb-4">Passphrase Generator</h2>
        
        <div className="relative mb-4">
          <input 
            type="text" 
            className="w-full p-2 pr-16 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary transition" 
            value={generatedPassphrase} 
            readOnly 
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <button 
              className="p-1 rounded hover:bg-neutral-100 mr-1" 
              title="Regenerate"
              onClick={handleGeneratePassphrase}
            >
              <span className="material-icons text-neutral-500 text-sm">refresh</span>
            </button>
            <button 
              className="p-1 rounded hover:bg-neutral-100" 
              title="Copy Passphrase"
              onClick={handleCopyPassphrase}
            >
              <span className="material-icons text-neutral-500 text-sm">content_copy</span>
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm text-neutral-700">Word Count</label>
            <div className="flex items-center">
              <input 
                type="range" 
                min="3" 
                max="8" 
                value={passphraseOptions.wordCount} 
                className="w-32 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer" 
                onChange={(e) => handlePassphraseOptionChange('wordCount', parseInt(e.target.value))}
              />
              <span className="text-sm text-neutral-700 ml-2 w-6 text-center">{passphraseOptions.wordCount}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm text-neutral-700">Word Separator</label>
            <select 
              className="text-sm border border-neutral-300 rounded-md p-1 focus:ring-2 focus:ring-primary focus:border-primary"
              value={passphraseOptions.separator}
              onChange={(e) => handlePassphraseOptionChange('separator', e.target.value)}
            >
              <option value="-">Hyphen (-)</option>
              <option value=".">Period (.)</option>
              <option value="_">Underscore (_)</option>
              <option value="">None</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm text-neutral-700">Capitalize Words</label>
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={passphraseOptions.capitalizeWords}
                onChange={(e) => handlePassphraseOptionChange('capitalizeWords', e.target.checked)}
              />
              <div className="relative w-10 h-5 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm text-neutral-700">Include Numbers</label>
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={passphraseOptions.includeNumbers}
                onChange={(e) => handlePassphraseOptionChange('includeNumbers', e.target.checked)}
              />
              <div className="relative w-10 h-5 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
        
        <div className="flex justify-between mt-5">
          <button 
            className="px-3 py-2 bg-primary text-white text-sm rounded-md flex items-center"
            onClick={handleGeneratePassphrase}
          >
            <span className="material-icons text-sm mr-1">refresh</span>
            Generate
          </button>
          <button 
            className="px-3 py-2 bg-white border border-neutral-300 text-neutral-700 text-sm rounded-md flex items-center"
            onClick={handleSavePassphraseForSite}
          >
            <span className="material-icons text-sm mr-1">save</span>
            Save for Site
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeneratorTab;
