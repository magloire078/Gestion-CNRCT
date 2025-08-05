
"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamically import the map component to avoid SSR issues
const MapComponent = dynamic(() => import('@/components/mapping/map-component'), {
  ssr: false,
  loading: () => <Skeleton className="h-[600px] w-full" />,
});

export default function MappingPage() {
  const [searchTerm, setSearchTerm] = useState('');

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
             <MapComponent searchTerm={searchTerm} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
