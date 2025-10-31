
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

const selectedChiefIcon = L.icon({
  iconUrl: "/marker-icon-blue.png", // Assuming a blue icon for selected chiefs
  iconRetinaUrl: "/marker-icon-blue-2x.png",
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
  selectedChiefId?: string | null;
  onMarkerClick?: (id: string) => void;
}

export function ConflictMap({ conflicts, chiefs, selectedChiefId, onMarkerClick }: ConflictMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const chiefMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const conflictMarkersRef = useRef<L.LayerGroup>(new L.LayerGroup());

  // Create a mapping from village name to chief's location for fallback
  const villageLocations = useMemo(() => {
    const locations = new Map<string, { lat: number; lng: number }>();
    chiefs.forEach(chief => {
      if (chief.village && chief.latitude && chief.longitude) {
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
        chiefMarkersRef.current.forEach(marker => marker.addTo(mapRef.current!));
        conflictMarkersRef.current.addTo(mapRef.current);
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

      // Update chief markers
      const currentChiefsOnMap = new Set(chiefMarkersRef.current.keys());
      chiefs.forEach(chief => {
        if (chief.latitude && chief.longitude) {
            const marker = L.marker([chief.latitude, chief.longitude], { icon: defaultIcon, zIndexOffset: 100 });
            marker.bindPopup(`<b>${chief.name}</b><br>${chief.title}<br><a href="/chiefs/${chief.id}">Voir détails</a>`);
            if (onMarkerClick) {
                 marker.on('click', () => onMarkerClick(chief.id));
            }
            chiefMarkersRef.current.set(chief.id, marker);
            marker.addTo(map);
            currentChiefsOnMap.delete(chief.id);
        }
      });
      // Remove chiefs that are no longer in the list
      currentChiefsOnMap.forEach(id => {
          chiefMarkersRef.current.get(id)?.remove();
          chiefMarkersRef.current.delete(id);
      });

      // Update conflict markers
      conflictMarkersRef.current.clearLayers();
      conflicts.forEach(conflict => {
        let location: { lat: number; lng: number } | undefined;

        if (conflict.latitude && conflict.longitude) {
          location = { lat: conflict.latitude, lng: conflict.longitude };
        } else {
          location = villageLocations.get(conflict.village.toLowerCase());
        }

        if (location) {
            const marker = L.marker([location.lat, location.lng], { icon: conflictIcon, zIndexOffset: 200 }); // Higher z-index for conflicts
            marker.bindPopup(`
                <div class="font-sans">
                    <h3 class="font-bold text-base mb-1">${conflict.village}</h3>
                    <p class="text-sm font-medium m-0">Type: ${conflict.type}</p>
                    <p class="text-sm text-muted-foreground m-0 mt-1">${conflict.description}</p>
                    <p class="text-sm font-medium m-0 mt-2">Statut: ${conflict.status}</p>
                </div>
            `);
            conflictMarkersRef.current.addLayer(marker);
        }
      });
      
  }, [conflicts, chiefs, villageLocations, onMarkerClick]);
  
  useEffect(() => {
      chiefMarkersRef.current.forEach((marker, id) => {
          marker.setIcon(id === selectedChiefId ? selectedChiefIcon : defaultIcon);
          if(id === selectedChiefId){
              marker.setZIndexOffset(1000);
              marker.openPopup();
          } else {
              marker.setZIndexOffset(100);
          }
      });
  }, [selectedChiefId]);


  return <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />;
}
