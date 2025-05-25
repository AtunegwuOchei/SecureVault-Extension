import React from 'react';
import { PasswordEntry } from '@/types';

interface PasswordItemProps {
  password: PasswordEntry;
}

const PasswordItem: React.FC<PasswordItemProps> = ({ password }) => {
  const handleCopyPassword = () => {
    navigator.clipboard.writeText(password.password);
    // Could show a toast here
  };

  return (
    <div className="bg-white rounded-lg shadow p-3 mb-3 hover:bg-neutral-50 cursor-pointer">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-6 h-6 bg-neutral-200 rounded-full flex items-center justify-center mr-2">
            <span className="material-icons text-neutral-600 text-sm">language</span>
          </div>
          <div>
            <div className="font-medium text-sm text-neutral-800">{password.website}</div>
            <div className="text-xs text-neutral-500">{password.username}</div>
          </div>
        </div>
        <button 
          className="p-1 rounded hover:bg-neutral-100" 
          title="Copy Password"
          onClick={handleCopyPassword}
        >
          <span className="material-icons text-neutral-500 text-sm">content_copy</span>
        </button>
      </div>
    </div>
  );
};

export default PasswordItem;
