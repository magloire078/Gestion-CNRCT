"use client";

import { 
    Users2, Utensils, Drama, Music, 
    Gamepad2, HeartHandshake, ChevronRight,
    MapPin, Globe, History, Sparkles,
    Search, Camera, Landmark
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { heritageCategoryLabels, HeritageCategory } from "@/types/heritage";

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
    return (
        <div className="flex flex-col gap-12 pb-20">
            {/* Massive Hero Section */}
            <div className="relative h-[450px] rounded-[3.5rem] overflow-hidden bg-slate-950 group">
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
                        <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl px-6 py-4">
                            <History className="h-6 w-6 text-amber-500" />
                            <div className="flex flex-col">
                                <span className="text-white font-black text-lg leading-tight">Archives 2025</span>
                                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Mise à jour</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl px-6 py-4">
                            <Globe className="h-6 w-6 text-blue-400" />
                            <div className="flex flex-col">
                                <span className="text-white font-black text-lg leading-tight">31 Régions</span>
                                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Couverture</span>
                            </div>
                        </div>
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
            <div className="container mx-auto px-8 max-w-5xl">
                <blockquote className="relative">
                    <Sparkles className="absolute -top-12 -left-12 h-24 w-24 text-amber-500/10" />
                    <p className="text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tight text-center italic">
                        "La culture est ce qui reste quand on a tout oublié. Elle est le socle de notre stabilité sociale et le garant de notre identité commune."
                    </p>
                    <footer className="mt-8 text-center">
                        <div className="h-1 w-20 bg-amber-500 mx-auto mb-4 rounded-full" />
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Direction Générale du CNRCT</p>
                    </footer>
                </blockquote>
            </div>

            {/* Categories Grid */}
            <div className="container mx-auto px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {categories.map((cat) => (cat.id && cat.label && (
                    <Link key={cat.id} href={`/heritage/${cat.id}`} className="group">
                        <Card className="h-full rounded-[2.5rem] border-none shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 bg-white overflow-hidden flex flex-col">
                            <div className="h-56 relative overflow-hidden">
                                <img src={cat.image} alt={cat.label} className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute top-6 right-6 h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                                    <cat.icon className="h-6 w-6 text-white" />
                                </div>
                                <div className="absolute bottom-6 left-8">
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">{cat.label}</h3>
                                </div>
                            </div>
                            <CardContent className="p-8 flex-grow flex flex-col justify-between">
                                <p className="text-slate-500 font-medium leading-relaxed italic mb-8">
                                    {cat.description}
                                </p>
                                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Explorer l'archive</span>
                                    <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white group-hover:bg-amber-500 group-hover:translate-x-1 transition-all">
                                        <ChevronRight className="h-5 w-5" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                )))}
            </div>

            {/* Footer / CTA */}
            <div className="container mx-auto px-8 mt-12">
                <Card className="rounded-[3rem] border-none bg-slate-900 p-12 md:p-20 text-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
                    </div>
                    <div className="relative z-10 space-y-8">
                        <div className="h-20 w-20 bg-amber-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl rotate-12">
                            <Camera className="h-10 w-10 text-slate-950" />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">Participez à l'inventaire</h2>
                        <p className="text-slate-400 text-xl font-medium max-w-2xl mx-auto italic">
                             Vous êtes en possession de documents ou de photographies historiques ? Aidez-nous à enrichir le patrimoine national.
                        </p>
                        <Button className="rounded-2xl h-16 px-12 text-lg font-black bg-white text-slate-900 hover:bg-amber-500 hover:text-white transition-all shadow-2xl">
                            Soumettre un élément
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
