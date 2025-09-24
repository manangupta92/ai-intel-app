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
    // Check for stored token on mount - check both localStorage and cookies
    let token = localStorage.getItem('authToken');
    
    // If not in localStorage, check cookies
    if (!token) {
      const cookieString = document.cookie;
      const tokenMatch = cookieString.match(/token=([^;]*)/);
      if (tokenMatch) {
        token = tokenMatch[1];
      }
    }
    
    if (token) {
      validateToken(token);
    } else {
      // No token found, set as not authenticated
      setAuthState(prev => ({ ...prev, token: null }));
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
      
      // Store token in both localStorage and cookie
      localStorage.setItem('authToken', token);
      document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`;
      
      return validateToken(token);
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    // Clear the cookie as well
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
    
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
