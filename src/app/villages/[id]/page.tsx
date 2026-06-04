"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    ArrowLeft, MapPin, Users, 
    Landmark, Globe, History, 
    Loader2, ChevronRight, School,
    Plus, Coffee, Info, Camera,
    Home, Droplets, Zap, Shield,
    Pencil, Coins, Heart, Moon as Mosque,
    ShoppingBag, Church
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
import { EditVillageSheet } from "@/components/villages/edit-village-sheet";
import { VillageRegencyTimeline } from "@/components/villages/village-regency-timeline";
import { PermissionGuard } from "@/components/auth/permission-guard";

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
    const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);

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
        <PermissionGuard permission="page:villages:view">
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
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" className="w-fit text-white/70 hover:text-white hover:bg-white/10 rounded-xl" onClick={() => router.back()}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                            </Button>
                            <Button variant="ghost" className="w-fit text-white border-white/10 bg-white/5 hover:bg-white/10 rounded-xl" onClick={() => setIsEditSheetOpen(true)}>
                                <Pencil className="mr-2 h-4 w-4" /> Modifier la localité
                            </Button>
                        </div>
                        
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
                                        <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-xl font-black shadow-lg">
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
                        <TabsTrigger value="regency" className="rounded-xl font-black text-[10px] uppercase tracking-widest px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Régence</TabsTrigger>
                        <TabsTrigger value="infrastructure" className="rounded-xl font-black text-[10px] uppercase tracking-widest px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Infrastructure</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Demographic Column */}
                            <div className="space-y-8">
                                <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 p-8 space-y-6 bg-white">
                                    <div className="space-y-1">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Démographie & Social</h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter italic">Données de l'Observatoire Territorial</p>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center"><Users className="h-5 w-5 text-blue-500"/></div>
                                                <span className="text-[10px] font-black uppercase text-slate-600 tracking-tight">Population</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-black text-slate-900 leading-none">{village.population?.toLocaleString() || 'N/A'}</div>
                                                <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">HAB. ({village.populationYear || '2024'})</div>
                                            </div>
                                        </div>
                                        {village.numberOfHouseholds && (
                                            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center"><Home className="h-5 w-5 text-emerald-500"/></div>
                                                    <span className="text-[10px] font-black uppercase text-slate-600 tracking-tight">Ménages</span>
                                                </div>
                                                <span className="text-lg font-black text-slate-900">{village.numberOfHouseholds}</span>
                                            </div>
                                        )}
                                        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center"><Globe className="h-5 w-5 text-purple-500"/></div>
                                                <span className="text-[10px] font-black uppercase text-slate-600 tracking-tight">Peuplement</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {village.mainEthnicGroups?.map(e => (
                                                    <Badge key={e} variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-white border-slate-200 text-slate-600">{e}</Badge>
                                                )) || <span className="text-[9px] font-bold text-slate-400 uppercase">Non spécifié</span>}
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 p-8 bg-slate-900 text-white overflow-hidden relative group">
                                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
                                        <Coins className="h-24 w-24" />
                                    </div>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Dynamique Économique</h3>
                                    <div className="space-y-4 relative z-10">
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Activités Principales</p>
                                            <div className="flex flex-wrap gap-2">
                                                {village.mainActivities?.map(a => (
                                                    <Badge key={a} className="bg-white/10 hover:bg-white/20 text-white border-none px-3 py-1 font-black uppercase text-[9px] tracking-widest">{a}</Badge>
                                                )) || <span className="text-slate-500 italic text-[10px]">Non renseigné</span>}
                                            </div>
                                        </div>
                                        {village.mainCrops && village.mainCrops.length > 0 && (
                                            <div className="space-y-2 pt-4 border-t border-white/5">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Cultures Majeures</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {village.mainCrops.map(c => (
                                                        <Badge key={c} variant="outline" className="text-amber-400 border-amber-400/30 font-black uppercase text-[9px] tracking-widest">{c}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </div>

                            {/* Main Info Column */}
                            <div className="lg:col-span-2 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col hover:shadow-2xl transition-all duration-500 group bg-white">
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
                                                <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <MapPin className="h-5 w-5 text-slate-400" />
                                                </div>
                                                <div>
                                                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Coordonnées SIG</h4>
                                                    <div className="text-[10px] font-black text-blue-500 uppercase">
                                                        {village.latitude?.toFixed(6)} N, {village.longitude?.toFixed(6)} W
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>

                                    <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 p-8 flex flex-col justify-between hover:shadow-2xl transition-all duration-500 group bg-white">
                                        <div className="space-y-4">
                                            <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                                <Shield className="h-6 w-6 text-amber-500" />
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Système de Chefferie</h4>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Type: {village.chieftaincyType || 'Coutumier'}</p>
                                            </div>
                                        </div>
                                        <div className="mt-8 pt-6 border-t border-slate-50 flex flex-col gap-4">
                                            {activeChief ? (
                                                <div className="flex items-center justify-between bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                                                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Trône pourvu</span>
                                                    <Button variant="ghost" size="sm" className="h-7 px-3 rounded-lg text-[9px] font-black uppercase text-emerald-700 bg-white shadow-sm" asChild>
                                                        <Link href={`/chiefs/${activeChief.id}`}>Dossier Chef <ChevronRight className="ml-1 h-3 w-3"/></Link>
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex items-center justify-center">
                                                    <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Vacance du trône traditionnel</span>
                                                </div>
                                            )}
                                            {village.successionMode && (
                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center italic">
                                                    Succession: {village.successionMode}
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                </div>

                                <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 p-10 space-y-6 bg-white relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-5">
                                        <Landmark className="h-32 w-32" />
                                    </div>
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="space-y-1">
                                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Us, Coutumes & Traditions</h3>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Code de conduite territorial</p>
                                        </div>
                                        <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center"><Heart className="h-5 w-5 text-rose-400" /></div>
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed font-medium relative z-10">
                                        {village.customs || "Les us et coutumes de ce village sont en cours d'archivage systématique par les commissaires du CNRCT."}
                                    </p>
                                    {village.traditionalPractices && (
                                        <div className="pt-6 mt-6 border-t border-slate-50 relative z-10">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Pratiques Traditionnelles</p>
                                            <p className="text-sm text-slate-600 font-medium italic">"{village.traditionalPractices}"</p>
                                        </div>
                                    )}
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="heritage" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mr-4">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Patrimoine Immatériel</h2>
                                    <p className="text-sm text-slate-500 font-medium italic">Inventaire des richesses culturelles de la localité.</p>
                                </div>
                                <Button className="rounded-2xl h-12 px-6 font-black uppercase tracking-widest text-[10px] bg-slate-900 hover:shadow-xl transition-all" asChild>
                                    <Link href="/heritage"><Plus className="mr-2 h-5 w-5"/>Enrichir l'Archive</Link>
                                </Button>
                            </div>

                            {heritage.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pr-4">
                                    {heritage.map(item => (
                                        <Card key={item.id} className="group rounded-3xl border-none shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden bg-white">
                                            <div className="h-52 bg-slate-100 relative overflow-hidden">
                                                {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                                <Badge className="absolute top-4 right-4 bg-white/95 text-slate-900 border-none font-black text-[9px] uppercase px-3 tracking-widest shadow-sm">
                                                    {heritageCategoryLabels[item.category as HeritageCategory] || item.category}
                                                </Badge>
                                                <div className="absolute bottom-6 left-8">
                                                    <h4 className="text-white font-black uppercase text-xl leading-tight tracking-tighter">{item.name}</h4>
                                                </div>
                                            </div>
                                            <CardContent className="p-8">
                                                <p className="text-xs text-slate-500 font-medium italic line-clamp-3 mb-8 leading-relaxed">"{item.description}"</p>
                                                <Button variant="outline" className="w-full h-11 rounded-xl border-slate-100 font-black text-[10px] uppercase tracking-widest group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all" asChild>
                                                    <Link href={`/heritage/${item.category}/${item.id}`}>Consulter l'archive <ChevronRight className="ml-1 h-3.5 w-3.5"/></Link>
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <Card className="rounded-[3rem] border-none bg-slate-50 p-20 flex flex-col items-center justify-center text-center mr-4 shadow-inner">
                                    <div className="h-24 w-24 bg-white rounded-[2rem] shadow-sm flex items-center justify-center mb-8"><Landmark className="h-10 w-10 text-slate-200" /></div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Aucun patrimoine répertorié</h3>
                                    <p className="text-sm text-slate-400 font-medium max-w-sm mt-3 leading-relaxed">Les archives spécifiques à cette localité n'ont pas encore été numérisées par le commissariat au patrimoine.</p>
                                </Card>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="history" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="rounded-[3rem] border-none shadow-xl shadow-slate-200/50 p-12 space-y-10 bg-white max-w-4xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:rotate-12 transition-transform duration-1000">
                                <History className="h-64 w-64" />
                            </div>
                            <div className="flex items-center gap-6 relative z-10">
                                <div className="h-16 w-16 rounded-[1.5rem] bg-slate-900 flex items-center justify-center shadow-2xl shadow-slate-400"><History className="h-8 w-8 text-white"/></div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Mémoire Institutionnelle</h2>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">Archives & Fondations Territoriales</p>
                                </div>
                            </div>
                            <div className="prose prose-slate max-w-none relative z-10">
                                <p className="text-xl text-slate-600 leading-[2] font-medium first-letter:text-6xl first-letter:font-black first-letter:mr-4 first-letter:float-left first-letter:text-slate-900 first-letter:leading-none">
                                    {village.history || "Les archives historiques de cette localité sont en cours de numérisation. Le CNRCT s'efforce de recueillir les témoignages oraux auprès des doyens pour reconstituer le récit fondateur de ce territoire."}
                                </p>
                            </div>
                            {village.annualEvents && (
                                <div className="pt-10 mt-10 border-t border-slate-100 relative z-10">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 mb-4">Calendrier des Événements Annuels</h4>
                                    <p className="text-sm font-bold text-slate-600 bg-slate-50 p-6 rounded-2xl border border-slate-100 italic">"{village.annualEvents}"</p>
                                </div>
                            )}
                        </Card>
                    </TabsContent>

                    <TabsContent value="regency" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="border-none shadow-xl shadow-slate-200/40 rounded-[2rem] bg-white overflow-hidden">
                            <CardHeader>
                                <CardTitle className="text-2xl font-black tracking-tight text-slate-900">
                                    Succession des chefferies
                                </CardTitle>
                                <CardDescription>
                                    Historique chronologique des chefs ayant régné sur cette localité, du plus récent au plus ancien.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-2 pb-8">
                                <VillageRegencyTimeline villageId={village.id} villageName={village.name} />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="infrastructure" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-12">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pr-4">
                                {[
                                    { id: 'hasSchool', label: 'Éducation', icon: School, status: village.hasSchool, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
                                    { id: 'hasHealthCenter', label: 'Santé', icon: Shield, status: village.hasHealthCenter, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100' },
                                    { id: 'hasElectricity', label: 'Énergie', icon: Zap, status: village.hasElectricity, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
                                    { id: 'hasWater', label: 'Eau Potable', icon: Droplets, status: village.hasWater, color: 'text-cyan-500', bg: 'bg-cyan-50', border: 'border-cyan-100' },
                                    { id: 'hasMarket', label: 'Commerce', icon: ShoppingBag, status: village.hasMarket, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                                    { id: 'hasMosque', label: 'Mosquée', icon: Mosque, status: village.hasMosque, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
                                    { id: 'hasChurch', label: 'Église', icon: Church, status: village.hasChurch, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
                                ].map(item => (
                                    <Card key={item.id} className={cn(
                                        "rounded-[2rem] border-none shadow-xl p-8 flex flex-col items-center gap-6 text-center group hover:scale-105 transition-all duration-500 bg-white",
                                        !item.status && "opacity-60 grayscale-[0.5]"
                                    )}>
                                        <div className={cn(
                                            "h-20 w-20 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 shadow-sm",
                                            item.status ? item.bg : 'bg-slate-50'
                                        )}>
                                            <item.icon className={cn("h-10 w-10 transition-transform duration-500 group-hover:scale-110", item.status ? item.color : 'text-slate-300')} />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="font-black text-slate-900 uppercase text-[10px] tracking-widest">{item.label}</p>
                                            <Badge className={cn(
                                                "border-none text-[9px] font-black uppercase tracking-widest px-3 py-1",
                                                item.status ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                                            )}>
                                                {item.status ? 'Opérationnel' : 'Néant'}
                                            </Badge>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                            
                            {village.infrastructureNotes && (
                                <Card className="rounded-[2rem] border-none bg-slate-50/50 p-8 mr-4 border border-slate-100">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Info className="h-4 w-4 text-slate-400" />
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notes techniques de l'Observateur</h4>
                                    </div>
                                    <p className="text-sm font-medium text-slate-600 leading-relaxed italic">"{village.infrastructureNotes}"</p>
                                </Card>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                {village && (
                    <EditVillageSheet 
                        village={village} 
                        open={isEditSheetOpen} 
                        onOpenChangeAction={setIsEditSheetOpen} 
                    />
                )}
            </div>
        </PermissionGuard>
    );
}
