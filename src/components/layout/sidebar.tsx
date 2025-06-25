'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Building2,
  Users,
  DollarSign,
  Home,
  MapPin,
  FileText,
  User,
  Shield,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

const adminNavigation = [
  {
    name: 'Admin Dashboard',
    href: '/dashboard',
    icon: Shield,
  },
  {
    name: 'Emlak İşlemleri',
    href: '/properties',
    icon: Building2,
  },
  {
    name: 'Müşteriler',
    href: '/customers',
    icon: Users,
  },
  {
    name: 'Alım/Satım/Kiralama',
    href: '/sales',
    icon: DollarSign,
  },
  {
    name: 'Lokasyonlar',
    href: '/locations',
    icon: MapPin,
  },
  {
    name: 'Raporlar',
    href: '/reports',
    icon: FileText,
  },
  {
    name: 'Kullanıcı Yönetimi',
    href: '/user-management',
    icon: Users,
  },
];

const userNavigation = [
  {
    name: 'User Dashboard',
    href: '/user-dashboard',
    icon: BarChart3,
  },
  {
    name: 'Emlak İşlemleri',
    href: '/properties',
    icon: Building2,
  },
  {
    name: 'Müşteriler',
    href: '/customers',
    icon: Users,
  },
  {
    name: 'Lokasyonlar',
    href: '/locations',
    icon: MapPin,
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { isAdmin, isUser, getUserRole } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getNavigation = () => {
    if (!mounted) {
      // Server rendering sırasında ve mount olmadan önce boş array döndür
      return [];
    }
    
    if (isAdmin()) {
      return adminNavigation;
    } else if (isUser()) {
      return userNavigation;
    }
    return [];
  };

  const navigation = getNavigation();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-25 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:inset-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo area - mobile'da gizli çünkü header'da var */}
          <div className="hidden md:flex items-center gap-2 p-6 border-b">
            <Building2 className="h-6 w-6 text-blue-600" />
            <div className="flex flex-col">
              <span className="font-bold">Emlak Takip</span>
              <span className="text-xs text-muted-foreground">
                {mounted ? (isAdmin() ? 'Admin Panel' : 'Kullanıcı Panel') : 'Panel'}
              </span>
            </div>
          </div>

          {/* Role Badge */}
          <div className="px-4 py-2 border-b bg-muted/50">
            <div className="flex items-center gap-2">
              {mounted && isAdmin() ? (
                <Shield className="h-4 w-4 text-orange-600" />
              ) : (
                <User className="h-4 w-4 text-blue-600" />
              )}
              <span className="text-sm font-medium">
                {mounted ? (isAdmin() ? 'Yönetici' : 'Kullanıcı') : 'Kullanıcı'}
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {mounted && navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
            {!mounted && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            )}
          </nav>
        </div>
      </div>
    </>
  );
} 