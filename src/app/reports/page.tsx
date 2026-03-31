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

export default function ReportingDashboard() {
    const [stats, setStats] = useState({
        employees: 0,
        activeEmployees: 0,
        chiefs: 0,
        villages: 0,
        assets: 0,
        itRepair: 0,
        lowStock: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [emps, chiefs, assets, assetStats, supplyStats] = await Promise.all([
                    getEmployees(),
                    getChiefs(),
                    getAssets(),
                    getAssetStatusCounts(),
                    getSupplySummary()
                ]);

                setStats({
                    employees: emps.length,
                    activeEmployees: emps.filter(e => e.status === 'Actif').length,
                    chiefs: chiefs.length,
                    villages: new Set(chiefs.map(c => c.village)).size,
                    assets: assets.length,
                    itRepair: assetStats['En réparation'] || 0,
                    lowStock: supplyStats.lowStock
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
        }
    ];

    return (
        <div className="flex flex-col gap-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-indigo-600 font-bold uppercase tracking-[0.2em] text-[10px]">
                        <Database className="h-3 w-3" />
                        Intelligence & Rapports
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900 md:text-5xl">
                        Reporting <span className="text-indigo-600">Dashboard</span>
                    </h1>
                    <p className="text-slate-500 font-medium max-w-xl text-lg">
                        Centre de pilotage stratégique de la CNRCT. Visualisez et exportez les données clés de tous les services.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-xl h-12 px-6 border-slate-200 shadow-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
                        <Calendar className="mr-2 h-4 w-4" />
                        Période: Mars 2024
                    </Button>
                    <Button className="rounded-xl h-12 px-6 bg-slate-900 border-none shadow-xl shadow-slate-200 hover:scale-[1.02] transition-all font-bold">
                        <Download className="mr-2 h-4 w-4" />
                        Export Global
                    </Button>
                </div>
            </div>

            {/* Quick KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Personnel Actif", value: stats.activeEmployees, trend: "+2.4%", icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
                    { label: "Village Cover", value: stats.villages, trend: "Stable", icon: MapPin, color: "text-rose-600", bg: "bg-rose-50" },
                    { label: "IT Health", value: `${Math.round(((stats.assets - stats.itRepair) / (stats.assets || 1)) * 100)}%`, trend: "Opérationnel", icon: Laptop, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Alertes Supply", value: stats.lowStock, trend: "-5", icon: Package, color: "text-amber-600", bg: "bg-amber-50" }
                ].map((kpi, i) => (
                    <Card key={i} className="border-none shadow-xl shadow-slate-200/50 rounded-xl overflow-hidden group hover:shadow-2xl transition-all duration-500">
                        <CardContent className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className={cn("h-14 w-14 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12 duration-500", kpi.bg)}>
                                    <kpi.icon className={cn("h-7 w-7", kpi.color)} />
                                </div>
                                <div className="text-right">
                                    <Badge variant="outline" className="border-slate-100 font-bold bg-white/50 text-[10px] text-slate-400">STATUS</Badge>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-4xl font-black text-slate-950 tracking-tighter">{kpi.value}</h3>
                                    {kpi.trend !== "Stable" && <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-full">{kpi.trend}</span>}
                                </div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Reports Grid Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {reportCards.map((card, i) => (
                    <Link href={card.href} key={i}>
                        <Card className="h-full border-none shadow-lg shadow-slate-200/40 rounded-2xl overflow-hidden group hover:shadow-2xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-500 cursor-pointer bg-white relative">
                            <div className={cn("absolute top-0 right-0 h-32 w-32 -mr-16 -mt-16 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity", card.color)} />
                            <CardHeader className="p-8 pb-4">
                                <div className={cn("h-16 w-16 rounded-xl flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500", card.color)}>
                                    <card.icon className="h-8 w-8 text-white" />
                                </div>
                                <CardTitle className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{card.title}</CardTitle>
                                <CardDescription className="text-slate-500 font-medium text-sm leading-relaxed mt-2 line-clamp-2">
                                    {card.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 pt-4">
                                <div className="flex flex-wrap gap-2 mb-8">
                                    {card.metrics.map((m, j) => (
                                        <Badge key={j} variant="secondary" className="bg-slate-50 text-slate-600 font-bold border-none px-3 py-1 text-[10px]">
                                            {m}
                                        </Badge>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                                    <span className="text-sm font-black text-slate-900 uppercase tracking-widest group-hover:tracking-[0.2em] transition-all">Consulter l'état</span>
                                    <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all text-slate-400">
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
    );
}
