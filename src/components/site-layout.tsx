
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
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "./ui/dropdown-menu";

const menuItems = [
  { href: "/", label: "Tableau de Bord", icon: LayoutDashboard },
  { href: "/employees", label: "Employés", icon: Users },
  { href: "/payroll", label: "Paie", icon: Landmark },
  { href: "/leave", label: "Congés", icon: CalendarOff },
  { href: "/missions", label: "Missions", icon: Briefcase },
  { href: "/conflicts", label: "Conflits", icon: Scale },
  { href: "/it-assets", label: "Actifs TI", icon: Laptop },
  { href: "/fleet", label: "Flotte de Véhicules", icon: Car },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/assistant", label: "Assistant IA", icon: MessageSquare },
  { href: "/admin", label: "Administration", icon: Shield },
];

function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  if (loading) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }
  
  if (!user) {
    // This should ideally be handled by the AuthProvider, but as a fallback
    if (typeof window !== 'undefined') {
        router.push("/login");
    }
    return null; 
  }

  return (
    <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <Building2 className="size-8 text-primary" />
              <span className="text-lg font-semibold">
                Gestion CNRCT
              </span>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-2">
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    className="w-full justify-start"
                  >
                    <Link href={item.href}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-2 border-t border-sidebar-border">
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start items-center gap-3 p-2 h-auto">
                        <Avatar className="size-8">
                            <AvatarImage src="https://placehold.co/40x40.png" alt={user.name} data-ai-hint="user avatar" />
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
                    <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
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
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </SidebarInset>
    </SidebarProvider>
  );
}

export function SiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Public pages that don't need the AuthProvider or Sidebar
  if (pathname === '/login' || pathname === '/signup') {
    return <>{children}</>;
  }

  // Protected pages
  return (
    <AuthProvider>
        <AppLayout>
            {children}
        </AppLayout>
    </AuthProvider>
  )
}
