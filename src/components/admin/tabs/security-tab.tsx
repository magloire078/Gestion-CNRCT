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
    <div className="space-y-12">
      <SyncRolesCard />
      
      <Card className="border-white/20 shadow-3xl overflow-hidden bg-white/40 backdrop-blur-xl rounded-[3rem] transition-all duration-700 hover:border-white/30">
        <CardHeader className="p-10 pb-6 relative overflow-hidden">
          {/* Subtle Institutional Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px]" />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Sécurité & Gouvernance</CardTitle>
              <CardDescription className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Gestion des Rôles</CardDescription>
            </div>
            <Button 
                onClick={onAddRoleAction} 
                className="h-14 px-10 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl active:scale-95 transition-all gap-3 group"
            >
              <PlusCircle className="h-5 w-5 group-hover:rotate-90 transition-transform duration-500" /> 
              Initialiser un Rôle
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="px-10 pb-10 pt-4 relative z-10">
          <div className="rounded-[2rem] border border-white/40 bg-white/20 overflow-hidden shadow-inner backdrop-blur-sm">
            <Table>
              <TableHeader className="bg-slate-900/5">
                <TableRow className="hover:bg-transparent border-white/20">
                  <TableHead className="w-[100px] text-center font-black uppercase text-[10px] tracking-[0.25em] text-slate-400 py-6">Code</TableHead>
                  <TableHead className="py-6 font-black uppercase text-[10px] tracking-[0.25em] text-slate-900">Label Institutionnel</TableHead>
                  <TableHead className="text-right py-6 font-black uppercase text-[10px] tracking-[0.25em] text-slate-400 pr-10">Protocole</TableHead>
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
                    <TableCell colSpan={3} className="py-32 text-center">
                      <EmptyState icon={Shield} message="Aucun rôle institutionnel défini dans le registre." />
                    </TableCell>
                  </TableRow>
                ) : (
                  roles.map((role, index) => {
                    const mappedRole = mappedRolesForMatrix.find(r => r.id === role.id);
                    const isSystem = mappedRole?.isSystem || ['admin', 'super-admin'].includes(role.id);
                    
                    return (
                      <TableRow key={role.id} className="group hover:bg-white/40 transition-all duration-500 border-white/10">
                        <TableCell className="text-center font-black text-slate-300 group-hover:text-blue-600 transition-colors uppercase tracking-widest text-xs">
                          {(index + 1).toString().padStart(2, '0')}
                        </TableCell>
                        <TableCell className="py-6">
                          <div className="flex items-center gap-3">
                              <span className="font-black text-slate-900 text-base uppercase tracking-tight group-hover:translate-x-1 transition-transform">
                                  {role.name}
                              </span>
                              {isSystem && (
                                  <Badge variant="outline" className="text-[8px] font-black uppercase tracking-[0.2em] bg-blue-500/5 text-blue-600 border-blue-200">System</Badge>
                              )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-10 py-6">
                          {!isSystem && (
                            <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0 duration-500">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-10 w-10 rounded-[1.25rem] bg-white shadow-sm border border-white/60 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all duration-300" 
                                    onClick={() => onDeleteRoleAction(role.id, role.name)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="font-black uppercase tracking-widest text-[9px] bg-slate-900 text-white border-none py-2 px-3">
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
        <Card className="border-white/20 shadow-3xl overflow-hidden bg-white/60 backdrop-blur-xl rounded-[3.5rem] relative">
          <CardHeader className="bg-slate-900 p-12 text-white relative">
            {/* Background design element */}
            <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-emerald-500/20 to-transparent pointer-events-none" />
            
            <div className="flex items-center gap-6 relative z-10">
                <div className="p-5 rounded-[1.75rem] bg-white/10 border border-white/20 shadow-2xl backdrop-blur-md">
                    <ShieldCheck className="h-10 w-10 text-emerald-400" />
                </div>
                <div className="space-y-1">
                    <CardTitle className="text-4xl font-black uppercase tracking-tighter">
                      Matrice des Accès
                    </CardTitle>
                    <CardDescription className="text-slate-400 font-black uppercase tracking-[0.25em] text-[10px] flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
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
