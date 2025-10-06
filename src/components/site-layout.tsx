
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
} from "lucide-react";

import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { signOut } from "@/services/auth-service";

import {
  SidebarProvider,
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

const allMenuItems = [
  { href: "/", label: "Tableau de Bord", icon: LayoutDashboard, permission: "page:dashboard:view" },
  { href: "/my-space", label: "Mon Espace", icon: UserSquareIcon, permission: "page:my-space:view" },
  { 
    isCollapsible: true,
    label: "Personnel", 
    icon: Users,
    permission: "group:personnel:view",
    subItems: [
        { href: "/employees?filter=personnel", label: "Agents", icon: Users, permission: "page:employees:view" },
        { href: "/payroll", label: "Paie", icon: Landmark, permission: "page:payroll:view" },
        { href: "/leave", label: "Congés", icon: CalendarOff, permission: "page:leave:view" },
        { href: "/evaluations", label: "Évaluations", icon: ClipboardCheck, permission: "page:evaluations:view" },
        { href: "/indemnities", label: "Indemnités", icon: Scale, permission: "page:indemnities:view" },
    ]
  },
  { 
    isCollapsible: true,
    label: "Organisation", 
    icon: Building,
    permission: "group:organization:view",
    subItems: [
        { href: "/employees?filter=directoire", label: "Membres du Directoire", icon: Building, permission: "page:employees:view" },
        { href: "/employees?filter=regional", label: "Comités Régionaux", icon: Globe, permission: "page:employees:view" },
        { href: "/chiefs", label: "Rois & Chefs", icon: Crown, permission: "page:chiefs:view" },
        { href: "/organization-chart", label: "Organigramme", icon: Network, permission: "page:organization-chart:view" },
        { href: "/conflicts", label: "Gestion des Conflits", icon: Scale, permission: "page:conflicts:view" },
        { href: "/mapping", label: "Cartographie", icon: MapIcon, permission: "page:mapping:view" },
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
        { href: "/supplies", label: "Fournitures", icon: Package, permission: "page:repository:view" },
        { href: "/repository", label: "Référentiel", icon: Archive, permission: "page:repository:view" },
    ]
  },
   { 
    isCollapsible: true,
    label: "Rapports", 
    icon: FileText,
    permission: "group:reports:view", // New group permission
    subItems: [
        { href: "/reports/disa", label: "DISA", icon: FileText, permission: "page:reports:disa:view" },
        { href: "/reports/nominative", label: "Tableau Nominatif", icon: FileText, permission: "page:reports:nominative:view" },
        { href: "/leave/report", label: "Rapport Congés", icon: FileClock, permission: "page:leave:view" },
    ]
  },
   { 
    isCollapsible: true,
    label: "Administration", 
    icon: Shield,
    permission: "group:admin:view",
    subItems: [
        { href: "/employees?filter=garde-republicaine", label: "Garde Républicaine", icon: ShieldHalf, permission: "page:employees:view" },
        { href: "/employees?filter=gendarme", label: "Gendarmes", icon: ShieldHalf, permission: "page:employees:view" },
        { href: "/it-assets", label: "Actifs TI", icon: Laptop, permission: "page:it-assets:view" },
        { href: "/documents", label: "Documents", icon: FileText, permission: "page:documents:view" },
        { href: "/assistant", label: "Assistant IA", icon: MessageSquare, permission: "page:assistant:view" },
        { href: "/backup", label: "Sauvegarde & Restauration", icon: DatabaseBackup, permission: "page:backup:view" },
        { href: "/admin", label: "Paramètres Admin", icon: Shield, permission: "page:admin:view" },
    ]
  },
];

function ProtectedPage({ children }: { children: React.ReactNode }) {
    const { hasPermission, loading } = useAuth();
    const pathname = usePathname();

    const getRequiredPermission = () => {
        // Find a direct match first (e.g., /employees?filter=personnel)
        const allSubItems = allMenuItems.flatMap(item => item.isCollapsible ? item.subItems || [] : [item]);
        
        let directMatch = allSubItems.find(item => item.href === pathname);
        // Handle query params for employee page
        if(pathname === '/employees' && !directMatch){
            directMatch = allSubItems.find(item => item.href.startsWith('/employees?'));
        }

        if (directMatch) return directMatch.permission;
        
        // Find a base route for dynamic paths (e.g., /employees for /employees/123/edit)
        const baseRoute = allSubItems
             .filter(item => item.href !== '/')
             .find(item => pathname.startsWith(item.href.split('?')[0]));

        if (baseRoute) return baseRoute.permission;

        // Default to dashboard permission for the root page if no other match
        if (pathname === '/') return 'page:dashboard:view';
        
        // For settings or profile pages, allow access if logged in
        if (pathname.startsWith('/settings') || pathname.startsWith('/profile')) {
            return 'is-authenticated'; // Special key to just check for auth
        }

        return null; // No specific permission found for this route
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const requiredPermission = getRequiredPermission();

    if (requiredPermission === 'is-authenticated') {
        return <>{children}</>;
    }

    if (requiredPermission && hasPermission(requiredPermission)) {
        return <>{children}</>;
    }
    
    // If no permission is required (e.g., a page not in the menu system), show it.
    // Or if permission check fails, show access denied.
    if (requiredPermission === null) {
         return <>{children}</>;
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
                <div className="mx-auto bg-destructive/10 text-destructive p-3 rounded-full w-fit">
                    <Lock className="h-8 w-8" />
                </div>
                <CardTitle className="mt-4">Accès Refusé</CardTitle>
                <CardDescription>
                    Vous n'avez pas les permissions nécessaires pour accéder à cette page. Veuillez contacter votre administrateur si vous pensez qu'il s'agit d'une erreur.
                </CardDescription>
            </CardHeader>
             <CardContent>
                <Button asChild className="w-full">
                    <Link href="/">Retour au Tableau de Bord</Link>
                </Button>
            </CardContent>
        </Card>
    );
}


function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, hasPermission, settings } = useAuth();

  React.useEffect(() => {
    if (settings) {
       // Set dynamic title and favicon
        if (settings.organizationName) {
            document.title = settings.organizationName;
        }
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

    return allMenuItems.filter(item => {
        if (item.isCollapsible) {
            // Show group if user has permission to view at least one sub-item
            return item.subItems?.some(sub => hasPermission(sub.permission));
        }
        return hasPermission(item.permission);
    });
  }, [hasPermission]);
  
  const isSubItemActive = (subItems: any[] | undefined) => {
    if (!subItems) return false;
    // Check if the current path starts with the href of any sub-item
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
    return null; 
  }

  return (
    <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-3">
              <Avatar className="size-20 rounded-md">
                <AvatarImage src={settings?.mainLogoUrl} alt={settings?.organizationName} />
                <AvatarFallback><Building2 className="size-8" /></AvatarFallback>
              </Avatar>
              <span className="text-lg font-semibold">
                {settings?.organizationName}
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
                            <item.icon className="mr-2 h-4 w-4" />
                            {item.label}
                            <ChevronDown className="ml-auto h-4 w-4 transition-transform [&[data-state=open]]:rotate-180" />
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent asChild>
                            <SidebarMenuSub>
                            {item.subItems?.filter(sub => hasPermission(sub.permission)).map(subItem => (
                                <SidebarMenuSubItem key={subItem.href}>
                                <SidebarMenuSubButton asChild isActive={currentPath === subItem.href}>
                                    <Link href={subItem.href!}>
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
                    <Link href={item.href!}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )))}
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
            <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                {/* Header content can go here, like a search bar or breadcrumbs */}
                <div className="ml-auto flex items-center gap-2">
                    <NotificationBell />
                </div>
            </header>
            <main className="flex-1 p-4 sm:p-6 sm:pt-0">
                <div className="mx-auto w-full max-w-7xl">
                    <ProtectedPage>
                        {children}
                    </ProtectedPage>
                </div>
            </main>
        </SidebarInset>
    </SidebarProvider>
  );
}

export function SiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const isPublicPage = ['/login', '/signup', '/forgot-password'].includes(pathname);

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
