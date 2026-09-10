"use client";

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button } from "@/components/ui/button";
import { Maximize2 } from "lucide-react";

if (typeof window !== 'undefined') {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
}

function MapResizer() {
    const map = useMap();
    useEffect(() => {
        const t1 = setTimeout(() => map.invalidateSize(), 150);
        const t2 = setTimeout(() => map.invalidateSize(), 600);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [map]);
    return null;
}

interface HeritageItemMapProps {
    latitude: number;
    longitude: number;
    name: string;
    village?: string;
}

export default function HeritageItemMap({ latitude, longitude, name, village }: HeritageItemMapProps) {
    return (
        <div className="rounded-2xl overflow-hidden border-8 border-white shadow-2xl h-[400px] relative w-full">
            <MapContainer 
                center={[latitude, longitude]} 
                zoom={13} 
                style={{ height: '100%', width: '100%', zIndex: 0 }}
                zoomControl={false}
            >
                <MapResizer />
                <TileLayer 
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                />
                <Marker position={[latitude, longitude]}>
                    <Popup>
                        <div className="font-bold">{name}</div>
                        {village && <div className="text-[10px] uppercase text-slate-400">{village}</div>}
                    </Popup>
                </Marker>
            </MapContainer>
            <div className="absolute top-6 right-6 z-[400]">
                <Button size="icon" className="h-12 w-12 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 shadow-2xl border-none">
                    <Maximize2 className="h-6 w-6" />
                </Button>
            </div>
        </div>
    );
}
