import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, Building, Activity, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminStatsProps {
  stats: {
    totalUsers: number;
    onlineUsers: number;
    totalRoles: number;
    totalDepartments: number;
  };
}

export function AdminStats({ stats }: AdminStatsProps) {
  const items = [
    { 
      label: "Utilisateurs", 
      value: stats.totalUsers, 
      icon: Users, 
      color: "text-blue-600", 
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      glow: "bg-blue-500" 
    },
    { 
      label: "En Ligne", 
      value: stats.onlineUsers, 
      icon: Activity, 
      color: "text-emerald-600", 
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      glow: "bg-emerald-500" 
    },
    { 
      label: "Rôles & Profils", 
      value: stats.totalRoles, 
      icon: Shield, 
      color: "text-violet-600", 
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
      glow: "bg-violet-500" 
    },
    { 
      label: "Unités Org.", 
      value: stats.totalDepartments, 
      icon: Building, 
      color: "text-amber-600", 
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      glow: "bg-amber-500" 
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card 
          key={item.label} 
          className={cn(
            "relative overflow-hidden border-white/20 shadow-3xl transition-all duration-700 group",
            "hover:border-white/40 hover:-translate-y-3 hover:shadow-cyan-500/5",
            "bg-white/40 backdrop-blur-xl rounded-[2.5rem]"
          )}
        >
          {/* Enhanced Subtle Glow */}
          <div className={cn(
            "absolute -right-8 -top-8 w-32 h-32 rounded-full blur-[80px] opacity-0 group-hover:opacity-30 transition-all duration-1000",
            item.glow
          )} />
          
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-8 relative z-10">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 group-hover:text-slate-900 transition-colors">
              {item.label}
            </CardTitle>
            <div className={cn(
                "p-4 rounded-[1.5rem] transition-all duration-700 group-hover:scale-110 group-hover:rotate-6 shadow-2xl", 
                item.bg, 
                item.border, 
                "border shadow-inner"
            )}>
              <item.icon className={cn("h-6 w-6", item.color)} />
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-0 relative z-10">
            <div className="flex items-end justify-between">
              <div className="text-5xl font-black tracking-tighter tabular-nums text-slate-900 group-hover:scale-105 transition-transform duration-700 origin-left">
                {item.value.toString().padStart(2, '0')}
              </div>
              <div className="flex items-center text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-900/5 px-3 py-1.5 rounded-xl border border-slate-900/5 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                Gouvernance <ArrowUpRight className="ml-1.5 h-3.5 w-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            
            {/* Progress indicator decoration */}
                 <div className={cn("h-full rounded-full transition-all duration-1000 delay-300 w-0 group-hover:w-full shadow-[0_0_15px_rgba(0,0,0,0.1)]", item.glow)} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
