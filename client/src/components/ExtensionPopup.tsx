import React, { useState, useEffect } from 'react';
import TabNavigation from './TabNavigation';
import PasswordsTab from './PasswordsTab';
import GeneratorTab from './GeneratorTab';
import SettingsTab from './SettingsTab';
import AutofillNotification from './AutofillNotification';
import { useAuth } from '@/contexts/AuthContext';
import { useExtensionMessaging } from '@/lib/extensionMessaging';

const ExtensionPopup: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'passwords' | 'generator' | 'settings'>('passwords');
  const [showAutofillNotification, setShowAutofillNotification] = useState(false);
  const [currentSite, setCurrentSite] = useState<string>('');
  const { isConnected } = useAuth();
  const { getCurrentTab } = useExtensionMessaging();

  useEffect(() => {
    const detectCurrentSite = async () => {
      const site = await getCurrentTab();
      if (site) {
        setCurrentSite(site);
        // Check if we should show autofill notification
        // This would be based on user settings and if we have credentials for this site
        const shouldShowAutofill = localStorage.getItem('autofillOnPageLoad') === 'true';
        if (shouldShowAutofill) {
          setShowAutofillNotification(true);
        }
      }
    };

    detectCurrentSite();
    
    // Listen for tab switch events
    const handleSwitchTab = (event: CustomEvent) => {
      if (event.detail && ['passwords', 'generator', 'settings'].includes(event.detail)) {
        setActiveTab(event.detail as 'passwords' | 'generator' | 'settings');
      }
    };
    
    window.addEventListener('switchTab', handleSwitchTab as EventListener);
    
    return () => {
      window.removeEventListener('switchTab', handleSwitchTab as EventListener);
    };
  }, [getCurrentTab]);

  const handleAutofillAccept = () => {
    // Logic to autofill the credentials
    console.log('Autofilling credentials for', currentSite);
    setShowAutofillNotification(false);
  };

  const handleAutofillDecline = () => {
    setShowAutofillNotification(false);
  };

  const handleAddNewPassword = () => {
    // Prompt for website if not on a specific site
    if (!currentSite) {
      const website = prompt("Enter the website URL for this password:", "");
      if (website) {
        localStorage.setItem('currentSiteForGenerator', website);
      }
    } else {
      localStorage.setItem('currentSiteForGenerator', currentSite);
    }
    setActiveTab('generator');
  };

  return (
    <div className="flex flex-col h-full bg-neutral-100">
      {/* Header Section */}
      <header className="bg-primary p-4 text-white flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center pulse">
            <span className="material-icons text-primary text-sm">lock</span>
          </div>
          <h1 className="text-lg font-medium">SecureKeeper</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-1 rounded-full hover:bg-primary-light transition-colors" title="Settings" onClick={() => setActiveTab('settings')}>
            <span className="material-icons text-sm">settings</span>
          </button>
          <button className="p-1 rounded-full hover:bg-primary-light transition-colors" title="User Account">
            <span className="material-icons text-sm">account_circle</span>
          </button>
        </div>
      </header>
      
      {/* Tabs Navigation */}
      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4">
        <PasswordsTab visible={activeTab === 'passwords'} currentSite={currentSite} />
        <GeneratorTab visible={activeTab === 'generator'} />
        <SettingsTab visible={activeTab === 'settings'} />
      </main>
      
      {/* Bottom Action Bar */}
      <div className="bg-white p-3 border-t border-neutral-200 flex items-center justify-between">
        <div className="flex items-center">
          <div className={`w-2 h-2 ${isConnected ? 'bg-secondary' : 'bg-red-500'} rounded-full pulse mr-2`}></div>
          <span className="text-xs text-neutral-600">
            {isConnected ? 'Connected to SecureKeeper App' : 'Not connected to SecureKeeper App'}
          </span>
        </div>
        <button 
          className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs rounded-md flex items-center transition-colors"
          onClick={handleAddNewPassword}
        >
          <span className="material-icons text-xs mr-1">add</span>
          New
        </button>
      </div>

      {/* Autofill Notification */}
      {showAutofillNotification && (
        <AutofillNotification 
          site={currentSite} 
          onAccept={handleAutofillAccept} 
          onDecline={handleAutofillDecline} 
        />
      )}
    </div>
  );
};

export default ExtensionPopup;
