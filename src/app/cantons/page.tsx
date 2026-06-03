"use client";

import { useState, useEffect, useMemo } from "react";
import Fuse from "fuse.js";
import { 
    Search, 
    Map as MapIcon,
    ArrowLeft,
    SearchX,
    Filter,
    Crown,
    Landmark,
    Printer
} from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { subscribeToVillages } from "@/services/village-service";
import { subscribeToChiefs } from "@/services/chief-service";
import { Village } from "@/types/village";
import { Chief } from "@/types/chief";
import Link from "next/link";
import { CantonData, CantonCard } from "@/components/territory/canton-card";
import { CantonQuickView } from "@/components/territory/canton-quick-view";
import { PrintCantonsList } from "@/components/territory/print-cantons-list";
import { PaginationControls } from "@/components/common/pagination-controls";
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { normalizeString } from "@/lib/normalization-utils";

export default function CantonsPage() {
    const { user } = useAuth();
    const [villages, setVillages] = useState<Village[]>([]);
    const [chiefs, setChiefs] = useState<Chief[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRegion, setSelectedRegion] = useState<string>("all");
    const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
    const [selectedSubPrefecture, setSelectedSubPrefecture] = useState<string>("all");
    
    const [quickViewCanton, setQuickViewCanton] = useState<CantonData | null>(null);
    const [isPrinting, setIsPrinting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);

    useEffect(() => {
        let vLoaded = false;
        let cLoaded = false;

        const checkLoad = () => { if(vLoaded && cLoaded) setLoading(false); };

        setLoading(true);
        const unsubV = subscribeToVillages((data) => {
            setVillages(data);
            vLoaded = true;
            checkLoad();
        }, console.error);

        const unsubC = subscribeToChiefs((data) => {
            setChiefs(data);
            cLoaded = true;
            checkLoad();
        }, console.error);

        return () => {
            unsubV();
            unsubC();
        };
    }, []);

    // Extract regions and departments
    const { regions, departments, subPrefectures } = useMemo(() => {
        const rs = new Set<string>();
        const ds = new Set<string>();
        const sp = new Set<string>();
        villages.forEach(v => {
            if (v.region) rs.add(v.region);
            if (v.department) {
                if (selectedRegion === "all" || v.region === selectedRegion) {
                    ds.add(v.department);
                }
            }
            if (v.subPrefecture) {
                if ((selectedRegion === "all" || v.region === selectedRegion) &&
                    (selectedDepartment === "all" || v.department === selectedDepartment)) {
                    sp.add(v.subPrefecture);
                }
            }
        });
        return {
            regions: Array.from(rs).sort(),
            departments: Array.from(ds).sort(),
            subPrefectures: Array.from(sp).sort()
        };
    }, [villages, selectedRegion, selectedDepartment]);

    // Build Cantons Data
    const cantonsData = useMemo(() => {
        const cantonsMap = new Map<string, CantonData>();

        villages.forEach(v => {
            if (!v.canton) return;
            const key = normalizeString(v.canton);
            if (!key) return;

            if (!cantonsMap.has(key)) {
                cantonsMap.set(key, {
                    name: v.canton,
                    region: v.region,
                    department: v.department,
                    subPrefecture: v.subPrefecture,
                    villages: [],
                    chiefs: [],
                    cantonChief: null,
                    population: 0
                });
            }

            const cData = cantonsMap.get(key)!;
            cData.villages.push(v);
            if (v.population) cData.population += v.population;
        });

        // Add chiefs and identify canton chief
        Array.from(cantonsMap.values()).forEach(cData => {
            // Find all chiefs for these villages
            const relatedChiefs = chiefs.filter(c => 
                c.cantonName?.toLowerCase() === cData.name.toLowerCase() ||
                cData.villages.some(v => v.id === c.villageId || v.name.toLowerCase() === c.village?.toLowerCase())
            );
            cData.chiefs = relatedChiefs;

            // Identify Canton Chief
            cData.cantonChief = chiefs.find(c => 
                c.cantonName?.toLowerCase() === cData.name.toLowerCase() && 
                c.role === "Chef de canton" && 
                c.status === "actif"
            ) || null;
        });

        return Array.from(cantonsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [villages, chiefs]);

    // Filter and Search
    const filteredCantons = useMemo(() => {
        let result = cantonsData;

        if (selectedRegion !== "all") {
            result = result.filter(c => c.region === selectedRegion);
        }
        if (selectedDepartment !== "all") {
            result = result.filter(c => c.department === selectedDepartment);
        }
        if (selectedSubPrefecture !== "all") {
            result = result.filter(c => c.subPrefecture === selectedSubPrefecture);
        }

        if (searchQuery.trim()) {
            const fuse = new Fuse(result, {
                keys: ["name", "region", "department", "subPrefecture"],
                threshold: 0.3,
            });
            result = fuse.search(searchQuery).map(r => r.item);
        }

        return result;
    }, [cantonsData, searchQuery, selectedRegion, selectedDepartment, selectedSubPrefecture]);

    // Pagination
    const totalPages = Math.ceil(filteredCantons.length / itemsPerPage);
    const paginatedCantons = filteredCantons.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedRegion, selectedDepartment, selectedSubPrefecture]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4 text-blue-600">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current"></div>
                    <p className="font-bold uppercase tracking-widest text-sm">Chargement des cantons...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-8 max-w-[1600px] mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="space-y-2">
                    <Link href="/intranet" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest group">
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Retour à l'accueil
                    </Link>
                    <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner">
                            <Landmark className="h-6 w-6" />
                        </div>
                        Répertoire des Cantons
                    </h1>
                    <p className="text-slate-500 font-medium text-lg ml-16 max-w-2xl leading-relaxed">
                        Cartographie complète des cantons de la République.
                    </p>
                </div>
                <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Landmark className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="text-3xl font-black text-slate-900">{cantonsData.length}</div>
                        <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cantons Renseignés</div>
                    </div>
                </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 shadow-xl shadow-slate-200/40">
                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input 
                            placeholder="Rechercher un canton, une région..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 h-14 bg-slate-50/50 border-slate-200/60 text-lg font-bold rounded-2xl shadow-inner focus-visible:ring-blue-500"
                        />
                    </div>
                    
                    <div className="flex gap-4 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
                        <div className="w-[200px] shrink-0">
                            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                                <SelectTrigger className="h-14 bg-white border-slate-200/60 rounded-2xl font-bold shadow-sm">
                                    <SelectValue placeholder="Région" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Toutes les régions</SelectItem>
                                    {regions.map(r => (
                                        <SelectItem key={r} value={r}>{r}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-[200px] shrink-0">
                            <Select value={selectedDepartment} onValueChange={setSelectedDepartment} disabled={selectedRegion === "all"}>
                                <SelectTrigger className="h-14 bg-white border-slate-200/60 rounded-2xl font-bold shadow-sm">
                                    <SelectValue placeholder="Département" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les départements</SelectItem>
                                    {departments.map(d => (
                                        <SelectItem key={d} value={d}>{d}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-[200px] shrink-0">
                            <Select value={selectedSubPrefecture} onValueChange={setSelectedSubPrefecture} disabled={selectedDepartment === "all"}>
                                <SelectTrigger className="h-14 bg-white border-slate-200/60 rounded-2xl font-bold shadow-sm">
                                    <SelectValue placeholder="Sous-préfecture" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Toutes les ss-préfectures</SelectItem>
                                    {subPrefectures.map(sp => (
                                        <SelectItem key={sp} value={sp}>{sp}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between text-sm font-bold text-slate-500 bg-slate-100/50 py-3 px-6 rounded-2xl">
                <div>
                    <span className="text-slate-900">{filteredCantons.length}</span> cantons trouvés
                </div>
                <button
                    onClick={() => {
                        setIsPrinting(true);
                        setTimeout(() => window.print(), 500);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                >
                    <Printer className="h-4 w-4" />
                    Imprimer la Liste
                </button>
            </div>

            {filteredCantons.length === 0 ? (
                <div className="bg-white/50 border border-slate-200 border-dashed rounded-3xl p-16 text-center">
                    <div className="h-24 w-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <SearchX className="h-10 w-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">Aucun canton trouvé</h3>
                    <p className="text-slate-500 font-medium max-w-md mx-auto">
                        Il n'y a aucun canton enregistré ou correspondant à vos critères de recherche.
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {paginatedCantons.map((canton, idx) => (
                            <CantonCard 
                                key={`${canton.name}-${idx}`} 
                                canton={canton} 
                                onClick={() => setQuickViewCanton(canton)}
                            />
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="mt-12 flex justify-center pb-12">
                            <PaginationControls 
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                itemsPerPage={itemsPerPage}
                                onItemsPerPageChange={setItemsPerPage}
                                totalItems={filteredCantons.length}
                            />
                        </div>
                    )}
                </>
            )}

            <CantonQuickView 
                canton={quickViewCanton}
                open={!!quickViewCanton}
                onOpenChange={(o) => !o && setQuickViewCanton(null)}
            />

            {isPrinting && (
                <div className="fixed inset-0 z-50 bg-white">
                    <PrintCantonsList cantons={filteredCantons} />
                    <div className="fixed bottom-4 right-4 print:hidden flex gap-2">
                        <Button variant="outline" onClick={() => setIsPrinting(false)}>Fermer</Button>
                        <Button onClick={() => window.print()}>Imprimer</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
