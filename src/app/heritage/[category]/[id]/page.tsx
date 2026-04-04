"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    ArrowLeft, MapPin, History, 
    Landmark, Globe, Users, 
    Loader2, Edit3, Trash2,
    Calendar, Share2, Printer,
    Sparkles, BookOpen, Hammer, 
    Compass, ShieldCheck, Quote,
    Maximize2
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
import { HeritageGallery } from "@/components/heritage/heritage-gallery";
import { OralHistoryPlayer } from "@/components/heritage/oral-history-player";
import { cn } from "@/lib/utils";

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
        <div className="max-w-7xl mx-auto pb-20 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Header / Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                <Button 
                    variant="ghost" 
                    className="w-fit rounded-xl font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest text-[10px]" 
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Retour au répertoire
                </Button>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-2xl h-12 w-12 p-0 border-slate-200 shadow-sm hover:bg-slate-50">
                        <Share2 className="h-5 w-5 text-slate-400" />
                    </Button>
                    <Button variant="outline" className="rounded-2xl h-12 w-12 p-0 border-slate-200 shadow-sm hover:bg-slate-50" onClick={() => window.print()}>
                        <Printer className="h-5 w-5 text-slate-400" />
                    </Button>
                    <div className="h-12 w-px bg-slate-100 mx-2" />
                    <Button variant="destructive" className="rounded-2xl h-12 px-6 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-500/20" onClick={() => setIsDeleteDialogOpen(true)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Archivage de sécurité
                    </Button>
                </div>
            </div>

            {/* Exhibit Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 px-4">
                
                {/* Left Column: Information & Orality */}
                <div className="space-y-12">
                    {/* Identity Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <Badge className="bg-amber-500/10 text-amber-600 border-none font-black text-[10px] uppercase tracking-[0.3em] px-4 py-2 rounded-lg">
                                {heritageCategoryLabels[item.category as HeritageCategory] || item.category}
                            </Badge>
                            <Badge variant="outline" className="border-slate-200 text-slate-400 font-bold text-[9px] uppercase tracking-widest px-3">
                                <ShieldCheck className="mr-1 h-3 w-3" /> Certifié CNRCT
                            </Badge>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.8] uppercase">
                            {item.name}
                        </h1>
                        <div className="p-6 rounded-[2.5rem] bg-slate-50 border border-slate-100/50 relative overflow-hidden group">
                           <Quote className="absolute -top-4 -left-4 h-24 w-24 text-slate-200/50 rotate-12" />
                           <p className="text-2xl text-slate-600 leading-tight font-medium italic relative z-10">
                                "{item.significance || item.description}"
                            </p>
                        </div>
                    </div>

                    {/* Multimedia: Audio Story */}
                    {item.audioUrl && (
                        <OralHistoryPlayer 
                            audioUrl={item.audioUrl} 
                            title={`Récit : ${item.name}`}
                        />
                    )}

                    {/* Anthropological Details */}
                    <div className="grid grid-cols-1 gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                    <BookOpen className="h-5 w-5 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Symbolisme & Usage</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="border-none shadow-none bg-slate-50/50 p-6 rounded-3xl space-y-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Signification Profonde</span>
                                    <p className="text-xs font-bold text-slate-600 leading-relaxed">
                                        {item.symbolism || "La symbolique profonde de cet élément est transmise de génération en génération au sein de la communauté."}
                                    </p>
                                </Card>
                                <Card className="border-none shadow-none bg-slate-50/50 p-6 rounded-3xl space-y-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Usage Rituel / Social</span>
                                    <p className="text-xs font-bold text-slate-600 leading-relaxed">
                                        {item.usage || "Pratique utilisée lors des cérémonies majeures ou des moments de cohésion sociale du groupe ethno-culturel."}
                                    </p>
                                </Card>
                            </div>
                        </div>

                        {/* Fabrication & Guardians */}
                        <div className="flex flex-col md:flex-row gap-8">
                             <div className="flex-1 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                        <Hammer className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Savoir-faire</h3>
                                </div>
                                <p className="text-sm font-semibold text-slate-500 leading-relaxed italic">
                                    {item.fabrication || "Les techniques de création ou de transmission de cet élément font partie du patrimoine immatériel protégé."}
                                </p>
                            </div>
                            <div className="w-full md:w-[200px] p-6 rounded-3xl bg-slate-900 text-white space-y-4 shadow-xl">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500">Détenteurs</span>
                                <div className="space-y-3">
                                    {(item.guardians && item.guardians.length > 0) ? item.guardians.map((g, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                            <span className="text-[10px] font-black uppercase">{g}</span>
                                        </div>
                                    )) : (
                                        <p className="text-[10px] font-black uppercase opacity-40 italic">Chefferie Locale</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Visuals & Geography */}
                <div className="space-y-12">
                    {/* Interactive Gallery */}
                    <HeritageGallery 
                        images={item.galleryUrls && item.galleryUrls.length > 0 ? [item.imageUrl || '', ...item.galleryUrls] : [item.imageUrl || '']} 
                    />

                    {/* Metadata & Origin */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col gap-3 group hover:border-blue-500/30 transition-colors">
                            <Users className="h-6 w-6 text-blue-500" />
                            <div className="space-y-0.5">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Origine Ethnique</span>
                                <span className="text-lg font-black text-slate-900 uppercase tracking-tight">{item.ethnicGroup || "Inconnu"}</span>
                            </div>
                        </div>
                        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col gap-3 group hover:border-rose-500/30 transition-colors">
                            <Compass className="h-6 w-6 text-rose-500" />
                            <div className="space-y-0.5">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Époque / Datation</span>
                                <span className="text-lg font-black text-slate-900 uppercase tracking-tight">{item.dating || "Ancestral"}</span>
                            </div>
                        </div>
                    </div>

                    {/* GIS Location Card */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                                    <MapPin className="h-5 w-5 text-rose-600" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Origine Géographique</h3>
                            </div>
                            <Badge variant="outline" className="border-slate-200 text-slate-400 font-bold text-[9px] uppercase tracking-widest px-3">
                                {item.region}
                            </Badge>
                        </div>
                        
                        {item.latitude && item.longitude ? (
                            <div className="rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl h-[400px] relative">
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
                                <div className="absolute top-6 right-6 z-[400]">
                                    <Button size="icon" className="h-12 w-12 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 shadow-2xl border-none">
                                        <Maximize2 className="h-6 w-6" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="h-[200px] rounded-[2.5rem] bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 text-slate-400">
                                <Globe className="h-10 w-10 opacity-20" />
                                <span className="text-[10px] font-black uppercase tracking-widest italic">Coordonnées GPS non répertoriées</span>
                            </div>
                        )}
                        <p className="text-center text-[10px] font-black uppercase text-slate-300 tracking-[0.3em]">Système d'Information Géographique du CNRCT - Archive Alpha 2025</p>
                    </div>
                </div>
            </div>

            <ConfirmationDialog 
                isOpen={isDeleteDialogOpen}
                title="Archivage de sécurité"
                description={`Confirmez-vous que "${item.name}" doit être retiré du répertoire public ? Cette action archive l'élément de manière sécurisée dans les registres confidentiels.`}
                onConfirmAction={handleDelete}
                onCloseAction={() => setIsDeleteDialogOpen(false)}
            />
        </div>
    );
}
