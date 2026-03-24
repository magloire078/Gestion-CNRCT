"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { getVillages } from "@/services/village-service";
import { getChiefs } from "@/services/chief-service";
import type { Village, Chief } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
    MapPin, Search, Users, Crown, Plus, 
    ArrowRight, X, Landmark, Compass, 
    Filter, Map as MapIcon, ChevronRight,
    Building2, Shrub
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type VillageEntry = {
    key: string;
    name: string;
    region: string;
    department: string;
    subPrefecture: string;
    chiefs: Chief[];
};

export default function VillagesPage() {
    const [villages, setVillages] = useState<Village[]>([]);
    const [chiefs, setChiefs] = useState<Chief[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [regionFilter, setRegionFilter] = useState("all");
    const [departmentFilter, setDepartmentFilter] = useState("all");
    const [communeFilter, setCommuneFilter] = useState("all");

    useEffect(() => {
        Promise.all([getVillages(), getChiefs()])
            .then(([v, c]) => {
                setVillages(v);
                setChiefs(c);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const villageEntries = useMemo<VillageEntry[]>(() => {
        const map = new Map<string, VillageEntry>();

        for (const c of chiefs) {
            if (!c.village) continue;
            const key = [c.village, c.region || '', c.department || '', c.subPrefecture || '']
                .join('||')
                .toLowerCase();
            if (!map.has(key)) {
                map.set(key, {
                    key,
                    name: c.village,
                    region: c.region || '',
                    department: c.department || '',
                    subPrefecture: c.subPrefecture || '',
                    chiefs: [],
                });
            }
            map.get(key)!.chiefs.push(c);
        }

        for (const v of villages) {
            const key = [v.name, v.region || '', v.department || '', v.subPrefecture || '']
                .join('||')
                .toLowerCase();
            if (!map.has(key)) {
                map.set(key, {
                    key,
                    name: v.name,
                    region: v.region || '',
                    department: v.department || '',
                    subPrefecture: v.subPrefecture || '',
                    chiefs: [],
                });
            }
        }

        return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
    }, [chiefs, villages]);

    const regions = useMemo(() => [...new Set(villageEntries.map(v => v.region).filter(Boolean))].sort(), [villageEntries]);
    const departments = useMemo(() => {
        const base = regionFilter !== 'all' ? villageEntries.filter(v => v.region === regionFilter) : villageEntries;
        return [...new Set(base.map(v => v.department).filter(Boolean))].sort();
    }, [villageEntries, regionFilter]);
    const communes = useMemo(() => {
        let base = villageEntries;
        if (regionFilter !== 'all') base = base.filter(v => v.region === regionFilter);
        if (departmentFilter !== 'all') base = base.filter(v => v.department === departmentFilter);
        return [...new Set(base.map(v => v.subPrefecture).filter(Boolean))].sort();
    }, [villageEntries, regionFilter, departmentFilter]);

    const handleRegionChange = (v: string) => { setRegionFilter(v); setDepartmentFilter('all'); setCommuneFilter('all'); };
    const handleDeptChange = (v: string) => { setDepartmentFilter(v); setCommuneFilter('all'); };
    const hasActiveFilters = regionFilter !== 'all' || departmentFilter !== 'all' || communeFilter !== 'all' || search;

    const filtered = useMemo(() => {
        const lowerSearch = search.toLowerCase();
        return villageEntries.filter(v => {
            if (regionFilter !== 'all' && v.region !== regionFilter) return false;
            if (departmentFilter !== 'all' && v.department !== departmentFilter) return false;
            if (communeFilter !== 'all' && v.subPrefecture !== communeFilter) return false;
            if (!lowerSearch) return true;
            if (v.name.toLowerCase().includes(lowerSearch)) return true;
            if (v.region.toLowerCase().includes(lowerSearch)) return true;
            if (v.department.toLowerCase().includes(lowerSearch)) return true;
            if (v.subPrefecture.toLowerCase().includes(lowerSearch)) return true;
            if (v.chiefs.some(c =>
                c.name?.toLowerCase().includes(lowerSearch) ||
                c.firstName?.toLowerCase().includes(lowerSearch) ||
                c.lastName?.toLowerCase().includes(lowerSearch) ||
                c.contact?.toLowerCase().includes(lowerSearch)
            )) return true;
            return false;
        });
    }, [villageEntries, search, regionFilter, departmentFilter, communeFilter]);

    const clearFilters = () => { setSearch(''); setRegionFilter('all'); setDepartmentFilter('all'); setCommuneFilter('all'); };

    return (
        <div className="flex flex-col gap-8 pb-20">
            {/* Header with Background Pattern */}
            <div className="relative p-8 md:p-12 rounded-[2.5rem] bg-slate-900 overflow-hidden group shadow-2xl shadow-slate-200">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
                <div className="absolute -bottom-24 -right-24 h-64 w-64 bg-slate-800 rounded-full blur-3xl opacity-50 transition-all group-hover:scale-110" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 mb-4">
                            <Compass className="h-3.5 w-3.5 text-slate-400 animate-spin-slow" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Géo-Administration Territoriale</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">Archives des Villages</h1>
                        <p className="text-slate-400 text-base md:text-lg font-medium leading-relaxed">
                            Accédez aux données structurelles de nos localités. Gestion centralisée des chefferies et des divisions administratives.
                        </p>
                    </div>
                    <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-slate-100 rounded-2xl h-14 px-8 font-bold shadow-2xl shadow-black/20 shrink-0">
                        <Link href="/chiefs/new">
                            <Plus className="mr-2 h-5 w-5" />
                            Nouveau Chef
                        </Link>
                    </Button>
                </div>

                {/* Quick Stats Overlay */}
                <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 bg-white/5 backdrop-blur-md p-4 rounded-3xl border border-white/10">
                    <div className="flex flex-col p-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Localités</span>
                        <span className="text-2xl font-black text-white">{filtered.length}</span>
                    </div>
                    <div className="flex flex-col p-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Autorités</span>
                        <span className="text-2xl font-black text-white">{chiefs.length}</span>
                    </div>
                    <div className="flex flex-col p-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Régions</span>
                        <span className="text-2xl font-black text-white">{regions.length}</span>
                    </div>
                    <div className="flex flex-col p-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Couverture</span>
                        <span className="text-2xl font-black text-white">100%</span>
                    </div>
                </div>
            </div>

            {/* Advanced Filters Bar */}
            <div className="flex flex-col lg:flex-row gap-4 p-6 bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-50 sticky top-4 z-30">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                    <Input
                        placeholder="Rechercher une localité, un chef, une subdivision..."
                        className="pl-12 h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white text-base shadow-inner transition-all"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <Select value={regionFilter} onValueChange={handleRegionChange}>
                        <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 w-full sm:w-[200px] font-bold text-slate-600">
                             <div className="flex items-center gap-2">
                                <MapIcon className="h-4 w-4 text-slate-400" />
                                <SelectValue placeholder="Région" />
                             </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl shadow-2xl border-slate-100">
                            <SelectItem value="all" className="font-bold">Toutes les régions</SelectItem>
                            {regions.map(r => <SelectItem key={r} value={r} className="rounded-lg">{r}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    
                    <Select value={departmentFilter} onValueChange={handleDeptChange} disabled={regionFilter === 'all' && departments.length === 0}>
                        <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 w-full sm:w-[200px] font-bold text-slate-600">
                             <div className="flex items-center gap-2">
                                <Landmark className="h-4 w-4 text-slate-400" />
                                <SelectValue placeholder="Département" />
                             </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl shadow-2xl border-slate-100">
                            <SelectItem value="all" className="font-bold">Tous les départements</SelectItem>
                            {departments.map(d => <SelectItem key={d} value={d} className="rounded-lg">{d}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    {hasActiveFilters && (
                        <Button variant="ghost" size="icon" onClick={clearFilters} className="h-14 w-14 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-colors shrink-0">
                            <X className="h-6 w-6" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Village Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="h-[320px] rounded-[2rem] bg-slate-100 animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 rounded-[3rem] bg-slate-50 border-2 border-dashed border-slate-200 gap-6">
                    <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center shadow-xl">
                        <MapPin className="h-12 w-12 text-slate-200" />
                    </div>
                    <div className="text-center space-y-2">
                        <p className="text-xl font-black text-slate-800 uppercase tracking-tighter">Territoire inconnu</p>
                        <p className="text-sm text-slate-400 max-w-xs font-medium italic">Aucun village ne correspond à vos critères de recherche actuels.</p>
                    </div>
                    <Button variant="outline" onClick={clearFilters} className="rounded-xl font-bold h-11 px-8">Réinitialiser l'exploration</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filtered.map((v) => {
                        const currentChief = v.chiefs.find(c => !c.regencyEndDate) || v.chiefs[0];
                        return (
                            <Link
                                key={v.key}
                                href={`/villages/${encodeURIComponent(v.name)}?region=${encodeURIComponent(v.region)}&dept=${encodeURIComponent(v.department)}&commune=${encodeURIComponent(v.subPrefecture)}`}
                                className="group"
                            >
                                <Card className="h-full border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden hover:shadow-2xl hover:shadow-slate-300 transition-all duration-500 flex flex-col relative group">
                                    {/* Card Header Illustration */}
                                    <div className="h-28 bg-slate-50 relative overflow-hidden flex items-center justify-center p-4">
                                        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-white opacity-50" />
                                        <div className="absolute top-4 right-4 opacity-5 transition-transform group-hover:scale-150 duration-700">
                                            <Building2 className="h-20 w-20" />
                                        </div>
                                        <div className="relative flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-2xl bg-white shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <Shrub className="h-6 w-6 text-slate-900" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Territoire</span>
                                                <span className="text-sm font-black text-slate-900 truncate max-w-[140px]">{v.name}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <CardHeader className="px-6 pt-6 pb-2">
                                        <div className="flex items-center gap-2 mb-2">
                                             <Badge className="bg-slate-900 border-none text-[9px] font-black uppercase tracking-[0.1em] h-5">{v.region}</Badge>
                                             <Badge variant="outline" className="text-[9px] font-black uppercase tracking-[0.1em] h-5 border-slate-200">{v.department}</Badge>
                                        </div>
                                        <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MapPin className="h-3 w-3" /> {v.subPrefecture || "Sans commune"}
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="px-6 pt-4 flex-grow space-y-6">
                                        {currentChief ? (
                                            <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50/80 border border-slate-50 group-hover:bg-white group-hover:border-slate-100 transition-all shadow-sm group-hover:shadow-md">
                                                <Avatar className="h-12 w-12 border-2 border-white shadow-sm shrink-0">
                                                    <AvatarImage src={currentChief.photoUrl} alt={currentChief.name} />
                                                    <AvatarFallback className="bg-slate-200 text-slate-500 font-black">{currentChief.lastName?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Autorité Actuelle</span>
                                                    <span className="text-xs font-bold text-slate-700 truncate">{currentChief.name}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-[66px] rounded-2xl bg-slate-50 border border-slate-200 border-dashed flex items-center justify-center p-4">
                                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Vacance du Trône</span>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between pt-2">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shadow-inner">
                                                    <Crown className="h-4 w-4 text-slate-400" />
                                                </div>
                                                <div className="flex flex-col leading-none">
                                                    <span className="text-[14px] font-black text-slate-900">{v.chiefs.length}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Archivés</span>
                                                </div>
                                            </div>
                                            <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 group-hover:rotate-[-45deg] transition-all duration-500">
                                                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-white" />
                                            </div>
                                        </div>
                                    </CardContent>
                                    <div className="h-1 bg-slate-900 w-0 group-hover:w-full transition-all duration-700 mt-auto" />
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
