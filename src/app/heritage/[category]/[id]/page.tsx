"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    ArrowLeft, MapPin, History, 
    Landmark, Globe, Users, 
    Loader2, Edit3, Trash2,
    Calendar, Share2, Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getHeritageItem, deleteHeritageItem } from "@/services/heritage-service";
import type { HeritageItem, HeritageCategory } from "@/types/heritage";
import { heritageCategoryLabels } from "@/types/heritage";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { useToast } from "@/hooks/use-toast";
import dynamic from 'next/dynamic';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

import 'leaflet/dist/leaflet.css';

export default function HeritageDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { id, category } = params;
    
    const [item, setItem] = useState<HeritageItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (!id) return;
        const fetchItem = async () => {
            try {
                const data = await getHeritageItem(id as string);
                setItem(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchItem();
    }, [id]);

    const handleDelete = async () => {
        if (!id) return;
        try {
            await deleteHeritageItem(id as string);
            toast({
                title: "Élément archivé",
                description: "L'élément a été retiré du répertoire national.",
            });
            router.push(`/heritage/${category}`);
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Impossible de retirer cet élément.",
            });
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Récupération des archives...</p>
            </div>
        );
    }

    if (!item) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                <div className="h-24 w-24 bg-slate-100 rounded-full flex items-center justify-center">
                    <History className="h-10 w-10 text-slate-300" />
                </div>
                <h1 className="text-2xl font-black text-slate-900 uppercase">Archive Introuvable</h1>
                <Button onClick={() => router.push(`/heritage/${category}`)} className="rounded-xl px-8">
                    Retour au répertoire
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Action Bar */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" className="rounded-xl font-bold" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                </Button>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="rounded-xl h-10 w-10 p-0">
                        <Share2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="rounded-xl h-10 w-10 p-0" onClick={() => window.print()}>
                        <Printer className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" className="rounded-xl h-10 px-4 font-bold" onClick={() => setIsDeleteDialogOpen(true)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Archiver
                    </Button>
                </div>
            </div>

            {/* Hero Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                <div className="space-y-8">
                    <div className="space-y-4">
                        <Badge className="bg-blue-600/10 text-blue-600 border-none font-black text-[10px] uppercase tracking-[0.2em] px-4 py-1">
                            {heritageCategoryLabels[item.category as HeritageCategory] || item.category}
                        </Badge>
                        <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none uppercase">
                            {item.name}
                        </h1>
                        <div className="flex flex-wrap items-center gap-6 pt-2">
                            <div className="flex items-center gap-2 text-slate-500 font-bold">
                                <Users className="h-5 w-5 text-blue-500" />
                                <span>Groupe : <span className="text-slate-900 underline decoration-blue-500/30">{item.ethnicGroup || "Traditionnel"}</span></span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 font-bold">
                                <MapPin className="h-5 w-5 text-rose-500" />
                                <span>Localité : <span className="text-slate-900 underline decoration-rose-500/30">{item.region}, {item.village || "Plusieurs localités"}</span></span>
                            </div>
                        </div>
                    </div>

                    <Card className="border-none shadow-2xl shadow-blue-900/10 rounded-[2.5rem] bg-gradient-to-br from-white to-blue-50/30 p-8">
                        <CardHeader className="p-0 mb-6">
                            <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                                <Landmark className="h-5 w-5 text-blue-600" />
                                Signification Culturelle
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <p className="text-lg text-slate-600 leading-relaxed italic font-medium">
                                "{item.significance || item.description}"
                            </p>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col gap-2">
                            <History className="h-5 w-5 text-slate-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contexte Historique</span>
                            <p className="text-xs font-bold text-slate-700 leading-relaxed">
                                {item.historicalContext || "Le récit historique est en cours de documentation par les services du CNRCT."}
                            </p>
                        </div>
                        <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col gap-2">
                            <Calendar className="h-5 w-5 text-slate-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date d'archivage</span>
                            <p className="text-xs font-black text-slate-900">
                                {item.createdAt ? new Date(item.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : "N/A"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-8 h-full">
                    {/* Image Preview */}
                    <div className="rounded-[3rem] overflow-hidden shadow-2xl shadow-blue-900/20 aspect-[4/3] relative group group bg-slate-100">
                        {item.imageUrl ? (
                            <img 
                                src={item.imageUrl} 
                                alt={item.name} 
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center flex-col gap-4 text-slate-300">
                                <Globe className="h-20 w-20" />
                                <span className="font-black text-xs uppercase tracking-widest">Image non disponible</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />
                        <div className="absolute bottom-6 left-8 flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                <Globe className="h-6 w-6 text-white" />
                            </div>
                            <div className="text-white">
                                <p className="text-[10px] font-black uppercase tracking-widest">Patrimoine National</p>
                                <p className="text-xs font-bold opacity-80 decoration-none">ID: {item.id.slice(0, 8)}...</p>
                            </div>
                        </div>
                    </div>

                    {/* Geographical Location */}
                    {item.latitude && item.longitude && (
                        <div className="rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl h-[500px] relative">
                            <MapContainer 
                                center={[item.latitude, item.longitude]} 
                                zoom={13} 
                                style={{ height: '100%', width: '100%', zIndex: 0 }}
                                zoomControl={false}
                            >
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <Marker position={[item.latitude, item.longitude]}>
                                    <Popup>
                                        <div className="font-bold">{item.name}</div>
                                        <div className="text-[10px] uppercase text-slate-400">{item.village}</div>
                                    </Popup>
                                </Marker>
                            </MapContainer>
                            <div className="absolute top-4 left-4 z-[400]">
                                <Badge className="bg-white/90 backdrop-blur-md text-slate-900 hover:bg-white/90 border-none font-black text-[9px] uppercase tracking-widest shadow-xl px-4 py-2 rounded-full">
                                    Localisation SIG
                                </Badge>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmationDialog 
                isOpen={isDeleteDialogOpen}
                title="Archivage Définitif"
                description={`Confirmez-vous que "${item.name}" doit être retiré du répertoire ? Cette archive sera conservée dans les registres confidentiels.`}
                onConfirmAction={handleDelete}
                onCloseAction={() => setIsDeleteDialogOpen(false)}
            />
        </div>
    );
}
