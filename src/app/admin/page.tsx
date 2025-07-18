
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
import { subscribeToUsers, addUser, deleteUser } from "@/services/user-service";
import { subscribeToRoles, addRole, deleteRole } from "@/services/role-service";

import { AddUserSheet } from "@/components/admin/add-user-sheet";
import { AddRoleSheet } from "@/components/admin/add-role-sheet";

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [isAddUserSheetOpen, setIsAddUserSheetOpen] = useState(false);
  const [isAddRoleSheetOpen, setIsAddRoleSheetOpen] = useState(false);
  
  useEffect(() => {
    setLoading(true);
    const unsubscribeUsers = subscribeToUsers(
      (userList) => {
        setUsers(userList);
        setError(null);
        if(!loading) setLoading(false);
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
        setError(null);
        if(!loading) setLoading(false);
      },
      (err) => {
        setError("Impossible de charger les rôles.");
        console.error(err);
        setLoading(false);
      }
    );

    Promise.all([
      new Promise(resolve => setTimeout(resolve, 500)) // To avoid flash of loading
    ]).then(() => {
        setLoading(false);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeRoles();
    };
  }, []);

  const handleAddUser = (newUser: User) => {
    // The user is added via service, and the UI will update via subscription
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

  const handleDeleteUser = async (userId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      try {
        await deleteUser(userId);
        toast({ title: "Utilisateur supprimé", description: "L'utilisateur a été supprimé avec succès." });
      } catch (err) {
        toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer l'utilisateur." });
      }
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce rôle ?")) {
      try {
        await deleteRole(roleId);
        toast({ title: "Rôle supprimé", description: "Le rôle a été supprimé avec succès." });
      } catch (err) {
        toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer le rôle." });
      }
    }
  };


  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
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
                        <TableCell>{user.role}</TableCell>
                        <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)}>
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
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteRole(role.id)}>
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
  );
}
