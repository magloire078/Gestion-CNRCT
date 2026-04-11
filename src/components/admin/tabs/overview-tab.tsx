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
    <div className="space-y-12 pb-12">
      {/* KPI Stats - Primary Visual Layer */}
      <AdminStats stats={stats} />

      {/* Security Actions - Full Width Gate */}
      <div className="px-1">
        <SyncRolesCard />
      </div>

      <div className="grid gap-10 lg:grid-cols-2 xl:grid-cols-3">
        {/* Thesis Support */}
        <div className="xl:col-span-1 h-full">
          <ThesisCard />
        </div>

        {/* Real-time activity */}
        <div className="xl:col-span-1 h-full">
          <ConnectedUsersCard users={users} />
        </div>

        {/* Import actions */}
        <div className="space-y-10 xl:col-span-1 h-full">
          <ImportDataCard />
          <ImportVillagesCard />
        </div>

        {/* Quick Settings - Institutional Configuration */}
        <Card className="border-white/20 shadow-3xl transition-all hover:border-blue-500/40 bg-white/40 backdrop-blur-xl rounded-[3rem] overflow-hidden group xl:col-span-3 relative">
          {/* Decorative Institutional Seal */}
          <div className="absolute -bottom-20 -left-20 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-1000 pointer-events-none">
              <Settings className="h-80 w-80 -rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
          </div>

          <CardHeader className="p-10 pb-6 relative z-10">
            <div className="flex items-center gap-5">
                <div className="p-4 rounded-[1.5rem] bg-blue-500/10 border border-blue-500/20 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                    <Settings className="h-7 w-7 text-blue-600 animate-[spin_10s_linear_infinite]" />
                </div>
                <div className="space-y-1">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 group-hover:text-slate-900 transition-colors">Configuration Instituée</CardTitle>
                    <CardDescription className="text-2xl font-black uppercase tracking-tighter text-slate-900">Paramètres de Gouvernance</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="px-10 pb-10 grid md:grid-cols-2 gap-6 relative z-10">
            <Link href="/settings/organization" className="flex items-center justify-between p-6 rounded-[2rem] bg-white/30 border border-white/40 hover:bg-white hover:border-blue-500/30 transition-all duration-500 group/link shadow-sm hover:shadow-2xl hover:-translate-y-1">
              <div className="flex items-center gap-5">
                <div className="p-3.5 rounded-2xl bg-blue-500/5 group-hover/link:bg-blue-500/10 transition-colors shadow-inner">
                  <Building className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-black text-xs uppercase tracking-[0.15em] text-slate-900">Organisation</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mt-1 opacity-70 group-hover/link:opacity-100 transition-opacity">Profil et emblèmes de l&apos;institution.</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300 group-hover/link:text-blue-500 group-hover/link:translate-x-1 transition-all" />
            </Link>
            
            <Link href="/settings" className="flex items-center justify-between p-6 rounded-[2rem] bg-white/30 border border-white/40 hover:bg-white hover:border-slate-900/30 transition-all duration-500 group/link shadow-sm hover:shadow-2xl hover:-translate-y-1">
              <div className="flex items-center gap-5">
                <div className="p-3.5 rounded-2xl bg-slate-900/5 group-hover/link:bg-slate-900/10 transition-colors shadow-inner">
                  <Settings className="h-6 w-6 text-slate-700" />
                </div>
                <div>
                  <p className="font-black text-xs uppercase tracking-[0.15em] text-slate-900">Paramètres Globaux</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mt-1 opacity-70 group-hover/link:opacity-100 transition-opacity">Préférences système et maintenance.</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300 group-hover/link:text-slate-900 group-hover/link:translate-x-1 transition-all" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});
