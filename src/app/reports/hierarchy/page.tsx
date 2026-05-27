"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Crown,
  ChevronRight,
  ChevronDown,
  Users,
  MapPin,
  Building2,
  Home,
  Loader2,
  TreePine,
  Search,
  Filter,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getChiefs } from "@/services/chief-service";
import type { Chief, ChiefRole } from "@/types/chief";

// ─── Role config ────────────────────────────────────────────────────────────

const ROLE_ORDER: ChiefRole[] = [
  "Roi",
  "Chef de province",
  "Chef de canton",
  "Chef de tribu",
  "Chef de Village",
];

const ROLE_CONFIG: Record<ChiefRole, { icon: React.ElementType; color: string; bg: string; border: string; indent: number }> = {
  "Roi":              { icon: Crown,     color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",   indent: 0 },
  "Chef de province": { icon: Building2, color: "text-indigo-700",  bg: "bg-indigo-50",  border: "border-indigo-200",  indent: 1 },
  "Chef de canton":   { icon: MapPin,    color: "text-violet-700",  bg: "bg-violet-50",  border: "border-violet-200",  indent: 2 },
  "Chef de tribu":    { icon: Users,     color: "text-sky-700",     bg: "bg-sky-50",     border: "border-sky-200",     indent: 3 },
  "Chef de Village":  { icon: Home,      color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", indent: 4 },
};

// ─── Types ───────────────────────────────────────────────────────────────────

type GroupedNode = {
  region: string;
  chiefs: Chief[];
};

// ─── Chief Card ──────────────────────────────────────────────────────────────

function ChiefNode({ chief }: { chief: Chief }) {
  const cfg = ROLE_CONFIG[chief.role] ?? ROLE_CONFIG["Chef de Village"];
  const Icon = cfg.icon;
  const indent = cfg.indent;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-md group cursor-pointer",
        cfg.bg, cfg.border
      )}
      style={{ marginLeft: `${indent * 24}px` }}
    >
      {/* Connector line */}
      {indent > 0 && (
        <div className="shrink-0 flex items-center">
          <div className="h-px w-4 bg-slate-200" />
        </div>
      )}

      {/* Icon */}
      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm", cfg.bg, cfg.border, "border")}>
        <Icon className={cn("h-4 w-4", cfg.color)} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={cn("font-black text-sm truncate", cfg.color)}>{chief.name}</p>
        <div className="flex items-center gap-2 flex-wrap mt-0.5">
          <span className="text-[10px] font-bold text-slate-500">{chief.role}</span>
          {chief.title && chief.title !== chief.role && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-[10px] text-slate-400 font-medium italic">{chief.title}</span>
            </>
          )}
          {chief.status === "actif" || chief.status === "a_vie" ? (
            <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">Actif</span>
          ) : (
            <span className="text-[9px] font-black text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-full">Archivé</span>
          )}
        </div>
      </div>

      {/* Territory */}
      <div className="hidden sm:flex flex-col items-end text-right shrink-0">
        <span className="text-[10px] font-bold text-slate-500 truncate max-w-[120px]">{chief.village || chief.subPrefecture}</span>
        <span className="text-[9px] text-slate-400">{chief.department}</span>
      </div>

      {/* Link */}
      <Link href={`/chiefs/${chief.id}`} onClick={(e) => e.stopPropagation()}>
        <div className="h-7 w-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-900 hover:text-white hover:border-slate-900 shrink-0">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </div>
      </Link>
    </div>
  );
}

// ─── Region Block ─────────────────────────────────────────────────────────────

function RegionBlock({ region, chiefs, search }: { region: string; chiefs: Chief[]; search: string }) {
  const [expanded, setExpanded] = useState(true);

  const filtered = useMemo(() => {
    if (!search) return chiefs;
    const q = search.toLowerCase();
    return chiefs.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        (c.village || "").toLowerCase().includes(q) ||
        (c.department || "").toLowerCase().includes(q)
    );
  }, [chiefs, search]);

  if (filtered.length === 0) return null;

  // Sort by role hierarchy then name
  const sorted = [...filtered].sort((a, b) => {
    const ri = ROLE_ORDER.indexOf(a.role);
    const rj = ROLE_ORDER.indexOf(b.role);
    if (ri !== rj) return ri - rj;
    return a.name.localeCompare(b.name);
  });

  return (
    <Card className="border-none shadow-xl shadow-slate-200/40 rounded-2xl overflow-hidden bg-white">
      {/* Region header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <MapPin className="h-4 w-4 text-white" />
          </div>
          <div className="text-left">
            <p className="font-black text-slate-900 text-base">{region}</p>
            <p className="text-xs text-slate-400 font-medium">{filtered.length} autorité{filtered.length > 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border-indigo-100">
            {sorted.filter((c) => c.status === "actif" || c.status === "a_vie").length} actifs
          </Badge>
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Chiefs list */}
      {expanded && (
        <CardContent className="px-5 pb-5 pt-0 space-y-2">
          <div className="h-px bg-slate-50 mb-3" />
          {sorted.map((c) => (
            <ChiefNode key={c.id} chief={c} />
          ))}
        </CardContent>
      )}
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HierarchyPage() {
  const [chiefs, setChiefs] = useState<Chief[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "actif" | "archive">("actif");

  useEffect(() => {
    getChiefs()
      .then(setChiefs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Filter by status
  const filtered = useMemo(() => {
    if (filterStatus === "all") return chiefs;
    if (filterStatus === "actif") return chiefs.filter((c) => c.status === "actif" || c.status === "a_vie");
    return chiefs.filter((c) => c.status === "archive");
  }, [chiefs, filterStatus]);

  // Group by region
  const grouped = useMemo(() => {
    const map: Record<string, Chief[]> = {};
    for (const c of filtered) {
      const key = c.region || "Région non définie";
      if (!map[key]) map[key] = [];
      map[key].push(c);
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([region, chiefs]) => ({ region, chiefs }));
  }, [filtered]);

  // Global KPIs
  const kpis = useMemo(() => ({
    total: chiefs.length,
    actifs: chiefs.filter((c) => c.status === "actif" || c.status === "a_vie").length,
    regions: new Set(chiefs.map((c) => c.region)).size,
    rois: chiefs.filter((c) => c.role === "Roi").length,
  }), [chiefs]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/20 to-indigo-50/30 p-6 lg:p-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-amber-700 font-black uppercase tracking-[0.2em] text-[10px] shadow-sm">
            <TreePine className="h-3.5 w-3.5" />
            Structure coutumière
          </div>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-slate-900">
            Arbre{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">
              Hiérarchique
            </span>
          </h1>
          <p className="text-slate-500 font-medium text-base max-w-xl">
            Visualisation de la chaîne coutumière : Roi → Province → Canton → Tribu → Village, par région.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/chiefs">
            <Button variant="outline" className="rounded-xl font-bold">
              <Crown className="h-4 w-4 mr-2 text-amber-500" />
              Gérer les chefs
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total autorités", value: kpis.total, color: "text-slate-700", bg: "bg-slate-50", border: "border-slate-200" },
          { label: "Actifs", value: kpis.actifs, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
          { label: "Régions couvertes", value: kpis.regions, color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200" },
          { label: "Rois / Souverains", value: kpis.rois, color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
        ].map((kpi) => (
          <div key={kpi.label} className={cn("rounded-2xl border p-4 flex flex-col gap-1", kpi.bg, kpi.border)}>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
            <p className={cn("text-3xl font-black", kpi.color)}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {ROLE_ORDER.map((role) => {
          const cfg = ROLE_CONFIG[role];
          const Icon = cfg.icon;
          return (
            <div key={role} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold", cfg.bg, cfg.border, cfg.color)}>
              <Icon className="h-3.5 w-3.5" />
              {role}
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Rechercher par nom, rôle, village…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl border-slate-200 bg-white shadow-sm"
          />
        </div>
        <div className="flex rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {(["all", "actif", "archive"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                "px-4 py-2 text-xs font-bold transition-all",
                filterStatus === s ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
              )}
            >
              {s === "all" ? "Tous" : s === "actif" ? "Actifs" : "Archivés"}
            </button>
          ))}
        </div>
      </div>

      {/* Tree */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
        </div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-24 text-slate-400 font-medium">
          <TreePine className="h-12 w-12 mx-auto mb-4 opacity-20" />
          Aucune autorité trouvée.
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ region, chiefs }) => (
            <RegionBlock key={region} region={region} chiefs={chiefs} search={search} />
          ))}
        </div>
      )}
    </div>
  );
}
