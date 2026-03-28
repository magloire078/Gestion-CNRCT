
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
      if (isMounted) {
        setUser(currentUser);
        authDone = true;

        // Load organization settings only after we know the auth state
        // This prevents permission errors when not authenticated
        if (!settingsDone) {
          getOrganizationSettings()
            .then(orgSettings => {
              if (isMounted) {
                setSettings(orgSettings);
                settingsDone = true;
                checkDone();
              }
            })
            .catch(err => {
              console.warn("[Auth] Failed to load organization settings:", err);
              if (isMounted) {
                settingsDone = true; // Still mark as done to unblock app loading
                checkDone();
              }
            });
        } else {
          checkDone();
        }
      }
    });

    // Timeout safety: Force loading to false after 8 seconds if somehow stuck
    const timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        console.warn("[Auth] Initialization timeout - forcing loading to false");
        setLoading(false);
      }
    }, 8000);

    return () => {
      isMounted = false;
      unsubscribeAuth();
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const isPublicPage = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname === '/';

    if (!user && !isPublicPage) {
      router.push('/login');
    } else if (user && isPublicPage) {
      router.push('/intranet');
    }
  }, [user, loading, pathname, router]);

  const hasPermission = (permission: string) => {
    if (loading || !user) return false;
    
    // Super-admins/Dirigeants have all permissions (bypass by ID or by specific email for safety)
    if (
      user.roleId === 'dirigeant-president' || 
      user.roleId === 'super-admin' || 
      user.roleId === 'LHcHyfBzile3r0vyFOFb' || // Explicit ID for safety
      user.email === 'magloire078@gmail.com'
    ) return true;

    // 1. Check legacy permissions array
    if (user.permissions?.includes(permission)) return true;

    // 2. Harmonization with new CRUD matrix (resourcePermissions)
    // Pattern: "page:xxx:view" -> check if resource xxx has 'read' access
    if (permission.startsWith('page:') && permission.endsWith(':view')) {
      const resourceId = permission.split(':')[1];
      if (user.resourcePermissions?.[resourceId]?.read) return true;
    }

    // Pattern: "feature:xxx:import" or "feature:xxx:export" -> check 'create' or 'update'
    if (permission.startsWith('feature:')) {
      const parts = permission.split(':');
      const resourceId = parts[1];
      const action = parts[2];
      if (action === 'import' || action === 'export') {
        // Import/Export are usually 'create' or 'update' level permissions
        if (user.resourcePermissions?.[resourceId]?.create || user.resourcePermissions?.[resourceId]?.update) return true;
      }
    }

    return false;
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
