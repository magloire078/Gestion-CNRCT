"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { Loader2, MapPin, User, Camera, Download, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Employe } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Coordonnées centrales approximatives des régions de Côte d'Ivoire
const REGION_COORDS: Record<string, [number, number]> = {
    "Abidjan": [5.3613, -3.9935],
    "Agnéby-Tiassa": [5.9255, -4.2188],
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
    "Yamoussoukro": [6.8276, -5.2893]
};

interface DirectoireMapProps {
    members: Employe[];
    className?: string;
}

export function DirectoireMapComponent({ members, className }: DirectoireMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const [isClient, setIsClient] = useState(false);
    const [L, setL] = useState<any>(null);
    const [mapReady, setMapReady] = useState(false);

    useEffect(() => {
        setIsClient(true);
        const initLeaflet = async () => {
            const Leaflet = (await import('leaflet')).default;
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

    const handleCapture = useCallback(async () => {
        if (!mapContainerRef.current) return;
        try {
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(mapContainerRef.current, {
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: false,
                scale: 2, // Better quality
            });
            const link = document.createElement('a');
            link.download = `cartographie-directoire-${new Date().toISOString().substring(0, 10)}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('Error capturing map:', error);
        }
    }, [mapContainerRef]);

    useEffect(() => {
        if (!L || !mapContainerRef.current || mapRef.current) return;

        const container = mapContainerRef.current;
        if ((container as any)._leaflet_id) return;

        const map = L.map(container, {
            center: [7.539989, -5.54708],
            zoom: 6,
            zoomControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        mapRef.current = map;
        setMapReady(true);
    }, [L]);

    useEffect(() => {
        if (!mapReady || !L || !mapRef.current) return;

        const map = mapRef.current;
        // Clean existing markers if any (though we only init once here)
        map.eachLayer((layer: any) => {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });

        members.forEach((member, index) => {
            const region = member.Region || member.department; // Fallback
            if (!region) return;

            const coords = REGION_COORDS[region];
            if (!coords) return;

            // Deterministic offset based on member ID to prevent markers from jumping
            const idSeed = member.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + index;
            const latOffset = ((idSeed % 100) / 100 - 0.5) * 0.1;
            const lngOffset = (((idSeed * 13) % 100) / 100 - 0.5) * 0.1;

            const lat = coords[0] + latOffset;
            const lng = coords[1] + lngOffset;

            const icon = L.divIcon({
                className: 'custom-member-icon',
                html: `
                    <div class="flex flex-col items-center group cursor-pointer transition-transform hover:scale-110">
                        <div class="relative">
                            <div class="w-12 h-12 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-primary/10 ring-2 ring-primary/20">
                                <img src="${member.photoUrl || member.Photo || '#'}" class="w-full h-full object-cover" onerror="this.src='https://api.dicebear.com/7.x/initials/svg?seed=${member.name}'" />
                            </div>
                            <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div class="mt-1 bg-white/40 backdrop-blur-md px-1 md:px-1.5 py-0.5 rounded-full shadow-lg border border-white/20 whitespace-nowrap text-center scale-[0.6] sm:scale-75 origin-top transition-all group-hover:scale-100 min-w-[50px] md:min-w-[80px] print:scale-50 print:min-w-[50px]">
                            <p class="text-[6px] md:text-[7px] font-black text-[#006039] leading-tight uppercase tracking-tight">${member.name}</p>
                            <p class="text-[5px] md:text-[6px] text-[#D4AF37] font-bold uppercase tracking-widest mt-0">${region}</p>
                        </div>
                    </div>
                `,
                iconSize: [120, 100],
                iconAnchor: [60, 48],
                popupAnchor: [0, -48]
            });

            const marker = L.marker([lat, lng], { icon }).addTo(map);

            const popupContent = document.createElement('div');
            popupContent.className = 'custom-glass-popup p-1.5 min-w-[180px] text-center rounded-xl overflow-hidden';
            popupContent.innerHTML = `
                <div class="flex flex-col items-center gap-1.5">
                    <div class="relative w-14 h-14 rounded-full border-2 border-[#D4AF37]/50 overflow-hidden shadow-inner bg-white/20 backdrop-blur-sm">
                        <img src="${member.photoUrl || member.Photo || '#'}" class="w-full h-full object-cover" onerror="this.src='https://api.dicebear.com/7.x/initials/svg?seed=${member.name}'" />
                    </div>
                    <div>
                        <h3 class="font-bold text-[11px] text-[#006039] leading-tight mb-0.5 uppercase">${member.name}</h3>
                        <p class="text-[8px] text-[#D4AF37] font-semibold uppercase tracking-wider mb-1">${member.poste}</p>
                        <p class="text-[9px] font-bold text-gray-700/80 mb-2 flex items-center justify-center gap-1">📍 <span class="uppercase">${region}</span></p>
                    </div>
                    <a href="/employees/${member.id}" class="inline-flex items-center justify-center px-4 py-1.5 bg-[#006039]/90 text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-md hover:bg-[#004d2e] transition-all transform hover:scale-105 active:scale-95">Profil Complet</a>
                </div>
            `;
            marker.bindPopup(popupContent, {
                className: 'glass-popup-container',
                maxWidth: 220
            });
        });
    }, [mapReady, L, members]);

    const handlePrint = useCallback(async () => {
        if (!mapContainerRef.current) return;
        try {
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(mapContainerRef.current, {
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                scale: 2,
            });
            const dataUrl = canvas.toDataURL('image/png');
            
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>Impression Cartographie Directoire</title>
                            <style>
                                body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                                img { max-width: 100%; height: auto; }
                                @media print {
                                    body { margin: 0; }
                                    img { width: 100%; height: auto; }
                                }
                            </style>
                        </head>
                        <body>
                            <img src="${dataUrl}" onload="window.print(); window.close();" />
                        </body>
                    </html>
                `);
                printWindow.document.close();
            }
        } catch (error) {
            console.error('Error printing map:', error);
            // Fallback to native print if capture fails
            window.print();
        }
    }, [mapContainerRef]);

    if (!isClient) {
        return <div className={cn("bg-muted rounded-2xl flex items-center justify-center", className)} style={{ minHeight: '700px' }}>
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>;
    }

    return (
        <div 
            id="print-section"
            className={cn("relative rounded-2xl overflow-hidden shadow-2xl border-2 border-[#D4AF37]/20 bg-white", className)} 
            style={{ minHeight: '700px' }}
        >
            <div ref={mapContainerRef} className="absolute inset-0 z-0" />
            {!mapReady && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end print:hidden">
                <div className="bg-white/40 backdrop-blur-lg p-1.5 rounded-xl shadow-lg border border-white/20 flex items-center gap-2">
                    <h4 className="font-bold text-[9px] uppercase tracking-wider text-[#006039] flex items-center gap-1.5">
                        <User className="w-2 h-2" />
                        Cartographie
                    </h4>
                    <div className="h-3 w-[1px] bg-black/10" />
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-[#006039] hover:bg-white/40"
                        onClick={handleCapture}
                        title="Capturer la carte"
                    >
                        <Camera className="h-3 w-3" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-[#006039] hover:bg-white/40"
                        onClick={handlePrint}
                        title="Imprimer la carte"
                    >
                        <Printer className="h-3 w-3" />
                    </Button>
                </div>
            </div>
            <style dangerouslySetInnerHTML={{ __html: `
                .glass-popup-container .leaflet-popup-content-wrapper {
                    background: rgba(255, 255, 255, 0.45) !important;
                    backdrop-filter: blur(12px) !important;
                    -webkit-backdrop-filter: blur(12px) !important;
                    border: 1px solid rgba(255, 255, 255, 0.3) !important;
                    box-shadow: 0 8px 32px 0 rgba(0, 96, 57, 0.15) !important;
                    border-radius: 1rem !important;
                    padding: 0 !important;
                }
                .glass-popup-container .leaflet-popup-content {
                    margin: 0 !important;
                    width: auto !important;
                }
                .glass-popup-container .leaflet-popup-tip {
                    background: rgba(255, 255, 255, 0.45) !important;
                    backdrop-filter: blur(12px) !important;
                    -webkit-backdrop-filter: blur(12px) !important;
                    border-left: 1px solid rgba(255, 255, 255, 0.3) !important;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.3) !important;
                }
                .leaflet-container {
                    font-family: inherit !important;
                }
            `}} />
        </div>
    );
}

export const DirectoireMap = React.memo(DirectoireMapComponent);
