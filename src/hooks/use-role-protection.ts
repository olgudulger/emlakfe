'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

interface UseRoleProtectionOptions {
  requiredRole?: 'admin' | 'user';
  fallbackPath?: string;
}

export function useRoleProtection(options: UseRoleProtectionOptions = {}) {
  const { requiredRole, fallbackPath = '/login' } = options;
  const { isAuthenticated, isAdmin, isUser, user, initializeAuth } = useAuthStore();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize auth on client-side
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      initializeAuth();
      setIsInitialized(true);
    }
  }, [initializeAuth, isInitialized]);

  // Handle redirects after initialization
  useEffect(() => {
    if (!isInitialized) return; // Wait for initialization

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (requiredRole === 'admin' && !isAdmin()) {
      router.push('/user-dashboard');
      return;
    }

    if (requiredRole === 'user' && !isUser()) {
      router.push('/dashboard');
      return;
    }
  }, [isAuthenticated, isAdmin, isUser, router, requiredRole, isInitialized]);

  return {
    isAuthenticated,
    isAdmin: isAdmin(),
    isUser: isUser(),
    user,
    hasPermission: requiredRole 
      ? (requiredRole === 'admin' ? isAdmin() : isUser())
      : isAuthenticated,
    isInitialized
  };
} 