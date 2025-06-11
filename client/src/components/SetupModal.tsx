import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface SetupModalProps {
  onClose: () => void;
}

const SetupModal: React.FC<SetupModalProps> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, connectToNativeApp } = useAuth();
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await login(email, password);
      onClose();
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleConnectToNativeApp = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      await connectToNativeApp();
      onClose();
    } catch (err) {
      setError('Failed to connect to the native app. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-lg font-medium text-neutral-800">Welcome to SecureVault</h2>
          <button className="p-1 rounded-full hover:bg-neutral-100" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
        </div>
        
        <div className="p-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-icons text-primary text-3xl">lock</span>
            </div>
            <h3 className="text-lg font-medium text-neutral-800">Let's set up your extension</h3>
            <p className="text-sm text-neutral-600 mt-1">Connect to your SecureVault account to get started</p>
          </div>
          
          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <button 
              className={`w-full px-4 py-2 bg-primary text-white rounded-md flex items-center justify-center ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              onClick={handleConnectToNativeApp}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="material-icons animate-spin text-sm mr-2">refresh</span>
              ) : (
                <span className="material-icons text-sm mr-2">smartphone</span>
              )}
              Connect to SecureVault App
            </button>
            
            <div className="relative flex items-center">
              <div className="flex-grow border-t border-neutral-300"></div>
              <span className="flex-shrink mx-4 text-neutral-500 text-sm">or</span>
              <div className="flex-grow border-t border-neutral-300"></div>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                <input 
                  type="email" 
                  className="w-full p-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary" 
                  placeholder="your@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Password</label>
                <input 
                  type="password" 
                  className="w-full p-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary" 
                  placeholder="Your password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <button 
                type="submit" 
                className={`w-full px-4 py-2 bg-primary text-white rounded-md ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
              
              <p className="text-xs text-center text-neutral-500">
                Don't have an account? <a href="#" className="text-primary hover:underline">Create one</a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupModal;
