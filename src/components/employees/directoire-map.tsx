"use client";

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { cn } from "@/lib/utils";
import { Loader2, Crown, Navigation } from 'lucide-react';
import { usePermissions } from "@/hooks/use-permissions";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
if (typeof window !== 'undefined') {
    require('leaflet.markercluster');
}
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// Coordonnées centrales approximatives des régions de Côte d'Ivoire
const REGION_COORDS: Record<string, [number, number]> = {
    "Abidjan": [5.3613, -3.9935],
    "District Autonome d'Abidjan": [5.3613, -3.9935],
    "Agnéby-Tiassa": [5.9255, -4.2188],
    "Agboville": [5.9255, -4.2188],
    "Bafing": [8.2833, -7.6833],
    "Bagoué": [9.521, -6.486],
    "Bélier": [6.82, -5.27],
    "Béré": [8.0583, -6.1833],
    "Bounkani": [9.2667, -2.9833],
    "Cavally": [6.5333, -7.5],
    "Folon": [10.0, -7.8333],
    "Gbêkê": [7.6931, -5.0303],
    "Gboklè": [4.95, -6.0833],
    "Gôh": [6.1333, -5.95],
    "Gontougo": [8.0333, -2.8],
    "Grands-Ponts": [5.325, -4.375],
    "Guémon": [6.75, -7.3333],
    "Hambol": [8.1333, -5.1],
    "Haut-Sassandra": [6.8833, -6.45],
    "Iffou": [7.05, -3.9667],
    "Indénié-Djuablin": [6.7297, -3.4964],
    "Kabadougou": [9.5, -7.5667],
    "Lôh-Djiboua": [5.8333, -5.3667],
    "Marahoué": [6.9833, -5.75],
    "Mé": [6.107, -3.86],
    "Moronou": [6.65, -4.2],
    "Nawa": [5.7833, -6.6],
    "N'Zi": [6.6467, -4.705],
    "Poro": [9.458, -5.629],
    "San-Pédro": [4.7485, -6.6363],
    "Sud-Comoé": [5.4667, -3.2],
    "Tchologo": [9.6, -5.2],
    "Tonkpi": [7.4125, -7.5539],
    "Worodougou": [7.961, -6.673],
    "Yamoussoukro": [6.8276, -5.2893],
    "District Autonome de Yamoussoukro": [6.8276, -5.2893]
};

/**
 * Generic type for members that can be displayed on the map.
 * Supports both Employe and Chief types.
 */
export interface MapMember {
    id: string;
    name?: string;
    lastName?: string;
    firstName?: string;
    photoUrl?: string;
    Photo?: string; // Legacy field for Employe
    Region?: string; // For Employe
    region?: string; // For Chief
    department?: string;
    Departement?: string;
    village?: string;
    Village?: string;
    status?: string;
    poste?: string;
    role?: string;
    title?: string;
    latitude?: number;
    longitude?: number;
    bActif?: boolean;
}

interface DirectoireMapProps {
    members: MapMember[];
    className?: string;
    title?: string;
    subtitle?: string;
}

export const DirectoireMap: React.FC<DirectoireMapProps> = ({ 
    members, 
    className,
    title = "Cartographie du Directoire",
    subtitle = "Localisation géographique des membres et autorités"
}) => {
    const { canSeeGovernanceStatus } = usePermissions();
    const showStatus = canSeeGovernanceStatus();
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markerClusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [mapReady, setMapReady] = useState(false);

    useEffect(() => {
        setIsClient(true);
        // Import Leaflet plugins on client side
        import('leaflet.markercluster');
    }, []);

    // Helper to normalize region names (handles curvy vs straight apostrophes)
    const normalizeRegionName = (name: string): string => {
        if (!name) return "";
        return name.replace(/’/g, "'").trim();
    };

    // Helper to extract common fields
    const getMemberData = (member: MapMember) => {
        const name = member.name || `${member.lastName || ''} ${member.firstName || ''}`.trim();
        const photo = member.photoUrl || member.Photo;
        const rawRegion = member.region || member.Region || "Inconnue";
        const region = normalizeRegionName(rawRegion);
        const locality = member.village || member.Village || member.department || member.Departement || "";
        const role = member.role || member.title || member.poste || "Membre";
        const isActive = member.status === 'Actif' || member.bActif === true;
        
        // Priority: Exact coordinates -> Region fallback
        let lat = member.latitude;
        let lng = member.longitude;
        
        if (lat === undefined || lng === undefined) {
            const coords = REGION_COORDS[region];
            if (coords) {
                lat = coords[0];
                lng = coords[1];
            }
        }
        
        return { name, photo, region, locality, role, lat, lng, isActive };
    };

    const validMembers = useMemo(() => {
        return members.map(m => ({ ...m, ...getMemberData(m) }))
                     .filter(m => m.lat !== undefined && m.lng !== undefined);
    }, [members]);

    useEffect(() => {
        if (!isClient || !mapContainerRef.current || mapInstanceRef.current) return;

        // Côte d'Ivoire view - Lowered for a more zoomed-out start
        const map = L.map(mapContainerRef.current, {
            center: [7.539989, -5.547080],
            zoom: 6.5,
            scrollWheelZoom: true,
            zoomControl: true,
            zoomSnap: 0.25,
            zoomDelta: 0.25,
            wheelPxPerZoomLevel: 120 // Slows down wheel zoom speed (default is 60)
        });

        // ESRI World Topo Map - Rich and detailed topographic theme
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
        }).addTo(map);

        const markers = L.markerClusterGroup({
            showCoverageOnHover: false,
            spiderfyOnMaxZoom: true,
            zoomToBoundsOnClick: true,
            iconCreateFunction: (cluster) => {
                const count = cluster.getChildCount();
                return L.divIcon({
                    html: `<div class="flex items-center justify-center w-14 h-14 rounded-[1.5rem] bg-white/80 backdrop-blur-xl border border-white shadow-2xl">
                             <div class="flex items-center justify-center w-11 h-11 rounded-[1.2rem] bg-slate-900 text-white font-black text-xs shadow-lg">
                               ${count}
                             </div>
                           </div>`,
                    className: 'custom-cluster-icon',
                    iconSize: [56, 56]
                });
            }
        });

        mapInstanceRef.current = map;
        markerClusterGroupRef.current = markers;
        setMapReady(true);

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [isClient]);

    useEffect(() => {
        if (!mapReady || !markerClusterGroupRef.current || !mapInstanceRef.current) return;

        const markers = markerClusterGroupRef.current;
        const map = mapInstanceRef.current;
        markers.clearLayers();

        validMembers.forEach((member, index) => {
            // Apply slight jitter for markers at the same region centroid if needed
            let lat = member.lat!;
            let lng = member.lng!;
            
            // Check if this member is using region coords (not exact)
            const regionCoords = REGION_COORDS[member.region || ""];
            if (regionCoords && regionCoords[0] === lat && regionCoords[1] === lng) {
                const idSeed = member.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + index;
                lat += ((idSeed % 100) / 100 - 0.5) * 0.05;
                lng += (((idSeed * 13) % 100) / 100 - 0.5) * 0.05;
            }

            const marker = L.marker([lat, lng], {
                icon: L.divIcon({
                    html: `
                        <div class="flex flex-col items-center group cursor-pointer">
                            <div class="relative w-14 h-14 rounded-2xl border-4 border-white shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] overflow-hidden bg-slate-200 transform transition-all duration-500 group-hover:scale-125 group-hover:-translate-y-4 group-hover:rotate-3 group-hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
                                ${member.photo 
                                    ? `<img src="${member.photo}" class="w-full h-full object-cover" />`
                                    : `<div class="w-full h-full flex items-center justify-center bg-slate-900 text-white"><span class="text-xs font-black capitalize">${(member.name || "?")[0]}</span></div>`
                                }
                                ${showStatus && member.isActive 
                                    ? `<div class="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-lg"></div>` 
                                    : ''
                                }
                            </div>
                            <div class="mt-2 px-3 py-1 bg-slate-900 text-white text-[9px] font-black rounded-xl shadow-2xl whitespace-nowrap uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-2">
                                ${member.name}
                            </div>
                        </div>
                    `,
                    className: 'custom-marker',
                    iconSize: [80, 80],
                    iconAnchor: [40, 80]
                })
            });

            const popupContent = `
                <div class="p-0 overflow-hidden bg-slate-900 text-white rounded-[2rem] shadow-3xl border border-white/10 animate-in fade-in zoom-in duration-300">
                    <div class="h-20 bg-gradient-to-br from-slate-800 to-slate-900 relative">
                        <div class="absolute -bottom-10 left-6">
                            <div class="w-20 h-20 rounded-2xl overflow-hidden border-4 border-slate-900 shadow-2xl bg-slate-800">
                                <img src="${member.photo || 'https://api.dicebear.com/7.x/initials/svg?seed=' + member.name}" class="w-full h-full object-cover" />
                            </div>
                        </div>
                    </div>
                    <div class="pt-12 p-8 space-y-5">
                        <div class="border-b border-white/5 pb-4">
                            <h4 class="text-sm font-black text-white uppercase tracking-tighter">${member.name}</h4>
                            <div class="flex items-center gap-2 mt-1">
                                <div class="h-1 w-1 rounded-full bg-blue-500"></div>
                                <p class="text-[9px] text-blue-400 font-black uppercase tracking-widest">${member.role}</p>
                            </div>
                        </div>
                        
                        <div class="space-y-3">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                </div>
                                <div>
                                    <p class="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">Région Administrative</p>
                                    <p class="text-[10px] font-black text-slate-200 uppercase tracking-tight mt-1">${member.region}</p>
                                </div>
                            </div>
                            
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                                </div>
                                <div>
                                    <p class="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">Localité / Siège</p>
                                    <p class="text-[10px] font-bold text-slate-300 uppercase tracking-tight mt-1">${member.locality}</p>
                                </div>
                            </div>
                        </div>

                        <div class="pt-2">
                             <div class="w-full py-3 bg-white/10 rounded-xl text-center text-[9px] font-black uppercase tracking-[0.2em] hover:bg-white/20 transition-colors cursor-pointer border border-white/10">
                                Consulter Dossier
                             </div>
                        </div>
                    </div>
                </div>
            `;

            marker.bindPopup(popupContent, {
                className: 'glass-popup',
                maxWidth: 300,
                offset: [0, -35]
            });

            markers.addLayer(marker);
        });

        map.addLayer(markers);

        if (validMembers.length > 0) {
            const group = L.featureGroup(markers.getLayers());
            // Increased padding from 0.4 to 0.8 for a 'birds-eye' view
            map.fitBounds(group.getBounds().pad(0.8), { animate: true });
        }
    }, [mapReady, validMembers]);

    if (!isClient) {
        return <div className={cn("bg-muted rounded-xl flex items-center justify-center min-h-[600px]", className)}>
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>;
    }

    return (
        <div 
            id="map-visualization"
            className={cn("relative rounded-xl overflow-hidden shadow-2xl border-2 border-[#D4AF37]/20 bg-white min-h-[600px]", className)} 
        >
            <div ref={mapContainerRef} className="absolute inset-0 z-0" />
            
            {/* Elegant Header Overlay */}
            <div className="absolute top-6 left-0 right-0 z-[1000] flex justify-center pointer-events-none px-6">
                <div className="bg-white/40 backdrop-blur-2xl border border-white/40 rounded-[2.5rem] p-5 shadow-[0_32px_64px_-15px_rgba(0,0,0,0.2)] inline-block pointer-events-auto max-w-full">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-3xl bg-slate-900 flex items-center justify-center shadow-2xl shadow-slate-900/40">
                            <Crown className="w-7 h-7 text-white stroke-[2.5]" />
                        </div>
                        <div className="pr-8 border-r border-slate-200">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-tight">{title}</h2>
                            <p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] leading-none mt-1">{subtitle}</p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-left">
                                <span className="block text-2xl font-black text-slate-900 leading-none">{members.length}</span>
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Effectif Déployé</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Surveillance Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions Overlay (Bottom Right) */}
            <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-2 pointer-events-auto">
                <button 
                    onClick={() => {
                        if (mapInstanceRef.current) {
                            mapInstanceRef.current.setView([7.539989, -5.547080], 6);
                        }
                    }}
                    title="Recentrer"
                    className="p-3 bg-white/90 backdrop-blur-md rounded-lg shadow-xl hover:bg-white transition-all group border border-slate-200"
                >
                    <Navigation className="w-5 h-5 text-slate-600 group-hover:text-[#D4AF37]" />
                </button>
            </div>

            {!mapReady && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/20 backdrop-blur-sm">
                    <div className="text-center">
                        <Loader2 className="h-10 w-10 animate-spin text-[#D4AF37] mx-auto mb-4" />
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Initialisation de la carte...</p>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{ __html: `
                .glass-popup .leaflet-popup-content-wrapper {
                    background: transparent !important;
                    box-shadow: none !important;
                    padding: 0 !important;
                }
                .glass-popup .leaflet-popup-content {
                    margin: 0 !important;
                }
                .glass-popup .leaflet-popup-tip {
                    background: #0f172a !important;
                }
                .leaflet-container {
                    background: #e5e7eb !important;
                    font-family: inherit !important;
                }
                .custom-cluster-icon {
                    background: transparent !important;
                    border: none !important;
                }
                .leaflet-div-icon {
                    background: transparent !important;
                    border: none !important;
                }
                .custom-marker {
                    z-index: 1000 !important;
                }
            ` }} />
        </div>
    );
};
