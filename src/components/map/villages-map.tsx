"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import type { Village } from "@/types/village";
import { cn } from "@/lib/utils";

// Fix Leaflet icons
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
}

const createVillageIcon = (score: number) => {
  const color =
    score >= 60 ? "#10b981" :
    score >= 30 ? "#f59e0b" : "#ef4444";

  return new L.DivIcon({
    className: "bg-transparent border-0",
    html: `<div style="background:${color}" class="w-8 h-8 rounded-full border-[3px] border-white shadow-lg flex items-center justify-center text-white text-[10px] font-black transition-transform hover:scale-125">
      🏡
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -34],
  });
};

interface VillagesMapProps {
  villages: Village[];
  onVillageClick?: (village: Village) => void;
  height?: string;
}

export default function VillagesMap({ villages, onVillageClick, height = "100%" }: VillagesMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
      document.querySelectorAll(".leaflet-container").forEach((c: any) => {
        c._leaflet_id = null;
      });
    };
  }, []);

  const defaultCenter: [number, number] = [7.539989, -5.54708]; // Ivory Coast
  const mappable = villages.filter((v) => v.latitude && v.longitude);

  if (!isMounted) {
    return <div style={{ height, width: "100%" }} className="bg-slate-800 animate-pulse rounded-2xl" />;
  }

  return (
    <MapContainer
      center={defaultCenter}
      zoom={6}
      scrollWheelZoom
      style={{ height, width: "100%", zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={60}
        showCoverageOnHover={false}
        iconCreateFunction={(cluster: any) => {
          const count = cluster.getChildCount();
          return new L.DivIcon({
            html: `<div class="w-12 h-12 rounded-full bg-indigo-600 text-white font-black text-sm flex items-center justify-center border-4 border-white shadow-2xl">${count}</div>`,
            className: "bg-transparent",
            iconSize: [48, 48],
            iconAnchor: [24, 24],
          });
        }}
      >
        {mappable.map((village) => (
          <Marker
            key={village.id}
            position={[village.latitude!, village.longitude!]}
            icon={createVillageIcon(village.developmentScore ?? 0)}
          >
            <Popup className="rounded-xl overflow-hidden border-0 shadow-2xl p-0 min-w-[200px]">
              <div className="p-4 bg-slate-900 text-white">
                <h4 className="font-black text-sm text-white mb-1">{village.name}</h4>
                <p className="text-[10px] text-slate-400 font-medium mb-3">
                  {village.subPrefecture} · {village.region}
                </p>

                <div className="flex flex-wrap gap-1 mb-3">
                  {[
                    { ok: village.hasElectricity, emoji: "⚡" },
                    { ok: village.hasWater,        emoji: "💧" },
                    { ok: village.hasSchool,       emoji: "🏫" },
                    { ok: village.hasHealthCenter, emoji: "🏥" },
                    { ok: village.hasMarket,       emoji: "🛒" },
                  ].map((item, i) => (
                    <span
                      key={i}
                      className={cn(
                        "text-[11px] px-1.5 py-0.5 rounded",
                        item.ok ? "bg-emerald-500/20 text-emerald-300" : "opacity-30"
                      )}
                    >
                      {item.emoji}
                    </span>
                  ))}
                </div>

                {village.developmentScore !== undefined && (
                  <div className="mb-3">
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-1">
                      <span>IDL</span><span>{village.developmentScore}/100</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          (village.developmentScore ?? 0) >= 60 ? "bg-emerald-500" :
                          (village.developmentScore ?? 0) >= 30 ? "bg-amber-500" : "bg-rose-500"
                        )}
                        style={{ width: `${village.developmentScore}%` }}
                      />
                    </div>
                  </div>
                )}

                {onVillageClick && (
                  <button
                    onClick={() => onVillageClick(village)}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest py-2 rounded-lg transition-colors"
                  >
                    Voir le profil
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
