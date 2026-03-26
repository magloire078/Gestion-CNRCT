"use client";

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
    Search, MapPin, User, ChevronRight, 
    Layers, Globe, Navigation, Focus,
    Loader2, Info, Map as MapIcon,
    AlertCircle, ShieldAlert
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getChiefs } from '@/services/chief-service';
import { subscribeToConflicts, updateConflict } from '@/services/conflict-service';
import type { Chief, Conflict } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Dynamically import the map component to avoid SSR issues
const GISMap = dynamic(() => import('@/components/common/gis-map-v3').then(m => m.GISMap), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Initialisation du moteur SIG...</p>
    </div>
  ),
});


export default function MappingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [chiefs, setChiefs] = useState<Chief[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [selectedChiefId, setSelectedChiefId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchChiefs() {
      try {
        const data = await getChiefs();
        if (isMounted) {
          const chiefsWithCoords = data.filter(c => c.latitude && c.longitude);
          setChiefs(chiefsWithCoords);
        }
      } catch (error) {
        console.error('Failed to load chiefs for map', error);
        if (isMounted) {
          toast({
            variant: 'destructive',
            title: 'Erreur',
            description: 'Impossible de charger les données des chefs pour la carte.',
          });
        }
      }
    }

    const unsubConflicts = subscribeToConflicts(
      (data) => {
        if (isMounted) setConflicts(data);
      },
      (error) => {
        console.error('Failed to load conflicts for map', error);
        if (isMounted) {
          toast({
            variant: 'destructive',
            title: 'Erreur',
            description: 'Impossible de charger les données des conflits.',
          });
        }
      }
    );

    Promise.all([fetchChiefs()]).finally(() => {
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubConflicts();
    }
  }, [toast]);


  const filteredChiefs = useMemo(() => {
    if (!searchTerm) return chiefs;
    const lowercasedTerm = searchTerm.toLowerCase();
    return chiefs.filter(
      (chief) =>
        chief.name.toLowerCase().includes(lowercasedTerm) ||
        (chief.village || '').toLowerCase().includes(lowercasedTerm) ||
        (chief.region || '').toLowerCase().includes(lowercasedTerm)
    );
  }, [chiefs, searchTerm]);

  const filteredConflicts = useMemo(() => {
    if (!searchTerm) return conflicts;
    const lowercasedTerm = searchTerm.toLowerCase();
    return conflicts.filter(c => c.village.toLowerCase().includes(lowercasedTerm));
  }, [conflicts, searchTerm]);

  return (
    <div className="flex flex-col gap-6 pb-4 h-[calc(100vh-6rem)]">
      <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Observatoire Cartographique</h1>
            <p className="text-muted-foreground mt-1 text-sm">Surveillance géospatiale de la chefferie et des points de vigilance.</p>
          </div>
          <div className="hidden md:flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
               <Button variant="ghost" size="sm" className="rounded-lg h-8 text-[10px] font-bold uppercase tracking-wider">Vue Satellite</Button>
               <Button variant="default" size="sm" className="rounded-lg h-8 text-[10px] font-bold uppercase tracking-wider bg-slate-900 shadow-sm">Vue Politique</Button>
          </div>
      </div>

      <Card className="flex-1 flex flex-col border-none shadow-2xl shadow-slate-200/50 overflow-hidden rounded-3xl">
        <CardContent className="flex-1 flex flex-col md:flex-row p-0 overflow-hidden relative">
          
          {/* Sidebar */}
          <div className="w-full md:w-[320px] lg:w-[380px] flex flex-col bg-white border-r border-slate-100 z-10">
            <div className="p-6 space-y-4 border-b border-slate-50 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
               <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Annuaire Géo-localisé</p>
                    <Badge variant="outline" className="h-5 text-[9px] font-black px-1.5 border-slate-200">{filteredChiefs.length} Points</Badge>
               </div>
               <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                <Input
                  placeholder="Trouver un chef ou un village..."
                  className="pl-10 h-11 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-slate-900 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <ScrollArea className="flex-grow">
              {loading ? (
                <div className="p-4 space-y-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex gap-4 p-4 border border-slate-50 rounded-2xl">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-3 w-1/2" />
                            <Skeleton className="h-2 w-full" />
                        </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 space-y-1">
                  {filteredChiefs.length > 0 ? filteredChiefs.map(chief => (
                    <button
                      key={chief.id}
                      onClick={() => setSelectedChiefId(chief.id)}
                      className={cn(
                        "w-full text-left p-4 rounded-2xl flex items-center gap-4 transition-all group",
                        selectedChiefId === chief.id 
                            ? "bg-slate-900 text-white shadow-xl shadow-slate-200" 
                            : "hover:bg-slate-50"
                      )}
                    >
                      <div className="relative">
                        <Avatar className={cn("h-12 w-12 border-2", selectedChiefId === chief.id ? "border-slate-700" : "border-white")}>
                            <AvatarImage src={chief.photoUrl} alt={chief.name} />
                            <AvatarFallback className="bg-slate-100 text-slate-400 font-bold">{chief.lastName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {selectedChiefId === chief.id && (
                             <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                                <Focus className="h-2 w-2 text-white" />
                             </div>
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className={cn("font-bold text-sm truncate", selectedChiefId === chief.id ? "text-white" : "text-slate-900")}>{chief.name}</p>
                        <p className={cn("text-[10px] font-bold uppercase tracking-wider truncate mb-1 opacity-60")}>{chief.title}</p>
                        <div className="flex items-center gap-1.5">
                            <MapPin className={cn("h-3 w-3", selectedChiefId === chief.id ? "text-slate-400" : "text-slate-300")} />
                            <p className={cn("text-[11px] font-medium truncate opacity-80")}>{chief.village}</p>
                        </div>
                      </div>
                      <ChevronRight className={cn("h-4 w-4 transition-transform group-hover:translate-x-1", selectedChiefId === chief.id ? "text-slate-600" : "text-slate-200")} />
                    </button>
                  )) : (
                    <div className="py-20 text-center space-y-4">
                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                            <Search className="h-8 w-8 text-slate-200" />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Aucun résultat</p>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Bottom Footer Info */}
            <div className="p-6 bg-slate-50/50 border-t border-slate-100 mt-auto">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                        <Info className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="text-[10px] leading-tight text-slate-500 italic">
                        Cliquez sur un marqueur pour accéder aux données démographiques et socioculturelles.
                    </p>
                </div>
            </div>
          </div>

          {/* Map Container */}
          <div className="flex-1 relative">
            <div className="absolute inset-0 bg-slate-50 z-0 overflow-hidden">
                <GISMap 
                  chiefs={chiefs} 
                  conflicts={filteredConflicts}
                  selectedId={selectedChiefId}
                  onMarkerClick={(id) => setSelectedChiefId(id)}
                  onAddPoint={(lat, lng) => {
                    toast({
                      title: "Collecte SIG",
                      description: `Coordonnées capturées: ${lat.toFixed(6)}, ${lng.toFixed(6)}. (Mode édition requis)`,
                    });
                  }}
                />
            </div>

            {/* Overlays */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-white shadow-xl border-none hover:bg-slate-50" title="Ma position">
                    <Navigation className="h-4 w-4 text-slate-900" />
                </Button>
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-white shadow-xl border-none hover:bg-slate-50" title="Calques">
                    <Layers className="h-4 w-4 text-slate-900" />
                </Button>
            </div>

            <div className="absolute bottom-4 left-4 z-20 flex gap-4">
                <div className="px-4 py-2 bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-white/50 flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Chefferies</span>
                    </div>
                    <div className="h-3 w-px bg-slate-200" />
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Points de Conflit</span>
                    </div>
                </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
