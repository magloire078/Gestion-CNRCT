"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getChief } from "@/services/chief-service";
import type { Chief } from "@/types/chief";
import { Loader2, Crown, MapPin, Phone, Mail, Calendar, Shield, Star, BookOpen } from "lucide-react";

const ROLE_EMOJI: Record<string, string> = {
  "Roi": "👑",
  "Chef de province": "🏛️",
  "Chef de canton": "🗺️",
  "Chef de tribu": "⚔️",
  "Chef de Village": "🏡",
};

export default function ChiefPrintPage() {
  const { id } = useParams() as { id: string };
  const [chief, setChief] = useState<Chief | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChief(id)
      .then(setChief)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!chief) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white text-slate-500">
        Chef introuvable.
      </div>
    );
  }

  const today = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric"
  });

  return (
    <>
      {/* Print Controls — hidden when printing */}
      <div className="print:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white flex items-center justify-between px-6 py-3 gap-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <Crown className="h-5 w-5 text-amber-400" />
          <span className="font-black text-sm">Fiche officielle — {chief.name}</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 rounded-xl border border-white/20 text-sm font-bold hover:bg-white/10 transition-colors"
          >
            ← Retour
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-900 text-sm font-black hover:bg-amber-400 transition-colors"
          >
            🖨️ Imprimer / Enregistrer PDF
          </button>
        </div>
      </div>

      {/* A4 Page */}
      <div className="print:pt-0 pt-16 bg-slate-100 min-h-screen print:bg-white">
        <div
          className="mx-auto bg-white shadow-2xl print:shadow-none"
          style={{ width: "210mm", minHeight: "297mm", padding: "20mm" }}
        >
          {/* Header Banner */}
          <div className="flex items-start justify-between mb-4 pb-6 border-b-4 border-amber-500">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                  République de Côte d'Ivoire
                </div>
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 mb-3">
                Conseil National des Rois et Chefs Traditionnels
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
                Fiche d'Identité Officielle
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-1">Autorité Coutumière Reconnue</p>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                N° Registre CNRCT
              </div>
              <div className="text-lg font-black text-slate-900 font-mono">
                {chief.CNRCTRegistrationNumber || "EN ATTENTE"}
              </div>
              <div className="text-[9px] text-slate-400 mt-2 font-medium">
                Émis le {today}
              </div>
            </div>
          </div>

          {/* Chief Identity */}
          <div className="flex gap-4 mb-4">
            {/* Photo */}
            <div className="shrink-0">
              <div className="w-32 h-40 rounded-xl overflow-hidden bg-slate-100 border-2 border-slate-200 shadow-md">
                {chief.photoUrl ? (
                  <img
                    src={chief.photoUrl}
                    alt={chief.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Crown className="h-12 w-12 text-slate-300" />
                  </div>
                )}
              </div>
              <div className="text-center mt-2 text-2xl">
                {ROLE_EMOJI[chief.role] || "👑"}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Titre et Nom Officiel
                </p>
                <h2 className="text-2xl font-black text-slate-900 leading-tight">
                  {chief.title} {chief.name}
                </h2>
                {(chief.firstName || chief.lastName) && (
                  <p className="text-sm text-slate-600 font-medium mt-0.5">
                    Nom civil : {[chief.lastName, chief.firstName].filter(Boolean).join(" ")}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Rôle", value: chief.role },
                  { label: "Sexe", value: chief.sexe || "—" },
                  { label: "Date de naissance", value: chief.dateOfBirth || "—" },
                  { label: "Groupe Ethnique", value: chief.ethnicGroup || "—" },
                  { label: "Mode de désignation", value: chief.designationMode || "—" },
                  { label: "Date d'intronisation", value: chief.throneAccessionDate || chief.designationDate || "—" },
                ].map((row) => (
                  <div key={row.label} className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{row.label}</p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">{row.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Territory */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-6 w-6 rounded-md bg-amber-500 flex items-center justify-center">
                <MapPin className="h-3.5 w-3.5 text-white" />
              </div>
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-widest">
                Ressort Territorial
              </h3>
            </div>
            <div className="grid grid-cols-4 gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
              {[
                { label: "Village / Localité", value: chief.village },
                { label: "Sous-préfecture", value: chief.subPrefecture },
                { label: "Département", value: chief.department },
                { label: "Région", value: chief.region },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest">{item.label}</p>
                  <p className="text-sm font-black text-slate-900 mt-0.5">{item.value || "—"}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-6 w-6 rounded-md bg-indigo-500 flex items-center justify-center">
                <Phone className="h-3.5 w-3.5 text-white" />
              </div>
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-widest">
                Coordonnées Officielles
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Téléphone
                </p>
                <p className="text-sm font-bold text-slate-800 mt-1">{chief.phone || chief.contact || "—"}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Email
                </p>
                <p className="text-sm font-bold text-slate-800 mt-1">{chief.email || "—"}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Adresse
                </p>
                <p className="text-sm font-bold text-slate-800 mt-1">{chief.address || "—"}</p>
              </div>
            </div>
          </div>

          {/* Affiliation CNRCT */}
          {chief.cnrctAffiliation && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-md bg-violet-500 flex items-center justify-center">
                  <Shield className="h-3.5 w-3.5 text-white" />
                </div>
                <h3 className="font-black text-sm text-slate-900 uppercase tracking-widest">
                  Affiliation CNRCT
                </h3>
              </div>
              <div className="p-3 rounded-xl bg-violet-50 border border-violet-100 inline-flex items-center gap-2">
                <Star className="h-4 w-4 text-violet-600" />
                <span className="text-sm font-black text-violet-900">{chief.cnrctAffiliation}</span>
              </div>
            </div>
          )}

          {/* Biography */}
          {chief.bio && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-md bg-slate-700 flex items-center justify-center">
                  <BookOpen className="h-3.5 w-3.5 text-white" />
                </div>
                <h3 className="font-black text-sm text-slate-900 uppercase tracking-widest">
                  Biographie & Mission
                </h3>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  {chief.bio}
                </p>
              </div>
            </div>
          )}

          {/* Career timeline (brief) */}
          {chief.career && chief.career.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-md bg-amber-600 flex items-center justify-center">
                  <Calendar className="h-3.5 w-3.5 text-white" />
                </div>
                <h3 className="font-black text-sm text-slate-900 uppercase tracking-widest">
                  Événements de Carrière
                </h3>
              </div>
              <div className="space-y-2">
                {chief.career.slice(0, 5).map((ev) => (
                  <div key={ev.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-20 shrink-0 pt-0.5">
                      {ev.date}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-black text-slate-900">{ev.title}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{ev.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Official Footer */}
          <div className="mt-10 pt-6 border-t-2 border-slate-100">
            <div className="flex items-end justify-between">
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Document généré par le Système de Gestion CNRCT
                </p>
                <p className="text-[9px] text-slate-400 font-medium">
                  Date d'émission : {today}
                </p>
                <p className="text-[9px] text-slate-400 font-medium">
                  Ce document est un extrait officiel du registre des autorités coutumières de Côte d'Ivoire.
                </p>
              </div>
              <div className="text-right space-y-1">
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Signature &amp; Cachet CNRCT
                </div>
                <div className="h-16 w-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center">
                  <Crown className="h-6 w-6 text-slate-200" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </>
  );
}
