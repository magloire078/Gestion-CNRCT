
"use client";

import { useState, useEffect, useCallback } from 'react';
import {
    getResourcePermissions,
    saveAllResourcePermissions,
    syncDefaultPermissionsIfMissing,
} from '@/services/permission-service';
import type { ResourcePermissions, CrudAction } from '@/types/permissions';
import { RESOURCES_CONFIG, ENTERPRISE_ROLES } from '@/types/permissions';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
    LayoutDashboard, Users, Wallet, CalendarOff, MapPin,
    AlertTriangle, Package, Monitor, Car, Newspaper,
    FolderOpen, PieChart, ClipboardList, LifeBuoy, Crown,
    Map, Bot, Settings, ShieldCheck, ScrollText, Loader2, Save,
    RefreshCw, Fuel,
} from 'lucide-react';
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

interface RolePermissionsEditorProps {
    roleId: string;
    isSystem: boolean;
}

function RolePermissionsEditor({ roleId, isSystem }: RolePermissionsEditorProps) {
    const [permissions, setPermissions] = useState<ResourcePermissions>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);
    const { toast } = useToast();

    const loadPerms = useCallback(async () => {
        setLoading(true);
        try {
            await syncDefaultPermissionsIfMissing(roleId);
            const perms = await getResourcePermissions(roleId);
            setPermissions(perms);
            setDirty(false);
        } catch (err) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les permissions.' });
        } finally {
            setLoading(false);
        }
    }, [roleId, toast]);

    useEffect(() => { loadPerms(); }, [loadPerms]);

    const handleToggle = (resource: string, action: CrudAction, value: boolean) => {
        if (isSystem) return;
        setPermissions(prev => ({
            ...prev,
            [resource]: {
                ...(prev[resource] ?? { read: false, create: false, update: false, delete: false }),
                [action]: value,
                // If we disable read, also disable create/update/delete
                ...(action === 'read' && !value ? { create: false, update: false, delete: false } : {}),
                // If we enable create/update/delete, also enable read
                ...(action !== 'read' && value ? { read: true } : {}),
            },
        }));
        setDirty(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await saveAllResourcePermissions(roleId, permissions);
            setDirty(false);
            toast({ title: 'Permissions enregistrées', description: `Les droits ont été mis à jour avec succès.` });
        } catch (err) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de sauvegarder.' });
        } finally {
            setSaving(false);
        }
    };

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

    return (
        <div className="space-y-4">
            {/* Header bar */}
            <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-2">
                <div className="flex items-center gap-3">
                    <Badge variant={accessLevel.variant}>{accessLevel.label}</Badge>
                    {isSystem && (
                        <Badge variant="secondary" className="gap-1">
                            <ShieldCheck className="h-3 w-3" /> Système — non modifiable
                        </Badge>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={loadPerms} disabled={saving}>
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Actualiser</TooltipContent>
                    </Tooltip>
                    {!isSystem && (
                        <Button onClick={handleSave} disabled={!dirty || saving} size="sm" className="gap-2">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {dirty ? 'Enregistrer les modifications' : 'Aucune modification'}
                        </Button>
                    )}
                </div>
            </div>

            {/* Matrix table */}
            <div className="overflow-auto rounded-lg border">
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
                        {RESOURCES_CONFIG.map((resource, idx) => {
                            const Icon = ICON_MAP[resource.icon] ?? LayoutDashboard;
                            const isEven = idx % 2 === 0;
                            return (
                                <TableRow key={resource.id} className={isEven ? 'bg-background' : 'bg-muted/20'}>
                                    <TableCell>
                                        <div className="flex items-center gap-2 font-medium">
                                            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                                            {resource.label}
                                        </div>
                                    </TableCell>
                                    {CRUD_ACTIONS.map(action => {
                                        const isAvailable = resource.availableActions.includes(action);
                                        const isChecked = isAvailable && (permissions[resource.id]?.[action] ?? false);
                                        return (
                                            <TableCell key={action} className="text-center">
                                                {isAvailable ? (
                                                    <div className="flex justify-center">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div>
                                                                    <Switch
                                                                        checked={isChecked}
                                                                        onCheckedChange={v => handleToggle(resource.id, action, v)}
                                                                        disabled={isSystem}
                                                                        aria-label={`${ACTION_LABELS[action].label} — ${resource.label}`}
                                                                        className={isChecked
                                                                            ? action === 'delete' ? 'data-[state=checked]:bg-red-500'
                                                                                : action === 'create' ? 'data-[state=checked]:bg-green-500'
                                                                                    : action === 'update' ? 'data-[state=checked]:bg-amber-500'
                                                                                        : 'data-[state=checked]:bg-blue-500'
                                                                            : ''
                                                                        }
                                                                    />
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                {ACTION_LABELS[action].label} — {resource.label}
                                                                {isChecked ? ' : Autorisé' : ' : Refusé'}
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
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

export function PermissionMatrix() {
    return (
        <div className="space-y-4">
            <div className="space-y-1">
                <h3 className="text-base font-semibold">Matrice des droits d&apos;accès</h3>
                <p className="text-sm text-muted-foreground">
                    Activez ou désactivez les permissions <span className="font-medium text-blue-500">Lecture</span>,{' '}
                    <span className="font-medium text-green-500">Création</span>,{' '}
                    <span className="font-medium text-amber-500">Modification</span> et{' '}
                    <span className="font-medium text-red-500">Suppression</span> par rôle et par ressource.
                    Les modifications sont actives après enregistrement.
                </p>
            </div>

            <Tabs defaultValue={ENTERPRISE_ROLES[0].id} className="w-full">
                <TabsList className="flex h-auto flex-wrap gap-1 bg-muted/50 p-1">
                    {ENTERPRISE_ROLES.map(role => (
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

                {ENTERPRISE_ROLES.map(role => (
                    <TabsContent key={role.id} value={role.id} className="mt-4">
                        <RolePermissionsEditor roleId={role.id} isSystem={role.isSystem ?? false} />
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
