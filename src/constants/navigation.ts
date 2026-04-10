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
  MapIcon,
  MapPin,
  ClipboardCheck,
  Building,
  Globe,
  UserSquare as UserSquareIcon,
  ShieldHalf,
  Network,
  Archive,
  Wallet,
  FileClock,
  DatabaseBackup,
  BookText,
  LifeBuoy,
  ShieldCheck,
  Fuel,
  Utensils,
  Drama,
  Music,
  Gamepad2,
  HeartHandshake,
  Users2,
  History,
  Zap,
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

export const ALL_MENU_ITEMS: MenuItem[] = [
  { href: "/intranet", label: "Accueil", icon: LayoutDashboard, permission: "page:intranet:view" },
  { href: "/helpdesk", label: "Assistance IT", icon: LifeBuoy, permission: "page:tickets:view" },
  { href: "/management", label: "Gestion", icon: Zap, permission: "page:supplies:view" },
  { href: "/dashboard", label: "Tableau de Bord RH", icon: ShieldCheck, permission: "page:dashboard:view" },
  {
    isCollapsible: true,
    label: "L'Institution",
    icon: Landmark,
    permission: "page:organization-chart:view",
    subItems: [
      { href: "/organization-chart", label: "Organigramme", icon: Network, permission: "page:organization-chart:view" },
      { href: "/employees?filter=directoire", label: "Bureau du Directoire", icon: Building, permission: "page:employees:view" },
      { href: "/employees?filter=regional", label: "Comités Régionaux", icon: Globe, permission: "page:employees:view" },
    ]
  },
  {
    isCollapsible: true,
    label: "Cartographies",
    icon: MapIcon,
    permission: "page:mapping:view",
    subItems: [
      { href: "/employees?filter=directoire", label: "Membres du Directoire", icon: Building, permission: "page:employees:view" },
      { href: "/employees?filter=regional", label: "Comités Régionaux", icon: Globe, permission: "page:employees:view" },
      { href: "/employees?filter=all-geo", label: "Directoire & Régionale", icon: Globe, permission: "page:employees:view" },
    ]
  },
  {
    isCollapsible: true,
    label: "Personnel",
    icon: Users,
    permission: "page:employees:view",
    subItems: [
      { href: "/employees?filter=personnel-siege", label: "Personnel Siège", icon: Users, permission: "page:employees:view" },
      { href: "/employees?filter=chauffeur-directoire", label: "Chauffeur Directoire", icon: Car, permission: "page:employees:view" },
      { href: "/payroll", label: "Paie", icon: Landmark, permission: "page:payroll:view" },
      { href: "/leave", label: "Congés", icon: CalendarOff, permission: "page:leaves:view" },
      { href: "/evaluations", label: "Évaluations", icon: ClipboardCheck, permission: "page:evaluations:view" },
      { href: "/indemnities", label: "Indemnités", icon: Scale, permission: "page:indemnities:view" },
    ]
  },
  {
    isCollapsible: true,
    label: "Conflits",
    icon: Scale,
    permission: "page:conflicts:view",
    subItems: [
      { href: "/conflicts", label: "Gestion des Conflits", icon: Scale, permission: "page:conflicts:view" },
      { href: "/mapping", label: "Cartographie", icon: MapIcon, permission: "page:mapping:view" },
    ]
  },
  {
    isCollapsible: true,
    label: "Localités & Autorités",
    icon: Landmark,
    permission: "page:villages:view",
    subItems: [
      { href: "/chiefs", label: "Rois & Chefs", icon: Crown, permission: "page:chiefs:view" },
      { href: "/villages", label: "Villages", icon: MapPin, permission: "page:villages:view" },
    ]
  },
  {
    isCollapsible: true,
    label: "Culture & Patrimoine",
    icon: History,
    permission: "page:heritage:view",
    subItems: [
      { href: "/heritage", label: "Aperçu Global", icon: LayoutDashboard, permission: "page:heritage:view" },
      { href: "/us-et-coutumes", label: "Us & Coutumes", icon: BookText, permission: "page:us-et-coutumes:view" },
      { href: "/heritage/ethnies", label: "Ethnies & Groupes", icon: Users2, permission: "page:heritage:view" },
      { href: "/heritage/culinaire", label: "Arts Culinaires", icon: Utensils, permission: "page:heritage:view" },
      { href: "/heritage/masques", label: "Masques & Statues", icon: Drama, permission: "page:heritage:view" },
      { href: "/heritage/danses", label: "Danses & Musiques", icon: Music, permission: "page:heritage:view" },
      { href: "/heritage/jeux", label: "Jeux Traditionnels", icon: Gamepad2, permission: "page:heritage:view" },
      { href: "/heritage/alliances", label: "Alliances Inter-ethnies", icon: HeartHandshake, permission: "page:heritage:view" },
    ]
  },
  {
    isCollapsible: true,
    label: "Opérations",
    icon: Briefcase,
    permission: "page:supplies:view",
    subItems: [
      { href: "/missions", label: "Missions", icon: Briefcase, permission: "page:missions:view" },
      { href: "/budget", label: "Budget", icon: Wallet, permission: "page:budget:view" },
      { href: "/fleet", label: "Flotte de Véhicules", icon: Car, permission: "page:fleet:view" },
      { href: "/fleet/fuel", label: "Cartes de carburant", icon: Fuel, permission: "page:fuel:view" },
      { href: "/supplies", label: "Stock Fournitures", icon: Package, permission: "page:supplies:view" },
      { href: "/management/supplies", label: "Validation Fournitures", icon: ShieldCheck, permission: "management:supplies:validate" },
      { href: "/mgp", label: "Gestion des Plaintes", icon: MessageSquare, permission: "page:mgp:view" },
      { href: "/repository", label: "Référentiel", icon: Archive, permission: "page:repository:view" },
    ]
  },
  {
    isCollapsible: true,
    label: "Rapports",
    icon: FileText,
    href: "/reports",
    permission: "page:dashboard:view",
    subItems: [
      { href: "/reports", label: "Vue d'ensemble", icon: LayoutDashboard, permission: "page:dashboard:view" },
      { href: "/reports/employees", label: "Personnel", icon: Users, permission: "page:dashboard:view" },
      { href: "/reports/chiefs", label: "Rois & Chefs", icon: Crown, permission: "page:chiefs:view" },
      { href: "/reports/supplies", label: "Logistique", icon: Package, permission: "page:supplies:view" },
      { href: "/reports/assets", label: "Patrimoine", icon: Laptop, permission: "page:it-assets:view" },
      { href: "/reports/disa", label: "DISA (Paie)", icon: FileText, permission: "page:payroll:view" },
      { href: "/reports/nominative", label: "Tableau Nominatif", icon: FileText, permission: "page:payroll:view" },
      { href: "/leave/report", label: "Rapport Congés", icon: FileClock, permission: "page:leaves:view" },
      { href: "/missions/report", label: "Rapport Missions", icon: FileClock, permission: "page:missions:view" },
      { href: "/conflicts/report", label: "Rapport Conflits", icon: FileClock, permission: "page:conflicts:view" },
    ]
  },
  {
    isCollapsible: true,
    label: "Administration",
    icon: Shield,
    permission: "page:admin:view",
    subItems: [
      { href: "/admin/news", label: "Actualités", icon: MessageSquare, permission: "page:news:view" },
      { href: "/employees?filter=garde-republicaine", label: "Garde Républicaine", icon: ShieldHalf, permission: "page:employees:view" },
      { href: "/employees?filter=gendarme", label: "Gendarmes", icon: ShieldHalf, permission: "page:employees:view" },
      { href: "/it-assets", label: "Actifs TI", icon: Laptop, permission: "page:it-assets:view" },
      { href: "/documents", label: "Documents", icon: FileText, permission: "page:repository:view" },
      { href: "/backup", label: "Sauvegarde & Restauration", icon: DatabaseBackup, permission: "page:backup:view" },
      { href: "/admin", label: "Paramètres Admin", icon: Shield, permission: "page:admin:view" },
    ]
  },
];
