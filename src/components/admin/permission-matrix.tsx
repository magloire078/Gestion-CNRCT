"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    getResourcePermissions,
    saveAllResourcePermissions,
    syncDefaultPermissionsIfMissing,
    clearUserPermissions,
    PermissionTargetType,
} from '@/services/permission-service';
import type { ResourcePermissions, CrudAction, CrudPermission } from '@/types/permissions';
import { RESOURCES_CONFIG, ENTERPRISE_ROLES } from '@/types/permissions';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
    LayoutDashboard, Users, Wallet, CalendarOff, MapPin,
    AlertTriangle, Package, Monitor, Car, Newspaper,
    FolderOpen, PieChart, ClipboardList, LifeBuoy, Crown,
    Map, Bot, Settings, ShieldCheck, ScrollText, Loader2, Save,
    RefreshCw, Fuel, Calculator, Landmark, Scroll, MapPinned, Network, Globe, Undo2,
    Search, CheckCircle2, XCircle, AlertTriangle as AlertTriangleIcon,
    FileBarChart, FileCheck, Users2, Globe2, Wrench
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
};

const ACTION_LABELS: Record<CrudAction, { label: string; short: string; color: string }> = {
    read: { label: 'Lecture', short: 'L', color: 'text-blue-500' },
    create: { label: 'Création', short: 'C', color: 'text-green-500' },
    update: { label: 'Modification', short: 'M', color: 'text-amber-500' },
    delete: { label: 'Suppression', short: 'S', color: 'text-red-500' },
};

const CRUD_ACTIONS: CrudAction[] = ['read', 'create', 'update', 'delete'];

function getAccessLevel(perms: ResourcePermissions): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
    const all = RESOURCES_CONFIG.flatMap(r =>
        CRUD_ACTIONS.filter(a => r.availableActions.includes(a)).map(a => perms[r.id]?.[a] ?? false)
    );
    const trueCount = all.filter(Boolean).length;
    const pct = all.length > 0 ? trueCount / all.length : 0;
    if (pct >= 0.9) return { label: 'Accès complet', variant: 'default' };
    if (pct >= 0.5) return { label: 'Accès partiel', variant: 'secondary' };
    if (pct > 0) return { label: 'Accès limité', variant: 'outline' };
    return { label: 'Aucun accès', variant: 'destructive' };
}

// --- Sub-component for a single row (Memoized for performance) ---
interface PermissionRowProps {
    resource: typeof RESOURCES_CONFIG[0];
    permissions: CrudPermission;
    onToggle: (resource: string, action: CrudAction, value: boolean) => void;
    isSystem: boolean;
    isEven: boolean;
}

const PermissionRow = React.memo(function PermissionRow({ 
    resource, 
    permissions, 
    onToggle, 
    isSystem, 
    isEven 
}: PermissionRowProps) {
    const Icon = ICON_MAP[resource.icon] ?? LayoutDashboard;
    const isGroup = resource.id.startsWith('group:');
    
    const handleToggleRow = () => {
        if (isSystem || isGroup) return;
        const availableActions = resource.availableActions.filter(a => CRUD_ACTIONS.includes(a));
        const allChecked = availableActions.every(a => permissions[a]);
        availableActions.forEach(a => onToggle(resource.id, a, !allChecked));
    };

    if (isGroup) {
        return (
            <TableRow className="bg-slate-900 border-y border-white/10 hover:bg-black sticky z-10 transition-colors duration-500">
                <TableCell colSpan={5} className="py-6 pl-10">
                    <div className="flex items-center gap-5">
                        <div className="p-3 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-2xl">
                            <Icon className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[12px] font-black uppercase tracking-[0.3em] text-white">
                                {resource.label}
                            </span>
                            <div className="h-0.5 w-12 bg-emerald-500/50 rounded-full" />
                        </div>
                    </div>
                </TableCell>
            </TableRow>
        );
    }

    return (
        <TableRow className={cn(
            "group/row transition-all duration-500 border-white/10",
            isEven ? 'bg-white/50' : 'bg-transparent',
            "hover:bg-blue-50/40"
        )}>
            <TableCell className={cn(
                "py-6 transition-all duration-300 relative",
                resource.parentId ? "pl-16" : "pl-10"
            )}>
                {resource.parentId && (
                    <div className="absolute left-10 top-1/2 -translate-y-1/2 w-4 h-12 border-l-2 border-slate-200/50 rounded-bl-3xl -mt-6 pointer-events-none" />
                )}
                
                <div className="flex items-center justify-between gap-4 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "h-10 w-10 rounded-[1.25rem] flex items-center justify-center transition-all duration-500 group-hover/row:scale-110 group-hover/row:rotate-6 bg-white shadow-sm border border-white/60",
                            isEven ? "bg-white" : "bg-white/80"
                        )}>
                            <Icon className="h-4 w-4 text-slate-500 group-hover/row:text-blue-600 transition-colors" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-sm text-slate-900 uppercase tracking-tight group-hover/row:translate-x-1 transition-transform">
                                {resource.label}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{resource.id.replace('module:', '')}</span>
                        </div>
                    </div>
                    {!isSystem && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 opacity-0 group-hover/row:opacity-100 focus:opacity-100 transition-all duration-500 rounded-[1rem] hover:bg-blue-600 hover:text-white shadow-xl shadow-blue-600/20" 
                                    onClick={handleToggleRow}
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="font-black uppercase tracking-widest text-[9px] bg-slate-900 text-white border-none py-2 px-3">Tout autoriser</TooltipContent>
                        </Tooltip>
                    )}
                </div>
            </TableCell>
            {CRUD_ACTIONS.map(action => {
                const isAvailable = resource.availableActions.includes(action);
                const isChecked = isAvailable && (permissions[action] ?? false);
                return (
                    <TableCell key={action} className="text-center py-4">
                        {isAvailable ? (
                            <div className="flex justify-center">
                                <Switch
                                    checked={isChecked}
                                    onCheckedChange={v => onToggle(resource.id, action, v)}
                                    disabled={isSystem}
                                    className={cn(
                                        "scale-110 transition-all duration-500",
                                        isChecked && {
                                            'data-[state=checked]:bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]': action === 'read',
                                            'data-[state=checked]:bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.4)]': action === 'create',
                                            'data-[state=checked]:bg-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.4)]': action === 'update',
                                            'data-[state=checked]:bg-rose-600 shadow-[0_0_15px_rgba(225,29,72,0.4)]': action === 'delete',
                                        }
                                    )}
                                />
                            </div>
                        ) : (
                            <div className="flex justify-center">
                                <div className="h-10 w-10 rounded-full flex items-center justify-center bg-slate-100/30 text-slate-300 font-black text-xs select-none">✕</div>
                            </div>
                        )}
                    </TableCell>
                );
            })}
        </TableRow>
    );
});

export interface PermissionsEditorProps {
    targetId: string;
    targetType: PermissionTargetType;
    isSystem?: boolean;
    onSave?: () => void;
}

export function PermissionsEditor({ targetId, targetType, isSystem, onSave }: PermissionsEditorProps) {
    const [permissions, setPermissions] = useState<ResourcePermissions>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { toast } = useToast();

    const loadPerms = useCallback(async () => {
        setLoading(true);
        try {
            if (targetType === 'role') {
                await syncDefaultPermissionsIfMissing(targetId);
                const perms = await getResourcePermissions(targetId, targetType);
                setPermissions(perms);
            } else {
                const { getDoc, doc } = await import('@/lib/firebase');
                const { db } = await import('@/lib/firebase');
                const userSnap = await getDoc(doc(db, 'users', targetId));
                const roleId = userSnap.exists() ? userSnap.data().roleId : 'employe';
                
                const { getEffectivePermissions } = await import('@/services/permission-service');
                const perms = await getEffectivePermissions(targetId, roleId);
                setPermissions(perms);
            }
            setDirty(false);
        } catch (err) {
            console.error("Failed to load perms:", err);
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les permissions.' });
        } finally {
            setLoading(false);
        }
    }, [targetId, targetType, toast]);

    useEffect(() => { loadPerms(); }, [loadPerms]);

    const handleToggle = useCallback((resource: string, action: CrudAction, value: boolean) => {
        if (isSystem) return;
        setPermissions(prev => ({
            ...prev,
            [resource]: {
                ...(prev[resource] ?? { read: false, create: false, update: false, delete: false }),
                [action]: value,
                ...(action === 'read' && !value ? { create: false, update: false, delete: false } : {}),
                ...(action !== 'read' && value ? { read: true } : {}),
            },
        }));
        setDirty(true);
    }, [isSystem]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await saveAllResourcePermissions(targetId, permissions, targetType);
            setDirty(false);
            toast({ title: 'Permissions enregistrées', description: `Les droits ont été mis à jour avec succès.` });
            if (onSave) onSave();
        } catch (err) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de sauvegarder.' });
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        if (targetType !== 'user') return;
        setSaving(true);
        try {
            await clearUserPermissions(targetId);
            setDirty(false);
            toast({ title: 'Permissions réinitialisées', description: `L'utilisateur hérite désormais des droits de son groupe.` });
            loadPerms();
            if (onSave) onSave();
        } catch (err) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de réinitialiser.' });
        } finally {
            setSaving(false);
        }
    };

    const orderedResources = React.useMemo(() => {
        const roots = RESOURCES_CONFIG.filter(r => !r.parentId);
        const children = RESOURCES_CONFIG.filter(r => r.parentId);
        const result: typeof RESOURCES_CONFIG = [];
        roots.forEach(root => {
            result.push(root);
            const items = children.filter(c => c.parentId === root.id);
            result.push(...items);
        });
        const addedIds = new Set(result.map(r => r.id));
        const orphans = RESOURCES_CONFIG.filter(r => !addedIds.has(r.id));
        return [...result, ...orphans];
    }, []);

    const filteredResources = React.useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return orderedResources;
        return orderedResources.filter(r => 
            r.label.toLowerCase().includes(q) || 
            r.id.toLowerCase().includes(q)
        );
    }, [orderedResources, searchQuery]);

    const accessLevel = getAccessLevel(permissions);

    if (loading) {
        return (
            <div className="space-y-3 pt-2">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
        );
    }

    const hasNoSpecificPerms = targetType === 'user' && Object.keys(permissions).length === 0;

    return (
        <div className="space-y-10">
            <div className="flex flex-col gap-8">
                <div className="flex flex-wrap items-center justify-between gap-6 p-8 rounded-[3rem] bg-white/40 backdrop-blur-xl border border-white/30 shadow-3xl">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border transition-all duration-500 shadow-sm",
                            hasNoSpecificPerms 
                                ? "bg-slate-100 text-slate-500 border-slate-200" 
                                : accessLevel.variant === 'default' 
                                    ? "bg-emerald-600 text-white border-none shadow-[0_0_20px_rgba(5,150,105,0.4)]"
                                    : accessLevel.variant === 'secondary'
                                        ? "bg-amber-600 text-white border-none shadow-[0_0_20px_rgba(217,119,6,0.4)]"
                                        : "bg-rose-600 text-white border-none shadow-[0_0_20px_rgba(225,29,72,0.4)]"
                        )}>
                            {hasNoSpecificPerms ? 'Protocole Hérité' : accessLevel.label}
                        </div>
                        {isSystem && (
                            <div className="px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-slate-900 text-white border-none gap-2 flex items-center shadow-xl">
                                <ShieldCheck className="h-4 w-4 text-emerald-400" /> Registre Système
                            </div>
                        )}
                        {targetType === 'user' && !hasNoSpecificPerms && (
                            <div className="px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-blue-600 text-white border-none shadow-xl">
                                Exception Active
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        {targetType === 'user' && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-12 px-8 rounded-2xl gap-3 border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-all duration-500 font-black uppercase tracking-widest text-[10px]"
                                        disabled={saving}
                                    >
                                        <Undo2 className={cn("h-4 w-4", saving && "animate-spin")} />
                                        Réinitialiser
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-[4rem] border-white/20 shadow-3xl overflow-hidden p-0 bg-white/95 backdrop-blur-3xl overflow-hidden">
                                    <AlertDialogHeader className="bg-slate-900 p-12 text-white relative">
                                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]" />
                                        <AlertDialogTitle className="flex items-center gap-4 text-3xl font-black uppercase tracking-tighter relative z-10">
                                            <AlertTriangleIcon className="h-10 w-10 text-rose-500" />
                                            Rétablissement
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2 relative z-10 opacity-80">
                                            L'utilisateur héritera à nouveau des droits de son groupe institutionnel par défaut.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="p-10 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                                        <AlertDialogCancel className="rounded-2xl font-black uppercase tracking-widest text-[10px] h-14 px-10 border-slate-200">Annuler</AlertDialogCancel>
                                        <AlertDialogAction 
                                            onClick={handleReset}
                                            className="rounded-2xl font-black bg-rose-600 hover:bg-rose-700 text-white shadow-2xl shadow-rose-500/30 active:scale-95 transition-all text-[10px] h-14 px-12 uppercase tracking-widest"
                                        >
                                            Confirmer
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                        
                        {!isSystem && (
                            <Button 
                                onClick={handleSave} 
                                disabled={!dirty || saving} 
                                size="sm" 
                                className="h-12 px-10 rounded-2xl gap-3 font-black uppercase tracking-[0.2em] text-[10px] bg-slate-900 hover:bg-black text-white shadow-3xl shadow-slate-900/40 active:scale-95 transition-all group"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 group-hover:scale-110 transition-transform" />}
                                Publier les Droits
                            </Button>
                        )}
                    </div>
                </div>

                <div className="relative group/search">
                    <Search className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within/search:text-blue-600 transition-colors duration-500" />
                    <Input 
                        placeholder="RECHERCHER UNE HABILITATION, UN MODULE OU UNE RESSOURCE..." 
                        className="pl-16 h-16 rounded-[2.5rem] bg-white/40 backdrop-blur-xl border-white/30 shadow-2xl focus-visible:ring-blue-500 focus-visible:border-blue-500 font-black uppercase tracking-widest text-[10px] transition-all duration-700 placeholder:text-slate-300"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {hasNoSpecificPerms && (
                <div className="p-8 border border-dashed border-emerald-500/30 rounded-[2.5rem] bg-emerald-500/5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 italic shadow-inner">
                   <span className="flex items-center justify-center gap-3">
                       <ShieldCheck className="h-5 w-5" />
                       Héritage actif — Aucune exception individuelle détectée.
                   </span>
                </div>
            )}

            {/* Matrix table */}
            <div className="max-h-[70vh] overflow-auto rounded-[3rem] border border-white/20 shadow-3xl group/table bg-white/40 backdrop-blur-xl custom-scrollbar relative">
                <Table className="relative">
                    <TableHeader className="sticky top-0 z-30">
                        <TableRow className="bg-slate-900 border-none hover:bg-black transition-colors duration-500">
                            <TableHead className="w-80 py-8 pl-10 font-black text-[11px] uppercase tracking-[0.3em] text-slate-400 border-none">Architecture de Droits</TableHead>
                            {CRUD_ACTIONS.map(action => (
                                <TableHead key={action} className={cn(
                                    "text-center w-40 py-8 font-black text-[11px] uppercase tracking-[0.3em] transition-all duration-500 border-none",
                                    action === 'read' ? 'text-blue-400' :
                                    action === 'create' ? 'text-emerald-400' :
                                    action === 'update' ? 'text-amber-400' :
                                    'text-rose-400'
                                )}>
                                    {ACTION_LABELS[action].label}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody className="relative z-10">
                        {filteredResources.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="py-40 text-center">
                                    <div className="flex flex-col items-center justify-center gap-6">
                                        <div className="h-24 w-24 rounded-[2rem] bg-slate-900/5 flex items-center justify-center shadow-inner">
                                            <Search className="h-10 w-10 text-slate-300 animate-pulse" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Aucun résultat trouvé</p>
                                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">&quot;{searchQuery}&quot;</p>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredResources.map((resource, idx) => (
                                <PermissionRow
                                    key={resource.id}
                                    resource={resource}
                                    permissions={permissions[resource.id] ?? { read: false, create: false, update: false, delete: false }}
                                    onToggle={handleToggle}
                                    isSystem={isSystem ?? false}
                                    isEven={idx % 2 === 0}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

interface PermissionMatrixProps {
    roles?: { id: string; label: string; isSystem?: boolean }[];
}

export function PermissionMatrix({ roles: customRoles }: PermissionMatrixProps) {
    const rolesToDisplay = customRoles || ENTERPRISE_ROLES;

    if (!rolesToDisplay || rolesToDisplay.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-40 text-center bg-white/40 backdrop-blur-xl rounded-[4rem] border border-white/20 shadow-3xl mx-8 my-8">
                <div className="h-24 w-24 rounded-[2.5rem] bg-slate-900/5 flex items-center justify-center mb-8 shadow-inner">
                    <ShieldCheck className="h-12 w-12 text-slate-900 opacity-20" />
                </div>
                <p className="font-black uppercase tracking-[0.3em] text-[11px] text-slate-400 max-w-xs leading-loose">
                    Aucun groupe institutionnel disponible pour la configuration.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            <div className="space-y-2 p-12 pb-0">
                <div className="flex items-center gap-4">
                    <div className="h-1 w-12 bg-emerald-500 rounded-full" />
                    <h3 className="text-3xl font-black uppercase tracking-tighter text-white flex items-center gap-4">
                        <Crown className="h-10 w-10 text-emerald-400" /> 
                        Matrice de Gouvernance
                    </h3>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400/80 pl-20 italic">
                    Contrôle granulaire des accès par palier institutionnel
                </p>
            </div>

            <Tabs defaultValue={rolesToDisplay[0].id} className="w-full">
                <div className="px-12 overflow-x-auto scrollbar-none pb-4">
                    <TabsList className="flex h-auto w-fit gap-3 bg-white/20 p-2.5 rounded-3xl border border-white/30 backdrop-blur-md shadow-2xl">
                        {rolesToDisplay.map(role => (
                            <TabsTrigger
                                key={role.id}
                                value={role.id}
                                className="data-[state=active]:bg-slate-900 data-[state=active]:text-white lg:px-8 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 active:scale-95 shadow-sm border border-transparent data-[state=active]:shadow-2xl data-[state=active]:shadow-slate-900/40"
                            >
                                {role.label}
                                {role.isSystem && <ShieldCheck className="ml-3 h-4 w-4 text-emerald-400" />}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                {rolesToDisplay.map(role => (
                    <TabsContent key={role.id} value={role.id} className="mt-10 p-12 pt-0 outline-none animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <PermissionsEditor targetId={role.id} targetType="role" isSystem={role.isSystem ?? false} />
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
