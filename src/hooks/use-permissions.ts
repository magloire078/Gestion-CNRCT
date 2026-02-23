
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { getResourcePermissions } from '@/services/permission-service';
import type { ResourcePermissions, CrudAction } from '@/types/permissions';
import { RESOURCES_CONFIG } from '@/types/permissions';

interface UsePermissionsReturn {
    permissions: ResourcePermissions;
    loading: boolean;
    can: (resource: string, action: CrudAction) => boolean;
    refresh: () => void;
}

const emptyPermissions: ResourcePermissions = Object.fromEntries(
    RESOURCES_CONFIG.map(r => [r.id, { read: false, create: false, update: false, delete: false }])
);

export function usePermissions(): UsePermissionsReturn {
    const { user } = useAuth();
    const [permissions, setPermissions] = useState<ResourcePermissions>(emptyPermissions);
    const [loading, setLoading] = useState(true);

    const loadPermissions = useCallback(async () => {
        if (!user?.roleId) {
            setPermissions(emptyPermissions);
            setLoading(false);
            return;
        }
        try {
            const perms = await getResourcePermissions(user.roleId);
            setPermissions(perms);
        } catch (err) {
            console.warn('[usePermissions] Failed to load permissions:', err);
            setPermissions(emptyPermissions);
        } finally {
            setLoading(false);
        }
    }, [user?.roleId]);

    useEffect(() => {
        loadPermissions();
    }, [loadPermissions]);

    const can = useCallback((resource: string, action: CrudAction): boolean => {
        // Super Admins always have full access
        if (user?.roleId === 'LHcHyfBzile3r0vyFOFb' || user?.roleId === 'super-admin') return true;
        const perm = permissions[resource];
        if (!perm) return false;
        return perm[action] === true;
    }, [permissions, user?.roleId]);

    return { permissions, loading, can, refresh: loadPermissions };
}
