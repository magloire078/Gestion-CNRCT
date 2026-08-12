
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChange } from '@/services/auth-service';
import { updateUserActiveStatus } from '@/services/user-service';
import type { User, OrganizationSettings } from '@/lib/data';
import { getOrganizationSettings } from '@/services/organization-service';
import { mapPermissionToCrud } from '@/services/permission-service';

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

    // Load organization settings in parallel without blocking auth
    getOrganizationSettings()
      .then(orgSettings => {
        if (isMounted) {
          setSettings(orgSettings);
        }
      })
      .catch(err => {
        console.warn("[Auth] Failed to load organization settings:", err);
      });

    // Subscribe to auth state changes
    const unsubscribeAuth = onAuthStateChange((currentUser) => {
      if (isMounted) {
        setUser(currentUser);
        setLoading(false);
      }
    });

    // Timeout safety: Force loading to false after 15 seconds only if auth state was never received
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        setLoading(prevLoading => {
          if (prevLoading) {
            console.warn("[Auth] Initialization timeout (15s) - unblocking UI.");
            import("@/hooks/use-toast").then(({ toast }) => {
              toast({
                variant: "destructive",
                title: "Problème de connexion de session",
                description: "Votre navigateur ou bloqueur de publicité semble restreindre l'accès à Firestore/Auth. Veuillez autoriser les cookies et le stockage tiers si vous rencontrez des difficultés.",
                duration: 8000,
              });
            }).catch(console.error);
            return false;
          }
          return false;
        });
      }
    }, 15000);

    return () => {
      isMounted = false;
      unsubscribeAuth();
      clearTimeout(timeoutId);
    };
  }, []);

  // Activity Tracking (Heartbeat)
  useEffect(() => {
    if (!user) return;

    // Initial check-in
    updateUserActiveStatus(user.id, true).catch(e => console.warn("[Auth] Heartbeat failed:", e));

    // Heartbeat every 2 minutes
    const interval = setInterval(() => {
      updateUserActiveStatus(user.id, true).catch(e => console.warn("[Auth] Heartbeat failed:", e));
    }, 2 * 60 * 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateUserActiveStatus(user.id, true).catch(e => console.warn("[Auth] Heartbeat failed:", e));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Try to mark as offline on close (experimental)
      updateUserActiveStatus(user.id, false).catch(() => {});
    };
  }, [user?.id]);

  useEffect(() => {
    if (loading) return;

    const isPublicPage = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname === '/';

    if (!user && !isPublicPage && pathname !== '/budget') {
      router.push('/login');
    } else if (user && isPublicPage) {
      router.push('/intranet');
    }
  }, [user, loading, pathname, router]);

    const hasPermission = React.useCallback((permission: string) => {
    if (loading || !user) return false;
    
    // Super-admins/Dirigeants have all permissions (bypass by ID or by specific email for safety)
    if (
      user.roleId === 'dirigeant-president' || 
      user.roleId === 'super-admin' || 
      user.roleId === 'LHcHyfBzile3r0vyFOFb' || // Super Administrateur ID
      user.email === 'magloire078@gmail.com'
    ) return true;

    // 1. Check legacy permissions array (always takes priority)
    if (user.permissions?.includes(permission)) return true;

    // 2. Map the permission string to a CRUD action on a resource
    const mapped = mapPermissionToCrud(permission);
    if (!mapped) return false;

    const { resourceId, action } = mapped;

    // 3. Check for User Exceptions first (overrides)
    const userOverrides = user.resourcePermissions || {};
    if (userOverrides[resourceId]) {
      return userOverrides[resourceId][action] === true;
    }

    // 4. Fallback to Role Permissions
    const rolePermissions = user.role?.resourcePermissions || {};
    if (rolePermissions[resourceId]) {
      return rolePermissions[resourceId][action] === true;
    }

    return false;
  }, [loading, user]);

  const value = React.useMemo(() => ({ 
    user, 
    loading, 
    hasPermission, 
    settings 
  }), [user, loading, hasPermission, settings]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
