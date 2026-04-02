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
      gradient: "from-blue-500/5 to-transparent" 
    },
    { 
      label: "En Ligne", 
      value: stats.onlineUsers, 
      icon: Activity, 
      color: "text-emerald-600", 
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      gradient: "from-emerald-500/5 to-transparent" 
    },
    { 
      label: "Rôles & Profils", 
      value: stats.totalRoles, 
      icon: Shield, 
      color: "text-violet-600", 
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
      gradient: "from-violet-500/5 to-transparent" 
    },
    { 
      label: "Unités Org.", 
      value: stats.totalDepartments, 
      icon: Building, 
      color: "text-amber-600", 
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      gradient: "from-amber-500/5 to-transparent" 
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card 
          key={item.label} 
          className={cn(
            "relative overflow-hidden border-border/40 shadow-sm transition-all duration-300",
            "hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5 group",
            "bg-card/50 backdrop-blur-sm"
          )}
        >
          {/* Background Gradient */}
          <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", item.gradient)} />
          
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
              {item.label}
            </CardTitle>
            <div className={cn("p-2 rounded-xl transition-all duration-300 group-hover:rotate-6", item.bg, item.border, "border shadow-sm")}>
              <item.icon className={cn("h-4 w-4", item.color)} />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-black tracking-tighter tabular-nums">
                {item.value}
              </div>
              <div className="flex items-center text-[10px] font-medium text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded-full">
                Total <ArrowUpRight className="ml-0.5 h-3 w-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
