
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, Trash2, Pencil, ChevronRight, Link2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAdminData } from "@/hooks/use-admin-data";

import type { User, Role, Department, Direction, Service, Employe } from "@/lib/data";
import { deleteUser, updateUser } from "@/services/user-service";
import { deleteRole, updateRole } from "@/services/role-service";
import { addDepartment, updateDepartment, deleteDepartment } from "@/services/department-service";
import { addDirection, updateDirection, deleteDirection } from "@/services/direction-service";
import { addService, updateService, deleteService } from "@/services/service-service";
import { updateEmployee } from "@/services/employee-service";

import { AddUserSheet } from "@/components/admin/add-user-sheet";
import { AddRoleSheet } from "@/components/admin/add-role-sheet";
import { ImportDataCard } from "@/components/admin/import-data-card";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { DepartmentDialog } from "@/components/admin/department-dialog";
import { EditUserRoleDialog } from "@/components/admin/edit-user-role-dialog";
import { EditRoleSheet } from "@/components/admin/edit-role-sheet";
import { DirectionDialog } from "@/components/admin/direction-dialog";
import { ServiceDialog } from "@/components/admin/service-dialog";
import { Badge } from "@/components/ui/badge";
import { LinkUserEmployeeDialog } from "@/components/admin/link-user-employee-dialog";
import { PaginationControls } from "@/components/common/pagination-controls";

export default function AdminPage() {
  const { 
    users, 
    roles, 
    departments, 
    directions, 
    services, 
    allEmployees, 
    loading, 
    error 
  } = useAdminData();
  
  const { toast } = useToast();

  const [isAddUserSheetOpen, setIsAddUserSheetOpen] = useState(false);
  const [isAddRoleSheetOpen, setIsAddRoleSheetOpen] = useState(false);
  const [isEditRoleSheetOpen, setIsEditRoleSheetOpen] = useState(false);
  const [isDepartmentDialogOpen, setIsDepartmentDialogOpen] = useState(false);
  const [isDirectionDialogOpen, setIsDirectionDialogOpen] = useState(false);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isLinkUserDialogOpen, setIsLinkUserDialogOpen] = useState(false);

  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editingDirection, setEditingDirection] = useState<Direction | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [linkingUser, setLinkingUser] = useState<User | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'user' | 'role' | 'department' | 'direction' | 'service'; name: string } | null>(null);

  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const [userItemsPerPage, setUserItemsPerPage] = useState(5);

  const paginatedUsers = useMemo(() => {
    if (!users) return [];
    const startIndex = (userCurrentPage - 1) * userItemsPerPage;
    return users.slice(startIndex, startIndex + userItemsPerPage);
  }, [users, userCurrentPage, userItemsPerPage]);

  const totalUserPages = useMemo(() => {
    if (!users) return 1;
    return Math.ceil(users.length / userItemsPerPage);
  }, [users, userItemsPerPage]);

  const handleAddUser = () => {
    setIsAddUserSheetOpen(false);
    toast({ title: "Utilisateur ajouté", description: `Le nouvel utilisateur a été ajouté avec succès.` });
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

  const handleSaveDirection = async (name: string, departmentId: string) => {
    try {
      if (editingDirection) {
        await updateDirection(editingDirection.id, { name, departmentId });
        toast({ title: "Direction mise à jour" });
      } else {
        await addDirection({ name, departmentId });
        toast({ title: "Direction ajoutée" });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'enregistrer la direction." });
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

  const handleLinkUserToEmployee = async (userId: string, employeeId: string) => {
    try {
        await updateUser(userId, { employeeId });
        await updateEmployee(employeeId, { userId });

        toast({ title: "Utilisateur lié", description: "Le compte utilisateur a été lié au profil employé." });
        setIsLinkUserDialogOpen(false);
    } catch (err) {
        toast({ variant: "destructive", title: "Erreur", description: "Impossible de lier l'utilisateur à l'employé." });
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
        if (deleteTarget.type === 'user') await deleteUser(deleteTarget.id);
        else if (deleteTarget.type === 'role') await deleteRole(deleteTarget.id);
        else if (deleteTarget.type === 'department') await deleteDepartment(deleteTarget.id);
        else if (deleteTarget.type === 'direction') await deleteDirection(deleteTarget.id);
        else if (deleteTarget.type === 'service') await deleteService(deleteTarget.id);
        
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
        
        {error && <p className="text-destructive text-center py-4">{error}</p>}

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
              <Table><TableHeader><TableRow><TableHead>N°</TableHead><TableHead>Nom</TableHead><TableHead>Email</TableHead><TableHead>Rôle</TableHead><TableHead>Permissions</TableHead><TableHead><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
                  <TableBody>
                  {loading ? Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}><TableCell><Skeleton className="h-4 w-4" /></TableCell><TableCell><Skeleton className="h-4 w-24" /></TableCell><TableCell><Skeleton className="h-4 w-40" /></TableCell><TableCell><Skeleton className="h-4 w-20" /></TableCell><TableCell><Skeleton className="h-4 w-12" /></TableCell><TableCell><div className="flex justify-end gap-2"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></div></TableCell></TableRow>
                  )) : (paginatedUsers.map((user, index) => (
                      <TableRow key={user.id}>
                        <TableCell>{(userCurrentPage - 1) * userItemsPerPage + index + 1}</TableCell>
                        <TableCell className="font-medium">
                            {user.name}
                            {user.employeeId && (
                                <p className="text-xs text-muted-foreground">
                                    Lié à : {allEmployees.find(e => e.id === user.employeeId)?.name || 'N/A'}
                                </p>
                            )}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell><Badge variant="secondary">{user.role?.name || 'Non assigné'}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                            {user.role?.name === 'Administrateur' || user.role?.name === 'Super Administrateur' ? (
                                <Badge>Tous</Badge>
                            ) : (
                                user.permissions?.length > 0 ? `${user.permissions.length} droit(s)` : 'Aucun'
                            )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => { setLinkingUser(user); setIsLinkUserDialogOpen(true); }}><Link2 className="h-4 w-4" /><span className="sr-only">Lier</span></Button>
                          <Button variant="ghost" size="icon" onClick={() => { setEditingUser(user); setIsEditUserDialogOpen(true); }}><Pencil className="h-4 w-4" /><span className="sr-only">Modifier Rôle</span></Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ id: user.id, type: 'user', name: user.name })}><Trash2 className="h-4 w-4" /><span className="sr-only">Supprimer</span></Button>
                        </TableCell>
                      </TableRow>
                  )))}
                  </TableBody>
              </Table>
              </CardContent>
               {users && totalUserPages > 1 && (
                <CardFooter>
                    <PaginationControls
                        currentPage={userCurrentPage}
                        totalPages={totalUserPages}
                        onPageChange={setUserCurrentPage}
                        itemsPerPage={userItemsPerPage}
                        onItemsPerPageChange={setUserItemsPerPage}
                        totalItems={users.length}
                    />
                </CardFooter>
            )}
          </Card>
          
          <Card>
            <CardHeader><CardTitle>Gestion des Rôles</CardTitle><CardDescription>Définissez les rôles et leurs permissions.</CardDescription></CardHeader>
            <CardContent>
            <div className="flex justify-end mb-4"><Button onClick={() => setIsAddRoleSheetOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Ajouter un rôle</Button></div>
            <Table><TableHeader><TableRow><TableHead>N°</TableHead><TableHead>Rôle</TableHead><TableHead>Permissions</TableHead><TableHead className="text-right w-[100px]">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                {loading ? Array.from({ length: 2 }).map((_, i) => (
                    <TableRow key={i}><TableCell><Skeleton className="h-4 w-4" /></TableCell><TableCell><Skeleton className="h-4 w-24" /></TableCell><TableCell><Skeleton className="h-4 w-64" /></TableCell><TableCell><Skeleton className="h-8 w-8" /></TableCell></TableRow>
                )) : (roles?.map((role, index) => (
                    <TableRow key={role.id}>
                        <TableCell>{index + 1}</TableCell>
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
        </div>

        <div>
            <h2 className="text-2xl font-bold tracking-tight mb-4">Structure Organisationnelle</h2>
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
                 <Card>
                    <CardHeader><CardTitle>Départements</CardTitle><CardDescription>Niveau le plus élevé de l'organisation.</CardDescription></CardHeader>
                    <CardContent>
                    <div className="flex justify-end mb-4"><Button onClick={() => { setEditingDepartment(null); setIsDepartmentDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" />Ajouter</Button></div>
                    <Table><TableHeader><TableRow><TableHead>N°</TableHead><TableHead>Nom</TableHead><TableHead className="w-[100px] text-right">Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                        {loading ? Array.from({ length: 3 }).map((_, i) => (
                            <TableRow key={i}><TableCell><Skeleton className="h-4 w-4" /></TableCell><TableCell><Skeleton className="h-4 w-full" /></TableCell><TableCell><div className="flex justify-end gap-2"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></div></TableCell></TableRow>
                        )) : (departments?.map((dept, index) => (
                            <TableRow key={dept.id}><TableCell>{index + 1}</TableCell><TableCell className="font-medium">{dept.name}</TableCell><TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => { setEditingDepartment(dept); setIsDepartmentDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ id: dept.id, type: 'department', name: dept.name })}><Trash2 className="h-4 w-4" /></Button>
                            </TableCell></TableRow>
                        )))}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Directions</CardTitle><CardDescription>Sous-divisions des départements.</CardDescription></CardHeader>
                    <CardContent>
                    <div className="flex justify-end mb-4"><Button onClick={() => { setEditingDirection(null); setIsDirectionDialogOpen(true); }} disabled={!departments || departments.length === 0}><PlusCircle className="mr-2 h-4 w-4" />Ajouter</Button></div>
                    <Table><TableHeader><TableRow><TableHead>N°</TableHead><TableHead>Nom</TableHead><TableHead>Département</TableHead><TableHead className="w-[100px] text-right">Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                        {loading ? Array.from({ length: 3 }).map((_, i) => (
                            <TableRow key={i}><TableCell><Skeleton className="h-4 w-4" /></TableCell><TableCell><Skeleton className="h-4 w-full" /></TableCell><TableCell><Skeleton className="h-4 w-24" /></TableCell><TableCell><div className="flex justify-end gap-2"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></div></TableCell></TableRow>
                        )) : (directions?.map((dir, index) => (
                            <TableRow key={dir.id}><TableCell>{index + 1}</TableCell><TableCell className="font-medium">{dir.name}</TableCell><TableCell className="text-sm text-muted-foreground">{departments?.find(d => d.id === dir.departmentId)?.name}</TableCell><TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => { setEditingDirection(dir); setIsDirectionDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ id: dir.id, type: 'direction', name: dir.name })}><Trash2 className="h-4 w-4" /></Button>
                            </TableCell></TableRow>
                        )))}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Services</CardTitle><CardDescription>Unités opérationnelles.</CardDescription></CardHeader>
                    <CardContent>
                    <div className="flex justify-end mb-4"><Button onClick={() => { setEditingService(null); setIsServiceDialogOpen(true); }} disabled={(!directions || directions.length === 0) && (!departments || departments.length === 0)}><PlusCircle className="mr-2 h-4 w-4" />Ajouter</Button></div>
                    <Table><TableHeader><TableRow><TableHead>N°</TableHead><TableHead>Nom</TableHead><TableHead>Dépend de</TableHead><TableHead className="w-[100px] text-right">Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                        {loading ? Array.from({ length: 3 }).map((_, i) => (
                            <TableRow key={i}><TableCell><Skeleton className="h-4 w-4" /></TableCell><TableCell><Skeleton className="h-4 w-full" /></TableCell><TableCell><Skeleton className="h-4 w-24" /></TableCell><TableCell><div className="flex justify-end gap-2"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></div></TableCell></TableRow>
                        )) : (services?.map((svc, index) => {
                            const parent = svc.directionId 
                                ? directions?.find(d => d.id === svc.directionId)
                                : departments?.find(d => d.id === svc.departmentId);
                            const parentName = parent?.name || 'N/A';
                            const parentType = svc.directionId ? 'Direction' : 'Département';
                            return (
                                <TableRow key={svc.id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell className="font-medium">{svc.name}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {parentName} <span className="text-xs opacity-70">({parentType})</span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => { setEditingService(svc); setIsServiceDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ id: svc.id, type: 'service', name: svc.name })}><Trash2 className="h-4 w-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            )
                        }))}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>
            </div>
        </div>


        <AddUserSheet isOpen={isAddUserSheetOpen} onClose={() => setIsAddUserSheetOpen(false)} onAddUser={handleAddUser} roles={roles || []} />
        <AddRoleSheet isOpen={isAddRoleSheetOpen} onClose={() => setIsAddRoleSheetOpen(false)} onAddRole={handleAddRole} roles={roles || []} />
        {editingRole && <EditRoleSheet isOpen={isEditRoleSheetOpen} onClose={() => setIsEditRoleSheetOpen(false)} onUpdateRole={handleUpdateRole} role={editingRole} />}
        <DepartmentDialog isOpen={isDepartmentDialogOpen} onClose={() => setIsDepartmentDialogOpen(false)} onConfirm={handleSaveDepartment} department={editingDepartment} />
        <DirectionDialog isOpen={isDirectionDialogOpen} onClose={() => setIsDirectionDialogOpen(false)} onConfirm={handleSaveDirection} direction={editingDirection} departments={departments || []} />
        <ServiceDialog isOpen={isServiceDialogOpen} onClose={() => setIsServiceDialogOpen(false)} service={editingService} directions={directions || []} departments={departments || []} />
        <EditUserRoleDialog isOpen={isEditUserDialogOpen} onClose={() => setIsEditUserDialogOpen(false)} onConfirm={handleUpdateUserRole} user={editingUser} roles={roles || []} />
        <LinkUserEmployeeDialog isOpen={isLinkUserDialogOpen} onClose={() => setIsLinkUserDialogOpen(false)} onConfirm={handleLinkUserToEmployee} user={linkingUser} employees={allEmployees} />
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
