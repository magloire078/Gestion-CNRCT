
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChange } from '@/services/auth-service';
import type { User, OrganizationSettings } from '@/lib/data';
import { getOrganizationSettings } from '@/services/organization-service';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  settings: OrganizationSettings | null;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;
    let authDone = false;
    let settingsDone = false;

    const checkDone = () => {
      if (isMounted && authDone && settingsDone) {
        setLoading(false);
      }
    };
    
    // Subscribe to auth state changes
    const unsubscribeAuth = onAuthStateChange((currentUser) => {
        if(isMounted) {
          setUser(currentUser);
          authDone = true;
          checkDone();
        }
    });

    // Fetch organization settings once
    getOrganizationSettings().then(orgSettings => {
        if(isMounted) {
            setSettings(orgSettings);
            settingsDone = true;
            checkDone();
        }
    }).catch(console.error);

    return () => {
      isMounted = false;
      unsubscribeAuth();
    };
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
      // Admins and Super Admins have all permissions
      if (user.role?.name === 'Administrateur' || user.role?.name === 'Super Administrateur') {
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
