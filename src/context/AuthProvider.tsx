import React, { createContext, useState, useEffect } from 'react';
import type { AuthUser, LoginPayload } from '@/types/auth';
import { login as apiLogin } from '@/api/authApi';
import { setAuthToken } from '@/api/client';
import { normalizeRole } from '@/utils/auth';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem('auth_user');
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('auth_token');
    } catch {
      return null;
    }
  });

  useEffect(() => {
    setAuthToken(token ?? undefined);
    if (token) localStorage.setItem('auth_token', token);
    else localStorage.removeItem('auth_token');
  }, [token]);

  const login = async (payload: LoginPayload) => {
  const res = await apiLogin(payload) as any;

  const rawRole = res.role;  // "ROLE_COORDINATOR"
  const normalized = normalizeRole(rawRole);
  const resolvedUser: AuthUser = {
    id: String(res.id ?? ''),
    email: res.email ?? '',
    fullName: res.fullName ?? res.email ?? '',
    rawRole,
    role: (normalized ?? rawRole) as any,
  };

  try {
    localStorage.setItem('auth_user', JSON.stringify(resolvedUser));
    localStorage.setItem('auth_token', res.token);
  } catch {}

  setAuthToken(res.token);
  setUser(resolvedUser);
  setToken(res.token);
};

  const logout = () => {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    } catch {}
    setAuthToken(undefined);
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') window.location.href = '/login';
  };

  const isAuthenticated = !!token;

  const hasRole = (role: string): boolean =>
    !!user && String(user.role).toLowerCase() === String(role).toLowerCase();

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};
