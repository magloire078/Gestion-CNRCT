
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAsset } from "@/services/asset-service";
import type { Asset } from "@/lib/data";
import { EditAssetForm } from "@/components/it-assets/edit-asset-form";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Loader2, Laptop } from "lucide-react";
import Link from "next/link";

export default function EditAssetPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { hasPermission } = useAuth();
    
    const [asset, setAsset] = useState<Asset | null>(null);
    const [loading, setLoading] = useState(true);

    const assetId = params.id as string;

    useEffect(() => {
        // Using view permission for now as it's the primary one for it-assets
        if (!hasPermission('page:it-assets:view')) {
            toast({
                variant: "destructive",
                title: "Accès refusé",
                description: "Vous n'avez pas les permissions nécessaires pour modifier les actifs."
            });
            router.push("/it-assets");
            return;
        }

        if (!assetId) return;

        getAsset(assetId)
            .then(data => {
                if (data) {
                    setAsset(data);
                } else {
                    toast({
                        variant: "destructive",
                        title: "Erreur",
                        description: "Actif non trouvé."
                    });
                    router.push("/it-assets");
                }
            })
            .catch(err => {
                console.error(err);
                toast({
                    variant: "destructive",
                    title: "Erreur",
                    description: "Une erreur est survenue lors du chargement de l'actif."
                });
            })
            .finally(() => setLoading(false));
    }, [assetId, router, toast, hasPermission]);

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto space-y-8 animate-pulse p-8">
                <div className="h-10 w-48 bg-slate-100 rounded-lg" />
                <div className="h-64 bg-slate-50 rounded-[2rem]" />
                <div className="h-96 bg-slate-50 rounded-[2rem]" />
            </div>
        );
    }

    if (!asset) return null;

    return (
        <div className="flex flex-col gap-10 pb-20">
             {/* --- PREMIUM EDIT HEADER --- */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 md:p-12 shadow-2xl border border-white/10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(59,130,246,0.15),transparent)] opacity-50" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-4">
                        <Link 
                            href={`/it-assets/${asset.tag}`} 
                            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-blue-400 hover:text-blue-300 transition-colors group"
                        >
                            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Retour à la fiche
                        </Link>
                        <div className="space-y-1">
                            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase leading-tight">
                                Mise à jour <br/> 
                                <span className="text-slate-500 font-medium tracking-tight normal-case">{asset.modele}</span>
                            </h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2">
                                <Loader2 className="h-3 w-3 animate-spin" /> Édition sécurisée de l'actif informatique
                            </p>
                        </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md hidden md:flex flex-col items-center gap-2">
                         <div className="h-12 w-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30">
                            <Laptop className="h-6 w-6" />
                         </div>
                         <div className="text-center">
                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">ID INVENTAIRE</div>
                            <div className="text-xl font-bold text-white tracking-widest">{asset.tag}</div>
                         </div>
                    </div>
                </div>
            </div>
            
            <div className="relative z-10 px-4 md:px-0">
                <EditAssetForm asset={asset} />
            </div>
        </div>
    );
}
