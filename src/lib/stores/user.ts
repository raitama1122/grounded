import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { clearAnonymousUsage } from './usage.js';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
}

export const user = writable<User | null>(null);
export const isLoading = writable(true);

// Authentication functions
export const authService = {
  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        user.set(data.user);
        clearAnonymousUsage(); // Clear anonymous usage when user logs in
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  },

  async register(email: string, name: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name, password }),
      });

      const data = await response.json();

      if (data.success) {
        user.set(data.user);
        clearAnonymousUsage(); // Clear anonymous usage when user registers
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: 'Network error' };
    }
  },

  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      user.set(null);
    }
  },

  async checkAuth(): Promise<void> {
    if (!browser) return;
    
    try {
      isLoading.set(true);
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      user.set(data.user);
    } catch (error) {
      console.error('Auth check error:', error);
      user.set(null);
    } finally {
      isLoading.set(false);
    }
  }
};

// Auto-check authentication on app start
if (browser) {
  authService.checkAuth();
}
