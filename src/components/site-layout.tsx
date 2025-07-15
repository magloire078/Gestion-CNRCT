"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Car,
  FileText,
  Laptop,
  LayoutDashboard,
  Users,
  CalendarOff,
  LogOut,
  Building2,
} from "lucide-react";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const menuItems = [
  { href: "/", label: "Tableau de Bord", icon: LayoutDashboard },
  { href: "/employees", label: "Employés", icon: Users },
  { href: "/leave", label: "Congés", icon: CalendarOff },
  { href: "/it-assets", label: "Actifs TI", icon: Laptop },
  { href: "/fleet", label: "Flotte de Véhicules", icon: Car },
  { href: "/documents", label: "Documents", icon: FileText },
];

export function SiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" side="left" variant="sidebar">
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Button variant="ghost" size="icon" className="h-10 w-10 text-primary">
              <Building2 className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-semibold tracking-tight">SynergieRH</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={{ children: item.label }}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <div className="flex items-center gap-3 p-2">
              <Avatar>
                <AvatarImage src="https://placehold.co/40x40.png" alt="Admin" data-ai-hint="user avatar" />
                <AvatarFallback>A</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Admin</span>
                <span className="text-xs text-muted-foreground">admin@synergierh.com</span>
              </div>
              <Button variant="ghost" size="icon" className="ml-auto">
                <LogOut />
              </Button>
            </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1">
             {/* Can add breadcrumbs or page title here later */}
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
