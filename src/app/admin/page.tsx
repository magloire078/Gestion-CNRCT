
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

import type { User, Role } from "@/lib/data";
import { getUsers, deleteUser } from "@/services/user-service";
import { getRoles, deleteRole } from "@/services/role-service";

import { AddUserSheet } from "@/components/admin/add-user-sheet";
import { AddRoleSheet } from "@/components/admin/add-role-sheet";

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [isUserSheetOpen, setIsUserSheetOpen] = useState(false);
  const [isRoleSheetOpen, setIsRoleSheetOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [userList, roleList] = await Promise.all([getUsers(), getRoles()]);
        setUsers(userList);
        setRoles(roleList);
        setError(null);
      } catch (err) {
        setError("Impossible de charger les données d'administration.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleAddUser = (newUser: User) => {
    setUsers((prev) => [...prev, newUser]);
  };

  const handleAddRole = (newRole: Role) => {
    setRoles((prev) => [...prev, newRole]);
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      try {
        await deleteUser(userId);
        setUsers((prev) => prev.filter((user) => user.id !== userId));
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
        setRoles((prev) => prev.filter((role) => role.id !== roleId));
        toast({ title: "Rôle supprimé", description: "Le rôle a été supprimé avec succès." });
      } catch (err) {
        toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer le rôle." });
      }
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
        </div>
        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">Gestion des utilisateurs</TabsTrigger>
            <TabsTrigger value="roles">Gestion des rôles</TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Utilisateurs</CardTitle>
                <CardDescription>
                  Gérez les utilisateurs de l'application et leurs rôles.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end mb-4">
                  <Button onClick={() => setIsUserSheetOpen(true)}>
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
                      <TableHead>
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
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
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Toggle menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem disabled>Modifier</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteUser(user.id)}>Supprimer</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="roles" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Rôles</CardTitle>
                <CardDescription>
                  Gérez les rôles et leurs permissions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end mb-4">
                  <Button onClick={() => setIsRoleSheetOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ajouter un rôle
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {loading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                        </TableRow>
                      ))
                    ) : (
                      roles.map((role) => (
                        <TableRow key={role.id}>
                          <TableCell className="font-medium">{role.name}</TableCell>
                          <TableCell>{role.permissions.join(", ")}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Toggle menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem disabled>Modifier</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteRole(role.id)}>Supprimer</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <AddUserSheet
        isOpen={isUserSheetOpen}
        onClose={() => setIsUserSheetOpen(false)}
        onAddUser={handleAddUser}
      />
      <AddRoleSheet
        isOpen={isRoleSheetOpen}
        onClose={() => setIsRoleSheetOpen(false)}
        onAddRole={handleAddRole}
      />
    </>
  );
}
