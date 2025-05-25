export interface PasswordEntry {
  id: string;
  website: string;
  username: string;
  password: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  username: string;
  email?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface ExtensionSettings {
  autoFillOnPageLoad: boolean;
  autoLockTimeout: string;
  biometricAuth: boolean;
  passwordSuggestions: boolean;
  defaultPasswordLength: string;
}

export interface SyncSettings {
  syncWithNativeApp: boolean;
  syncFrequency: string;
  lastSynced: string;
}

export interface AppSettings {
  extension: ExtensionSettings;
  sync: SyncSettings;
}
