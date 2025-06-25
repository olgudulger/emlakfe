'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';

interface AuthStoreProviderProps {
  children: React.ReactNode;
}

export function AuthStoreProvider({ children }: AuthStoreProviderProps) {
  const store = useAuthStore();

  useEffect(() => {
    // Auth store'u global olarak erişilebilir hale getir
    if (typeof window !== 'undefined') {
      (window as any).authStore = store;
    }
  }, [store]);

  return <>{children}</>;
} 