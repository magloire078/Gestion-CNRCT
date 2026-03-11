"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { getVillages } from "@/services/village-service";
import { getChiefs } from "@/services/chief-service";
import type { Village, Chief } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MapPin, Search, Users, Crown, Plus, ArrowRight, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// A village entry that groups chiefs from the same village
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

    // Build village entries, grouping chiefs by village (name + region + department + subPrefecture)
    // This prevents duplicates even if 2 villages share the same name in different locations.
    const villageEntries = useMemo<VillageEntry[]>(() => {
        const map = new Map<string, VillageEntry>();

        for (const c of chiefs) {
            if (!c.village) continue;
            // Use all 4 location fields as the deduplication key
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

        // Also add Firestore villages not yet represented via a chief
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

    // Derive filter options from the full list
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

    // Reset child filters when parent filter changes
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
            // Search by village name, department, region, subPrefrecture, and — importantly — chief name
            if (v.name.toLowerCase().includes(lowerSearch)) return true;
            if (v.region.toLowerCase().includes(lowerSearch)) return true;
            if (v.department.toLowerCase().includes(lowerSearch)) return true;
            if (v.subPrefecture.toLowerCase().includes(lowerSearch)) return true;
            // Allow search by chief name/info → locate the village
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
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Répertoire des Villages</h1>
                    <p className="text-muted-foreground mt-1">
                        Recherchez un village par nom, région, département, sous-préfecture ou nom de chef
                    </p>
                </div>
                <Button asChild>
                    <Link href="/chiefs/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter un Chef
                    </Link>
                </Button>
            </div>

            {/* Search + Filters */}
            <div className="flex flex-col gap-3 p-4 bg-muted/30 rounded-xl border">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher par village, chef, région, département, sous-préfecture..."
                        className="pl-10 bg-background"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <Select value={regionFilter} onValueChange={handleRegionChange}>
                        <SelectTrigger className="bg-background flex-1">
                            <SelectValue placeholder="Région" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toutes les régions</SelectItem>
                            {regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={departmentFilter} onValueChange={handleDeptChange} disabled={regionFilter === 'all' && departments.length === 0}>
                        <SelectTrigger className="bg-background flex-1">
                            <SelectValue placeholder="Département" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les départements</SelectItem>
                            {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={communeFilter} onValueChange={setCommuneFilter} disabled={communes.length === 0}>
                        <SelectTrigger className="bg-background flex-1">
                            <SelectValue placeholder="Sous-préfecture / Commune" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toutes les communes</SelectItem>
                            {communes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="shrink-0">
                            <X className="mr-1 h-3.5 w-3.5" /> Effacer
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-3">
                <Card>
                    <CardContent className="pt-4 pb-3">
                        <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary/70 shrink-0" />
                            <div>
                                <p className="text-xl font-bold">{filtered.length}</p>
                                <p className="text-xs text-muted-foreground">Villages</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-3">
                        <div className="flex items-center gap-2">
                            <Crown className="h-5 w-5 text-primary/70 shrink-0" />
                            <div>
                                <p className="text-xl font-bold">{chiefs.length}</p>
                                <p className="text-xs text-muted-foreground">Chefs</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-3">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary/70 shrink-0" />
                            <div>
                                <p className="text-xl font-bold">{regions.length}</p>
                                <p className="text-xs text-muted-foreground">Régions</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Village Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <Skeleton key={i} className="h-44 rounded-xl" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-16 gap-4">
                    <MapPin className="h-12 w-12 text-muted-foreground/40" />
                    <p className="text-muted-foreground">Aucun village trouvé pour cette recherche.</p>
                    {hasActiveFilters && (
                        <Button variant="outline" onClick={clearFilters}>Réinitialiser les filtres</Button>
                    )}
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map((v) => {
                        const currentChief = v.chiefs.find(c => !c.regencyEndDate) || v.chiefs[0];
                        return (
                            <Link
                                key={v.key}
                                href={`/villages/${encodeURIComponent(v.name)}?region=${encodeURIComponent(v.region)}&dept=${encodeURIComponent(v.department)}&commune=${encodeURIComponent(v.subPrefecture)}`}
                            >
                                <Card className="h-full hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <CardTitle className="text-base leading-tight group-hover:text-primary transition-colors">
                                                {v.name}
                                            </CardTitle>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <CardDescription className="flex items-center gap-1 text-xs">
                                            <MapPin className="h-3 w-3" />
                                            {v.region}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="flex flex-wrap gap-1">
                                            {v.department && (
                                                <Badge variant="secondary" className="text-xs">{v.department}</Badge>
                                            )}
                                            {v.subPrefecture && v.subPrefecture !== v.department && (
                                                <Badge variant="outline" className="text-xs">{v.subPrefecture}</Badge>
                                            )}
                                        </div>
                                        {currentChief && (
                                            <div className="flex items-center gap-2 pt-1">
                                                <Avatar className="h-6 w-6 shrink-0">
                                                    <AvatarImage src={currentChief.photoUrl} alt={currentChief.name} />
                                                    <AvatarFallback className="text-[10px]">{currentChief.name?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs text-muted-foreground truncate">{currentChief.name}</span>
                                            </div>
                                        )}
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Crown className="h-3 w-3" />
                                            {v.chiefs.length} chef{v.chiefs.length > 1 ? 's' : ''} répertorié{v.chiefs.length > 1 ? 's' : ''}
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
