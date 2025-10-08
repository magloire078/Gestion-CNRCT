
"use client";

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Chief } from '@/lib/data';
import { useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';

// Fix for default Leaflet icon issue with Webpack
const defaultIcon = L.icon({
  iconUrl: "/marker-icon.png",
  iconRetinaUrl: "/marker-icon-2x.png",
  shadowUrl: "/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const selectedIcon = L.icon({
  iconUrl: "/marker-icon-red.png",
  iconRetinaUrl: "/marker-icon-red-2x.png",
  shadowUrl: "/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});


interface MapComponentProps {
  chiefs: Chief[];
  selectedChiefId: string | null;
  onMarkerClick: (chiefId: string) => void;
}

export default function MapComponent({ chiefs, selectedChiefId, onMarkerClick }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
        mapRef.current = L.map(mapContainerRef.current, {
            zoomControl: false // Disable default zoom control
        }).setView([7.539989, -5.54708], 7);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapRef.current);
        L.control.zoom({ position: 'topright' }).addTo(mapRef.current);
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
      
      const chiefMap = new Map(chiefs.map(c => [c.id, c]));
      const newMarkers = new Map<string, L.Marker>();

      // Add/Update markers
      chiefs.forEach(chief => {
        if (chief.latitude && chief.longitude) {
            let marker;
            if(markersRef.current.has(chief.id)) {
                marker = markersRef.current.get(chief.id)!;
                marker.setLatLng([chief.latitude, chief.longitude]);
            } else {
                marker = L.marker([chief.latitude, chief.longitude], { icon: defaultIcon });
                marker.on('click', () => onMarkerClick(chief.id));
                marker.addTo(map);
            }
            
            const popupContent = `
                <div class="font-sans">
                    <h3 class="font-bold text-base mb-1">${chief.name}</h3>
                    <p class="text-sm text-muted-foreground m-0">${chief.title}</p>
                    <p class="text-sm m-0">${chief.village}, ${chief.region}</p>
                    <a href="/chiefs/${chief.id}" class="text-primary text-sm mt-2 block hover:underline">Voir les détails</a>
                </div>
            `;
            marker.bindPopup(popupContent);
            newMarkers.set(chief.id, marker);
        }
      });
      
      // Remove old markers
      markersRef.current.forEach((marker, id) => {
          if (!chiefMap.has(id)) {
              marker.remove();
          }
      });
      
      markersRef.current = newMarkers;

  }, [chiefs, onMarkerClick]);
  
  useEffect(() => {
      const map = mapRef.current;
      if (!map) return;

      markersRef.current.forEach((marker, id) => {
          const isSelected = id === selectedChiefId;
          marker.setIcon(isSelected ? selectedIcon : defaultIcon);
          if (isSelected) {
              marker.setZIndexOffset(1000);
          } else {
              marker.setZIndexOffset(0);
          }
      });
      
      if (selectedChiefId) {
        const selectedChief = chiefs.find(c => c.id === selectedChiefId);
        if (selectedChief && selectedChief.latitude && selectedChief.longitude) {
            map.flyTo([selectedChief.latitude, selectedChief.longitude], 12, {
                animate: true,
                duration: 1
            });
            const marker = markersRef.current.get(selectedChiefId);
            if (marker && !marker.isPopupOpen()) {
                marker.openPopup();
            }
        }
      }

  }, [selectedChiefId, chiefs]);


  return <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />;
}
