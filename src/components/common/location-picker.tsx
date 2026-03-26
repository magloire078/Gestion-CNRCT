"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Navigation, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { searchLocation, type GeocodingResult } from '@/services/geocoding-service';
import { cn } from '@/lib/utils';

interface LocationPickerProps {
    onLocationSelectAction: (lat: number, lng: number, address?: string) => void;
    initialLat?: number;
    initialLng?: number;
    className?: string;
}

export function LocationPicker({ 
    onLocationSelectAction, 
    initialLat, 
    initialLng,
    className 
}: LocationPickerProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    
    const [L, setL] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
    const [isLocating, setIsLocating] = useState(false);

    // Charger Leaflet
    useEffect(() => {
        if (typeof window === 'undefined') return;
        
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

    // Initialiser la carte
    useEffect(() => {
        if (!L || !mapContainerRef.current || mapRef.current) return;

        const container = mapContainerRef.current;
        if ((container as any)._leaflet_id) return;

        const center: [number, number] = initialLat && initialLng 
            ? [initialLat, initialLng] 
            : [7.539989, -5.54708]; // Centre Côte d'Ivoire

        const map = L.map(container, {
            center,
            zoom: initialLat ? 14 : 6,
            zoomControl: false
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        mapRef.current = map;

        // Créer un marqueur si coordonnées initiales
        if (initialLat && initialLng) {
            markerRef.current = L.marker([initialLat, initialLng], {
                draggable: true
            }).addTo(map);

            markerRef.current.on('dragend', (e: any) => {
                const { lat, lng } = e.target.getLatLng();
                onLocationSelectAction(lat, lng);
            });
        }

        // Click sur la carte pour placer le marqueur
        map.on('click', (e: any) => {
            const { lat, lng } = e.latlng;
            updateMarker(lat, lng);
            onLocationSelectAction(lat, lng);
        });

    }, [L, initialLat, initialLng]);

    const updateMarker = (lat: number, lng: number, zoomLevel?: number) => {
        if (!L || !mapRef.current) return;

        if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
        } else {
            markerRef.current = L.marker([lat, lng], {
                draggable: true
            }).addTo(mapRef.current);

            markerRef.current.on('dragend', (e: any) => {
                const { lat, lng } = e.target.getLatLng();
                onLocationSelectAction(lat, lng);
            });
        }

        if (zoomLevel) {
            mapRef.current.flyTo([lat, lng], zoomLevel);
        } else {
            mapRef.current.panTo([lat, lng]);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery || searchQuery.length < 3) return;
        setIsSearching(true);
        const results = await searchLocation(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
    };

    const selectResult = (result: GeocodingResult) => {
        updateMarker(result.lat, result.lng, 15);
        onLocationSelectAction(result.lat, result.lng, result.displayName);
        setSearchResults([]);
        setSearchQuery(result.name);
    };

    const handleCurrentLocation = () => {
        if (!navigator.geolocation) return;
        
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                updateMarker(latitude, longitude, 16);
                onLocationSelectAction(latitude, longitude);
                setIsLocating(false);
            },
            (err) => {
                console.error(err);
                setIsLocating(false);
            }
        );
    };

    return (
        <div className={cn("flex flex-col gap-4", className)}>
            <div className="flex gap-2 relative">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Rechercher un lieu (ex: Bouaké, Cocody...)" 
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                    />
                    {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-[1000] mt-1 bg-white border rounded-lg shadow-xl max-h-60 overflow-y-auto">
                            {searchResults.map((res, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm border-b last:border-0"
                                    onClick={() => selectResult(res)}
                                >
                                    <p className="font-bold">{res.name}</p>
                                    <p className="text-xs text-muted-foreground line-clamp-1">{res.displayName}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={handleSearch}
                    disabled={isSearching}
                >
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Trouver"}
                </Button>
                <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCurrentLocation}
                    disabled={isLocating}
                    title="Ma position actuelle"
                >
                    {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                </Button>
            </div>

            <div className="relative h-[500px] w-full rounded-xl border border-slate-200 overflow-hidden bg-slate-100">
                <div ref={mapContainerRef} className="absolute inset-0 z-0 h-full w-full" />
                <div className="absolute bottom-3 left-3 z-[400] bg-white/80 backdrop-blur-sm p-2 rounded-lg text-[10px] text-slate-600 border shadow-sm">
                    <p className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Cliquez pour choisir ou déplacez le marqueur</p>
                </div>
            </div>
        </div>
    );
}
