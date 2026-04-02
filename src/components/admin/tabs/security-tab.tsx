import React, { memo } from "react";
import { PlusCircle, Trash2, ShieldCheck, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
      
      <Card className="border-border/50 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
        <CardHeader className="bg-muted/30 border-b border-border/10">
          <CardTitle className="text-xl">Gestion des Rôles</CardTitle>
          <CardDescription>Définissez les rôles et leurs permissions de base.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex justify-end mb-6">
            <Button onClick={onAddRoleAction} size="sm" className="gap-2">
              <PlusCircle className="h-4 w-4" /> Ajouter un rôle
            </Button>
          </div>
          <div className="rounded-md border border-border/50 bg-background/40">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[60px]">N°</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead className="text-right w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="ml-auto h-8 w-8 rounded-md" /></TableCell>
                    </TableRow>
                  ))
                ) : !roles || roles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <EmptyState icon={Shield} message="Aucun rôle défini." />
                    </TableCell>
                  </TableRow>
                ) : (
                  roles.map((role, index) => (
                    <TableRow key={role.id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-semibold">{role.name}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 hover:text-red-600" onClick={() => onDeleteRoleAction(role.id, role.name)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Supprimer le rôle</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Permissions CRUD */}
      {isSuperAdmin && (
        <Card className="border-primary/20 shadow-md overflow-hidden bg-card/60 backdrop-blur-md">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="flex items-center gap-2 text-xl text-primary">
              <ShieldCheck className="h-6 w-6" />
              Matrice des Permissions Avancées
            </CardTitle>
            <CardDescription className="text-primary/70">
              Contrôlez précisément les droits d&apos;accès par ressource pour chaque rôle.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <PermissionMatrix roles={mappedRolesForMatrix} />
          </CardContent>
        </Card>
      )}
    </div>
  );
});
