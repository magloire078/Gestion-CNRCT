"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import {
    ScrollText, Search, Filter, Loader2, User, Clock, ArrowRightLeft,
    Plus, Pencil, Trash2, Upload, Download, LogIn, LogOut, ShieldCheck, X
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { subscribeToAuditLog, type AuditLogEntry, type AuditAction, type AuditResource } from "@/services/audit-log-service";
import { cn } from "@/lib/utils";

const ACTION_META: Record<AuditAction, { label: string; icon: any; className: string }> = {
    'create':            { label: 'Création',            icon: Plus,        className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    'update':            { label: 'Modification',        icon: Pencil,      className: 'bg-amber-50 text-amber-700 border-amber-100' },
    'delete':            { label: 'Suppression',         icon: Trash2,      className: 'bg-rose-50 text-rose-700 border-rose-100' },
    'status-change':     { label: 'Changement statut',   icon: ArrowRightLeft, className: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
    'bulk-delete':       { label: 'Suppr. groupée',      icon: Trash2,      className: 'bg-rose-100 text-rose-800 border-rose-200' },
    'export':            { label: 'Export',              icon: Download,    className: 'bg-slate-50 text-slate-700 border-slate-100' },
    'import':            { label: 'Import',              icon: Upload,      className: 'bg-slate-50 text-slate-700 border-slate-100' },
    'permission-change': { label: 'Permissions',         icon: ShieldCheck, className: 'bg-purple-50 text-purple-700 border-purple-100' },
    'login':             { label: 'Connexion',           icon: LogIn,       className: 'bg-blue-50 text-blue-700 border-blue-100' },
    'logout':            { label: 'Déconnexion',         icon: LogOut,      className: 'bg-slate-50 text-slate-500 border-slate-100' },
};

const RESOURCE_META: Record<AuditResource, string> = {
    conflict: 'Conflit',
    mission: 'Mission',
    employee: 'Employé',
    chief: 'Chef',
    village: 'Village',
    heritage: 'Patrimoine',
    document: 'Document',
    leave: 'Congé',
    user: 'Utilisateur',
    role: 'Rôle',
    settings: 'Paramètres',
    other: 'Autre',
};

export default function AuditLogPage() {
    const [entries, setEntries] = useState<AuditLogEntry[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [resourceFilter, setResourceFilter] = useState<string>("all");
    const [actionFilter, setActionFilter] = useState<string>("all");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        const unsub = subscribeToAuditLog(
            (data) => { setEntries(data); setError(null); },
            (err) => { setError(err.message); setEntries([]); },
            { max: 500 },
        );
        return () => unsub();
    }, []);

    const filtered = useMemo(() => {
        if (!entries) return [];
        const q = searchTerm.toLowerCase();
        return entries.filter(e => {
            const matchesQuery = !q ||
                (e.summary || '').toLowerCase().includes(q) ||
                (e.actorName || '').toLowerCase().includes(q) ||
                (e.actorEmail || '').toLowerCase().includes(q) ||
                (e.resourceLabel || '').toLowerCase().includes(q);
            const matchesResource = resourceFilter === "all" || e.resource === resourceFilter;
            const matchesAction = actionFilter === "all" || e.action === actionFilter;
            return matchesQuery && matchesResource && matchesAction;
        });
    }, [entries, searchTerm, resourceFilter, actionFilter]);

    const hasActiveFilters = searchTerm !== "" || resourceFilter !== "all" || actionFilter !== "all";
    const handleResetFilters = () => {
        setSearchTerm("");
        setResourceFilter("all");
        setActionFilter("all");
    };

    const loading = entries === null;

    return (
        <PermissionGuard permission="audit-log:read">
            <div className="flex flex-col gap-6 pb-16">
                <div className="flex items-center justify-between gap-6 flex-wrap px-1">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tighter uppercase text-slate-900 flex items-center gap-3">
                            <ScrollText className="h-10 w-10 text-indigo-600" />
                            Journal des Activités
                        </h1>
                        <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 pl-1">
                            Traçabilité complète des mutations de la plateforme
                        </p>
                    </div>
                </div>

                <Card className="border-none shadow-2xl rounded-3xl overflow-hidden">
                    <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-6 px-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-lg font-black uppercase tracking-tight text-slate-900">Événements</CardTitle>
                                <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">
                                    500 derniers enregistrements — mis à jour en temps réel
                                </CardDescription>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative w-full md:w-72">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Rechercher acteur, ressource, description..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-12 h-11 rounded-xl font-bold text-xs"
                                    />
                                </div>
                                <Select value={resourceFilter} onValueChange={setResourceFilter}>
                                    <SelectTrigger className="w-[160px] h-11 rounded-xl font-black text-[10px] uppercase tracking-widest">
                                        <div className="flex items-center gap-2">
                                            <Filter className="h-3.5 w-3.5" />
                                            <SelectValue placeholder="Ressource" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="font-black text-[10px] uppercase">Toutes ressources</SelectItem>
                                        {Object.entries(RESOURCE_META).map(([k, v]) => <SelectItem key={k} value={k} className="font-bold">{v}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={actionFilter} onValueChange={setActionFilter}>
                                    <SelectTrigger className="w-[180px] h-11 rounded-xl font-black text-[10px] uppercase tracking-widest">
                                        <SelectValue placeholder="Action" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="font-black text-[10px] uppercase">Toutes actions</SelectItem>
                                        {(Object.keys(ACTION_META) as AuditAction[]).map(k => <SelectItem key={k} value={k} className="font-bold">{ACTION_META[k].label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                {hasActiveFilters && (
                                    <Button variant="ghost" onClick={handleResetFilters} className="h-11 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-rose-600 hover:bg-rose-50">
                                        <X className="h-3.5 w-3.5 mr-1.5" /> Réinitialiser
                                    </Button>
                                )}
                            </div>
                        </div>

                        {!loading && (
                            <p className="mt-4 text-xs font-black uppercase tracking-widest text-slate-500">
                                <span className="text-slate-900 tabular-nums">{filtered.length}</span> événement{filtered.length > 1 ? 's' : ''}
                                {hasActiveFilters && <span className="text-slate-400 normal-case font-bold italic ml-2">(filtré sur {entries?.length || 0})</span>}
                            </p>
                        )}
                    </CardHeader>
                    <CardContent className="p-0">
                        {error && (
                            <div className="p-8 text-center text-rose-600 font-bold text-sm">
                                Erreur : {error}
                            </div>
                        )}
                        {loading ? (
                            <div className="p-6 space-y-3">
                                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="p-16 text-center text-slate-400">
                                <ScrollText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p className="font-bold text-sm uppercase tracking-widest">Aucun événement</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {filtered.map(entry => {
                                    const meta = ACTION_META[entry.action] || ACTION_META.update;
                                    const Icon = meta.icon;
                                    const ts = entry.timestamp && isValid(parseISO(entry.timestamp))
                                        ? format(parseISO(entry.timestamp), "dd MMM yyyy à HH:mm", { locale: fr })
                                        : entry.timestamp;
                                    const isExpanded = expandedId === entry.id;
                                    const hasDetails = !!(entry.details || entry.beforeSnapshot || entry.afterSnapshot);
                                    return (
                                        <div
                                            key={entry.id}
                                            className={cn("px-6 py-4 hover:bg-slate-50/50 transition-colors", hasDetails && "cursor-pointer")}
                                            onClick={() => hasDetails && setExpandedId(isExpanded ? null : entry.id)}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 border", meta.className)}>
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-3 flex-wrap">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <Badge variant="outline" className={cn("font-black text-[9px] uppercase tracking-widest border", meta.className)}>
                                                                    {meta.label}
                                                                </Badge>
                                                                <Badge variant="secondary" className="font-black text-[9px] uppercase tracking-widest bg-slate-100 text-slate-600 border-none">
                                                                    {RESOURCE_META[entry.resource] || entry.resource}
                                                                </Badge>
                                                                {entry.resourceLabel && (
                                                                    <span className="text-xs font-black text-slate-900 truncate">{entry.resourceLabel}</span>
                                                                )}
                                                            </div>
                                                            {entry.summary && (
                                                                <p className="text-sm text-slate-700 mt-1 leading-snug">{entry.summary}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col items-end text-right flex-shrink-0">
                                                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                                <Clock className="h-3 w-3" /> {ts}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 mt-0.5">
                                                                <User className="h-3 w-3 text-slate-400" /> {entry.actorName || entry.actorEmail}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {isExpanded && hasDetails && (
                                                        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                                                            {entry.details && (
                                                                <div>
                                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Détails</p>
                                                                    <pre className="text-[11px] font-mono bg-slate-50 p-3 rounded-lg overflow-auto max-h-64 border border-slate-100">
{JSON.stringify(entry.details, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            )}
                                                            {entry.beforeSnapshot && (
                                                                <div>
                                                                    <p className="text-[9px] font-black uppercase tracking-widest text-rose-500 mb-1">Avant</p>
                                                                    <pre className="text-[11px] font-mono bg-rose-50/30 p-3 rounded-lg overflow-auto max-h-64 border border-rose-100">
{JSON.stringify(entry.beforeSnapshot, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            )}
                                                            {entry.afterSnapshot && (
                                                                <div>
                                                                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500 mb-1">Après</p>
                                                                    <pre className="text-[11px] font-mono bg-emerald-50/30 p-3 rounded-lg overflow-auto max-h-64 border border-emerald-100">
{JSON.stringify(entry.afterSnapshot, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PermissionGuard>
    );
}
