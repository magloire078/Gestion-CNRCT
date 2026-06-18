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
    <div className="space-y-6 pb-12">
      {/* KPI Stats - Primary Visual Layer */}
      <AdminStats stats={stats} />

      {/* Security Actions - Full Width Gate */}
      <div className="px-1">
        <SyncRolesCard />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {/* Thesis Support */}
        <div className="xl:col-span-1 h-full">
          <ThesisCard />
        </div>

        {/* Real-time activity */}
        <div className="xl:col-span-1 h-full">
          <ConnectedUsersCard users={users} />
        </div>

        {/* Import actions */}
        <div className="space-y-4 xl:col-span-1 h-full">
          <ImportDataCard />
          <ImportVillagesCard />
        </div>

        {/* Quick Settings - Institutional Configuration */}
        <Card className="border-white/20 shadow-md transition-all hover:border-blue-500/40 bg-white/40 backdrop-blur-xl rounded-lg overflow-hidden group xl:col-span-3 relative">
          {/* Decorative Institutional Seal */}
          <div className="absolute -bottom-20 -left-20 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-1000 pointer-events-none">
              <Settings className="h-48 w-48 -rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
          </div>

          <CardHeader className="p-4 relative z-10">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 shadow-md group-hover:scale-105 group-hover:rotate-3 transition-all duration-700">
                    <Settings className="h-5 w-5 text-blue-600 animate-[spin_10s_linear_infinite]" />
                </div>
                <div className="space-y-1">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 group-hover:text-slate-900 transition-colors">Configuration Instituée</CardTitle>
                    <CardDescription className="text-2xl font-black uppercase tracking-tighter text-slate-900">Paramètres de Gouvernance</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 grid md:grid-cols-2 gap-4 relative z-10">
            <Link href="/settings/organization" className="flex items-center justify-between p-4 rounded-md bg-white/30 border border-white/40 hover:bg-white hover:border-blue-500/30 transition-all duration-500 group/link shadow-sm hover:shadow-md hover:-translate-y-0.5">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-lg bg-blue-500/5 group-hover/link:bg-blue-500/10 transition-colors shadow-inner">
                  <Building className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-xs uppercase tracking-wider text-slate-900">Organisation</p>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-tight mt-0.5 opacity-70 group-hover/link:opacity-100 transition-opacity">Profil et emblèmes de l&apos;institution.</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 group-hover/link:text-blue-500 group-hover/link:translate-x-1 transition-all" />
            </Link>
            
            <Link href="/settings" className="flex items-center justify-between p-4 rounded-md bg-white/30 border border-white/40 hover:bg-white hover:border-slate-900/30 transition-all duration-500 group/link shadow-sm hover:shadow-md hover:-translate-y-0.5">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-lg bg-slate-900/5 group-hover/link:bg-slate-900/10 transition-colors shadow-inner">
                  <Settings className="h-5 w-5 text-slate-700" />
                </div>
                <div>
                  <p className="font-bold text-xs uppercase tracking-wider text-slate-900">Paramètres Globaux</p>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-tight mt-0.5 opacity-70 group-hover/link:opacity-100 transition-opacity">Préférences système et maintenance.</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 group-hover/link:text-slate-900 group-hover/link:translate-x-1 transition-all" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});
