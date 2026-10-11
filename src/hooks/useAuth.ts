/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { PublicUserProfile } from '../types/auth';

const AUTH_TOKEN_KEY = 'match_collect_auth_token';

export function useAuth() {
  const [user, setUser] = useState<PublicUserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(AUTH_TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  // Validate session on mount or token change
  const fetchCurrentUser = useCallback(async (authToken: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setToken(null);
        setUser(null);
      }
    } catch {
      // offline or server error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchCurrentUser(token);
    } else {
      setLoading(false);
    }
  }, [token, fetchCurrentUser]);

  const login = async (loginId: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: loginId, password: pass }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        return { success: false, error: data.error || 'Failed to sign in' };
      }
      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch {
      return { success: false, error: 'Connection error. Please try again.' };
    }
  };

  const register = async (params: {
    username: string;
    displayName: string;
    email: string;
    password: string;
    avatar?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        return { success: false, error: data.error || 'Registration failed' };
      }
      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // ignore
      }
    }
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (updates: { displayName?: string; avatar?: string }): Promise<{ success: boolean; error?: string }> => {
    if (!token) return { success: false, error: 'Not authenticated' };
    try {
      const res = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        return { success: false, error: data.error || 'Failed to update profile' };
      }
      setUser(data.user);
      return { success: true };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  return {
    user,
    token,
    loading,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    updateProfile,
    refetchUser: () => token && fetchCurrentUser(token),
  };
}
