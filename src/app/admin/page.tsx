"use client";

import { useState, useMemo, useCallback, memo, useTransition } from "react";
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
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-[3rem] bg-card/40 backdrop-blur-md border border-white/10 shadow-2xl relative overflow-hidden group">
    {/* Subtle Institutional Background */}
    <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-700 pointer-events-none">
        <ShieldCheck className="h-64 w-64 rotate-12" />
    </div>

    <div className="flex items-center gap-6 relative z-10">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-0 group-hover:scale-100 transition-transform duration-700" />
        <Avatar className="h-20 w-20 border-[3px] border-white shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:rotate-3 relative z-10">
          <AvatarImage src={user?.photoUrl || undefined} alt={user?.name || ''} />
          <AvatarFallback className="bg-slate-900 font-black text-white text-2xl uppercase tracking-tighter">
            {user?.name?.charAt(0) || 'A'}
          </AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-4 border-white bg-emerald-500 shadow-lg z-20" />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">
            Habilitations
          </h1>
          <div className="px-3 py-1 rounded-full bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
            Admin
          </div>
        </div>
        <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest opacity-70">
          Contrôle d'Accès & Gouvernance de la Structure
        </p>
      </div>
    </div>

    <div className="flex items-center gap-4 relative z-10">
        <div className="hidden lg:flex flex-col items-end gap-1 px-6 border-r border-slate-900/10">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Statut Système</span>
            <span className="text-xs font-black text-emerald-600 uppercase tracking-tight flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Opérationnel
            </span>
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
  const [isPending, startTransition] = useTransition();

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

  // Gestionnaires centralisés pour les dialogues avec transition pour la fluidité (INP)
  const openDialog = useCallback((name: keyof typeof dialogs) => {
    startTransition(() => {
      setDialogs(prev => ({ ...prev, [name]: true }));
    });
  }, []);

  const closeDialog = useCallback((name: keyof typeof dialogs) => {
    startTransition(() => {
      setDialogs(prev => ({ ...prev, [name]: false }));
    });
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

  // Handlers mémoïsés pour UsersTab
  const handleOpenAddUser = useCallback(() => openDialog('addUser'), [openDialog]);
  
  const handleLinkUserAction = useCallback((u: User) => {
    startTransition(() => {
      setEditingItems(prev => ({ ...prev, linkingUser: u }));
      openDialog('linkUser');
    });
  }, [openDialog]);

  const handleEditRoleAction = useCallback((u: User) => {
    startTransition(() => {
      setEditingItems(prev => ({ ...prev, user: u }));
      openDialog('editUser');
    });
  }, [openDialog]);

  const handleEditPermissionsAction = useCallback((u: User) => {
    startTransition(() => {
      setEditingItems(prev => ({ ...prev, permissionsUser: u }));
      openDialog('permissions');
    });
  }, [openDialog]);

  const handleDeleteUserAction = useCallback((id: string, name: string) => 
    handleDeleteRequest(id, 'user', name), [handleDeleteRequest]);

  // Handlers mémoïsés pour SecurityTab
  const handleOpenAddRole = useCallback(() => openDialog('addRole'), [openDialog]);
  const handleDeleteRoleAction = useCallback((id: string, name: string) => 
    handleDeleteRequest(id, 'role', name), [handleDeleteRequest]);

  // Handlers mémoïsés pour OrgTab
  const handleAddDept = useCallback(() => {
    startTransition(() => {
      setEditingItems(prev => ({ ...prev, department: null }));
      openDialog('department');
    });
  }, [openDialog]);

  const handleEditDept = useCallback((d: Department) => {
    startTransition(() => {
      setEditingItems(prev => ({ ...prev, department: d }));
      openDialog('department');
    });
  }, [openDialog]);

  const handleDeleteDept = useCallback((id: string, name: string) => 
    handleDeleteRequest(id, 'department', name), [handleDeleteRequest]);

  const handleAddDir = useCallback(() => {
    startTransition(() => {
      setEditingItems(prev => ({ ...prev, direction: null }));
      openDialog('direction');
    });
  }, [openDialog]);

  const handleEditDir = useCallback((dir: Direction) => {
    startTransition(() => {
      setEditingItems(prev => ({ ...prev, direction: dir }));
      openDialog('direction');
    });
  }, [openDialog]);

  const handleDeleteDir = useCallback((id: string, name: string) => 
    handleDeleteRequest(id, 'direction', name), [handleDeleteRequest]);

  const handleAddSvc = useCallback(() => {
    startTransition(() => {
      setEditingItems(prev => ({ ...prev, service: null }));
      openDialog('service');
    });
  }, [openDialog]);

  const handleEditSvc = useCallback((svc: Service) => {
    startTransition(() => {
      setEditingItems(prev => ({ ...prev, service: svc }));
      openDialog('service');
    });
  }, [openDialog]);

  const handleDeleteSvc = useCallback((id: string, name: string) => 
    handleDeleteRequest(id, 'service', name), [handleDeleteRequest]);

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
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-center font-semibold">
              {error}
            </div>
          )}

          <PermissionLock userEmail={user?.email ?? ''}>
            <Tabs defaultValue="overview" className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="overflow-x-auto pb-2 -mx-2 px-2 scrollbar-none">
                <TabsList className="bg-card/40 p-1.5 border border-white/10 backdrop-blur-md rounded-2xl shadow-xl inline-flex gap-1.5 h-14">
                  {TAB_CONFIG.map(({ value, label, icon: Icon }) => (
                    <TabsTrigger 
                      key={value}
                      value={value} 
                      className="gap-2.5 px-8 py-3 rounded-xl data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-2xl active:scale-95 transition-all text-xs font-black uppercase tracking-widest"
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
                  onAddUserAction={handleOpenAddUser}
                  onLinkUserAction={handleLinkUserAction}
                  onEditRoleAction={handleEditRoleAction}
                  onEditPermissionsAction={handleEditPermissionsAction}
                  onDeleteUserAction={handleDeleteUserAction}
                />
              </TabsContent>

              <TabsContent value="security" className="outline-none focus-visible:ring-0">
                <SecurityTab 
                  roles={safeRoles}
                  loading={loading}
                  currentUser={user}
                  onAddRoleAction={handleOpenAddRole}
                  onDeleteRoleAction={handleDeleteRoleAction}
                  mappedRolesForMatrix={mappedRolesForMatrix}
                />
              </TabsContent>

              <TabsContent value="org" className="outline-none focus-visible:ring-0">
                <OrgTab 
                  departments={safeDepartments}
                  directions={safeDirections}
                  services={safeServices}
                  loading={loading}
                  onAddDeptAction={handleAddDept}
                  onEditDeptAction={handleEditDept}
                  onDeleteDeptAction={handleDeleteDept}
                  onAddDirAction={handleAddDir}
                  onEditDirAction={handleEditDir}
                  onDeleteDirAction={handleDeleteDir}
                  onAddSvcAction={handleAddSvc}
                  onEditSvcAction={handleEditSvc}
                  onDeleteSvcAction={handleDeleteSvc}
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
