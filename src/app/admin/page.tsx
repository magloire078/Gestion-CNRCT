"use client";

import { useState, useMemo, useCallback, memo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useAdminData } from "@/hooks/use-admin-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Layers, Users, ShieldCheck, Building } from "lucide-react";

import type { User, Role, Department, Direction, Service } from "@/lib/data";
import { deleteUser, updateUser } from "@/services/user-service";
import { deleteRole } from "@/services/role-service";
import { addDepartment, updateDepartment, deleteDepartment } from "@/services/department-service";
import { addDirection, updateDirection, deleteDirection } from "@/services/direction-service";
import { addService, updateService, deleteService } from "@/services/service-service";
import { updateEmployee } from "@/services/employee-service";

import { AddUserSheet } from "@/components/admin/add-user-sheet";
import { AddRoleSheet } from "@/components/admin/add-role-sheet";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { DepartmentDialog } from "@/components/admin/department-dialog";
import { EditUserRoleDialog } from "@/components/admin/edit-user-role-dialog";
import { DirectionDialog } from "@/components/admin/direction-dialog";
import { ServiceDialog } from "@/components/admin/service-dialog";
import { LinkUserEmployeeDialog } from "@/components/admin/link-user-employee-dialog";
import { PermissionLock } from "@/components/admin/permission-lock";
import { UserPermissionsDialog } from "@/components/admin/user-permissions-dialog";
import { OverviewTab } from "@/components/admin/tabs/overview-tab";
import { UsersTab } from "@/components/admin/tabs/users-tab";
import { SecurityTab } from "@/components/admin/tabs/security-tab";
import { OrgTab } from "@/components/admin/tabs/org-tab";

// Constantes pour éviter les re-créations
const SYSTEM_ROLES = new Set([
  'dirigeant-president', 'cadre-superieur-directeur', 
  'cadre-intermediaire-chef-service', 'employe-operationnel', 
  'stagiaire-apprenti', 'super-admin', 'administrateur'
]);

const TAB_CONFIG = [
  { value: "overview", label: "Vue d'ensemble", icon: Layers },
  { value: "users", label: "Utilisateurs", icon: Users },
  { value: "security", label: "Sécurité", icon: ShieldCheck },
  { value: "org", label: "Organisation", icon: Building },
] as const;

// Composant d'en-tête mémoïsé
const AdminHeader = memo(({ user }: { user: User | null }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-5">
      <div className="relative group">
        <Avatar className="h-16 w-16 border-[3px] border-background shadow-2xl transition-transform group-hover:scale-105">
          <AvatarImage src={user?.photoUrl || undefined} alt={user?.name || ''} />
          <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/30 font-black text-primary text-xl">
            {user?.name?.charAt(0) || 'A'}
          </AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-background bg-green-500 shadow-sm" />
      </div>
      <div className="space-y-1">
        <h1 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
          Administration
        </h1>
        <p className="text-muted-foreground font-medium text-sm">
          Gérez l&apos;accès, la sécurité et la structure organisationnelle.
        </p>
      </div>
    </div>
  </div>
));

AdminHeader.displayName = 'AdminHeader';

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

  const { user } = useAuth();
  const { toast } = useToast();

  // États regroupés par catégorie
  const [dialogs, setDialogs] = useState({
    addUser: false,
    addRole: false,
    department: false,
    direction: false,
    service: false,
    editUser: false,
    linkUser: false,
    permissions: false,
  });

  const [editingItems, setEditingItems] = useState({
    department: null as Department | null,
    direction: null as Direction | null,
    service: null as Service | null,
    user: null as User | null,
    linkingUser: null as User | null,
  permissionsUser: null as User | null,
  });

  type DeleteTargetType = 'user' | 'role' | 'department' | 'direction' | 'service';
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: DeleteTargetType; name: string } | null>(null);

  // Mémoïsation des données dérivées
  const employeeMap = useMemo(
    () => new Map(allEmployees?.map(e => [e.id, e])),
    [allEmployees]
  );

  const mappedRolesForMatrix = useMemo(
    () => roles?.map(r => ({
      id: r.id,
      label: r.name,
      isSystem: SYSTEM_ROLES.has(r.id)
    })) ?? [],
    [roles]
  );

  // Gestionnaires centralisés pour les dialogues
  const openDialog = useCallback((name: keyof typeof dialogs) => {
    setDialogs(prev => ({ ...prev, [name]: true }));
  }, []);

  const closeDialog = useCallback((name: keyof typeof dialogs) => {
    setDialogs(prev => ({ ...prev, [name]: false }));
  }, []);

  // Handlers CRUD optimisés
  const handleAddUser = useCallback(() => {
    closeDialog('addUser');
    toast({ title: "Utilisateur ajouté", description: "Le nouvel utilisateur a été ajouté avec succès." });
  }, [closeDialog, toast]);

  const handleAddRole = useCallback((newRole: Role) => {
    closeDialog('addRole');
    toast({ title: "Rôle ajouté", description: `Le rôle ${newRole.name} a été ajouté avec succès.` });
  }, [closeDialog, toast]);

  const handleSaveDepartment = useCallback(async (name: string) => {
    const { department } = editingItems;
    try {
      if (department) {
        await updateDepartment(department.id, { name });
        toast({ title: "Département mis à jour" });
      } else {
        await addDepartment({ name });
        toast({ title: "Département ajouté" });
      }
      closeDialog('department');
      setEditingItems(prev => ({ ...prev, department: null }));
    } catch (err) {
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: "Impossible d'enregistrer le département." 
      });
    }
  }, [editingItems, closeDialog, toast]);

  const handleSaveDirection = useCallback(async (name: string, departmentId: string) => {
    const { direction } = editingItems;
    try {
      if (direction) {
        await updateDirection(direction.id, { name, departmentId });
        toast({ title: "Direction mise à jour" });
      } else {
        await addDirection({ name, departmentId });
        toast({ title: "Direction ajoutée" });
      }
      closeDialog('direction');
      setEditingItems(prev => ({ ...prev, direction: null }));
    } catch (err) {
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: "Impossible d'enregistrer la direction." 
      });
    }
  }, [editingItems, closeDialog, toast]);

  const handleSaveService = useCallback(async (data: { name: string; directionId?: string; departmentId?: string }) => {
    const { service } = editingItems;
    try {
      if (service) {
        await updateService(service.id, data);
        toast({ title: "Service mis à jour" });
      } else {
        await addService(data as Omit<Service, 'id'>);
        toast({ title: "Service ajouté" });
      }
      closeDialog('service');
      setEditingItems(prev => ({ ...prev, service: null }));
    } catch (err) {
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: "Impossible d'enregistrer le service." 
      });
    }
  }, [editingItems, closeDialog, toast]);

  const handleUpdateUserRole = useCallback(async (userId: string, newRoleId: string) => {
    try {
      await updateUser(userId, { roleId: newRoleId });
      toast({ 
        title: "Rôle mis à jour", 
        description: "Le rôle de l'utilisateur a été modifié avec succès." 
      });
      closeDialog('editUser');
      setEditingItems(prev => ({ ...prev, user: null }));
    } catch (err) {
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: "Impossible de mettre à jour le rôle de l'utilisateur." 
      });
    }
  }, [closeDialog, toast]);

  const handleLinkUserToEmployee = useCallback(async (userId: string, employeeId: string) => {
    try {
      await Promise.all([
        updateUser(userId, { employeeId }),
        updateEmployee(employeeId, { userId })
      ]);
      toast({ 
        title: "Utilisateur lié", 
        description: "Le compte utilisateur a été lié au profil employé." 
      });
      closeDialog('linkUser');
      setEditingItems(prev => ({ ...prev, linkingUser: null }));
    } catch (err) {
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: "Impossible de lier l'utilisateur à l'employé." 
      });
    }
  }, [closeDialog, toast]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    
    const deleteActions = {
      user: () => deleteUser(deleteTarget.id),
      role: () => deleteRole(deleteTarget.id),
      department: () => deleteDepartment(deleteTarget.id),
      direction: () => deleteDirection(deleteTarget.id),
      service: () => deleteService(deleteTarget.id),
    };

    try {
      await deleteActions[deleteTarget.type]();
      toast({ 
        title: "Suppression réussie", 
        description: `"${deleteTarget.name}" a été supprimé.` 
      });
    } catch (err) {
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: `Impossible de supprimer "${deleteTarget.name}".` 
      });
    } finally {
      setDeleteTarget(null);
    }
  }, [deleteTarget, toast]);

  const handleDeleteRequest = useCallback((
    id: string, 
    type: DeleteTargetType, 
    name: string
  ) => {
    setDeleteTarget({ id, type, name });
  }, []);

  // Valeurs par défaut pour éviter les vérifications null répétées
  const defaultArray = useMemo(() => [], []);
  const safeUsers = users ?? defaultArray;
  const safeRoles = roles ?? defaultArray;
  const safeDepartments = departments ?? defaultArray;
  const safeDirections = directions ?? defaultArray;
  const safeServices = services ?? defaultArray;

  return (
    <PermissionGuard permission="page:admin:view">
      <TooltipProvider>
        <div className="flex flex-col gap-8 pb-12 overflow-x-hidden">
          <AdminHeader user={user} />

          {error && (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-center font-semibold">
              {error}
            </div>
          )}

          <PermissionLock userEmail={user?.email ?? ''}>
            <Tabs defaultValue="overview" className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="overflow-x-auto pb-2 -mx-2 px-2 scrollbar-none">
                <TabsList className="bg-muted/40 p-1.5 border border-border/50 backdrop-blur-md rounded-2xl shadow-sm inline-flex gap-1">
                  {TAB_CONFIG.map(({ value, label, icon: Icon }) => (
                    <TabsTrigger 
                      key={value}
                      value={value} 
                      className="gap-2 px-6 py-2.5 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-lg active:scale-95 transition-all text-sm font-bold"
                    >
                      <Icon className="h-4.5 w-4.5" />
                      {label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <TabsContent value="overview" className="outline-none focus-visible:ring-0">
                <OverviewTab 
                  users={safeUsers} 
                  roles={safeRoles} 
                  departments={safeDepartments} 
                  loading={loading} 
                />
              </TabsContent>

              <TabsContent value="users" className="outline-none focus-visible:ring-0">
                <UsersTab 
                  users={safeUsers} 
                  loading={loading}
                  employeeMap={employeeMap}
                  onAddUserAction={() => openDialog('addUser')}
                  onLinkUserAction={(u: User) => {
                    setEditingItems(prev => ({ ...prev, linkingUser: u }));
                    openDialog('linkUser');
                  }}
                  onEditRoleAction={(u: User) => {
                    setEditingItems(prev => ({ ...prev, user: u }));
                    openDialog('editUser');
                  }}
                  onEditPermissionsAction={(u: User) => {
                    setEditingItems(prev => ({ ...prev, permissionsUser: u }));
                    openDialog('permissions');
                  }}
                  onDeleteUserAction={(id: string, name: string) => 
                    handleDeleteRequest(id, 'user', name)
                  }
                />
              </TabsContent>

              <TabsContent value="security" className="outline-none focus-visible:ring-0">
                <SecurityTab 
                  roles={safeRoles}
                  loading={loading}
                  currentUser={user}
                  onAddRoleAction={() => openDialog('addRole')}
                  onDeleteRoleAction={(id: string, name: string) => 
                    handleDeleteRequest(id, 'role', name)
                  }
                  mappedRolesForMatrix={mappedRolesForMatrix}
                />
              </TabsContent>

              <TabsContent value="org" className="outline-none focus-visible:ring-0">
                <OrgTab 
                  departments={safeDepartments}
                  directions={safeDirections}
                  services={safeServices}
                  loading={loading}
                  onAddDeptAction={() => {
                    setEditingItems(prev => ({ ...prev, department: null }));
                    openDialog('department');
                  }}
                  onEditDeptAction={(d: Department) => {
                    setEditingItems(prev => ({ ...prev, department: d }));
                    openDialog('department');
                  }}
                  onDeleteDeptAction={(id: string, name: string) => 
                    handleDeleteRequest(id, 'department', name)
                  }
                  onAddDirAction={() => {
                    setEditingItems(prev => ({ ...prev, direction: null }));
                    openDialog('direction');
                  }}
                  onEditDirAction={(dir: Direction) => {
                    setEditingItems(prev => ({ ...prev, direction: dir }));
                    openDialog('direction');
                  }}
                  onDeleteDirAction={(id: string, name: string) => 
                    handleDeleteRequest(id, 'direction', name)
                  }
                  onAddSvcAction={() => {
                    setEditingItems(prev => ({ ...prev, service: null }));
                    openDialog('service');
                  }}
                  onEditSvcAction={(svc: Service) => {
                    setEditingItems(prev => ({ ...prev, service: svc }));
                    openDialog('service');
                  }}
                  onDeleteSvcAction={(id: string, name: string) => 
                    handleDeleteRequest(id, 'service', name)
                  }
                />
              </TabsContent>
            </Tabs>
          </PermissionLock>

          {/* Dialogues */}
          <AddUserSheet 
            isOpen={dialogs.addUser} 
            onCloseAction={() => closeDialog('addUser')} 
            onAddUserAction={handleAddUser} 
            roles={safeRoles} 
          />
          
          <AddRoleSheet 
            isOpen={dialogs.addRole} 
            onCloseAction={() => closeDialog('addRole')} 
            onAddRoleAction={handleAddRole} 
            roles={safeRoles} 
          />
          
          <DepartmentDialog 
            isOpen={dialogs.department} 
            onCloseAction={() => closeDialog('department')} 
            onConfirmAction={handleSaveDepartment} 
            department={editingItems.department} 
          />
          
          <DirectionDialog 
            isOpen={dialogs.direction} 
            onCloseAction={() => closeDialog('direction')} 
            onConfirmAction={handleSaveDirection} 
            direction={editingItems.direction} 
            departments={safeDepartments} 
          />
          
          <ServiceDialog 
            isOpen={dialogs.service} 
            onCloseAction={() => closeDialog('service')} 
            onConfirmAction={handleSaveService}
            service={editingItems.service}
            directions={safeDirections}
            departments={safeDepartments}
          />
          
          <EditUserRoleDialog 
            isOpen={dialogs.editUser} 
            onCloseAction={() => closeDialog('editUser')} 
            onConfirmAction={handleUpdateUserRole} 
            user={editingItems.user} 
            roles={safeRoles} 
          />
          
          <LinkUserEmployeeDialog 
            isOpen={dialogs.linkUser} 
            onCloseAction={() => closeDialog('linkUser')} 
            onConfirmAction={handleLinkUserToEmployee} 
            user={editingItems.linkingUser} 
            employees={allEmployees} 
          />
          
          <UserPermissionsDialog 
            isOpen={dialogs.permissions} 
            onCloseAction={() => closeDialog('permissions')} 
            user={editingItems.permissionsUser} 
          />
        </div>

        <ConfirmationDialog
          isOpen={!!deleteTarget}
          onCloseAction={() => setDeleteTarget(null)}
          onConfirmAction={handleConfirmDelete}
          title={`Supprimer : ${deleteTarget?.name || ''}`}
          description={`Êtes-vous sûr de vouloir supprimer "${deleteTarget?.name || ''}" ? Cette action est irréversible.`}
        />
      </TooltipProvider>
    </PermissionGuard>
  );
}
