
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

import type { User, Role } from "@/lib/data";
import { subscribeToUsers, deleteUser } from "@/services/user-service";
import { subscribeToRoles, deleteRole, getRoles } from "@/services/role-service";

import { AddUserSheet } from "@/components/admin/add-user-sheet";
import { AddRoleSheet } from "@/components/admin/add-role-sheet";
import { ImportDataCard } from "@/components/admin/import-data-card";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [isAddUserSheetOpen, setIsAddUserSheetOpen] = useState(false);
  const [isAddRoleSheetOpen, setIsAddRoleSheetOpen] = useState(false);
  
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'user' | 'role'; name: string } | null>(null);

  useEffect(() => {
    async function fetchData() {
        setLoading(true);
        try {
            const allRoles = await getRoles();
            const rolesMap = new Map(allRoles.map(r => [r.id, r]));

            const unsubscribeUsers = subscribeToUsers(
              (userList) => {
                const usersWithRoles = userList.map(user => ({
                    ...user,
                    role: rolesMap.get(user.roleId) || null,
                }));
                setUsers(usersWithRoles);
                if (roles.length > 0 || userList.length === 0) setLoading(false);
              },
              (err) => {
                setError("Impossible de charger les utilisateurs.");
                console.error(err);
                setLoading(false);
              }
            );

            const unsubscribeRoles = subscribeToRoles(
              (roleList) => {
                setRoles(roleList);
                // Check loading state based on both users and roles
              },
              (err) => {
                setError("Impossible de charger les rôles.");
                console.error(err);
                setLoading(false);
              }
            );
            
            return () => {
              unsubscribeUsers();
              unsubscribeRoles();
            };

        } catch (err) {
            setError("Impossible de charger les données initiales.");
            console.error(err);
            setLoading(false);
        }
    }

    const unsubscribers = fetchData();

    return () => {
        unsubscribers.then(cleanup => cleanup && cleanup());
    };
  }, []);

  useEffect(() => {
    // If both subscriptions have run at least once, we can consider loading finished.
    if(users.length >= 0 && roles.length >= 0) {
        setLoading(false);
    }
  }, [users, roles]);


  const handleAddUser = (newUser: User) => {
    setIsAddUserSheetOpen(false);
    toast({
      title: "Utilisateur ajouté",
      description: `${newUser.name} a été ajouté avec succès.`,
    });
  };

  const handleAddRole = (newRole: Role) => {
    setIsAddRoleSheetOpen(false);
     toast({
      title: "Rôle ajouté",
      description: `Le rôle ${newRole.name} a été ajouté avec succès.`,
    });
  };
  
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
        if (deleteTarget.type === 'user') {
            await deleteUser(deleteTarget.id);
            toast({ title: "Utilisateur supprimé", description: "L'utilisateur a été supprimé avec succès." });
        } else if (deleteTarget.type === 'role') {
            await deleteRole(deleteTarget.id);
            toast({ title: "Rôle supprimé", description: "Le rôle a été supprimé avec succès." });
        }
    } catch (err) {
        toast({ 
            variant: "destructive", 
            title: "Erreur", 
            description: `Impossible de supprimer ${deleteTarget.type === 'user' ? "l'utilisateur" : "le rôle"}.` 
        });
    } finally {
        setDeleteTarget(null);
    }
  };


  return (
    <>
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
        
        <ImportDataCard />

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
              <CardHeader>
              <CardTitle>Gestion des Utilisateurs</CardTitle>
              <CardDescription>
                  Ajoutez ou supprimez les utilisateurs de l'application.
              </CardDescription>
              </CardHeader>
              <CardContent>
              <div className="flex justify-end mb-4">
                  <Button onClick={() => setIsAddUserSheetOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Ajouter un utilisateur
                  </Button>
              </div>
              {error && <p className="text-destructive text-center py-4">{error}</p>}
              <Table>
                  <TableHeader>
                  <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                  </TableHeader>
                  <TableBody>
                  {loading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                      </TableRow>
                      ))
                  ) : (
                      users.map((user) => (
                      <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.role?.name || 'Non assigné'}</TableCell>
                          <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ id: user.id, type: 'user', name: user.name })}>
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Supprimer</span>
                              </Button>
                          </TableCell>
                      </TableRow>
                      ))
                  )}
                  </TableBody>
              </Table>
              </CardContent>
          </Card>

          <Card>
              <CardHeader>
              <CardTitle>Gestion des Rôles</CardTitle>
              <CardDescription>
                  Définissez les rôles et leurs permissions.
              </CardDescription>
              </CardHeader>
              <CardContent>
              <div className="flex justify-end mb-4">
                  <Button onClick={() => setIsAddRoleSheetOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Ajouter un rôle
                  </Button>
              </div>
              {error && <p className="text-destructive text-center py-4">{error}</p>}
              <Table>
                  <TableHeader>
                  <TableRow>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                  </TableHeader>
                  <TableBody>
                  {loading ? (
                      Array.from({ length: 2 }).map((_, i) => (
                      <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                      </TableRow>
                      ))
                  ) : (
                      roles.map((role) => (
                      <TableRow key={role.id}>
                          <TableCell className="font-medium">{role.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{role.permissions.join(', ')}</TableCell>
                          <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ id: role.id, type: 'role', name: role.name })}>
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Supprimer</span>
                              </Button>
                          </TableCell>
                      </TableRow>
                      ))
                  )}
                  </TableBody>
              </Table>
              </CardContent>
          </Card>
        </div>

        <AddUserSheet
          isOpen={isAddUserSheetOpen}
          onClose={() => setIsAddUserSheetOpen(false)}
          onAddUser={handleAddUser}
        />
        <AddRoleSheet
          isOpen={isAddRoleSheetOpen}
          onClose={() => setIsAddRoleSheetOpen(false)}
          onAddRole={handleAddRole}
          roles={roles}
        />
      </div>
      
       <ConfirmationDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={`Supprimer ${deleteTarget?.type === 'user' ? 'l\'Utilisateur' : 'le Rôle'}`}
        description={`Êtes-vous sûr de vouloir supprimer "${deleteTarget?.name}" ? Cette action est irréversible.`}
      />
    </>
  );
}
