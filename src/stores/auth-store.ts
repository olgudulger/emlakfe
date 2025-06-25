import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthState } from '@/types';
import { STORAGE_KEYS } from '@/constants/api';
import { authService } from '@/services/auth-service';

interface AuthStore extends AuthState {
  refreshToken: string | null;
  expiresAt: string | null;
  login(user: User, token: string, refreshToken: string, expiresAt: string): void;
  logout(): Promise<void>;
  setLoading(isLoading: boolean): void;
  updateTokens(token: string, refreshToken: string, expiresAt: string): void;
  initializeAuth(): void;
  isTokenExpired(): boolean;
  isAdmin(): boolean;
  isUser(): boolean;
  getUserRole(): string;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      expiresAt: null,
      isAuthenticated: false,
      isLoading: false,

      login: (user: User, token: string, refreshToken: string, expiresAt: string) => {
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, expiresAt);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        set({
          user,
          token,
          refreshToken,
          expiresAt,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: async () => {
        console.log('AuthStore: logout() called');
        try {
          console.log('AuthStore: calling authService.logout()');
          await authService.logout();
          console.log('AuthStore: authService.logout() completed, clearing localStorage');
          localStorage.removeItem(STORAGE_KEYS.TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
          localStorage.removeItem(STORAGE_KEYS.USER);
          console.log('AuthStore: updating state');
          set({
            user: null,
            token: null,
            refreshToken: null,
            expiresAt: null,
            isAuthenticated: false,
            isLoading: false,
          });
          console.log('AuthStore: logout completed successfully');
        } catch (error) {
          console.error('Error logging out:', error);
        }
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      updateTokens: (token: string, refreshToken: string, expiresAt: string) => {
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, expiresAt);
        set({ token, refreshToken, expiresAt });
      },

      initializeAuth: () => {
        if (typeof window === 'undefined') return;
        
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        const expiresAt = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
        const userStr = localStorage.getItem(STORAGE_KEYS.USER);

        if (token && refreshToken && expiresAt && userStr) {
          try {
            const user = JSON.parse(userStr);
            
            // Check if token is expired
            const expirationTime = new Date(expiresAt).getTime();
            const currentTime = new Date().getTime();
            const bufferTime = 5 * 60 * 1000; // 5 dakika buffer
            
            if (currentTime < (expirationTime - bufferTime)) {
              // Token still valid, restore auth state
              set({
                user,
                token,
                refreshToken,
                expiresAt,
                isAuthenticated: true,
                isLoading: false,
              });
            } else {
              // Token expired, clear everything
              get().logout();
            }
          } catch (error) {
            console.error('Error parsing user data:', error);
            get().logout();
          }
        } else {
          // No valid auth data, ensure logged out state
          set({
            user: null,
            token: null,
            refreshToken: null,
            expiresAt: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      isTokenExpired: () => {
        const state = get();
        if (!state.expiresAt) return true;
        
        const expirationTime = new Date(state.expiresAt).getTime();
        const currentTime = new Date().getTime();
        const bufferTime = 5 * 60 * 1000; // 5 dakika buffer
        
        return currentTime >= (expirationTime - bufferTime);
      },

      isAdmin: () => {
        const state = get();
        if (!state.user) return false;
        return state.user.role?.toLowerCase().includes('admin') || false;
      },

      isUser: () => {
        const state = get();
        if (!state.user) return false;
        const role = state.user.role?.toLowerCase() || '';
        return role.includes('user') || (!role.includes('admin') && role !== '');
      },

      getUserRole: () => {
        const state = get();
        return state.user?.role || '';
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
); 