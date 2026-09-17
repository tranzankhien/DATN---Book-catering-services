import React, { createContext, useCallback, useEffect, useState } from 'react';
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../services/apiClient';
import { authService, type LoginPayload, type RegisterPayload } from '../services/authService';
import type { UserDto } from '../services/types';

export interface AuthContextValue {
  user: UserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<UserDto>;
  register: (payload: RegisterPayload) => Promise<UserDto>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDto | null>(() => {
    const cached = localStorage.getItem(USER_STORAGE_KEY);
    if (!cached) return null;
    try {
      return JSON.parse(cached) as UserDto;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const currentUser = await authService.getCurrentUser();
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
      setUser(currentUser);
    } catch {
      clearSession();
    } finally {
      setIsLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const login = useCallback(async (payload: LoginPayload): Promise<UserDto> => {
    const authRes = await authService.login(payload);
    localStorage.setItem(TOKEN_STORAGE_KEY, authRes.accessToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authRes.user));
    setUser(authRes.user);
    return authRes.user;
  }, []);

  const register = useCallback(async (payload: RegisterPayload): Promise<UserDto> => {
    const authRes = await authService.register(payload);
    localStorage.setItem(TOKEN_STORAGE_KEY, authRes.accessToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authRes.user));
    setUser(authRes.user);
    return authRes.user;
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
