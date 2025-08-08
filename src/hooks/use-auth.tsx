
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
// import { onAuthStateChange } from '@/services/auth-service'; // Temporarily disabled
import type { User, Role } from '@/lib/data';
import { getRoles } from '@/services/role-service';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Mock Auth ---
let mockUser: User | null = {
    id: 'user1',
    name: 'Magloire Dja',
    email: 'magloire078@gmail.com',
    photoUrl: 'https://placehold.co/100x100.png',
    roleId: 'administrateur',
    role: { id: 'administrateur', name: 'Administrateur', permissions: [] }, // Role will be enriched later
    permissions: [], // Permissions will be enriched later
};

const onAuthStateChange = (callback: (user: User | null) => void) => {
    // Immediately call back with the mock user
    const enrichUser = async () => {
        if (mockUser) {
            const roles = await getRoles();
            const userRole = roles.find(r => r.id === mockUser?.roleId);
            if (userRole) {
                mockUser.role = userRole;
                mockUser.permissions = userRole.permissions;
            }
        }
        callback(mockUser);
    }
    enrichUser();

    // Return a dummy unsubscribe function
    return () => {};
};

export const signIn = async (email: string, password: string) => {
    // Simulate a successful login
    return Promise.resolve(mockUser);
}

export const signOut = async () => {
    mockUser = null;
    return Promise.resolve();
}
// --- End Mock Auth ---


export function AuthProvider({ children }: { children: ReactNode }) {
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
      if (!user) return false;
      // For mock, admin has all permissions
      if (user.roleId === 'administrateur') return true;
      if (!user.permissions) return false;
      return user.permissions.includes(permission);
  }

  const value = { user, loading, hasPermission };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
