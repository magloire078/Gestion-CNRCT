"use client";

import Image from "next/image";
import { Loader2 } from "lucide-react";
import type { Employe } from "@/lib/data";
import { getInitials, cleanRegionName } from "./landing-utils";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";

interface BureauDirectoireProps {
  loading: boolean;
  members: Employe[];
  allDirectors?: Employe[];
}

export function BureauDirectoire({ loading, members, allDirectors = [] }: BureauDirectoireProps) {
  const { canSeeGovernanceStatus } = usePermissions();
  const showStatus = canSeeGovernanceStatus();
  const president = members.find(m => m.poste?.toLowerCase().includes('president') && !m.poste?.toLowerCase().includes('vice'));
  const vicePresidents = members.filter(m => m.poste?.toLowerCase().includes('vice-president'));

  const bureauMembers = members.filter(m =>
    (m.poste?.toLowerCase().includes('membre du bureau') || m.poste?.toLowerCase().includes('membre du directoire')) &&
    !m.poste?.toLowerCase().includes('president') &&
    !m.poste?.toLowerCase().includes('vice-president')
  );

  const cabinetAndSecretariat = members.filter(m => {
    const p = m.poste?.toLowerCase() || '';
    return (p.includes('secrétaire général') ||
      p.includes('directrice de cabinet') ||
      p.includes('directeur de cabinet')) &&
      !p.includes('chauffeur') &&
      !p.includes('assistant') &&
      !p.includes('sous-direct');
  }).sort((a, b) => {
    const aIsCabinet = (a.poste?.toLowerCase().includes('directrice de cabinet') || a.poste?.toLowerCase().includes('directeur de cabinet')) ? -1 : 1;
    const bIsCabinet = (b.poste?.toLowerCase().includes('directrice de cabinet') || b.poste?.toLowerCase().includes('directeur de cabinet')) ? -1 : 1;
    return aIsCabinet - bIsCabinet;
  });

  const otherDirectors = allDirectors.length > 0 ? allDirectors : members.filter(m => {
    const p = m.poste?.toLowerCase() || '';
    return (p.includes('directeur') || p.includes('directrice') || p.includes('cabinet')) &&
      !p.includes('secrétaire général') &&
      !p.includes('directrice de cabinet') &&
      !p.includes('directeur de cabinet') &&
      !p.includes('chauffeur') &&
      !p.includes('assistant') &&
      !p.includes('sous-direct');
  });

  return (
    <section id="directoire-section" className="py-12 bg-muted/50 min-h-[400px] flex items-center scroll-mt-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black mb-6">Le Bureau du Directoire</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Composition officielle du bureau exécutif, garante de la représentativité et de la collégialité des décisions.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="h-12 w-12 text-[#006039] animate-spin" />
            <p className="text-muted-foreground animate-pulse">Chargement de l'organigramme officiel...</p>
          </div>
        ) : (
          <>
            {president && (
              <div className="flex justify-center mb-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="w-full max-w-sm group relative">
                  <div className="absolute inset-x-[-20px] top-[-20px] bottom-[-20px] bg-gradient-to-br from-emerald-500/10 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl blur-xl" />
                  <div className="relative flex flex-col items-center bg-white p-6 rounded-xl border border-amber-200/50 shadow-2xl shadow-amber-500/10 transition-all hover:-translate-y-2">
                    <div className="w-40 h-40 rounded-full bg-gradient-to-br from-emerald-50 to-amber-50 flex items-center justify-center mb-6 overflow-hidden border-[6px] border-white shadow-xl relative group-hover:scale-105 transition-transform duration-500">
                      {president.photoUrl && !president.photoUrl.includes('ui-avatars.com') && !president.photoUrl.includes('placehold.co') ? (
                        <Image src={president.photoUrl} alt={president.name || ''} fill className="object-cover" sizes="160px" />
                      ) : (
                        <Image src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(president.name || 'P')}&backgroundColor=f59e0b&fontFamily=Inter`} alt={president.name || ''} fill className="object-cover" sizes="160px" />
                      )}
                    </div>
                    {showStatus && (
                      <Badge
                        className={cn(
                          "mt-2 border-none rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-widest shadow-sm",
                          president.status === 'Actif' ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"
                        )}
                      >
                        {president.status || 'Actif'}
                      </Badge>
                    )}
                    <h3 className="text-2xl font-black mt-6 text-slate-900 text-center uppercase tracking-tight">{president.name}</h3>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-500 mt-2 text-center">{president.poste || 'Président du Directoire'}</p>
                  </div>
                </div>
              </div>
            )}

            {vicePresidents.length > 0 && (
              <div className="flex flex-wrap justify-center gap-6 max-w-7xl mx-auto mb-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                {vicePresidents.map((vp, index) => (
                  <div key={index} className="group relative w-full sm:max-w-[280px] flex-1 min-w-[240px]">
                    <div className="absolute inset-x-[-10px] top-[-10px] bottom-[-10px] bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl blur-lg" />
                    <div className="relative flex flex-col items-center bg-white p-5 rounded-xl border border-slate-100 shadow-xl shadow-slate-200/50 transition-all hover:shadow-2xl hover:-translate-y-2">
                      <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mb-6 border-4 border-white shadow-lg overflow-hidden relative group-hover:scale-110 transition-transform duration-500">
                        {vp.photoUrl && !vp.photoUrl.includes('ui-avatars.com') && !vp.photoUrl.includes('placehold.co') ? (
                          <Image src={vp.photoUrl} alt={vp.name || ''} fill className="object-cover" sizes="96px" />
                        ) : (
                          <Image src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(vp.name || 'VP')}&backgroundColor=f59e0b&fontFamily=Inter`} alt={vp.name || ''} fill className="object-cover" sizes="96px" />
                        )}
                      </div>
                      <p className="text-[9px] uppercase tracking-widest font-black text-amber-500 text-center leading-tight mb-2">Vice-Président</p>
                      <h4 className="font-black text-sm text-slate-900 text-center leading-tight mb-2 uppercase tracking-tight">{vp.name}</h4>
                      {vp.Region && <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{cleanRegionName(vp.Region)}</p>}
                      {showStatus && (
                        <Badge
                          className={cn(
                            "mt-3 border-none rounded-full px-3 py-0.5 text-[8px] font-black uppercase tracking-widest",
                            vp.status === 'Actif' ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                          )}
                        >
                          {vp.status || 'Actif'}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {bureauMembers.length > 0 && (
              <>
                <div className="flex items-center gap-6 mb-4 mt-10 max-w-6xl mx-auto">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-200" />
                  <h3 className="text-2xl font-black text-amber-500 uppercase tracking-[0.2em]">Membres du Bureau</h3>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-200" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                  {bureauMembers.map((member, index) => (
                    <div key={index} className="group relative">
                      <div className="relative flex flex-col items-center bg-white p-6 rounded-[1.5rem] border border-slate-100 transition-all hover:bg-slate-50/50 hover:shadow-xl hover:-translate-y-1">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 border-2 border-white shadow-sm overflow-hidden relative group-hover:scale-110 transition-transform">
                          {member.photoUrl && !member.photoUrl.includes('ui-avatars.com') && !member.photoUrl.includes('placehold.co') ? (
                            <Image src={member.photoUrl} alt={member.name || ''} fill className="object-cover" sizes="64px" />
                          ) : (
                            <Image src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.name || 'MB')}&backgroundColor=f59e0b&fontFamily=Inter`} alt={member.name || ''} fill className="object-cover" sizes="64px" />
                          )}
                        </div>
                        <p className="text-[8px] uppercase tracking-[0.2em] font-black text-amber-500 text-center leading-tight mb-2">{member.poste || 'Membre du Bureau'}</p>
                        <h4 className="font-black text-xs text-slate-900 text-center uppercase tracking-tight">{member.name}</h4>
                        {member.Region && <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1">{cleanRegionName(member.Region)}</p>}
                        {showStatus && (
                          <Badge
                            className={cn(
                              "mt-2 border-none rounded-full px-2 py-0 text-[7px] font-black uppercase tracking-widest",
                              member.status === 'Actif' ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                            )}
                          >
                            {member.status || 'Actif'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {cabinetAndSecretariat.length > 0 && (
              <>
                <div className="flex items-center gap-4 mb-6 mt-10 max-w-6xl mx-auto">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#006039]/20" />
                  <h3 className="text-xl font-black text-[#006039] uppercase tracking-[0.2em]">Cabinet et Secrétariat Général</h3>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#006039]/20" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400">
                  {cabinetAndSecretariat.map((member, index) => (
                    <div key={index} className="group relative h-full">
                      <div className="relative flex flex-col items-center h-full bg-[#006039]/5 backdrop-blur-sm p-5 rounded-2xl border border-[#006039]/10 transition-all hover:bg-[#006039]/10 hover:shadow-lg">
                        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-4 border border-primary/10 shadow-sm overflow-hidden relative">
                          {member.photoUrl && !member.photoUrl.includes('ui-avatars.com') && !member.photoUrl.includes('placehold.co') ? (
                            <Image src={member.photoUrl} alt={member.name || ''} fill className="object-cover" sizes="80px" />
                          ) : (
                            <Image src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.name || 'CAB')}&backgroundColor=006039&fontFamily=Arial`} alt={member.name || ''} fill className="object-cover" sizes="80px" />
                          )}
                        </div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-[#006039] text-center leading-tight mb-1">{member.poste}</p>
                        <h4 className="font-bold text-lg text-[#1a1a1a] text-center">{member.name}</h4>
                        {member.Region && <p className="text-[10px] text-[#006039] font-bold uppercase mt-1">{cleanRegionName(member.Region)}</p>}
                        {showStatus && (
                          <Badge
                            className={cn(
                              "mt-2 border-none rounded-full px-2 py-0 text-[8px] font-black uppercase tracking-widest",
                              member.status === 'Actif' ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                            )}
                          >
                            {member.status || 'Actif'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {otherDirectors.length > 0 && (
              <>
                <div className="flex items-center gap-4 mb-6 mt-4 max-w-6xl mx-auto">
                  <div className="h-px flex-1 bg-muted/30" />
                  <h4 className="text-sm font-black text-muted-foreground uppercase tracking-[0.2em]">Les Directions</h4>
                  <div className="h-px flex-1 bg-muted/30" />
                </div>
                <div className="flex flex-wrap justify-center gap-6 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
                  {otherDirectors.map((member, index) => (
                    <div key={index} className="group relative w-full sm:max-w-[280px] flex-1 min-w-[240px]">
                      <div className="relative flex flex-col items-center h-full bg-white/40 backdrop-blur-sm p-6 rounded-2xl border border-primary/5 transition-all hover:bg-white/80 hover:shadow-lg">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4 border border-white shadow-sm overflow-hidden relative">
                          {member.photoUrl && !member.photoUrl.includes('ui-avatars.com') && !member.photoUrl.includes('placehold.co') ? (
                            <Image src={member.photoUrl} alt={member.name || ''} fill className="object-cover" sizes="64px" />
                          ) : (
                            <Image src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.name || 'DIR')}&backgroundColor=006039&fontFamily=Arial`} alt={member.name || ''} fill className="object-cover" sizes="64px" />
                          )}
                        </div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground text-center leading-tight mb-1">{member.poste}</p>
                        <h4 className="font-bold text-sm text-[#1a1a1a] text-center">{member.name}</h4>
                        {member.Region && <p className="text-[9px] text-[#006039] font-bold uppercase mt-1">{cleanRegionName(member.Region)}</p>}
                        {showStatus && (
                          <Badge
                            className={cn(
                              "mt-2 border-none rounded-full px-2 py-0 text-[7px] font-black uppercase tracking-widest",
                              member.status === 'Actif' ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                            )}
                          >
                            {member.status || 'Actif'}
                          </Badge>
                        )}
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
