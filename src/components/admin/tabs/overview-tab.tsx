import React, { memo } from "react";
import Link from "next/link";
import { Building, Settings, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImportDataCard } from "../import-data-card";
import { ImportVillagesCard } from "../import-villages-card";
import { AdminStats } from "../admin-stats";
import { ConnectedUsersCard } from "../connected-users-card";
import { SyncRolesCard } from "../sync-roles-card";
import { ThesisCard } from "../thesis-card";
import type { User, Role, Department } from "@/lib/data";

interface OverviewTabProps {
  users: User[];
  roles: Role[];
  departments: Department[];
  loading: boolean;
}

export const OverviewTab = memo(function OverviewTab({ users, roles, departments, loading }: OverviewTabProps) {
  const stats = {
    totalUsers: users?.length || 0,
    onlineUsers: users?.filter(u => {
      if (!u.lastActive) return false;
      return (Date.now() - u.lastActive.toDate().getTime()) < 5 * 60 * 1000;
    }).length || 0,
    totalRoles: roles?.length || 0,
    totalDepartments: departments?.length || 0,
  };

  return (
    <div className="space-y-6">
      {/* KPI Stats */}
      <AdminStats stats={stats} />

      {/* Security Actions - Full Width at top */}
      <SyncRolesCard />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {/* Thesis Support - New prominent position */}
        <div className="xl:col-span-1">
          <ThesisCard />
        </div>

        {/* Real-time activity */}
        <div className="xl:col-span-1">
          <ConnectedUsersCard users={users} />
        </div>

        {/* Import actions */}
        <div className="space-y-6 xl:col-span-1">
          <ImportDataCard />
          <ImportVillagesCard />
        </div>

        {/* Quick Settings */}
        <Card className="border-border/50 shadow-sm transition-all hover:shadow-md bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Configuration Système</CardTitle>
            <CardDescription>Paramètres globaux et apparence.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 px-4 pb-4">
            <Link href="/settings/organization" className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-all group border border-transparent hover:border-border/50">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <Building className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-sm">Organisation</p>
                  <p className="text-xs text-muted-foreground">Profil et identité visuelle.</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link href="/settings" className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-all group border border-transparent hover:border-border/50">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-lg bg-slate-500/10 group-hover:bg-slate-500/20 transition-colors">
                  <Settings className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="font-bold text-sm">Paramètres globaux</p>
                  <p className="text-xs text-muted-foreground">Préférences et maintenance.</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});
