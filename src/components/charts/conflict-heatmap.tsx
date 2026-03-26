
"use client";

import React, { useEffect, useState, useRef, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Map as MapIcon, Maximize2, Layers } from "lucide-react";
import type { Conflict } from "@/types/common";
import { cn } from "@/lib/utils";

interface ConflictHeatmapProps {
    conflicts: Conflict[];
    className?: string;
}

export const ConflictHeatmap = memo(function ConflictHeatmap({ conflicts, className }: ConflictHeatmapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const [L, setL] = useState<any>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Initialiser Leaflet dynamiquement (Client-side only)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        const initLeaflet = async () => {
            const Leaflet = (await import('leaflet')).default;
            // @ts-ignore
            await import('leaflet/dist/leaflet.css');
            setL(Leaflet);
        };
        initLeaflet();

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // Configurer la carte
    useEffect(() => {
        if (!L || !mapContainerRef.current || mapRef.current) return;

        const container = mapContainerRef.current;
        if ((container as any)._leaflet_id) return;

        // Centre de la Côte d'Ivoire
        const map = L.map(container, {
            center: [7.539989, -5.54708],
            zoom: 6,
            zoomControl: true,
            scrollWheelZoom: false,
            preferCanvas: true // Force canvas rendering for better html2canvas capture
        });

        // Layer CartoDB Positron (Light/Clean look)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20,
            crossOrigin: true // Enable CORS for tiles capture
        }).addTo(map);

        mapRef.current = map;
        setIsLoaded(true);
    }, [L]);

    // Ajouter les points de chaleur
    useEffect(() => {
        if (!isLoaded || !mapRef.current || !L) return;

        // Nettoyer les anciens marqueurs/cercles
        mapRef.current.eachLayer((layer: any) => {
            if (layer instanceof L.CircleMarker || layer instanceof L.Circle) {
                mapRef.current.removeLayer(layer);
            }
        });

        // Filtrer les conflits avec coordonnées
        const conflictsWithGeo = conflicts.filter(c => c.latitude && c.longitude);

        conflictsWithGeo.forEach(conflict => {
            // Intensité basée sur le type ou l'impact (simplifié pour démo)
            const color = conflict.status === "Résolu" ? "#10b981" : 
                         conflict.status === "En médiation" ? "#f59e0b" : "#f43f5e";
            const opacity = 0.6;
            const radius = 10;

            // Halo de chaleur
            const heatCircle = L.circle([conflict.latitude, conflict.longitude], {
                radius: 5000, // 5km radius for heat effect
                fillColor: color,
                fillOpacity: 0.1,
                stroke: false,
                interactive: false
            }).addTo(mapRef.current);

            // Point central
            const marker = L.circleMarker([conflict.latitude, conflict.longitude], {
                radius: 4,
                fillColor: color,
                fillOpacity: 1,
                color: "#fff",
                weight: 1
            }).addTo(mapRef.current);

            marker.bindPopup(`
                <div class="p-2 space-y-1">
                    <p class="font-black text-[10px] uppercase text-slate-400 tracking-wider">${conflict.type}</p>
                    <p class="font-bold text-sm text-slate-900">${conflict.village}</p>
                    <p class="text-[10px] text-slate-500 line-clamp-2">${conflict.description}</p>
                    <div className={cn(
                        "mt-2 text-[10px] font-bold py-1 px-2 rounded-full inline-block",
                        conflict.status === "Résolu" ? "bg-emerald-100 text-emerald-700" : 
                        conflict.status === "En médiation" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                    )}>
                        ${conflict.status}
                    </div>
                </div>
            `, {
                className: 'custom-popup rounded-[1.5rem] overflow-hidden shadow-2xl'
            });
        });

        if (conflictsWithGeo.length > 0) {
            const group = new L.FeatureGroup(conflictsWithGeo.map(c => L.marker([c.latitude, c.longitude])));
            // mapRef.current.fitBounds(group.getBounds().pad(0.1));
        }

    }, [isLoaded, conflicts, L]);

    return (
        <Card className={cn("overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-white text-slate-900 h-full group", className)}>
            <CardHeader className="p-8 pb-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10 font-black tracking-widest text-[10px] uppercase">
                            Visualisation SIG
                        </Badge>
                        <CardTitle className="text-2xl font-black flex items-center gap-3">
                            <Layers className="h-6 w-6 text-blue-400" /> Carte de Chaleur Sociale
                        </CardTitle>
                        <CardDescription className="text-slate-500 font-medium">
                            Densité des conflits et zones de tension prioritaires sur le territoire national.
                        </CardDescription>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-blue-600 transition-colors duration-500">
                        <MapIcon className="h-6 w-6 text-slate-400 group-hover:text-white" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 relative">
                {!isLoaded && (
                    <div className="absolute inset-0 z-10 bg-slate-50/80 backdrop-blur-md flex flex-col items-center justify-center gap-4 min-h-[700px]">
                        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                        <p className="font-black text-xs uppercase tracking-widest text-blue-500 animate-pulse">Initialisation SIG...</p>
                    </div>
                )}
                <div 
                    ref={mapContainerRef} 
                    className="h-[700px] w-full" 
                    style={{ background: '#f8fafc' }}
                />
                
                {/* Overlay Legend */}
                <div className="absolute bottom-6 right-6 z-[1000] bg-white/90 backdrop-blur-xl border border-slate-200/50 p-4 rounded-3xl shadow-2xl space-y-3 min-w-[180px]">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Légende des Tensions</p>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="h-3 w-3 rounded-full bg-rose-500 shadow-[0_4_12px_rgba(244,63,94,0.3)]" />
                            <span className="text-xs font-bold text-slate-700">En cours / Alerte</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-3 w-3 rounded-full bg-amber-500 shadow-[0_4_12px_rgba(245,158,11,0.3)]" />
                            <span className="text-xs font-bold text-slate-700">En médiation</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_4_12px_rgba(16,185,129,0.3)]" />
                            <span className="text-xs font-bold text-slate-700">Résolu / Stabilisé</span>
                        </div>
                        <div className="pt-2 border-t border-slate-800">
                            <div className="flex items-center justify-between text-[10px] text-slate-500">
                                <span>Intensité</span>
                                <div className="flex gap-0.5">
                                    <div className="h-1.5 w-3 bg-blue-900 rounded-full" />
                                    <div className="h-1.5 w-3 bg-blue-700 rounded-full" />
                                    <div className="h-1.5 w-3 bg-blue-500 rounded-full" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <style jsx global>{`
                    .leaflet-container {
                        cursor: crosshair !important;
                    }
                    .custom-popup .leaflet-popup-content-wrapper {
                        background: rgba(255, 255, 255, 0.95) !important;
                        backdrop-filter: blur(12px) !important;
                        color: #0f172a !important;
                        border-radius: 1.5rem !important;
                        border: 1px solid rgba(0, 0, 0, 0.05) !important;
                        padding: 0 !important;
                        box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1) !important;
                    }
                    .custom-popup .leaflet-popup-tip {
                        background: white !important;
                    }
                `}</style>
            </CardContent>
        </Card>
    );
});

