import React, { useState, useMemo, memo } from "react";
import { Search, PlusCircle, Link2, Pencil, ShieldAlert, Trash2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PaginationControls } from "@/components/common/pagination-controls";
import { EmptyState } from "../empty-state";
import { cn } from "@/lib/utils";
import type { User, Employe } from "@/lib/data";

interface UsersTabProps {
  users: User[];
  loading: boolean;
  employeeMap: Map<string, Employe>;
  onAddUserAction: () => void;
  onLinkUserAction: (user: User) => void;
  onEditRoleAction: (user: User) => void;
  onEditPermissionsAction: (user: User) => void;
  onDeleteUserAction: (id: string, name: string) => void;
}

export const UsersTab = memo(function UsersTab({
  users,
  loading,
  employeeMap,
  onAddUserAction,
  onLinkUserAction,
  onEditRoleAction,
  onEditPermissionsAction,
  onDeleteUserAction
}: UsersTabProps) {
  const [userSearch, setUserSearch] = useState("");
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const [userItemsPerPage, setUserItemsPerPage] = useState(10);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const q = userSearch.toLowerCase().trim();
    if (!q) return users;
    return users.filter(u =>
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (userCurrentPage - 1) * userItemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + userItemsPerPage);
  }, [filteredUsers, userCurrentPage, userItemsPerPage]);

  const totalUserPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredUsers.length / userItemsPerPage));
  }, [filteredUsers, userItemsPerPage]);

  return (
    <Card className="border-white/20 shadow-3xl overflow-hidden bg-white/40 backdrop-blur-xl rounded-[3rem] transition-all duration-700 hover:border-white/30">
      <CardHeader className="p-10 pb-6 relative overflow-hidden">
        {/* Subtle Institutional Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px]" />
        
        <div className="flex items-center justify-between relative z-10">
          <div className="space-y-1">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Registre des Accès</CardTitle>
            <CardDescription className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Utilisateurs</CardDescription>
          </div>
          <Button 
            onClick={onAddUserAction} 
            className="h-14 px-10 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl active:scale-95 transition-all gap-3 group"
          >
            <PlusCircle className="h-5 w-5 group-hover:rotate-90 transition-transform duration-500" /> 
            Nouveau Compte
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="px-10 pb-10 pt-4 relative z-10">
        <div className="flex items-center justify-between mb-10 gap-6">
          <div className="relative flex-1 group/search">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within/search:text-blue-600 transition-colors duration-500" />
            <Input
              placeholder="RECHERCHER UN IDENTIFIANT OU COLLABORATEUR..."
              value={userSearch}
              onChange={(e) => { setUserSearch(e.target.value); setUserCurrentPage(1); }}
              className="pl-14 h-14 border-white/40 bg-white/30 backdrop-blur-sm rounded-2xl focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-all font-black uppercase tracking-widest text-[10px] shadow-inner placeholder:text-slate-400/50"
            />
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/40 bg-white/20 overflow-hidden shadow-inner backdrop-blur-sm">
          <Table>
            <TableHeader className="bg-slate-900/5">
              <TableRow className="hover:bg-transparent border-white/20">
                <TableHead className="w-[100px] text-center font-black uppercase text-[10px] tracking-[0.25em] text-slate-400 py-6">Code</TableHead>
                <TableHead className="py-6 font-black uppercase text-[10px] tracking-[0.25em] text-slate-900">Collaborateur</TableHead>
                <TableHead className="py-6 font-black uppercase text-[10px] tracking-[0.25em] text-slate-900">Rang & Accès</TableHead>
                <TableHead className="text-right py-6 font-black uppercase text-[10px] tracking-[0.25em] text-slate-400 pr-10">Protocole</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-white/10">
                    <TableCell><Skeleton className="h-4 w-6 mx-auto rounded-full" /></TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <Skeleton className="h-6 w-48 rounded-lg" />
                        <Skeleton className="h-4 w-64 rounded-lg opacity-50" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-8 w-32 rounded-xl" /></TableCell>
                    <TableCell><div className="flex justify-end gap-2 pr-6"><Skeleton className="h-10 w-10 rounded-xl" /><Skeleton className="h-10 w-10 rounded-xl" /></div></TableCell>
                  </TableRow>
                ))
              ) : paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-32">
                    <EmptyState 
                      icon={Search} 
                      message={userSearch ? `AUCUNE DONNÉE POUR "${userSearch.toUpperCase()}"` : "LE REGISTRE DES UTILISATEURS EST VIDE."} 
                    />
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user, index) => {
                  const isOnline = user.lastActive && (Date.now() - user.lastActive.toDate().getTime()) < 5 * 60 * 1000;
                  
                  return (
                    <TableRow key={user.id} className="group hover:bg-white/40 transition-all duration-500 border-white/10">
                      <TableCell className="text-center font-black text-slate-300 group-hover:text-blue-600 transition-colors uppercase tracking-widest text-xs">
                        {((userCurrentPage - 1) * userItemsPerPage + index + 1).toString().padStart(2, '0')}
                      </TableCell>
                      <TableCell className="py-6">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 text-base uppercase tracking-tight flex items-center gap-3 group-hover:translate-x-1 transition-transform">
                            {user.name}
                            {isOnline && (
                                <Tooltip>
                                    <TooltipTrigger>
                                        <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-pulse" />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-emerald-900 border-none text-white font-black text-[10px] uppercase py-2 px-3">Live</TooltipContent>
                                </Tooltip>
                            )}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 opacity-70">{user.email}</span>
                          {user.employeeId && (
                            <div className="flex items-center gap-2 mt-3">
                                <Badge variant="outline" className="text-[8px] px-2.5 py-1 bg-blue-500/5 text-blue-600 border-blue-200 font-black uppercase tracking-[0.15em] shadow-sm">
                                    Compte Lié : {employeeMap.get(user.employeeId)?.name || 'N/A'}
                                </Badge>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2.5">
                          <Badge
                            variant={!user.role ? "destructive" : "secondary"}
                            className={cn(
                              "w-fit font-black text-[10px] uppercase tracking-[0.2em] py-1.5 px-4 shadow-2xl",
                              !user.role ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-slate-900 text-white border-none"
                            )}
                          >
                            {!user.role && <AlertTriangle className="h-3.5 w-3.5 mr-2" />}
                            {user.role?.name || 'ACCÈS RESTREINT'}
                          </Badge>
                          {user.resourcePermissions && Object.keys(user.resourcePermissions).length > 0 && (
                            <Badge variant="outline" className="text-[8px] py-1 px-3 border-amber-200 bg-amber-50 text-amber-700 w-fit font-black uppercase tracking-[0.15em] shadow-sm">
                              Exceptions Actives
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-10 py-6">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0 duration-500">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-[1.25rem] bg-white shadow-sm border border-white/60 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all duration-300" onClick={() => onLinkUserAction(user)}>
                                <Link2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="font-black uppercase tracking-widest text-[9px] bg-slate-900 text-white border-none py-2 px-3">Liaison RH</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-[1.25rem] bg-white shadow-sm border border-white/60 hover:bg-slate-900 hover:text-white hover:border-slate-800 transition-all duration-300" onClick={() => onEditRoleAction(user)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="font-black uppercase tracking-widest text-[9px] bg-slate-900 text-white border-none py-2 px-3">Éditer Rang</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-[1.25rem] bg-white shadow-sm border border-white/60 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-all duration-300" onClick={() => onEditPermissionsAction(user)}>
                                <ShieldAlert className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="font-black uppercase tracking-widest text-[9px] bg-slate-900 text-white border-none py-2 px-3">Habilitations</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-[1.25rem] bg-white shadow-sm border border-white/60 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all duration-300" onClick={() => onDeleteUserAction(user.id, user.name)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="font-black uppercase tracking-widest text-[9px] bg-slate-900 text-white border-none py-2 px-3">Suppression</TooltipContent>
                          </Tooltip>
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
      {!loading && filteredUsers.length > userItemsPerPage && (
        <CardFooter className="bg-slate-900/5 border-t border-white/20 px-10 py-6">
          <PaginationControls
            currentPage={userCurrentPage}
            totalPages={totalUserPages}
            onPageChange={setUserCurrentPage}
            itemsPerPage={userItemsPerPage}
            onItemsPerPageChange={setUserItemsPerPage}
            totalItems={filteredUsers.length}
          />
        </CardFooter>
      )}
    </Card>
  );
});
