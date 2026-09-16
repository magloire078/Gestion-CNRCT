"use client";

import React, { memo, useState, useMemo } from "react";
import { 
  PlusCircle, Trash2, ShieldCheck, Shield, Users, 
  Search, SlidersHorizontal, Lock, CheckCircle2, ShieldAlert
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PermissionMatrix } from "../permission-matrix";
import { EmptyState } from "../empty-state";
import { SyncRolesCard } from "../sync-roles-card";
import type { Role, User } from "@/lib/data";

interface SecurityTabProps {
  roles: Role[];
  users?: User[];
  loading: boolean;
  currentUser: User | null;
  onAddRoleAction: () => void;
  onDeleteRoleAction: (id: string, name: string) => void;
  mappedRolesForMatrix: { id: string; label: string; isSystem: boolean }[];
}

export const SecurityTab = memo(function SecurityTab({
  roles,
  users = [],
  loading,
  currentUser,
  onAddRoleAction,
  onDeleteRoleAction,
  mappedRolesForMatrix
}: SecurityTabProps) {
  const isSuperAdmin = currentUser?.roleId === 'LHcHyfBzile3r0vyFOFb' || currentUser?.roleId === 'super-admin';
  const [roleSearch, setRoleSearch] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<string>(mappedRolesForMatrix[0]?.id || 'administrateur');

  // Compute stats
  const stats = useMemo(() => {
    const total = roles.length;
    const system = mappedRolesForMatrix.filter(r => r.isSystem).length;
    const custom = total - system;
    const totalUsers = users.length;
    return { total, system, custom, totalUsers };
  }, [roles, mappedRolesForMatrix, users]);

  // Compute user count per role
  const userCountPerRole = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach(u => {
      if (u.roleId) {
        counts[u.roleId] = (counts[u.roleId] || 0) + 1;
      }
    });
    return counts;
  }, [users]);

  // Filter roles in table
  const filteredRoles = useMemo(() => {
    if (!roleSearch.trim()) return roles;
    const q = roleSearch.toLowerCase().trim();
    return roles.filter(r => r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q));
  }, [roles, roleSearch]);

  const handleConfigureRole = (roleId: string) => {
    setSelectedRoleId(roleId);
    const matrixEl = document.getElementById('permissions-matrix-section');
    if (matrixEl) {
      matrixEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 rounded-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-white/20 shadow-sm flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Profils</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white">{loading ? '...' : stats.total}</p>
          </div>
        </Card>

        <Card className="p-4 rounded-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-white/20 shadow-sm flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Rôles Système</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white">{loading ? '...' : stats.system}</p>
          </div>
        </Card>

        <Card className="p-4 rounded-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-white/20 shadow-sm flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-lg bg-blue-500/15 text-blue-600 border border-blue-500/30 flex items-center justify-center shrink-0 shadow-sm">
            <SlidersHorizontal className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Rôles Custom</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white">{loading ? '...' : stats.custom}</p>
          </div>
        </Card>

        <Card className="p-4 rounded-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-white/20 shadow-sm flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-lg bg-purple-500/15 text-purple-600 border border-purple-500/30 flex items-center justify-center shrink-0 shadow-sm">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Comptes Utilisateurs</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white">{loading ? '...' : stats.totalUsers}</p>
          </div>
        </Card>
      </div>

      {/* Sync Profile Card */}
      <SyncRolesCard />
      
      {/* Role Directory Table */}
      <Card className="border-white/20 shadow-md overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-lg transition-all duration-500">
        <CardHeader className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-bold uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600" />
              Répertoire des Rôles & Habilitations
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Gérez les statuts d'accès, les privilèges et les profils institutionnels.
            </CardDescription>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Rechercher un rôle..."
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                className="pl-8 h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-md"
              />
            </div>

            <Button 
              onClick={onAddRoleAction} 
              className="h-9 px-4 bg-slate-900 hover:bg-black text-white rounded-md font-bold uppercase tracking-wider text-xs shadow-md active:scale-95 transition-all gap-1.5 shrink-0"
            >
              <PlusCircle className="h-4 w-4 text-emerald-400" /> 
              Initialiser un Rôle
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-900/5 dark:bg-slate-800/50">
                <TableRow className="border-b border-slate-100 dark:border-slate-800">
                  <TableHead className="w-16 text-center font-bold uppercase text-[10px] tracking-wider text-slate-500 py-3">Code</TableHead>
                  <TableHead className="py-3 font-bold uppercase text-[10px] tracking-wider text-slate-900 dark:text-white">Label Institutionnel</TableHead>
                  <TableHead className="py-3 font-bold uppercase text-[10px] tracking-wider text-slate-500">Catégorie</TableHead>
                  <TableHead className="py-3 font-bold uppercase text-[10px] tracking-wider text-slate-500 text-center">Utilisateurs</TableHead>
                  <TableHead className="text-right py-3 font-bold uppercase text-[10px] tracking-wider text-slate-500 pr-5">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i} className="border-b border-slate-100 dark:border-slate-800">
                      <TableCell><Skeleton className="h-4 w-8 mx-auto rounded" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-48 rounded" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20 rounded" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-12 mx-auto rounded" /></TableCell>
                      <TableCell className="text-right pr-5"><Skeleton className="ml-auto h-8 w-24 rounded" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredRoles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center">
                      <EmptyState icon={Shield} message="Aucun rôle ne correspond à vos critères de recherche." />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRoles.map((role, index) => {
                    const mappedRole = mappedRolesForMatrix.find(r => r.id === role.id);
                    const isSystem = mappedRole?.isSystem || ['admin', 'super-admin'].includes(role.id);
                    const userCount = userCountPerRole[role.id] || 0;
                    const isSelectedInMatrix = selectedRoleId === role.id;
                    
                    return (
                      <TableRow 
                        key={role.id} 
                        className={cn(
                          "group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800",
                          isSelectedInMatrix && "bg-emerald-50/30 dark:bg-emerald-950/20"
                        )}
                      >
                        <TableCell className="text-center font-mono font-bold text-slate-400 text-xs py-3">
                          {(index + 1).toString().padStart(2, '0')}
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-tight">
                              {role.name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {role.id}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          {isSystem ? (
                            <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider bg-slate-900 text-white border-slate-700 gap-1">
                              <Lock className="h-2.5 w-2.5 text-emerald-400" /> Système
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border-blue-200">
                              Personnalisé
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold",
                            userCount > 0 
                              ? "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200" 
                              : "text-slate-400 bg-slate-50"
                          )}>
                            <Users className="h-3 w-3" />
                            {userCount}
                          </span>
                        </TableCell>
                        <TableCell className="text-right pr-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {isSuperAdmin && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleConfigureRole(role.id)}
                                className={cn(
                                  "h-8 px-2.5 text-[10px] font-bold uppercase tracking-wider gap-1.5 rounded-md transition-all",
                                  isSelectedInMatrix
                                    ? "bg-slate-900 text-white hover:bg-black border-slate-900"
                                    : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                                )}
                              >
                                <SlidersHorizontal className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Matrice</span>
                              </Button>
                            )}

                            {!isSystem && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-md hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-200 transition-colors" 
                                    onClick={() => onDeleteRoleAction(role.id, role.name)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="font-bold uppercase tracking-wider text-[9px] bg-slate-900 text-white py-1 px-2">
                                  Supprimer le rôle
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Matrix Section */}
      {isSuperAdmin && (
        <div id="permissions-matrix-section" className="scroll-mt-6">
          <Card className="border-white/20 shadow-lg overflow-hidden bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-lg relative">
            <CardHeader className="bg-slate-900 p-5 text-white relative">
              <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-emerald-500/15 to-transparent pointer-events-none" />
              
              <div className="flex items-center gap-3.5 relative z-10">
                <div className="p-2.5 rounded-lg bg-white/10 border border-white/20 shadow-sm backdrop-blur-md">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="space-y-0.5">
                  <CardTitle className="text-lg font-bold uppercase tracking-tight">
                    Matrice des Accès Granulaire
                  </CardTitle>
                  <CardDescription className="text-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Configuration en direct des privilèges CRUD par module et ressource
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <PermissionMatrix 
                roles={mappedRolesForMatrix} 
                activeRoleId={selectedRoleId}
                onSelectRole={setSelectedRoleId}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
});
