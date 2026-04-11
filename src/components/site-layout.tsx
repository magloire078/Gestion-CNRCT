
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
  Zap,
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

import { ALL_MENU_ITEMS, MenuItem, SubMenuItem } from "@/constants/navigation";

// Utility to find the required permission for a given path
const getRequiredPermission = (path: string): string | undefined => {
  const purePath = path.split('?')[0];

  for (const item of ALL_MENU_ITEMS) {
    if (item.href === purePath && item.permission) return item.permission;
    if (item.isCollapsible && item.subItems) {
      for (const sub of item.subItems) {
        if (sub.href.split('?')[0] === purePath && sub.permission) return sub.permission;
      }
    }
  }

  // Fallback for paths not explicitly in menu
  if (purePath.startsWith('/admin')) return "page:admin:view";
  if (purePath.startsWith('/payroll')) return "page:payroll:view";
  if (purePath.startsWith('/leave')) return "page:leaves:view";
  if (purePath.startsWith('/missions')) return "page:missions:view";
  if (purePath.startsWith('/it-assets')) return "page:it-assets:view";
  if (purePath.startsWith('/documents')) return "page:repository:view";
  if (purePath.startsWith('/backup')) return "page:backup:view";
  if (purePath.startsWith('/budget')) return "page:budget:view";
  if (purePath.startsWith('/reports')) return "page:dashboard:view";
  if (purePath.startsWith('/chiefs')) return "page:chiefs:view";
  if (purePath.startsWith('/villages')) return "page:villages:view";
  if (purePath.startsWith('/heritage')) return "page:heritage:view";

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

  const visibleNavItems = React.useMemo(() => {
    const navItems = [
      { href: "/intranet", label: "Accueil", icon: LayoutDashboard, permission: "page:dashboard:view" },
      { href: "/employees", label: "Personnel", icon: Users, permission: "page:employees:view" },
      { href: "/missions", label: "Missions", icon: Briefcase, permission: "page:missions:view" },
      { href: "/organization-chart", label: "Organisation", icon: Building, permission: "page:organization-chart:view" },
    ];
    return navItems.filter(item => !item.permission || hasPermission(item.permission));
  }, [hasPermission]);

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

// Memoized MenuItem component to prevent re-rendering the whole sidebar when one item changes
const SidebarMenuItemComponent = React.memo(({ 
  item, 
  pathname, 
  hasPermission, 
  user 
}: { 
  item: MenuItem; 
  pathname: string; 
  hasPermission: (p: string) => boolean; 
  user: any;
}) => {
  const isSubItemActive = React.useMemo(() => {
    if (!item.subItems) return false;
    return item.subItems.some(sub => pathname.startsWith(sub.href.split('?')[0]));
  }, [item.subItems, pathname]);

  const isActive = !item.isCollapsible && pathname === item.href;

  if (item.isCollapsible) {
    return (
      <Collapsible asChild defaultOpen={isSubItemActive}>
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              isActive={isSubItemActive}
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
              {item.subItems?.filter((sub: SubMenuItem) =>
                !sub.permission ||
                hasPermission(sub.permission) ||
                (['/payroll', '/leave', '/missions'].includes(sub.href.split('?')[0]) && !!user?.employeeId)
              ).map((subItem: SubMenuItem) => (
                <SidebarMenuSubItem key={subItem.href}>
                  <SidebarMenuSubButton asChild isActive={pathname === subItem.href}>
                    <Link href={subItem.href!} className="relative flex items-center w-full">
                      {pathname === subItem.href && <div className="sidebar-active-indicator opacity-100" />}
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
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className="w-full justify-start hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <Link href={item.href!} className="relative flex items-center w-full">
          {isActive && <div className="sidebar-active-indicator opacity-100" />}
          <item.icon className="mr-2 h-4 w-4" />
          {item.label}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
});

SidebarMenuItemComponent.displayName = "SidebarMenuItemComponent";

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

  const handleLogout = React.useCallback(async () => {
    await signOut();
    router.push("/login");
  }, [router]);

  const menuItems = React.useMemo(() => {
    if (!hasPermission || !user) return [];

    const items = ALL_MENU_ITEMS.filter((item: MenuItem) => {
      if (item.isCollapsible) {
        return item.subItems?.some((sub: SubMenuItem) => !sub.permission || hasPermission(sub.permission));
      }
      return !item.permission || hasPermission(item.permission);
    });

    if (user.employeeId) {
      const monEspaceItem = {
        isCollapsible: true,
        label: "Mon Espace",
        icon: UserSquareIcon,
        subItems: [
          { href: "/payroll", label: "Ma Paie", icon: Landmark, permission: "" },
          { href: "/leave", label: "Mes Congés", icon: CalendarOff, permission: "" },
          { href: "/missions", label: "Mes Missions", icon: Briefcase, permission: "" },
        ]
      };

      const personnelIndex = items.findIndex((item: MenuItem) => item.label === "Personnel");
      if (personnelIndex !== -1) {
        items.splice(personnelIndex, 0, monEspaceItem as any);
      } else {
        items.unshift(monEspaceItem as any);
      }
    }

    return items;
  }, [hasPermission, user]);

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
          <div className="flex items-center gap-3 px-2">
            <Avatar className="h-10 w-10 rounded-md">
              <AvatarImage src={settings?.mainLogoUrl} alt={settings?.organizationName} />
              <AvatarFallback><Building2 className="size-6" /></AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold tracking-tight truncate">Gestion CNRCT</span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Plateforme Interne</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-2 pt-4">
          <SidebarMenu>
            {menuItems.map((item: MenuItem, index: number) => (
              <SidebarMenuItemComponent 
                key={`${item.label}-${index}`}
                item={item}
                pathname={pathname}
                hasPermission={hasPermission}
                user={user}
              />
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
