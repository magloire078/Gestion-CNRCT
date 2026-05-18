"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import { 
    Search, 
    Filter, 
    MapPin, 
    Users, 
    Plus, 
    ChevronRight,
    SearchX,
    LayoutGrid,
    RefreshCw,
    X,
    Building2,
    Map as MapIcon,
    Printer,
    Download,
    Calendar,
    ArrowLeft,
    Zap,
    Droplets,
    School,
    Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { DebouncedInput } from "@/components/ui/debounced-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardFooter, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { subscribeToVillages } from "@/services/village-service";
import { subscribeToChiefs } from "@/services/chief-service";
import { getOrganizationSettings } from "@/services/organization-service";
import { Village, VillageEntry } from "@/types/village";
import { Chief } from "@/types/chief";
import { OrganizationSettings } from "@/types/common";
import { IVORIAN_REGIONS } from "@/constants/regions";
import { divisions } from "@/lib/ivory-coast-divisions";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AddVillageSheet } from "@/components/villages/add-village-sheet";
import { VillageQuickView } from "@/components/villages/village-quick-view";
import { VillagesOfficialReport } from "@/components/reports/villages-official-report";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { PaginationControls } from "@/components/common/pagination-controls";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { List, Settings } from "lucide-react";
import { DataMigrationTool } from "@/components/maintenance/data-migration-tool";
import { normalizeString, getOfficialRegion, getOfficialDepartment, getOfficialSubPrefecture } from "@/lib/normalization-utils";


type SeatStatus = "all" | "occupied" | "vacant";

export default function VillagesPage() {
    // Data State
    const { user, settings } = useAuth();
    const [villages, setVillages] = useState<Village[]>([]);
    const [chiefs, setChiefs] = useState<Chief[]>([]);
    const [loading, setLoading] = useState(true);
    
    // UI State
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRegion, setSelectedRegion] = useState<string>("all");
    const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
    const [selectedCommune, setSelectedCommune] = useState<string>("all");
    const [activeTab, setActiveTab] = useState("all");
    const [quickViewVillage, setQuickViewVillage] = useState<{ village: Village, chief: Chief | null } | null>(null);
    const [printDate, setPrintDate] = useState("");
    const [isPrinting, setIsPrinting] = useState(false);
    const [isPending, startTransition] = useTransition();

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);
    const [showMaintenance, setShowMaintenance] = useState(false);

    // Fetch Data with Real-time Sync
    useEffect(() => {
        let villagesLoaded = false;
        let chiefsLoaded = false;

        const checkLoadingFinished = () => {
            if (villagesLoaded && chiefsLoaded) {
                console.log(`[VillagesPage] Loading finished. Villages: ${villages.length}, Chiefs: ${chiefs.length}`);
                setLoading(false);
            }
        };

        setLoading(true);
        
        // Subscription to Villages
        const unsubscribeVillages = subscribeToVillages((updatedVillages) => {
            console.log(`[VillagesPage] Received ${updatedVillages.length} villages`);
            setVillages(updatedVillages);
            villagesLoaded = true;
            checkLoadingFinished();
        }, (error) => {
            console.error("Error subscribing to villages:", error);
            villagesLoaded = true;
            checkLoadingFinished();
        });

        // Subscription to Chiefs
        const unsubscribeChiefs = subscribeToChiefs((updatedChiefs) => {
            console.log(`[VillagesPage] Received ${updatedChiefs.length} chiefs`);
            setChiefs(updatedChiefs);
            chiefsLoaded = true;
            checkLoadingFinished();
        }, (error) => {
            console.error("Error subscribing to chiefs:", error);
            chiefsLoaded = true;
            checkLoadingFinished();
        });

        return () => {
            unsubscribeVillages();
            unsubscribeChiefs();
        };
    }, []);

    useEffect(() => {
        setPrintDate(format(new Date(), "dd/MM/yyyy"));
    }, []);



    // Derived Data: Merge Villages and Chiefs
    const villageEntries = useMemo(() => {
        return villages.map(village => {
            const villageChiefs = chiefs.filter(c => c.villageId === village.id);
            const currentChief = villageChiefs.find(c => c.status === 'actif' || c.status === 'a_vie') || null;
            const archivedChiefsCount = villageChiefs.filter(c => c.status === 'archive').length;
            
            return {
                village,
                currentChief,
                archivedChiefsCount
            };
        });
    }, [villages, chiefs]);

    // Computed stats for filters
    const filterStats = useMemo(() => {
        const stats = {
            regions: {} as Record<string, number>,
            departments: {} as Record<string, number>,
            communes: {} as Record<string, number>
        };

        villages.forEach(v => {
            if (v.region) stats.regions[v.region] = (stats.regions[v.region] || 0) + 1;
            if (v.department) stats.departments[v.department] = (stats.departments[v.department] || 0) + 1;
            if (v.subPrefecture) stats.communes[v.subPrefecture] = (stats.communes[v.subPrefecture] || 0) + 1;
            if (v.commune) stats.communes[v.commune] = (stats.communes[v.commune] || 0) + 1;
        });

        return stats;
    }, [villages]);

    const departments = useMemo(() => {
        if (selectedRegion === "all") return [];
        return Object.keys(divisions[selectedRegion] || {}).sort();
    }, [selectedRegion]);

    const communes = useMemo(() => {
        if (selectedRegion === "all" || selectedDepartment === "all") return [];
        return Object.keys(divisions[selectedRegion]?.[selectedDepartment] || {}).sort();
    }, [selectedRegion, selectedDepartment]);

    // Apply Filters
    const filteredVillages = useMemo(() => {
        return villageEntries.filter(entry => {
            const v = entry.village;
            const c = entry.currentChief;

            // Search Filter
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = !searchQuery || 
                v.name.toLowerCase().includes(searchLower) ||
                v.region.toLowerCase().includes(searchLower) ||
                v.department.toLowerCase().includes(searchLower) ||
                (c && c.name && c.name.toLowerCase().includes(searchLower)) ||
                (c && c.CNRCTRegistrationNumber && c.CNRCTRegistrationNumber.toLowerCase().includes(searchLower));

            if (!matchesSearch) return false;

            // Administrative Filters (using robust normalization)
            if (selectedRegion !== "all") {
                const officialVillageRegion = getOfficialRegion(v.region);
                const officialSelectedRegion = getOfficialRegion(selectedRegion);
                if (normalizeString(officialVillageRegion) !== normalizeString(officialSelectedRegion)) {
                    return false;
                }
            }
            
            if (selectedDepartment !== "all") {
                const officialVillageDept = getOfficialDepartment(v.region, v.department);
                const officialSelectedDept = getOfficialDepartment(selectedRegion, selectedDepartment);
                if (normalizeString(officialVillageDept) !== normalizeString(officialSelectedDept)) {
                    return false;
                }
            }
            
            if (selectedCommune !== "all") {
                const officialVillageSP = getOfficialSubPrefecture(v.region, v.department, v.subPrefecture || "");
                const officialSelectedCommune = getOfficialSubPrefecture(selectedRegion, selectedDepartment, selectedCommune);
                if (normalizeString(officialVillageSP) !== normalizeString(officialSelectedCommune)) {
                    // Try matching commune field too
                    const officialVillageCommune = getOfficialSubPrefecture(v.region, v.department, v.commune || "");
                    if (normalizeString(officialVillageCommune) !== normalizeString(officialSelectedCommune)) {
                        return false;
                    }
                }
            }

            // Status Filter (via Tabs)
            if (activeTab === "vacant" && c) return false;
            if (activeTab === "occupied" && !c) return false;

            return true;
        });
    }, [villageEntries, searchQuery, selectedRegion, selectedDepartment, selectedCommune, activeTab]);

    // Pagination Logic
    const paginatedVillages = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredVillages.slice(start, start + itemsPerPage);
    }, [filteredVillages, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredVillages.length / itemsPerPage) || 1;

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedRegion, selectedDepartment, selectedCommune, activeTab]);

    const printSubtitle = useMemo(() => {
        let subtitle = `Total: ${filteredVillages.length} | Date: ${printDate}`;
        if (selectedRegion !== "all") subtitle += ` | Région: ${selectedRegion}`;
        if (selectedDepartment !== "all") subtitle += ` | Dept: ${selectedDepartment}`;
        if (selectedCommune !== "all") subtitle += ` | S/P: ${selectedCommune}`;
        if (activeTab !== "all") subtitle += ` | Statut: ${activeTab === 'occupied' ? 'Occupés' : 'Vacants'}`;
        if (searchQuery) subtitle += ` | Recherche: ${searchQuery}`;
        return subtitle;
    }, [filteredVillages.length, printDate, selectedRegion, selectedDepartment, selectedCommune, activeTab, searchQuery]);

    const stats = useMemo(() => {
        const total = filteredVillages.length;
        if (total === 0) return { total: 0, vacant: 0, occupied: 0, electricity: 0, water: 0, school: 0, health: 0, market: 0, spiritual: 0 };
        
        return {
            total,
            vacant: filteredVillages.filter(v => !v.currentChief).length,
            occupied: filteredVillages.filter(v => v.currentChief).length,
            electricity: (filteredVillages.filter(v => v.village.hasElectricity).length / total) * 100,
            water: (filteredVillages.filter(v => v.village.hasWater).length / total) * 100,
            school: (filteredVillages.filter(v => v.village.hasSchool).length / total) * 100,
            health: (filteredVillages.filter(v => v.village.hasHealthCenter).length / total) * 100,
            market: (filteredVillages.filter(v => v.village.hasMarket).length / total) * 100,
            spiritual: (filteredVillages.filter(v => v.village.hasMosque || v.village.hasChurch).length / total) * 100
        };
    }, [filteredVillages]);

    const territorySummary = useMemo(() => {
        if (selectedRegion === "all") return null;

        let deptCount = 0;
        let spCount = 0;

        if (selectedDepartment !== "all") {
            deptCount = 1;
            if (selectedCommune !== "all") {
                spCount = 1;
            } else {
                spCount = Object.keys(divisions[selectedRegion]?.[selectedDepartment] || {}).length;
            }
        } else {
            const depts = divisions[selectedRegion] || {};
            deptCount = Object.keys(depts).length;
            Object.values(depts).forEach(sps => {
                spCount += Object.keys(sps).length;
            });
        }

        return {
            departments: deptCount,
            subPrefectures: spCount,
            villages: filteredVillages.length
        };
    }, [selectedRegion, selectedDepartment, selectedCommune, filteredVillages.length, divisions]);

    const clearFilters = () => {
        setSearchQuery("");
        setSelectedRegion("all");
        setSelectedDepartment("all");
        setSelectedCommune("all");
        setActiveTab("all");
    };

    const handlePrint = () => {
        setIsPrinting(true);
    };

    return (
        <PermissionGuard permission="page:villages:view">
            <div className="min-h-screen bg-slate-50/50">
            {/* Print View Component (Only mounted during print) */}
            {isPrinting && (
                <VillagesOfficialReport 
                    villages={filteredVillages} 
                    organizationSettings={settings} 
                    subtitle={printSubtitle}
                    isPrinting={isPrinting}
                    onAfterPrint={() => setIsPrinting(false)}
                    stats={stats}
                />
            )}

            {/* Villages Header Section */}
            <div className="relative overflow-hidden bg-slate-900 py-12 print:hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 pattern-dots-lg text-white"></div>
                </div>
                
                <div className="container relative mx-auto px-4 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="h-20 w-20 rounded-[2rem] bg-amber-500 flex items-center justify-center shadow-2xl shadow-amber-500/20 rotate-3">
                                <Building2 className="h-10 w-10 text-white -rotate-3" />
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-4xl font-black tracking-tight text-white uppercase italic leading-none">
                                    Localités <span className="text-amber-500 italic">&</span> Autorités
                                </h1>
                                <p className="text-slate-400 font-bold flex items-center gap-2">
                                    <Badge variant="outline" className="bg-white/5 text-slate-300 font-black border-white/10 uppercase tracking-widest text-[10px]">RÉPERTOIRE NATIONAL</Badge>
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                    Observatoire Territorial
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex bg-white/5 backdrop-blur-xl border border-white/10 p-1 rounded-2xl h-14">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setViewMode('grid')}
                                    className={cn(
                                        "h-full w-12 rounded-xl transition-all",
                                        viewMode === 'grid' ? "bg-amber-500 text-white shadow-lg" : "text-slate-400 hover:text-white"
                                    )}
                                >
                                    <LayoutGrid className="h-5 w-5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setViewMode('list')}
                                    className={cn(
                                        "h-full w-12 rounded-xl transition-all",
                                        viewMode === 'list' ? "bg-amber-500 text-white shadow-lg" : "text-slate-400 hover:text-white"
                                    )}
                                >
                                    <List className="h-5 w-5" />
                                </Button>
                            </div>
                            <Button 
                                variant="outline" 
                                className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl h-14 px-8 font-bold group"
                                onClick={handlePrint}
                                disabled={filteredVillages.length === 0 || !settings}
                            >
                                <Printer className="mr-2 h-5 w-5 group-hover:text-amber-500 transition-colors" />
                                {settings ? "Imprimer la liste" : "Chargement..."}
                            </Button>
                             <PermissionGuard permission="page:repository:view">
                                {(user?.role?.name === 'ADMIN' || user?.email === 'magloire078@gmail.com') && (
                                    <Button 
                                        variant="outline" 
                                        onClick={() => setShowMaintenance(!showMaintenance)}
                                        className={cn(
                                            "h-14 px-6 rounded-xl font-bold transition-all gap-2",
                                            showMaintenance ? "bg-white text-slate-900" : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                                        )}
                                    >
                                        <Settings className="h-5 w-5" />
                                        {showMaintenance ? "Fermer Maintenance" : "Maintenance"}
                                    </Button>
                                )}
                                <AddVillageSheet />
                            </PermissionGuard>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12 bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl shadow-black/50">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-amber-400">
                                <Zap className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Électrification</span>
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-black text-white leading-none">{stats.electricity.toFixed(0)}%</span>
                                <Progress 
                                    value={stats.electricity} 
                                    className="h-1.5 bg-white/10" 
                                    indicatorClassName="bg-amber-400"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-blue-400">
                                <Droplets className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Eau Potable</span>
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-black text-white leading-none">{stats.water.toFixed(0)}%</span>
                                <Progress 
                                    value={stats.water} 
                                    className="h-1.5 bg-white/10" 
                                    indicatorClassName="bg-blue-400"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-indigo-400">
                                <School className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Éducation</span>
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-black text-white leading-none">{stats.school.toFixed(0)}%</span>
                                <Progress 
                                    value={stats.school} 
                                    className="h-1.5 bg-white/10" 
                                    indicatorClassName="bg-indigo-400"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-emerald-400">
                                <Activity className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Santé</span>
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-black text-white leading-none">{stats.health.toFixed(0)}%</span>
                                <Progress 
                                    value={stats.health} 
                                    className="h-1.5 bg-white/10" 
                                    indicatorClassName="bg-emerald-400"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-rose-400">
                                <Building2 className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Économie / Marchés</span>
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-black text-white leading-none">{stats.market.toFixed(0)}%</span>
                                <Progress 
                                    value={stats.market} 
                                    className="h-1.5 bg-white/10" 
                                    indicatorClassName="bg-rose-400"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Bar Section */}
            <div className="container mx-auto px-4 lg:px-8 -mt-10 print:hidden">
                <Card className="rounded-xl border-none shadow-2xl shadow-slate-200/50 overflow-hidden bg-white/80 backdrop-blur-xl">
                    <CardContent className="p-4">
                        <div className="flex flex-col lg:flex-row gap-6 items-end">
                            {/* Status Tabs */}
                            <div className="w-full lg:w-auto">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block px-1">
                                    Filtrage Rapide
                                </label>
                                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                    <TabsList className="bg-slate-100 p-1 h-14 rounded-xl w-full lg:w-auto">
                                        <TabsTrigger value="all" className="rounded-lg px-6 font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                                            Tous ({villageEntries.length})
                                        </TabsTrigger>
                                        <TabsTrigger value="occupied" className="rounded-lg px-6 font-bold data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg">
                                            Occupés ({villageEntries.filter(e => e.currentChief).length})
                                        </TabsTrigger>
                                        <TabsTrigger value="vacant" className="rounded-lg px-6 font-bold data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-lg">
                                            Vacants ({villageEntries.filter(e => !e.currentChief).length})
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-10 gap-6 items-end flex-1 w-full">
                                {/* Search Input */}
                                <div className="lg:col-span-4 group">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block px-1">
                                        Recherche par nom ou numéro
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                                            <DebouncedInput
                                                placeholder="Village, Chef, Matricule..."
                                                value={searchQuery}
                                                onChange={(val) => setSearchQuery(val.toString())}
                                                className="pl-12 h-14 bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-amber-500/10 rounded-lg text-lg transition-all font-medium"
                                            />
                                    </div>
                                </div>

                                {/* Region Filter */}
                                <div className="lg:col-span-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block px-1">
                                        Région
                                    </label>
                                    <Select value={selectedRegion} onValueChange={(val) => {
                                        setSelectedRegion(val);
                                        setSelectedDepartment("all");
                                        setSelectedCommune("all");
                                    }}>
                                        <SelectTrigger className="h-14 bg-slate-50 border-transparent rounded-lg font-bold">
                                            <SelectValue placeholder="Région" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-lg border-slate-100">
                                            <SelectItem value="all">Toutes les régions</SelectItem>
                                            {Object.keys(divisions).sort().map(region => (
                                                <SelectItem key={region} value={region}>
                                                    {region} {filterStats.regions[region] ? `(${filterStats.regions[region]})` : ""}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Department Filter */}
                                <div className="lg:col-span-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block px-1">
                                        Département
                                    </label>
                                    <Select 
                                        value={selectedDepartment} 
                                        onValueChange={(val) => {
                                            setSelectedDepartment(val);
                                            setSelectedCommune("all");
                                        }}
                                        disabled={selectedRegion === "all"}
                                    >
                                        <SelectTrigger className="h-14 bg-slate-50 border-transparent rounded-lg font-bold">
                                            <SelectValue placeholder="Département" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-lg border-slate-100">
                                            <SelectItem value="all">Tous les dép.</SelectItem>
                                            {departments.map(dept => (
                                                <SelectItem key={dept} value={dept}>
                                                    {dept} {filterStats.departments[dept] ? `(${filterStats.departments[dept]})` : ""}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Commune Filter */}
                                <div className="lg:col-span-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block px-1">
                                        S-Préf. / Commune
                                    </label>
                                    <Select 
                                        value={selectedCommune} 
                                        onValueChange={(val) => setSelectedCommune(val)}
                                        disabled={selectedDepartment === "all"}
                                    >
                                        <SelectTrigger className="h-14 bg-slate-50 border-transparent rounded-lg font-bold">
                                            <SelectValue placeholder="S-Préf." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-100">
                                            <SelectItem value="all">Toutes les s-préf.</SelectItem>
                                            {communes.map(comm => (
                                                <SelectItem key={comm} value={comm}>{comm}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {(searchQuery || selectedRegion !== "all" || activeTab !== "all") && (
                            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mt-8 pt-6 border-t border-slate-100">
                                <div className="flex items-center gap-4 flex-wrap">
                                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest shrink-0">Filtres actifs:</span>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedRegion !== "all" && <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-md border-none">{selectedRegion}</Badge>}
                                        {selectedDepartment !== "all" && <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-md border-none">{selectedDepartment}</Badge>}
                                        {selectedCommune !== "all" && <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-md border-none">{selectedCommune}</Badge>}
                                        {activeTab !== "all" && <Badge variant="secondary" className="bg-amber-100 text-amber-700 font-bold px-3 py-1 rounded-md border-none">{activeTab === "occupied" ? "Sièges Occupés" : "Vacance de Trône"}</Badge>}
                                        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-amber-600 hover:text-amber-700 font-black uppercase text-[10px] tracking-widest">
                                            Réinitialiser
                                        </Button>
                                    </div>
                                </div>
                                
                                {territorySummary && (
                                    <div className="flex items-center gap-6 bg-slate-50 border border-slate-100 px-6 py-3 rounded-2xl w-full lg:w-auto overflow-x-auto">
                                        <div className="flex flex-col shrink-0">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Départements</span>
                                            <span className="text-lg font-black text-slate-700 leading-none">{territorySummary.departments}</span>
                                        </div>
                                        <div className="w-px h-8 bg-slate-200 shrink-0"></div>
                                        <div className="flex flex-col shrink-0">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Sous-préfectures</span>
                                            <span className="text-lg font-black text-slate-700 leading-none">{territorySummary.subPrefectures}</span>
                                        </div>
                                        <div className="w-px h-8 bg-slate-200 shrink-0"></div>
                                        <div className="flex flex-col shrink-0">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Villages Inscrits</span>
                                            <span className="text-lg font-black text-amber-600 leading-none">{territorySummary.villages}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Grid Content */}
            <div className="container mx-auto px-4 lg:px-8 py-16 print:hidden">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <Card key={i} className="rounded-xl border-none shadow-xl shadow-slate-200/50 overflow-hidden">
                                <Skeleton className="h-44 w-full" />
                                <CardContent className="p-4 space-y-4">
                                    <Skeleton className="h-6 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                    <div className="pt-4 border-t border-slate-50">
                                        <Skeleton className="h-12 w-full rounded-lg" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : filteredVillages.length > 0 ? (
                    <div className="space-y-12">
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                <AnimatePresence mode="popLayout">
                                    {paginatedVillages.map((entry) => (
                                        <motion.div
                                            key={entry.village.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.3 }}
                                            onClick={() => setQuickViewVillage({ village: entry.village, chief: entry.currentChief })}
                                            className="cursor-pointer"
                                        >
                                            <VillageCard entry={entry} />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-slate-200/50 overflow-hidden bg-white">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent border-slate-100 bg-slate-50/50">
                                            <TableHead className="w-16 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-6">ID</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Localité / Sous-Préfecture</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Région & Département</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Autorité Actuelle</TableHead>
                                            <TableHead className="w-40 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Infrastructures</TableHead>
                                            <TableHead className="w-32 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Statut</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedVillages.map((entry, idx) => (
                                            <TableRow 
                                                key={entry.village.id} 
                                                className="hover:bg-slate-50/80 transition-all border-slate-50 group cursor-pointer"
                                                onClick={() => setQuickViewVillage({ village: entry.village, chief: entry.currentChief })}
                                            >
                                                <TableCell className="text-center">
                                                    <span className="text-[10px] font-black text-slate-300">{(currentPage - 1) * itemsPerPage + idx + 1}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-slate-900 text-sm tracking-tight leading-tight">{entry.village.name}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{entry.village.subPrefecture || entry.village.commune}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-600">{entry.village.region}</span>
                                                        <span className="text-[10px] font-medium text-slate-400">{entry.village.department}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {entry.currentChief ? (
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-8 w-8 rounded-lg border border-slate-100 shadow-sm">
                                                                <AvatarImage src={entry.currentChief.photoUrl} />
                                                                <AvatarFallback className="bg-slate-100 text-slate-400 text-[10px] font-black">
                                                                    {entry.currentChief.name.substring(0, 2).toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-black text-slate-900 tracking-tight">{entry.currentChief.name}</span>
                                                                <span className="text-[9px] font-mono text-slate-400">{entry.currentChief.CNRCTRegistrationNumber}</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-slate-300 italic uppercase tracking-widest">--- Néant ---</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex justify-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                                                        <Zap className={cn("h-3.5 w-3.5", entry.village.hasElectricity ? "text-amber-500 fill-amber-500" : "text-slate-200")} />
                                                        <Droplets className={cn("h-3.5 w-3.5", entry.village.hasWater ? "text-blue-500 fill-blue-500" : "text-slate-200")} />
                                                        <School className={cn("h-3.5 w-3.5", entry.village.hasSchool ? "text-indigo-500 fill-indigo-500" : "text-slate-200")} />
                                                        <Activity className={cn("h-3.5 w-3.5", entry.village.hasHealthCenter ? "text-emerald-500 fill-emerald-500" : "text-slate-200")} />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {entry.currentChief ? (
                                                        <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none rounded-lg text-[9px] font-black uppercase tracking-widest px-3 py-1">
                                                            Occupé
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-none rounded-lg text-[9px] font-black uppercase tracking-widest px-3 py-1 animate-pulse">
                                                            Vacant
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Card>
                        )}

                        <div className="bg-white/80 backdrop-blur-xl border border-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/20">
                            <PaginationControls 
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                itemsPerPage={itemsPerPage}
                                onItemsPerPageChange={setItemsPerPage}
                                totalItems={filteredVillages.length}
                            />
                        </div>
                    </div>
                 ) : (
                    <div className="bg-white rounded-xl p-8 text-center shadow-xl shadow-slate-200/50 border border-slate-50">
                        <div className="mx-auto w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                            <SearchX className="h-12 w-12 text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Aucun village trouvé</h3>
                        <p className="text-slate-500 font-medium mb-8 max-w-sm mx-auto">
                            Désolé, nous n'avons trouvé aucune localité correspondant à vos critères de recherche.
                        </p>
                        <Button onClick={clearFilters} variant="outline" className="rounded-lg px-8 h-12 font-bold ring-offset-slate-50">
                            Effacer les filtres
                        </Button>
                    </div>
                )}

                {/* --- MAINTENANCE (Admin only) --- */}
                {(user?.role?.name === 'ADMIN' || user?.email === 'magloire078@gmail.com') && (
                    <div className="mt-8 space-y-4">
                        <div className="p-4 bg-slate-900 text-white rounded-xl font-mono text-[10px] overflow-auto max-h-60 border border-slate-700">
                            <h3 className="text-amber-500 font-black mb-2">DIAGNOSTIC DATA (ADMIN)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p>TOTAL VILLAGES: {villages.length}</p>
                                    <p>TOTAL CHIEFS: {chiefs.length}</p>
                                    <p>NON-EMPTY REGIONS: {villages.filter(v => !!v.region).length}</p>
                                    <p>NON-EMPTY DEPTS: {villages.filter(v => !!v.department).length}</p>
                                    <p>NON-EMPTY SP: {villages.filter(v => !!v.subPrefecture).length}</p>
                                    <p>NON-EMPTY NAMES: {villages.filter(v => !!v.name).length}</p>
                                </div>
                                <div>
                                    <p>SELECTED REGION: {selectedRegion}</p>
                                    {villages.length > 0 && (
                                        <div className="mt-2 border-t border-slate-700 pt-2">
                                            <p className="text-amber-400">RAW DATA SAMPLES (FIRST 10):</p>
                                            <div className="space-y-1 mt-1">
                                                {villages.slice(0, 10).map((v, i) => (
                                                    <p key={v.id} className="text-[9px] border-b border-slate-800 pb-1">
                                                        [{i}] {v.name} | R: &quot;{v.region}&quot; | D: &quot;{v.department}&quot; | SP: &quot;{v.subPrefecture}&quot; | SRC: &quot;{(v as any).source || ""}&quot;
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {showMaintenance && <DataMigrationTool />}
                    </div>
                )}
            </div>

            {quickViewVillage && (
                <VillageQuickView
                    village={quickViewVillage.village}
                    currentChief={quickViewVillage.chief}
                    open={!!quickViewVillage}
                    onOpenChange={(open) => !open && setQuickViewVillage(null)}
                />
            )}
        </div>
    </PermissionGuard>
    );
}

function VillageCard({ entry }: { entry: VillageEntry }) {
    const { village, currentChief, archivedChiefsCount } = entry;
    const score = village.developmentScore || 0;

    return (
        <Card className={cn(
            "group relative rounded-xl border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white hover:shadow-2xl transition-all duration-500 hover:-translate-y-2",
            !currentChief && "ring-2 ring-amber-500/10 shadow-amber-500/5"
        )}>
            {/* Background Pattern Header */}
            <div className="h-32 bg-slate-900 relative p-6 flex flex-col justify-end overflow-hidden">
                {!currentChief && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.1, 0.3, 0.1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-amber-500"
                    />
                )}
                <div className="absolute inset-0 opacity-20 transition-transform duration-700 group-hover:scale-110">
                    <div className="absolute inset-0 pattern-dots text-white"></div>
                </div>
                <div className="absolute top-4 right-4 h-12 w-12 bg-white/5 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:rotate-12">
                    <MapPin className="h-5 w-5 text-white" />
                </div>
                
                <h3 className="text-xl font-black text-white truncate group-hover:text-amber-400 transition-colors z-10">
                    {village.name}
                </h3>
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest truncate z-10">
                    {village.region} • {village.department}
                </p>

                {/* Hover Commune overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-amber-500 translate-y-full group-hover:translate-y-0 transition-transform duration-500 p-2 flex items-center justify-center">
                    <span className="text-white text-[10px] font-black uppercase tracking-[0.2em]">{village.subPrefecture}</span>
                </div>
            </div>

            <CardContent className="p-4 pt-8">
                <div className="relative mb-6">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 rounded-lg border-4 border-slate-50 shadow-sm group-hover:border-amber-50 ring-2 ring-transparent group-hover:ring-amber-500/20 transition-all duration-500">
                            <AvatarImage src={currentChief?.photoUrl || ""} />
                            <AvatarFallback className="bg-slate-100 text-slate-400 font-black rounded-lg">
                                {currentChief?.name?.charAt(0) || <Users className="h-6 w-6" />}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                Autorité Actuelle
                            </p>
                            {currentChief ? (
                                <>
                                    <h4 className="text-sm font-black text-slate-900 truncate leading-none mb-1 group-hover:text-amber-600 transition-colors">
                                        {currentChief.name}
                                    </h4>
                                    <Badge className="bg-green-50 text-green-700 text-[10px] font-black hover:bg-green-50 border-none px-2 rounded-sm">
                                        SIÈGE OCCUPÉ
                                    </Badge>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm font-bold text-slate-400 italic mb-1">Non renseignée</p>
                                    <Badge className="bg-amber-50 text-amber-700 text-[10px] font-black hover:bg-amber-50 border-none px-2 rounded-sm">
                                        VACANCE DU TRÔNE
                                    </Badge>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Indice de Développement Local (IDL) */}
                <div className="mb-6 space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest leading-none">
                        <span className="text-slate-400">Indice de Développement (IDL)</span>
                        <span className={cn(
                            score >= 80 ? "text-emerald-500" : 
                            score >= 50 ? "text-blue-500" : "text-amber-500"
                        )}>{score}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${score}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className={cn(
                                "h-full rounded-full",
                                score >= 80 ? "bg-emerald-500" : 
                                score >= 50 ? "bg-blue-500" : "bg-amber-500"
                            )}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-50">
                    <div className="col-span-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">Infrastructures</p>
                        <div className="flex flex-wrap gap-2">
                            <Zap className={cn("h-3.5 w-3.5", village.hasElectricity ? 'text-amber-500' : 'text-slate-200')} />
                            <Droplets className={cn("h-3.5 w-3.5", village.hasWater ? 'text-blue-500' : 'text-slate-200')} />
                            <School className={cn("h-3.5 w-3.5", village.hasSchool ? 'text-indigo-500' : 'text-slate-200')} />
                            <Activity className={cn("h-3.5 w-3.5", village.hasHealthCenter ? 'text-emerald-500' : 'text-slate-200')} />
                            <Building2 className={cn("h-3.5 w-3.5", village.hasMarket ? 'text-rose-500' : 'text-slate-200')} />
                        </div>
                    </div>
                    <div className="col-span-1 text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">Archives</p>
                        <p className="text-sm font-black text-slate-900 leading-none">{archivedChiefsCount} Prédéc.</p>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">Code INS</p>
                        <p className="text-[11px] font-bold text-slate-900 font-mono tracking-tighter">{village.codeINS || "N/A"}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">Population</p>
                        <p className="text-[11px] font-bold text-slate-900 leading-none">
                            {village.population ? `${village.population.toLocaleString()} hab.` : "N/D"}
                        </p>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-4 pt-0">
                <Button asChild className="w-full h-12 rounded-lg border-none shadow-none text-xs font-black uppercase tracking-widest group-hover:bg-slate-900 transition-all duration-500 overflow-hidden relative">
                    <Link href={`/villages/${village.id}`}>
                        <span className="relative z-10">Détails de la localité</span>
                        <ChevronRight className="relative z-10 w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-800 to-slate-900 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
