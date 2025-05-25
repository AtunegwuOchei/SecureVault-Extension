import React, { createContext, useContext, useState, useCallback } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isConnected: boolean;
  checkAuthStatus: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  connectToNativeApp: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isConnected: false,
  checkAuthStatus: async () => false,
  login: async () => {},
  logout: async () => {},
  connectToNativeApp: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const checkAuthStatus = useCallback(async (): Promise<boolean> => {
    // Check if the user is already logged in
    const token = localStorage.getItem('auth_token');
    const isAuth = !!token;
    setIsAuthenticated(isAuth);
    
    // Check if connected to native app
    const isConn = localStorage.getItem('is_connected') === 'true';
    setIsConnected(isConn);
    
    return isAuth || isConn;
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    // In a real extension, this would validate credentials with a backend service
    if (email && password) {
      // Simulate authentication for demo purposes
      localStorage.setItem('auth_token', 'demo_token');
      setIsAuthenticated(true);
    } else {
      throw new Error('Invalid credentials');
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
  }, []);

  const connectToNativeApp = useCallback(async (): Promise<void> => {
    // In a real extension, this would use native messaging to connect to the app
    // Simulate connection for demo purposes
    await new Promise(resolve => setTimeout(resolve, 1000));
    localStorage.setItem('is_connected', 'true');
    setIsConnected(true);
    setIsAuthenticated(true);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isConnected,
        checkAuthStatus,
        login,
        logout,
        connectToNativeApp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
