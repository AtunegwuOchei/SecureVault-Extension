import React from 'react';

interface TabNavigationProps {
  activeTab: 'passwords' | 'generator' | 'settings';
  setActiveTab: (tab: 'passwords' | 'generator' | 'settings') => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="bg-white shadow-sm">
      <div className="flex">
        <button 
          className={`flex-1 py-3 px-4 text-center font-medium text-sm ${
            activeTab === 'passwords' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
          onClick={() => setActiveTab('passwords')}
        >
          Passwords
        </button>
        <button 
          className={`flex-1 py-3 px-4 text-center font-medium text-sm ${
            activeTab === 'generator' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
          onClick={() => setActiveTab('generator')}
        >
          Generator
        </button>
        <button 
          className={`flex-1 py-3 px-4 text-center font-medium text-sm ${
            activeTab === 'settings' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>
    </nav>
  );
};

export default TabNavigation;
