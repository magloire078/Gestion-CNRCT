
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
    parentId?: string; // ID of the parent resource for hierarchical display
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
    // --- GROUPES PARENTS ---
    { id: 'group:institution', label: "L'INSTITUTION", icon: 'Building2', availableActions: ['read'] },
    { id: 'group:personnel', label: "PERSONNEL", icon: 'Users', availableActions: ['read'] },
    { id: 'group:operations', label: "OPÉRATIONS", icon: 'Briefcase', availableActions: ['read'] },
    { id: 'group:localities', label: "LOCALITÉS & AUTORITÉS", icon: 'MapPin', availableActions: ['read'] },
    { id: 'group:heritage', label: "CULTURE & PATRIMOINE", icon: 'History', availableActions: ['read'] },
    { id: 'group:reports', label: "RAPPORTS CONSOLIDÉS", icon: 'FileBarChart', availableActions: ['read'] },
    { id: 'group:administration', label: "ADMINISTRATION", icon: 'Shield', availableActions: ['read'] },

    // --- MODULES (ENFANTS) ---
    { id: 'dashboard', label: 'Tableau de bord', icon: 'LayoutDashboard', availableActions: ['read'], parentId: 'group:institution' },
    { id: 'intranet', label: 'Accueil / Intranet', icon: 'Home', availableActions: ['read'], parentId: 'group:institution' },
    { id: 'organization-chart', label: 'Organigramme', icon: 'Network', availableActions: ['read'], parentId: 'group:institution' },
    
    { id: 'employees', label: 'Employés', icon: 'Users', availableActions: ['read', 'create', 'update', 'delete'], parentId: 'group:personnel' },
    { id: 'payroll', label: 'Fiches de Paie', icon: 'Wallet', availableActions: ['read', 'create', 'update', 'delete'], parentId: 'group:personnel' },
    { id: 'leaves', label: 'Congés', icon: 'CalendarOff', availableActions: ['read', 'create', 'update', 'delete'], parentId: 'group:personnel' },
    { id: 'evaluations', label: 'Évaluations', icon: 'ClipboardList', availableActions: ['read', 'create', 'update', 'delete'], parentId: 'group:personnel' },
    { id: 'indemnities', label: 'Indemnités', icon: 'Calculator', availableActions: ['read', 'create', 'update', 'delete'], parentId: 'group:personnel' },

    { id: 'missions', label: 'Missions', icon: 'MapPin', availableActions: ['read', 'create', 'update', 'delete'], parentId: 'group:operations' },
    { id: 'conflicts', label: 'Conflits', icon: 'AlertTriangle', availableActions: ['read', 'create', 'update', 'delete'], parentId: 'group:operations' },
    { id: 'supplies', label: 'Fournitures', icon: 'Package', availableActions: ['read', 'create', 'update', 'delete'], parentId: 'group:operations' },
    { id: 'it-assets', label: 'Assets IT', icon: 'Monitor', availableActions: ['read', 'create', 'update', 'delete'], parentId: 'group:operations' },
    { id: 'fleet', label: 'Flotte Véhicules', icon: 'Car', availableActions: ['read', 'create', 'update', 'delete'], parentId: 'group:operations' },
    { id: 'fuel', label: 'Gestion de carburant', icon: 'Fuel', availableActions: ['read', 'create', 'update', 'delete'], parentId: 'group:operations' },
    { id: 'budget', label: 'Budget', icon: 'PieChart', availableActions: ['read', 'create', 'update', 'delete'], parentId: 'group:operations' },
    { id: 'repository', label: 'Référentiel Documents', icon: 'FolderOpen', availableActions: ['read', 'create', 'update', 'delete'], parentId: 'group:operations' },
    { id: 'mgp', label: 'Gestion des Plaintes', icon: 'MessageCircle', availableActions: ['read', 'create', 'update', 'delete'], parentId: 'group:operations' },

    { id: 'chiefs', label: 'Chefs Coutumiers', icon: 'Crown', availableActions: ['read', 'create', 'update', 'delete'], parentId: 'group:localities' },
    { id: 'villages', label: 'Villages', icon: 'MapPinned', availableActions: ['read', 'create', 'update', 'delete'], parentId: 'group:localities' },
    { id: 'mapping', label: 'Cartographie SIG', icon: 'Map', availableActions: ['read'], parentId: 'group:localities' },

    { id: 'heritage', label: 'Patrimoine', icon: 'Landmark', availableActions: ['read', 'create', 'update', 'delete'], parentId: 'group:heritage' },
    { id: 'us-et-coutumes', label: 'Us & Coutumes', icon: 'Scroll', availableActions: ['read', 'create', 'update', 'delete'], parentId: 'group:heritage' },

    { id: 'report-disa', label: 'Rapport DISA', icon: 'FileCheck', availableActions: ['read'], parentId: 'group:reports' },
    { id: 'report-nominative', label: 'Tableau Nominatif', icon: 'Users2', availableActions: ['read'], parentId: 'group:reports' },
    { id: 'report-territory', label: 'Observatoire Territorial', icon: 'Globe2', availableActions: ['read'], parentId: 'group:reports' },
    { id: 'report-it-technical', label: 'Point Technique', icon: 'Wrench', availableActions: ['read'], parentId: 'group:reports' },

    { id: 'admin', label: 'Paramètres Accès', icon: 'ShieldCheck', availableActions: ['read', 'update'], parentId: 'group:administration' },
    { id: 'news', label: 'Actualités', icon: 'Newspaper', availableActions: ['read', 'create', 'update', 'delete'], parentId: 'group:administration' },
    { id: 'backup', label: 'Sauvegarde & Restauration', icon: 'Database', availableActions: ['read', 'create'], parentId: 'group:administration' },
    { id: 'settings', label: 'Réglages Système', icon: 'Settings', availableActions: ['read', 'update'], parentId: 'group:administration' },
    { id: 'audit-log', label: "Journal d'Audit", icon: 'ScrollText', availableActions: ['read'], parentId: 'group:administration' },
    { id: 'tickets', label: 'Assistant IA & Support', icon: 'Bot', availableActions: ['read'], parentId: 'group:administration' },
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
        fuel: ALL_CRUD, indemnities: ALL_CRUD, heritage: ALL_CRUD,
        'us-et-coutumes': ALL_CRUD, villages: ALL_CRUD,
        'organization-chart': ALL_READ, intranet: ALL_READ,
        'report-disa': ALL_READ, 'report-nominative': ALL_READ,
        'report-territory': ALL_READ, 'report-it-technical': ALL_READ,
    }),
    'mediation': buildDefault({
        dashboard: ALL_READ, conflicts: ALL_CRUD, chiefs: ALL_CRUD,
        villages: ALL_CRUD, 'us-et-coutumes': ALL_CRUD, mapping: ALL_READ,
        repository: ALL_READ, assistant: ALL_READ, intranet: ALL_READ,
    }),
    'patrimoine': buildDefault({
        dashboard: ALL_READ, heritage: ALL_CRUD, 'it-assets': ALL_CRUD,
        fleet: ALL_CRUD, supplies: ALL_CRUD, repository: ALL_READ,
        assistant: ALL_READ, intranet: ALL_READ,
    }),
    'manager-rh': buildDefault({
        dashboard: ALL_READ, employees: READ_UPDATE, payroll: ALL_READ,
        leaves: ALL_CRUD, missions: ALL_READ, evaluations: ALL_CRUD,
        repository: READ_CREATE, tickets: ALL_CRUD, assistant: ALL_READ,
        intranet: ALL_READ, 'organization-chart': ALL_READ,
        indemnities: ALL_READ,
    }),
    'comptable': buildDefault({
        dashboard: ALL_READ, payroll: ALL_CRUD, budget: ALL_CRUD,
        repository: READ_CREATE, tickets: ALL_READ, assistant: ALL_READ,
        intranet: ALL_READ, indemnities: READ_UPDATE,
        'report-disa': ALL_READ, 'report-nominative': ALL_READ,
    }),
    'dirigeant-president': buildDefault({
        dashboard: ALL_READ, employees: ALL_READ, payroll: ALL_READ,
        leaves: ALL_READ, missions: ALL_READ, conflicts: ALL_READ,
        budget: ALL_READ, evaluations: ALL_READ, news: ALL_READ,
        repository: ALL_READ, chiefs: ALL_READ, mapping: ALL_READ,
        assistant: ALL_READ, settings: ALL_READ, admin: ALL_READ,
        'audit-log': ALL_READ, heritage: ALL_READ, villages: ALL_READ,
        'us-et-coutumes': ALL_READ, intranet: ALL_READ,
        'organization-chart': ALL_READ,
    }),
    'chef-de-service': buildDefault({
        dashboard: ALL_READ, employees: ALL_READ, leaves: ALL_CRUD,
        missions: READ_CREATE, evaluations: ALL_CRUD, tickets: ALL_CRUD,
        repository: READ_CREATE, assistant: ALL_READ,
    }),
    'employe': buildDefault({
        dashboard: ALL_READ, repository: ALL_READ, assistant: ALL_READ,
        tickets: NO_ACCESS, 'my-space': ALL_READ,
        missions: ALL_READ, payroll: ALL_READ,
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
    'gestionnaire-stock': buildDefault({
        dashboard: ALL_READ, supplies: ALL_CRUD, repository: READ_CREATE,
        tickets: ALL_READ, assistant: ALL_READ,
    }),
    'gestionnaire-carburant': buildDefault({
        dashboard: ALL_READ, fuel: ALL_CRUD, repository: READ_CREATE,
        tickets: ALL_READ, assistant: ALL_READ,
    }),
};

export const ENTERPRISE_ROLES: RoleConfig[] = [
    { id: 'LHcHyfBzile3r0vyFOFb', label: 'Super Administrateur', isSystem: true, defaultPermissions: DEFAULT_ROLE_PERMISSIONS['LHcHyfBzile3r0vyFOFb'] },
    { id: 'administrateur', label: 'Administrateur', isSystem: false, defaultPermissions: DEFAULT_ROLE_PERMISSIONS['administrateur'] },
    { id: 'dirigeant-president', label: 'Dirigeant / Président', isSystem: false, defaultPermissions: DEFAULT_ROLE_PERMISSIONS['dirigeant-president'] },
    { id: 'manager-rh', label: 'Manager RH', isSystem: false, defaultPermissions: DEFAULT_ROLE_PERMISSIONS['manager-rh'] },
    { id: 'mediation', label: 'Chargé de Médiation', isSystem: false, defaultPermissions: DEFAULT_ROLE_PERMISSIONS['mediation'] },
    { id: 'patrimoine', label: 'Responsable Patrimoine', isSystem: false, defaultPermissions: DEFAULT_ROLE_PERMISSIONS['patrimoine'] },
    { id: 'comptable', label: 'Comptable', isSystem: false, defaultPermissions: DEFAULT_ROLE_PERMISSIONS['comptable'] },
    { id: 'chef-de-service', label: 'Chef de Service', isSystem: false, defaultPermissions: DEFAULT_ROLE_PERMISSIONS['chef-de-service'] },
    { id: 'responsable-it', label: 'Responsable IT', isSystem: false, defaultPermissions: DEFAULT_ROLE_PERMISSIONS['responsable-it'] },
    { id: 'gestionnaire-stock', label: 'Gestionnaire de Stock et fournitures', isSystem: false, defaultPermissions: DEFAULT_ROLE_PERMISSIONS['gestionnaire-stock'] },
    { id: 'gestionnaire-carburant', label: 'Gestionnaire de carburant', isSystem: false, defaultPermissions: DEFAULT_ROLE_PERMISSIONS['gestionnaire-carburant'] },
    { id: 'auditeur', label: 'Auditeur / CAC', isSystem: false, defaultPermissions: DEFAULT_ROLE_PERMISSIONS['auditeur'] },
    { id: 'employe', label: 'Employé Opérationnel', isSystem: false, defaultPermissions: DEFAULT_ROLE_PERMISSIONS['employe'] },
    { id: 'stagiaire', label: 'Stagiaire / Apprenti', isSystem: false, defaultPermissions: DEFAULT_ROLE_PERMISSIONS['stagiaire'] },
];
