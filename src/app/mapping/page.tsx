
"use client";

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, MapPin, User, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getChiefs } from '@/services/chief-service';
import type { Chief } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

// Dynamically import the map component to avoid SSR issues
const MapComponent = dynamic(() => import('@/components/mapping/map-component'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

export default function MappingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [chiefs, setChiefs] = useState<Chief[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [selectedChiefId, setSelectedChiefId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChiefs() {
      try {
        setLoading(true);
        const data = await getChiefs();
        const chiefsWithCoords = data.filter(c => c.latitude && c.longitude);
        setChiefs(chiefsWithCoords);
      } catch (error) {
        console.error('Failed to load chiefs for map', error);
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Impossible de charger les données des chefs pour la carte.',
        });
      } finally {
        setLoading(false);
      }
    }
    fetchChiefs();
  }, [toast]);
  
  const filteredChiefs = useMemo(() => {
    if (!searchTerm) return chiefs;
    const lowercasedTerm = searchTerm.toLowerCase();
    return chiefs.filter(
      (chief) =>
        chief.name.toLowerCase().includes(lowercasedTerm) ||
        chief.village.toLowerCase().includes(lowercasedTerm) ||
        chief.region.toLowerCase().includes(lowercasedTerm)
    );
  }, [chiefs, searchTerm]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Cartographie des Chefferies</h1>
      <Card className="h-[calc(100vh-14rem)] flex flex-col">
        <CardHeader>
          <CardTitle>Carte Interactive</CardTitle>
          <CardDescription>
            Explorez la localisation des Rois et Chefs Traditionnels.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col md:flex-row gap-4 overflow-hidden">
          <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un chef, un village..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <ScrollArea className="flex-grow border rounded-md">
                {loading ? (
                    <div className="p-4 space-y-4">
                        {Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                    </div>
                ) : (
                    <div className="p-2">
                        {filteredChiefs.map(chief => (
                             <button
                                key={chief.id}
                                onClick={() => setSelectedChiefId(chief.id)}
                                onMouseEnter={() => setSelectedChiefId(chief.id)}
                                className={cn(
                                    "w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors",
                                    selectedChiefId === chief.id ? "bg-primary/10" : "hover:bg-muted/50"
                                )}
                             >
                                <Avatar className="h-10 w-10 border">
                                    <AvatarImage src={chief.photoUrl} alt={chief.name} data-ai-hint="chief photo" />
                                    <AvatarFallback>{chief.lastName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 overflow-hidden">
                                    <p className="font-semibold truncate">{chief.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{chief.title}</p>
                                    <p className="text-xs text-muted-foreground truncate">{chief.village}, {chief.region}</p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto" />
                             </button>
                        ))}
                    </div>
                )}
                {!loading && filteredChiefs.length === 0 && (
                    <div className="p-4 text-center text-sm text-muted-foreground">Aucun chef trouvé.</div>
                )}
              </ScrollArea>
          </div>
          <div className="w-full md:w-2/3 lg:w-3/4 h-full min-h-[300px] rounded-lg border overflow-hidden">
             {loading ? <Skeleton className="h-full w-full" /> : 
              <MapComponent 
                  chiefs={filteredChiefs} 
                  selectedChiefId={selectedChiefId}
                  onMarkerClick={setSelectedChiefId}
              />
             }
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
