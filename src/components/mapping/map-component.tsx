
"use client";

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Chief } from '@/lib/data';
import { useEffect, useMemo, useRef } from 'react';

// Fix for default Leaflet icon issue with Webpack
const icon = L.icon({
  iconUrl: "/marker-icon.png",
  iconRetinaUrl: "/marker-icon-2x.png",
  shadowUrl: "/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapComponentProps {
  searchTerm: string;
  chiefs: Chief[];
}

export default function MapComponent({ searchTerm, chiefs: allChiefs }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup>(new L.LayerGroup());

  const filteredChiefs = useMemo(() => {
    if (!searchTerm) {
      return allChiefs;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return allChiefs.filter(
      (chief) =>
        chief.name.toLowerCase().includes(lowercasedTerm) ||
        chief.village.toLowerCase().includes(lowercasedTerm) ||
        chief.region.toLowerCase().includes(lowercasedTerm)
    );
  }, [allChiefs, searchTerm]);

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

      // Clear existing markers
      markersRef.current.clearLayers();

      // Add new markers
      filteredChiefs.forEach(chief => {
        if (chief.latitude && chief.longitude) {
            const marker = L.marker([chief.latitude, chief.longitude], { icon });
            marker.bindPopup(`
                <div class="font-sans">
                    <h3 class="font-bold text-base mb-1">${chief.name}</h3>
                    <p class="text-sm text-muted-foreground m-0">${chief.title}</p>
                    <p class="text-sm m-0">${chief.village}, ${chief.region}</p>
                    ${chief.contact ? `<p class="text-sm m-0">Contact: ${chief.contact}</p>`: ''}
                </div>
            `);
            markersRef.current.addLayer(marker);
        }
      });
      
      // Recenter map
       if (filteredChiefs && filteredChiefs.length > 0) {
            const firstChief = filteredChiefs[0];
            if (firstChief.latitude && firstChief.longitude) {
                 map.setView([firstChief.latitude, firstChief.longitude], 8);
            }
        } else if (filteredChiefs) {
            // If no results, zoom out to country view
            map.setView([7.539989, -5.54708], 7);
        }

  }, [filteredChiefs]);


  return <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />;
}
