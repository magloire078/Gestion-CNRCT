// src/lib/permissions.ts

export const allPermissions = {
  "Accès au Tableau de Bord": "page:dashboard:view",
  "Gestion des Employés": "page:employees:view",
  "Gestion des Membres du Directoire": "page:board-members:view",
  "Gestion des Comités Régionaux": "page:regional-committees:view",
  "Gestion des Rois & Chefs": "page:chiefs:view",
  "Accès à la Cartographie": "page:mapping:view",
  "Gestion de la Paie": "page:payroll:view",
  "Gestion des Congés": "page:leave:view",
  "Gestion des Évaluations": "page:evaluations:view",
  "Gestion des Missions": "page:missions:view",
  "Gestion des Conflits": "page:conflicts:view",
  "Gestion des Fournitures": "page:supplies:view",
  "Gestion des Actifs TI": "page:it-assets:view",
  "Gestion de la Flotte": "page:fleet:view",
  "Gestion des Documents": "page:documents:view",
  "Accès à l'Assistant IA": "page:assistant:view",
  "Accès à l'Administration": "page:admin:view",
} as const;

export type PermissionKey = keyof typeof allPermissions;
export type PermissionValue = (typeof allPermissions)[PermissionKey];
