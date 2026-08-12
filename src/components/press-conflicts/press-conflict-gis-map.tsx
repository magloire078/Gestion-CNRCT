"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import {
    Newspaper, Navigation, Loader2, MapPin,
    AlertTriangle, CheckCircle2, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PressConflict, PressConflictType } from '@/types/press-conflict';
import { getOfficialRegion, REGION_COORDS } from '@/lib/normalization-utils';

interface PressConflictGISMapProps {
    conflicts: PressConflict[];
    selectedId?: string | null;
    onMarkerClick?: (id: string, conflict: PressConflict) => void;
    onViewDetail?: (conflict: PressConflict) => void;
    className?: string;
    height?: string;
    showFilters?: boolean;
}

export function PressConflictGISMap({
    conflicts = [],
    selectedId,
    onMarkerClick,
    onViewDetail,
    className,
    height = '750px',
    showFilters = true
}: PressConflictGISMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const clusterGroupRef = useRef<any>(null);

    const [isClient, setIsClient] = useState(false);
    const [L, setL] = useState<any>(null);
    const [mapReady, setMapReady] = useState(false);
    const instanceId = useMemo(() => `press-map-${Math.random().toString(36).substr(2, 9)}`, []);

    const [activeTypeFilter, setActiveTypeFilter] = useState<string>("Tous");

    // Leaflet Dynamic Import
    useEffect(() => {
        if (typeof window === 'undefined') return;
        setIsClient(true);

        const initLeaflet = async () => {
            const Leaflet = (await import('leaflet')).default;
            await import('leaflet.markercluster');

            // Fix icon paths
            // @ts-ignore
            delete Leaflet.Icon.Default.prototype._getIconUrl;
            Leaflet.Icon.Default.mergeOptions({
                iconRetinaUrl: '/marker-icon-2x.png',
                iconUrl: '/marker-icon.png',
                shadowUrl: '/marker-shadow.png',
            });

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

    // Helper for marker colors by conflict type
    const getTypeColor = (type: PressConflictType | string) => {
        switch (type) {
            case 'Foncier':
                return { bg: 'bg-emerald-600', ring: 'ring-emerald-400', hex: '#059669', badgeBg: 'bg-emerald-100 text-emerald-800' };
            case 'Affrontement intercommunautaire':
                return { bg: 'bg-rose-600', ring: 'ring-rose-400', hex: '#e11d48', badgeBg: 'bg-rose-100 text-rose-800' };
            case 'Désignation des chefs':
                return { bg: 'bg-purple-600', ring: 'ring-purple-400', hex: '#9333ea', badgeBg: 'bg-purple-100 text-purple-800' };
            case 'Problème de justice':
                return { bg: 'bg-indigo-600', ring: 'ring-indigo-400', hex: '#4f46e5', badgeBg: 'bg-indigo-100 text-indigo-800' };
            case 'Orpaillage':
                return { bg: 'bg-amber-500', ring: 'ring-amber-400', hex: '#f59e0b', badgeBg: 'bg-amber-100 text-amber-800' };
            default:
                return { bg: 'bg-slate-600', ring: 'ring-slate-400', hex: '#475569', badgeBg: 'bg-slate-100 text-slate-800' };
        }
    };

    // Custom Marker Icon Creator
    const createPressIcon = useCallback((conflict: PressConflict, isSelected: boolean) => {
        if (!L) return null;
        const typeStyle = getTypeColor(conflict.conflictType);

        if (isSelected) {
            return L.divIcon({
                className: 'custom-selected-press-icon',
                html: `<div class="w-11 h-11 ${typeStyle.bg} rounded-full border-2 border-white shadow-2xl flex items-center justify-center ring-4 ring-yellow-400 animate-bounce z-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>
                </div>`,
                iconSize: [44, 44],
                iconAnchor: [22, 44],
                popupAnchor: [0, -44]
            });
        }

        return L.divIcon({
            className: 'custom-press-icon',
            html: `<div class="w-9 h-9 ${typeStyle.bg} rounded-full border-2 border-white shadow-lg flex items-center justify-center transform transition-transform hover:scale-125 hover:shadow-xl shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>
            </div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 36],
            popupAnchor: [0, -36]
        });
    }, [L]);

    // Map initialization
    useEffect(() => {
        if (!L || !mapContainerRef.current || mapRef.current) return;
        const container = mapContainerRef.current;

        if ((container as any)._leaflet_id) {
            return;
        }

        try {
            container.innerHTML = '';

            const map = L.map(container, {
                center: [7.539989, -5.54708],
                zoom: 7,
                zoomControl: true,
                attributionControl: true
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(map);

            mapRef.current = map;

            clusterGroupRef.current = L.markerClusterGroup({
                showCoverageOnHover: false,
                maxClusterRadius: 40
            });
            map.addLayer(clusterGroupRef.current);

            setMapReady(true);
        } catch (err) {
            console.error("Leaflet press map initialization failed:", err);
        }

        return () => {
            if (mapRef.current) {
                try {
                    mapRef.current.remove();
                } catch (e) {
                    console.warn("Failed to remove map instance:", e);
                }
                mapRef.current = null;
            }
            if (container) {
                delete (container as any)._leaflet_id;
                container.innerHTML = '';
            }
        };
    }, [L]);

    // Render Markers
    useEffect(() => {
        if (!mapReady || !L || !clusterGroupRef.current) return;
        const map = mapRef.current;
        const cluster = clusterGroupRef.current;

        cluster.clearLayers();

        const filtered = activeTypeFilter === "Tous" 
            ? conflicts 
            : conflicts.filter(c => c.conflictType === activeTypeFilter);

        filtered.forEach(conflict => {
            let lat: number;
            let lng: number;

            const officialReg = getOfficialRegion(conflict.region || "");
            if (officialReg && REGION_COORDS[officialReg]) {
                const hash = (conflict.id || conflict.locality || conflict.source || "p")
                    .split('')
                    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const jitterLat = (((hash * 19) % 100) - 50) * 0.0035;
                const jitterLng = (((hash * 23) % 100) - 50) * 0.0035;
                lat = REGION_COORDS[officialReg][0] + jitterLat;
                lng = REGION_COORDS[officialReg][1] + jitterLng;
            } else {
                const hash = (conflict.id || conflict.locality || "p").split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                lat = 6.8276 + ((((hash * 19) % 100) - 50) * 0.005);
                lng = -5.2893 + ((((hash * 23) % 100) - 50) * 0.005);
            }

            const isSelected = selectedId === conflict.id;
            const marker = L.marker([lat, lng], {
                icon: createPressIcon(conflict, isSelected)
            });

            const typeStyle = getTypeColor(conflict.conflictType);

            const popupContent = document.createElement('div');
            popupContent.className = 'p-4 min-w-[300px] sm:min-w-[360px] max-w-[420px] font-sans text-slate-900';
            popupContent.innerHTML = `
                <div class="bg-gradient-to-r from-orange-500 to-amber-500 text-white -m-4 p-4 mb-3 rounded-t-lg shadow-sm">
                    <div class="flex items-center justify-between text-[10px] font-black uppercase tracking-wider mb-1">
                        <span class="bg-black/20 px-2 py-0.5 rounded">N° ${conflict.orderNumber || "•"} • VEILLE PRESSE</span>
                        <span>${conflict.dateOfFacts}</span>
                    </div>
                    <h3 class="text-sm font-black uppercase tracking-tight leading-tight">${conflict.locality}</h3>
                    <p class="text-xs font-semibold text-orange-100 flex items-center gap-1 mt-0.5">
                        📰 ${conflict.source}
                    </p>
                </div>

                <div class="space-y-3 mt-4 text-xs">
                    <div class="flex items-center justify-between gap-2 flex-wrap">
                        <span class="px-2.5 py-1 rounded font-bold text-[10px] ${typeStyle.badgeBg}">
                            ${conflict.conflictType}
                        </span>
                        <span class="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                            ${conflict.status}
                        </span>
                    </div>

                    <div>
                        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Faits signalés :</span>
                        <div class="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 max-h-[160px] overflow-y-auto">
                            ${conflict.description}
                        </div>
                    </div>

                    ${conflict.observations ? `
                        <div>
                            <span class="text-[10px] font-bold uppercase tracking-wider text-amber-700 block mb-1">Observations & analyse :</span>
                            <div class="text-[11px] text-amber-950 bg-amber-50 p-2.5 rounded-lg border border-amber-200 leading-relaxed max-h-[100px] overflow-y-auto">
                                ${conflict.observations}
                            </div>
                        </div>
                    ` : ''}

                    <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span class="text-slate-500 font-medium">📍 ${conflict.region}</span>
                        <button id="btn-detail-${conflict.id}" class="text-orange-600 font-bold hover:underline cursor-pointer bg-orange-50 hover:bg-orange-100 px-2 py-1 rounded border border-orange-200 transition-colors">
                            Ouvrir la fiche complète →
                        </button>
                    </div>
                </div>
            `;

            popupContent.querySelector(`#btn-detail-${conflict.id}`)?.addEventListener('click', (e) => {
                e.preventDefault();
                onViewDetail?.(conflict);
            });

            marker.bindPopup(popupContent, {
                autoPan: true,
                autoPanPaddingTopLeft: L.point(30, 80),
                autoPanPaddingBottomRight: L.point(30, 40),
                keepInView: true,
                maxWidth: 400,
                offset: L.point(0, -10)
            });

            marker.on('click', () => {
                onMarkerClick?.(conflict.id, conflict);
            });

            cluster.addLayer(marker);

            if (isSelected) {
                // Offset latitude slightly north so the marker is placed lower and popup is 100% in viewport
                const centerLat = lat + 0.006;
                map.flyTo([centerLat, lng], 13, { animate: true, duration: 0.8 });
                setTimeout(() => {
                    marker.openPopup();
                }, 400);
            }
        });

    }, [mapReady, conflicts, selectedId, activeTypeFilter, L, createPressIcon, onMarkerClick, onViewDetail]);

    // Automatic map resize on container changes
    useEffect(() => {
        if (!mapReady || !mapContainerRef.current || !mapRef.current) return;
        const map = mapRef.current;

        const timeout = setTimeout(() => {
            map.invalidateSize();
        }, 200);

        const resizeObserver = new ResizeObserver(() => {
            if (mapRef.current) {
                mapRef.current.invalidateSize();
            }
        });
        resizeObserver.observe(mapContainerRef.current);

        return () => {
            clearTimeout(timeout);
            resizeObserver.disconnect();
        };
    }, [mapReady]);

    if (typeof window === 'undefined' || !isClient) {
        return <div className={cn("bg-slate-50 relative", className)} style={{ minHeight: height }} />;
    }

    return (
        <div className={cn("bg-slate-50 relative group rounded-xl overflow-hidden shadow-2xl border border-slate-200", className)} style={{ minHeight: height }}>
            <div key={instanceId} ref={mapContainerRef} className="absolute inset-0 z-0" id={instanceId} />

            {/* Loading Overlay */}
            {!mapReady && (
                <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="h-10 w-10 text-orange-600 animate-spin" />
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">Initialisation SIG Veille...</p>
                </div>
            )}

            {/* Floating Top Right Action */}
            {mapReady && (
                <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                    <div className="bg-white/90 backdrop-blur-md p-1 rounded-xl shadow-xl border border-white/50 flex flex-col gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg hover:bg-orange-50 text-slate-600"
                            title="Ma position"
                            onClick={() => {
                                if (navigator.geolocation) {
                                    navigator.geolocation.getCurrentPosition((pos) => {
                                        mapRef.current?.flyTo([pos.coords.latitude, pos.coords.longitude], 12);
                                    });
                                }
                            }}
                        >
                            <Navigation className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Thematic Legend & Filters (Bottom Bar) */}
            {showFilters && mapReady && (
                <div className="absolute bottom-6 left-6 right-6 md:right-auto z-10">
                    <div className="bg-slate-900/90 backdrop-blur-xl p-2 rounded-2xl shadow-2xl border border-white/10 flex flex-wrap items-center gap-1.5 max-w-full overflow-x-auto">
                        <button
                            onClick={() => setActiveTypeFilter("Tous")}
                            className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0",
                                activeTypeFilter === "Tous" 
                                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30" 
                                    : "text-slate-400 hover:text-white"
                            )}
                        >
                            Tous ({conflicts.length})
                        </button>
                        <button
                            onClick={() => setActiveTypeFilter("Foncier")}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0",
                                activeTypeFilter === "Foncier" 
                                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30" 
                                    : "text-slate-400 hover:text-white"
                            )}
                        >
                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                            Foncier
                        </button>
                        <button
                            onClick={() => setActiveTypeFilter("Affrontement intercommunautaire")}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0",
                                activeTypeFilter === "Affrontement intercommunautaire" 
                                    ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30" 
                                    : "text-slate-400 hover:text-white"
                            )}
                        >
                            <span className="h-2 w-2 rounded-full bg-rose-400" />
                            Affrontements
                        </button>
                        <button
                            onClick={() => setActiveTypeFilter("Désignation des chefs")}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0",
                                activeTypeFilter === "Désignation des chefs" 
                                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30" 
                                    : "text-slate-400 hover:text-white"
                            )}
                        >
                            <span className="h-2 w-2 rounded-full bg-purple-400" />
                            Chefferies
                        </button>
                        <button
                            onClick={() => setActiveTypeFilter("Orpaillage")}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0",
                                activeTypeFilter === "Orpaillage" 
                                    ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30" 
                                    : "text-slate-400 hover:text-white"
                            )}
                        >
                            <span className="h-2 w-2 rounded-full bg-amber-400" />
                            Orpaillage
                        </button>
                        <button
                            onClick={() => setActiveTypeFilter("Problème de justice")}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0",
                                activeTypeFilter === "Problème de justice" 
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" 
                                    : "text-slate-400 hover:text-white"
                            )}
                        >
                            <span className="h-2 w-2 rounded-full bg-indigo-400" />
                            Justice
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
