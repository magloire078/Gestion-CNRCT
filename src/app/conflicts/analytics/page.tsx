"use client";

import { useEffect, useState, useMemo, useRef, useTransition } from "react";
import { 
    LayoutDashboard, TrendingUp, AlertTriangle, 
    ArrowLeft, Calendar, Users, ShieldAlert,
    BarChart3, PieChart as PieChartIcon, Globe, CheckCircle2,
    FileDown, Loader2, Filter, Activity,
    Target, Zap
} from "lucide-react";
import Link from "next/link";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
    ConflictTypeChart, 
    ConflictHistoryChart, 
    ConflictRegionChart,
    ConflictStatusChart,
    ResolutionTimeChart,
    ImpactThematicChart,
    Chart3DEffects
} from "@/components/charts/conflict-analytics-charts";
import { ConflictHeatmap } from "@/components/charts/conflict-heatmap";
import { subscribeToConflicts } from "@/services/conflict-service";
import type { Conflict } from "@/types/common";
import { IVORIAN_REGIONS } from "@/constants/regions";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * En-tête institutionnel dédié à l'export PDF
 */
const ReportPdfHeader = ({ region, year, type }: { region: string, year: string, type: string }) => (
    <div id="pdf-report-header" className="hidden print:block mb-8 p-10 bg-white border-b-4 border-slate-900 rounded-[2.5rem]">
        <div className="flex justify-between items-start mb-10">
            <div className="flex items-center gap-6">
                <div className="relative w-24 h-24">
                    <img src="/assets/cnrct-logo.png" alt="Logo CNRCT" className="object-contain" />
                </div>
                <div className="h-16 w-px bg-slate-200" />
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter">CNRCT</h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest text-nowrap">Observatoire National des Conflits</p>
                </div>
            </div>
            <div className="text-right">
                <div className="relative w-20 h-20 ml-auto mb-2">
                    <img src="/assets/ci-logo.png" alt="Logo CI" className="object-contain" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">République de Côte d'Ivoire</p>
            </div>
        </div>
        
        <div className="space-y-4">
            <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none">
                Rapport Analytique Stratégique
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-slate-500">
                <Badge variant="secondary" className="px-4 py-1.5 rounded-full font-bold text-sm bg-slate-100">
                    Généré le: {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Badge>
                <div className="flex gap-3">
                    <div className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold">
                        Région: <span className="text-primary">{region}</span>
                    </div>
                    <div className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold">
                        Année: <span className="text-primary">{year}</span>
                    </div>
                    <div className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold">
                        Type: <span className="text-primary">{type}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export default function ConflictAnalyticsPage() {
    const [allConflicts, setAllConflicts] = useState<Conflict[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    // Filters
    const [selectedRegion, setSelectedRegion] = useState<string>("Tous");
    const [selectedYear, setSelectedYear] = useState<string>("Tous");
    const [selectedType, setSelectedType] = useState<string>("Tous");
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        const unsubscribe = subscribeToConflicts(
            (fetched) => {
                setAllConflicts(fetched);
                setLoading(false);
            },
            (err) => {
                console.error(err);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, []);

    const filteredConflicts = useMemo(() => {
        if (!allConflicts) return [];
        return allConflicts.filter(c => {
            const matchesRegion = selectedRegion === "Tous" || c.region === selectedRegion;
            const matchesYear = selectedYear === "Tous" || c.reportedDate.startsWith(selectedYear);
            const matchesType = selectedType === "Tous" || c.type === selectedType;
            return matchesRegion && matchesYear && matchesType;
        });
    }, [allConflicts, selectedRegion, selectedYear, selectedType]);

    const availableYears = useMemo(() => {
        if (!allConflicts) return [];
        const years = new Set<string>();
        allConflicts.forEach(c => {
            const year = c.reportedDate.split('-')[0];
            if (year) years.add(year);
        });
        return Array.from(years).sort((a, b) => b.localeCompare(a));
    }, [allConflicts]);

    const availableTypes = useMemo(() => {
        if (!allConflicts) return [];
        const types = new Set<string>();
        allConflicts.forEach(c => {
            if (c.type) types.add(c.type);
        });
        return Array.from(types).sort();
    }, [allConflicts]);

    const stats = useMemo(() => {
        if (filteredConflicts.length === 0 && !allConflicts) return null;
        const total = filteredConflicts.length;
        const resolved = filteredConflicts.filter(c => c.status === "Résolu").length;
        const inProgress = filteredConflicts.filter(c => c.status === "Ouvert").length;
        const inMediation = filteredConflicts.filter(c => c.status === "En médiation").length;
        
        const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

        return {
            total,
            resolved,
            inProgress,
            inMediation,
            resolutionRate
        };
    }, [filteredConflicts, allConflicts]);

    const handleExportPDF = async () => {
        if (!reportRef.current) return;
        setExporting(true);
        
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        window.scrollTo(0, 0);
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            const header = document.getElementById('pdf-report-header');
            if (header) {
                header.classList.remove('hidden');
                header.style.display = 'block';
            }

            const pdf = new jsPDF("p", "mm", "a4", true);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const margin = 10;
            const contentWidth = pdfWidth - (2 * margin);
            let currentY = margin;

            const blocks = reportRef.current?.querySelectorAll('.pdf-page-block');
            
            if (!blocks || blocks.length === 0) {
                throw new Error("Aucun bloc de contenu trouvé.");
            }

            for (let i = 0; i < blocks.length; i++) {
                const block = blocks[i] as HTMLElement;
                const canvas = await html2canvas(block, {
                    scale: 2, 
                    useCORS: true,
                    logging: false,
                    backgroundColor: "#f1f5f9",
                    windowWidth: 1200,
                    onclone: (clonedDoc) => {
                        const clonedBlock = clonedDoc.querySelector('.pdf-page-block') as HTMLElement;
                        if (clonedBlock) {
                            clonedBlock.style.opacity = '1';
                            clonedBlock.style.visibility = 'visible';
                        }
                    }
                });

                const imgData = canvas.toDataURL("image/png", 0.8);
                const imgProps = pdf.getImageProperties(imgData);
                const blockHeightInPdf = (imgProps.height * contentWidth) / imgProps.width;

                if (currentY + blockHeightInPdf > pdfHeight - margin) {
                    pdf.addPage();
                    currentY = margin;
                }

                pdf.addImage(imgData, "PNG", margin, currentY, contentWidth, blockHeightInPdf, undefined, 'FAST');
                currentY += blockHeightInPdf + 8;
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            if (header) {
                header.classList.add('hidden');
                header.style.display = '';
            }

            pdf.save(`Analyse-Stratégique-CNRCT-${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error("PDF Export Error:", error);
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 space-y-8">
                <Skeleton className="h-12 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Skeleton className="h-32 rounded-2xl" />
                    <Skeleton className="h-32 rounded-2xl" />
                    <Skeleton className="h-32 rounded-2xl" />
                    <Skeleton className="h-32 rounded-2xl" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Skeleton className="h-[400px] rounded-[2.5rem]" />
                    <Skeleton className="h-[400px] rounded-[2.5rem]" />
                </div>
            </div>
        );
    }

    return (
        <div className="pb-20 space-y-10">
            <Chart3DEffects />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-4">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <Link href="/conflicts">
                            <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl border-slate-200 bg-white shadow-sm font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-all">
                                <ArrowLeft className="h-3.5 w-3.5 mr-2" /> Retour
                            </Button>
                        </Link>
                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-[0.2em] text-primary border-primary/20 bg-primary/5 px-3 py-1">
                            Observatoire Strategique
                        </Badge>
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                        Analyses des Conflits <Activity className="h-10 w-10 text-primary animate-pulse" />
                    </h1>
                    <p className="text-slate-500 font-medium max-w-2xl leading-relaxed">
                        Intelligence opérationnelle et cartographie des tendances sociales pour la prévention des crises nationales.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Button 
                        variant="outline" 
                        className="rounded-xl font-black h-12 px-6 border-slate-200 bg-white shadow-sm hover:shadow-md transition-all uppercase text-[10px] tracking-widest"
                        onClick={handleExportPDF}
                        disabled={exporting}
                    >
                        {exporting ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin text-primary" />
                        ) : (
                            <FileDown className="h-4 w-4 mr-2 text-primary" />
                        )} 
                        Rapport Stratégique
                    </Button>
                    <Button 
                        onClick={() => window.location.reload()}
                        className="rounded-xl font-black h-12 px-6 shadow-xl shadow-primary/20 bg-slate-900 border-none hover:bg-slate-800 transition-all uppercase text-[10px] tracking-widest"
                    >
                        <Zap className="h-4 w-4 mr-2 text-yellow-400 fill-yellow-400" /> Actualiser
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white/80 backdrop-blur-xl p-6 border border-white/40">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-900 rounded-2xl text-white shadow-lg shadow-slate-200">
                        <Filter className="h-4 w-4 text-primary" />
                        <span className="text-xs font-black uppercase tracking-widest">Paramètres d'Affichage</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 flex-1">
                        <Select value={selectedRegion} onValueChange={(v) => startTransition(() => setSelectedRegion(v))}>
                            <SelectTrigger className="w-full md:w-[220px] h-11 rounded-xl border-slate-200 bg-white font-bold text-xs uppercase tracking-tight">
                                <SelectValue placeholder="Région" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-100">
                                <SelectItem value="Tous">Toutes les régions</SelectItem>
                                {IVORIAN_REGIONS.map(region => (
                                    <SelectItem key={region} value={region}>{region}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={selectedYear} onValueChange={(v) => startTransition(() => setSelectedYear(v))}>
                            <SelectTrigger className="w-full md:w-[160px] h-11 rounded-xl border-slate-200 bg-white font-bold text-xs uppercase tracking-tight">
                                <SelectValue placeholder="Année" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-100">
                                <SelectItem value="Tous">Toutes les années</SelectItem>
                                {availableYears.map(year => (
                                    <SelectItem key={year} value={year}>{year}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={selectedType} onValueChange={(v) => startTransition(() => setSelectedType(v))}>
                            <SelectTrigger className="w-full md:w-[220px] h-11 rounded-xl border-slate-200 bg-white font-bold text-xs uppercase tracking-tight">
                                <SelectValue placeholder="Type de conflit" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-100">
                                <SelectItem value="Tous">Tous les types</SelectItem>
                                {availableTypes.map(type => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {(selectedRegion !== "Tous" || selectedYear !== "Tous" || selectedType !== "Tous") && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-[10px] font-black uppercase text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg h-11 px-4"
                                onClick={() => {
                                    startTransition(() => {
                                        setSelectedRegion("Tous");
                                        setSelectedYear("Tous");
                                        setSelectedType("Tous");
                                    });
                                }}
                            >
                                Réinitialiser
                            </Button>
                        )}
                    </div>

                    <div className="hidden lg:block ml-auto border-l border-slate-100 pl-6">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dossiers Analysés</p>
                            <p className="text-2xl font-black text-slate-900">{filteredConflicts.length}</p>
                        </div>
                    </div>
                </div>
            </Card>
            
            <div ref={reportRef} className="space-y-10 p-4 md:p-10 bg-[#f1f5f9] rounded-[3.5rem] border border-white/50">
                <div className="pdf-page-block">
                    <ReportPdfHeader region={selectedRegion} year={selectedYear} type={selectedType} />
                </div>

                {/* KPI Cards Upgraded */}
                <div className="pdf-page-block grid grid-cols-1 md:grid-cols-4 gap-8">
                    <Card className="border-none shadow-2xl shadow-slate-200/40 rounded-[2rem] overflow-hidden bg-white group hover:-translate-y-2 transition-all duration-500 relative">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Users className="h-16 w-16" />
                        </div>
                        <CardHeader className="pb-4 relative z-10">
                            <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center mb-4 shadow-lg shadow-slate-200 group-hover:bg-primary transition-colors">
                                <Users className="h-6 w-6 text-white" />
                            </div>
                            <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Dossiers</CardDescription>
                            <CardTitle className="text-4xl font-black text-slate-900 tracking-tight">{stats?.total}</CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider italic">Volume global archivé</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-2xl shadow-slate-200/40 rounded-[2rem] overflow-hidden bg-white group hover:-translate-y-2 transition-all duration-500 relative">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                            <CheckCircle2 className="h-16 w-16" />
                        </div>
                        <CardHeader className="pb-4 relative z-10">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center mb-4 shadow-lg shadow-emerald-100 group-hover:scale-110 transition-transform">
                                <Target className="h-6 w-6 text-white" />
                            </div>
                            <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Taux de Résolution</CardDescription>
                            <CardTitle className="text-4xl font-black text-slate-900 tracking-tight">{stats?.resolved}</CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-tighter">
                                {stats?.resolutionRate}% de succès national
                            </Badge>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-2xl shadow-slate-200/40 rounded-[2rem] overflow-hidden bg-white group hover:-translate-y-2 transition-all duration-500 relative">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                            <ShieldAlert className="h-16 w-16" />
                        </div>
                        <CardHeader className="pb-4 relative z-10">
                            <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-100 group-hover:rotate-12 transition-transform">
                                <ShieldAlert className="h-6 w-6 text-white" />
                            </div>
                            <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">En Médiation</CardDescription>
                            <CardTitle className="text-4xl font-black text-slate-900 tracking-tight">{stats?.inMediation}</CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest border-l-2 border-blue-600 pl-3">Dossiers sous surveillance</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-2xl shadow-slate-200/40 rounded-[2rem] overflow-hidden bg-white group hover:-translate-y-2 transition-all duration-500 relative">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                            <AlertTriangle className="h-16 w-16" />
                        </div>
                        <CardHeader className="pb-4 relative z-10">
                            <div className="h-12 w-12 rounded-2xl bg-rose-600 flex items-center justify-center mb-4 shadow-lg shadow-rose-100 group-hover:scale-90 transition-transform">
                                <AlertTriangle className="h-6 w-6 text-white" />
                            </div>
                            <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Foyers Ouverts</CardDescription>
                            <CardTitle className="text-4xl font-black text-slate-900 tracking-tight">{stats?.inProgress}</CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <p className="text-[10px] text-rose-600 font-black uppercase tracking-widest border-l-2 border-rose-600 pl-3">Alerte Priorité Haute</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Grid - Enhanced */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <Card className="pdf-page-block border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white hover:shadow-primary/5 transition-all">
                        <CardHeader className="p-10 border-b border-slate-50 bg-slate-50/30">
                            <div className="flex items-center gap-3 mb-2">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Profil d'Expansion Historique</CardTitle>
                            </div>
                            <CardDescription className="font-medium">Analyse longitudinale du flux de signalements (2016-2025).</CardDescription>
                        </CardHeader>
                        <CardContent className="p-10">
                            <ConflictHistoryChart conflicts={filteredConflicts} />
                        </CardContent>
                    </Card>

                    <Card className="pdf-page-block border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white hover:shadow-primary/5 transition-all">
                        <CardHeader className="p-10 border-b border-slate-50 bg-slate-50/30">
                            <div className="flex items-center gap-3 mb-2">
                                <PieChartIcon className="h-5 w-5 text-primary" />
                                <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Répartition des Typologies</CardTitle>
                            </div>
                            <CardDescription className="font-medium">Nature prédominante des litiges enregistrés sur la période.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-10">
                            <ConflictTypeChart conflicts={filteredConflicts} />
                        </CardContent>
                    </Card>

                    <Card className="pdf-page-block border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white hover:shadow-primary/5 transition-all">
                        <CardHeader className="p-10 border-b border-slate-50 bg-slate-50/30">
                            <div className="flex items-center gap-3 mb-2">
                                <Globe className="h-5 w-5 text-primary" />
                                <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Concentration Régionale (Top 10)</CardTitle>
                            </div>
                            <CardDescription className="font-medium">Hiérarchie géographique des zones à forte conflictualité.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-10">
                            <ConflictRegionChart conflicts={filteredConflicts} />
                        </CardContent>
                    </Card>

                    <Card className="pdf-page-block border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white hover:shadow-primary/5 transition-all">
                        <CardHeader className="p-10 border-b border-slate-50 bg-slate-50/30">
                            <div className="flex items-center gap-3 mb-2">
                                <Calendar className="h-5 w-5 text-primary" />
                                <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Vitesse de Résolution (MGP)</CardTitle>
                            </div>
                            <CardDescription className="font-medium">Évaluation de l'efficacité opérationnelle des comités de médiation.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-10">
                            <ResolutionTimeChart conflicts={filteredConflicts} />
                        </CardContent>
                    </Card>

                    <Card className="pdf-page-block border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white lg:col-span-2">
                        <CardHeader className="p-10 border-b border-slate-50 bg-slate-50/30">
                            <div className="flex items-center gap-3 mb-2">
                                <BarChart3 className="h-5 w-5 text-primary" />
                                <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Matrice d'Impact & Risques</CardTitle>
                            </div>
                            <CardDescription className="font-medium">Conséquences socio-économiques et environnementales des conflits répertoriés.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-10">
                            <ImpactThematicChart conflicts={filteredConflicts} />
                        </CardContent>
                    </Card>

                    <div className="pdf-page-block lg:col-span-2">
                        <ConflictHeatmap conflicts={filteredConflicts} />
                    </div>
                </div>
            </div>
        </div>
    );
}
