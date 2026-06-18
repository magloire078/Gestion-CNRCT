import React, { memo } from "react";
import { PlusCircle, Trash2, ShieldCheck, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PermissionMatrix } from "../permission-matrix";
import { EmptyState } from "../empty-state";
import { SyncRolesCard } from "../sync-roles-card";
import type { Role, User } from "@/lib/data";

interface SecurityTabProps {
  roles: Role[];
  loading: boolean;
  currentUser: User | null;
  onAddRoleAction: () => void;
  onDeleteRoleAction: (id: string, name: string) => void;
  mappedRolesForMatrix: { id: string; label: string; isSystem: boolean }[];
}

export const SecurityTab = memo(function SecurityTab({
  roles,
  loading,
  currentUser,
  onAddRoleAction,
  onDeleteRoleAction,
  mappedRolesForMatrix
}: SecurityTabProps) {
  const isSuperAdmin = currentUser?.roleId === 'LHcHyfBzile3r0vyFOFb' || currentUser?.roleId === 'super-admin';

  return (
    <div className="space-y-6">
      <SyncRolesCard />
      
      <Card className="border-white/20 shadow-md overflow-hidden bg-white/40 backdrop-blur-xl rounded-lg transition-all duration-700 hover:border-white/30">
        <CardHeader className="p-4 pb-4 relative overflow-hidden flex flex-row items-center justify-between">
          {/* Subtle Institutional Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px]" />
          
          <div className="space-y-1 relative z-10">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Sécurité & Gouvernance</CardTitle>
            <CardDescription className="text-xl font-bold tracking-tight text-slate-900 uppercase">Gestion des Rôles</CardDescription>
          </div>
          <Button 
              onClick={onAddRoleAction} 
              className="h-10 px-4 bg-slate-900 hover:bg-black text-white rounded-md font-bold uppercase tracking-wider text-xs shadow-md active:scale-95 transition-all gap-2 relative z-10"
          >
            <PlusCircle className="h-4 w-4" /> 
            Initialiser un Rôle
          </Button>
        </CardHeader>
        
        <CardContent className="px-4 pb-4 pt-0 relative z-10">
          <div className="rounded-lg border border-white/40 bg-white/20 overflow-x-auto shadow-inner backdrop-blur-sm">
            <Table>
              <TableHeader className="bg-slate-900/5">
                <TableRow className="hover:bg-transparent border-white/20">
                  <TableHead className="w-[80px] text-center font-bold uppercase text-[10px] tracking-wider text-slate-500 py-3">Code</TableHead>
                  <TableHead className="py-3 font-bold uppercase text-[10px] tracking-wider text-slate-900">Label Institutionnel</TableHead>
                  <TableHead className="text-right py-3 font-bold uppercase text-[10px] tracking-wider text-slate-500 pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-white/10">
                      <TableCell><Skeleton className="h-4 w-6 mx-auto rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-64 rounded-xl" /></TableCell>
                      <TableCell className="text-right pr-10"><Skeleton className="ml-auto h-10 w-10 rounded-[1.25rem]" /></TableCell>
                    </TableRow>
                  ))
                ) : !roles || roles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-12 text-center">
                      <EmptyState icon={Shield} message="Aucun rôle institutionnel défini dans le registre." />
                    </TableCell>
                  </TableRow>
                ) : (
                  roles.map((role, index) => {
                    const mappedRole = mappedRolesForMatrix.find(r => r.id === role.id);
                    const isSystem = mappedRole?.isSystem || ['admin', 'super-admin'].includes(role.id);
                    
                    return (
                      <TableRow key={role.id} className="group hover:bg-white/40 transition-all duration-500 border-white/10">
                        <TableCell className="text-center font-bold text-slate-400 uppercase tracking-widest text-xs py-2">
                          {(index + 1).toString().padStart(2, '0')}
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm uppercase tracking-tight group-hover:translate-x-1 transition-transform">
                                  {role.name}
                              </span>
                              {isSystem && (
                                  <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-widest bg-blue-500/5 text-blue-600 border-blue-200">System</Badge>
                              )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-4 py-2">
                          {!isSystem && (
                            <div className="flex justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-lg bg-white shadow-sm border border-white/60 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all duration-300" 
                                    onClick={() => onDeleteRoleAction(role.id, role.name)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="font-bold uppercase tracking-widest text-[9px] bg-slate-900 text-white border-none py-1 px-2">
                                    Révocation de Rang
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          )}
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

      {/* Permissions CRUD */}
      {isSuperAdmin && (
        <Card className="border-white/20 shadow-md overflow-hidden bg-white/60 backdrop-blur-xl rounded-lg relative">
          <CardHeader className="bg-slate-900 p-6 text-white relative">
            {/* Background design element */}
            <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-emerald-500/20 to-transparent pointer-events-none" />
            
            <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 rounded-lg bg-white/10 border border-white/20 shadow-md backdrop-blur-md">
                    <ShieldCheck className="h-6 w-6 text-emerald-400" />
                </div>
                <div className="space-y-1">
                    <CardTitle className="text-xl font-bold uppercase tracking-tight">
                      Matrice des Accès
                    </CardTitle>
                    <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Configuration Granulaire Hyper-Sécurisée
                    </CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <PermissionMatrix roles={mappedRolesForMatrix} />
          </CardContent>
        </Card>
      )}
    </div>
  );
});
