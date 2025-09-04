

// src/lib/permissions.ts

export const allPermissions = {
  "Accès au Tableau de Bord": "page:dashboard:view",
  "Accès à Mon Espace": "page:my-space:view",
  "Gestion des Employés": "page:employees:view",
  "Gestion des Rois & Chefs": "page:chiefs:view",
  "Accès à la Cartographie": "page:mapping:view",
  "Gestion de la Paie": "page:payroll:view",
  "Gestion des Congés": "page:leave:view",
  "Gestion des Évaluations": "page:evaluations:view",
  "Gestion des Indemnités": "page:indemnities:view",
  "Gestion des Missions": "page:missions:view",
  "Gestion des Conflits": "page:conflicts:view",
  "Gestion des Fournitures": "page:supplies:view",
  "Gestion des Actifs TI": "page:it-assets:view",
  "Gestion de la Flotte": "page:fleet:view",
  "Gestion des Documents": "page:documents:view",
  "Accès à l'Assistant IA": "page:assistant:view",
  "Accès à l'Administration": "page:admin:view",

  // Group permissions
  "Voir le groupe Personnel": "group:personnel:view",
  "Voir le groupe Organisation": "group:organization:view",
  "Voir le groupe Opérations": "group:operations:view",
  "Voir le groupe Administration": "group:admin:view",

  // Feature permissions
  "Importer les employés": "feature:employees:import",
  "Exporter les employés": "feature:employees:export",
  "Importer les chefs": "feature:chiefs:import",
  "Exporter les chefs": "feature:chiefs:export",
} as const;

export type PermissionKey = keyof typeof allPermissions;
export type PermissionValue = (typeof allPermissions)[PermissionKey];
