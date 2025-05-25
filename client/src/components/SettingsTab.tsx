import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useExtensionMessaging } from '@/lib/extensionMessaging';

interface SettingsTabProps {
  visible: boolean;
}

interface ExtensionSettings {
  autoFillOnPageLoad: boolean;
  autoLockTimeout: string;
  biometricAuth: boolean;
  passwordSuggestions: boolean;
  defaultPasswordLength: string;
}

interface SyncSettings {
  syncWithNativeApp: boolean;
  syncFrequency: string;
  lastSynced: string;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ visible }) => {
  const [extensionSettings, setExtensionSettings] = useState<ExtensionSettings>({
    autoFillOnPageLoad: true,
    autoLockTimeout: '15',
    biometricAuth: true,
    passwordSuggestions: true,
    defaultPasswordLength: '16',
  });
  
  const [syncSettings, setSyncSettings] = useState<SyncSettings>({
    syncWithNativeApp: true,
    syncFrequency: 'realtime',
    lastSynced: '5 minutes ago',
  });

  const { triggerSync } = useExtensionMessaging();
  
  // Fetch settings from API
  const { data: settings } = useQuery({
    queryKey: ['/api/settings'],
    enabled: visible,
  });
  
  // Update settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      return await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
  });
  
  useEffect(() => {
    if (settings) {
      // If we got settings from API, update our state
      setExtensionSettings(settings.extension || extensionSettings);
      setSyncSettings(settings.sync || syncSettings);
    }
  }, [settings]);
  
  const handleExtensionSettingChange = (key: keyof ExtensionSettings, value: boolean | string) => {
    const newSettings = { ...extensionSettings, [key]: value };
    setExtensionSettings(newSettings);
    
    // Save the updated settings
    updateSettingsMutation.mutate({
      extension: newSettings,
      sync: syncSettings,
    });
    
    // If this is the autofill setting, also update localStorage for immediate effect
    if (key === 'autoFillOnPageLoad') {
      localStorage.setItem('autofillOnPageLoad', String(value));
    }
  };
  
  const handleSyncSettingChange = (key: keyof SyncSettings, value: boolean | string) => {
    const newSettings = { ...syncSettings, [key]: value };
    setSyncSettings(newSettings);
    
    // Save the updated settings
    updateSettingsMutation.mutate({
      extension: extensionSettings,
      sync: newSettings,
    });
  };
  
  const handleSyncNow = async () => {
    await triggerSync();
    // Update last synced time
    setSyncSettings({
      ...syncSettings,
      lastSynced: 'just now',
    });
  };

  if (!visible) return null;

  return (
    <div>
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h2 className="text-base font-medium text-neutral-800 mb-4">Extension Settings</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-neutral-700">Auto-fill on Page Load</label>
              <p className="text-xs text-neutral-500">Automatically fill credentials when a login page loads</p>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={extensionSettings.autoFillOnPageLoad}
                onChange={(e) => handleExtensionSettingChange('autoFillOnPageLoad', e.target.checked)}
              />
              <div className="relative w-10 h-5 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-neutral-700">Auto Lock</label>
              <p className="text-xs text-neutral-500">Lock the extension after period of inactivity</p>
            </div>
            <select 
              className="text-sm border border-neutral-300 rounded-md p-1 focus:ring-2 focus:ring-primary focus:border-primary"
              value={extensionSettings.autoLockTimeout}
              onChange={(e) => handleExtensionSettingChange('autoLockTimeout', e.target.value)}
            >
              <option value="5">5 minutes</option>
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="never">Never</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-neutral-700">Biometric Authentication</label>
              <p className="text-xs text-neutral-500">Use device biometrics to unlock the extension</p>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={extensionSettings.biometricAuth}
                onChange={(e) => handleExtensionSettingChange('biometricAuth', e.target.checked)}
              />
              <div className="relative w-10 h-5 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-neutral-700">Password Suggestions</label>
              <p className="text-xs text-neutral-500">Show suggestions when creating new accounts</p>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={extensionSettings.passwordSuggestions}
                onChange={(e) => handleExtensionSettingChange('passwordSuggestions', e.target.checked)}
              />
              <div className="relative w-10 h-5 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-neutral-700">Default Password Length</label>
              <p className="text-xs text-neutral-500">Default length for generated passwords</p>
            </div>
            <select 
              className="text-sm border border-neutral-300 rounded-md p-1 focus:ring-2 focus:ring-primary focus:border-primary"
              value={extensionSettings.defaultPasswordLength}
              onChange={(e) => handleExtensionSettingChange('defaultPasswordLength', e.target.value)}
            >
              <option value="12">12 characters</option>
              <option value="16">16 characters</option>
              <option value="20">20 characters</option>
              <option value="24">24 characters</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h2 className="text-base font-medium text-neutral-800 mb-4">Sync Settings</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-neutral-700">Sync with Native App</label>
              <p className="text-xs text-neutral-500">Keep extension in sync with SecureKeeper app</p>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={syncSettings.syncWithNativeApp}
                onChange={(e) => handleSyncSettingChange('syncWithNativeApp', e.target.checked)}
              />
              <div className="relative w-10 h-5 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-neutral-700">Sync Frequency</label>
              <p className="text-xs text-neutral-500">How often to sync with native app</p>
            </div>
            <select 
              className="text-sm border border-neutral-300 rounded-md p-1 focus:ring-2 focus:ring-primary focus:border-primary"
              value={syncSettings.syncFrequency}
              onChange={(e) => handleSyncSettingChange('syncFrequency', e.target.value)}
            >
              <option value="realtime">Real-time</option>
              <option value="5">Every 5 minutes</option>
              <option value="15">Every 15 minutes</option>
              <option value="60">Every hour</option>
            </select>
          </div>
          
          <div>
            <button 
              className="w-full px-3 py-2 bg-primary text-white text-sm rounded-md flex items-center justify-center"
              onClick={handleSyncNow}
            >
              <span className="material-icons text-sm mr-1">sync</span>
              Sync Now
            </button>
            <p className="text-xs text-neutral-500 text-center mt-1">Last synced: {syncSettings.lastSynced}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-base font-medium text-neutral-800 mb-4">About</h2>
        <div className="text-sm text-neutral-600">
          <p className="mb-2">SecureKeeper Extension v1.0.2</p>
          <p className="mb-2">© 2023 SecureKeeper</p>
          <div className="flex space-x-4 mt-3">
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>
            <a href="#" className="text-primary hover:underline">Terms of Service</a>
            <a href="#" className="text-primary hover:underline">Help</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
