"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ShieldCheck, Scale, MapPin, Search, Loader2, Users } from "lucide-react";
import Image from "next/image";
import { getDirectoireMembers, getRegionalCommittees, type RegionalCommittee } from "@/services/employee-service";
import type { Employe } from "@/lib/data";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

export default function LandingPage() {
    const [directoireMembers, setDirectoireMembers] = useState<Employe[]>([]);
    const [regionalCommittees, setRegionalCommittees] = useState<RegionalCommittee[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRegionIndex, setSelectedRegionIndex] = useState<number>(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("directoire");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [members, committees] = await Promise.all([
                    getDirectoireMembers(),
                    getRegionalCommittees()
                ]);
                setDirectoireMembers(members);
                setRegionalCommittees(committees);

                // Set initial region if available
                if (committees.length > 0) {
                    setSelectedRegionIndex(0);
                }
            } catch (error) {
                console.error("Error fetching landing page data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
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
                            <Image src="https://cnrct.ci/wp-content/uploads/2018/03/logo_chambre.png" alt="Logo CNRCT" fill className="object-contain" sizes="64px" priority />
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
                <section className="relative py-16 md:py-24 overflow-hidden bg-gradient-to-b from-[#006039]/5 via-white to-transparent">
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
                <section className="py-8 bg-background">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-10">
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
                <section className="py-8 bg-muted/30">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-10">
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
                            <div className="bg-background p-6 rounded-xl border shadow-sm border-primary/10 cursor-pointer hover:border-[#006039]/30 transition-all hover:shadow-md group" onClick={() => document.getElementById('directoire-section')?.scrollIntoView({ behavior: 'smooth' })}>
                                <h4 className="font-bold text-lg mb-2 text-primary group-hover:text-[#006039] transition-colors">Le Directoire</h4>
                                <p className="text-sm text-muted-foreground">Organe de direction chargé de l'exécution des décisions de l'Assemblée et de la représentation. <ArrowRight className="inline h-3 w-3 opacity-0 group-hover:opacity-100 transition-all translate-x-1" /></p>
                            </div>
                            <div className="bg-background p-6 rounded-xl border shadow-sm border-primary/10">
                                <h4 className="font-bold text-lg mb-2 text-primary">Le Secrétariat</h4>
                                <p className="text-sm text-muted-foreground">Assistance administrative et technique pour le bon fonctionnement permanent de l'institution.</p>
                            </div>
                            <div className="bg-background p-6 rounded-xl border shadow-sm border-primary/10 cursor-pointer hover:border-[#006039]/30 transition-all hover:shadow-md group" onClick={() => document.getElementById('regional-committees')?.scrollIntoView({ behavior: 'smooth' })}>
                                <h4 className="font-bold text-lg mb-2 text-primary group-hover:text-[#006039] transition-colors">Comités Régionaux</h4>
                                <p className="text-sm text-muted-foreground">Relais opérationnels de la Chambre au niveau de chaque région administrative. <ArrowRight className="inline h-3 w-3 opacity-0 group-hover:opacity-100 transition-all translate-x-1" /></p>
                            </div>
                        </div>
                    </div>
                </section>
                {/* Traditional Hierarchy Section */}
                <section className="py-8 bg-background">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-10">
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
                <section id="directoire-section" className="py-16 bg-muted/50 min-h-[600px] flex items-center scroll-mt-24">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-10">
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
                                                        <Image src={president.photoUrl} alt={president.name || ''} fill className="object-cover" sizes="160px" />
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
                                                            <Image src={vp.photoUrl} alt={vp.name || ''} fill className="object-cover" sizes="96px" />
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
                                                        <Image src={secretaryGeneral.photoUrl} alt={secretaryGeneral.name || ''} fill className="object-cover" sizes="64px" />
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
                                                        <Image src={member.photoUrl} alt={member.name || ''} fill className="object-cover" sizes="64px" />
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
                    </div>
                </section>

                {/* Regional Committees Section */}
                <section id="regional-committees" className="py-16 bg-white border-t border-primary/5 scroll-mt-24 overflow-hidden">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-10 max-w-3xl mx-auto">
                            <Badge variant="outline" className="mb-4 border-[#006039]/20 text-[#006039] uppercase tracking-[0.2em] px-4 py-1.5 text-[10px] font-bold">Réseau Territorial</Badge>
                            <h2 className="text-4xl md:text-5xl font-black mb-6 text-[#1a1a1a]">Les 31 Comités Régionaux</h2>
                            <p className="text-muted-foreground text-lg leading-relaxed font-light">
                                La Chambre assure une présence continue sur l'ensemble du territoire national à travers ses relais régionaux, garantissant ainsi une <span className="text-[#006039] font-medium">médiation de proximité</span>.
                            </p>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="h-10 w-10 text-[#006039] animate-spin" />
                                <p className="text-sm text-muted-foreground">Chargement du réseau territorial...</p>
                            </div>
                        ) : (
                            <div className="grid lg:grid-cols-3 gap-12 items-start max-w-7xl mx-auto">
                                {/* Left: Region List */}
                                <div className="lg:col-span-1 space-y-6 animate-in fade-in slide-in-from-left-8 duration-700">
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-[#006039] transition-colors" />
                                        <Input
                                            placeholder="Rechercher une région..."
                                            className="pl-11 h-14 rounded-2xl border-primary/10 bg-muted/30 focus-visible:ring-[#006039]/20 transition-all"
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value);
                                                setSelectedRegionIndex(0); // Reset selection on search
                                            }}
                                        />
                                    </div>

                                    <ScrollArea className="h-[550px] pr-4 rounded-2xl border border-primary/5 bg-white/50 p-2">
                                        <div className="space-y-1.5">
                                            {(regionalCommittees.filter(c => c.region.toLowerCase().includes(searchQuery.toLowerCase()))).map((committee, index) => {
                                                const filteredList = regionalCommittees.filter(c => c.region.toLowerCase().includes(searchQuery.toLowerCase()));
                                                const isSelected = index === selectedRegionIndex;
                                                return (
                                                    <button
                                                        key={committee.region}
                                                        onClick={() => setSelectedRegionIndex(index)}
                                                        className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${isSelected
                                                            ? 'bg-[#006039] text-white shadow-xl shadow-[#006039]/20 translate-x-1 scale-[1.02]'
                                                            : 'bg-transparent hover:bg-muted/50 border border-transparent hover:border-primary/5'
                                                            }`}
                                                    >
                                                        <div className="flex flex-col items-start">
                                                            <span className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-[#1a1a1a]'}`}>{committee.region}</span>
                                                            <span className={`text-[10px] uppercase tracking-wider ${isSelected ? 'text-white/60' : 'text-muted-foreground'}`}>{committee.president ? 'Bureau Actif' : 'Coordination local'}</span>
                                                        </div>
                                                        <ArrowRight className={`h-4 w-4 ${isSelected ? 'opacity-100' : 'opacity-0'} transition-opacity`} />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </ScrollArea>
                                </div>

                                {/* Right: Region Details */}
                                <div className="lg:col-span-2 animate-in fade-in slide-in-from-right-8 duration-700">
                                    {(() => {
                                        const filtered = regionalCommittees.filter(c => c.region.toLowerCase().includes(searchQuery.toLowerCase()));
                                        const selected = filtered[selectedRegionIndex];

                                        if (!selected) return (
                                            <div className="flex flex-col items-center justify-center min-h-[600px] text-muted-foreground bg-muted/20 rounded-[3rem] border-2 border-dashed border-primary/10">
                                                <MapPin className="h-12 w-12 mb-4 opacity-10" />
                                                <p className="font-light italic">Aucune région ne correspond à votre recherche</p>
                                            </div>
                                        );

                                        return (
                                            <Card className="border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] bg-white overflow-hidden rounded-[3rem] min-h-[600px] flex flex-col group/card">
                                                {/* Card Header with Region Banner */}
                                                <div className="h-48 bg-[#006039] relative flex items-center px-12 overflow-hidden">
                                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-20" />
                                                    <div className="absolute inset-0 bg-gradient-to-r from-[#006039] via-[#006039]/90 to-transparent" />
                                                    <div className="relative z-10">
                                                        <Badge className="bg-[#D4AF37] text-white border-none mb-3 px-3 uppercase text-[9px] tracking-[0.2em] font-black">Region</Badge>
                                                        <h3 className="text-4xl md:text-5xl font-black text-white tracking-tighter">{selected.region}</h3>
                                                    </div>
                                                    <Users className="absolute right-[-20px] bottom-[-20px] w-64 h-64 text-white opacity-5 pointer-events-none group-hover/card:scale-110 transition-transform duration-1000" />
                                                </div>

                                                <CardContent className="flex-1 p-8 md:p-12 relative">
                                                    <div className="grid md:grid-cols-2 gap-12">
                                                        {/* President / Focal Point */}
                                                        <div className="space-y-8">
                                                            <div className="space-y-6">
                                                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#006039]/40 border-b border-primary/5 pb-2">Présidence du Comité</h4>
                                                                <div className="flex items-center gap-6">
                                                                    <div className="relative">
                                                                        <div className="absolute inset-[-4px] bg-gradient-to-br from-[#006039] to-[#D4AF37] rounded-full blur opacity-20" />
                                                                        <Avatar className="h-24 w-24 border-[6px] border-white shadow-2xl relative z-10">
                                                                            <AvatarImage src={selected.president?.photoUrl} className="object-cover" />
                                                                            <AvatarFallback className="bg-muted text-[#006039] font-black text-2xl">
                                                                                {getInitials(selected.president?.name || selected.region[0])}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                    </div>
                                                                    <div>
                                                                        <h5 className="text-2xl font-bold text-[#1a1a1a] leading-tight">
                                                                            {selected.president?.name || "Installation en cours"}
                                                                        </h5>
                                                                        <p className="text-[#006039] font-bold text-sm mt-1 uppercase tracking-wider">
                                                                            {selected.president?.poste || 'Point Focal Régional'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-1 gap-4 pt-4">
                                                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-primary/5">
                                                                    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                                                        <MapPin className="h-5 w-5 text-[#006039]" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Territoire</p>
                                                                        <p className="text-sm font-semibold">{selected.region}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-primary/5">
                                                                    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                                                        <ShieldCheck className="h-5 w-5 text-[#006039]" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Mission Locale</p>
                                                                        <p className="text-sm font-semibold">Médiation & Cohésion</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Members List */}
                                                        <div className="bg-[#fafaf8] rounded-[2rem] p-8 border border-primary/5 flex flex-col">
                                                            <div className="flex items-center justify-between mb-8">
                                                                <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#006039]/40">Bureau Local</h5>
                                                                <Badge className="bg-[#006039]/10 text-[#006039] border-none font-bold">{selected.members.length} Membres</Badge>
                                                            </div>

                                                            <ScrollArea className="flex-1 pr-4">
                                                                <div className="space-y-4">
                                                                    {selected.members.length > 0 ? selected.members.map((member, mIdx) => (
                                                                        <div key={mIdx} className="group/item flex items-center gap-4 p-3 rounded-xl hover:bg-white hover:shadow-md transition-all duration-300">
                                                                            <div className="w-10 h-10 rounded-full bg-white border border-primary/5 flex items-center justify-center text-xs font-black text-[#006039] shadow-sm">
                                                                                {getInitials(member.name || '')}
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-sm font-bold truncate text-[#1a1a1a]">{member.name}</p>
                                                                                <p className="text-[10px] text-muted-foreground truncate uppercase tracking-tighter">{member.poste}</p>
                                                                            </div>
                                                                        </div>
                                                                    )) : (
                                                                        <div className="py-20 text-center space-y-3">
                                                                            <div className="w-12 h-12 rounded-full bg-muted/50 mx-auto flex items-center justify-center">
                                                                                <Loader2 className="h-5 w-5 text-muted-foreground opacity-30" />
                                                                            </div>
                                                                            <p className="text-xs text-muted-foreground italic max-w-[150px] mx-auto">
                                                                                Composition du bureau en attente de validation officielle.
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </ScrollArea>
                                                        </div>
                                                    </div>

                                                    <div className="mt-12 pt-8 border-t border-primary/5 flex items-center justify-between">
                                                        <div className="flex -space-x-3 overflow-hidden">
                                                            {selected.members.slice(0, 5).map((m, i) => (
                                                                <Avatar key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-white">
                                                                    <AvatarImage src={m.photoUrl} />
                                                                    <AvatarFallback className="bg-muted text-[8px] font-bold">{getInitials(m.name || '')}</AvatarFallback>
                                                                </Avatar>
                                                            ))}
                                                            {selected.members.length > 5 && (
                                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground ring-2 ring-white">
                                                                    +{selected.members.length - 5}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <Button variant="outline" className="rounded-full border-[#006039]/20 text-[#006039] hover:bg-[#006039] hover:text-white transition-all">
                                                            Consulter l'annuaire de la région
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {/* Premium Footer */}
            <footer className="bg-[#1a1a1a] text-white/70 py-16 border-t border-white/5">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 relative mb-6 grayscale opacity-50 contrast-125">
                            <Image src="https://cnrct.ci/wp-content/uploads/2018/03/logo_chambre.png" alt="CNRCT" fill className="object-contain" sizes="64px" />
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

