
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
  Moon,
  Sun,
  Briefcase,
  Scale,
  User,
  Settings,
  MoreHorizontal,
} from "lucide-react";
import { useTheme } from "next-themes";

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
  SidebarTrigger,
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
  { href: "/profile", label: "Profil", icon: User },
];

function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Clair
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Sombre
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          Système
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = () => {
    router.push("/login");
  };
  
  if (!isClient) {
    return null; 
  }

  if (pathname === '/login' || pathname === '/signup') {
    return <>{children}</>;
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
                            <AvatarImage src="https://placehold.co/40x40.png" alt="Admin" data-ai-hint="user avatar" />
                            <AvatarFallback>A</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start text-left">
                           <span className="text-sm font-medium text-sidebar-foreground">Admin User</span>
                           <span className="text-xs text-sidebar-foreground/70">admin@cnrct.com</span>
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
