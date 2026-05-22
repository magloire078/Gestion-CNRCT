"use client";

import { useState, useEffect } from "react";
import { ChiefsMapWrapper } from "@/components/map/map-wrapper";
import { getChiefs } from "@/services/chief-service";
import type { Chief } from "@/types/chief";
import { Loader2, Map as MapIcon, Filter } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChiefQuickView } from "@/components/chiefs/chief-quick-view";

export default function GlobalMapPage() {
    const [chiefs, setChiefs] = useState<Chief[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChief, setSelectedChief] = useState<Chief | null>(null);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

    useEffect(() => {
        async function fetchChiefs() {
            try {
                const data = await getChiefs();
                setChiefs(data);
            } catch (err) {
                console.error("Failed to load chiefs for map", err);
            } finally {
                setLoading(false);
            }
        }
        fetchChiefs();
    }, []);

    const handleChiefClick = (chief: Chief) => {
        setSelectedChief(chief);
        setIsQuickViewOpen(true);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)]">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
                <p className="text-sm font-black uppercase tracking-widest text-slate-400">Chargement du Système d'Information Géographique...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-3">
                        <MapIcon className="h-8 w-8 text-blue-600" /> Cartographie SIG
                    </h1>
                    <p className="text-slate-500 font-medium">Visualisation géographique des autorités traditionnelles de Côte d'Ivoire.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="bg-white border-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest h-10 rounded-xl shadow-sm">
                        <Filter className="h-4 w-4 mr-2" />
                        Filtrer
                    </Button>
                </div>
            </div>

            <Card className="flex-1 overflow-hidden rounded-[2rem] border-white/60 shadow-2xl bg-slate-50 relative">
                <ChiefsMapWrapper 
                    chiefs={chiefs} 
                    onChiefClick={handleChiefClick} 
                    height="100%"
                />
            </Card>

            <ChiefQuickView 
                chief={selectedChief}
                isOpen={isQuickViewOpen}
                onClose={() => setIsQuickViewOpen(false)}
            />
        </div>
    );
}
