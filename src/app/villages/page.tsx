"use client";
import { useState, useEffect, useMemo, useTransition, forwardRef } from "react";
import Fuse from "fuse.js";
import { TableVirtuoso, VirtuosoGrid } from "react-virtuoso";
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
    Activity,
    ShieldCheck,
    Edit2,
    Trash2
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
import { subscribeToVillages, deleteVillage } from "@/services/village-service";
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
import { LinkChiefVillageSheet } from "@/components/common/link-chief-village-sheet";
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

    // Link sheet state
    const [linkSheetEntry, setLinkSheetEntry] = useState<VillageEntry | null>(null);

    const handleDeleteVillage = async (village: Village) => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer la localité de ${village.name} ? Cette action est irréversible.`)) {
            try {
                await deleteVillage(village.id);
            } catch (error: any) {
                console.error("Erreur lors de la suppression:", error);
                alert(error.message || "Erreur lors de la suppression du village.");
            }
        }
    };

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
            const villageChiefs = chiefs.filter(c => {
                if (c.villageId === village.id) return true;
                if (!c.villageId && c.village) {
                    const cVillageNorm = c.village.toLowerCase().trim();
                    const vNameNorm = village.name.toLowerCase().trim();
                    const cDeptNorm = (c.department || '').toLowerCase().trim();
                    const vDeptNorm = (village.department || '').toLowerCase().trim();
                    return cVillageNorm === vNameNorm && cDeptNorm === vDeptNorm;
                }
                return false;
            });
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

    // Fuse Instance for fuzzy searching
    const fuseInstance = useMemo(() => {
        return new Fuse(villageEntries, {
            keys: [
                { name: 'village.name', weight: 2 },
                { name: 'village.region', weight: 1 },
                { name: 'village.department', weight: 1 },
                { name: 'currentChief.name', weight: 1.5 },
                { name: 'currentChief.CNRCTRegistrationNumber', weight: 1 }
            ],
            threshold: 0.3,
            ignoreLocation: true
        });
    }, [villageEntries]);

    // Apply Filters
    const filteredVillages = useMemo(() => {
        let baseEntries = villageEntries;

        // 1. Search Filter (Fuzzy)
        if (searchQuery.trim() !== '') {
            const results = fuseInstance.search(searchQuery);
            baseEntries = results.map(result => result.item);
        }

        return baseEntries.filter(entry => {
            const v = entry.village;
            const c = entry.currentChief;

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
            <div className="flex flex-col gap-4 pb-10 h-full min-h-screen">
                {/* Dynamic Hero Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                            Localités & Infrastructures
                            <Badge className="bg-amber-500/10 text-amber-600 border-none px-3 py-1 text-sm md:text-xs font-black uppercase tracking-widest hidden sm:flex">RÉPERTOIRE</Badge>
                        </h1>
                        <p className="text-muted-foreground mt-2 font-medium">Répertoire officiel des villages et suivi de l'occupation des chaises.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                        <Button 
                            variant="outline" 
                            className="w-full sm:w-auto rounded-lg h-10 shadow-sm border-slate-200 font-bold"
                            onClick={handlePrint}
                            disabled={filteredVillages.length === 0 || !settings}
                        >
                            <Download className="mr-2 h-4 w-4 text-slate-400" />
                            Exporter
                        </Button>
                        <div className="w-full sm:w-auto">
                            <AddVillageSheet />
                        </div>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-xl overflow-hidden group hover:scale-[1.02] transition-all">
                        <CardContent className="p-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                                <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
                                    <Building2 className="h-4 w-4 text-white" />
                                </div>
                                <Badge variant="secondary" className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-none font-bold text-[9px]">CNRCT</Badge>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{stats.total}</h3>
                            <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5 line-clamp-1">Répertoire</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-xl overflow-hidden group hover:scale-[1.02] transition-all">
                        <CardContent className="p-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                                <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                                    <MapIcon className="h-4 w-4 text-amber-600" />
                                </div>
                                <Badge variant="secondary" className="bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-none font-bold text-[9px]">Territoire</Badge>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{territorySummary?.departments || Object.keys(filterStats.departments).length}</h3>
                            <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5 line-clamp-1">Départements</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-xl overflow-hidden group hover:scale-[1.02] transition-all">
                        <CardContent className="p-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                                    <Users className="h-4 w-4 text-emerald-600" />
                                </div>
                                <Badge variant="secondary" className="bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-none font-bold text-[9px]">Chefferies</Badge>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{stats.occupied}</h3>
                            <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5 line-clamp-1">Occupés</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-xl overflow-hidden group hover:scale-[1.02] transition-all">
                        <CardContent className="p-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                                <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                                    <ShieldCheck className="h-4 w-4 text-indigo-600" />
                                </div>
                                <Badge variant="secondary" className="bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border-none font-bold text-[9px]">Gouvernance</Badge>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{stats.total > 0 ? ((stats.occupied / stats.total) * 100).toFixed(0) : 0}%</h3>
                            <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5 line-clamp-1">Conformité</p>
                        </CardContent>
                    </Card>
                </div>

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

                <Card className="border-none shadow-2xl shadow-slate-200/50 dark:shadow-none rounded-2xl overflow-hidden flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900/50">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 p-4 sm:p-5 shrink-0">
                        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 w-full">
                            <div className="flex flex-col lg:flex-row flex-wrap items-center gap-4 w-full justify-start">
                                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start print:hidden">
                                    <Select value={selectedRegion} onValueChange={(val) => {
                                        setSelectedRegion(val);
                                        setSelectedDepartment("all");
                                        setSelectedCommune("all");
                                    }}>
                                        <SelectTrigger className="w-full sm:w-auto min-w-[140px] h-10 rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                                            <SelectValue placeholder="Région" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-lg border-slate-100">
                                            <SelectItem value="all">Toutes Régions</SelectItem>
                                            {Object.keys(divisions).sort().map(region => (
                                                <SelectItem key={region} value={region}>
                                                    {region} {filterStats.regions[region] ? `(${filterStats.regions[region]})` : ""}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select 
                                        value={selectedDepartment} 
                                        onValueChange={(val) => {
                                            setSelectedDepartment(val);
                                            setSelectedCommune("all");
                                        }}
                                        disabled={selectedRegion === "all"}
                                    >
                                        <SelectTrigger className="w-full sm:w-auto min-w-[140px] h-10 rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                                            <SelectValue placeholder="Département" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-lg border-slate-100">
                                            <SelectItem value="all">Tous Départements</SelectItem>
                                            {departments.map(dept => (
                                                <SelectItem key={dept} value={dept}>
                                                    {dept} {filterStats.departments[dept] ? `(${filterStats.departments[dept]})` : ""}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select 
                                        value={selectedCommune} 
                                        onValueChange={setSelectedCommune}
                                        disabled={selectedDepartment === "all"}
                                    >
                                        <SelectTrigger className="w-full sm:w-auto min-w-[140px] h-10 rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                                            <SelectValue placeholder="S-Préf." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-lg border-slate-100">
                                            <SelectItem value="all">Toutes S-Préf.</SelectItem>
                                            {communes.map(comm => (
                                                <SelectItem key={comm} value={comm}>{comm}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select value={activeTab} onValueChange={setActiveTab}>
                                        <SelectTrigger className="w-full sm:w-auto min-w-[140px] h-10 rounded-lg bg-amber-50 border-amber-200 text-amber-900 font-medium">
                                            <SelectValue placeholder="Statut du Siège" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-lg">
                                            <SelectItem value="all">Tous Statuts</SelectItem>
                                            <SelectItem value="occupied">Sièges Occupés</SelectItem>
                                            <SelectItem value="vacant">Sièges Vacants</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto lg:ml-auto">
                                    <div className="relative group flex-grow lg:w-[280px]">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                                        <Input
                                            placeholder="Localité, Chef..."
                                            className="pl-11 h-10 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-inner focus:ring-slate-900 w-full"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center justify-center p-1 bg-white dark:bg-slate-800 rounded-lg shadow-inner border border-slate-100 dark:border-slate-700 shrink-0 w-full sm:w-auto">
                                        <Button 
                                            variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                                            size="icon" 
                                            className={cn("h-9 w-9 rounded-lg transition-all", viewMode === 'grid' ? "bg-slate-900 shadow-md text-white" : "text-slate-400 hover:text-slate-900")}
                                            onClick={() => setViewMode('grid')}
                                            title="Vue Grille"
                                        >
                                            <LayoutGrid className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            variant={viewMode === 'list' ? 'default' : 'ghost'} 
                                            size="icon" 
                                            className={cn("h-9 w-9 rounded-lg transition-all", viewMode === 'list' ? "bg-slate-900 shadow-md text-white" : "text-slate-400 hover:text-slate-900")}
                                            onClick={() => setViewMode('list')}
                                            title="Vue Tableau"
                                        >
                                            <List className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions & Mini-Stats Row */}
                        <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-slate-100">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-lg text-amber-700 text-xs font-bold shadow-sm">
                                    <Zap className="h-3.5 w-3.5" /> Élec: {stats.electricity.toFixed(0)}%
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg text-blue-700 text-xs font-bold shadow-sm">
                                    <Droplets className="h-3.5 w-3.5" /> Eau: {stats.water.toFixed(0)}%
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 rounded-lg text-indigo-700 text-xs font-bold shadow-sm">
                                    <School className="h-3.5 w-3.5" /> École: {stats.school.toFixed(0)}%
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg text-emerald-700 text-xs font-bold shadow-sm">
                                    <Activity className="h-3.5 w-3.5" /> Santé: {stats.health.toFixed(0)}%
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-5 flex-1 min-h-0 relative">
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 h-full overflow-hidden">
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                    <Card key={i} className="rounded-xl border-none shadow-xl shadow-slate-200/50 overflow-hidden">
                                        <Skeleton className="h-44 w-full" />
                                        <CardContent className="p-4 space-y-4">
                                            <Skeleton className="h-6 w-3/4" />
                                            <Skeleton className="h-4 w-1/2" />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : filteredVillages.length > 0 ? (
                            viewMode === 'grid' ? (
                                <VirtuosoGrid
                                    useWindowScroll
                                    data={filteredVillages}
                                    listClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                                    itemContent={(index, entry) => (
                                        <div 
                                            key={entry.village.id}
                                            onClick={() => setQuickViewVillage({ village: entry.village, chief: entry.currentChief })}
                                            className="cursor-pointer h-full"
                                        >
                                            <VillageCard
                                                entry={entry}
                                                onLink={(e) => { e.stopPropagation(); setLinkSheetEntry(entry); }}
                                                onDelete={(e) => { e.stopPropagation(); handleDeleteVillage(entry.village); }}
                                            />
                                        </div>
                                    )}
                                />
                            ) : (
                                <div className="rounded-xl border border-slate-100 shadow-inner overflow-hidden bg-white h-full">
                                    <TableVirtuoso
                                        useWindowScroll
                                        data={filteredVillages}
                                        components={{
                                            Table: ({ style, ...props }) => <table {...props} style={{ ...style, width: "100%", borderCollapse: "collapse" }} className="w-full caption-bottom text-base md:text-sm" />,
                                            TableHead: forwardRef((props, ref) => <thead {...props} ref={ref as any} className="[&_tr]:border-b bg-slate-50/50" />),
                                            TableRow: (props) => <tr {...props} className="group hover:bg-slate-50/50 border-slate-50 transition-colors border-b cursor-pointer" />,
                                            TableBody: forwardRef((props, ref) => <tbody {...props} ref={ref as any} className="[&_tr:last-child]:border-0" />),
                                        }}
                                        fixedHeaderContent={() => (
                                            <tr className="border-slate-100 hover:bg-transparent">
                                                <th className="h-12 px-4 align-middle text-center text-base md:text-sm font-black uppercase tracking-widest text-slate-400 w-12">#</th>
                                                <th className="h-12 px-4 align-middle text-left text-base md:text-sm font-black uppercase tracking-widest text-slate-400">Localité / S-Préf.</th>
                                                <th className="h-12 px-4 align-middle text-left text-base md:text-sm font-black uppercase tracking-widest text-slate-400">Région & Dépt</th>
                                                <th className="h-12 px-4 align-middle text-left text-base md:text-sm font-black uppercase tracking-widest text-slate-400">Autorité Actuelle</th>
                                                <th className="h-12 px-4 align-middle text-center text-base md:text-sm font-black uppercase tracking-widest text-slate-400">Infrastructures</th>
                                                <th className="h-12 px-4 align-middle text-center text-base md:text-sm font-black uppercase tracking-widest text-slate-400 w-32">Statut</th>
                                            </tr>
                                        )}
                                        itemContent={(index, entry) => (
                                            <>
                                                <td className="p-4 align-middle text-center font-mono text-base md:text-sm text-slate-300" onClick={() => setQuickViewVillage({ village: entry.village, chief: entry.currentChief })}>{index + 1}</td>
                                                <td className="p-4 align-middle" onClick={() => setQuickViewVillage({ village: entry.village, chief: entry.currentChief })}>
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-slate-900 dark:text-white text-sm tracking-tight leading-tight">{entry.village.name}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{entry.village.subPrefecture || entry.village.commune}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 align-middle" onClick={() => setQuickViewVillage({ village: entry.village, chief: entry.currentChief })}>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-600">{entry.village.region}</span>
                                                        <span className="text-[10px] font-medium text-slate-400">{entry.village.department}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 align-middle" onClick={() => setQuickViewVillage({ village: entry.village, chief: entry.currentChief })}>
                                                    {entry.currentChief ? (
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-8 w-8 rounded-lg border border-slate-100 shadow-sm">
                                                                <AvatarImage src={entry.currentChief.photoUrl} />
                                                                <AvatarFallback className="bg-slate-100 text-slate-400 text-[10px] font-black">
                                                                    {entry.currentChief.name.substring(0, 2).toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{entry.currentChief.name}</span>
                                                                <span className="text-[10px] text-slate-400 font-mono">{entry.currentChief.CNRCTRegistrationNumber || "En attente"}</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-slate-400">
                                                            <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-100 border-dashed flex items-center justify-center">
                                                                <Users className="h-3.5 w-3.5 opacity-50" />
                                                            </div>
                                                            <span className="text-[10px] font-bold uppercase tracking-widest italic">Trône Vacant</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4 align-middle text-center" onClick={() => setQuickViewVillage({ village: entry.village, chief: entry.currentChief })}>
                                                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                                        {entry.village.hasElectricity && <Badge variant="secondary" className="bg-amber-50 text-amber-600 border-amber-200 px-1.5 py-0">Élec</Badge>}
                                                        {entry.village.hasWater && <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-200 px-1.5 py-0">Eau</Badge>}
                                                        {entry.village.hasSchool && <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border-indigo-200 px-1.5 py-0">École</Badge>}
                                                        {entry.village.hasHealthCenter && <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-emerald-200 px-1.5 py-0">Santé</Badge>}
                                                    </div>
                                                </td>
                                                <td className="p-4 align-middle text-center" onClick={() => setQuickViewVillage({ village: entry.village, chief: entry.currentChief })}>
                                                    {entry.currentChief ? (
                                                        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-widest px-3">Occupé</Badge>
                                                    ) : (
                                                        <Badge variant="destructive" className="font-bold text-[10px] uppercase tracking-widest px-3">Vacant</Badge>
                                                    )}
                                                </td>
                                            </>
                                        )}
                                    />
                                </div>
                            )
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                                <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                                    <SearchX className="h-10 w-10 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-2">Aucun village trouvé</h3>
                                <p className="text-sm text-slate-500 max-w-sm mb-6">
                                    Modifiez vos critères de recherche ou réinitialisez les filtres pour voir plus de résultats.
                                </p>
                                <Button onClick={clearFilters} variant="outline" className="border-slate-200 font-bold">
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Réinitialiser les filtres
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* --- MAINTENANCE (Admin only) --- */}
            {(user?.role?.name === 'ADMIN' || user?.email === 'magloire078@gmail.com') && (
                <div className="mt-4 space-y-4 px-4 lg:px-5 pb-5">

                    {showMaintenance && <DataMigrationTool />}
                </div>
            )}

            {quickViewVillage && (
                <VillageQuickView
                    village={quickViewVillage.village}
                    currentChief={quickViewVillage.chief}
                    open={!!quickViewVillage}
                    onOpenChange={(open) => !open && setQuickViewVillage(null)}
                />
            )}

            {/* Link Chief ↔ Village Sheet */}
            {linkSheetEntry && (
                <LinkChiefVillageSheet
                    mode="from-village"
                    village={linkSheetEntry.village}
                    currentChief={linkSheetEntry.currentChief}
                    isOpen={!!linkSheetEntry}
                    onCloseAction={() => setLinkSheetEntry(null)}
                    onLinkedAction={() => setLinkSheetEntry(null)}
                />
            )}
        </PermissionGuard>
    );
}


function VillageCard({ entry, onLink, onDelete }: { entry: VillageEntry; onLink?: (e: React.MouseEvent) => void; onDelete?: (e: React.MouseEvent) => void }) {
    const { village, currentChief, archivedChiefsCount } = entry;
    const score = village.developmentScore || 0;

    return (
        <Card className={cn(
            "group relative rounded-xl border-none shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden bg-white dark:bg-slate-800 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1",
            !currentChief && "ring-1 ring-amber-500/10 shadow-amber-500/5"
        )}>
            {/* Background Pattern Header */}
            <div className="h-24 bg-slate-900 relative p-4 flex flex-col justify-end overflow-hidden">
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
                <div className="absolute top-2 right-2 h-8 w-8 bg-white/5 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:rotate-12">
                    <MapPin className="h-4 w-4 text-white" />
                </div>
                
                <h3 className="text-lg font-black text-white truncate group-hover:text-amber-400 transition-colors z-10">
                    {village.name}
                </h3>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest truncate z-10">
                    {village.region} • {village.department}
                </p>

                {/* Hover Commune overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-amber-500 translate-y-full group-hover:translate-y-0 transition-transform duration-500 p-1 flex items-center justify-center">
                    <span className="text-white text-[9px] font-black uppercase tracking-[0.2em]">{village.subPrefecture}</span>
                </div>
            </div>

            <CardContent className="p-3 pt-5">
                <div className="relative mb-4">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 rounded-lg border-2 border-slate-50 dark:border-slate-700 shadow-sm group-hover:border-amber-50 ring-2 ring-transparent group-hover:ring-amber-500/20 transition-all duration-500">
                            <AvatarImage src={currentChief?.photoUrl || ""} />
                            <AvatarFallback className="bg-slate-100 dark:bg-slate-700 text-slate-400 font-black rounded-lg text-xs">
                                {currentChief?.name?.charAt(0) || <Users className="h-4 w-4" />}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                                Autorité Actuelle
                            </p>
                            {currentChief ? (
                                <>
                                    <h4 className="text-xs font-black text-slate-900 dark:text-white truncate leading-none mb-1 group-hover:text-amber-600 transition-colors">
                                        {currentChief.name}
                                    </h4>
                                    <Badge className="bg-green-50 text-green-700 text-[9px] font-black hover:bg-green-50 border-none px-1.5 py-0 rounded-sm">
                                        OCCUPÉ
                                    </Badge>
                                </>
                            ) : (
                                <>
                                    <p className="text-xs font-bold text-slate-400 italic mb-1">Non renseignée</p>
                                    <Badge className="bg-amber-50 text-amber-700 text-[9px] font-black hover:bg-amber-50 border-none px-1.5 py-0 rounded-sm">
                                        VACANT
                                    </Badge>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Indice de Développement Local (IDL) */}
                <div className="mb-4 space-y-1.5">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest leading-none">
                        <span className="text-slate-400">Indice (IDL)</span>
                        <span className={cn(
                            score >= 80 ? "text-emerald-500" : 
                            score >= 50 ? "text-blue-500" : "text-amber-500"
                        )}>{score}%</span>
                    </div>
                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
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

                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-50 dark:border-slate-700">
                    <div className="col-span-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">Infrastructures</p>
                        <div className="flex flex-wrap gap-1.5">
                            <Zap className={cn("h-3 w-3", village.hasElectricity ? 'text-amber-500' : 'text-slate-200')} />
                            <Droplets className={cn("h-3 w-3", village.hasWater ? 'text-blue-500' : 'text-slate-200')} />
                            <School className={cn("h-3 w-3", village.hasSchool ? 'text-indigo-500' : 'text-slate-200')} />
                            <Activity className={cn("h-3 w-3", village.hasHealthCenter ? 'text-emerald-500' : 'text-slate-200')} />
                            <Building2 className={cn("h-3 w-3", village.hasMarket ? 'text-rose-500' : 'text-slate-200')} />
                        </div>
                    </div>
                    <div className="col-span-1 text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">Archives</p>
                        <p className="text-xs font-black text-slate-900 leading-none">{archivedChiefsCount} Prédéc.</p>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-3 pt-0 flex gap-2">
                <Button asChild className="flex-1 h-9 rounded-md border-none shadow-none text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 hover:text-white group-hover:bg-slate-900 transition-all duration-500 overflow-hidden relative">
                    <Link href={`/villages/${village.id}`}>
                        <span className="relative z-10">Détails</span>
                        <ChevronRight className="relative z-10 w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-800 to-slate-900 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                    </Link>
                </Button>
                <PermissionGuard permission="page:villages:edit">
                    <Button
                        variant="outline"
                        size="icon"
                        title={currentChief ? "Changer de chef" : "Affecter un chef"}
                        className="h-9 w-9 rounded-md border-slate-200 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors shrink-0"
                        onClick={onLink}
                    >
                        <Edit2 className="h-4 w-4" />
                    </Button>
                </PermissionGuard>
                <PermissionGuard permission="page:villages:delete">
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-md border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0" onClick={onDelete}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </PermissionGuard>
            </CardFooter>
        </Card>
    );
}
