
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChange } from '@/services/auth-service';
import type { User, Role, OrganizationSettings } from '@/lib/data';
import { getRoles, initializeDefaultRoles } from '@/services/role-service';
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
    let settingsDone = false;
    let authDone = false;

    const checkDone = () => {
      if (settingsDone && authDone) {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChange((currentUser) => {
      setUser(currentUser);
      authDone = true;
      checkDone();
    });
    
    getOrganizationSettings().then(orgSettings => {
        setSettings(orgSettings);
        // Set dynamic title and favicon
        if (orgSettings.organizationName) {
            document.title = orgSettings.organizationName;
        }
        if (orgSettings.faviconUrl) {
            let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.getElementsByTagName('head')[0].appendChild(link);
            }
            link.href = orgSettings.faviconUrl;
        }
    }).catch(console.error)
      .finally(() => {
        settingsDone = true;
        checkDone();
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
