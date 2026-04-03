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
    
    const handleToggleRow = () => {
        if (isSystem) return;
        const allChecked = resource.availableActions.every(a => permissions[a]);
        resource.availableActions.forEach(a => onToggle(resource.id, a, !allChecked));
    };

    return (
        <TableRow className={cn(
            isEven ? 'bg-background' : 'bg-muted/10',
            resource.id.startsWith('group:') ? 'bg-slate-50/80 border-t-2 border-slate-100' : ''
        )}>
            <TableCell className={cn(
                "py-3",
                resource.parentId ? "pl-10" : "pl-4",
                resource.id.startsWith('group:') ? "bg-slate-50/50" : ""
            )}>
                <div className="flex items-center justify-between gap-2">
                    <div className={cn(
                        "flex items-center gap-2",
                        resource.id.startsWith('group:') ? "font-black text-slate-900 text-[11px] uppercase tracking-widest" : "font-medium text-sm text-slate-700"
                    )}>
                        {resource.parentId && <span className="text-slate-300 font-mono">↳</span>}
                        <Icon className={cn("h-4 w-4 shrink-0", resource.id.startsWith('group:') ? "text-slate-900" : "text-slate-400")} />
                        <span>{resource.label}</span>
                    </div>
                    {!isSystem && !resource.id.startsWith('group:') && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity" 
                                    onClick={handleToggleRow}
                                >
                                    <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="text-[10px] font-bold">Tout cocher / décocher pour cette ligne</TooltipContent>
                        </Tooltip>
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
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div>
                                            <Switch
                                                checked={isChecked}
                                                onCheckedChange={v => onToggle(resource.id, action, v)}
                                                disabled={isSystem}
                                                className={cn(
                                                    "scale-75 origin-center",
                                                    isChecked
                                                        ? action === 'delete' ? 'data-[state=checked]:bg-red-500'
                                                            : action === 'create' ? 'data-[state=checked]:bg-green-500'
                                                                : action === 'update' ? 'data-[state=checked]:bg-amber-500'
                                                                    : 'data-[state=checked]:bg-blue-500'
                                                        : ''
                                                )}
                                            />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {ACTION_LABELS[action].label} — {resource.label}
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        ) : (
                            <span className="text-muted-foreground/40 text-xs">—</span>
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
            <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-4 py-2">
                    <div className="flex items-center gap-3">
                        <Badge variant={hasNoSpecificPerms ? 'outline' : accessLevel.variant}>
                            {hasNoSpecificPerms ? 'Héritage Groupe' : accessLevel.label}
                        </Badge>
                        {isSystem && (
                            <Badge variant="secondary" className="gap-1 font-normal opacity-80">
                                <ShieldCheck className="h-3 w-3" /> Système
                            </Badge>
                        )}
                        {targetType === 'user' && !hasNoSpecificPerms && (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                            Droits personnalisés
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {targetType === 'user' ? (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-8 gap-2 border border-dashed hover:bg-amber-50 hover:text-amber-700"
                                        disabled={saving}
                                    >
                                        <RefreshCw className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
                                        <span className="text-xs">Rétablir le groupe</span>
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="flex items-center gap-2">
                                            <AlertTriangleIcon className="h-5 w-5 text-amber-600" />
                                            Confirmer la réinitialisation
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Attention : Cela supprimera toutes les exceptions de permissions pour cet utilisateur. Il héritera à nouveau des droits de son groupe.
                                            Cette action est irréversible.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction 
                                            onClick={handleReset}
                                            className="bg-amber-600 hover:bg-amber-700 text-white"
                                        >
                                            Confirmer
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        ) : (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8" 
                                        onClick={loadPerms} 
                                        disabled={saving}
                                    >
                                        <RefreshCw className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    Actualiser depuis la base de données
                                </TooltipContent>
                            </Tooltip>
                        )}
                        
                        {!isSystem && (
                            <Button onClick={handleSave} disabled={!dirty || saving} size="sm" className="h-8 gap-2">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Enregistrer
                            </Button>
                        )}
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                        placeholder="Rechercher une ressource (ex: Congés, Paie...)" 
                        className="pl-9 bg-muted/20 border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary/20"
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
            <div className="overflow-auto rounded-lg border group/table">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/40">
                            <TableHead className="w-52 font-semibold">Ressource</TableHead>
                            {CRUD_ACTIONS.map(action => (
                                <TableHead key={action} className={`text-center w-28 font-semibold ${ACTION_LABELS[action].color}`}>
                                    {ACTION_LABELS[action].label}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredResources.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic">
                                    Aucune ressource ne correspond à votre recherche.
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
