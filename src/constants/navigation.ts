import {
  Car,
  FileText,
  Laptop,
  LayoutDashboard,
  Users,
  CalendarOff,
  Building2,
  MessageSquare,
  Landmark,
  Shield,
  Briefcase,
  Scale,
  Settings,
  Package,
  Crown,
  MapPin,
  ClipboardCheck,
  Building,
  Globe,
  Network,
  Archive,
  Mail,
  Wallet,
  FileClock,
  DatabaseBackup,
  BookText,
  LifeBuoy,
  ShieldCheck,
  Fuel,
  HeartHandshake,
  Users2,
  History,
  Zap,
  HandshakeIcon,
  Newspaper,
  MessageCircle,
  FileBarChart,
  FileCheck,
  Map as MapIcon,
  UserCheck,
} from "lucide-react";
import React from "react";

export interface SubMenuItem {
  href: string;
  label: string;
  icon: React.ElementType;
  permission: string;
}

export interface MenuItem {
  isCollapsible?: boolean;
  label: string;
  icon: React.ElementType;
  permission: string;
  href?: string;
  subItems?: SubMenuItem[];
}

/**
 * Source unique de vérité et hiérarchie épurée, dédupliquée et factorisée de la navigation.
 */
export const ALL_MENU_ITEMS: MenuItem[] = [
  // --- RACINE / ACCÈS DIRECTS ---
  { 
    href: "/intranet", 
    label: "Accueil Intranet", 
    icon: LayoutDashboard, 
    permission: "page:intranet:view" 
  },
  { 
    href: "/management", 
    label: "Hub de Gestion", 
    icon: Zap, 
    permission: "page:management:view" 
  },
  { 
    href: "/dashboard", 
    label: "Tableau de Bord RH", 
    icon: ShieldCheck, 
    permission: "page:dashboard:view" 
  },
  { 
    href: "/helpdesk", 
    label: "Support IT & IA", 
    icon: LifeBuoy, 
    permission: "page:tickets:view" 
  },

  // --- L'INSTITUTION & GOUVERNANCE ---
  {
    isCollapsible: true,
    label: "L'Institution",
    icon: Landmark,
    permission: "page:organization-chart:view",
    subItems: [
      { href: "/institution", label: "Présentation Institutionnelle", icon: Building2, permission: "page:organization-chart:view" },
      { href: "/organization-chart", label: "Organigramme Officiel", icon: Network, permission: "page:organization-chart:view" },
      { href: "/employees?filter=directoire", label: "Directoire & Comités", icon: Building, permission: "page:employees:view" },
    ]
  },

  // --- RESSOURCES HUMAINES & SOCIAL ---
  {
    isCollapsible: true,
    label: "Personnel & RH",
    icon: Users,
    permission: "page:employees:view",
    subItems: [
      { href: "/employees", label: "Annuaire & Effectifs", icon: Users, permission: "page:employees:view" },
      { href: "/payroll", label: "Fiches de Paie & Salaires", icon: Wallet, permission: "page:payroll:view" },
      { href: "/leave", label: "Congés & Permissions", icon: CalendarOff, permission: "page:leaves:view" },
      { href: "/evaluations", label: "Évaluations du Personnel", icon: ClipboardCheck, permission: "page:evaluations:view" },
      { href: "/indemnities", label: "Indemnités & Avantages", icon: Scale, permission: "page:indemnities:view" },
    ]
  },

  // --- CONFLITS & MÉDIATION ---
  {
    isCollapsible: true,
    label: "Conflits & Médiation",
    icon: Scale,
    permission: "page:conflicts:view",
    subItems: [
      { href: "/conflicts", label: "Registre des Conflits", icon: Scale, permission: "page:conflicts:view" },
      { href: "/conflicts/press", label: "Veille Médiatique & Presse", icon: Newspaper, permission: "page:conflicts:view" },
      { href: "/mapping", label: "SIG & Cartographie des Conflits", icon: MapIcon, permission: "page:mapping:view" },
    ]
  },

  // --- LOCALITÉS & CHEFFERIES ---
  {
    isCollapsible: true,
    label: "Localités & Autorités",
    icon: Crown,
    permission: "page:villages:view",
    subItems: [
      { href: "/chiefs", label: "Rois & Chefs Traditionnels", icon: Crown, permission: "page:chiefs:view" },
      { href: "/kingdoms", label: "Grands Royaumes", icon: Landmark, permission: "page:chiefs:view" },
      { href: "/cantons", label: "Cantons & Tribus", icon: Network, permission: "page:villages:view" },
      { href: "/villages", label: "Villages & Découpage", icon: MapPin, permission: "page:villages:view" },
      { href: "/map", label: "SIG National des Chefferies", icon: Globe, permission: "page:chiefs:view" },
    ]
  },

  // --- CULTURE & PATRIMOINE (Factorisé) ---
  {
    isCollapsible: true,
    label: "Culture & Patrimoine",
    icon: History,
    permission: "page:heritage:view",
    subItems: [
      { href: "/heritage", label: "Portail du Patrimoine", icon: History, permission: "page:heritage:view" },
      { href: "/us-et-coutumes", label: "Us, Coutumes & Traditions", icon: BookText, permission: "page:us-et-coutumes:view" },
      { href: "/ethnies", label: "Cartographie Ethnographique", icon: Globe, permission: "page:us-et-coutumes:view" },
      { href: "/heritage/alliances", label: "Alliances Inter-ethniques", icon: HeartHandshake, permission: "page:heritage:view" },
    ]
  },

  // --- OPÉRATIONS & LOGISTIQUE ---
  {
    isCollapsible: true,
    label: "Opérations & Logistique",
    icon: Briefcase,
    permission: "page:supplies:view",
    subItems: [
      { href: "/missions", label: "Ordres de Mission", icon: Briefcase, permission: "page:missions:view" },
      { href: "/budget", label: "Budget & Engagements", icon: Wallet, permission: "page:budget:view" },
      { href: "/fleet", label: "Flotte & Carburant", icon: Car, permission: "page:fleet:view" },
      { href: "/supplies", label: "Stocks & Fournitures", icon: Package, permission: "page:supplies:view" },
      { href: "/procurement", label: "Marchés & Prestataires", icon: HandshakeIcon, permission: "page:procurement:view" },
      { href: "/mails", label: "Gestion des Courriers", icon: Mail, permission: "page:mails:view" },
      { href: "/documents", label: "Génération & Modèles", icon: FileText, permission: "page:repository:view" },
      { href: "/repository", label: "Référentiel Documentaire", icon: Archive, permission: "page:repository:view" },
    ]
  },

  // --- RAPPORTS CONSOLIDÉS ---
  {
    isCollapsible: true,
    label: "Rapports & Synthèses",
    icon: FileBarChart,
    permission: "page:dashboard:view",
    subItems: [
      { href: "/reports", label: "Observatoire & Synthèses", icon: FileBarChart, permission: "page:dashboard:view" },
      { href: "/reports/nominative", label: "Tableau Nominatif & DISA", icon: FileCheck, permission: "page:reports:nominative:view" },
      { href: "/reports/employees", label: "Bilan RH & Effectifs", icon: Users2, permission: "page:dashboard:view" },
      { href: "/reports/supplies", label: "Logistique & Matériel", icon: Package, permission: "page:supplies:view" },
      { href: "/reports/chiefs", label: "Chefferies & Conflits", icon: Crown, permission: "page:chiefs:view" },
    ]
  },

  // --- ADMINISTRATION & SÉCURITÉ ---
  {
    isCollapsible: true,
    label: "Administration",
    icon: Shield,
    permission: "page:admin:view",
    subItems: [
      { href: "/admin", label: "Sécurité & Habilitations", icon: ShieldCheck, permission: "page:admin:view" },
      { href: "/it-assets", label: "Parc & Actifs Informatiques", icon: Laptop, permission: "page:it-assets:view" },
      { href: "/admin/news", label: "Actualités & Diffusion", icon: MessageSquare, permission: "page:news:view" },
      { href: "/backup", label: "Sauvegarde & Restauration", icon: DatabaseBackup, permission: "page:backup:view" },
      { href: "/settings", label: "Paramètres Système", icon: Settings, permission: "page:admin:view" },
    ]
  },
];
