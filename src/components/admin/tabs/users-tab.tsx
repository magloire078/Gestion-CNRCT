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
    <Card className="border-border/50 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
      <CardHeader className="bg-muted/30 border-b border-border/10">
        <CardTitle className="text-xl">Gestion des Utilisateurs</CardTitle>
        <CardDescription>Ajoutez, modifiez ou supprimez les utilisateurs de l&apos;application.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-6 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou email..."
              value={userSearch}
              onChange={(e) => { setUserSearch(e.target.value); setUserCurrentPage(1); }}
              className="pl-9 h-10 border-border/50 bg-background/50 focus-visible:ring-primary/20 transition-all"
            />
          </div>
          <Button onClick={onAddUserAction} className="shadow-sm hover:shadow-md transition-all gap-2">
            <PlusCircle className="h-4 w-4" /> Ajouter
          </Button>
        </div>
        <div className="rounded-md border border-border/50 bg-background/40">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[60px]">N°</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Rôle & Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                    <TableCell><div className="flex justify-end gap-2"><Skeleton className="h-8 w-8 rounded-md" /><Skeleton className="h-8 w-8 rounded-md" /></div></TableCell>
                  </TableRow>
                ))
              ) : paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <EmptyState 
                      icon={Search} 
                      message={userSearch ? `Aucun utilisateur trouvé pour "${userSearch}"` : "Aucun utilisateur répertorié."} 
                    />
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user, index) => {
                  const isOnline = user.lastActive && (Date.now() - user.lastActive.toDate().getTime()) < 5 * 60 * 1000;
                  
                  return (
                    <TableRow key={user.id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell className="text-muted-foreground font-medium">
                        {(userCurrentPage - 1) * userItemsPerPage + index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground flex items-center gap-2">
                            {user.name}
                            {isOnline && (
                              <span className="flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                          {user.employeeId && (
                            <p className="text-[10px] text-primary/60 font-medium mt-1 uppercase tracking-tighter">
                              Lié : {employeeMap.get(user.employeeId)?.name || 'N/A'}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          <Badge
                            variant={!user.role ? "destructive" : "secondary"}
                            className={cn(
                              "w-fit font-semibold text-[10px] uppercase tracking-wider py-0.5",
                              !user.role && "gap-1",
                              user.role ? "bg-primary/5 text-primary border-primary/10" : ""
                            )}
                          >
                            {!user.role && <AlertTriangle className="h-3 w-3" />}
                            {user.role?.name || 'Non assigné'}
                          </Badge>
                          {user.resourcePermissions && Object.keys(user.resourcePermissions).length > 0 && (
                            <Badge variant="outline" className="text-[9px] py-0 h-4 border-amber-200 bg-amber-50 text-amber-700 w-fit font-bold">
                              PERMISSIONS CUSTOM
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600" onClick={() => onLinkUserAction(user)}>
                                <Link2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Lier à un employé</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100" onClick={() => onEditRoleAction(user)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Modifier le rôle</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-amber-50 hover:text-amber-600" onClick={() => onEditPermissionsAction(user)}>
                                <ShieldAlert className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Exceptions de permissions</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 hover:text-red-600" onClick={() => onDeleteUserAction(user.id, user.name)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Supprimer l'utilisateur</TooltipContent>
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
        <CardFooter className="bg-muted/10 border-t border-border/10 px-6 py-4">
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
