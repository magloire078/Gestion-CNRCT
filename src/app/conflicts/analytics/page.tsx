
"use client";

import { useEffect, useState, useMemo, useRef, useTransition } from "react";
import { 
    LayoutDashboard, TrendingUp, AlertTriangle, 
    ArrowLeft, Calendar, Users, ShieldAlert,
    BarChart3, PieChart as PieChartIcon, Globe, CheckCircle2,
    FileDown, Loader2, Filter
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
import Image from "next/image";

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
        
        // Wait for next paint to ensure the "Exporting..." UI is visible
        // This is crucial for solving INP (Interaction to Next Paint) issues
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        
        // Ensure we are at the top for proper capture
        window.scrollTo(0, 0);
        
        // Let animations and charts stabilize - increase slightly for safety
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            // Force header visibility
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
                
                // Capture block with Scale 2 for better stability
                const canvas = await html2canvas(block, {
                    scale: 2, 
                    useCORS: true,
                    logging: false,
                    backgroundColor: "#f1f5f9",
                    windowWidth: 1200,
                    // Ensure charts are rendered before capture
                    onclone: (clonedDoc) => {
                        const clonedBlock = clonedDoc.querySelector('.pdf-page-block') as HTMLElement;
                        if (clonedBlock) {
                            clonedBlock.style.opacity = '1';
                            clonedBlock.style.visibility = 'visible';
                        }
                    }
                });

                const imgData = canvas.toDataURL("image/png", 0.8); // Slight compression 
                const imgProps = pdf.getImageProperties(imgData);
                const blockHeightInPdf = (imgProps.height * contentWidth) / imgProps.width;

                if (currentY + blockHeightInPdf > pdfHeight - margin) {
                    pdf.addPage();
                    currentY = margin;
                }

                pdf.addImage(imgData, "PNG", margin, currentY, contentWidth, blockHeightInPdf, undefined, 'FAST');
                currentY += blockHeightInPdf + 8; // More padding between blocks

                // Small pause between blocks to let the browser breath
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
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Link href="/conflicts">
                            <Button variant="ghost" size="sm" className="h-8 rounded-full">
                                <ArrowLeft className="h-4 w-4 mr-2" /> Retour
                            </Button>
                        </Link>
                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest text-primary border-primary/20">
                            Centre d'Analyse Stratégique
                        </Badge>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        Statistiques des Conflits <LayoutDashboard className="h-8 w-8 text-slate-300" />
                    </h1>
                    <p className="text-slate-500 font-medium max-w-2xl">
                        Analyse dynamique des dossiers. Utilisez les filtres pour affiner les tendances, la géographie et les performances.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline" 
                        className="rounded-xl font-bold h-11 border-slate-200 hover:bg-slate-50"
                        onClick={handleExportPDF}
                        disabled={exporting}
                    >
                        {exporting ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <FileDown className="h-4 w-4 mr-2" />
                        )} 
                        Rapport PDF
                    </Button>
                    <Button 
                        onClick={() => window.location.reload()}
                        className="rounded-xl font-bold h-11 shadow-lg shadow-primary/20 bg-slate-900 hover:bg-slate-800"
                    >
                        <BarChart3 className="h-4 w-4 mr-2" /> Actualiser
                    </Button>
                </div>
            </div>

            {/* Filters Section */}
            <Card className="border-none shadow-xl shadow-slate-100 rounded-[2rem] bg-white p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl text-slate-500">
                        <Filter className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Filtres</span>
                    </div>

                    <Select value={selectedRegion} onValueChange={(v) => startTransition(() => setSelectedRegion(v))}>
                        <SelectTrigger className="w-[180px] rounded-xl border-slate-100 bg-slate-50/50 font-bold">
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
                        <SelectTrigger className="w-[140px] rounded-xl border-slate-100 bg-slate-50/50 font-bold">
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
                        <SelectTrigger className="w-[180px] rounded-xl border-slate-100 bg-slate-50/50 font-bold">
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
                            className="text-[10px] font-black uppercase text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg px-2"
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

                    <div className="ml-auto">
                        <Badge variant="outline" className="bg-slate-50 border-slate-100 text-slate-400 font-bold rounded-lg px-3 py-1">
                            {filteredConflicts.length} dossiers filtrés
                        </Badge>
                    </div>
                </div>
            </Card>
            
            <div ref={reportRef} className="space-y-10 p-4 md:p-8 bg-[#f1f5f9] rounded-[3rem]">
                <div className="pdf-page-block">
                    <ReportPdfHeader region={selectedRegion} year={selectedYear} type={selectedType} />
                </div>

                {/* KPI Cards */}
                <div className="pdf-page-block grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white group hover:shadow-2xl transition-all duration-500">
                        <CardHeader className="pb-2">
                            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <CardDescription className="text-[10px] font-black uppercase tracking-widest">Total Dossiers</CardDescription>
                            <CardTitle className="text-3xl font-black text-slate-900">{stats?.total}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-[10px] text-slate-400 font-medium">Archivage cumulé 2016-2025</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white group hover:shadow-2xl transition-all duration-500">
                        <CardHeader className="pb-2">
                            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            </div>
                            <CardDescription className="text-[10px] font-black uppercase tracking-widest">Dossiers Résolus</CardDescription>
                            <CardTitle className="text-3xl font-black text-slate-900">{stats?.resolved}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-none font-bold">
                                {stats?.resolutionRate}% de réussite
                            </Badge>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white group hover:shadow-2xl transition-all duration-500">
                        <CardHeader className="pb-2">
                            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <ShieldAlert className="h-5 w-5 text-amber-600" />
                            </div>
                            <CardDescription className="text-[10px] font-black uppercase tracking-widest">En Médiation</CardDescription>
                            <CardTitle className="text-3xl font-black text-slate-900">{stats?.inMediation}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-[10px] text-slate-400 font-medium">Procédures actives sur le terrain</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white group hover:shadow-2xl transition-all duration-500">
                        <CardHeader className="pb-2">
                            <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <AlertTriangle className="h-5 w-5 text-rose-600" />
                            </div>
                            <CardDescription className="text-[10px] font-black uppercase tracking-widest">En Cours</CardDescription>
                            <CardTitle className="text-3xl font-black text-slate-900">{stats?.inProgress}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-[10px] text-slate-400 font-medium">Nouveaux dossiers non traités</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Evolution Profile */}
                    <Card className="pdf-page-block border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="p-8 border-b border-slate-50">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-slate-400" /> Courbe d'Activité Historique
                            </CardTitle>
                            <CardDescription>Nombre de conflits signalés par année.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                            <ConflictHistoryChart conflicts={filteredConflicts} />
                        </CardContent>
                    </Card>

                    {/* Impact Analysis */}
                    <Card className="pdf-page-block border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="p-8 border-b border-slate-50">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-slate-400" /> Analyse Thématique des Impacts
                            </CardTitle>
                            <CardDescription>Principales conséquences identifiées dans les dossiers.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                            <ImpactThematicChart conflicts={filteredConflicts} />
                        </CardContent>
                    </Card>

                    {/* Typology distribution */}
                    <Card className="pdf-page-block border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="p-8 border-b border-slate-50">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <PieChartIcon className="h-5 w-5 text-slate-400" /> Analyse par Typologie
                            </CardTitle>
                            <CardDescription>Répartition des natures de conflits enregistrés.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                            <ConflictTypeChart conflicts={filteredConflicts} />
                        </CardContent>
                    </Card>

                    {/* Resolution Performance */}
                    <Card className="pdf-page-block border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="p-8 border-b border-slate-50">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-slate-400" /> Délais de Résolution
                            </CardTitle>
                            <CardDescription>Distribution du temps de traitement des dossiers clôturés.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                            <ResolutionTimeChart conflicts={filteredConflicts} />
                        </CardContent>
                    </Card>

                    {/* Regional Stats */}
                    <Card className="pdf-page-block border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="p-8 border-b border-slate-50">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Globe className="h-5 w-5 text-slate-400" /> Top 10 des Régions
                            </CardTitle>
                            <CardDescription>Classement géographique par volume de litiges.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                            <ConflictRegionChart conflicts={filteredConflicts} />
                        </CardContent>
                    </Card>


                    {/* Performance / Status */}
                    <Card className="pdf-page-block border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="p-8 border-b border-slate-50">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-slate-400" /> État Global d'Avancement
                            </CardTitle>
                            <CardDescription>Visualisation du cycle de vie des dossiers.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                            <ConflictStatusChart conflicts={filteredConflicts} />
                        </CardContent>
                    </Card>

                    {/* Social Heatmap - Full Width */}
                    <div className="pdf-page-block lg:col-span-2">
                        <ConflictHeatmap conflicts={filteredConflicts} />
                    </div>
                </div>
            </div>
        </div>
    );
}
