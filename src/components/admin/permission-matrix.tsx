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
            <TableRow className="bg-slate-900 border-y border-slate-800 hover:bg-slate-900/95 sticky z-10">
                <TableCell colSpan={5} className="py-4 pl-4">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                            <Icon className="h-4 w-4 text-indigo-400" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">
                            {resource.label}
                        </span>
                    </div>
                </TableCell>
            </TableRow>
        );
    }

    return (
        <TableRow className={cn(
            "group/row transition-colors",
            isEven ? 'bg-white' : 'bg-slate-50/50',
            "hover:bg-indigo-50/30"
        )}>
            <TableCell className={cn(
                "py-4 transition-all duration-300",
                resource.parentId ? "pl-12" : "pl-6"
            )}>
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                        {resource.parentId && (
                            <div className="w-4 h-4 border-l-2 border-b-2 border-slate-200 rounded-bl-lg -mt-2 mr-1" />
                        )}
                        <div className={cn(
                            "h-7 w-7 rounded-lg flex items-center justify-center transition-all group-hover/row:scale-110",
                            isEven ? "bg-slate-100" : "bg-white"
                        )}>
                            <Icon className="h-3.5 w-3.5 text-slate-500 group-hover/row:text-indigo-600" />
                        </div>
                        <span className="font-bold text-sm text-slate-700 tracking-tight">{resource.label}</span>
                    </div>
                    {!isSystem && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 opacity-0 group-hover/row:opacity-100 focus:opacity-100 transition-all rounded-lg hover:bg-indigo-100/50" 
                            onClick={handleToggleRow}
                        >
                            <CheckCircle2 className="h-3 w-3 text-indigo-600" />
                        </Button>
                    )}
                </div>
            </TableCell>
            {CRUD_ACTIONS.map(action => {
                const isAvailable = resource.availableActions.includes(action);
                const isChecked = isAvailable && (permissions[action] ?? false);
                return (
                    <TableCell key={action} className="text-center py-2">
                        {isAvailable ? (
                            <div className="flex justify-center">
                                <Switch
                                    checked={isChecked}
                                    onCheckedChange={v => onToggle(resource.id, action, v)}
                                    disabled={isSystem}
                                    className={cn(
                                        "scale-90 transition-all duration-300",
                                        isChecked && {
                                            'data-[state=checked]:bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.2)]': action === 'read',
                                            'data-[state=checked]:bg-emerald-600 shadow-[0_0_10px_rgba(5,150,105,0.2)]': action === 'create',
                                            'data-[state=checked]:bg-amber-600 shadow-[0_0_10px_rgba(217,119,6,0.2)]': action === 'update',
                                            'data-[state=checked]:bg-rose-600 shadow-[0_0_10px_rgba(225,29,72,0.2)]': action === 'delete',
                                        }
                                    )}
                                />
                            </div>
                        ) : (
                            <span className="text-slate-200 text-xs font-black select-none">✕</span>
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

    const filteredResources = searchQuery.trim() === ''
        ? orderedResources
        : orderedResources.filter(r => 
            r.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
            r.id.toLowerCase().includes(searchQuery.toLowerCase())
          );

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
        <div className="space-y-4">
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-[2rem] bg-indigo-50/50 border border-indigo-100/50 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all shadow-sm",
                            hasNoSpecificPerms 
                                ? "bg-slate-100 text-slate-500 border-slate-200" 
                                : accessLevel.variant === 'default' 
                                    ? "bg-emerald-500 text-white border-emerald-400"
                                    : accessLevel.variant === 'secondary'
                                        ? "bg-amber-500 text-white border-amber-400"
                                        : "bg-rose-500 text-white border-rose-400"
                        )}>
                            {hasNoSpecificPerms ? 'Héritage Groupe' : accessLevel.label}
                        </div>
                        {isSystem && (
                            <div className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white border border-slate-800 gap-1.5 flex items-center">
                                <ShieldCheck className="h-3 w-3 text-indigo-400" /> Système
                            </div>
                        )}
                        {targetType === 'user' && !hasNoSpecificPerms && (
                            <div className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white border border-indigo-500">
                                Exception Individuelle
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {targetType === 'user' && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-9 px-4 rounded-xl gap-2 border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all font-bold text-xs"
                                        disabled={saving}
                                    >
                                        <Undo2 className={`h-3.5 w-3.5 ${saving ? 'animate-spin' : ''}`} />
                                        Rétablir le groupe
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="flex items-center gap-2 text-xl font-black">
                                            <AlertTriangleIcon className="h-5 w-5 text-amber-600" />
                                            Confirmer la réinitialisation
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="font-medium text-slate-500">
                                            Attention : Cela supprimera toutes les exceptions de permissions pour cet utilisateur. Il héritera à nouveau des droits de son groupe.
                                            Cette action est irréversible.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="rounded-xl font-bold">Annuler</AlertDialogCancel>
                                        <AlertDialogAction 
                                            onClick={handleReset}
                                            className="rounded-xl font-black bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-200"
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
                                className="h-9 px-6 rounded-xl gap-2 font-black text-xs bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                            >
                                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                Enregistrer
                            </Button>
                        )}
                    </div>
                </div>

                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <Input 
                        placeholder="Rechercher une ressource par nom ou identifiant..." 
                        className="pl-11 h-12 rounded-2xl bg-white border-slate-200 shadow-sm focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {hasNoSpecificPerms && (
                <div className="p-4 border border-dashed rounded-lg bg-muted/30 text-center text-sm text-muted-foreground italic">
                    Cet employé n&apos;a pas de permissions spécifiques. Il utilise les droits de son groupe par défaut.
                    Modifiez la matrice ci-dessous pour créer une exception.
                </div>
            )}

            {/* Matrix table */}
            <div className="max-h-[60vh] overflow-auto rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 group/table bg-white ring-1 ring-slate-900/[0.05]">
                <Table className="relative">
                    <TableHeader className="sticky top-0 z-20">
                        <TableRow className="bg-slate-900 border-none hover:bg-slate-900 transition-none">
                            <TableHead className="w-52 py-6 pl-8 font-black text-[10px] uppercase tracking-widest text-slate-400">Objet de Droits</TableHead>
                            {CRUD_ACTIONS.map(action => (
                                <TableHead key={action} className={cn(
                                    "text-center w-32 py-6 font-black text-[10px] uppercase tracking-widest transition-colors",
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
                    <TableBody>
                        {filteredResources.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-48 text-center transition-all">
                                    <div className="flex flex-col items-center justify-center gap-3 opacity-50">
                                        <Search className="h-8 w-8 text-slate-300" />
                                        <p className="text-sm font-bold text-slate-400 italic">Aucune ressource trouvée pour &quot;{searchQuery}&quot;</p>
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
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border rounded-lg bg-muted/10">
                <ShieldCheck className="h-10 w-10 mb-2 opacity-20" />
                <p>Aucun groupe disponible pour la configuration.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="space-y-1">
                <h3 className="text-base font-semibold italic text-primary/80 flex items-center gap-2">
                    <Crown className="h-4 w-4" /> Administration des Profils (Groupes)
                </h3>
                <p className="text-sm text-muted-foreground">
                    Définissez les droits globaux appliqués à tous les membres d&apos;un groupe.
                </p>
            </div>

            <Tabs defaultValue={rolesToDisplay[0].id} className="w-full">
                <TabsList className="flex h-auto flex-wrap gap-1 bg-muted/50 p-1">
                    {rolesToDisplay.map(role => (
                        <TabsTrigger
                            key={role.id}
                            value={role.id}
                            className="data-[state=active]:bg-background data-[state=active]:shadow text-xs"
                        >
                            {role.label}
                            {role.isSystem && <ShieldCheck className="ml-1 h-3 w-3 text-primary" />}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {rolesToDisplay.map(role => (
                    <TabsContent key={role.id} value={role.id} className="mt-4">
                        <PermissionsEditor targetId={role.id} targetType="role" isSystem={role.isSystem ?? false} />
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
