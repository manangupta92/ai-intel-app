"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthState {
  token: string | null;
  email: string | null;
  userId: string | null;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, code: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    email: null,
    userId: null,
    isAuthenticated: false,
  });

  useEffect(() => {
    // Check for stored token on mount
    const token = localStorage.getItem('authToken');
    if (token) {
      validateToken(token);
    }
  }, []);

  const validateToken = async (token: string) => {
    try {
      const res = await fetch('/api/auth/validate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        throw new Error('Invalid token');
      }

      const data = await res.json();
      setAuthState({
        token,
        email: data.email,
        userId: data.userId,
        isAuthenticated: true,
      });
      return true;
    } catch (error) {
      console.error('Token validation failed:', error);
      localStorage.removeItem('authToken');
      setAuthState({
        token: null,
        email: null,
        userId: null,
        isAuthenticated: false,
      });
      return false;
    }
  };

  const login = async (email: string, code: string) => {
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      if (!res.ok) {
        throw new Error('Invalid OTP');
      }

      const { token } = await res.json();
      localStorage.setItem('authToken', token);
      return validateToken(token);
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setAuthState({
      token: null,
      email: null,
      userId: null,
      isAuthenticated: false,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
