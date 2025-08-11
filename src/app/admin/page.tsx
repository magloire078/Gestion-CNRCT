
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
import { PlusCircle, Trash2, Pencil, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

import type { User, Role, Department } from "@/lib/data";
import { subscribeToUsers, deleteUser, updateUser } from "@/services/user-service";
import { subscribeToRoles, deleteRole, updateRole } from "@/services/role-service";
import { subscribeToDepartments, addDepartment, updateDepartment, deleteDepartment } from "@/services/department-service";

import { AddUserSheet } from "@/components/admin/add-user-sheet";
import { AddRoleSheet } from "@/components/admin/add-role-sheet";
import { ImportDataCard } from "@/components/admin/import-data-card";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { DepartmentDialog } from "@/components/admin/department-dialog";
import { EditUserRoleDialog } from "@/components/admin/edit-user-role-dialog";
import { EditRoleSheet } from "@/components/admin/edit-role-sheet";

export default function AdminPage() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [roles, setRoles] = useState<Role[] | null>(null);
  const [departments, setDepartments] = useState<Department[] | null>(null);

  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [isAddUserSheetOpen, setIsAddUserSheetOpen] = useState(false);
  const [isAddRoleSheetOpen, setIsAddRoleSheetOpen] = useState(false);
  const [isEditRoleSheetOpen, setIsEditRoleSheetOpen] = useState(false);
  const [isDepartmentDialogOpen, setIsDepartmentDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);

  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'user' | 'role' | 'department'; name: string } | null>(null);

  useEffect(() => {
    const rolesMap = new Map<string, Role>();

    const unsubRoles = subscribeToRoles(
      (roleList) => {
        setRoles(roleList);
        roleList.forEach(role => rolesMap.set(role.id, role));
        setUsers(currentUsers => 
            currentUsers?.map(user => ({ ...user, role: rolesMap.get(user.roleId) || null })) || null
        );
      },
      (err) => { setError("Impossible de charger les rôles."); console.error(err); }
    );

    const unsubUsers = subscribeToUsers(
      (userList) => {
        const usersWithRoles = userList.map(user => ({ ...user, role: rolesMap.get(user.roleId) || null }));
        setUsers(usersWithRoles);
      },
      (err) => { setError("Impossible de charger les utilisateurs."); console.error(err); }
    );
    
    const unsubDepartments = subscribeToDepartments(
      (deptList) => { setDepartments(deptList); },
      (err) => { setError("Impossible de charger les départements."); console.error(err); }
    );

    return () => {
      unsubRoles();
      unsubUsers();
      unsubDepartments();
    };
  }, []);

  const loading = users === null || roles === null || departments === null;

  const handleAddUser = (newUser: User) => {
    setIsAddUserSheetOpen(false);
    toast({ title: "Utilisateur ajouté", description: `${newUser.name} a été ajouté avec succès.` });
  };

  const handleAddRole = (newRole: Role) => {
    setIsAddRoleSheetOpen(false);
     toast({ title: "Rôle ajouté", description: `Le rôle ${newRole.name} a été ajouté avec succès.` });
  };
  
  const handleUpdateRole = async (roleId: string, updatedPermissions: string[]) => {
    try {
      await updateRole(roleId, { permissions: updatedPermissions });
      setIsEditRoleSheetOpen(false);
      toast({ title: "Rôle mis à jour", description: "Les permissions du rôle ont été modifiées." });
    } catch (err) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de mettre à jour le rôle." });
      throw err;
    }
  };

  const handleSaveDepartment = async (name: string) => {
    try {
      if (editingDepartment) {
        await updateDepartment(editingDepartment.id, { name });
        toast({ title: "Département mis à jour" });
      } else {
        await addDepartment({ name });
        toast({ title: "Département ajouté" });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'enregistrer le département." });
    }
  };

  const handleUpdateUserRole = async (userId: string, newRoleId: string) => {
    try {
        await updateUser(userId, { roleId: newRoleId });
        toast({ title: "Rôle mis à jour", description: "Le rôle de l'utilisateur a été modifié avec succès." });
        setIsEditUserDialogOpen(false);
    } catch(err) {
        toast({ variant: "destructive", title: "Erreur", description: "Impossible de mettre à jour le rôle de l'utilisateur." });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
        if (deleteTarget.type === 'user') await deleteUser(deleteTarget.id);
        else if (deleteTarget.type === 'role') await deleteRole(deleteTarget.id);
        else if (deleteTarget.type === 'department') await deleteDepartment(deleteTarget.id);
        
        toast({ title: "Suppression réussie", description: `"${deleteTarget.name}" a été supprimé.` });
    } catch (err) {
        toast({ variant: "destructive", title: "Erreur", description: `Impossible de supprimer "${deleteTarget.name}".` });
    } finally {
        setDeleteTarget(null);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
            <ImportDataCard />
             <Card>
                <CardHeader>
                    <CardTitle>Paramètres Généraux</CardTitle>
                    <CardDescription>
                        Gérez les paramètres globaux de l'application.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Link href="/settings/organization" className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors -m-4">
                        <div>
                            <p className="font-medium">Organisation</p>
                            <p className="text-sm text-muted-foreground">Gérez les logos et les informations de l'entreprise.</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </Link>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <Card>
              <CardHeader>
              <CardTitle>Gestion des Utilisateurs</CardTitle>
              <CardDescription>Ajoutez, modifiez ou supprimez les utilisateurs de l'application.</CardDescription>
              </CardHeader>
              <CardContent>
              <div className="flex justify-end mb-4"><Button onClick={() => setIsAddUserSheetOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Ajouter un utilisateur</Button></div>
              {error && <p className="text-destructive text-center py-4">{error}</p>}
              <Table><TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Email</TableHead><TableHead>Rôle</TableHead><TableHead><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
                  <TableBody>
                  {loading ? Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}><TableCell><Skeleton className="h-4 w-32" /></TableCell><TableCell><Skeleton className="h-4 w-48" /></TableCell><TableCell><Skeleton className="h-4 w-24" /></TableCell><TableCell><div className="flex justify-end gap-2"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></div></TableCell></TableRow>
                  )) : (users?.map((user) => (
                      <TableRow key={user.id}><TableCell className="font-medium">{user.name}</TableCell><TableCell>{user.email}</TableCell><TableCell>{user.role?.name || 'Non assigné'}</TableCell><TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingUser(user); setIsEditUserDialogOpen(true); }}><Pencil className="h-4 w-4" /><span className="sr-only">Modifier</span></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ id: user.id, type: 'user', name: user.name })}><Trash2 className="h-4 w-4" /><span className="sr-only">Supprimer</span></Button>
                      </TableCell></TableRow>
                  )))}
                  </TableBody>
              </Table>
              </CardContent>
          </Card>
          
          <div className="space-y-6">
             <Card>
                <CardHeader><CardTitle>Gestion des Rôles</CardTitle><CardDescription>Définissez les rôles et leurs permissions.</CardDescription></CardHeader>
                <CardContent>
                <div className="flex justify-end mb-4"><Button onClick={() => setIsAddRoleSheetOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Ajouter un rôle</Button></div>
                {error && <p className="text-destructive text-center py-4">{error}</p>}
                <Table><TableHeader><TableRow><TableHead>Rôle</TableHead><TableHead>Permissions</TableHead><TableHead className="text-right w-[100px]">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                    {loading ? Array.from({ length: 2 }).map((_, i) => (
                        <TableRow key={i}><TableCell><Skeleton className="h-4 w-24" /></TableCell><TableCell><Skeleton className="h-4 w-64" /></TableCell><TableCell><Skeleton className="h-8 w-8" /></TableCell></TableRow>
                    )) : (roles?.map((role) => (
                        <TableRow key={role.id}>
                            <TableCell className="font-medium">{role.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{role.permissions.join(', ')}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => { setEditingRole(role); setIsEditRoleSheetOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ id: role.id, type: 'role', name: role.name })}><Trash2 className="h-4 w-4" /></Button>
                            </TableCell>
                        </TableRow>
                    )))}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>

             <Card>
                <CardHeader><CardTitle>Gestion des Départements</CardTitle><CardDescription>Gérez les départements de l'entreprise.</CardDescription></CardHeader>
                <CardContent>
                <div className="flex justify-end mb-4"><Button onClick={() => { setEditingDepartment(null); setIsDepartmentDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" />Ajouter un département</Button></div>
                {error && <p className="text-destructive text-center py-4">{error}</p>}
                <Table><TableHeader><TableRow><TableHead>Nom du département</TableHead><TableHead className="w-[100px] text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                    {loading ? Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}><TableCell><Skeleton className="h-4 w-full" /></TableCell><TableCell><div className="flex justify-end gap-2"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></div></TableCell></TableRow>
                    )) : (departments?.map((dept) => (
                        <TableRow key={dept.id}><TableCell className="font-medium">{dept.name}</TableCell><TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => { setEditingDepartment(dept); setIsDepartmentDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ id: dept.id, type: 'department', name: dept.name })}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell></TableRow>
                    )))}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
          </div>
        </div>

        <AddUserSheet isOpen={isAddUserSheetOpen} onClose={() => setIsAddUserSheetOpen(false)} onAddUser={handleAddUser} />
        <AddRoleSheet isOpen={isAddRoleSheetOpen} onClose={() => setIsAddRoleSheetOpen(false)} onAddRole={handleAddRole} roles={roles || []} />
        {editingRole && <EditRoleSheet isOpen={isEditRoleSheetOpen} onClose={() => setIsEditRoleSheetOpen(false)} onUpdateRole={handleUpdateRole} role={editingRole} />}
        <DepartmentDialog isOpen={isDepartmentDialogOpen} onClose={() => setIsDepartmentDialogOpen(false)} onConfirm={handleSaveDepartment} department={editingDepartment} />
        <EditUserRoleDialog isOpen={isEditUserDialogOpen} onClose={() => setIsEditUserDialogOpen(false)} onConfirm={handleUpdateUserRole} user={editingUser} roles={roles || []} />
      </div>
      
       <ConfirmationDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={`Supprimer : ${deleteTarget?.name}`}
        description={`Êtes-vous sûr de vouloir supprimer "${deleteTarget?.name}" ? Cette action est irréversible.`}
      />
    </>
  );
}
