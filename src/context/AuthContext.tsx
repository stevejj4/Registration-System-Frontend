// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'ADMIN' | 'COORDINATOR' | 'FACILITATOR' | null;

interface AuthContextType {
  role: UserRole;
  token: string | null;
  setRole: (role: UserRole) => void;
  setToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Example: decode JWT stored in localStorage
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      setToken(storedToken);
      try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        setRole(payload.role as UserRole);
      } catch {
        setRole(null);
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ role, token, setRole, setToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
