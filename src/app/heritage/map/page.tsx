"use client";

import { useState, useEffect } from "react";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { getAllHeritageItems } from "@/services/heritage-service";
import type { HeritageItem } from "@/types/heritage";
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Map } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const GISMap = dynamic(() => import('@/components/common/gis-map-v3').then(m => m.GISMap), {
    ssr: false,
    loading: () => (
        <div className="h-[calc(100vh-10rem)] w-full rounded-2xl overflow-hidden shadow-2xl relative">
            <Skeleton className="h-full w-full absolute inset-0" />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 backdrop-blur-sm z-10">
                <div className="h-16 w-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-4 animate-pulse">
                    <Map className="h-8 w-8 text-amber-500" />
                </div>
                <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Chargement de la cartographie...</p>
            </div>
        </div>
    ),
});

export default function HeritageMapPage() {
    const [heritageItems, setHeritageItems] = useState<HeritageItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAllHeritageItems()
            .then(setHeritageItems)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <PermissionGuard permission="page:heritage:view">
            <div className="flex flex-col gap-6 px-4 lg:px-5 py-6 h-[calc(100vh-4rem)]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200">
                                <Link href="/heritage">
                                    <ArrowLeft className="h-4 w-4" />
                                </Link>
                            </Button>
                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest text-amber-600 border-amber-200 bg-amber-50 px-2 py-0.5 rounded shadow-sm">
                                Cartographie
                            </Badge>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                            Carte Interactive du Patrimoine
                        </h1>
                    </div>
                </div>

                <div className="flex-1 min-h-0 bg-white rounded-2xl shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100">
                    <GISMap 
                        heritage={heritageItems} 
                        height="100%"
                    />
                </div>
            </div>
        </PermissionGuard>
    );
}
