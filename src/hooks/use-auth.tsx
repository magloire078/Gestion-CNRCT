
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChange } from '@/services/auth-service';
import type { User, Role, OrganizationSettings } from '@/lib/data';
import { getRoles, initializeDefaultRoles } from '@/services/role-service';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  settings: OrganizationSettings;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export function AuthProvider({ children, settings }: { children: ReactNode, settings: OrganizationSettings }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChange((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const isPublicPage = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password';

    if (!user && !isPublicPage) {
      router.push('/login');
    } else if (user && isPublicPage) {
      router.push('/');
    }
  }, [user, loading, pathname, router]);

  const hasPermission = (permission: string) => {
      if (loading || !user) return false;
      // Admins have all permissions
      if (user.role?.id === 'administrateur') {
        return true;
      }
      return user.permissions?.includes(permission) || false;
  }

  const value = { user, loading, hasPermission, settings };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
