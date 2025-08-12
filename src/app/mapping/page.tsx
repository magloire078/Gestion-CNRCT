
"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getChiefs } from '@/services/chief-service';
import type { Chief } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

// Dynamically import the map component to avoid SSR issues
const MapComponent = dynamic(() => import('@/components/mapping/map-component'), {
  ssr: false,
  loading: () => <Skeleton className="h-[600px] w-full" />,
});

export default function MappingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [chiefs, setChiefs] = useState<Chief[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Cartographie des Chefferies</h1>
      <Card>
        <CardHeader>
          <CardTitle>Carte Interactive</CardTitle>
          <CardDescription>
            Visualisez la localisation des Rois et Chefs Traditionnels à travers le pays.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher un chef, un village, une région..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="h-[600px] w-full rounded-lg border overflow-hidden">
             {loading ? <Skeleton className="h-[600px] w-full" /> : <MapComponent searchTerm={searchTerm} chiefs={chiefs} />}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
