"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, MapPin, Users, Building2, Download, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { injectKingdomsAsChiefs } from "@/services/chief-service";
import kingdomsData from "@/data/kingdoms.json";

export default function KingdomsPage() {
    const { toast } = useToast();
    const [isInjecting, setIsInjecting] = useState(false);

    const handleInject = async () => {
        setIsInjecting(true);
        try {
            const count = await injectKingdomsAsChiefs();
            toast({
                title: "Intégration réussie",
                description: `${count} Rois ont été intégrés ou mis à jour dans le registre des autorités.`,
                variant: "default",
            });
        } catch (error: any) {
            toast({
                title: "Erreur d'intégration",
                description: error.message || "Une erreur est survenue lors de l'intégration.",
                variant: "destructive",
            });
        } finally {
            setIsInjecting(false);
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-500 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                        <Crown className="h-10 w-10 text-amber-500" />
                        Grands Royaumes
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium text-lg max-w-2xl">
                        Hiérarchie suprême et architecture territoriale des royaumes historiques de Côte d'Ivoire.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        onClick={handleInject} 
                        disabled={isInjecting}
                        className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 font-bold"
                    >
                        {isInjecting ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4 mr-2" />
                        )}
                        Intégrer Rois au Registre
                    </Button>
                </div>
            </div>

            {/* Kingdoms Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {kingdomsData.map((kingdom, idx) => (
                    <motion.div
                        key={kingdom.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: idx * 0.1 }}
                    >
                        <Card className="h-full border-none shadow-xl shadow-slate-200/40 rounded-2xl overflow-hidden group hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-500 bg-white/70 backdrop-blur-xl relative">
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-400 to-amber-600 opacity-80 group-hover:opacity-100 transition-opacity" />
                            
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start mb-2">
                                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-none font-bold uppercase tracking-widest text-[10px]">
                                        Royaume
                                    </Badge>
                                </div>
                                <CardTitle className="text-2xl font-black text-slate-900 leading-tight">
                                    {kingdom.nom}
                                </CardTitle>
                                <CardDescription className="text-slate-500 font-bold flex items-center gap-1.5 mt-1">
                                    <Users className="w-3.5 h-3.5" />
                                    Peuple {kingdom.peuple}
                                </CardDescription>
                            </CardHeader>
                            
                            <CardContent className="space-y-6">
                                {/* Sovereign Section */}
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 group-hover:bg-amber-50/50 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                                            <Crown className="h-5 w-5 text-amber-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-900 text-sm">{kingdom.souverain.nom_trone}</h4>
                                            <p className="text-xs text-slate-500 font-medium mt-0.5">{kingdom.souverain.statut}</p>
                                            <div className="flex items-center gap-1.5 mt-2">
                                                <Badge variant="outline" className="bg-white border-slate-200 text-[9px] font-bold">
                                                    Intronisé en {new Date(kingdom.souverain.date_intronisation).getFullYear()}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Geography Section */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                                            <Building2 className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Siège Traditionnel</p>
                                            <p className="font-bold text-slate-700">{kingdom.capitale_traditionnelle}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Zone d'influence</p>
                                            <p className="font-bold text-slate-700">{kingdom.coordonnees_siege.departement}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
