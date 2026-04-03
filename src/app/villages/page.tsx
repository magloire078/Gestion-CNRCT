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
import { Village } from "@/types/village";
import { Chief } from "@/types/chief";
import { OrganizationSettings } from "@/types/common";
import { IVORIAN_REGIONS } from "@/constants/regions";
import { divisions } from "@/lib/ivory-coast-divisions";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AddVillageSheet } from "@/components/villages/add-village-sheet";
import { PrintVillagesList } from "@/components/villages/print-villages-list";
import { PermissionGuard } from "@/components/auth/permission-guard";

export type VillageEntry = {
    village: Village;
    currentChief: Chief | null;
    archivedChiefsCount: number;
};

type SeatStatus = "all" | "occupied" | "vacant";

export default function VillagesPage() {
    // Data State
    const [villages, setVillages] = useState<Village[]>([]);
    const [chiefs, setChiefs] = useState<Chief[]>([]);
    const [orgSettings, setOrgSettings] = useState<OrganizationSettings | null>(null);
    const [loading, setLoading] = useState(true);
    
    // UI State
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRegion, setSelectedRegion] = useState<string>("all");
    const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
    const [selectedCommune, setSelectedCommune] = useState<string>("all");
    const [seatStatus, setSeatStatus] = useState<SeatStatus>("all");
    const [printDate, setPrintDate] = useState("");
    const [isPrinting, setIsPrinting] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Fetch Data with Real-time Sync
    useEffect(() => {
        setLoading(true);
        
        // Subscription to Villages
        const unsubscribeVillages = subscribeToVillages((updatedVillages) => {
            setVillages(updatedVillages);
            if (chiefs.length > 0) setLoading(false);
        });

        // Subscription to Chiefs
        const unsubscribeChiefs = subscribeToChiefs((updatedChiefs) => {
            setChiefs(updatedChiefs);
            setLoading(false);
        }, (error) => {
            console.error("Error subscribing to chiefs:", error);
        });

        // Fetch Organization Settings
        getOrganizationSettings().then(setOrgSettings);

        return () => {
            unsubscribeVillages();
            unsubscribeChiefs();
        };
    }, []);

    useEffect(() => {
        setPrintDate(format(new Date(), "dd/MM/yyyy"));
    }, []);

    useEffect(() => {
        const handleAfterPrint = () => setIsPrinting(false);
        window.addEventListener('afterprint', handleAfterPrint);
        return () => window.removeEventListener('afterprint', handleAfterPrint);
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

    // Filtering Options logic
    const departments = useMemo(() => {
        if (selectedRegion === "all") return [];
        return Object.keys(divisions[selectedRegion] || {});
    }, [selectedRegion]);

    const communes = useMemo(() => {
        if (selectedRegion === "all" || selectedDepartment === "all") return [];
        return Object.keys(divisions[selectedRegion]?.[selectedDepartment] || {});
    }, [selectedRegion, selectedDepartment]);

    // Apply Filters
    const filteredVillages = useMemo(() => {
        return villageEntries.filter(entry => {
            const v = entry.village;
            const c = entry.currentChief;
            
            // Region Filter
            if (selectedRegion !== "all" && v.region !== selectedRegion) return false;
            
            // Department Filter
            if (selectedDepartment !== "all" && v.department !== selectedDepartment) return false;
            
            // Commune Filter
            if (selectedCommune !== "all" && v.subPrefecture !== selectedCommune && v.commune !== selectedCommune) return false;

            // Seat Status Filter
            if (seatStatus === "occupied" && !c) return false;
            if (seatStatus === "vacant" && c) return false;
            
            // Search Query
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesVillage = v.name.toLowerCase().includes(query) || 
                                     v.region.toLowerCase().includes(query) ||
                                     v.department.toLowerCase().includes(query);
                const matchesChief = c?.name?.toLowerCase().includes(query) || 
                                   c?.CNRCTRegistrationNumber?.toLowerCase().includes(query);
                
                if (!matchesVillage && !matchesChief) return false;
            }
            
            return true;
        });
    }, [villageEntries, searchQuery, selectedRegion, selectedDepartment, selectedCommune, seatStatus]);

    const printSubtitle = useMemo(() => {
        let subtitle = `Total: ${filteredVillages.length} | Date: ${printDate}`;
        if (selectedRegion !== "all") subtitle += ` | Région: ${selectedRegion}`;
        if (selectedDepartment !== "all") subtitle += ` | Dept: ${selectedDepartment}`;
        if (selectedCommune !== "all") subtitle += ` | S/P: ${selectedCommune}`;
        if (seatStatus !== "all") subtitle += ` | Statut: ${seatStatus === 'occupied' ? 'Occupés' : 'Vacants'}`;
        if (searchQuery) subtitle += ` | Recherche: ${searchQuery}`;
        return subtitle;
    }, [filteredVillages.length, printDate, selectedRegion, selectedDepartment, selectedCommune, seatStatus, searchQuery]);

    const stats = useMemo(() => {
        const total = filteredVillages.length;
        if (total === 0) return { total: 0, vacant: 0, occupied: 0, electricity: 0, water: 0, school: 0, health: 0 };
        
        return {
            total,
            vacant: filteredVillages.filter(v => !v.currentChief).length,
            occupied: filteredVillages.filter(v => v.currentChief).length,
            electricity: (filteredVillages.filter(v => v.village.hasElectricity).length / total) * 100,
            water: (filteredVillages.filter(v => v.village.hasWater).length / total) * 100,
            school: (filteredVillages.filter(v => v.village.hasSchool).length / total) * 100,
            health: (filteredVillages.filter(v => v.village.hasHealthCenter).length / total) * 100
        };
    }, [filteredVillages]);

    const clearFilters = () => {
        setSearchQuery("");
        setSelectedRegion("all");
        setSelectedDepartment("all");
        setSelectedCommune("all");
        setSeatStatus("all");
    };

    const handlePrint = () => {
        setIsPrinting(true);
    };

    return (
        <PermissionGuard permission="page:villages:view">
            <div className="min-h-screen bg-slate-50/50">
            {/* Print View Component (Only mounted during print) */}
            {isPrinting && (
                <div className="hidden print:block">
                    <PrintVillagesList 
                        villages={filteredVillages} 
                        organizationSettings={orgSettings} 
                        subtitle={printSubtitle}
                    />
                </div>
            )}

            {/* Villages Header Section */}
            <div className="relative overflow-hidden bg-slate-900 py-12 print:hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 pattern-dots-lg text-white"></div>
                </div>
                
                <div className="container relative mx-auto px-4 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                                    <MapIcon className="h-8 w-8 text-amber-500" />
                                </div>
                                <h1 className="text-4xl font-black text-white tracking-tight">
                                    Localités & Autorités
                                </h1>
                            </div>
                            <p className="text-slate-400 text-lg max-w-2xl font-medium leading-relaxed">
                                Cartographie administrative et gestion des sièges des autorités traditionnelles en Côte d'Ivoire.
                            </p>
                            
                            <div className="flex flex-wrap gap-4 mt-8">
                                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg px-6 py-3">
                                    <span className="text-3xl font-black text-white">{stats.total}</span>
                                    <span className="ml-2 text-slate-400 font-semibold uppercase tracking-wider text-xs">Localités</span>
                                </div>
                                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg px-6 py-3">
                                    <span className="text-3xl font-black text-green-400">{stats.occupied}</span>
                                    <span className="ml-2 text-slate-400 font-semibold uppercase tracking-wider text-xs">Sièges Occupés</span>
                                </div>
                                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-6 py-3">
                                    <span className="text-3xl font-black text-amber-400">{stats.vacant}</span>
                                    <span className="ml-2 text-slate-400 font-semibold uppercase tracking-wider text-xs">Vacances de Trône</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button 
                                variant="outline" 
                                className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-lg h-14 px-8 font-bold"
                                onClick={handlePrint}
                                disabled={filteredVillages.length === 0}
                            >
                                <Printer className="mr-2 h-5 w-5" />
                                Imprimer la liste
                            </Button>
                            <AddVillageSheet />
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
                    </div>
                </div>
            </div>

            {/* Filter Bar Section */}
            <div className="container mx-auto px-4 lg:px-8 -mt-10 print:hidden">
                <Card className="rounded-xl border-none shadow-2xl shadow-slate-200/50 overflow-hidden bg-white/80 backdrop-blur-xl">
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-end">
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
                                            onChange={(val) => startTransition(() => setSearchQuery(val.toString()))}
                                            className="pl-12 h-14 bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-amber-500/10 rounded-lg text-lg transition-all font-medium"
                                        />
                                </div>
                            </div>

                            {/* Region Filter */}
                            <div className="lg:col-span-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block px-1">
                                    Région
                                </label>
                                <Select value={selectedRegion} onValueChange={(val) => startTransition(() => {
                                    setSelectedRegion(val);
                                    setSelectedDepartment("all");
                                    setSelectedCommune("all");
                                })}>
                                    <SelectTrigger className="h-14 bg-slate-50 border-transparent rounded-lg font-bold">
                                        <SelectValue placeholder="Région" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg border-slate-100">
                                        <SelectItem value="all">Toutes les régions</SelectItem>
                                        {IVORIAN_REGIONS.map(region => (
                                            <SelectItem key={region} value={region}>{region}</SelectItem>
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
                                    onValueChange={(val) => startTransition(() => {
                                        setSelectedDepartment(val);
                                        setSelectedCommune("all");
                                    })}
                                    disabled={selectedRegion === "all"}
                                >
                                    <SelectTrigger className="h-14 bg-slate-50 border-transparent rounded-lg font-bold">
                                        <SelectValue placeholder="Département" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg border-slate-100">
                                        <SelectItem value="all">Tous les dép.</SelectItem>
                                        {departments.map(dept => (
                                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
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
                                    onValueChange={(val) => startTransition(() => setSelectedCommune(val))}
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

                            {/* Seat Status Filter */}
                            <div className="lg:col-span-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block px-1">
                                    Statut du trône
                                </label>
                                <Select value={seatStatus} onValueChange={(val: SeatStatus) => startTransition(() => setSeatStatus(val))}>
                                    <SelectTrigger className="h-14 bg-slate-50 border-transparent rounded-lg font-bold">
                                        <SelectValue placeholder="Filtrer" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-100">
                                        <SelectItem value="all">Tous les sièges</SelectItem>
                                        <SelectItem value="occupied" className="text-green-600 font-bold">Occupés</SelectItem>
                                        <SelectItem value="vacant" className="text-amber-600 font-bold">Vacances</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {(searchQuery || selectedRegion !== "all" || seatStatus !== "all") && (
                            <div className="flex items-center gap-4 mt-8 pt-6 border-t border-slate-100">
                                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Filtres actifs:</span>
                                <div className="flex flex-wrap gap-2">
                                    {selectedRegion !== "all" && <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-md border-none">{selectedRegion}</Badge>}
                                    {selectedDepartment !== "all" && <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-md border-none">{selectedDepartment}</Badge>}
                                    {selectedCommune !== "all" && <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-md border-none">{selectedCommune}</Badge>}
                                    {seatStatus !== "all" && <Badge variant="secondary" className="bg-amber-100 text-amber-700 font-bold px-3 py-1 rounded-md border-none">{seatStatus === "occupied" ? "Sièges Occupés" : "Vacance de Trône"}</Badge>}
                                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-amber-600 hover:text-amber-700 font-black uppercase text-[10px] tracking-widest">
                                        Réinitialiser
                                    </Button>
                                </div>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filteredVillages.map((entry) => (
                            <VillageCard key={entry.village.id} entry={entry} />
                        ))}
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
            </div>
        </div>
    </PermissionGuard>
    );
}

function VillageCard({ entry }: { entry: VillageEntry }) {
    const { village, currentChief, archivedChiefsCount } = entry;

    return (
        <Card className="group relative rounded-xl border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 hover:-translate-y-2">
            {/* Background Pattern Header */}
            <div className="h-32 bg-slate-900 relative p-6 flex flex-col justify-end overflow-hidden">
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

                <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-50">
                    <div className="col-span-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">Infrastructures</p>
                        <div className="flex gap-2.5">
                            <Zap className={`h-4 w-4 ${village.hasElectricity ? 'text-amber-500' : 'text-slate-200'}`} />
                            <Droplets className={`h-4 w-4 ${village.hasWater ? 'text-blue-500' : 'text-slate-200'}`} />
                            <School className={`h-4 w-4 ${village.hasSchool ? 'text-indigo-500' : 'text-slate-200'}`} />
                            <Activity className={`h-4 w-4 ${village.hasHealthCenter ? 'text-emerald-500' : 'text-slate-200'}`} />
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
