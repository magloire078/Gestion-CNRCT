"use client";

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Chief } from '@/types/chief';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Fix Leaflet default icon path issues
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

const createChiefIcon = (isHighAuthority: boolean) => {
    return new L.DivIcon({
        className: 'bg-transparent border-0',
        html: `<div class="relative w-10 h-10 rounded-full border-[3px] shadow-xl flex items-center justify-center transition-transform hover:scale-110 ${isHighAuthority ? 'bg-gradient-to-br from-amber-400 to-amber-600 border-white text-white' : 'bg-gradient-to-br from-blue-500 to-blue-700 border-white text-white'}">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            ${isHighAuthority ? '<div class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-200 rounded-full border-2 border-white animate-pulse"></div>' : ''}
        </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
    });
};

interface ChiefsMapProps {
    chiefs: Chief[];
    onChiefClick?: (chief: Chief) => void;
    height?: string;
}

export default function ChiefsMap({ chiefs, onChiefClick, height = "600px" }: ChiefsMapProps) {
    const [isMounted, setIsMounted] = useState(false);
    
    useEffect(() => {
        setIsMounted(true);
        return () => {
            setIsMounted(false);
            // Nettoyage synchrone de l'ID Leaflet pour React 18 Strict Mode
            const containers = document.querySelectorAll('.leaflet-container');
            containers.forEach((c: any) => {
                c._leaflet_id = null;
            });
        };
    }, []);

    const defaultCenter: [number, number] = [7.539989, -5.54708]; // Ivory Coast Center
    
    const mappableChiefs = chiefs.filter(c => c.latitude && c.longitude);

    if (!isMounted) {
        return <div style={{ height, width: '100%' }} className="rounded-[2rem] border-4 border-white/60 shadow-[0_20px_40px_rgb(0,0,0,0.08)] bg-slate-100 animate-pulse" />;
    }

    return (
        <MapContainer 
            center={defaultCenter} 
            zoom={6} 
            scrollWheelZoom={true} 
            style={{ height, width: '100%', zIndex: 0 }}
            className="rounded-[2rem] border-4 border-white/60 shadow-[0_20px_40px_rgb(0,0,0,0.08)] bg-slate-50"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            
            <MarkerClusterGroup
                chunkedLoading
                maxClusterRadius={50}
                showCoverageOnHover={false}
                iconCreateFunction={(cluster: any) => {
                    const count = cluster.getChildCount();
                    return new L.DivIcon({
                        html: `<div class="w-12 h-12 rounded-full bg-blue-600/90 text-white font-black text-sm flex items-center justify-center border-4 border-white shadow-xl backdrop-blur-md"><span>${count}</span></div>`,
                        className: 'bg-transparent',
                        iconSize: [48, 48],
                        iconAnchor: [24, 24]
                    });
                }}
            >
                {mappableChiefs.map(chief => {
                    const isHighAuthority = ["Roi", "Chef de province", "Chef de canton"].includes(chief.role);
                    return (
                        <Marker 
                            key={chief.id} 
                            position={[chief.latitude!, chief.longitude!]}
                            icon={createChiefIcon(isHighAuthority)}
                        >
                            <Popup className="chief-popup rounded-2xl overflow-hidden border-0 shadow-2xl p-0 min-w-[240px]">
                                <div className="p-4 bg-white/95 backdrop-blur-xl">
                                    <div className="flex items-start gap-3 mb-4">
                                        <Avatar className="h-14 w-14 border-2 border-slate-100 shadow-sm shrink-0">
                                            <AvatarImage src={chief.photoUrl} />
                                            <AvatarFallback className="bg-slate-100 text-sm font-black text-slate-400">
                                                {chief.lastName?.charAt(0)}{chief.firstName?.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <Badge variant="secondary" className={`text-[9px] uppercase tracking-widest px-2 py-0.5 mb-1.5 ${isHighAuthority ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                                                {chief.role}
                                            </Badge>
                                            <h4 className="font-black text-sm uppercase leading-tight text-slate-900 tracking-tight truncate" title={chief.name}>
                                                {chief.name}
                                            </h4>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" /> 
                                            <span className="font-bold text-xs uppercase tracking-widest truncate">{chief.village || "Village non précisé"}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <ShieldCheck className="h-3.5 w-3.5 text-slate-400 shrink-0" /> 
                                            <span className="text-[10px] uppercase font-bold tracking-widest truncate">{chief.subPrefecture}</span>
                                        </div>
                                    </div>
                                    
                                    {onChiefClick && (
                                        <Button 
                                            size="sm" 
                                            variant={isHighAuthority ? "default" : "secondary"}
                                            className="w-full text-[10px] uppercase font-black tracking-widest h-9 rounded-xl shadow-sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onChiefClick(chief);
                                            }}
                                        >
                                            Ouvrir le Dossier
                                        </Button>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    )
                })}
            </MarkerClusterGroup>
        </MapContainer>
    );
}
