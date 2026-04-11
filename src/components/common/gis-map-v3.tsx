"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import {
    MapPin, Navigation, Info, User, Loader2,
    Maximize
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Chief, Conflict } from '@/lib/data';
import type { HeritageItem } from '@/types/heritage';
import { heritageCategoryLabels } from '@/types/heritage';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

// --- Types ---
interface GISMapProps {
    chiefs?: Chief[];
    conflicts?: Conflict[];
    heritage?: HeritageItem[];
    selectedId?: string | null;
    onMarkerClick?: (id: string, type: 'chief' | 'conflict' | 'heritage') => void;
    onAddPoint?: (lat: number, lng: number) => void;
    className?: string;
    showFilters?: boolean;
    height?: string;
}

export function GISMap(props: GISMapProps) {
    const {
        chiefs = [],
        conflicts = [],
        heritage = [],
        selectedId,
        onMarkerClick,
        onAddPoint,
        className,
        showFilters = true,
        height = '800px'
    } = props;

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const layersRef = useRef<any>({
        chiefs: null,
        conflicts: null,
        heritage: null,
        heatmap: null,
        proximity: null
    });

    const [isClient, setIsClient] = useState(false);
    const [L, setL] = useState<any>(null);
    const [mapReady, setMapReady] = useState(false);
    const instanceId = useMemo(() => `map-${Math.random().toString(36).substr(2, 9)}`, []);
    const [activeLayers, setActiveLayers] = useState({
        chiefs: true,
        conflicts: true,
        heritage: true,
        heatmap: false,
        proximity: true
    });

    // Initialisation de Leaflet (Browser only)
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

    // Création de l'icône personnalisée (Helper interne)
    const createCustomIcon = useCallback((type: 'chief' | 'conflict' | 'heritage' | 'selected', options?: { category?: string, status?: string }) => {
        if (!L) return null;

        let color = 'bg-blue-600';
        let iconSvg = '';

        if (type === 'chief') {
            color = 'bg-blue-600';
            iconSvg = '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>';
        } else if (type === 'conflict') {
            // Mapping des couleurs institutionnelles par statut (MGP)
            const statusColors: Record<string, string> = {
                'Résolu': 'bg-emerald-500',
                'En médiation': 'bg-blue-500',
                'Ouvert': 'bg-rose-500',
                'En cours': 'bg-rose-500',
                'Classé sans suite': 'bg-slate-400',
                'default': 'bg-rose-500'
            };
            color = statusColors[options?.status || 'default'] || statusColors.default;
            iconSvg = '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="M12 8v4"/><path d="M12 16h.01"/>';
        } else if (type === 'heritage') {
            const colors: Record<string, string> = {
                ethnies: 'bg-amber-600',
                alliances: 'bg-purple-600',
                default: 'bg-yellow-600'
            };
            color = colors[options?.category || 'default'] || colors.default;
            iconSvg = '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.07 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z"/>';
        } else if (type === 'selected') {
            color = 'bg-red-600';
            iconSvg = '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>';
            return L.divIcon({
                className: 'custom-selected-icon',
                html: `<div class="w-10 h-10 ${color} rounded-full border-2 border-white shadow-lg flex items-center justify-center ring-4 ring-yellow-300 animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">${iconSvg}</svg>
                </div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 40],
                popupAnchor: [0, -40]
            });
        }

        return L.divIcon({
            className: `custom-${type}-icon`,
            html: `<div class="w-8 h-8 ${color} rounded-full border-2 border-white shadow-lg flex items-center justify-center transform transition-transform hover:scale-110 shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">${iconSvg}</svg>
            </div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        });
    }, [L]);

    // Initialisation de la carte
    useEffect(() => {
        if (!L || !mapContainerRef.current || mapRef.current) return;

        const container = mapContainerRef.current;

        // Protection cruciale : si le conteneur a déjà un _leaflet_id, 
        // c'est qu'une instance s'est déjà attachée (possible en StrictMode).
        if ((container as any)._leaflet_id) {
            console.warn("Leaflet: Container already has an ID, skipping double initialization");
            return;
        }

        try {
            // Nettoyage agressif avant création
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

            // Groupes de marqueurs
            layersRef.current.chiefs = L.markerClusterGroup({ showCoverageOnHover: false });
            layersRef.current.conflicts = L.markerClusterGroup({ showCoverageOnHover: false });
            layersRef.current.heritage = L.markerClusterGroup({ showCoverageOnHover: false });
            layersRef.current.heatmap = L.layerGroup();
            layersRef.current.proximity = L.layerGroup();

            setMapReady(true);
        } catch (err) {
            console.error("Leaflet initialization failed:", err);
        }

        return () => {
            if (mapRef.current) {
                try {
                    mapRef.current.remove();
                } catch (e) {
                    console.warn("Failed to remove map instance cleanly:", e);
                }
                mapRef.current = null;
            }
            // Nettoyage manuel forcé pour garantir que le prochain cycle réussira
            if (container) {
                delete (container as any)._leaflet_id;
                container.innerHTML = '';
            }
        };
    }, [L]);

    // Update Datasets & Markers
    useEffect(() => {
        if (!mapReady || !L) return;

        const map = mapRef.current;
        const layers = layersRef.current;

        // Nettoyage
        layers.chiefs.clearLayers();
        layers.conflicts.clearLayers();
        layers.heritage.clearLayers();
        layers.proximity.clearLayers();

        // Ajout des chefs
        chiefs.forEach(chief => {
            if (!chief.latitude || !chief.longitude) return;
            const marker = L.marker([chief.latitude, chief.longitude], {
                icon: createCustomIcon(selectedId === chief.id ? 'selected' : 'chief')
            });

            const popupContent = document.createElement('div');
            popupContent.className = 'p-3 min-w-[200px] font-sans';
            popupContent.innerHTML = `
                <div class="flex items-center gap-3 mb-2">
                    <img src="${chief.photoUrl || '#'}" class="w-10 h-10 rounded-full border border-slate-200 object-cover" />
                    <div>
                        <h3 class="text-sm font-bold text-slate-800">${chief.name}</h3>
                        <p class="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">${chief.title}</p>
                    </div>
                </div>
                <div class="space-y-1 mb-3">
                    <p class="text-xs text-slate-600 flex items-center gap-2"><span class="w-4 h-4 text-slate-400">📍</span>${chief.village}, ${chief.region}</p>
                    <p class="text-xs text-slate-600 flex items-center gap-2"><span class="w-4 h-4 text-slate-400">📞</span>${chief.contact || 'N/A'}</p>
                </div>
                <a href="/chiefs/${chief.id}" class="block text-center bg-blue-600 text-white text-[10px] py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors">Voir dossier complet</a>
            `;

            marker.bindPopup(popupContent);
            marker.on('click', () => onMarkerClick?.(chief.id, 'chief'));
            layers.chiefs.addLayer(marker);

            if (selectedId === chief.id) {
                map.flyTo([chief.latitude, chief.longitude], 12);
            }
        });

        // Ajout des conflits
        conflicts.forEach(conflict => {
            if (!conflict.latitude || !conflict.longitude) return;
            const marker = L.marker([conflict.latitude, conflict.longitude], {
                icon: createCustomIcon('conflict', { status: conflict.status })
            });

            const popupContent = document.createElement('div');
            popupContent.className = 'p-4 min-w-[250px] font-sans';
            // Couleurs de popup par statut
            let statusClassName = 'bg-rose-50 text-rose-700 border-rose-200';
            let statusLabel = 'SIGNALÉ / OUVERT';

            if (conflict.status === 'Résolu') {
                statusClassName = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                statusLabel = 'DOSSIER RÉSOLU';
            } else if (conflict.status === 'En médiation') {
                statusClassName = 'bg-blue-50 text-blue-700 border-blue-200';
                statusLabel = 'MÉDIATION ACTIVE';
            } else if (conflict.status === 'Classé sans suite') {
                statusClassName = 'bg-slate-50 text-slate-600 border-slate-200';
                statusLabel = 'CLASSÉ SANS SUITE';
            }
            
            popupContent.innerHTML = `
                <div class="${statusClassName} -m-4 p-4 mb-3 border-b-2 rounded-t-lg">
                    <h3 class="text-[9px] font-black uppercase tracking-[0.2em] mb-1 opacity-80">${statusLabel}</h3>
                    <p class="text-sm font-black text-slate-900 leading-tight uppercase">${conflict.village}</p>
                </div>
                <div class="space-y-3 mt-4">
                    <p class="text-xs text-slate-600 leading-relaxed font-medium">"${conflict.description.substring(0, 120)}${conflict.description.length > 120 ? '...' : ''}"</p>
                    <div class="flex items-center justify-between pt-3 border-t border-slate-100">
                        <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">${conflict.type}</span>
                        <span class="text-[9px] font-bold text-slate-500">${conflict.reportedDate}</span>
                    </div>
                </div>
            `;

            marker.bindPopup(popupContent);
            layers.conflicts.addLayer(marker);

            if (selectedId === conflict.id) {
                map.flyTo([conflict.latitude, conflict.longitude], 13);
            }
        });

        // Ajout du patrimoine (NOUVEAU)
        heritage.forEach(item => {
            if (!item.latitude || !item.longitude) return;
            const marker = L.marker([item.latitude, item.longitude], {
                icon: createCustomIcon('heritage', { category: item.category })
            });

            const popupContent = document.createElement('div');
            popupContent.className = 'p-4 min-w-[220px] font-sans';
            popupContent.innerHTML = `
                <div class="flex items-center gap-3 mb-3">
                    <div class="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                    </div>
                    <div>
                        <h3 class="text-sm font-black text-slate-900 uppercase tracking-tight">${item.name}</h3>
                        <p class="text-[9px] font-bold text-amber-600 uppercase tracking-widest">${heritageCategoryLabels[item.category]}</p>
                    </div>
                </div>
                <p class="text-xs text-slate-500 line-clamp-2 italic mb-3">"${item.description}"</p>
                <div class="pt-2 border-t border-slate-50">
                     <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 line-clamp-1">
                        📍 ${item.village || 'Région'}, ${item.region}
                     </p>
                </div>
            `;

            marker.bindPopup(popupContent);
            layers.heritage.addLayer(marker);

            if (selectedId === item.id) {
                map.flyTo([item.latitude, item.longitude], 14);
            }
        });

        // Visibilité initiale
        if (activeLayers.chiefs) map.addLayer(layers.chiefs);
        if (activeLayers.conflicts) map.addLayer(layers.conflicts);
        if (activeLayers.heritage) map.addLayer(layers.heritage);
        if (activeLayers.proximity) map.addLayer(layers.proximity);

    }, [mapReady, chiefs, conflicts, heritage, selectedId, L]);

    // Toggles
    const toggleLayer = (layer: keyof typeof activeLayers) => {
        if (!mapRef.current || !layersRef.current[layer]) return;
        const map = mapRef.current;
        const target = layersRef.current[layer];

        const newState = !activeLayers[layer];
        if (newState) {
            map.addLayer(target);
        } else {
            map.removeLayer(target);
        }
        setActiveLayers(prev => ({ ...prev, [layer]: newState }));
    };

    if (typeof window === 'undefined' || !isClient) {
        return <div className={cn("bg-slate-50 relative map-container-dynamic", className)} />;
    }

    return (
        <div 
            className={cn("bg-slate-50 relative group rounded-xl overflow-hidden shadow-2xl border border-slate-200 map-container-dynamic", className)}
        >
            <style jsx>{`
                .map-container-dynamic {
                    min-height: ${height};
                }
            `}</style>
            <div key={instanceId} ref={mapContainerRef} className="absolute inset-0 z-0" id={instanceId} />

            {/* Overlay de Chargement */}
            {!mapReady && (
                <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">Initialisation SIG CNRCT...</p>
                </div>
            )}

            {/* Barre de Contrôle Flottante */}
            {mapReady && (
                <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                    <div className="bg-white/90 backdrop-blur-md p-1 rounded-xl shadow-xl border border-white/50 flex flex-col gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg hover:bg-blue-50 text-slate-600"
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

            {/* Menu des Couches Premium */}
            {showFilters && mapReady && (
                <div className="absolute bottom-6 left-6 z-10">
                    <div className="bg-slate-900/90 backdrop-blur-xl p-2 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-2">
                        <button
                            onClick={() => toggleLayer('chiefs')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                                activeLayers.chiefs ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "text-slate-400 hover:text-white"
                            )}
                        >
                            <User className="h-3.5 w-3.5" />
                            Chefs
                        </button>
                        <button
                            onClick={() => toggleLayer('conflicts')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                                activeLayers.conflicts ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30" : "text-slate-400 hover:text-white"
                            )}
                        >
                            <MapPin className="h-3.5 w-3.5" />
                            Conflits
                        </button>
                        <button
                            onClick={() => toggleLayer('heritage')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                                activeLayers.heritage ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30" : "text-slate-400 hover:text-white"
                            )}
                        >
                            <Info className="h-3.5 w-3.5" />
                            Patrimoine
                        </button>
                        <div className="w-px h-6 bg-white/10 mx-1" />
                    </div>
                </div>
            )}
        </div>
    );
}

