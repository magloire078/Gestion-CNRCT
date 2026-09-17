"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    getResourcePermissions,
    saveAllResourcePermissions,
    syncDefaultPermissionsIfMissing,
    clearUserPermissions,
    getDefaultPermissions,
    PermissionTargetType,
} from '@/services/permission-service';
import type { ResourcePermissions, CrudAction, CrudPermission, ResourceConfig } from '@/types/permissions';
import { RESOURCES_CONFIG, ENTERPRISE_ROLES } from '@/types/permissions';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
    LayoutDashboard, Users, Wallet, CalendarOff, MapPin,
    AlertTriangle, Package, Monitor, Car, Newspaper,
    FolderOpen, PieChart, ClipboardList, LifeBuoy, Crown,
    Map, Bot, Settings, ShieldCheck, ScrollText, Loader2, Save,
    RefreshCw, Fuel, Calculator, Landmark, Scroll, MapPinned, Network, Globe, Undo2,
    Search, CheckCircle2, XCircle, AlertTriangle as AlertTriangleIcon,
    FileBarChart, FileCheck, Users2, Globe2, Wrench,
    ChevronDown, ChevronRight, Check, X, Shield, Filter, Eye,
    Building2, Home, FilePlus, MessageCircle, Mail, Database,
    Lock, Zap, SlidersHorizontal, ArrowUpDown
} from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip';

const ICON_MAP: Record<string, React.ElementType> = {
    LayoutDashboard, Users, Wallet, CalendarOff, MapPin,
    AlertTriangle, Package, Monitor, Car, Newspaper,
    FolderOpen, PieChart, ClipboardList, LifeBuoy, Crown,
    Map, Bot, Settings, ShieldCheck, ScrollText, Fuel,
    Calculator, Landmark, Scroll, MapPinned, Network, Globe,
    FileBarChart, FileCheck, Users2, Globe2, Wrench,
    Building2, Home, FilePlus, MessageCircle, Mail, Database,
    Zap, Shield
};

const ACTION_CONFIG: Record<CrudAction, { label: string; short: string; badgeColor: string; activeBg: string }> = {
    read: {
        label: 'Lecture',
        short: 'L',
        badgeColor: 'text-blue-600 bg-blue-50 border-blue-200',
        activeBg: 'data-[state=checked]:bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.35)]'
    },
    create: {
        label: 'Création',
        short: 'C',
        badgeColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        activeBg: 'data-[state=checked]:bg-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
    },
    update: {
        label: 'Modification',
        short: 'M',
        badgeColor: 'text-amber-600 bg-amber-50 border-amber-200',
        activeBg: 'data-[state=checked]:bg-amber-600 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
    },
    delete: {
        label: 'Suppression',
        short: 'S',
        badgeColor: 'text-rose-600 bg-rose-50 border-rose-200',
        activeBg: 'data-[state=checked]:bg-rose-600 shadow-[0_0_12px_rgba(225,29,72,0.35)]'
    },
};

const CRUD_ACTIONS: CrudAction[] = ['read', 'create', 'update', 'delete'];

function getAccessLevel(perms: ResourcePermissions): { label: string; pct: number; count: number; total: number; color: string } {
    const nonGroupResources = RESOURCES_CONFIG.filter(r => !r.id.startsWith('group:'));
    let totalPossible = 0;
    let trueCount = 0;

    nonGroupResources.forEach(r => {
        const available = r.availableActions.filter(a => CRUD_ACTIONS.includes(a));
        totalPossible += available.length;
        available.forEach(a => {
            if (perms[r.id]?.[a]) {
                trueCount++;
            }
        });
    });

    const pct = totalPossible > 0 ? Math.round((trueCount / totalPossible) * 100) : 0;
    if (pct >= 85) return { label: 'Accès Complet', pct, count: trueCount, total: totalPossible, color: 'bg-emerald-500 text-white' };
    if (pct >= 40) return { label: 'Accès Partiel', pct, count: trueCount, total: totalPossible, color: 'bg-amber-500 text-white' };
    if (pct > 0) return { label: 'Accès Limité', pct, count: trueCount, total: totalPossible, color: 'bg-blue-500 text-white' };
    return { label: 'Aucun Accès', pct: 0, count: 0, total: totalPossible, color: 'bg-rose-500 text-white' };
}

// --- Group Header Row Component ---
interface GroupRowProps {
    group: ResourceConfig;
    isCollapsed: boolean;
    onToggleCollapse: (groupId: string) => void;
    childrenCount: number;
    activePermsCount: number;
    totalGroupPerms: number;
    onGroupAction: (groupId: string, actionType: 'all' | 'read' | 'none') => void;
    isSystem: boolean;
}

const GroupRow = React.memo(function GroupRow({
    group,
    isCollapsed,
    onToggleCollapse,
    childrenCount,
    activePermsCount,
    totalGroupPerms,
    onGroupAction,
    isSystem,
}: GroupRowProps) {
    const Icon = ICON_MAP[group.icon] ?? Shield;

    return (
        <TableRow className="bg-slate-900 border-y border-slate-700 hover:bg-slate-800/90 transition-colors select-none">
            <TableCell colSpan={5} className="py-3 px-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div 
                        onClick={() => onToggleCollapse(group.id)}
                        className="flex items-center gap-3 cursor-pointer group/title flex-1"
                    >
                        <div className="p-1.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 group-hover/title:text-emerald-400 group-hover/title:border-emerald-500/40 transition-colors">
                            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex items-center gap-2.5">
                            <span className="text-xs font-bold uppercase tracking-wider text-white group-hover/title:text-emerald-300 transition-colors">
                                {group.label}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                                {childrenCount} modules
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-400 font-medium mr-2">
                            <span>{activePermsCount} / {totalGroupPerms} droits</span>
                            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                                    style={{ width: `${totalGroupPerms > 0 ? (activePermsCount / totalGroupPerms) * 100 : 0}%` }}
                                />
                            </div>
                        </div>

                        {!isSystem && (
                            <div className="flex items-center gap-1.5">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => { e.stopPropagation(); onGroupAction(group.id, 'all'); }}
                                            className="h-7 px-2 text-[9px] font-bold uppercase tracking-wider bg-slate-800 hover:bg-emerald-950 hover:text-emerald-300 text-slate-300 border-slate-700 hover:border-emerald-600/50 rounded transition-colors"
                                        >
                                            Tout cocher
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-slate-900 text-white border-slate-700 text-[10px] font-bold">
                                        Accorder toutes les actions CRUD pour ce groupe
                                    </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => { e.stopPropagation(); onGroupAction(group.id, 'read'); }}
                                            className="h-7 px-2 text-[9px] font-bold uppercase tracking-wider bg-slate-800 hover:bg-blue-950 hover:text-blue-300 text-slate-300 border-slate-700 hover:border-blue-600/50 rounded transition-colors"
                                        >
                                            Lecture seule
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-slate-900 text-white border-slate-700 text-[10px] font-bold">
                                        Activer uniquement la lecture pour ce groupe
                                    </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => { e.stopPropagation(); onGroupAction(group.id, 'none'); }}
                                            className="h-7 px-2 text-[9px] font-bold uppercase tracking-wider bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 border-slate-700 hover:border-rose-600/50 rounded transition-colors"
                                        >
                                            Décocher
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-slate-900 text-white border-slate-700 text-[10px] font-bold">
                                        Révoquer tous les droits de ce groupe
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        )}
                    </div>
                </div>
            </TableCell>
        </TableRow>
    );
});

// --- Module Row Component ---
interface ModuleRowProps {
    resource: ResourceConfig;
    permissions: CrudPermission;
    onToggle: (resourceId: string, action: CrudAction, value: boolean) => void;
    onToggleEntireModule: (resourceId: string) => void;
    isSystem: boolean;
    isEven: boolean;
    searchQuery?: string;
}

const ModuleRow = React.memo(function ModuleRow({
    resource,
    permissions,
    onToggle,
    onToggleEntireModule,
    isSystem,
    isEven,
    searchQuery
}: ModuleRowProps) {
    const Icon = ICON_MAP[resource.icon] ?? LayoutDashboard;
    const availableActions = resource.availableActions.filter(a => CRUD_ACTIONS.includes(a));
    const allActive = availableActions.length > 0 && availableActions.every(a => permissions[a]);
    const someActive = availableActions.some(a => permissions[a]);

    const highlightText = (text: string, query?: string) => {
        if (!query || !query.trim()) return text;
        const q = query.trim().toLowerCase();
        const index = text.toLowerCase().indexOf(q);
        if (index === -1) return text;
        return (
            <span>
                {text.substring(0, index)}
                <span className="bg-amber-200 text-amber-900 rounded px-0.5">{text.substring(index, index + q.length)}</span>
                {text.substring(index + q.length)}
            </span>
        );
    };

    return (
        <TableRow className={cn(
            "group/row transition-all duration-300 border-b border-slate-100 dark:border-slate-800",
            isEven ? 'bg-white' : 'bg-slate-50/50',
            "hover:bg-blue-50/40"
        )}>
            <TableCell className="py-3.5 pl-12 pr-4 relative">
                {/* Branch connector line */}
                <div className="absolute left-6 top-0 bottom-1/2 w-4 border-l-2 border-b-2 border-slate-200 dark:border-slate-700 rounded-bl-lg pointer-events-none" />
                
                <div className="flex items-center justify-between gap-3 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-300 group-hover/row:scale-105",
                            someActive 
                                ? "bg-slate-900 text-white shadow-sm" 
                                : "bg-slate-100 text-slate-500 border border-slate-200"
                        )}>
                            <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-xs text-slate-900 uppercase tracking-tight">
                                {highlightText(resource.label, searchQuery)}
                            </span>
                            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                                {resource.id}
                            </span>
                        </div>
                    </div>

                    {!isSystem && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onToggleEntireModule(resource.id)}
                                    className={cn(
                                        "h-7 w-7 rounded-md transition-all",
                                        allActive 
                                            ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 opacity-100" 
                                            : "opacity-0 group-hover/row:opacity-100 hover:bg-slate-200 text-slate-600"
                                    )}
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-slate-900 text-white text-[10px] font-bold">
                                {allActive ? "Tout révoquer pour ce module" : "Tout autoriser pour ce module"}
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>
            </TableCell>

            {CRUD_ACTIONS.map(action => {
                const isAvailable = resource.availableActions.includes(action);
                const isChecked = isAvailable && (permissions[action] ?? false);
                const conf = ACTION_CONFIG[action];

                return (
                    <TableCell key={action} className="text-center py-3 px-2">
                        {isAvailable ? (
                            <div className="flex justify-center items-center">
                                <Switch
                                    checked={isChecked}
                                    onCheckedChange={v => onToggle(resource.id, action, v)}
                                    disabled={isSystem}
                                    className={cn(
                                        "transition-all duration-300",
                                        isChecked && conf.activeBg
                                    )}
                                />
                            </div>
                        ) : (
                            <div className="flex justify-center items-center">
                                <span className="h-6 w-6 rounded flex items-center justify-center text-slate-300 font-bold text-xs select-none">
                                    –
                                </span>
                            </div>
                        )}
                    </TableCell>
                );
            })}
        </TableRow>
    );
});

// --- Main Permissions Editor ---
export interface PermissionsEditorProps {
    targetId: string;
    targetType: PermissionTargetType;
    isSystem?: boolean;
    roleName?: string;
    onSave?: () => void;
}

export function PermissionsEditor({ targetId, targetType, isSystem, roleName, onSave }: PermissionsEditorProps) {
    const [permissions, setPermissions] = useState<ResourcePermissions>({});
    const [originalPermissions, setOriginalPermissions] = useState<ResourcePermissions>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'active' | 'inactive'>('all');
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
    const [superAdmin, setSuperAdmin] = useState(false);
    const [superAdminSaving, setSuperAdminSaving] = useState(false);
    const { toast } = useToast();

    // Enregistré immédiatement, sans passer par la barre « Publier les Droits » :
    // ce drapeau ne fait pas partie de la matrice, il la court-circuite.
    const handleToggleSuperAdmin = async (value: boolean) => {
        setSuperAdminSaving(true);
        try {
            const { updateRole } = await import('@/services/role-service');
            await updateRole(targetId, { isSuperAdmin: value });
            setSuperAdmin(value);
            toast({
                title: value ? 'Profil élevé en super-administrateur' : 'Élévation retirée',
                description: value
                    ? 'Ce profil contourne désormais la matrice et accède à tout.'
                    : 'Ce profil repasse sous le contrôle de la matrice des droits.',
            });
        } catch {
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: "Seul un super-administrateur peut modifier ce réglage.",
            });
        } finally {
            setSuperAdminSaving(false);
        }
    };

    const loadPerms = useCallback(async () => {
        setLoading(true);
        try {
            if (targetType === 'role') {
                await syncDefaultPermissionsIfMissing(targetId);
                const perms = await getResourcePermissions(targetId, targetType);
                setPermissions(perms);
                setOriginalPermissions(JSON.parse(JSON.stringify(perms)));

                const { getDoc, doc, db } = await import('@/lib/firebase');
                const roleSnap = await getDoc(doc(db, 'roles', targetId));
                setSuperAdmin(roleSnap.exists() && roleSnap.data()?.isSuperAdmin === true);
            } else {
                const { getDoc, doc } = await import('@/lib/firebase');
                const { db } = await import('@/lib/firebase');
                const userSnap = await getDoc(doc(db, 'users', targetId));
                const roleId = userSnap.exists() ? userSnap.data().roleId : 'employe';
                
                const { getEffectivePermissions } = await import('@/services/permission-service');
                const perms = await getEffectivePermissions(targetId, roleId);
                setPermissions(perms);
                setOriginalPermissions(JSON.parse(JSON.stringify(perms)));
            }
            setDirty(false);
        } catch (err) {
            console.error("Failed to load perms:", err);
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les permissions.' });
        } finally {
            setLoading(false);
        }
    }, [targetId, targetType, toast]);

    useEffect(() => { 
        loadPerms(); 
    }, [loadPerms]);

    const handleToggle = useCallback((resourceId: string, action: CrudAction, value: boolean) => {
        if (isSystem) return;
        setPermissions(prev => ({
            ...prev,
            [resourceId]: {
                ...(prev[resourceId] ?? { read: false, create: false, update: false, delete: false }),
                [action]: value,
                // Cascade: if disabling read, also disable create/update/delete
                ...(action === 'read' && !value ? { create: false, update: false, delete: false } : {}),
                // Cascade: if enabling write actions, automatically enable read
                ...(action !== 'read' && value ? { read: true } : {}),
            },
        }));
        setDirty(true);
    }, [isSystem]);

    const handleToggleEntireModule = useCallback((resourceId: string) => {
        if (isSystem) return;
        const res = RESOURCES_CONFIG.find(r => r.id === resourceId);
        if (!res) return;
        
        const available = res.availableActions.filter(a => CRUD_ACTIONS.includes(a));
        const current = permissions[resourceId] ?? { read: false, create: false, update: false, delete: false };
        const allChecked = available.every(a => current[a]);

        setPermissions(prev => {
            const nextMod: CrudPermission = { read: false, create: false, update: false, delete: false };
            if (!allChecked) {
                available.forEach(a => { nextMod[a] = true; });
            }
            return { ...prev, [resourceId]: nextMod };
        });
        setDirty(true);
    }, [isSystem, permissions]);

    const handleGroupAction = useCallback((groupId: string, actionType: 'all' | 'read' | 'none') => {
        if (isSystem) return;
        const childModules = RESOURCES_CONFIG.filter(r => r.parentId === groupId);
        
        setPermissions(prev => {
            const updated = { ...prev };
            childModules.forEach(mod => {
                const available = mod.availableActions.filter(a => CRUD_ACTIONS.includes(a));
                const modPerm: CrudPermission = { read: false, create: false, update: false, delete: false };
                
                if (actionType === 'all') {
                    available.forEach(a => { modPerm[a] = true; });
                } else if (actionType === 'read') {
                    if (available.includes('read')) {
                        modPerm.read = true;
                    }
                }
                updated[mod.id] = modPerm;
            });
            return updated;
        });
        setDirty(true);
    }, [isSystem]);

    const handleGlobalAction = useCallback((actionType: 'all' | 'read' | 'reset-defaults' | 'clear') => {
        if (isSystem) return;

        if (actionType === 'reset-defaults') {
            const defaults = getDefaultPermissions(targetId);
            setPermissions(defaults);
            setDirty(true);
            toast({ title: 'Rétablissement', description: 'Permissions réinitialisées aux valeurs institutionnelles par défaut.' });
            return;
        }

        setPermissions(prev => {
            const updated: ResourcePermissions = {};
            const modules = RESOURCES_CONFIG.filter(r => !r.id.startsWith('group:'));
            
            modules.forEach(mod => {
                const available = mod.availableActions.filter(a => CRUD_ACTIONS.includes(a));
                const modPerm: CrudPermission = { read: false, create: false, update: false, delete: false };
                
                if (actionType === 'all') {
                    available.forEach(a => { modPerm[a] = true; });
                } else if (actionType === 'read') {
                    if (available.includes('read')) {
                        modPerm.read = true;
                    }
                }
                updated[mod.id] = modPerm;
            });
            return updated;
        });
        setDirty(true);
    }, [isSystem, targetId, toast]);

    const handleCancelChanges = () => {
        setPermissions(JSON.parse(JSON.stringify(originalPermissions)));
        setDirty(false);
        toast({ title: 'Modifications annulées' });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await saveAllResourcePermissions(targetId, permissions, targetType);
            setOriginalPermissions(JSON.parse(JSON.stringify(permissions)));
            setDirty(false);
            toast({ title: 'Permissions enregistrées', description: 'Les droits d\'accès ont été publiés avec succès.' });
            if (onSave) onSave();
        } catch (err) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible d\'enregistrer les modifications.' });
        } finally {
            setSaving(false);
        }
    };

    const handleResetToParentRole = async () => {
        if (targetType !== 'user') return;
        setSaving(true);
        try {
            await clearUserPermissions(targetId);
            setDirty(false);
            toast({ title: 'Permissions réinitialisées', description: 'L\'utilisateur hérite désormais des droits de son profil.' });
            loadPerms();
            if (onSave) onSave();
        } catch (err) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de réinitialiser.' });
        } finally {
            setSaving(false);
        }
    };

    const toggleGroupCollapse = (groupId: string) => {
        setCollapsedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
    };

    // Grouping & hierarchical structure
    const groupedData = useMemo(() => {
        const groups = RESOURCES_CONFIG.filter(r => r.id.startsWith('group:'));
        const q = searchQuery.toLowerCase().trim();

        return groups.map(group => {
            const allChildren = RESOURCES_CONFIG.filter(r => r.parentId === group.id);
            
            // Filter by search query
            let filteredChildren = allChildren;
            if (q) {
                filteredChildren = allChildren.filter(c => 
                    c.label.toLowerCase().includes(q) || 
                    c.id.toLowerCase().includes(q)
                );
            }

            // Filter by access state
            if (filterType === 'active') {
                filteredChildren = filteredChildren.filter(c => {
                    const current = permissions[c.id];
                    return current && Object.values(current).some(Boolean);
                });
            } else if (filterType === 'inactive') {
                filteredChildren = filteredChildren.filter(c => {
                    const current = permissions[c.id];
                    return !current || !Object.values(current).some(Boolean);
                });
            }

            // Stats for this group
            let activeCount = 0;
            let totalPerms = 0;
            allChildren.forEach(child => {
                const available = child.availableActions.filter(a => CRUD_ACTIONS.includes(a));
                totalPerms += available.length;
                available.forEach(a => {
                    if (permissions[child.id]?.[a]) activeCount++;
                });
            });

            return {
                group,
                allChildren,
                filteredChildren,
                activeCount,
                totalPerms,
                isVisible: q ? filteredChildren.length > 0 || group.label.toLowerCase().includes(q) : true,
            };
        }).filter(g => g.isVisible);
    }, [searchQuery, filterType, permissions]);

    const accessLevel = getAccessLevel(permissions);
    const hasNoSpecificPerms = targetType === 'user' && Object.keys(permissions).length === 0;

    if (loading) {
        return (
            <div className="space-y-4 p-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-48 rounded-md" />
                    <Skeleton className="h-8 w-32 rounded-md" />
                </div>
                <div className="space-y-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full rounded-md" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {targetType === 'role' && (
                <div className={cn(
                    "p-4 rounded-lg border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                    superAdmin
                        ? "bg-amber-50 border-amber-300"
                        : "bg-white/70 dark:bg-slate-900/70 border-slate-200/80 dark:border-slate-800"
                )}>
                    <div className="space-y-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <ShieldCheck className={cn("h-4 w-4", superAdmin ? "text-amber-600" : "text-slate-400")} />
                            Super-administrateur
                        </p>
                        <p className="text-[11px] text-slate-500 max-w-xl leading-relaxed">
                            Accorde un accès total, sans passer par la matrice ci-dessous. À réserver aux
                            profils de direction du système. Seul un super-administrateur peut modifier ce réglage.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        {superAdmin && (
                            <Badge className="bg-amber-500 text-white font-bold uppercase tracking-wider text-[10px] py-1 px-3">
                                Accès total
                            </Badge>
                        )}
                        {superAdminSaving && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                        <Switch
                            checked={superAdmin}
                            disabled={superAdminSaving}
                            onCheckedChange={handleToggleSuperAdmin}
                            aria-label="Activer le super-administrateur pour ce profil"
                        />
                    </div>
                </div>
            )}

            {/* Top Stats & Quick Actions Banner */}
            <div className="p-4 rounded-lg bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-md space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className={cn(
                            "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm",
                            accessLevel.color
                        )}>
                            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                            {accessLevel.label} ({accessLevel.pct}%)
                        </div>

                        {isSystem && (
                            <Badge variant="outline" className="bg-slate-900 text-white border-slate-700 font-bold uppercase tracking-wider text-[10px] py-1 px-3 flex items-center gap-1.5">
                                <Lock className="h-3 w-3 text-emerald-400" /> Profil Système Protégé
                            </Badge>
                        )}

                        {targetType === 'user' && !hasNoSpecificPerms && (
                            <Badge className="bg-blue-600 text-white font-bold uppercase tracking-wider text-[10px] py-1 px-3">
                                Dérogation Individuelle Active
                            </Badge>
                        )}
                        
                        <span className="text-xs text-slate-500 font-semibold hidden lg:inline">
                            • {accessLevel.count} sur {accessLevel.total} privilèges activés
                        </span>
                    </div>

                    {/* Global Quick Action Buttons */}
                    {!isSystem && (
                        <div className="flex flex-wrap items-center gap-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleGlobalAction('all')}
                                        className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors shadow-sm"
                                    >
                                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                                        Tout Accorder
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-slate-900 text-white text-[10px] font-bold">
                                    Accorder les droits complets sur l'ensemble des modules
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleGlobalAction('read')}
                                        className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors shadow-sm"
                                    >
                                        <Eye className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                                        Lecture Globale
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-slate-900 text-white text-[10px] font-bold">
                                    Activer la consultation en lecture seule sur tout le système
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleGlobalAction('reset-defaults')}
                                        className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider bg-white hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-sm"
                                    >
                                        <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-slate-600" />
                                        Défaut Rôle
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-slate-900 text-white text-[10px] font-bold">
                                    Réaligner avec le gabarit institutionnel de ce rôle
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleGlobalAction('clear')}
                                        className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 transition-colors shadow-sm"
                                    >
                                        <XCircle className="h-3.5 w-3.5 mr-1.5 text-rose-600" />
                                        Tout Révoquer
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-slate-900 text-white text-[10px] font-bold">
                                    Désactiver tous les accès
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    )}
                </div>

                {/* Search Bar & Filter Chips */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    <div className="relative w-full sm:flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Rechercher une rubrique, un module ou une ressource..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm"
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
                        <Button
                            type="button"
                            size="sm"
                            variant={filterType === 'all' ? 'default' : 'outline'}
                            onClick={() => setFilterType('all')}
                            className={cn(
                                "h-8 px-3 text-[10px] font-bold uppercase tracking-wider rounded-md",
                                filterType === 'all' ? "bg-slate-900 text-white" : "bg-white text-slate-600"
                            )}
                        >
                            Tous
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant={filterType === 'active' ? 'default' : 'outline'}
                            onClick={() => setFilterType('active')}
                            className={cn(
                                "h-8 px-3 text-[10px] font-bold uppercase tracking-wider rounded-md",
                                filterType === 'active' ? "bg-emerald-600 text-white" : "bg-white text-slate-600"
                            )}
                        >
                            Actifs
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant={filterType === 'inactive' ? 'default' : 'outline'}
                            onClick={() => setFilterType('inactive')}
                            className={cn(
                                "h-8 px-3 text-[10px] font-bold uppercase tracking-wider rounded-md",
                                filterType === 'inactive' ? "bg-rose-600 text-white" : "bg-white text-slate-600"
                            )}
                        >
                            Restreints
                        </Button>
                    </div>
                </div>
            </div>

            {/* Matrix Table */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
                <Table>
                    <TableHeader className="bg-slate-900 text-white sticky top-0 z-20 shadow-md">
                        <TableRow className="border-none hover:bg-slate-900">
                            <TableHead className="w-80 py-3.5 pl-6 font-bold text-xs uppercase tracking-wider text-slate-300">
                                Architecture des Droits
                            </TableHead>
                            {CRUD_ACTIONS.map(action => (
                                <TableHead 
                                    key={action} 
                                    className={cn(
                                        "text-center w-36 py-3.5 font-bold text-xs uppercase tracking-wider",
                                        action === 'read' ? 'text-blue-400' :
                                        action === 'create' ? 'text-emerald-400' :
                                        action === 'update' ? 'text-amber-400' :
                                        'text-rose-400'
                                    )}
                                >
                                    {ACTION_CONFIG[action].label}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {groupedData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="py-16 text-center">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                            <Search className="h-6 w-6 text-slate-400" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                                            Aucun module correspondant trouvé
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            Essayez de modifier vos filtres ou vos termes de recherche.
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            groupedData.map(({ group, allChildren, filteredChildren, activeCount, totalPerms }) => {
                                const isCollapsed = !!collapsedGroups[group.id] && !searchQuery;

                                return (
                                    <React.Fragment key={group.id}>
                                        <GroupRow
                                            group={group}
                                            isCollapsed={isCollapsed}
                                            onToggleCollapse={toggleGroupCollapse}
                                            childrenCount={allChildren.length}
                                            activePermsCount={activeCount}
                                            totalGroupPerms={totalPerms}
                                            onGroupAction={handleGroupAction}
                                            isSystem={isSystem ?? false}
                                        />

                                        {!isCollapsed && filteredChildren.map((resource, idx) => (
                                            <ModuleRow
                                                key={resource.id}
                                                resource={resource}
                                                permissions={permissions[resource.id] ?? { read: false, create: false, update: false, delete: false }}
                                                onToggle={handleToggle}
                                                onToggleEntireModule={handleToggleEntireModule}
                                                isSystem={isSystem ?? false}
                                                isEven={idx % 2 === 0}
                                                searchQuery={searchQuery}
                                            />
                                        ))}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Sticky / Floating Changes Actions Bar */}
            {dirty && !isSystem && (
                <div className="sticky bottom-4 z-30 flex items-center justify-between gap-4 p-4 rounded-lg bg-slate-900 text-white shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-3">
                        <span className="h-3 w-3 rounded-full bg-amber-400 animate-ping" />
                        <div className="space-y-0.5">
                            <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                                Modifications non enregistrées
                            </p>
                            <p className="text-[11px] text-slate-400">
                                {roleName ? `Des droits ont été modifiés pour le profil ${roleName}.` : 'Les droits ont été ajustés.'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleCancelChanges}
                            disabled={saving}
                            className="h-9 px-4 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 text-xs font-bold uppercase tracking-wider"
                        >
                            Annuler
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleSave}
                            disabled={saving}
                            className="h-9 px-5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg active:scale-95 flex items-center gap-2"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            <span>{saving ? 'Publication...' : 'Publier les Droits'}</span>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Main PermissionMatrix Component ---
interface PermissionMatrixProps {
    roles?: { id: string; label: string; isSystem?: boolean }[];
    activeRoleId?: string;
    onSelectRole?: (roleId: string) => void;
}

export const PermissionMatrix = React.memo(function PermissionMatrix({ 
    roles: customRoles,
    activeRoleId: controlledRoleId,
    onSelectRole: controlledOnSelectRole
}: PermissionMatrixProps) {
    const rolesToDisplay = useMemo(() => customRoles || ENTERPRISE_ROLES, [customRoles]);
    const [internalRoleId, setInternalRoleId] = useState<string>(rolesToDisplay[0]?.id || 'administrateur');
    const [roleSearch, setRoleSearch] = useState('');

    const currentRoleId = controlledRoleId || internalRoleId;

    const handleSelectRole = (id: string) => {
        if (controlledOnSelectRole) {
            controlledOnSelectRole(id);
        } else {
            setInternalRoleId(id);
        }
    };

    const filteredRoles = useMemo(() => {
        if (!roleSearch.trim()) return rolesToDisplay;
        const q = roleSearch.toLowerCase().trim();
        return rolesToDisplay.filter(r => r.label.toLowerCase().includes(q) || r.id.toLowerCase().includes(q));
    }, [rolesToDisplay, roleSearch]);

    const activeRole = useMemo(() => {
        return rolesToDisplay.find(r => r.id === currentRoleId) || rolesToDisplay[0];
    }, [rolesToDisplay, currentRoleId]);

    if (!rolesToDisplay || rolesToDisplay.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white/40 backdrop-blur-xl rounded-lg border border-white/20 shadow-sm mx-4 my-4">
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                    <ShieldCheck className="h-8 w-8 text-slate-400" />
                </div>
                <p className="font-bold uppercase tracking-wider text-xs text-slate-500 max-w-xs">
                    Aucun profil institutionnel disponible.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4 p-4 md:p-6">
            {/* Role Switcher Toolbar */}
            <div className="space-y-3 pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-md bg-slate-900 text-white shadow-sm">
                            <SlidersHorizontal className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div>
                            <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                                Sélectionner un Profil à Configurer :
                            </span>
                            <span className="text-[11px] text-slate-500 font-bold ml-2">
                                ({filteredRoles.length} {filteredRoles.length > 1 ? 'rôles' : 'rôle'})
                            </span>
                        </div>
                    </div>

                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <Input
                            placeholder="Rechercher / Filtrer les rôles..."
                            value={roleSearch}
                            onChange={(e) => setRoleSearch(e.target.value)}
                            className="pl-9 h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-lg shadow-sm font-medium"
                        />
                        {roleSearch && (
                            <button
                                onClick={() => setRoleSearch('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Fully Visible Wrapped Role Pills Grid */}
                <div className="flex flex-wrap items-center gap-2 p-3 bg-white/50 dark:bg-slate-900/50 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-inner backdrop-blur-md">
                    {filteredRoles.length === 0 ? (
                        <div className="w-full py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Aucun profil ne correspond à votre filtre &quot;{roleSearch}&quot;
                        </div>
                    ) : (
                        filteredRoles.map(role => {
                            const isSelected = role.id === activeRole?.id;
                            return (
                                <button
                                    key={role.id}
                                    type="button"
                                    onClick={() => handleSelectRole(role.id)}
                                    className={cn(
                                        "px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 border shadow-sm select-none",
                                        isSelected
                                            ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-emerald-500/50 scale-[1.02]"
                                            : "bg-white hover:bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 border-slate-200/90 dark:border-slate-700 hover:border-slate-300"
                                    )}
                                >
                                    <span>{role.label}</span>
                                    {role.isSystem && (
                                        <ShieldCheck className={cn("h-3.5 w-3.5 shrink-0", isSelected ? "text-emerald-400" : "text-emerald-600")} />
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Permissions Matrix Editor for the selected role */}
            {activeRole && (
                <div className="animate-in fade-in duration-300">
                    <PermissionsEditor
                        key={activeRole.id}
                        targetId={activeRole.id}
                        targetType="role"
                        isSystem={activeRole.isSystem ?? false}
                        roleName={activeRole.label}
                    />
                </div>
            )}
        </div>
    );
});
