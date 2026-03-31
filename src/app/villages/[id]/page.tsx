"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    ArrowLeft, MapPin, Users, 
    Landmark, Globe, History, 
    Loader2, ChevronRight, School,
    Plus, Coffee, Info, Camera,
    Home, Droplets, Zap, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getVillage } from "@/services/village-service";
import { subscribeToChiefs } from "@/services/chief-service";
import { getAllHeritageItems } from "@/services/heritage-service";
import { Village } from "@/types/village";
import { Chief } from "@/types/chief";
import { HeritageItem, HeritageCategory, heritageCategoryLabels } from "@/types/heritage";
import Link from "next/link";
import { cn } from "@/lib/utils";

const GISMap = dynamic(() => import('@/components/common/gis-map-v3').then(m => m.GISMap), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-50 flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed">
        <Loader2 className="h-8 w-8 text-slate-300 animate-spin" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Chargement de la carte...</p>
    </div>
  ),
});

export default function VillageDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;

    const [village, setVillage] = useState<Village | null>(null);
    const [chiefs, setChiefs] = useState<Chief[]>([]);
    const [heritage, setHeritage] = useState<HeritageItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        let unsubscribeChiefs: (() => void) | undefined;

        const fetchData = async () => {
            try {
                const [villageData, allHeritage] = await Promise.all([
                    getVillage(id as string),
                    getAllHeritageItems()
                ]);
                
                setVillage(villageData);
                
                // Filter heritage for this village or its ethnic groups
                const villageHeritage = allHeritage.filter(h => 
                    h.villageId === id || 
                    (h.village && h.village.toLowerCase() === villageData?.name.toLowerCase()) ||
                    (villageData?.mainEthnicGroups && h.ethnicGroup && villageData.mainEthnicGroups.includes(h.ethnicGroup))
                );
                setHeritage(villageHeritage);

                // Fetch chiefs
                unsubscribeChiefs = subscribeToChiefs(
                    (allChiefs) => {
                        setChiefs(allChiefs.filter(c => c.villageId === id));
                    },
                    (error) => console.error("Error subscribing to chiefs:", error)
                );

                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };

        fetchData();

        return () => {
            if (unsubscribeChiefs) unsubscribeChiefs();
        };
    }, [id]);

    const activeChief = useMemo(() => {
        return chiefs.find(c => c.status === 'actif' || c.status === 'a_vie');
    }, [chiefs]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
                <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Initialisation de la carte locale...</p>
            </div>
        );
    }

    if (!village) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center">
                    <MapPin className="h-10 w-10 text-slate-200" />
                </div>
                <h1 className="text-2xl font-black text-slate-900">Localité introuvable</h1>
                <Button onClick={() => router.push('/villages')} className="rounded-xl">Retour au répertoire</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 pb-20">
            {/* Village Hero Section */}
            <div className="relative h-[280px] rounded-2xl overflow-hidden bg-slate-900 group">
                {village.photoUrl ? (
                    <img src={village.photoUrl} alt={village.name} className="absolute inset-0 w-full h-full object-cover opacity-40" />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950 opacity-50" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                
                <div className="relative h-full flex flex-col justify-between p-6 md:p-8 z-10">
                    <Button variant="ghost" className="w-fit text-white/70 hover:text-white hover:bg-white/10 rounded-xl" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                    </Button>
                    
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Badge className="bg-amber-500/20 text-amber-400 border-none px-3 font-black text-[10px] uppercase tracking-widest">
                                    Localité de Côte d'Ivoire
                                </Badge>
                                <Badge className="bg-white/10 text-white/70 border-none px-3 font-black text-[10px] uppercase tracking-widest">
                                    Code INS: {village.codeINS || '—'}
                                </Badge>
                            </div>
                            <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter uppercase leading-none">
                                {village.name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-slate-300 font-bold">
                                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-amber-500"/> {village.region}</span>
                                <span className="opacity-30">•</span>
                                <span className="flex items-center gap-1.5"><Landmark className="h-4 w-4 text-amber-500"/> {village.department}</span>
                                <span className="opacity-30">•</span>
                                <span className="flex items-center gap-1.5"><Home className="h-4 w-4 text-amber-500"/> {village.subPrefecture}</span>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            {activeChief && (
                                <Card className="bg-white/10 backdrop-blur-xl border-white/10 p-4 rounded-xl flex items-center gap-4 text-white">
                                    <div className="h-12 w-12 rounded-2xl bg-amber-500 flex items-center justify-center text-xl font-black shadow-lg">
                                        {activeChief.name.charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/50">{village.chiefTitle || 'Chef de Village'}</span>
                                        <span className="text-sm font-black whitespace-nowrap">{activeChief.name}</span>
                                    </div>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-8">
                <TabsList className="bg-slate-100 p-1.5 rounded-2xl w-full md:w-fit overflow-x-auto">
                    <TabsTrigger value="overview" className="rounded-xl font-black text-[10px] uppercase tracking-widest px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Aperçu & Stats</TabsTrigger>
                    <TabsTrigger value="heritage" className="rounded-xl font-black text-[10px] uppercase tracking-widest px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Patrimoine & Culture</TabsTrigger>
                    <TabsTrigger value="history" className="rounded-xl font-black text-[10px] uppercase tracking-widest px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Histoire Locale</TabsTrigger>
                    <TabsTrigger value="infrastructure" className="rounded-xl font-black text-[10px] uppercase tracking-widest px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Infrastructure</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Demographic Column */}
                        <div className="space-y-8">
                            <Card className="rounded-xl border-none shadow-xl shadow-slate-200/50 p-8 space-y-6">
                                <div className="space-y-1">
                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Démographie</h3>
                                    <p className="text-xs text-slate-500 font-medium italic">Données basées sur le dernier recensement.</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center"><Users className="h-5 w-5 text-blue-500"/></div>
                                            <span className="text-sm font-bold text-slate-600">Population</span>
                                        </div>
                                        <span className="text-lg font-black text-slate-900">{village.population?.toLocaleString() || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center"><Globe className="h-5 w-5 text-purple-500"/></div>
                                            <span className="text-sm font-bold text-slate-600">Ethnies Majoritaires</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1 justify-end max-w-[150px]">
                                            {village.mainEthnicGroups?.map(e => (
                                                <Badge key={e} variant="outline" className="text-[9px] font-black uppercase tracking-tighter px-2 py-0">{e}</Badge>
                                            )) || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card className="rounded-xl border-none shadow-xl shadow-slate-200/50 p-8 bg-slate-900 text-white overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <Coffee className="h-24 w-24" />
                                </div>
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Activités Économiques</h3>
                                <div className="flex flex-wrap gap-2 relative z-10">
                                    {village.mainActivities?.map(a => (
                                        <Badge key={a} className="bg-white/10 hover:bg-white/20 text-white border-none px-3 font-bold">{a}</Badge>
                                    )) || <span className="text-slate-500 italic">Non renseigné</span>}
                                </div>
                            </Card>
                        </div>

                        {/* Main Info Column */}
                        <div className="lg:col-span-2 space-y-8">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Card className="rounded-xl border-none shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col hover:shadow-2xl transition-all duration-500 group">
                                    <div className="h-48 w-full bg-slate-100 relative">
                                        <GISMap 
                                          chiefs={chiefs} 
                                          heritage={heritage}
                                          selectedId={activeChief?.id || null}
                                          showFilters={false}
                                          height="100%"
                                        />
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <MapPin className="h-5 w-5 text-slate-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-slate-900 uppercase">Localisation SIG</h4>
                                                <div className="text-[10px] font-bold text-slate-400">
                                                    {village.latitude?.toFixed(4)} N, {village.longitude?.toFixed(4)} W
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="rounded-xl border-none shadow-xl shadow-slate-200/50 p-8 flex flex-col justify-between hover:shadow-2xl transition-all duration-500 group">
                                    <div className="space-y-4">
                                        <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Shield className="h-6 w-6 text-amber-500" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-slate-900 uppercase">Statut de la Chefferie</h4>
                                            <p className="text-xs text-slate-500 font-medium">État de la vacance du trône traditionnel.</p>
                                        </div>
                                    </div>
                                    <div className="mt-8 pt-6 border-t border-slate-50">
                                        {activeChief ? (
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-black text-green-600 uppercase tracking-widest">Siège pourvu</span>
                                                <Button variant="ghost" size="sm" className="h-8 rounded-lg text-[10px] font-black uppercase text-slate-400" asChild>
                                                    <Link href={`/chiefs/${activeChief.id}`}>Voir le Chef <ChevronRight className="ml-1 h-3 w-3"/></Link>
                                                </Button>
                                            </div>
                                        ) : (
                                            <span className="text-xs font-black text-amber-600 uppercase tracking-widest">Vacance du trône</span>
                                        )}
                                    </div>
                                </Card>
                             </div>

                             <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-black text-slate-900 uppercase">Us & Coutumes</h3>
                                        <p className="text-xs text-slate-500 font-medium italic">Règles et traditions spécifiques à cette localité.</p>
                                    </div>
                                    <Landmark className="h-8 w-8 text-slate-100" />
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                    {village.customs || "Les us et coutumes de ce village sont en cours d'archivage systématique par les commissaires du CNRCT."}
                                </p>
                             </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="heritage" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mr-4">
                            <div className="space-y-1">
                                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Patrimoine Local</h2>
                                <p className="text-sm text-slate-500 font-medium italic italic">Traditions, masques et rites associés à {village.name}.</p>
                            </div>
                            <Button className="rounded-2xl h-12 px-6 font-bold bg-slate-900 hover:shadow-xl transition-all" asChild>
                                <Link href="/heritage"><Plus className="mr-2 h-5 w-5"/>Ajouter au patrimoine</Link>
                            </Button>
                        </div>

                        {heritage.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pr-4">
                                {heritage.map(item => (
                                    <Card key={item.id} className="group rounded-xl border-none shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden bg-white">
                                        <div className="h-44 bg-slate-100 relative overflow-hidden">
                                            {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                            <Badge className="absolute top-4 right-4 bg-white/90 text-slate-900 border-none font-black text-[9px] uppercase px-3">
                                                {heritageCategoryLabels[item.category as HeritageCategory] || item.category}
                                            </Badge>
                                            <div className="absolute bottom-4 left-6">
                                                <h4 className="text-white font-black uppercase text-lg leading-tight">{item.name}</h4>
                                            </div>
                                        </div>
                                        <CardContent className="p-6">
                                            <p className="text-xs text-slate-500 font-medium italic line-clamp-2 mb-6">"{item.description}"</p>
                                            <Button variant="outline" className="w-full rounded-xl border-slate-100 font-black text-[10px] uppercase tracking-widest group-hover:bg-slate-900 group-hover:text-white transition-all" asChild>
                                                <Link href={`/heritage/${item.category}/${item.id}`}>Explorer l'archive <ChevronRight className="ml-1 h-3.5 w-3.5"/></Link>
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card className="rounded-2xl border-none bg-slate-50 p-12 flex flex-col items-center justify-center text-center mr-4">
                                <Landmark className="h-16 w-16 text-slate-200 mb-6" />
                                <h3 className="text-xl font-black text-slate-900 uppercase">Aucun patrimoine répertorié</h3>
                                <p className="text-sm text-slate-400 font-medium max-w-sm mt-2 font-medium">Les traditions spécifiques de ce village n'ont pas encore été liées à cette fiche.</p>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="history" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="rounded-2xl border-none shadow-xl shadow-slate-200/50 p-10 space-y-8 bg-white max-w-4xl">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg"><Info className="h-7 w-7 text-white"/></div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Mémoire institutionnelle</h2>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Registre historique et fondations</p>
                            </div>
                        </div>
                        <div className="prose prose-slate max-w-none">
                            <p className="text-lg text-slate-600 leading-relaxed font-medium first-letter:text-5xl first-letter:font-black first-letter:mr-3 first-letter:float-left first-letter:text-slate-900">
                                {village.history || "Les archives historiques de cette localité sont en cours de numérisation. Le CNRCT s'efforce de recueillir les témoignages oraux auprès des doyens de la génération MBorman pour reconstituer le récit fondateur de ce territoire sagace."}
                            </p>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="infrastructure" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pr-4">
                         {[
                             { label: 'Écoles', icon: School, status: village.hasSchool, color: 'text-blue-500' },
                             { label: 'Santé', icon: Shield, status: village.hasHealthCenter, color: 'text-rose-500' },
                             { label: 'Électricité', icon: Zap, status: village.hasElectricity, color: 'text-amber-500' },
                             { label: 'Eau Potable', icon: Droplets, status: village.hasWater, color: 'text-cyan-500' },
                         ].map(item => (
                             <Card key={item.label} className="rounded-3xl border-none shadow-lg p-6 flex flex-col items-center gap-4 text-center group hover:scale-105 transition-transform bg-white">
                                 <div className={cn("h-16 w-16 rounded-full flex items-center justify-center transition-colors", item.status ? 'bg-slate-50' : 'bg-slate-50 opacity-50')}>
                                     <item.icon className={cn("h-8 w-8", item.status ? item.color : 'text-slate-300')} />
                                 </div>
                                 <div className="space-y-1">
                                     <p className="font-black text-slate-900 uppercase text-xs tracking-tight">{item.label}</p>
                                     <Badge className={cn("border-none text-[9px] font-black uppercase", item.status ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400')}>
                                         {item.status ? 'Disponible' : 'Indisponible'}
                                     </Badge>
                                 </div>
                             </Card>
                         ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
