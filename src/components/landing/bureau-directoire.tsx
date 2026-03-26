
"use client";

import Image from "next/image";
import { Loader2 } from "lucide-react";
import type { Employe } from "@/lib/data";
import { getInitials, cleanRegionName } from "./landing-utils";

interface BureauDirectoireProps {
  loading: boolean;
  members: Employe[];
}

export function BureauDirectoire({ loading, members }: BureauDirectoireProps) {
  const president = members.find(m => m.poste?.toLowerCase().includes('president') && !m.poste?.toLowerCase().includes('vice'));
  const vicePresidents = members.filter(m => m.poste?.toLowerCase().includes('vice-president'));

  const bureauMembers = members.filter(m =>
    (m.poste?.toLowerCase().includes('membre du bureau') || m.poste?.toLowerCase().includes('membre du directoire')) &&
    !m.poste?.toLowerCase().includes('president') &&
    !m.poste?.toLowerCase().includes('vice-president')
  );

  const cabinetAndSecretariat = members.filter(m =>
    m.poste?.toLowerCase().includes('secrétaire général') ||
    m.poste?.toLowerCase().includes('directrice de cabinet')
  );

  const otherDirectors = members.filter(m =>
    (m.poste?.toLowerCase().includes('directeur') || m.poste?.toLowerCase().includes('directrice') || m.poste?.toLowerCase().includes('cabinet')) &&
    !m.poste?.toLowerCase().includes('secrétaire général') &&
    !m.poste?.toLowerCase().includes('directrice de cabinet')
  );

  return (
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
            {president && (
              <div className="flex justify-center mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="w-full max-w-sm group relative">
                  <div className="absolute inset-x-[-20px] top-[-20px] bottom-[-20px] bg-gradient-to-br from-[#006039]/10 to-[#D4AF37]/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-[3rem] blur-xl" />
                  <div className="relative flex flex-col items-center bg-white p-10 rounded-3xl border-2 border-[#D4AF37]/30 shadow-2xl transition-all hover:-translate-y-2">
                    <div className="w-40 h-40 rounded-full bg-gradient-to-br from-[#006039]/10 to-[#D4AF37]/10 flex items-center justify-center mb-6 overflow-hidden border-4 border-white shadow-inner relative">
                      {president.photoUrl && !president.photoUrl.includes('ui-avatars.com') && !president.photoUrl.includes('placehold.co') ? (
                        <Image src={president.photoUrl} alt={president.name || ''} fill className="object-cover" sizes="160px" />
                      ) : (
                        <>
                          <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-20" />
                          <span className="absolute text-6xl font-serif text-[#006039]/20 italic">P</span>
                          <span className="relative text-3xl font-bold text-[#006039]">{getInitials(president.name || 'P')}</span>
                        </>
                      )}
                    </div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-[#D4AF37] text-center leading-tight mb-2">Président</p>
                    <h4 className="font-bold text-2xl text-[#1a1a1a] text-center mb-1">{president.name}</h4>
                    {president.Region && <p className="text-xs font-medium text-[#006039]">{cleanRegionName(president.Region)}</p>}
                  </div>
                </div>
              </div>
            )}

            {vicePresidents.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-7xl mx-auto mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                {vicePresidents.map((vp, index) => (
                  <div key={index} className="group relative">
                    <div className="absolute inset-x-[-10px] top-[-10px] bottom-[-10px] bg-gradient-to-br from-[#006039]/5 to-[#D4AF37]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl blur-lg" />
                    <div className="relative flex flex-col items-center bg-white/70 backdrop-blur-sm p-8 rounded-2xl border border-primary/5 shadow-md transition-all hover:shadow-xl hover:-translate-y-1">
                      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4 border-2 border-white shadow-sm overflow-hidden relative">
                        {vp.photoUrl && !vp.photoUrl.includes('ui-avatars.com') && !vp.photoUrl.includes('placehold.co') ? (
                          <Image src={vp.photoUrl} alt={vp.name || ''} fill className="object-cover" sizes="96px" />
                        ) : (
                          <>
                            <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-10" />
                            <span className="absolute text-3xl font-serif text-muted-foreground/30 italic">{getInitials(vp.name || 'VP')}</span>
                            <span className="relative text-xl font-bold text-muted-foreground/50">{getInitials(vp.name || 'VP')}</span>
                          </>
                        )}
                      </div>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-[#D4AF37] text-center leading-tight mb-2">Vice-Président</p>
                      <h4 className="font-semibold text-base text-[#1a1a1a] text-center leading-tight mb-1">{vp.name}</h4>
                      {vp.Region && <p className="text-[10px] text-[#006039] font-bold uppercase tracking-tighter">{cleanRegionName(vp.Region)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {bureauMembers.length > 0 && (
              <>
                <div className="flex items-center gap-4 mb-8 mt-16 max-w-6xl mx-auto">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#D4AF37]/20" />
                  <h3 className="text-xl font-black text-[#D4AF37] uppercase tracking-[0.2em]">Membres du Bureau</h3>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#D4AF37]/20" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                  {bureauMembers.map((member, index) => (
                    <div key={index} className="group relative">
                      <div className="relative flex flex-col items-center bg-white/40 backdrop-blur-sm p-6 rounded-2xl border border-primary/5 transition-all hover:bg-white/80 hover:shadow-lg">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4 border border-white shadow-sm overflow-hidden relative">
                          {member.photoUrl && !member.photoUrl.includes('ui-avatars.com') && !member.photoUrl.includes('placehold.co') ? (
                            <Image src={member.photoUrl} alt={member.name || ''} fill className="object-cover" sizes="64px" />
                          ) : (
                            <span className="text-xl font-serif text-muted-foreground/30 italic">{getInitials(member.name || 'MB')}</span>
                          )}
                        </div>
                        <p className="text-[9px] uppercase tracking-widest font-bold text-[#D4AF37] text-center leading-tight mb-1">{member.poste || 'Membre du Bureau'}</p>
                        <h4 className="font-bold text-xs text-[#1a1a1a] text-center">{member.name}</h4>
                        {member.Region && <p className="text-[8px] text-[#006039] font-bold uppercase mt-1">{cleanRegionName(member.Region)}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {cabinetAndSecretariat.length > 0 && (
              <>
                <div className="flex items-center gap-4 mb-8 mt-16 max-w-6xl mx-auto">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#006039]/20" />
                  <h3 className="text-xl font-black text-[#006039] uppercase tracking-[0.2em]">Cabinet et Secrétariat</h3>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#006039]/20" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400">
                  {cabinetAndSecretariat.map((member, index) => (
                    <div key={index} className="group relative">
                      <div className="relative flex flex-col items-center bg-[#006039]/5 backdrop-blur-sm p-8 rounded-2xl border border-[#006039]/10 transition-all hover:bg-[#006039]/10 hover:shadow-lg">
                        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-4 border border-primary/10 shadow-sm overflow-hidden relative">
                          {member.photoUrl && !member.photoUrl.includes('ui-avatars.com') && !member.photoUrl.includes('placehold.co') ? (
                            <Image src={member.photoUrl} alt={member.name || ''} fill className="object-cover" sizes="80px" />
                          ) : (
                            <span className="text-2xl font-bold text-[#006039]">{getInitials(member.name || 'CAB')}</span>
                          )}
                        </div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-[#006039] text-center leading-tight mb-1">{member.poste}</p>
                        <h4 className="font-bold text-lg text-[#1a1a1a] text-center">{member.name}</h4>
                        {member.Region && <p className="text-[10px] text-[#006039] font-bold uppercase mt-1">{cleanRegionName(member.Region)}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {otherDirectors.length > 0 && (
              <>
                <div className="flex items-center gap-4 mb-8 mt-12 max-w-6xl mx-auto">
                  <div className="h-px flex-1 bg-muted/30" />
                  <h4 className="text-sm font-black text-muted-foreground uppercase tracking-[0.2em]">Les Directions</h4>
                  <div className="h-px flex-1 bg-muted/30" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
                  {otherDirectors.map((member, index) => (
                    <div key={index} className="group relative">
                      <div className="relative flex flex-col items-center bg-white/40 backdrop-blur-sm p-6 rounded-2xl border border-primary/5 transition-all hover:bg-white/80 hover:shadow-lg">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4 border border-white shadow-sm overflow-hidden relative">
                          {member.photoUrl && !member.photoUrl.includes('ui-avatars.com') && !member.photoUrl.includes('placehold.co') ? (
                            <Image src={member.photoUrl} alt={member.name || ''} fill className="object-cover" sizes="64px" />
                          ) : (
                            <span className="text-xl font-bold text-muted-foreground/30">{getInitials(member.name || 'DIR')}</span>
                          )}
                        </div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground text-center leading-tight mb-1">{member.poste}</p>
                        <h4 className="font-bold text-sm text-[#1a1a1a] text-center">{member.name}</h4>
                        {member.Region && <p className="text-[9px] text-[#006039] font-bold uppercase mt-1">{cleanRegionName(member.Region)}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}
