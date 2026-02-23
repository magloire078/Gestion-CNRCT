
export type CrudAction = 'read' | 'create' | 'update' | 'delete';

export interface CrudPermission {
    read: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
}

export type ResourcePermissions = Record<string, CrudPermission>;

export interface ResourceConfig {
    id: string;
    label: string;
    icon: string;
    availableActions: CrudAction[];
    description?: string;
}

export interface RoleConfig {
    id: string;
    label: string;
    isSystem?: boolean; // Super Admin — non modifiable
    defaultPermissions: ResourcePermissions;
}

/** Source de vérité de toutes les ressources de l'application.
 *  Ajouter une entrée ici suffira pour l'inclure dans la matrice.
 */
export const RESOURCES_CONFIG: ResourceConfig[] = [
    { id: 'dashboard', label: 'Tableau de bord', icon: 'LayoutDashboard', availableActions: ['read'] },
    { id: 'employees', label: 'Employés', icon: 'Users', availableActions: ['read', 'create', 'update', 'delete'] },
    { id: 'payroll', label: 'Fiches de Paie', icon: 'Wallet', availableActions: ['read', 'create', 'update', 'delete'] },
    { id: 'leaves', label: 'Congés', icon: 'CalendarOff', availableActions: ['read', 'create', 'update', 'delete'] },
    { id: 'missions', label: 'Missions', icon: 'MapPin', availableActions: ['read', 'create', 'update', 'delete'] },
    { id: 'conflicts', label: 'Conflits', icon: 'AlertTriangle', availableActions: ['read', 'create', 'update', 'delete'] },
    { id: 'supplies', label: 'Fournitures', icon: 'Package', availableActions: ['read', 'create', 'update', 'delete'] },
    { id: 'it-assets', label: 'Assets IT', icon: 'Monitor', availableActions: ['read', 'create', 'update', 'delete'] },
    { id: 'fleet', label: 'Flotte Véhicules', icon: 'Car', availableActions: ['read', 'create', 'update', 'delete'] },
    { id: 'news', label: 'Actualités', icon: 'Newspaper', availableActions: ['read', 'create', 'update', 'delete'] },
    { id: 'repository', label: 'Documents', icon: 'FolderOpen', availableActions: ['read', 'create', 'update', 'delete'] },
    { id: 'budget', label: 'Budget', icon: 'PieChart', availableActions: ['read', 'create', 'update', 'delete'] },
    { id: 'evaluations', label: 'Évaluations', icon: 'ClipboardList', availableActions: ['read', 'create', 'update', 'delete'] },
    { id: 'tickets', label: 'Tickets Support', icon: 'LifeBuoy', availableActions: ['read', 'create', 'update', 'delete'] },
    { id: 'chiefs', label: 'Chefs Coutumiers', icon: 'Crown', availableActions: ['read', 'create', 'update', 'delete'] },
    { id: 'mapping', label: 'Cartographie', icon: 'Map', availableActions: ['read'] },
    { id: 'assistant', label: 'Assistant IA', icon: 'Bot', availableActions: ['read'] },
    { id: 'settings', label: 'Paramètres', icon: 'Settings', availableActions: ['read', 'update'] },
    { id: 'admin', label: 'Administration', icon: 'ShieldCheck', availableActions: ['read', 'update'] },
    { id: 'audit-log', label: 'Journal d\'Audit', icon: 'ScrollText', availableActions: ['read'] },
];

const ALL_READ: CrudPermission = { read: true, create: false, update: false, delete: false };
const ALL_CRUD: CrudPermission = { read: true, create: true, update: true, delete: true };
const READ_UPDATE: CrudPermission = { read: true, create: false, update: true, delete: false };
const READ_CREATE: CrudPermission = { read: true, create: true, update: false, delete: false };
const NO_ACCESS: CrudPermission = { read: false, create: false, update: false, delete: false };

function buildDefault(overrides: ResourcePermissions = {}): ResourcePermissions {
    const base: ResourcePermissions = {};
    for (const r of RESOURCES_CONFIG) {
        base[r.id] = NO_ACCESS;
    }
    return { ...base, ...overrides };
}

export const DEFAULT_ROLE_PERMISSIONS: Record<string, ResourcePermissions> = {
    'super-admin': buildDefault(
        Object.fromEntries(RESOURCES_CONFIG.map(r => [r.id, ALL_CRUD])) as ResourcePermissions
    ),
    'LHcHyfBzile3r0vyFOFb': buildDefault(
        Object.fromEntries(RESOURCES_CONFIG.map(r => [r.id, ALL_CRUD])) as ResourcePermissions
    ),
    'administrateur': buildDefault({
        dashboard: ALL_READ, employees: ALL_CRUD, payroll: ALL_CRUD,
        leaves: ALL_CRUD, missions: ALL_CRUD, conflicts: ALL_CRUD,
        supplies: ALL_CRUD, 'it-assets': ALL_CRUD, fleet: ALL_CRUD,
        news: ALL_CRUD, repository: ALL_CRUD, budget: ALL_CRUD,
        evaluations: ALL_CRUD, tickets: ALL_CRUD, chiefs: ALL_CRUD,
        mapping: ALL_READ, assistant: ALL_READ, settings: READ_UPDATE,
        admin: READ_UPDATE, 'audit-log': ALL_READ,
    }),
    'manager-rh': buildDefault({
        dashboard: ALL_READ, employees: READ_UPDATE, payroll: ALL_READ,
        leaves: ALL_CRUD, missions: ALL_READ, evaluations: ALL_CRUD,
        repository: READ_CREATE, tickets: ALL_CRUD, 'my-space': ALL_READ,
        assistant: ALL_READ,
    }),
    'comptables': buildDefault({
        dashboard: ALL_READ, payroll: ALL_CRUD, budget: ALL_CRUD,
        repository: READ_CREATE, tickets: ALL_READ, 'my-space': ALL_READ,
    }),
    'dirigeant-president': buildDefault({
        dashboard: ALL_READ, employees: ALL_READ, payroll: ALL_READ,
        leaves: ALL_READ, missions: ALL_READ, conflicts: ALL_READ,
        budget: ALL_READ, evaluations: ALL_READ, news: ALL_READ,
        repository: ALL_READ, chiefs: ALL_READ, mapping: ALL_READ,
        assistant: ALL_READ, settings: ALL_READ, admin: ALL_READ,
        'audit-log': ALL_READ,
    }),
    'chef-de-service': buildDefault({
        dashboard: ALL_READ, employees: ALL_READ, leaves: ALL_CRUD,
        missions: READ_CREATE, evaluations: ALL_CRUD, tickets: ALL_CRUD,
        repository: READ_CREATE, assistant: ALL_READ,
    }),
    'employe': buildDefault({
        dashboard: ALL_READ, repository: ALL_READ, assistant: ALL_READ,
        tickets: READ_CREATE, 'my-space': ALL_READ,
    }),
    'stagiaire': buildDefault({
        dashboard: ALL_READ, repository: ALL_READ, assistant: ALL_READ,
        tickets: READ_CREATE,
    }),
    'auditeur': buildDefault({
        dashboard: ALL_READ, employees: ALL_READ, payroll: ALL_READ,
        budget: ALL_READ, 'audit-log': ALL_READ, repository: ALL_READ,
    }),
    'responsable-it': buildDefault({
        dashboard: ALL_READ, 'it-assets': ALL_CRUD, fleet: ALL_CRUD,
        supplies: ALL_CRUD, tickets: ALL_CRUD, repository: READ_CREATE,
        assistant: ALL_READ,
    }),
};

export const ENTERPRISE_ROLES: RoleConfig[] = [
    { id: 'LHcHyfBzile3r0vyFOFb', label: 'Super Administrateur', isSystem: true, defaultPermissions: DEFAULT_ROLE_PERMISSIONS['LHcHyfBzile3r0vyFOFb'] },
    { id: 'administrateur', label: 'Administrateur', isSystem: false, defaultPermissions: DEFAULT_ROLE_PERMISSIONS['administrateur'] },
    { id: 'dirigeant-president', label: 'Dirigeant / Président', isSystem: false, defaultPermissions: DEFAULT_ROLE_PERMISSIONS['dirigeant-president'] },
    { id: 'manager-rh', label: 'Manager RH', isSystem: false, defaultPermissions: DEFAULT_ROLE_PERMISSIONS['manager-rh'] },
    { id: 'comptables', label: 'Comptable', isSystem: false, defaultPermissions: DEFAULT_ROLE_PERMISSIONS['comptables'] },
    { id: 'chef-de-service', label: 'Chef de Service', isSystem: false, defaultPermissions: DEFAULT_ROLE_PERMISSIONS['chef-de-service'] },
    { id: 'responsable-it', label: 'Responsable IT', isSystem: false, defaultPermissions: DEFAULT_ROLE_PERMISSIONS['responsable-it'] },
    { id: 'auditeur', label: 'Auditeur / CAC', isSystem: false, defaultPermissions: DEFAULT_ROLE_PERMISSIONS['auditeur'] },
    { id: 'employe', label: 'Employé Opérationnel', isSystem: false, defaultPermissions: DEFAULT_ROLE_PERMISSIONS['employe'] },
    { id: 'stagiaire', label: 'Stagiaire / Apprenti', isSystem: false, defaultPermissions: DEFAULT_ROLE_PERMISSIONS['stagiaire'] },
];
