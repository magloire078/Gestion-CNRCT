"use client";

import { 
    Users2, Utensils, Drama, Music, 
    Gamepad2, HeartHandshake, ChevronRight,
    MapPin, Globe, History, Sparkles,
    Search, Camera, Landmark
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import Link from "next/link";
import { heritageCategoryLabels, HeritageCategory, HeritageItem } from "@/types/heritage";
import { getAllHeritageItems } from "@/services/heritage-service";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { Skeleton } from "@/components/ui/skeleton";

const categories = [
    { 
        id: "ethnies" as HeritageCategory, 
        label: "Ethnies & Groupes", 
        icon: Users2, 
        description: "Diversité culturelle et peuplement de la Côte d'Ivoire.",
        color: "bg-blue-500",
        image: "https://images.unsplash.com/photo-1523805081730-61444927f07a?auto=format&fit=crop&q=80"
    },
    { 
        id: "culinaire" as HeritageCategory, 
        label: "Arts Culinaires", 
        icon: Utensils, 
        description: "Saveurs et traditions gastronomiques des terroirs.",
        color: "bg-orange-500",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80"
    },
    { 
        id: "masques" as HeritageCategory, 
        label: "Masques & Statues", 
        icon: Drama, 
        description: "Art sacré et expressions plastiques traditionnelles.",
        color: "bg-red-500",
        image: "https://images.unsplash.com/photo-1503174971373-b1f69850bbd6?auto=format&fit=crop&q=80"
    },
    { 
        id: "danses" as HeritageCategory, 
        label: "Danses & Musiques", 
        icon: Music, 
        description: "Rythmes, instruments et expressions corporelles.",
        color: "bg-purple-500",
        image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80"
    },
    { 
        id: "jeux" as HeritageCategory, 
        label: "Jeux Traditionnels", 
        icon: Gamepad2, 
        description: "Loisirs d'antan et jeux de société ancestraux.",
        color: "bg-amber-500",
        image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80"
    },
    { 
        id: "alliances" as HeritageCategory, 
        label: "Alliances Inter-ethnies", 
        icon: HeartHandshake, 
        description: "Pactes de non-agression et cohésion sociale.",
        color: "bg-emerald-500",
        image: "https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?auto=format&fit=crop&q=80"
    },
];

export default function HeritageHubPage() {
    const [stats, setStats] = useState({
        total: 0,
        regions: 0,
        ethnies: 0,
        loading: true
    });
    const [recentItems, setRecentItems] = useState<HeritageItem[]>([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const items = await getAllHeritageItems();
                const regions = new Set(items.map(i => i.region).filter(Boolean));
                const ethnies = new Set(items.map(i => i.ethnicGroup).filter(Boolean));
                
                setStats({
                    total: items.length,
                    regions: regions.size,
                    ethnies: ethnies.size,
                    loading: false
                });

                // Get 3 recent items
                const sorted = [...items].sort((a, b) => 
                    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
                ).slice(0, 3);
                setRecentItems(sorted);
            } catch (error) {
                console.error("Error fetching heritage stats:", error);
                setStats(s => ({ ...s, loading: false }));
            }
        };
        fetchStats();
    }, []);

    return (
        <PermissionGuard permission="page:heritage:view">
            <div className="flex flex-col gap-12 pb-20">
            {/* Heritage Hero Section */}
            <div className="relative h-[340px] rounded-2xl overflow-hidden bg-slate-950 group">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523805081730-61444927f07a?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-30 transition-transform duration-1000 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                
                <div className="relative h-full container mx-auto px-8 md:px-16 flex flex-col justify-center gap-6">
                    <div className="space-y-4 max-w-3xl">
                        <Badge className="bg-amber-500 text-slate-950 border-none px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-amber-500/20">
                            Portail Culturel National
                        </Badge>
                        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.9] uppercase">
                            Mémoire <span className="text-amber-500">&</span> Patrimoine
                        </h1>
                        <p className="text-slate-400 text-xl md:text-2xl font-medium leading-relaxed max-w-2xl italic">
                            Explorez les richesses immatérielles de la Côte d'Ivoire. Un voyage au cœur des traditions, des arts et de l'identité ivoirienne.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-6 mt-4">
                        {stats.loading ? (
                            <>
                                <Skeleton className="h-16 w-40 bg-white/10 rounded-lg" />
                                <Skeleton className="h-16 w-40 bg-white/10 rounded-lg" />
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg px-6 py-4 hover:bg-white/10 transition-colors cursor-default">
                                    <History className="h-6 w-6 text-amber-500" />
                                    <div className="flex flex-col">
                                        <span className="text-white font-black text-lg leading-tight">{stats.total} Archives</span>
                                        <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">Inventaire National</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg px-6 py-4 hover:bg-white/10 transition-colors cursor-default">
                                    <Globe className="h-6 w-6 text-blue-400" />
                                    <div className="flex flex-col">
                                        <span className="text-white font-black text-lg leading-tight">{stats.regions} Régions</span>
                                        <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">Couverture SIG</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg px-6 py-4 hover:bg-white/10 transition-colors cursor-default">
                                    <Users2 className="h-6 w-6 text-emerald-400" />
                                    <div className="flex flex-col">
                                        <span className="text-white font-black text-lg leading-tight">{stats.ethnies} Ethnies</span>
                                        <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">Diversité Culturelle</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute bottom-0 right-0 p-12 hidden lg:block">
                    <div className="relative">
                        <div className="absolute inset-0 bg-amber-500 blur-[120px] opacity-20" />
                        <Landmark className="h-64 w-64 text-white/5 relative z-10 rotate-12" />
                    </div>
                </div>
            </div>

            {/* Introduction Quote */}
            <div className="container mx-auto px-8 max-w-5xl relative">
                <div className="absolute inset-0 bg-amber-500/5 blur-[100px] rounded-full" />
                <blockquote className="relative space-y-8">
                    <Sparkles className="absolute -top-12 -left-12 h-24 w-24 text-amber-500/10 animate-pulse" />
                    <p className="text-3xl md:text-5xl font-black text-slate-900 leading-tight tracking-tighter text-center uppercase italic">
                        "La culture est ce qui reste quand on a tout oublié. Elle est le socle de notre <span className="text-amber-500">stabilité sociale</span> et le garant de notre identité commune."
                    </p>
                    <footer className="flex flex-col items-center gap-4">
                        <div className="h-1.5 w-24 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" />
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Direction Générale du CNRCT</p>
                    </footer>
                </blockquote>
            </div>

            {/* Latest Discoveries */}
            {!stats.loading && recentItems.length > 0 && (
                <div className="container mx-auto px-8 space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Dernières Acquisitions</h2>
                            <p className="text-slate-400 font-medium text-sm italic">Les trésors récemment documentés par nos équipes sur le terrain.</p>
                        </div>
                        <Link href="/heritage/explorer">
                            <Button variant="ghost" className="rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900">
                                Voir tout l'inventaire <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {recentItems.map((item) => (
                            <Link key={item.id} href={`/heritage/${item.category}/${item.id}`} className="group">
                                <div className="p-4 rounded-[2rem] bg-slate-50 border border-slate-100/50 hover:bg-white hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500 flex gap-4 items-center">
                                    <div className="h-16 w-16 rounded-2xl overflow-hidden shrink-0 shadow-lg">
                                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500 mb-0.5">{heritageCategoryLabels[item.category as HeritageCategory]}</p>
                                        <h4 className="font-black text-slate-900 truncate uppercase tracking-tight">{item.name}</h4>
                                        <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase mt-1">
                                            <MapPin className="h-3 w-3" /> {item.region}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Categories Grid */}
            <div className="container mx-auto px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {categories.map((cat) => (cat.id && cat.label && (
                    <Link key={cat.id} href={`/heritage/${cat.id}`} className="group">
                        <Card className="h-full rounded-xl border-none shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 bg-white overflow-hidden flex flex-col">
                            <div className="h-56 relative overflow-hidden">
                                <img src={cat.image} alt={cat.label} className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute top-6 right-6 h-12 w-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                                    <cat.icon className="h-6 w-6 text-white" />
                                </div>
                                <div className="absolute bottom-6 left-8">
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">{cat.label}</h3>
                                </div>
                            </div>
                            <CardContent className="p-6 flex-grow flex flex-col justify-between">
                                <p className="text-slate-500 font-medium leading-relaxed italic mb-8">
                                    {cat.description}
                                </p>
                                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Explorer l'archive</span>
                                    <div className="h-10 w-10 rounded-lg bg-slate-900 flex items-center justify-center text-white group-hover:bg-amber-500 group-hover:translate-x-1 transition-all">
                                        <ChevronRight className="h-5 w-5" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                )))}
            </div>

            <div className="container mx-auto px-8 mt-12">
                <Card className="rounded-2xl border-none bg-slate-900 p-10 md:p-16 text-center relative overflow-hidden text-white">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0 pattern-dots-lg text-white"></div>
                    </div>
                    <div className="relative z-10 space-y-8">
                        <div className="h-20 w-20 bg-amber-500 rounded-xl flex items-center justify-center mx-auto shadow-2xl rotate-12">
                            <Camera className="h-10 w-10 text-slate-950" />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">Participez à l'inventaire</h2>
                        <p className="text-slate-400 text-xl font-medium max-w-2xl mx-auto italic">
                             Vous êtes en possession de documents ou de photographies historiques ? Aidez-nous à enrichir le patrimoine national.
                        </p>
                        <Button className="rounded-xl h-16 px-12 text-lg font-black bg-white text-slate-900 hover:bg-amber-500 hover:text-white transition-all shadow-2xl">
                            Soumettre un élément
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
        </PermissionGuard>
    );
}
