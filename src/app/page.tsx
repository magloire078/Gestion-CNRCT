"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ShieldCheck, Scale, MapPin, Search, Loader2 } from "lucide-react";
import Image from "next/image";
import { getDirectoireMembers } from "@/services/employee-service";
import type { Employe } from "@/lib/data";

export default function LandingPage() {
    const [directoireMembers, setDirectoireMembers] = useState<Employe[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const members = await getDirectoireMembers();
                setDirectoireMembers(members);
            } catch (error) {
                console.error("Error fetching directoire members:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMembers();
    }, []);

    // Helper to get initials
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const president = directoireMembers.find(m => m.poste?.toLowerCase().includes('president') && !m.poste?.toLowerCase().includes('vice'));
    const vicePresidents = directoireMembers.filter(m => m.poste?.toLowerCase().includes('vice-president'));
    const secretaryGeneral = directoireMembers.find(m => m.poste?.toLowerCase().includes('secrétaire général'));
    const otherMembers = directoireMembers.filter(m =>
        !m.poste?.toLowerCase().includes('president') &&
        !m.poste?.toLowerCase().includes('vice-president') &&
        !m.poste?.toLowerCase().includes('secrétaire général')
    );

    return (
        <div className="flex flex-col min-h-screen bg-[#fafaf8] text-[#1a1a1a] font-body selection:bg-primary/20">
            {/* Premium Header with Glassmorphism */}
            <header className="sticky top-0 z-50 w-full border-b border-primary/5 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
                <div className="container mx-auto px-4 h-24 flex items-center justify-between">
                    <div className="flex items-center gap-4 group cursor-pointer">
                        <div className="hidden sm:flex relative w-16 h-16 transition-transform duration-500 group-hover:rotate-6">
                            <Image src="https://cnrct.ci/wp-content/uploads/2018/03/logo_chambre.png" alt="Logo CNRCT" layout="fill" objectFit="contain" priority />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-xl tracking-tight text-[#006039]">CNRCT</span>
                            <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-muted-foreground">République de Côte d'Ivoire</span>
                        </div>
                    </div>
                    <nav className="flex items-center gap-4">
                        <Link href="/login">
                            <Button variant="default" className="gap-2">
                                Connexion Intranet <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="flex-1">
                {/* Majestic Hero Section */}
                <section className="relative py-24 md:py-36 overflow-hidden bg-gradient-to-b from-[#006039]/5 via-white to-transparent">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-10 pointer-events-none" />
                    <div className="container mx-auto px-4 relative">
                        <div className="max-w-4xl mx-auto text-center space-y-10">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5 text-[#006039] text-xs font-bold uppercase tracking-widest mb-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                                Haute Institution de l'État
                            </div>
                            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-[#1a1a1a] leading-[1.1]">
                                La <span className="text-[#006039]">Chambre des Rois</span> et des Chefs Traditionnels
                            </h1>
                            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto font-light">
                                Gardienne des <span className="text-[#D4AF37] font-medium">valeurs ancestrales</span> et pilier de la <span className="text-[#006039] font-medium">paix sociale</span> en Côte d'Ivoire.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-6">
                                <Link href="/login">
                                    <Button size="lg" className="h-14 px-10 text-base bg-[#006039] hover:bg-[#004d2e] shadow-xl shadow-[#006039]/20 transition-all hover:-translate-y-1">
                                        Espace Intranet
                                    </Button>
                                </Link>
                                <Button size="lg" variant="outline" className="h-14 px-10 text-base border-primary/10 hover:bg-primary/5 transition-all">
                                    Découvrir l'Institution
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Missions Section */}
                <section className="py-12 bg-background">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold mb-4">Nos Missions</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                En vertu de la Loi Organique n° 2014-428, la Chambre (CNRCT) assure la promotion des idéaux de paix, de développement et de cohésion sociale.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            <div className="group bg-white rounded-3xl p-8 border border-primary/5 shadow-sm transition-all hover:shadow-2xl hover:shadow-[#006039]/10 hover:-translate-y-2">
                                <div className="h-14 w-14 bg-[#006039]/10 rounded-2xl flex items-center justify-center mb-8 transition-colors group-hover:bg-[#006039] group-hover:text-white">
                                    <Scale className="h-7 w-7 transition-transform group-hover:scale-110" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-[#1a1a1a]">Médiation Royale</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Règlement non juridictionnel des conflits par la sagesse ancestrale pour une paix durable.
                                </p>
                            </div>
                            <div className="group bg-white rounded-3xl p-8 border border-primary/5 shadow-sm transition-all hover:shadow-2xl hover:shadow-[#D4AF37]/10 hover:-translate-y-2">
                                <div className="h-14 w-14 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center mb-8 transition-colors group-hover:bg-[#D4AF37] group-hover:text-white">
                                    <ShieldCheck className="h-7 w-7 transition-transform group-hover:scale-110" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-[#1a1a1a]">Patrimoine & Us</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Préservation rigoureuse du répertoire national des autorités traditionnelles et des coutumes ivoiriennes.
                                </p>
                            </div>
                            <div className="group bg-white rounded-3xl p-8 border border-primary/5 shadow-sm transition-all hover:shadow-2xl hover:shadow-[#006039]/10 hover:-translate-y-2">
                                <div className="h-14 w-14 bg-[#006039]/10 rounded-2xl flex items-center justify-center mb-8 transition-colors group-hover:bg-[#006039] group-hover:text-white">
                                    <MapPin className="h-7 w-7 transition-transform group-hover:scale-110" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-[#1a1a1a]">Unité Nationale</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Mobilisation des populations pour le développement et renforcement de la cohésion républicaine.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
                {/* Organisation Structure Section */}
                <section className="py-12 bg-muted/30">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold mb-4">Organisation de la Chambre</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                Une structure institutionnelle solide pour assurer la représentation et la médiation des autorités traditionnelles.
                            </p>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                            <div className="bg-background p-6 rounded-xl border shadow-sm border-primary/10">
                                <h4 className="font-bold text-lg mb-2 text-primary">L'Assemblée</h4>
                                <p className="text-sm text-muted-foreground">Composée de représentants désignés par leurs pairs (2 par département) pour un mandat de 6 ans.</p>
                            </div>
                            <div className="bg-background p-6 rounded-xl border shadow-sm border-primary/10">
                                <h4 className="font-bold text-lg mb-2 text-primary">Le Directoire</h4>
                                <p className="text-sm text-muted-foreground">Organe de direction chargé de l'exécution des décisions de l'Assemblée et de la représentation.</p>
                            </div>
                            <div className="bg-background p-6 rounded-xl border shadow-sm border-primary/10">
                                <h4 className="font-bold text-lg mb-2 text-primary">Le Secrétariat</h4>
                                <p className="text-sm text-muted-foreground">Assistance administrative et technique pour le bon fonctionnement permanent de l'institution.</p>
                            </div>
                            <div className="bg-background p-6 rounded-xl border shadow-sm border-primary/10">
                                <h4 className="font-bold text-lg mb-2 text-primary">Comités Régionaux</h4>
                                <p className="text-sm text-muted-foreground">Relais opérationnels de la Chambre au niveau de chaque région administrative.</p>
                            </div>
                        </div>
                    </div>
                </section>
                {/* Traditional Hierarchy Section */}
                <section className="py-12 bg-background">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold mb-4">Hiérarchie Traditionnelle</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                La Chambre reconnaît et fédère les différentes strates de l'autorité traditionnelle ivoirienne.
                            </p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
                            {["Rois", "Chefs de Province", "Chefs de Canton", "Chefs de Tribu", "Chefs de Village"].map((rank) => (
                                <Badge key={rank} variant="secondary" className="text-lg px-6 py-2 rounded-full border-primary/10">
                                    {rank}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Directoire / Organigramme Section */}
                <section className="py-24 bg-muted/50 min-h-[600px] flex items-center">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-black mb-6">Le Bureau du Directoire</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                                Composition officielle du bureau exécutif, garante de la représentativité et de la collégialité des décisions.
                            </p>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="h-12 w-12 text-[#006039] animate-spin" />
                                <p className="text-muted-foreground animate-pulse">Chargement de l'organigramme officiel...</p>
                            </div>
                        ) : (
                            <>
                                {/* President - Executive Row */}
                                {president && (
                                    <div className="flex justify-center mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
                                        <div className="w-full max-w-sm group relative">
                                            <div className="absolute inset-x-[-20px] top-[-20px] bottom-[-20px] bg-gradient-to-br from-[#006039]/10 to-[#D4AF37]/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-[3rem] blur-xl" />
                                            <div className="relative flex flex-col items-center bg-white p-10 rounded-3xl border-2 border-[#D4AF37]/30 shadow-2xl transition-all hover:-translate-y-2">
                                                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-[#006039]/10 to-[#D4AF37]/10 flex items-center justify-center mb-6 overflow-hidden border-4 border-white shadow-inner relative">
                                                    {president.photoUrl && president.photoUrl !== 'https://placehold.co/100x100.png' ? (
                                                        <Image src={president.photoUrl} alt={president.name || ''} layout="fill" objectFit="cover" />
                                                    ) : (
                                                        <>
                                                            <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-20" />
                                                            <span className="absolute text-6xl font-serif text-[#006039]/20 italic">P</span>
                                                            <span className="relative text-3xl font-bold text-[#006039]">{getInitials(president.name || 'P')}</span>
                                                        </>
                                                    )}
                                                </div>
                                                <Badge variant="default" className="mb-3 bg-[#006039] text-[#D4AF37] font-bold text-sm px-4">Président</Badge>
                                                <h4 className="font-bold text-2xl text-[#1a1a1a] text-center">{president.name}</h4>
                                                {president.Region && <p className="text-sm text-muted-foreground mt-2">Région du {president.Region}</p>}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Vice-Presidents Grid */}
                                {vicePresidents.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-7xl mx-auto mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                                        {vicePresidents.map((vp, index) => (
                                            <div key={index} className="group relative">
                                                <div className="absolute inset-x-[-10px] top-[-10px] bottom-[-10px] bg-gradient-to-br from-[#006039]/5 to-[#D4AF37]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl blur-lg" />
                                                <div className="relative flex flex-col items-center bg-white/70 backdrop-blur-sm p-8 rounded-2xl border border-primary/5 shadow-md transition-all hover:shadow-xl hover:-translate-y-1">
                                                    <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4 border-2 border-white shadow-sm overflow-hidden relative">
                                                        {vp.photoUrl && vp.photoUrl !== 'https://placehold.co/100x100.png' ? (
                                                            <Image src={vp.photoUrl} alt={vp.name || ''} layout="fill" objectFit="cover" />
                                                        ) : (
                                                            <>
                                                                <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-10" />
                                                                <span className="absolute text-3xl font-serif text-muted-foreground/30 italic">{getInitials(vp.name || 'VP')}</span>
                                                                <span className="relative text-xl font-bold text-muted-foreground/50">{getInitials(vp.name || 'VP')}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    <Badge variant="outline" className="mb-2 border-[#D4AF37]/30 text-[#D4AF37] font-medium text-[10px] uppercase truncate max-w-full">{vp.poste}</Badge>
                                                    <h4 className="font-semibold text-base text-[#1a1a1a] text-center leading-tight">{vp.name}</h4>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Secretariat & Councilors Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400">
                                    {/* Secretary General */}
                                    {secretaryGeneral && (
                                        <div className="group relative">
                                            <div className="relative flex flex-col items-center bg-[#006039]/5 backdrop-blur-sm p-6 rounded-2xl border border-[#006039]/10 transition-all hover:bg-[#006039]/10">
                                                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 border border-primary/10 shadow-sm overflow-hidden relative">
                                                    {secretaryGeneral.photoUrl && secretaryGeneral.photoUrl !== 'https://placehold.co/100x100.png' ? (
                                                        <Image src={secretaryGeneral.photoUrl} alt={secretaryGeneral.name || ''} layout="fill" objectFit="cover" />
                                                    ) : (
                                                        <span className="text-xl font-bold text-[#006039]">{getInitials(secretaryGeneral.name || 'SG')}</span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] uppercase tracking-widest font-bold text-[#006039] mb-1">Secrétaire Général</p>
                                                <h4 className="font-bold text-sm text-[#1a1a1a]">{secretaryGeneral.name}</h4>
                                            </div>
                                        </div>
                                    )}

                                    {/* Other Members */}
                                    {otherMembers.map((member, index) => (
                                        <div key={index} className="group relative">
                                            <div className="relative flex flex-col items-center bg-white/40 backdrop-blur-sm p-6 rounded-2xl border border-primary/5 transition-all hover:bg-white/80">
                                                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4 border border-white shadow-sm overflow-hidden relative">
                                                    {member.photoUrl && member.photoUrl !== 'https://placehold.co/100x100.png' ? (
                                                        <Image src={member.photoUrl} alt={member.name || ''} layout="fill" objectFit="cover" />
                                                    ) : (
                                                        <span className="text-xl font-serif text-muted-foreground/30 italic">{getInitials(member.name || 'MB')}</span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] uppercase tracking-widest font-bold text-[#D4AF37] mb-1">{member.poste || 'Membre du Bureau'}</p>
                                                <h4 className="font-medium text-sm text-[#1a1a1a]">{member.name}</h4>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Special Note for Special Advisors */}
                        <div className="mt-20 max-w-3xl mx-auto p-8 rounded-3xl bg-[#006039]/5 border border-[#006039]/10 text-center">
                            <div className="flex justify-center mb-4">
                                <ShieldCheck className="h-8 w-8 text-[#006039]" />
                            </div>
                            <h4 className="font-bold text-[#006039] mb-3">Dispositions Spéciales</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed italic">
                                "Les membres du directoire ayant exercé des fonctions de président assument d'office les fonctions de
                                <span className="text-[#006039] font-bold"> Conseiller Spécial</span> au sein du bureau, garantissant ainsi la continuité de la sagesse institutionnelle."
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            {/* Premium Footer */}
            <footer className="bg-[#1a1a1a] text-white/70 py-16 border-t border-white/5">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 relative mb-6 grayscale opacity-50 contrast-125">
                            <Image src="https://cnrct.ci/wp-content/uploads/2018/03/logo_chambre.png" alt="CNRCT" layout="fill" objectFit="contain" />
                        </div>
                        <p className="font-serif italic text-xl text-white mb-2">Chambre Nationale des Rois et Chefs Traditionnels</p>
                        <p className="text-sm tracking-[0.3em] uppercase mb-10 opacity-60">République de Côte d'Ivoire</p>
                        <div className="flex gap-8 mb-12">
                            <Link href="#" className="hover:text-[#D4AF37] transition-colors">L'Institution</Link>
                            <Link href="#" className="hover:text-[#D4AF37] transition-colors">Missions</Link>
                            <Link href="#" className="hover:text-[#D4AF37] transition-colors">Contact</Link>
                        </div>
                        <div className="text-[10px] uppercase tracking-widest opacity-40">
                            &copy; {new Date().getFullYear()} CNRCT. Excellence & Tradition.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

