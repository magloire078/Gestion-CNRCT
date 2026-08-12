"use client";

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
    Search, MapPin, ChevronRight, 
    Newspaper, Globe, Focus,
    Filter, ArrowLeft, Eye,
    AlertTriangle, CheckCircle2,
    Pickaxe, Scale, Crown
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { subscribeToPressConflicts } from '@/services/press-conflict-service';
import type { PressConflict } from '@/types/press-conflict';
import { 
    PRESS_CONFLICT_TYPES, 
    PRESS_CONFLICT_STATUSES 
} from '@/types/press-conflict';
import { IVORIAN_REGIONS } from '@/constants/regions';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { PressConflictDetailSheet } from '@/components/press-conflicts/press-conflict-detail-sheet';
import { EditPressConflictSheet } from '@/components/press-conflicts/edit-press-conflict-sheet';
import { updatePressConflict } from '@/services/press-conflict-service';
import { useToast } from '@/hooks/use-toast';

// Dynamically import the press GIS map
const PressConflictGISMap = dynamic(
    () => import('@/components/press-conflicts/press-conflict-gis-map').then(m => m.PressConflictGISMap),
    {
        ssr: false,
        loading: () => (
            <div className="h-full w-full bg-slate-50 flex flex-col items-center justify-center gap-4">
                <div className="h-12 w-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Initialisation SIG Veille Presse...</p>
            </div>
        ),
    }
);

export default function PressConflictsMappingPage() {
    const [conflicts, setConflicts] = useState<PressConflict[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRegion, setSelectedRegion] = useState<string>('Tous');
    const [selectedType, setSelectedType] = useState<string>('Tous');
    const [selectedStatus, setSelectedStatus] = useState<string>('Tous');

    const [selectedConflictId, setSelectedConflictId] = useState<string | null>(null);
    const [detailConflict, setDetailConflict] = useState<PressConflict | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [editingConflict, setEditingConflict] = useState<PressConflict | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = subscribeToPressConflicts(
            (data) => {
                setConflicts(data);
                setLoading(false);
            },
            (error) => {
                console.error("Failed to load press conflicts for map:", error);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, []);

    // Filtered list for sidebar
    const filteredConflicts = useMemo(() => {
        return conflicts.filter((c) => {
            const matchesSearch =
                searchTerm === '' ||
                c.locality?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.source?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.region?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.description?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesRegion =
                selectedRegion === 'Tous' || c.region?.includes(selectedRegion);

            const matchesType =
                selectedType === 'Tous' || c.conflictType === selectedType;

            const matchesStatus =
                selectedStatus === 'Tous' || c.status === selectedStatus;

            return matchesSearch && matchesRegion && matchesType && matchesStatus;
        });
    }, [conflicts, searchTerm, selectedRegion, selectedType, selectedStatus]);

    const handleUpdateConflict = async (id: string, updatedData: Partial<Omit<PressConflict, "id">>) => {
        await updatePressConflict(id, updatedData);
        toast({
            title: "Fiche mise à jour",
            description: "Les modifications ont été enregistrées avec succès.",
        });
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'Foncier':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'Affrontement intercommunautaire':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            case 'Désignation des chefs':
                return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'Problème de justice':
                return 'bg-indigo-50 text-indigo-700 border-indigo-200';
            case 'Orpaillage':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="flex flex-col gap-4 pb-4 h-[calc(100vh-5.5rem)]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                <div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" asChild className="gap-1.5 h-7 px-2 text-xs">
                            <Link href="/conflicts/press">
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Retour au Tableau
                            </Link>
                        </Button>
                        <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                            SIG Veille Médiatique & Faits Signalés
                        </Badge>
                    </div>
                    <h1 className="text-2xl font-extrabold tracking-tight mt-1 text-foreground flex items-center gap-2">
                        <Globe className="h-6 w-6 text-orange-600" />
                        Observatoire Cartographique de la Veille
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 bg-white rounded-xl shadow-sm border text-xs flex items-center gap-3">
                        <span className="font-bold text-orange-600">{filteredConflicts.length} / {conflicts.length}</span>
                        <span className="text-muted-foreground">faits cartographiés</span>
                    </div>
                </div>
            </div>

            {/* Split View Container */}
            <Card className="flex-1 flex flex-col border-none shadow-xl overflow-hidden rounded-xl">
                <CardContent className="flex-1 flex flex-col md:flex-row p-0 overflow-hidden relative">
                    {/* Left Sidebar */}
                    <div className="w-full md:w-[340px] lg:w-[400px] flex flex-col bg-white border-r border-slate-100 z-10">
                        {/* Search & Filters */}
                        <div className="p-4 space-y-3 border-b border-slate-100 bg-slate-50/40">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Localité, journal, mot-clé..."
                                    className="pl-9 h-9 text-xs rounded-xl bg-white"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <Select value={selectedType} onValueChange={setSelectedType}>
                                    <SelectTrigger className="h-8 text-[11px] bg-white">
                                        <SelectValue placeholder="Thématique" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-56">
                                        <SelectItem value="Tous">Toutes Thématiques</SelectItem>
                                        {PRESS_CONFLICT_TYPES.map((t) => (
                                            <SelectItem key={t} value={t}>
                                                {t}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                                    <SelectTrigger className="h-8 text-[11px] bg-white">
                                        <SelectValue placeholder="Région" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-56">
                                        <SelectItem value="Tous">Toutes Régions</SelectItem>
                                        <SelectItem value="Abidjan">District Abidjan</SelectItem>
                                        <SelectItem value="Yamoussoukro">District Yamoussoukro</SelectItem>
                                        {IVORIAN_REGIONS.map((r) => (
                                            <SelectItem key={r} value={r}>
                                                {r}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* List of Facts */}
                        <ScrollArea className="flex-grow">
                            {loading ? (
                                <div className="p-4 space-y-3">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="p-3 border rounded-xl space-y-2">
                                            <Skeleton className="h-4 w-2/3" />
                                            <Skeleton className="h-3 w-full" />
                                        </div>
                                    ))}
                                </div>
                            ) : filteredConflicts.length > 0 ? (
                                <div className="p-3 space-y-2">
                                    {filteredConflicts.map((item) => {
                                        const isSelected = selectedConflictId === item.id;
                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => setSelectedConflictId(item.id)}
                                                className={cn(
                                                    "w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer group flex flex-col gap-1.5",
                                                    isSelected
                                                        ? "bg-orange-50/80 border-orange-400 shadow-md ring-1 ring-orange-400"
                                                        : "hover:bg-slate-50 border-slate-100 bg-white"
                                                )}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                                        <span className="font-extrabold text-orange-600">#{item.orderNumber || "•"}</span>
                                                        • {item.dateOfFacts}
                                                    </span>
                                                    <span className={cn("text-[9px] px-2 py-0.5 rounded font-bold border", getTypeColor(item.conflictType))}>
                                                        {item.conflictType}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between gap-2">
                                                    <h4 className="font-bold text-xs text-slate-900">
                                                        📍 {item.locality}
                                                    </h4>
                                                    <span className="text-[10px] font-semibold text-primary shrink-0">
                                                        {item.source}
                                                    </span>
                                                </div>

                                                <p className={cn(
                                                    "text-[11px] text-slate-700 leading-relaxed",
                                                    isSelected ? "bg-white/90 p-2.5 rounded-lg border border-orange-200 mt-1 shadow-sm" : "line-clamp-2"
                                                )}>
                                                    {item.description}
                                                </p>

                                                {isSelected && item.observations && (
                                                    <div className="text-[11px] bg-amber-50 text-amber-900 p-2 rounded-lg border border-amber-200 mt-1">
                                                        <strong>Obs :</strong> {item.observations}
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between pt-1 text-[10px]">
                                                    <span className="text-slate-500 font-medium">
                                                        📍 {item.region}
                                                    </span>
                                                    <Button
                                                        size="sm"
                                                        variant={isSelected ? "default" : "outline"}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDetailConflict(item);
                                                            setIsDetailOpen(true);
                                                        }}
                                                        className={cn(
                                                            "h-6 px-2 text-[10px] font-bold gap-1",
                                                            isSelected ? "bg-orange-500 hover:bg-orange-600 text-white shadow-sm" : "text-orange-700 border-orange-200 hover:bg-orange-50"
                                                        )}
                                                    >
                                                        <Eye className="h-3 w-3" /> Fiche complète
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-12 text-center space-y-3 px-4">
                                    <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                                        <Search className="h-6 w-6" />
                                    </div>
                                    <p className="text-xs font-bold text-slate-500 uppercase">Aucun fait correspondant</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setSearchTerm('');
                                            setSelectedRegion('Tous');
                                            setSelectedType('Tous');
                                            setSelectedStatus('Tous');
                                        }}
                                        className="text-xs"
                                    >
                                        Réinitialiser les filtres
                                    </Button>
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    {/* Right Map */}
                    <div className="flex-1 relative">
                        <div className="absolute inset-0 bg-slate-50 z-0 overflow-hidden">
                            <PressConflictGISMap
                                conflicts={filteredConflicts}
                                selectedId={selectedConflictId}
                                onMarkerClick={(id) => setSelectedConflictId(id)}
                                onViewDetail={(conflict) => {
                                    setDetailConflict(conflict);
                                    setIsDetailOpen(true);
                                }}
                                height="100%"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Sheets */}
            <PressConflictDetailSheet
                isOpen={isDetailOpen}
                conflict={detailConflict}
                onCloseAction={() => {
                    setIsDetailOpen(false);
                    setDetailConflict(null);
                }}
                onEditAction={(conflict) => {
                    setEditingConflict(conflict);
                    setIsEditOpen(true);
                }}
            />

            <EditPressConflictSheet
                isOpen={isEditOpen}
                conflict={editingConflict}
                onCloseAction={() => {
                    setIsEditOpen(false);
                    setEditingConflict(null);
                }}
                onUpdateAction={handleUpdateConflict}
            />
        </div>
    );
}
