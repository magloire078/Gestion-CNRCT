"use client";

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { cn } from "@/lib/utils";
import { Loader2, Crown, Navigation } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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

    // Helper to extract common fields
    const getMemberData = (member: MapMember) => {
        const name = member.name || `${member.lastName || ''} ${member.firstName || ''}`.trim();
        const photo = member.photoUrl || member.Photo;
        const region = member.region || member.Region || "Inconnue";
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

        // Côte d'Ivoire view
        const map = L.map(mapContainerRef.current, {
            center: [7.539989, -5.547080],
            zoom: 7,
            scrollWheelZoom: false,
            zoomControl: false
        });

        // Elegant Dark Matter theme
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
        }).addTo(map);

        const markers = L.markerClusterGroup({
            showCoverageOnHover: false,
            spiderfyOnMaxZoom: true,
            zoomToBoundsOnClick: true,
            iconCreateFunction: (cluster) => {
                const count = cluster.getChildCount();
                return L.divIcon({
                    html: `<div class="flex items-center justify-center w-10 h-10 rounded-full bg-[#D4AF37] border-2 border-white shadow-xl text-white font-black text-xs">
                             ${count}
                           </div>`,
                    className: 'custom-cluster-icon',
                    iconSize: [40, 40]
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
                        <div class="relative group cursor-pointer">
                            <div class="w-12 h-12 rounded-2xl border-2 border-[#D4AF37] shadow-2xl overflow-hidden bg-white transform transition-all duration-300 group-hover:scale-125 group-hover:-translate-y-2">
                                ${member.photo 
                                    ? `<img src="${member.photo}" class="w-full h-full object-cover" />`
                                    : `<div class="w-full h-full flex items-center justify-center bg-slate-100"><span class="text-xs font-black text-slate-400 capitalize">${(member.name || "?")[0]}</span></div>`
                                }
                            </div>
                            <div class="absolute -bottom-1 -right-1 w-5 h-5 bg-[#D4AF37] rounded-lg flex items-center justify-center shadow-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>
                            </div>
                        </div>
                    `,
                    className: 'custom-marker',
                    iconSize: [48, 48],
                    iconAnchor: [24, 48]
                })
            });

            const popupContent = `
                <div class="p-4 min-w-[200px] bg-slate-900 text-white rounded-2xl">
                    <div class="flex items-center gap-3 mb-3 border-b border-white/10 pb-3">
                        <div class="w-12 h-12 rounded-xl overflow-hidden border border-[#D4AF37]/50 shadow-lg">
                            <img src="${member.photo || 'https://api.dicebear.com/7.x/initials/svg?seed=' + member.name}" class="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h4 class="text-xs font-black text-[#D4AF37] uppercase tracking-wider">${member.name}</h4>
                            <p class="text-[9px] text-slate-400 font-bold uppercase">${member.role}</p>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <div class="flex items-center gap-2">
                            <div class="w-5 h-5 rounded-lg bg-white/5 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            </div>
                            <p class="text-[9px] font-bold text-slate-300 uppercase letter-wider">${member.region}</p>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="w-5 h-5 rounded-lg bg-white/5 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                            </div>
                            <p class="text-xs font-medium text-slate-100">${member.locality}</p>
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
            map.fitBounds(group.getBounds().pad(0.1), { animate: true });
        }
    }, [mapReady, validMembers]);

    if (!isClient) {
        return <div className={cn("bg-muted rounded-2xl flex items-center justify-center min-h-[600px]", className)}>
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>;
    }

    return (
        <div 
            id="map-visualization"
            className={cn("relative rounded-2xl overflow-hidden shadow-2xl border-2 border-[#D4AF37]/20 bg-white min-h-[600px]", className)} 
        >
            <div ref={mapContainerRef} className="absolute inset-0 z-0" />
            
            {/* Elegant Header Overlay */}
            <div className="absolute top-0 left-0 right-0 z-[1000] p-6 pointer-events-none">
                <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl inline-block pointer-events-auto">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#D4AF37] flex items-center justify-center shadow-lg shadow-[#D4AF37]/20">
                            <Crown className="w-5 h-5 text-white stroke-[2.5]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white uppercase tracking-tighter leading-tight">{title}</h2>
                            <p className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest leading-none mt-1">{subtitle}</p>
                        </div>
                        <div className="ml-6 pl-6 border-l border-white/10 flex items-center gap-6">
                            <div className="text-center">
                                <span className="block text-xl font-black text-white leading-none">${members.length}</span>
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Membres</span>
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
                            mapInstanceRef.current.setView([7.539989, -5.547080], 7);
                        }
                    }}
                    title="Recentrer"
                    className="p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl hover:bg-white transition-all group border border-slate-200"
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
                    background: #111 !important;
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
            ` }} />
        </div>
    );
};
