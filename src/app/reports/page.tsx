"use client";

import { useState, useEffect } from "react";
import { 
    Users, MapPin, Package, Laptop, 
    FileText, Download, ArrowRight,
    PieChart, BarChart3, TrendingUp,
    ShieldCheck, Database, Calendar,
    ChevronRight, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getEmployees } from "@/services/employee-service";
import { getChiefs } from "@/services/chief-service";
import { getAssets, getAssetStatusCounts } from "@/services/asset-service";
import { getSupplySummary } from "@/services/supply-service";
import { getVillages } from "@/services/village-service";
import { Compass } from "lucide-react";

import { PermissionGuard } from "@/components/auth/permission-guard";


export default function ReportingDashboard() {
    const [stats, setStats] = useState({
        employees: 0,
        activeEmployees: 0,
        chiefs: 0,
        villages: 0,
        assets: 0,
        itRepair: 0,
        lowStock: 0,
        electrificationRate: 0,
        potableWaterRate: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [emps, chiefs, assets, assetStats, supplyStats, villages] = await Promise.all([
                    getEmployees(),
                    getChiefs(),
                    getAssets(),
                    getAssetStatusCounts(),
                    getSupplySummary(),
                    getVillages()
                ]);

                const electrified = villages.filter(v => v.hasElectricity).length;
                const water = villages.filter(v => v.hasWater).length;

                setStats({
                    employees: emps.length,
                    activeEmployees: emps.filter(e => e.status === 'Actif').length,
                    chiefs: chiefs.length,
                    villages: villages.length,
                    assets: assets.length,
                    itRepair: assetStats['En réparation'] || 0,
                    lowStock: supplyStats.lowStock,
                    electrificationRate: villages.length > 0 ? (electrified / villages.length) * 100 : 0,
                    potableWaterRate: villages.length > 0 ? (water / villages.length) * 100 : 0
                });

            } catch (err) {
                console.error("Error fetching dashboard stats:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const reportCards = [
        {
            title: "Rapport du Personnel",
            description: "Analyses démographiques, mouvements et effectifs par département.",
            icon: Users,
            color: "bg-blue-500",
            href: "/reports/employees",
            metrics: [`${stats.employees} Collaborateurs`, `${stats.activeEmployees} Actifs`]
        },
        {
            title: "Déclaration DISA",
            description: "Extraction automatique des données pour les déclarations sociales CNPS.",
            icon: ShieldCheck,
            color: "bg-emerald-500",
            href: "/reports/disa",
            metrics: ["Prêt pour export", "Format conforme"]
        },
        {
            title: "Patrimoine Technique",
            description: "État complet du parc informatique (Ordinateurs, Moniteurs, Réseau).",
            icon: Laptop,
            color: "bg-slate-800",
            href: "/reports/assets",
            metrics: [`${stats.assets} Actifs TI`, `${stats.itRepair} En Réparation`]
        },
        {
            title: "Logistique & Fournitures",
            description: "Consommation des articles de bureau et alertes de rupture de stock.",
            icon: Package,
            color: "bg-amber-500",
            href: "/reports/supplies",
            metrics: [`${stats.lowStock} Alertes Stock`, "Suivi Consommation"]
        },
        {
            title: "Rois et Chefs",
            description: "Localisation géographique et registre des autorités coutumières.",
            icon: MapPin,
            color: "bg-rose-500",
            href: "/reports/chiefs",
            metrics: [`${stats.chiefs} Chefs Répertoriés`, `${stats.villages} Villages`]
        },
        {
            title: "États Nominatifs",
            description: "Listes détaillées pour les audits financiers et structurels.",
            icon: FileText,
            color: "bg-indigo-500",
            href: "/reports/nominative",
            metrics: ["Par Grade", "Par Échelon"]
        },
        {
            title: "Observatoire Territorial",
            description: "Diagnostic des infrastructures et KPIs de développement villageois.",
            icon: Compass,
            color: "bg-amber-600",
            href: "/reports/territory",
            metrics: [`${stats.electrificationRate.toFixed(1)}% Électricité`, `${stats.potableWaterRate.toFixed(1)}% Eau Potable`]
        }

    ];

    return (
        <PermissionGuard permission="page:reports:view">
            <div className="flex flex-col gap-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-black uppercase tracking-[0.2em] text-[10px] shadow-sm">
                            <Database className="h-3.5 w-3.5" />
                            Intelligence Systémique
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter text-slate-900 md:text-7xl leading-none">
                            Reporting <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Vault</span>
                        </h1>
                        <p className="text-slate-500 font-medium max-w-2xl text-xl leading-relaxed">
                            Accédez aux indicateurs de performance stratégiques et générez des rapports institutionnels de haute précision.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden lg:flex flex-col text-right mr-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dernière Sync</span>
                            <span className="text-sm font-bold text-slate-900">Aujourd'hui, 11:52</span>
                        </div>
                        <Button variant="outline" className="rounded-2xl h-14 px-6 border-slate-200 bg-white/50 backdrop-blur-sm shadow-xl shadow-slate-200/20 font-black text-slate-600 hover:bg-white transition-all text-sm">
                            <Calendar className="mr-2 h-4 w-4 text-indigo-500" />
                            Mars 2024
                        </Button>
                    </div>
                </div>

                {/* Quick KPIs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: "Personnel Actif", value: stats.activeEmployees, trend: "+2.4%", icon: Users, color: "text-indigo-600", bg: "from-indigo-500/20 to-indigo-500/5", border: "border-indigo-100" },
                        { label: "Village Cover", value: stats.villages, trend: "Stable", icon: MapPin, color: "text-rose-600", bg: "from-rose-500/20 to-rose-500/5", border: "border-rose-100" },
                        { label: "IT Health", value: `${Math.round(((stats.assets - stats.itRepair) / (stats.assets || 1)) * 100)}%`, trend: "Opérationnel", icon: Laptop, color: "text-emerald-600", bg: "from-emerald-500/20 to-emerald-500/5", border: "border-emerald-100" },
                        { label: "Alertes Supply", value: stats.lowStock, trend: "-5", icon: Package, color: "text-amber-600", bg: "from-amber-500/20 to-amber-500/5", border: "border-amber-100" }
                    ].map((kpi, i) => (
                        <Card key={i} className="border-none shadow-2xl shadow-slate-200/50 rounded-2xl overflow-hidden group hover:shadow-indigo-200/30 transition-all duration-700 bg-white">
                            <CardContent className="p-10 relative">
                                <div className={cn("absolute top-0 right-0 h-40 w-40 -mr-20 -mt-20 rounded-full blur-[80px] opacity-10 bg-gradient-to-br", kpi.bg)} />
                                <div className="flex flex-col gap-6 relative z-10">
                                    <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:-rotate-6 duration-700 bg-white border shadow-sm", kpi.border)}>
                                        <kpi.icon className={cn("h-8 w-8", kpi.color)} />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                                            {kpi.trend !== "Stable" && (
                                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                                                    {kpi.trend}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-5xl font-black text-slate-900 tracking-tighter transition-all group-hover:translate-x-1 duration-700">{kpi.value}</h3>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Reports Grid Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {reportCards.map((card, i) => (
                        <Link href={card.href} key={i} className="h-full">
                            <Card className="h-full border border-slate-100 shadow-2xl shadow-slate-200/30 rounded-2xl overflow-hidden group hover:shadow-indigo-300/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-700 bg-white relative flex flex-col">
                                <div className={cn("absolute top-0 right-0 h-40 w-40 -mr-20 -mt-20 rounded-full blur-[60px] opacity-10 group-hover:opacity-30 transition-all duration-700", card.color)} />
                                <CardHeader className="p-10 pb-4 relative z-10 flex-1">
                                    <div className={cn("h-16 w-16 rounded-[1.25rem] flex items-center justify-center shadow-xl mb-8 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700", card.color)}>
                                        <card.icon className="h-8 w-8 text-white" />
                                    </div>
                                    <CardTitle className="text-2xl font-black text-slate-950 group-hover:text-indigo-600 transition-colors leading-[1.1]">{card.title}</CardTitle>
                                    <CardDescription className="text-slate-500 font-medium text-base leading-relaxed mt-4">
                                        {card.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-10 pt-4 mt-auto relative z-10">
                                    <div className="flex flex-wrap gap-2 mb-10">
                                        {card.metrics.map((m, j) => (
                                            <div key={j} className="bg-slate-50 text-slate-600 font-black border border-slate-100 px-3 py-1.5 rounded-full text-[9px] uppercase tracking-wider">
                                                {m}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] group-hover:text-indigo-600 transition-all">Consulter l'état</span>
                                        <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 text-slate-400 group-hover:rotate-[360deg]">
                                            <ChevronRight className="h-5 w-5" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                {/* Bottom Actions Feed */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl p-8 bg-gradient-to-br from-indigo-600 to-violet-700 text-white relative overflow-hidden">
                        <div className="absolute top-0 left-0 h-full w-full opacity-10 pointer-events-none">
                            <TrendingUp className="h-[200%] w-[200%] -translate-x-1/2 -translate-y-1/4" />
                        </div>
                        <div className="relative z-10 space-y-6">
                            <h3 className="text-3xl font-black leading-none">Besoin d'un rapport personnalisé ?</h3>
                            <p className="text-indigo-100 font-medium text-lg leading-relaxed max-w-md">
                                Générez des extractions croisées de données entre le personnel et le patrimoine technique en quelques clics.
                            </p>
                            <Button className="bg-white text-indigo-600 hover:bg-slate-50 rounded-xl h-14 px-8 font-black text-lg shadow-2xl">
                                Lancer l'expert export
                                <ArrowRight className="ml-3 h-5 w-5" />
                            </Button>
                        </div>
                    </Card>

                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl p-8 bg-slate-900 text-white flex flex-col justify-between group">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-indigo-400" />
                                </div>
                                <span className="font-bold text-slate-400 text-xs uppercase tracking-widest">Guide Utilisateur</span>
                            </div>
                            <ExternalLink className="h-5 w-5 text-slate-600 group-hover:text-white transition-colors" />
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-2xl font-bold">Documentation de Reporting</h4>
                            <p className="text-slate-400 font-medium">Découvrez comment sont calculés les indicateurs et comment interpréter les rapports DISA et Nominatifs.</p>
                            <Link href="/docs/reports" className="text-indigo-400 font-black hover:underline inline-flex items-center gap-2">
                                Lire la documentation
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </Card>
                </div>
            </div>
        </PermissionGuard>
    );
}
