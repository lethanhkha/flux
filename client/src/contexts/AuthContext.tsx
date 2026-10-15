import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient, setAccessToken, registerLogoutCallback } from '../api/client';

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  wallets?: Array<{
    id: string;
    name: string;
    currency: string;
    currentBalance: number;
    icon: string;
    color: string;
  }>;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, totpCode?: string, backupCode?: string) => Promise<any>;
  verify2FA: (tempToken: string, code?: string, backupCode?: string) => Promise<any>;
  register: (email: string, password: string, fullName: string) => Promise<any>;
  verifyEmail: (email: string, code: string) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await apiClient.get('/auth/me');
      setUser(res.data.data);
    } catch {
      setUser(null);
    }
  }, []);

  // Try silent refresh on initial app load
  useEffect(() => {
    registerLogoutCallback(() => {
      setUser(null);
    });

    const initAuth = async () => {
      try {
        const res = await apiClient.post('/auth/refresh');
        const token = res.data.data.accessToken;
        setAccessToken(token);
        setUser(res.data.data.user);
      } catch {
        // No active session cookie
        setAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string, totpCode?: string, backupCode?: string) => {
    const res = await apiClient.post('/auth/login', {
      email,
      password,
      totpCode,
      backupCode,
    });

    const data = res.data.data;
    if (data.require2FA) {
      return data;
    }

    setAccessToken(data.accessToken);
    setUser(data.user);
    return data;
  };

  const verify2FA = async (tempToken: string, code?: string, backupCode?: string) => {
    const res = await apiClient.post('/auth/verify-2fa', {
      tempToken,
      code,
      backupCode,
    });

    const data = res.data.data;
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data;
  };

  const register = async (email: string, password: string, fullName: string) => {
    const res = await apiClient.post('/auth/register', {
      email,
      password,
      fullName,
    });
    return res.data.data;
  };

  const verifyEmail = async (email: string, code: string) => {
    const res = await apiClient.post('/auth/verify-email', {
      email,
      code,
    });
    const data = res.data.data;
    if (data.accessToken) {
      setAccessToken(data.accessToken);
      setUser(data.user);
    }
    return data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        verify2FA,
        register,
        verifyEmail,
        logout,
        refreshUser,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
