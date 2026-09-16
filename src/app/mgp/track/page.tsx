"use client";

import { useState } from "react";
import { 
    Search, ShieldCheck,
    Calendar, History, ArrowRight,
    Loader2, AlertCircle, CheckCircle2,
    Clock, MessageSquare, Info
} from "lucide-react";
import Link from "next/link";
import { AlertTriangle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trackConflictPublicly, type PublicConflictStatus } from "@/services/conflict-service";
import { cn } from "@/lib/utils";

export default function PublicTrackingPage() {
    const [id, setId] = useState("");
    const [loading, setLoading] = useState(false);
    const [conflict, setConflict] = useState<PublicConflictStatus | null>(null);
    const [searched, setSearched] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id.trim()) return;

        setLoading(true);
        setSearched(true);
        setErrorMessage(null);
        try {
            const result = await trackConflictPublicly(id.trim());
            setConflict(result);
        } catch (error) {
            console.error(error);
            setConflict(null);
            setErrorMessage(error instanceof Error ? error.message : "La recherche a échoué.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Minimalist Public Header */}
            <header className="bg-white border-b border-slate-100 py-6 px-4">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center">
                            <ShieldCheck className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="font-black text-slate-900 leading-none tracking-tighter uppercase">CNRCT Portal</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Mécansime de Gestion des Plaintes</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild className="hidden sm:flex text-xs font-bold uppercase">
                        <Link href="/login">Accès Agent</Link>
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-12 md:py-10">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Search Hero */}
                    <div className="text-center space-y-6">
                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                            Suivez l'état de votre <br />
                            <span className="text-blue-600">Dossier de Médiation</span>
                        </h1>
                        <p className="text-slate-500 max-w-xl mx-auto font-medium">
                            Entrez votre numéro de suivi unique pour consulter l'avancement de votre plainte et les étapes de résolution en cours.
                        </p>

                        <form onSubmit={handleSearch} className="max-w-md mx-auto relative group mt-10">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            </div>
                            <Input 
                                placeholder="Ex: CNRCT-2026-XXXX" 
                                className="h-16 pl-12 pr-32 rounded-2xl border-2 border-slate-100 bg-white shadow-2xl shadow-slate-200/50 focus:border-blue-600 transition-all font-bold text-lg"
                                value={id}
                                onChange={(e) => setId(e.target.value)}
                            />
                            <Button 
                                type="submit"
                                disabled={loading}
                                className="absolute right-2 top-2 bottom-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6 font-bold uppercase text-[10px] tracking-widest transition-all"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Rechercher"}
                            </Button>
                        </form>
                    </div>

                    {/* Results Area */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Consultation du registre national...</p>
                        </div>
                    ) : searched && !conflict ? (
                        <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-xl bg-white p-12 text-center overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-rose-500" />
                            <div className="h-20 w-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertCircle className="h-10 w-10 text-rose-500" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 uppercase">
                                {errorMessage ? "Recherche Indisponible" : "Dossier Introuvable"}
                            </h3>
                            <p className="text-slate-500 mt-2 max-w-xs mx-auto">
                                {errorMessage ? errorMessage : (
                                    <>
                                        Nous n'avons trouvé aucun dossier correspondant à l'identifiant <span className="text-slate-900 font-bold">{id}</span>.
                                        Veuillez vérifier le code et réessayer.
                                    </>
                                )}
                            </p>
                        </Card>
                    ) : searched && conflict ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-500">
                            {/* Summary Card */}
                            <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-xl bg-white overflow-hidden">
                                <div className="bg-slate-900 p-5 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="space-y-2">
                                        <Badge className="bg-blue-600/20 text-blue-400 border-none px-3 font-black text-[10px] uppercase tracking-widest">
                                            Dossier {conflict.status}
                                        </Badge>
                                        <h2 className="text-3xl font-black tracking-tight">{conflict.type}</h2>
                                        <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                            <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Enregistré le {conflict.reportedDate}</span>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 p-6 rounded-xl text-center min-w-[200px]">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">ID de Suivi</p>
                                        <p className="text-2xl font-black text-blue-400 font-mono tracking-tighter">{conflict.trackingId}</p>
                                    </div>
                                </div>
                                <CardContent className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-6">
                                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                <Info className="h-4 w-4" /> Votre Dossier
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nature de la Saisine</p>
                                                    <p className="text-slate-800 font-bold leading-relaxed">{conflict.type}</p>
                                                </div>
                                                <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100">
                                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Confidentialité</p>
                                                    <p className="text-slate-600 font-medium text-sm leading-relaxed">
                                                        Pour protéger les personnes concernées, le détail du dossier n'est pas
                                                        consultable en ligne. Rapprochez-vous de la CNRCT muni de votre récépissé
                                                        pour tout complément.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                <History className="h-4 w-4" /> Étapes de Résolution
                                            </h3>
                                            <div className="relative pl-8 space-y-4 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                                                {/* Start Point */}
                                                <div className="relative">
                                                    <div className="absolute -left-[30px] top-1 h-2.5 w-2.5 rounded-full bg-slate-900 border-2 border-white shadow-sm z-10" />
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase">Saisine de la CNRCT</p>
                                                        <p className="text-xs font-bold text-slate-900 mt-1">Dossier ouvert et enregistré sous le numéro {conflict.trackingId}.</p>
                                                        <p className="text-[9px] font-bold text-blue-600 mt-1 italic">{conflict.reportedDate}</p>
                                                    </div>
                                                </div>

                                                {/* Étape courante — libellé dérivé du seul statut, les notes
                                                    internes du dossier ne sont jamais exposées au public. */}
                                                {conflict.status !== 'Résolu' && (
                                                    <div className="relative">
                                                        <div className="absolute -left-[30px] top-1 h-2.5 w-2.5 rounded-full bg-amber-500 border-2 border-white shadow-sm z-10" />
                                                        <div>
                                                            <p className="text-[10px] font-black text-amber-500 uppercase">{conflict.status}</p>
                                                            <p className="text-xs font-bold text-slate-900 mt-1">Le dossier est en cours de traitement par nos services.</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Resolved State */}
                                                {conflict.status === 'Résolu' && (
                                                    <div className="relative">
                                                        <div className="absolute -left-[30px] top-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm z-10" />
                                                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 mt-2">
                                                            <p className="text-[10px] font-black text-emerald-600 uppercase">Clôturé</p>
                                                            <p className="text-xs font-bold text-emerald-900 mt-1">Ce dossier a été officiellement classé comme réglé suite à la médiation.</p>
                                                            {conflict.resolutionDate && (
                                                                <p className="text-[9px] font-bold text-emerald-600 mt-1 italic">{conflict.resolutionDate}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                <div className="bg-slate-50 p-6 border-t border-slate-100 flex items-center justify-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-slate-300" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dernière MaJ: {new Date().toLocaleDateString('fr-FR')}</span>
                                    </div>
                                    <div className="w-px h-4 bg-slate-200" />
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4 text-slate-300" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact Support: +225 27 XX XX XX</span>
                                    </div>
                                </div>
                            </Card>

                            <Button variant="outline" className="w-full h-14 rounded-2xl border-2 border-slate-200 font-bold text-slate-900 hover:bg-slate-50 uppercase tracking-widest text-[11px]" onClick={() => {setConflict(null); setSearched(false); setId("");}}>
                                Rechercher un autre dossier
                            </Button>
                        </div>
                    ) : (
                        /* Informational Footer */
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
                            <div className="p-6 rounded-xl bg-white border border-slate-100 space-y-3">
                                <div className="h-10 w-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <h4 className="font-black text-slate-900 uppercase text-xs">Confidentialité</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">Vos données sont protégées par le secret professionnel et le cadre juridique du CNRCT.</p>
                            </div>
                            <div className="p-6 rounded-xl bg-white border border-slate-100 space-y-3">
                                <div className="h-10 w-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                                    <Clock className="h-5 w-5" />
                                </div>
                                <h4 className="font-black text-slate-900 uppercase text-xs">Traitement Rapide</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">Nos équipes s'engagent à un premier retour sous 72h ouvrées après dépôt du dossier.</p>
                            </div>
                            <div className="p-6 rounded-xl bg-white border border-slate-100 space-y-3">
                                <div className="h-10 w-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <h4 className="font-black text-slate-900 uppercase text-xs">Force Majeure</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">Une médiation réussie permet d'éviter les procédures judiciaires longues et coûteuses.</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <footer className="py-12 text-center">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                    &copy; 2026 Chambre Nationale des Rois et Chefs Traditionnels - République de Côte d'Ivoire
                </p>
            </footer>
        </div>
    );
}
