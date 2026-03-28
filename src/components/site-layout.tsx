
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Car,
  FileText,
  Laptop,
  LayoutDashboard,
  Users,
  CalendarOff,
  LogOut,
  Building2,
  MessageSquare,
  Landmark,
  Shield,
  Briefcase,
  Scale,
  Settings,
  MoreHorizontal,
  Loader2,
  Lock,
  Package,
  Crown,
  MapIcon,
  MapPin,
  ClipboardCheck,
  Building,
  Globe,
  ChevronDown,
  UserSquare as UserSquareIcon,
  ShieldHalf,
  Network,
  Archive,
  Wallet,
  FileClock,
  DatabaseBackup,
  BookText,
  LifeBuoy,
  Menu,
  Rocket,
  ShieldCheck,
  Fuel,
  Utensils,
  Drama,
  Music,
  Gamepad2,
  HeartHandshake,
  Users2,
  History,
} from "lucide-react";

import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { signOut } from "@/services/auth-service";

import {
  SidebarProvider,
  useSidebar,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "./ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { NotificationBell } from "./common/notification-bell";
import { cn } from "@/lib/utils";

const allMenuItems = [
  { href: "/intranet", label: "Accueil", icon: LayoutDashboard },
  { href: "/dashboard", label: "Tableau de Bord RH", icon: ShieldCheck, permission: "page:dashboard:view" },
  {
    isCollapsible: true,
    label: "L'Institution",
    icon: Landmark,
    permission: "group:personnel:view",
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
    permission: "group:personnel:view",
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
    permission: "group:personnel:view",
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
    permission: "group:organization:view",
    subItems: [
      { href: "/conflicts", label: "Gestion des Conflits", icon: Scale, permission: "page:conflicts:view" },
      { href: "/mapping", label: "Cartographie", icon: MapIcon, permission: "page:mapping:view" },
    ]
  },
  {
    isCollapsible: true,
    label: "Localités & Autorités",
    icon: Landmark,
    permission: "group:repertoires:view",
    subItems: [
      { href: "/chiefs", label: "Rois & Chefs", icon: Crown, permission: "page:chiefs:view" },
      { href: "/villages", label: "Villages", icon: MapPin, permission: "page:villages:view" },
    ]
  },
  {
    isCollapsible: true,
    label: "Culture & Patrimoine",
    icon: History,
    permission: "group:repertoires:view",
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
    permission: "group:operations:view",
    subItems: [
      { href: "/missions", label: "Missions", icon: Briefcase, permission: "page:missions:view" },
      { href: "/budget", label: "Budget", icon: Wallet, permission: "page:budget:view" },
      { href: "/fleet", label: "Flotte de Véhicules", icon: Car, permission: "page:fleet:view" },
      { href: "/fleet/fuel", label: "Cartes de carburant", icon: Fuel, permission: "page:fuel:view" },
      { href: "/supplies", label: "Fournitures", icon: Package, permission: "page:supplies:view" },
      { href: "/repository", label: "Référentiel", icon: Archive, permission: "page:repository:view" },
    ]
  },
  {
    isCollapsible: true,
    label: "Rapports",
    icon: FileText,
    permission: "group:reports:view",
    subItems: [
      { href: "/reports/disa", label: "DISA", icon: FileText, permission: "page:payroll:view" },
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
    permission: "group:admin:view",
    subItems: [
      { href: "/admin/news", label: "Actualités", icon: MessageSquare, permission: "page:admin:view" },
      { href: "/employees?filter=garde-republicaine", label: "Garde Républicaine", icon: ShieldHalf, permission: "page:employees:view" },
      { href: "/employees?filter=gendarme", label: "Gendarmes", icon: ShieldHalf, permission: "page:employees:view" },
      { href: "/it-assets", label: "Actifs TI", icon: Laptop, permission: "page:it-assets:view" },
      { href: "/documents", label: "Documents", icon: FileText, permission: "page:repository:view" },
      { href: "/helpdesk", label: "Helpdesk", icon: LifeBuoy, permission: "page:tickets:view" },
      { href: "/backup", label: "Sauvegarde & Restauration", icon: DatabaseBackup, permission: "page:backup:view" },
      { href: "/admin", label: "Paramètres Admin", icon: Shield, permission: "page:admin:view" },
    ]
  },
];

// Utility to find the required permission for a given path
const getRequiredPermission = (path: string): string | undefined => {
  const purePath = path.split('?')[0];

  const topMatch = allMenuItems.find(item => item.href === purePath);
  if (topMatch && !topMatch.isCollapsible) return topMatch.permission;

  for (const item of allMenuItems) {
    if (item.isCollapsible && item.subItems) {
      const subMatch = item.subItems.find(sub => sub.href.split('?')[0] === purePath);
      if (subMatch) return subMatch.permission;
    }
  }

  return undefined;
};

function ProtectedPage({ children }: { children: React.ReactNode }) {
  const { hasPermission, loading, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    if (loading) return;
    if (!user) return; 

    const requiredPermission = getRequiredPermission(pathname);
    const isPersonalPage = ['/payroll', '/leave', '/missions'].includes(pathname.split('?')[0]);
    const canAccessPersonal = isPersonalPage && !!user.employeeId;

    if (requiredPermission && !hasPermission(requiredPermission) && !canAccessPersonal) {
      router.replace('/intranet');
    }
  }, [pathname, hasPermission, loading, user, router]);

  const requiredPermission = getRequiredPermission(pathname);
  const isPersonalPage = ['/payroll', '/leave', '/missions'].includes(pathname.split('?')[0]);
  const canAccessPersonal = isPersonalPage && !!user?.employeeId;

  if (requiredPermission && !hasPermission(requiredPermission) && !canAccessPersonal) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
        <Lock className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold">Accès Refusé</h2>
        <p className="text-muted-foreground mt-2">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        <Button asChild className="mt-6">
          <Link href="/intranet">Retour à l'accueil</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}

function MobileBottomNav() {
  const { toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const { hasPermission } = useAuth();

  const navItems = [
    { href: "/intranet", label: "Accueil", icon: LayoutDashboard },
    { href: "/employees", label: "Personnel", icon: Users, permission: "group:personnel:view" },
    { href: "/missions", label: "Missions", icon: Briefcase, permission: "page:missions:view" },
    { href: "/organization-chart", label: "Organisation", icon: Building, permission: "page:organization-chart:view" },
  ];

  const visibleNavItems = navItems.filter(item => !item.permission || hasPermission(item.permission));

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t border-border md:hidden print:hidden">
      <div className={cn(
        "grid h-full mx-auto font-medium",
        visibleNavItems.length === 4 ? "grid-cols-5" :
          visibleNavItems.length === 3 ? "grid-cols-4" :
            visibleNavItems.length === 2 ? "grid-cols-3" : "grid-cols-2"
      )}>
        {visibleNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex flex-col items-center justify-center px-2 hover:bg-muted group",
              pathname === item.href ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className="w-5 h-5 mb-1" />
            <span className="text-[10px] text-center">{item.label}</span>
          </Link>
        ))}
        <button
          onClick={toggleSidebar}
          type="button"
          className="inline-flex flex-col items-center justify-center px-2 text-muted-foreground hover:bg-muted group"
        >
          <Menu className="w-5 h-5 mb-1" />
          <span className="text-[10px]">Plus</span>
        </button>
      </div>
    </div>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, hasPermission, settings } = useAuth();

  React.useEffect(() => {
    if (settings) {
      document.title = 'Intranet CNRCT';
      if (settings.faviconUrl) {
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = settings.faviconUrl;
      }
    }
  }, [settings]);

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  const currentPath = pathname;

  const menuItems = React.useMemo(() => {
    if (!hasPermission) return [];

    const items = allMenuItems.filter(item => {
      if (item.isCollapsible) {
        return item.subItems?.some(sub => !sub.permission || hasPermission(sub.permission));
      }
      return !item.permission || hasPermission(item.permission);
    });

    if (user?.employeeId) {
      const monEspaceItem = {
        isCollapsible: true,
        label: "Mon Espace",
        icon: UserSquareIcon,
        subItems: [
          { href: "/payroll", label: "Ma Paie", icon: Landmark },
          { href: "/leave", label: "Mes Congés", icon: CalendarOff },
          { href: "/missions", label: "Mes Missions", icon: Briefcase },
        ]
      };

      const personnelIndex = items.findIndex(item => item.label === "Personnel");
      if (personnelIndex !== -1) {
        items.splice(personnelIndex, 0, monEspaceItem as any);
      } else {
        items.unshift(monEspaceItem as any);
      }
    }

    return items;
  }, [hasPermission, user]);

  const isSubItemActive = (subItems: any[] | undefined) => {
    if (!subItems) return false;
    return subItems.some(item => pathname.startsWith(item.href.split('?')[0]));
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen w-full">
        <main className="flex-1 p-4 sm:p-6 sm:pt-0">
          <div className="mx-auto w-full max-w-7xl">
            <ProtectedPage>
              {children}
            </ProtectedPage>
          </div>
        </main>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar className="print:hidden">
        <SidebarHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 rounded-md">
              <AvatarImage src={settings?.mainLogoUrl} alt={settings?.organizationName} />
              <AvatarFallback><Building2 className="size-6" /></AvatarFallback>
            </Avatar>
            <span className="text-lg font-semibold tracking-tight">
              Gestion CNRCT
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {menuItems.map((item, index) => (
              item.isCollapsible ? (
                <Collapsible key={index} asChild defaultOpen={isSubItemActive(item.subItems)}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        isActive={isSubItemActive(item.subItems)}
                        className="w-full justify-start hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      >
                        <div className="flex items-center w-full">
                          <item.icon className="mr-2 h-4 w-4" />
                          {item.label}
                          <ChevronDown className="ml-auto h-4 w-4 transition-transform [&[data-state=open]]:rotate-180" />
                        </div>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent asChild>
                      <SidebarMenuSub>
                        {item.subItems?.filter(sub =>
                          !sub.permission ||
                          hasPermission(sub.permission) ||
                          (['/payroll', '/leave', '/missions'].includes(sub.href.split('?')[0]) && !!user?.employeeId)
                        ).map(subItem => (
                          <SidebarMenuSubItem key={subItem.href}>
                            <SidebarMenuSubButton asChild isActive={currentPath === subItem.href}>
                              <Link href={subItem.href!} className="relative flex items-center w-full">
                                {currentPath === subItem.href && <div className="sidebar-active-indicator opacity-100" />}
                                <subItem.icon className="mr-2 h-4 w-4" />
                                <span>{subItem.label}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={currentPath === item.href}
                    className="w-full justify-start hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    <Link href={item.href!} className="relative flex items-center w-full">
                      {currentPath === item.href && <div className="sidebar-active-indicator opacity-100" />}
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2 border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start items-center gap-3 p-2 h-auto hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                <Avatar className="size-8">
                  <AvatarImage src={user.photoUrl} alt={user.name} data-ai-hint="user avatar" />
                  <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-left overflow-hidden">
                  <span className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</span>
                  <span className="text-xs text-sidebar-foreground/70 truncate">{user.email}</span>
                </div>
                <MoreHorizontal className="ml-auto h-5 w-5 text-sidebar-foreground/70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mb-2" align="end" side="top">
              <DropdownMenuLabel>{user.role?.name || 'Utilisateur'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <UserSquareIcon className="mr-2 h-4 w-4" />
                  <span>Profil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Paramètres</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Déconnexion</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 print:hidden">
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 sm:pt-0 mb-16 md:mb-0">
          <div className="mx-auto w-full max-w-7xl">
            <ProtectedPage>
              {children}
            </ProtectedPage>
          </div>
        </main>
        <MobileBottomNav />
      </SidebarInset>
    </SidebarProvider>
  );
}

export function SiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isPublicPage = ['/login', '/signup', '/forgot-password', '/', '/mgp/track'].includes(pathname);

  return (
    <AuthProvider>
      {isPublicPage ? (
        children
      ) : (
        <AppLayout>
          {children}
        </AppLayout>
      )}
    </AuthProvider>
  );
}
