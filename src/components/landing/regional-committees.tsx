
"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MapPin, Search, Loader2, Users, ArrowRight, ShieldCheck } from "lucide-react";
import type { RegionalCommittee } from "@/services/employee-service";
import { getInitials, cleanRegionName } from "./landing-utils";

interface RegionalCommitteesProps {
  loading: boolean;
  regionalCommittees: RegionalCommittee[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedRegionIndex: number;
  setSelectedRegionIndex: (index: number) => void;
}

export function RegionalCommittees({
  loading,
  regionalCommittees,
  searchQuery,
  setSearchQuery,
  selectedRegionIndex,
  setSelectedRegionIndex
}: RegionalCommitteesProps) {
  
  const filteredCommittees = regionalCommittees.filter(c => 
    c.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selected = filteredCommittees[selectedRegionIndex];

  return (
    <section id="regional-committees" className="py-16 bg-white border-t border-primary/5 scroll-mt-24 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 max-w-3xl mx-auto">
          <Badge variant="outline" className="mb-4 border-[#006039]/20 text-[#006039] uppercase tracking-[0.2em] px-4 py-1.5 text-[10px] font-bold">Réseau Territorial</Badge>
          <h2 className="text-4xl md:text-5xl font-black mb-6 text-[#1a1a1a]">31 Comités Régionaux et 2 Districts (Abidjan et Yamoussoukro)</h2>
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
                  {filteredCommittees.map((committee, index) => {
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
                          <span className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-[#1a1a1a]'}`}>{cleanRegionName(committee.region)}</span>
                          <span className={`text-[10px] uppercase tracking-wider ${isSelected ? 'text-white/60' : 'text-muted-foreground'}`}>{committee.president ? 'Bureau Actif' : 'Coordination locale'}</span>
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
              {!selected ? (
                <div className="flex flex-col items-center justify-center min-h-[600px] text-muted-foreground bg-muted/20 rounded-[3rem] border-2 border-dashed border-primary/10">
                  <MapPin className="h-12 w-12 mb-4 opacity-10" />
                  <p className="font-light italic">Aucune région ne correspond à votre recherche</p>
                </div>
              ) : (
                <Card className="border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] bg-white overflow-hidden rounded-[3rem] min-h-[600px] flex flex-col group/card">
                  {/* Card Header with Region Banner */}
                  <div className="h-48 bg-[#006039] relative flex items-center px-12 overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-20" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#006039] via-[#006039]/90 to-transparent" />
                    <div className="relative z-10">
                      <Badge className="bg-[#D4AF37] text-white border-none mb-3 px-3 uppercase text-[9px] tracking-[0.2em] font-black">Region</Badge>
                      <h3 className="text-4xl md:text-5xl font-black text-white tracking-tighter">{cleanRegionName(selected.region)}</h3>
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
                              <Avatar className="h-[100px] w-[100px] border-[6px] border-white shadow-2xl relative z-10 transition-transform duration-500 group-hover/card:scale-110">
                                {selected.president?.photoUrl && !selected.president?.photoUrl.includes('ui-avatars.com') && !selected.president?.photoUrl.includes('placehold.co') ? (
                                  <AvatarImage src={selected.president.photoUrl} className="object-cover" />
                                ) : (
                                  <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selected.president?.name || selected.region[0])}&background=006039&color=D4AF37&size=100&bold=true`} className="object-cover" />
                                )}
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
                              <p className="text-sm font-semibold">{cleanRegionName(selected.region)}</p>
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
                                <div className="w-10 h-10 rounded-full bg-white border border-primary/5 flex items-center justify-center text-xs font-black text-[#006039] shadow-sm overflow-hidden relative">
                                  {member.photoUrl && !member.photoUrl.includes('ui-avatars.com') ? (
                                    <Image src={member.photoUrl} alt={member.name} fill className="object-cover" sizes="40px" />
                                  ) : (
                                    getInitials(member.name || '')
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold truncate text-[#1a1a1a]">{member.name}</p>
                                  <div className="flex items-center gap-2">
                                    <p className="text-[10px] text-muted-foreground truncate uppercase tracking-tighter">{member.poste}</p>
                                    {member.Departement && (
                                      <>
                                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                        <p className="text-[10px] text-[#006039] font-bold truncate uppercase tracking-tighter">{member.Departement}</p>
                                      </>
                                    )}
                                  </div>
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
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
