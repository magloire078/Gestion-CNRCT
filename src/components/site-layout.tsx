
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
  User,
  Settings,
  MoreHorizontal,
  Loader2,
  Lock,
  Package,
  Crown,
  Map as MapIcon,
  ClipboardCheck,
  Building,
  Globe,
  ChevronDown,
  UserSquare,
  ShieldHalf,
} from "lucide-react";

import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { signOut } from "@/services/auth-service";
import type { OrganizationSettings } from "@/lib/data";

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

const allMenuItems = [
  { href: "/", label: "Tableau de Bord", icon: LayoutDashboard, permission: "page:dashboard:view" },
  { 
    isCollapsible: true,
    label: "Employés", 
    icon: Users,
    permission: "page:employees:view",
    subItems: [
        { href: "/employees?filter=directoire", label: "Membres du directoire", icon: Building, permission: "page:board-members:view" },
        { href: "/employees?filter=regional", label: "Comités régionaux", icon: Globe, permission: "page:regional-committees:view" },
        { href: "/employees?filter=personnel", label: "Agent/Personnel", icon: UserSquare, permission: "page:staff:view" },
        { href: "/employees?filter=militaire", label: "Militaires", icon: ShieldHalf, permission: "page:military:view" },
        { href: "/employees?filter=gendarme", label: "Gendarmes", icon: Shield, permission: "page:gendarmerie:view" },
    ]
  },
  { href: "/chiefs", label: "Rois & Chefs", icon: Crown, permission: "page:chiefs:view" },
  { href: "/mapping", label: "Cartographie", icon: MapIcon, permission: "page:mapping:view" },
  { href: "/payroll", label: "Paie", icon: Landmark, permission: "page:payroll:view" },
  { href: "/leave", label: "Congés", icon: CalendarOff, permission: "page:leave:view" },
  { href: "/evaluations", label: "Évaluations", icon: ClipboardCheck, permission: "page:evaluations:view" },
  { href: "/missions", label: "Missions", icon: Briefcase, permission: "page:missions:view" },
  { href: "/conflicts", label: "Conflits", icon: Scale, permission: "page:conflicts:view" },
  { href: "/supplies", label: "Fournitures", icon: Package, permission: "page:supplies:view" },
  { href: "/it-assets", label: "Actifs TI", icon: Laptop, permission: "page:it-assets:view" },
  { href: "/fleet", label: "Flotte de Véhicules", icon: Car, permission: "page:fleet:view" },
  { href: "/documents", label: "Documents", icon: FileText, permission: "page:documents:view" },
  { href: "/assistant", label: "Assistant IA", icon: MessageSquare, permission: "page:assistant:view" },
  { href: "/admin", label: "Administration", icon: Shield, permission: "page:admin:view" },
];

function ProtectedPage({ children, permission }: { children: React.ReactNode, permission: string }) {
    const { hasPermission, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    if (hasPermission(permission)) {
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
  
  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  const menuItems = React.useMemo(() => {
    if (!hasPermission) return [];
    return allMenuItems.filter(item => {
        if (item.isCollapsible) {
            // Include parent if any child is visible
            return item.subItems.some(subItem => hasPermission(subItem.permission));
        }
        return hasPermission(item.permission);
    });
  }, [hasPermission]);
  
  const currentPage = allMenuItems.find(item => !item.isCollapsible && item.href === pathname);
  const isSubItemActive = (subItems: any[]) => subItems.some(item => pathname === item.href);

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
            <div className="flex items-center gap-2">
              <Avatar className="size-8 rounded-md">
                <AvatarImage src={settings?.mainLogoUrl} alt={settings?.organizationName} />
                <AvatarFallback><Building2 className="size-5" /></AvatarFallback>
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
                  <Collapsible key={index} asChild>
                    <>
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
                      </SidebarMenuItem>
                      <CollapsibleContent asChild>
                        <SidebarMenuSub>
                          {item.subItems.filter(sub => hasPermission(sub.permission)).map(subItem => (
                            <SidebarMenuSubItem key={subItem.href}>
                              <SidebarMenuSubButton asChild isActive={pathname === subItem.href}>
                                <Link href={subItem.href}>
                                    <subItem.icon className="mr-2 h-4 w-4" />
                                    <span>{subItem.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                ) : (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
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
                            <User className="mr-2 h-4 w-4" />
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
          <main className="flex-1 p-4 sm:p-6">
            <div className="mx-auto w-full max-w-7xl">
                {currentPage ? (
                    <ProtectedPage permission={currentPage.permission}>
                        {children}
                    </ProtectedPage>
                ) : (
                    // Handle sub-pages and other pages not in the main menu
                    children
                )}
            </div>
          </main>
        </SidebarInset>
    </SidebarProvider>
  );
}

export function SiteLayout({ children, settings }: { children: React.ReactNode, settings: OrganizationSettings }) {
  const pathname = usePathname();
  
  const isPublicPage = ['/login', '/signup', '/forgot-password'].includes(pathname);

  if (isPublicPage) {
    return <>{children}</>;
  }

  return (
    <AuthProvider settings={settings}>
        <AppLayout>
            {children}
        </AppLayout>
    </AuthProvider>
  )
}
