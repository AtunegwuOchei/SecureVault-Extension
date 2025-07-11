import React, { useState } from 'react';
import { PasswordEntry } from '@/types';

interface CurrentSiteCardProps {
  credentials: PasswordEntry;
}

const CurrentSiteCard: React.FC<CurrentSiteCardProps> = ({ credentials }) => {
  const [showPassword, setShowPassword] = useState(false);
  
  const handleCopyUsername = () => {
    navigator.clipboard.writeText(credentials.username);
    // Could show a toast here
  };
  
  const handleCopyPassword = () => {
    navigator.clipboard.writeText(credentials.password);
    // Could show a toast here
  };
  
  const handleAutofill = () => {
    // Implementation would use browser extension APIs to autofill
    alert(`Autofilling credentials for ${credentials.website}\nUsername: ${credentials.username}\nPassword: ${credentials.password}`);
    console.log('Autofilling credentials for', credentials.website);
  };
  
  const handleEdit = () => {
    // Get updated values
    const newUsername = prompt("Update username:", credentials.username);
    if (newUsername === null) return; // User canceled
    
    const newPassword = prompt("Update password:", credentials.password);
    if (newPassword === null) return; // User canceled
    
    // Prepare data for saving
    const passwordData = {
      userId: 1, // In a real extension, we'd get this from the authenticated user
      website: credentials.website,
      username: newUsername,
      password: newPassword
    };
    
    // Call the API to update
    fetch(`/api/passwords/${credentials.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(passwordData)
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to update credentials');
      return res.json();
    })
    .then(() => {
      alert(`Credentials updated successfully for ${credentials.website}`);
      // Refresh the page to show updated credentials
      window.location.reload();
    })
    .catch(err => {
      console.error('Error updating credentials:', err);
      alert('Failed to update credentials. Please try again.');
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div className="w-6 h-6 bg-neutral-200 rounded-full flex items-center justify-center mr-2">
            <span className="material-icons text-neutral-600 text-sm">language</span>
          </div>
          <span className="font-medium text-neutral-800">{credentials.website}</span>
        </div>
        <span className="text-xs text-secondary px-2 py-1 bg-secondary-light bg-opacity-20 rounded-full">Saved</span>
      </div>
      
      <div className="flex items-center justify-between mt-4">
        <div className="flex flex-col">
          <span className="text-xs text-neutral-500">Username</span>
          <span className="text-sm text-neutral-800">{credentials.username}</span>
        </div>
        <button 
          className="p-1 rounded hover:bg-neutral-100" 
          title="Copy Username"
          onClick={handleCopyUsername}
        >
          <span className="material-icons text-neutral-500 text-sm">content_copy</span>
        </button>
      </div>
      
      <div className="flex items-center justify-between mt-2">
        <div className="flex flex-col">
          <span className="text-xs text-neutral-500">Password</span>
          <span className="text-sm text-neutral-800">
            {showPassword ? credentials.password : '••••••••••••'}
          </span>
        </div>
        <div className="flex">
          <button 
            className="p-1 rounded hover:bg-neutral-100 mr-1" 
            title={showPassword ? "Hide Password" : "Show Password"}
            onClick={() => setShowPassword(!showPassword)}
          >
            <span className="material-icons text-neutral-500 text-sm">
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
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
      
      <div className="mt-4 flex justify-between">
        <button 
          className="px-3 py-1.5 bg-primary text-white text-sm rounded-md flex items-center"
          onClick={handleAutofill}
        >
          <span className="material-icons text-sm mr-1">login</span>
          Autofill
        </button>
        <button 
          className="px-3 py-1.5 bg-white border border-neutral-300 text-neutral-700 text-sm rounded-md flex items-center"
          onClick={handleEdit}
        >
          <span className="material-icons text-sm mr-1">edit</span>
          Edit
        </button>
      </div>
    </div>
  );
};

export default CurrentSiteCard;
