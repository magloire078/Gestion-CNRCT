"use client";

import { useState, useEffect } from "react";
import { 
    LayoutDashboard, Package, Laptop, 
    Truck, PlusCircle, AlertTriangle,
    History, CheckCircle2, MoreVertical,
    Search, Filter, ArrowUpRight,
    LucideIcon, Settings2, Bell,
    ArrowRight,
    Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/components/auth/permission-guard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getSupplySummary, getSupplyRecentActivity } from "@/services/supply-service";
import { getAssetStatusCounts } from "@/services/asset-service";

type ActionButton = {
    label: string;
    description: string;
    icon: LucideIcon;
    href: string;
    color: string;
};

export default function ManagementHub() {
    return (
        <PermissionGuard permission="page:supplies:view">
            <ManagementHubContent />
        </PermissionGuard>
    );
}

function ManagementHubContent() {
    const [stats, setStats] = useState({
        lowStock: 0,
        itRepair: 0,
        fleetIssues: 2, // Placeholder for fleet service integration
        recentActivity: [] as any[]
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Use allSettled to prevent failures in one service from blocking the whole dashboard
                const results = await Promise.allSettled([
                    getSupplySummary(),
                    getAssetStatusCounts(),
                    getSupplyRecentActivity(6)
                ]);

                const supplyStats = results[0].status === 'fulfilled' ? results[0].value : { lowStock: 0 };
                const assetStats = results[1].status === 'fulfilled' ? results[1].value : {};
                const activity = results[2].status === 'fulfilled' ? results[2].value : [];

                setStats({
                    lowStock: (supplyStats as any).lowStock || 0,
                    itRepair: (assetStats as any)['En réparation'] || 0,
                    fleetIssues: 2,
                    recentActivity: activity as any[]
                });
            } catch (err) {
                console.error("Management Hub data load error:", err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const quickActions: ActionButton[] = [
        {
            label: "Distribuer Fournitures",
            description: "Enregistrer une nouvelle sortie de stock pour un agent.",
            icon: Package,
            href: "/supplies/transactions",
            color: "bg-amber-500"
        },
        {
            label: "Maintenance IT",
            description: "Signaler un équipement défectueux ou en réparation.",
            icon: Laptop,
            href: "/assets",
            color: "bg-slate-900"
        },
        {
            label: "Gestion de Flotte",
            description: "Affecter un véhicule ou déclarer un entretien.",
            icon: Truck,
            href: "/fleet",
            color: "bg-indigo-600"
        },
        {
            label: "Nouvel Employé",
            description: "Ajouter un collaborateur ou un stagiaire au registre.",
            icon: PlusCircle,
            href: "/employees/add",
            color: "bg-emerald-600"
        }
    ];

    return (
        <div className="flex flex-col gap-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header with Search and Profile */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 py-2">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900">
                        Gestion <span className="text-indigo-600">Opérationnelle</span>
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                        <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />
                        Tableau de bord de contrôle quotidien
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group flex-1 min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <Input 
                            placeholder="Rechercher partout (Action, Membre, Actif)..." 
                            className="pl-12 h-14 rounded-xl border-none shadow-xl shadow-slate-200/50 bg-white ring-0 focus-visible:ring-2 focus-visible:ring-indigo-600/20 font-medium"
                        />
                    </div>
                    <Button variant="outline" className="h-14 w-14 rounded-xl border-none shadow-xl shadow-slate-200 flex items-center justify-center bg-white group">
                        <Bell className="h-6 w-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    </Button>
                </div>
            </div>

            {/* Dashboard Alerts Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Ruptures de Stock", count: stats.lowStock, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", description: "Articles sous le seuil critique" },
                    { label: "Maintenance IT", count: stats.itRepair, icon: Laptop, color: "text-slate-900", bg: "bg-slate-100", description: "Équipements en cours de réparation" },
                    { label: "Alertes Flotte", count: stats.fleetIssues, icon: Truck, color: "text-rose-600", bg: "bg-rose-50", description: "Assurances ou visites techniques" }
                ].map((alert, i) => (
                    <Card key={i} className="border-none shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden group">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-5">
                                <div className={cn("h-16 w-16 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-110", alert.bg)}>
                                    <alert.icon className={cn("h-8 w-8", alert.color)} />
                                </div>
                                <div>
                                    <h4 className="text-4xl font-black text-slate-950 tracking-tighter">{alert.count}</h4>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{alert.label}</p>
                                </div>
                            </div>
                            <p className="mt-6 text-sm font-medium text-slate-500 leading-relaxed border-t border-slate-50 pt-6">
                                {alert.description}
                                <Link href="#" className="ml-2 text-indigo-600 font-bold hover:underline inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                    Voir <ArrowRight className="h-3 w-3" />
                                </Link>
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Area: Quick Actions & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Left: Quick Actions Grid */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                            <PlusCircle className="h-6 w-6 text-indigo-600" />
                            Actions Prioritaires
                        </h2>
                        <Button variant="ghost" className="font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">
                            Personnaliser
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {quickActions.map((action, i) => (
                            <Link href={action.href} key={i}>
                                <div className="h-full bg-white p-6 rounded-xl shadow-lg shadow-slate-200/40 group hover:shadow-2xl hover:bg-slate-900 transition-all duration-500 cursor-pointer border border-slate-50">
                                    <div className={cn("h-14 w-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-lg", action.color)}>
                                        <action.icon className="h-7 w-7 text-white" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-950 group-hover:text-white transition-colors">{action.label}</h3>
                                    <p className="text-slate-500 group-hover:text-slate-400 font-medium text-sm mt-2 leading-relaxed">
                                        {action.description}
                                    </p>
                                    <div className="mt-8 flex items-center gap-2 text-indigo-600 group-hover:text-indigo-400 font-black text-[10px] uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-all">
                                        Lancer l'assistant <ArrowUpRight className="h-3 w-3" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Operational Map or Chart Placeholder */}
                    <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-2xl p-8 bg-slate-950 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 h-64 w-64 bg-indigo-600/20 rounded-full blur-[80px] -mr-32 -mt-32" />
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-black">Statistiques du Jour</h3>
                                <Settings2 className="h-6 w-6 text-slate-600" />
                            </div>
                            <div className="h-48 flex items-end gap-3 px-4">
                                {[65, 85, 45, 95, 75, 40, 80].map((h, i) => (
                                    <div key={i} className="flex-1 space-y-2 group flex flex-col items-center h-full">
                                        <div className="w-full flex-1 relative flex items-end">
                                            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                                                <rect 
                                                    x="0" 
                                                    y={`${100 - h}%`} 
                                                    width="100%" 
                                                    height={`${h}%`} 
                                                    rx="12" 
                                                    className="fill-indigo-500/20 group-hover:fill-indigo-500 transition-all duration-700" 
                                                />
                                            </svg>
                                            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 bg-white text-indigo-600 text-[10px] font-black px-2 py-1 rounded-lg shadow-xl border border-indigo-100 whitespace-nowrap">
                                                    {h}% Capacité
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-600 uppercase">{['L', 'M', 'M', 'J', 'V', 'S', 'D'][i]}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center gap-6 pt-6 border-t border-slate-900">
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Temps Moyen Service</p>
                                    <p className="text-2xl font-black text-indigo-400">14.2 min</p>
                                </div>
                                <div className="h-10 w-px bg-slate-900" />
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Satisfaction Agent</p>
                                    <p className="text-2xl font-black text-emerald-400">4.8/5</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right: Activity Feed */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                            <History className="h-6 w-6 text-slate-400" />
                            Activité Récente
                        </h2>
                    </div>

                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden bg-white">
                        <CardContent className="p-6 space-y-8">
                            {stats.recentActivity.length > 0 ? stats.recentActivity.map((log, i) => (
                                <div key={i} className="flex gap-5 relative group">
                                    {i !== stats.recentActivity.length - 1 && (
                                        <div className="absolute left-[23px] top-[50px] bottom-[-32px] w-px bg-slate-100" />
                                    )}
                                    <div className={cn(
                                        "h-12 w-12 shrink-0 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500",
                                        log.type === 'distribution' ? "bg-amber-50" : "bg-emerald-50"
                                    )}>
                                        <Package className={cn("h-6 w-6", log.type === 'distribution' ? "text-amber-500" : "text-emerald-500")} />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-black text-slate-950">
                                                {log.type === 'distribution' ? "Distribution" : "Réapprovisionnement"}
                                            </p>
                                            <span className="text-[10px] font-bold text-slate-400">{log.date || "À l'instant"}</span>
                                        </div>
                                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                            <span className="text-slate-900 font-bold">{log.supplyName}</span> 
                                            {log.type === 'distribution' ? ` distribué à ` : ` ajouté en stock par `}
                                            <span className="text-slate-900 font-bold">{log.receiverName || log.providerName || "Dépôt Central"}</span>
                                        </p>
                                        <div className="flex items-center gap-2 mt-3">
                                            <Badge variant="outline" className="text-[10px] font-black tracking-tighter rounded-md h-5 bg-slate-50 border-none text-slate-500">
                                                Qté: {log.quantity}
                                            </Badge>
                                            <Badge variant="outline" className="text-[10px] font-black tracking-tighter rounded-md h-5 bg-emerald-50 border-none text-emerald-600">
                                                <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> Validé
                                            </Badge>
                                        </div>
                                    </div>
                                    <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <MoreVertical className="h-4 w-4 text-slate-400" />
                                    </Button>
                                </div>
                            )) : (
                                <div className="text-center py-20">
                                    <Package className="h-12 w-12 text-slate-100 mx-auto mb-4" />
                                    <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Aucune activité récente</p>
                                </div>
                            )}
                            
                            <Button className="w-full h-14 rounded-xl bg-slate-50 hover:bg-slate-100 border-none text-slate-600 font-black text-sm uppercase tracking-widest mt-4">
                                Voir tout l'historique
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
