import React, { useEffect, useState } from 'react';
import CurrentSiteCard from './CurrentSiteCard';
import PasswordItem from './PasswordItem';
import { useQuery } from '@tanstack/react-query';
import { PasswordEntry } from '@/types';

interface PasswordsTabProps {
  visible: boolean;
  currentSite: string;
}

const PasswordsTab: React.FC<PasswordsTabProps> = ({ visible, currentSite }) => {
  const [hasCredentialsForSite, setHasCredentialsForSite] = useState(false);
  const [currentSiteCredentials, setCurrentSiteCredentials] = useState<PasswordEntry | null>(null);

  // Fetch recent passwords
  const { data: recentPasswords, isLoading } = useQuery<PasswordEntry[]>({
    queryKey: ['/api/passwords/recent'],
    enabled: visible,
  });

  // Fetch credentials for current site
  const { data: siteCredentials } = useQuery<PasswordEntry | null>({
    queryKey: ['/api/passwords/site', currentSite],
    enabled: !!currentSite && visible,
  });

  useEffect(() => {
    if (siteCredentials) {
      setHasCredentialsForSite(true);
      setCurrentSiteCredentials(siteCredentials);
    } else {
      setHasCredentialsForSite(false);
      setCurrentSiteCredentials(null);
    }
  }, [siteCredentials]);

  if (!visible) return null;

  return (
    <div>
      {/* Current Site Section */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-neutral-800">Current Site</h2>
          <span className="text-xs text-neutral-500">{currentSite || 'No site detected'}</span>
        </div>
        
        {hasCredentialsForSite && currentSiteCredentials ? (
          <CurrentSiteCard credentials={currentSiteCredentials} />
        ) : (
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-neutral-600 mb-3">No credentials found for this site</p>
            <button 
              className="px-3 py-1.5 bg-primary text-white text-sm rounded-md inline-flex items-center"
              onClick={() => {
                if (window.confirm(`Would you like to add a new password for ${currentSite}?`)) {
                  // Pass the current site to generator tab
                  localStorage.setItem('currentSiteForGenerator', currentSite);
                  // Switch to generator tab
                  window.dispatchEvent(new CustomEvent('switchTab', { detail: 'generator' }));
                }
              }}
            >
              <span className="material-icons text-sm mr-1">add</span>
              Add Password
            </button>
          </div>
        )}
      </section>
      
      {/* Recent Passwords Section */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-neutral-800">Recent Passwords</h2>
          <a href="#" className="text-xs text-primary">View All</a>
        </div>
        
        {isLoading ? (
          <div className="bg-white rounded-lg shadow p-3 mb-3 text-center">
            <p className="text-neutral-600">Loading...</p>
          </div>
        ) : recentPasswords && recentPasswords.length > 0 ? (
          recentPasswords.map((password) => (
            <PasswordItem key={password.id} password={password} />
          ))
        ) : (
          <div className="bg-white rounded-lg shadow p-3 mb-3 text-center">
            <p className="text-neutral-600">No recent passwords</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default PasswordsTab;
