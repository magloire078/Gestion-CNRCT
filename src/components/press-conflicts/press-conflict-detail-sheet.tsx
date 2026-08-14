"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PressConflict } from "@/types/press-conflict";
import { 
  Newspaper, 
  MapPin, 
  Calendar, 
  Tag, 
  FileText, 
  AlertCircle, 
  Pencil, 
  Printer, 
  CheckCircle2, 
  Layers
} from "lucide-react";

interface PressConflictDetailSheetProps {
  isOpen: boolean;
  conflict: PressConflict | null;
  onCloseAction: () => void;
  onEditAction?: (conflict: PressConflict) => void;
}

export function PressConflictDetailSheet({
  isOpen,
  conflict,
  onCloseAction,
  onEditAction,
}: PressConflictDetailSheetProps) {
  if (!conflict) return null;

  const getStatusBadge = (status: string) => {
    if (status.includes("En cours")) return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">{status}</Badge>;
    if (status.includes("À suivre")) return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">{status}</Badge>;
    if (status.toLowerCase().includes("résolu")) return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">{status}</Badge>;
    if (status.toLowerCase().includes("clos")) return <Badge variant="destructive">{status}</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "Foncier":
        return <Badge variant="default" className="bg-emerald-700">{type}</Badge>;
      case "Affrontement intercommunautaire":
        return <Badge variant="destructive">{type}</Badge>;
      case "Désignation des chefs":
        return <Badge className="bg-purple-600 text-white">{type}</Badge>;
      case "Problème de justice":
        return <Badge className="bg-indigo-600 text-white">{type}</Badge>;
      case "Orpaillage":
        return <Badge className="bg-amber-600 text-white">{type}</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onCloseAction(); }}>
      <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col p-0 bg-background">
        <SheetHeader className="px-6 py-4 border-b bg-muted/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                #{conflict.orderNumber || "•"}
              </span>
              <SheetTitle className="text-lg">
                Fiche de Veille {conflict.trackingId ? `(${conflict.trackingId})` : ""}
              </SheetTitle>
            </div>
            <div className="flex items-center gap-1">
              {getStatusBadge(conflict.status)}
            </div>
          </div>
          <SheetDescription className="flex items-center gap-2 text-xs">
            <Calendar className="h-3.5 w-3.5" />
            Faits relevés le : <span className="font-semibold text-foreground">{conflict.dateOfFacts}</span>
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-4 space-y-6">
          <div className="space-y-6">
            {/* Metadonnées principales */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl border bg-muted/20 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block font-medium">Source / Journal</span>
                <span className="font-semibold text-primary flex items-center gap-1.5 mt-0.5">
                  <Newspaper className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {conflict.source}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block font-medium">Catégorie</span>
                <span className="font-medium flex items-center gap-1.5 mt-0.5">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  {conflict.category}
                </span>
              </div>
              <div className="col-span-2 pt-2 border-t">
                <span className="text-xs text-muted-foreground block font-medium">Localisation</span>
                <div className="flex items-center gap-1.5 mt-0.5 font-medium flex-wrap">
                  <MapPin className="h-4 w-4 text-rose-500 shrink-0" />
                  <span>{conflict.locality}</span>
                  {conflict.subPrefecture && <span className="text-slate-500 font-normal"> (S/P {conflict.subPrefecture})</span>}
                  {conflict.department && <span className="text-slate-500 font-normal">, Dép. {conflict.department}</span>}
                  <span className="text-muted-foreground text-xs font-normal">({conflict.region})</span>
                </div>
                {(conflict.latitude !== undefined || conflict.longitude !== undefined) && (
                  <div className="text-[11px] text-slate-400 mt-1 pl-5 font-mono">
                    GPS : {conflict.latitude?.toFixed(6) || "N/A"}, {conflict.longitude?.toFixed(6) || "N/A"}
                  </div>
                )}
              </div>
            </div>

            {/* Type de conflit */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Type de Conflit / Thématique
              </span>
              <div>{getTypeBadge(conflict.conflictType)}</div>
            </div>

            {/* Description des faits */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-primary" />
                Description des Faits Signalés
              </span>
              <div className="p-4 rounded-xl border bg-card text-card-foreground text-sm leading-relaxed whitespace-pre-wrap">
                {conflict.description}
              </div>
            </div>

            {/* Observations & Analyses */}
            {conflict.observations && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 text-amber-700">
                  <AlertCircle className="h-4 w-4" />
                  Observations & Recoupements Analytiques
                </span>
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 text-amber-950 dark:text-amber-200 text-sm leading-relaxed">
                  {conflict.observations}
                </div>
              </div>
            )}

            {/* Note institutionnelle */}
            <div className="p-3 rounded-lg border border-dashed bg-muted/30 text-xs text-muted-foreground">
              ℹ️ Ce fait est issu de la veille médiatique / terrain et n'engage pas à ce stade une saisine officielle auprès de la CNRCT.
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-muted/20 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onCloseAction}>
            Fermer
          </Button>
          <div className="flex items-center gap-2">
            {onEditAction && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  onCloseAction();
                  onEditAction(conflict);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
                Modifier
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
