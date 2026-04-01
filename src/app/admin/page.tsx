
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { PlusCircle, Trash2, Pencil, Link2, Search, Users, Shield, Building, Layers, Settings, AlertTriangle, ShieldCheck, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAdminData } from "@/hooks/use-admin-data";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import type { User, Role, Department, Direction, Service, Employe } from "@/lib/data";
import { deleteUser, updateUser } from "@/services/user-service";
import { deleteRole } from "@/services/role-service";
import { addDepartment, updateDepartment, deleteDepartment } from "@/services/department-service";
import { addDirection, updateDirection, deleteDirection } from "@/services/direction-service";
import { addService, updateService, deleteService } from "@/services/service-service";
import { updateEmployee } from "@/services/employee-service";

import { AddUserSheet } from "@/components/admin/add-user-sheet";
import { AddRoleSheet } from "@/components/admin/add-role-sheet";
import { ImportDataCard } from "@/components/admin/import-data-card";
import { ImportVillagesCard } from "@/components/admin/import-villages-card";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { DepartmentDialog } from "@/components/admin/department-dialog";
import { EditUserRoleDialog } from "@/components/admin/edit-user-role-dialog";
import { DirectionDialog } from "@/components/admin/direction-dialog";
import { ServiceDialog } from "@/components/admin/service-dialog";
import { LinkUserEmployeeDialog } from "@/components/admin/link-user-employee-dialog";
import { PaginationControls } from "@/components/common/pagination-controls";
import { PermissionLock } from "@/components/admin/permission-lock";
import { PermissionMatrix } from "@/components/admin/permission-matrix";

// ─── Win2K Design Tokens ────────────────────────────────────────────────────
const W = {
  bg: "#D4D0C8",
  bgLight: "#ECE9D8",
  white: "#FFFFFF",
  face: "#D4D0C8",
  shadow: "#808080",
  darkShadow: "#404040",
  highlight: "#FFFFFF",
  hilight2: "#F0EFEA",
  text: "#000000",
  textDisabled: "#808080",
  titleBarFrom: "#0A246A",
  titleBarTo: "#A6CAF0",
  titleBarText: "#FFFFFF",
  activeTab: "#D4D0C8",
  inactiveTab: "#C0C0B8",
  blue: "#0000FF",
  link: "#0000EE",
  tableHeaderBg: "#D4D0C8",
  tableRowHover: "#316AC5",
  tableRowHoverText: "#FFFFFF",
  border: "#808080",
  inputBg: "#FFFFFF",
  btnFace: "#ECE9D8",
};

// ─── Win2K CSS Helpers ───────────────────────────────────────────────────────
const raised = {
  background: W.face,
  boxShadow: `inset -1px -1px 0 ${W.darkShadow}, inset 1px 1px 0 ${W.highlight}, inset -2px -2px 0 ${W.shadow}, inset 2px 2px 0 ${W.hilight2}`,
};
const sunken = {
  background: W.white,
  boxShadow: `inset 1px 1px 0 ${W.shadow}, inset -1px -1px 0 ${W.highlight}, inset 2px 2px 0 ${W.darkShadow}, inset -2px -2px 0 ${W.hilight2}`,
};
const flat = {
  background: W.face,
  boxShadow: `inset -1px -1px 0 ${W.shadow}, inset 1px 1px 0 ${W.highlight}`,
};

// ─── Primitives ─────────────────────────────────────────────────────────────

function Win2KTitleBar({ title, icon }: { title: string; icon?: React.ReactNode }) {
  return (
    <div style={{
      background: `linear-gradient(to right, ${W.titleBarFrom}, ${W.titleBarTo})`,
      color: W.titleBarText,
      padding: "3px 6px",
      display: "flex",
      alignItems: "center",
      gap: 4,
      fontFamily: "Tahoma, 'MS Sans Serif', Arial, sans-serif",
      fontSize: 11,
      fontWeight: "bold",
      userSelect: "none",
    }}>
      {icon && <span style={{ display: "flex", alignItems: "center" }}>{icon}</span>}
      <span>{title}</span>
      <div style={{ marginLeft: "auto", display: "flex", gap: 2 }}>
        {["_", "□", "✕"].map((s, i) => (
          <span key={i} style={{
            ...raised,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 16, height: 14, fontSize: 9, cursor: "pointer", color: W.text,
            fontFamily: "Tahoma", fontWeight: "bold",
          }}>{s}</span>
        ))}
      </div>
    </div>
  );
}

function Win2KPanel({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div style={{ ...raised, padding: 0, ...style }} className={className}>
      {children}
    </div>
  );
}

function Win2KGroupBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset style={{
      border: `1px solid ${W.shadow}`,
      borderTop: `1px solid ${W.shadow}`,
      outline: `1px solid ${W.highlight}`,
      padding: "8px 8px 8px 8px",
      background: W.bg,
      fontFamily: "Tahoma, sans-serif",
    }}>
      <legend style={{
        fontSize: 11,
        fontFamily: "Tahoma, sans-serif",
        padding: "0 4px",
        color: W.text,
      }}>{title}</legend>
      {children}
    </fieldset>
  );
}

function Win2KButton({ children, onClick, disabled, small, style }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; small?: boolean; style?: React.CSSProperties;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        ...(pressed ? sunken : raised),
        fontFamily: "Tahoma, 'MS Sans Serif', sans-serif",
        fontSize: small ? 11 : 11,
        padding: small ? "1px 6px" : "3px 12px",
        minWidth: small ? 0 : 75,
        cursor: disabled ? "default" : "pointer",
        color: disabled ? W.textDisabled : W.text,
        border: "none",
        outline: "none",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function Win2KIconButton({ children, onClick, title: tip }: { children: React.ReactNode; onClick?: () => void; title?: string }) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      title={tip}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => { setPressed(false); setHovered(false); }}
      onMouseEnter={() => setHovered(true)}
      style={{
        ...(pressed ? sunken : hovered ? raised : flat),
        border: "none",
        cursor: "pointer",
        padding: "2px 3px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: W.text,
        background: hovered ? W.face : "transparent",
      }}
    >
      {children}
    </button>
  );
}

function Win2KInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        ...sunken,
        fontFamily: "Tahoma, sans-serif",
        fontSize: 11,
        padding: "2px 4px",
        outline: "none",
        border: "none",
        flex: 1,
        minWidth: 0,
        color: W.text,
      }}
    />
  );
}

function Win2KTable({ headers, children, loading, emptyIcon: EmptyIcon, emptyMessage, colSpan }: {
  headers: string[];
  children: React.ReactNode;
  loading?: boolean;
  emptyIcon?: React.ElementType;
  emptyMessage?: string;
  colSpan?: number;
}) {
  return (
    <div style={{ ...sunken, overflow: "auto" }}>
      <table style={{
        width: "100%",
        borderCollapse: "collapse",
        fontFamily: "Tahoma, 'MS Sans Serif', sans-serif",
        fontSize: 11,
        color: W.text,
      }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{
                background: W.tableHeaderBg,
                borderRight: `1px solid ${W.shadow}`,
                borderBottom: `2px solid ${W.shadow}`,
                padding: "2px 8px",
                textAlign: "left",
                fontWeight: "bold",
                fontSize: 11,
                boxShadow: `inset -1px 0 0 ${W.highlight}`,
                whiteSpace: "nowrap",
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? W.white : W.hilight2 }}>
                {headers.map((_, j) => (
                  <td key={j} style={{ padding: "3px 8px", borderBottom: `1px solid ${W.shadow}30` }}>
                    <Skeleton className="h-3 w-full" />
                  </td>
                ))}
              </tr>
            ))
          ) : children}
        </tbody>
      </table>
    </div>
  );
}

function Win2KTableRow({ children, index }: { children: React.ReactNode; index: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? W.tableRowHover : index % 2 === 0 ? W.white : W.hilight2,
        color: hovered ? W.tableRowHoverText : W.text,
        cursor: "default",
      }}
    >
      {children}
    </tr>
  );
}

function Win2KTd({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <td style={{
      padding: "2px 8px",
      borderBottom: `1px solid ${W.shadow}30`,
      fontSize: 11,
      whiteSpace: "nowrap",
      ...style,
    }}>{children}</td>
  );
}

function Win2KStatusBar({ text }: { text: string }) {
  return (
    <div style={{
      ...flat,
      fontSize: 11,
      fontFamily: "Tahoma, sans-serif",
      padding: "2px 6px",
      color: W.text,
      marginTop: 2,
    }}>{text}</div>
  );
}

function Win2KBadge({ children, variant }: { children: React.ReactNode; variant?: "default" | "error" }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 2,
      padding: "0px 6px",
      fontSize: 10,
      fontFamily: "Tahoma, sans-serif",
      border: `1px solid ${variant === "error" ? "#CC0000" : W.shadow}`,
      background: variant === "error" ? "#FFCCCC" : W.bg,
      color: variant === "error" ? "#CC0000" : W.text,
    }}>
      {variant === "error" && <AlertTriangle size={9} />}
      {children}
    </span>
  );
}

// ─── Tabs ────────────────────────────────────────────────────────────────────
function Win2KTabBar({ tabs, active, onSelect }: { tabs: { id: string; label: string; icon?: React.ReactNode }[]; active: string; onSelect: (id: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "flex-end", paddingLeft: 4, paddingBottom: 0 }}>
      {tabs.map(tab => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            style={{
              fontFamily: "Tahoma, sans-serif",
              fontSize: 11,
              padding: isActive ? "5px 12px 6px" : "3px 12px 4px",
              background: isActive ? W.activeTab : W.inactiveTab,
              color: W.text,
              border: "none",
              outline: "none",
              cursor: "pointer",
              position: "relative",
              marginBottom: isActive ? -1 : 0,
              zIndex: isActive ? 2 : 1,
              boxShadow: isActive
                ? `inset -1px 0 0 ${W.darkShadow}, inset 1px 1px 0 ${W.highlight}, -1px 0 0 ${W.shadow}, 1px 0 0 ${W.shadow}`
                : `inset -1px 0 0 ${W.shadow}, inset 1px 1px 0 ${W.highlight}`,
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontWeight: isActive ? "bold" : "normal",
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <tr>
      <td colSpan={10} style={{ textAlign: "center", padding: "16px", color: W.textDisabled, fontFamily: "Tahoma, sans-serif", fontSize: 11 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <Icon size={24} style={{ opacity: 0.4 }} />
          <span>{message}</span>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
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

  const [activeTab, setActiveTab] = useState("overview");
  const [isAddUserSheetOpen, setIsAddUserSheetOpen] = useState(false);
  const [isAddRoleSheetOpen, setIsAddRoleSheetOpen] = useState(false);
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
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'user' | 'role' | 'department' | 'direction' | 'service'; name: string } | null>(null);

  const [userSearch, setUserSearch] = useState("");
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const [userItemsPerPage] = useState(8);

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

  const employeeMap = useMemo(() => {
    const map = new Map<string, Employe>();
    if (allEmployees) allEmployees.forEach(e => map.set(e.id, e));
    return map;
  }, [allEmployees]);

  const mappedRolesForMatrix = useMemo(() => {
    if (!roles) return [];
    return roles.map(r => ({
      id: r.id,
      label: r.name,
      isSystem: ['dirigeant-president', 'cadre-superieur-directeur', 'cadre-intermediaire-chef-service', 'employe-operationnel', 'stagiaire-apprenti', 'super-admin', 'administrateur'].includes(r.id)
    }));
  }, [roles]);

  const handleAddUser = () => {
    setIsAddUserSheetOpen(false);
    toast({ title: "Utilisateur ajouté", description: "Le nouvel utilisateur a été ajouté avec succès." });
  };

  const handleAddRole = (newRole: Role) => {
    setIsAddRoleSheetOpen(false);
    toast({ title: "Rôle ajouté", description: `Le rôle ${newRole.name} a été ajouté avec succès.` });
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
    } catch {
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
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'enregistrer la direction." });
    }
  };

  const handleUpdateUserRole = async (userId: string, newRoleId: string) => {
    try {
      await updateUser(userId, { roleId: newRoleId });
      toast({ title: "Rôle mis à jour", description: "Le rôle de l'utilisateur a été modifié avec succès." });
      setIsEditUserDialogOpen(false);
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de mettre à jour le rôle de l'utilisateur." });
    }
  };

  const handleLinkUserToEmployee = async (userId: string, employeeId: string) => {
    try {
      await updateUser(userId, { employeeId });
      await updateEmployee(employeeId, { userId });
      toast({ title: "Utilisateur lié", description: "Le compte utilisateur a été lié au profil employé." });
      setIsLinkUserDialogOpen(false);
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de lier l'utilisateur à l'employé." });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'user') await deleteUser(deleteTarget.id);
      else if (deleteTarget.type === 'role') await deleteRole(deleteTarget.id);
      else if (deleteTarget.type === 'department') await deleteDepartment(deleteTarget.id);
      else if (deleteTarget.type === 'direction') await deleteDirection(deleteTarget.id);
      else if (deleteTarget.type === 'service') await deleteService(deleteTarget.id);
      toast({ title: "Suppression réussie", description: `"${deleteTarget.name}" a été supprimé.` });
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: `Impossible de supprimer "${deleteTarget.name}".` });
    } finally {
      setDeleteTarget(null);
    }
  };

  const tabs = [
    { id: "overview", label: "Vue d'ensemble", icon: <Layers size={12} /> },
    { id: "users", label: "Utilisateurs", icon: <Users size={12} /> },
    { id: "security", label: "Sécurité", icon: <ShieldCheck size={12} /> },
    { id: "org", label: "Organisation", icon: <Building size={12} /> },
  ];

  const userCount = users?.length ?? 0;
  const roleCount = roles?.length ?? 0;
  const deptCount = departments?.length ?? 0;

  return (
    <PermissionGuard permission="page:admin:view">
      <TooltipProvider>
        {/* ─── Win2K Outer Shell ─── */}
        <div style={{
          background: W.bg,
          minHeight: "100vh",
          fontFamily: "Tahoma, 'MS Sans Serif', Arial, sans-serif",
          padding: 8,
        }}>
          {/* Window Chrome */}
          <Win2KPanel style={{ width: "100%", maxWidth: 1200, margin: "0 auto" }}>
            <Win2KTitleBar
              title="Administration — Console de Gestion CNRCT"
              icon={<Settings size={12} color={W.titleBarText} />}
            />

            {/* Toolbar */}
            <div style={{
              ...flat,
              display: "flex",
              alignItems: "center",
              gap: 2,
              padding: "3px 4px",
              borderBottom: `1px solid ${W.shadow}`,
            }}>
              <Avatar style={{ width: 22, height: 22, border: `1px solid ${W.shadow}` }}>
                <AvatarImage src={user?.photoUrl || undefined} alt={user?.name || ""} />
                <AvatarFallback style={{
                  fontSize: 10, fontFamily: "Tahoma", background: W.bg, color: W.text
                }}>
                  {user?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span style={{ fontSize: 11, color: W.text, marginRight: 8 }}>
                {user?.name || "Utilisateur"}
              </span>
              <div style={{ width: 1, height: 20, background: W.shadow, margin: "0 4px" }} />
              <Win2KIconButton onClick={() => setIsAddUserSheetOpen(true)} title="Ajouter un utilisateur">
                <Users size={14} />
              </Win2KIconButton>
              <Win2KIconButton onClick={() => setIsAddRoleSheetOpen(true)} title="Ajouter un rôle">
                <Shield size={14} />
              </Win2KIconButton>
              <div style={{ width: 1, height: 20, background: W.shadow, margin: "0 4px" }} />
              <span style={{ fontSize: 11, color: W.textDisabled }}>
                {userCount} utilisateur{userCount > 1 ? "s" : ""} · {roleCount} rôle{roleCount > 1 ? "s" : ""} · {deptCount} département{deptCount > 1 ? "s" : ""}
              </span>
            </div>

            {error && (
              <div style={{
                background: "#FFCCCC", border: `1px solid #CC0000`,
                padding: "4px 8px", fontSize: 11, fontFamily: "Tahoma", color: "#CC0000",
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <AlertTriangle size={12} /> {error}
              </div>
            )}

            {/* Tab Bar + Content */}
            <PermissionLock userEmail={user?.email ?? ""}>
              <div style={{ padding: "8px 8px 0" }}>
                <Win2KTabBar tabs={tabs} active={activeTab} onSelect={setActiveTab} />
              </div>

              <div style={{
                ...raised,
                margin: "0 8px 8px",
                padding: 8,
                borderTop: `2px solid ${W.highlight}`,
                position: "relative",
                zIndex: 1,
              }}>

                {/* ─── VUE D'ENSEMBLE ─────────────────────────────────── */}
                {activeTab === "overview" && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 8 }}>
                    {/* Import Data */}
                    <Win2KGroupBox title="Importation de Données">
                      <div style={{ padding: "4px 0" }}>
                        <ImportDataCard />
                      </div>
                    </Win2KGroupBox>
                    {/* Import Villages */}
                    <Win2KGroupBox title="Importation de Villages">
                      <div style={{ padding: "4px 0" }}>
                        <ImportVillagesCard />
                      </div>
                    </Win2KGroupBox>
                    {/* Settings */}
                    <Win2KGroupBox title="Paramètres Généraux">
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <Link href="/settings/organization" style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "4px 6px",
                          textDecoration: "none",
                          color: W.text,
                          fontSize: 11,
                          border: `1px solid transparent`,
                        }}
                          onMouseEnter={e => (e.currentTarget.style.background = W.tableRowHover, e.currentTarget.style.color = W.tableRowHoverText)}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent", e.currentTarget.style.color = W.text)}
                        >
                          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Building size={12} />
                            Organisation
                          </span>
                          <ChevronRight size={10} />
                        </Link>
                        <Link href="/settings" style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "4px 6px",
                          textDecoration: "none",
                          color: W.text,
                          fontSize: 11,
                          border: `1px solid transparent`,
                        }}
                          onMouseEnter={e => (e.currentTarget.style.background = W.tableRowHover, e.currentTarget.style.color = W.tableRowHoverText)}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent", e.currentTarget.style.color = W.text)}
                        >
                          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Settings size={12} />
                            Paramètres Système
                          </span>
                          <ChevronRight size={10} />
                        </Link>
                      </div>
                    </Win2KGroupBox>
                  </div>
                )}

                {/* ─── UTILISATEURS ───────────────────────────────────── */}
                {activeTab === "users" && (
                  <Win2KGroupBox title="Gestion des Utilisateurs">
                    {/* Toolbar */}
                    <div style={{ display: "flex", gap: 4, marginBottom: 6, alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 2, ...sunken, flex: 1, padding: "1px 4px" }}>
                        <Search size={12} style={{ color: W.textDisabled, flexShrink: 0 }} />
                        <input
                          value={userSearch}
                          onChange={e => { setUserSearch(e.target.value); setUserCurrentPage(1); }}
                          placeholder="Rechercher par nom ou email..."
                          style={{
                            flex: 1,
                            border: "none",
                            outline: "none",
                            background: "transparent",
                            fontFamily: "Tahoma, sans-serif",
                            fontSize: 11,
                            color: W.text,
                            padding: "1px 2px",
                          }}
                        />
                      </div>
                      <Win2KButton onClick={() => setIsAddUserSheetOpen(true)} small>
                        <PlusCircle size={12} /> Ajouter
                      </Win2KButton>
                    </div>

                    <Win2KTable
                      headers={["N°", "Nom", "Email", "Rôle", "Actions"]}
                      loading={loading}
                    >
                      {!loading && paginatedUsers.length === 0 ? (
                        <EmptyState icon={Users} message={userSearch ? `Aucun résultat pour "${userSearch}"` : "Aucun utilisateur."} />
                      ) : (
                        paginatedUsers.map((u, index) => (
                          <Win2KTableRow key={u.id} index={index}>
                            <Win2KTd>{(userCurrentPage - 1) * userItemsPerPage + index + 1}</Win2KTd>
                            <Win2KTd>
                              <div>
                                <span style={{ fontWeight: "bold" }}>{u.name}</span>
                                {u.employeeId && (
                                  <div style={{ fontSize: 10, color: W.textDisabled }}>
                                    Lié : {employeeMap.get(u.employeeId)?.name || "N/A"}
                                  </div>
                                )}
                              </div>
                            </Win2KTd>
                            <Win2KTd>{u.email}</Win2KTd>
                            <Win2KTd>
                              <Win2KBadge variant={!u.role ? "error" : "default"}>
                                {u.role?.name || "Non assigné"}
                              </Win2KBadge>
                            </Win2KTd>
                            <Win2KTd>
                              <div style={{ display: "flex", gap: 2 }}>
                                <Win2KIconButton onClick={() => { setLinkingUser(u); setIsLinkUserDialogOpen(true); }} title="Lier à un employé">
                                  <Link2 size={12} />
                                </Win2KIconButton>
                                <Win2KIconButton onClick={() => { setEditingUser(u); setIsEditUserDialogOpen(true); }} title="Modifier le rôle">
                                  <Pencil size={12} />
                                </Win2KIconButton>
                                <Win2KIconButton onClick={() => setDeleteTarget({ id: u.id, type: "user", name: u.name })} title="Supprimer">
                                  <Trash2 size={12} />
                                </Win2KIconButton>
                              </div>
                            </Win2KTd>
                          </Win2KTableRow>
                        ))
                      )}
                    </Win2KTable>

                    {!loading && filteredUsers.length > userItemsPerPage && (
                      <div style={{ marginTop: 6 }}>
                        <PaginationControls
                          currentPage={userCurrentPage}
                          totalPages={totalUserPages}
                          onPageChange={setUserCurrentPage}
                          itemsPerPage={userItemsPerPage}
                          onItemsPerPageChange={() => {}}
                          totalItems={filteredUsers.length}
                        />
                      </div>
                    )}
                  </Win2KGroupBox>
                )}

                {/* ─── SÉCURITÉ ────────────────────────────────────────── */}
                {activeTab === "security" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <Win2KGroupBox title="Gestion des Rôles">
                      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
                        <Win2KButton onClick={() => setIsAddRoleSheetOpen(true)} small>
                          <PlusCircle size={12} /> Ajouter un rôle
                        </Win2KButton>
                      </div>
                      <Win2KTable headers={["N°", "Rôle", "Actions"]} loading={loading}>
                        {!loading && (!roles || roles.length === 0) ? (
                          <EmptyState icon={Shield} message="Aucun rôle défini. Créez le premier rôle." />
                        ) : (
                          (roles || []).map((role, index) => (
                            <Win2KTableRow key={role.id} index={index}>
                              <Win2KTd>{index + 1}</Win2KTd>
                              <Win2KTd style={{ fontWeight: "bold" }}>{role.name}</Win2KTd>
                              <Win2KTd>
                                <Win2KIconButton onClick={() => setDeleteTarget({ id: role.id, type: "role", name: role.name })} title="Supprimer">
                                  <Trash2 size={12} />
                                </Win2KIconButton>
                              </Win2KTd>
                            </Win2KTableRow>
                          ))
                        )}
                      </Win2KTable>
                    </Win2KGroupBox>

                    {(user?.roleId === "LHcHyfBzile3r0vyFOFb" || user?.roleId === "super-admin") && (
                      <Win2KGroupBox title="Matrice des Permissions CRUD">
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                          <ShieldCheck size={14} />
                          <span style={{ fontSize: 11, color: W.textDisabled }}>
                            Contrôlez les droits de Lecture, Création, Modification et Suppression par ressource.
                          </span>
                        </div>
                        <PermissionMatrix roles={mappedRolesForMatrix} />
                      </Win2KGroupBox>
                    )}
                  </div>
                )}

                {/* ─── ORGANISATION ───────────────────────────────────── */}
                {activeTab === "org" && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 8 }}>
                    {/* Departments */}
                    <Win2KGroupBox title="Départements">
                      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
                        <Win2KButton small onClick={() => { setEditingDepartment(null); setIsDepartmentDialogOpen(true); }}>
                          <PlusCircle size={12} /> Ajouter
                        </Win2KButton>
                      </div>
                      <Win2KTable headers={["N°", "Nom", "Actions"]} loading={loading}>
                        {!loading && (!departments || departments.length === 0) ? (
                          <EmptyState icon={Building} message="Aucun département." />
                        ) : (
                          (departments || []).map((dept, index) => (
                            <Win2KTableRow key={dept.id} index={index}>
                              <Win2KTd>{index + 1}</Win2KTd>
                              <Win2KTd style={{ fontWeight: "bold", width: "100%" }}>{dept.name}</Win2KTd>
                              <Win2KTd>
                                <div style={{ display: "flex", gap: 2 }}>
                                  <Win2KIconButton onClick={() => { setEditingDepartment(dept); setIsDepartmentDialogOpen(true); }} title="Modifier">
                                    <Pencil size={12} />
                                  </Win2KIconButton>
                                  <Win2KIconButton onClick={() => setDeleteTarget({ id: dept.id, type: "department", name: dept.name })} title="Supprimer">
                                    <Trash2 size={12} />
                                  </Win2KIconButton>
                                </div>
                              </Win2KTd>
                            </Win2KTableRow>
                          ))
                        )}
                      </Win2KTable>
                    </Win2KGroupBox>

                    {/* Directions */}
                    <Win2KGroupBox title="Directions">
                      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
                        <Win2KButton small onClick={() => { setEditingDirection(null); setIsDirectionDialogOpen(true); }} disabled={!departments || departments.length === 0}>
                          <PlusCircle size={12} /> Ajouter
                        </Win2KButton>
                      </div>
                      <Win2KTable headers={["N°", "Nom", "Département", "Actions"]} loading={loading}>
                        {!loading && (!directions || directions.length === 0) ? (
                          <EmptyState icon={Layers} message="Aucune direction." />
                        ) : (
                          (directions || []).map((dir, index) => (
                            <Win2KTableRow key={dir.id} index={index}>
                              <Win2KTd>{index + 1}</Win2KTd>
                              <Win2KTd style={{ fontWeight: "bold" }}>{dir.name}</Win2KTd>
                              <Win2KTd style={{ color: W.textDisabled }}>{departments?.find(d => d.id === dir.departmentId)?.name}</Win2KTd>
                              <Win2KTd>
                                <div style={{ display: "flex", gap: 2 }}>
                                  <Win2KIconButton onClick={() => { setEditingDirection(dir); setIsDirectionDialogOpen(true); }} title="Modifier">
                                    <Pencil size={12} />
                                  </Win2KIconButton>
                                  <Win2KIconButton onClick={() => setDeleteTarget({ id: dir.id, type: "direction", name: dir.name })} title="Supprimer">
                                    <Trash2 size={12} />
                                  </Win2KIconButton>
                                </div>
                              </Win2KTd>
                            </Win2KTableRow>
                          ))
                        )}
                      </Win2KTable>
                    </Win2KGroupBox>

                    {/* Services */}
                    <Win2KGroupBox title="Services">
                      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
                        <Win2KButton small
                          onClick={() => { setEditingService(null); setIsServiceDialogOpen(true); }}
                          disabled={(!directions || directions.length === 0) && (!departments || departments.length === 0)}
                        >
                          <PlusCircle size={12} /> Ajouter
                        </Win2KButton>
                      </div>
                      <Win2KTable headers={["N°", "Nom", "Dépend de", "Actions"]} loading={loading}>
                        {!loading && (!services || services.length === 0) ? (
                          <EmptyState icon={Layers} message="Aucun service." />
                        ) : (
                          (services || []).map((svc, index) => {
                            const parent = svc.directionId
                              ? directions?.find(d => d.id === svc.directionId)
                              : departments?.find(d => d.id === svc.departmentId);
                            return (
                              <Win2KTableRow key={svc.id} index={index}>
                                <Win2KTd>{index + 1}</Win2KTd>
                                <Win2KTd style={{ fontWeight: "bold" }}>{svc.name}</Win2KTd>
                                <Win2KTd style={{ color: W.textDisabled }}>{parent?.name || "N/A"}</Win2KTd>
                                <Win2KTd>
                                  <div style={{ display: "flex", gap: 2 }}>
                                    <Win2KIconButton onClick={() => { setEditingService(svc); setIsServiceDialogOpen(true); }} title="Modifier">
                                      <Pencil size={12} />
                                    </Win2KIconButton>
                                    <Win2KIconButton onClick={() => setDeleteTarget({ id: svc.id, type: "service", name: svc.name })} title="Supprimer">
                                      <Trash2 size={12} />
                                    </Win2KIconButton>
                                  </div>
                                </Win2KTd>
                              </Win2KTableRow>
                            );
                          })
                        )}
                      </Win2KTable>
                    </Win2KGroupBox>
                  </div>
                )}
              </div>
            </PermissionLock>

            {/* Status Bar */}
            <div style={{ padding: "0 8px 8px", display: "flex", gap: 4 }}>
              <Win2KStatusBar text={`Connecté : ${user?.name || "—"}`} />
              <Win2KStatusBar text={`${userCount} utilisateurs`} />
              <Win2KStatusBar text={`${deptCount} départements`} />
            </div>
          </Win2KPanel>
        </div>

        {/* ─── Dialogs (unchanged functionality) ─── */}
        <AddUserSheet isOpen={isAddUserSheetOpen} onCloseAction={() => setIsAddUserSheetOpen(false)} onAddUserAction={handleAddUser} roles={roles || []} />
        <AddRoleSheet isOpen={isAddRoleSheetOpen} onCloseAction={() => setIsAddRoleSheetOpen(false)} onAddRoleAction={handleAddRole} roles={roles || []} />
        <DepartmentDialog isOpen={isDepartmentDialogOpen} onCloseAction={() => setIsDepartmentDialogOpen(false)} onConfirmAction={handleSaveDepartment} department={editingDepartment} />
        <DirectionDialog isOpen={isDirectionDialogOpen} onCloseAction={() => setIsDirectionDialogOpen(false)} onConfirmAction={handleSaveDirection} direction={editingDirection} departments={departments || []} />
        <ServiceDialog isOpen={isServiceDialogOpen} onCloseAction={() => setIsServiceDialogOpen(false)} service={editingService} directions={directions || []} departments={departments || []} />
        <EditUserRoleDialog isOpen={isEditUserDialogOpen} onCloseAction={() => setIsEditUserDialogOpen(false)} onConfirmAction={handleUpdateUserRole} user={editingUser} roles={roles || []} />
        <LinkUserEmployeeDialog isOpen={isLinkUserDialogOpen} onCloseAction={() => setIsLinkUserDialogOpen(false)} onConfirmAction={handleLinkUserToEmployee} user={linkingUser} employees={allEmployees} />

        <ConfirmationDialog
          isOpen={!!deleteTarget}
          onCloseAction={() => setDeleteTarget(null)}
          onConfirmAction={handleConfirmDelete}
          title={`Supprimer : ${deleteTarget?.name}`}
          description={`Êtes-vous sûr de vouloir supprimer "${deleteTarget?.name}" ? Cette action est irréversible.`}
        />
      </TooltipProvider>
    </PermissionGuard>
  );
}
