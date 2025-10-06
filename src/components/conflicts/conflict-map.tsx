
"use client";

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Conflict, Chief } from '@/lib/data';
import { useEffect, useMemo, useRef } from 'react';

const defaultIcon = L.icon({
  iconUrl: "/marker-icon.png",
  iconRetinaUrl: "/marker-icon-2x.png",
  shadowUrl: "/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const conflictIcon = L.icon({
  iconUrl: "/marker-icon-red.png",
  iconRetinaUrl: "/marker-icon-red-2x.png",
  shadowUrl: "/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});


interface ConflictMapProps {
  conflicts: Conflict[];
  chiefs: Chief[];
}

export function ConflictMap({ conflicts, chiefs }: ConflictMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup>(new L.LayerGroup());

  // Create a mapping from village name to chief's location for fallback
  const villageLocations = useMemo(() => {
    const locations = new Map<string, { lat: number; lng: number }>();
    chiefs.forEach(chief => {
      if (chief.village && chief.latitude && chief.longitude) {
        // Use the first location found for a village
        if (!locations.has(chief.village.toLowerCase())) {
          locations.set(chief.village.toLowerCase(), { lat: chief.latitude, lng: chief.longitude });
        }
      }
    });
    return locations;
  }, [chiefs]);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
        mapRef.current = L.map(mapContainerRef.current).setView([7.539989, -5.54708], 7);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapRef.current);
        markersRef.current.addTo(mapRef.current);
    }
    
    return () => {
        if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
        }
    };
  }, []);

  useEffect(() => {
      const map = mapRef.current;
      if (!map) return;

      markersRef.current.clearLayers();

      conflicts.forEach(conflict => {
        let location: { lat: number; lng: number } | undefined;

        // Prioritize conflict's own coordinates
        if (conflict.latitude && conflict.longitude) {
          location = { lat: conflict.latitude, lng: conflict.longitude };
        } else {
          // Fallback to village location from chiefs data
          location = villageLocations.get(conflict.village.toLowerCase());
        }

        if (location) {
            const marker = L.marker([location.lat, location.lng], { icon: conflictIcon });
            marker.bindPopup(`
                <div class="font-sans">
                    <h3 class="font-bold text-base mb-1">Conflit à ${conflict.village}</h3>
                    <p class="text-sm m-0">${conflict.description}</p>
                    <p class="text-sm font-medium m-0 mt-2">Statut: ${conflict.status}</p>
                </div>
            `);
            markersRef.current.addLayer(marker);
        }
      });
      
  }, [conflicts, villageLocations]);


  return <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />;
}
