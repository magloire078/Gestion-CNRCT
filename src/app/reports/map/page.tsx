"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  MapPin, Loader2, Filter, Home, Zap, Droplets,
  GraduationCap, HeartPulse, ShoppingBag, ArrowUpRight,
  X, RefreshCw, Map as MapIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getVillages } from "@/services/village-service";
import type { Village } from "@/types/village";

// Lazy-load Leaflet to avoid SSR issues
const DynamicVillagesMap = dynamic(
  () => import("@/components/map/villages-map"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">
          Chargement de la carte…
        </p>
      </div>
    ),
  }
);

type InfraFilter = "electricity" | "water" | "school" | "health" | "market";

const INFRA_FILTERS: { key: InfraFilter; label: string; icon: React.ElementType; color: string; bg: string }[] = [
  { key: "electricity", label: "Électricité", icon: Zap,          color: "text-amber-700",   bg: "bg-amber-50 border-amber-200" },
  { key: "water",       label: "Eau potable", icon: Droplets,     color: "text-sky-700",     bg: "bg-sky-50 border-sky-200" },
  { key: "school",      label: "École",       icon: GraduationCap,color: "text-indigo-700",  bg: "bg-indigo-50 border-indigo-200" },
  { key: "health",      label: "Santé",       icon: HeartPulse,   color: "text-rose-700",    bg: "bg-rose-50 border-rose-200" },
  { key: "market",      label: "Marché",      icon: ShoppingBag,  color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
];

export default function VillagesMapPage() {
  const [villages, setVillages] = useState<Village[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState<Set<InfraFilter>>(new Set());
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);

  useEffect(() => {
    getVillages()
      .then(setVillages)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleFilter = (key: InfraFilter) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const filteredVillages = useMemo(() => {
    if (activeFilters.size === 0) return villages;
    return villages.filter((v) => {
      for (const f of activeFilters) {
        if (f === "electricity" && !v.hasElectricity) return false;
        if (f === "water"       && !v.hasWater)       return false;
        if (f === "school"      && !v.hasSchool)       return false;
        if (f === "health"      && !v.hasHealthCenter) return false;
        if (f === "market"      && !v.hasMarket)       return false;
      }
      return true;
    });
  }, [villages, activeFilters]);

  // Stats
  const stats = useMemo(() => ({
    total: villages.length,
    withCoords: villages.filter((v) => v.latitude && v.longitude).length,
    electrified: villages.filter((v) => v.hasElectricity).length,
    water: villages.filter((v) => v.hasWater).length,
  }), [villages]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 lg:p-5 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-black uppercase tracking-[0.2em] text-[10px]">
            <MapIcon className="h-3.5 w-3.5" />
            Système d'Information Géographique
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white">
            Carte{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
              Interactive des Villages
            </span>
          </h1>
          <p className="text-slate-400 font-medium text-sm">
            {stats.withCoords} localités géolocalisées sur {stats.total} · Filtrage infrastructurel en temps réel
          </p>
        </div>
        <div className="flex gap-3">
          {activeFilters.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveFilters(new Set())}
              className="rounded-xl text-xs font-bold text-slate-300 border-slate-600 bg-slate-800 hover:bg-slate-700"
            >
              <X className="h-3 w-3 mr-1" /> Réinitialiser
            </Button>
          )}
          <Link href="/villages">
            <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold text-slate-300 border-slate-600 bg-slate-800 hover:bg-slate-700">
              <Home className="h-3.5 w-3.5 mr-2" /> Liste des villages
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Villages total",     value: stats.total,      color: "text-white" },
          { label: "Géolocalisés",       value: stats.withCoords, color: "text-indigo-300" },
          { label: "Électrifiés",        value: stats.electrified, color: "text-amber-300" },
          { label: "Eau potable",        value: stats.water,      color: "text-sky-300" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
            <p className={cn("text-3xl font-black mt-1", kpi.color)}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
          <Filter className="h-3.5 w-3.5" /> Filtrer par infrastructure :
        </span>
        {INFRA_FILTERS.map(({ key, label, icon: Icon, color, bg }) => (
          <button
            key={key}
            onClick={() => toggleFilter(key)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold transition-all",
              activeFilters.has(key)
                ? cn(bg, color, "shadow-md scale-105")
                : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
            {activeFilters.has(key) && (
              <span className="h-4 w-4 rounded-full bg-current opacity-20 flex items-center justify-center">
                <X className="h-2.5 w-2.5" />
              </span>
            )}
          </button>
        ))}
        <span className="ml-auto text-[10px] font-bold text-slate-500">
          {filteredVillages.length} localité{filteredVillages.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Map + Sidebar layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" style={{ height: "60vh" }}>
        {/* Map */}
        <div className="lg:col-span-3 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-slate-800">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            </div>
          ) : (
            <DynamicVillagesMap
              villages={filteredVillages}
              onVillageClick={setSelectedVillage}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4 overflow-y-auto">
          {selectedVillage ? (
            <Card className="border-none bg-white/10 backdrop-blur-md rounded-2xl text-white">
              <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-black text-white">{selectedVillage.name}</CardTitle>
                  <p className="text-xs text-slate-300 font-medium mt-0.5">{selectedVillage.department} · {selectedVillage.region}</p>
                </div>
                <button onClick={() => setSelectedVillage(null)} className="text-slate-400 hover:text-white transition-colors shrink-0">
                  <X className="h-4 w-4" />
                </button>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                {/* Infrastructure badges */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { ok: selectedVillage.hasElectricity, icon: "⚡", label: "Électricité" },
                    { ok: selectedVillage.hasWater,       icon: "💧", label: "Eau" },
                    { ok: selectedVillage.hasSchool,      icon: "🏫", label: "École" },
                    { ok: selectedVillage.hasHealthCenter,icon: "🏥", label: "Santé" },
                    { ok: selectedVillage.hasMarket,      icon: "🛒", label: "Marché" },
                  ].map((item) => (
                    <span
                      key={item.label}
                      className={cn(
                        "text-[9px] font-black px-2 py-1 rounded-full border",
                        item.ok
                          ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                          : "bg-white/5 border-white/10 text-slate-500"
                      )}
                    >
                      {item.icon} {item.label}
                    </span>
                  ))}
                </div>

                {/* Population */}
                {selectedVillage.population && (
                  <div className="text-[10px] font-bold text-slate-400">
                    👥 Population : <span className="text-white">{selectedVillage.population.toLocaleString()}</span>
                  </div>
                )}

                {/* IDL Score */}
                {selectedVillage.developmentScore !== undefined && (
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Indice IDL</p>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          selectedVillage.developmentScore >= 60 ? "bg-emerald-500" :
                          selectedVillage.developmentScore >= 30 ? "bg-amber-500" : "bg-rose-500"
                        )}
                        style={{ width: `${selectedVillage.developmentScore}%` }}
                      />
                    </div>
                    <p className="text-xs font-black text-white mt-1">{selectedVillage.developmentScore}/100</p>
                  </div>
                )}

                <Link href={`/villages/${selectedVillage.id}`}>
                  <Button size="sm" className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs mt-1">
                    Voir le profil <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5 text-center">
              <MapPin className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-medium">
                Cliquez sur un marqueur pour afficher les détails du village.
              </p>
            </div>
          )}

          {/* Top villages by IDL */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Top IDL</p>
            {[...villages]
              .filter((v) => v.developmentScore !== undefined)
              .sort((a, b) => (b.developmentScore ?? 0) - (a.developmentScore ?? 0))
              .slice(0, 5)
              .map((v) => (
                <div key={v.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{v.name}</p>
                    <p className="text-[9px] text-slate-500 truncate">{v.region}</p>
                  </div>
                  <Badge className={cn(
                    "text-[9px] font-black rounded-full px-2 border-none",
                    (v.developmentScore ?? 0) >= 60 ? "bg-emerald-500/20 text-emerald-300" :
                    (v.developmentScore ?? 0) >= 30 ? "bg-amber-500/20 text-amber-300" : "bg-rose-500/20 text-rose-300"
                  )}>
                    {v.developmentScore}
                  </Badge>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
