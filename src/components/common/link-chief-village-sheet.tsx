"use client";

import { useState, useEffect, useMemo } from "react";
import type { Chief } from "@/types/chief";
import type { Village } from "@/types/village";
import { linkChiefToVillage, unlinkChiefFromVillage, type SuccessionData } from "@/services/chief-service";
import { getChiefs } from "@/services/chief-service";
import { getVillages } from "@/services/village-service";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { SuccessionDialog } from "@/components/chiefs/succession-dialog";
import {
    Search,
    Link2,
    Link2Off,
    MapPin,
    Users,
    CheckCircle2,
    Loader2,
    AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Mode from-chief : on a le chef, on choisit un village ────────────────────
// ── Mode from-village : on a le village, on choisit un chef ─────────────────
type Mode = "from-chief" | "from-village";

interface LinkChiefVillageSheetProps {
    mode: Mode;
    chief?: Chief;       // fourni en mode from-chief
    village?: Village;   // fourni en mode from-village
    currentChief?: Chief | null; // chef actuel du village (mode from-village)
    isOpen: boolean;
    onCloseAction: () => void;
    onLinkedAction: () => void;
}

export function LinkChiefVillageSheet({
    mode,
    chief,
    village,
    currentChief,
    isOpen,
    onCloseAction,
    onLinkedAction,
}: LinkChiefVillageSheetProps) {
    const { toast } = useToast();
    const [query, setQuery] = useState("");
    const [items, setItems] = useState<(Chief | Village)[]>([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<Chief | Village | null>(null);
    const [isLinking, setIsLinking] = useState(false);

    // Succession dialog state
    const [successionOpen, setSuccessionOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<"link" | "unlink" | null>(null);

    // Load available items (villages or chiefs) on open
    useEffect(() => {
        if (!isOpen) { setQuery(""); setSelected(null); return; }
        setLoading(true);
        const fetch = mode === "from-chief"
            ? getVillages()
            : getChiefs();
        fetch
            .then(data => setItems(data as any[]))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [isOpen, mode]);

    // Filtered items
    const filtered = useMemo(() => {
        const q = query.toLowerCase().trim();
        if (!q) return items;
        return items.filter(item => {
            if (mode === "from-chief") {
                const v = item as Village;
                return v.name.toLowerCase().includes(q) ||
                    (v.region || "").toLowerCase().includes(q) ||
                    (v.department || "").toLowerCase().includes(q) ||
                    (v.subPrefecture || "").toLowerCase().includes(q);
            } else {
                const c = item as Chief;
                return c.name.toLowerCase().includes(q) ||
                    (c.village || "").toLowerCase().includes(q) ||
                    (c.role || "").toLowerCase().includes(q);
            }
        });
    }, [items, query, mode]);

    const handleSelectItem = (item: Chief | Village) => {
        setSelected(prev => prev && (prev as any).id === (item as any).id ? null : item);
    };

    // ── Link action ──────────────────────────────────────────────────────────
    const handleLinkClick = () => {
        if (!selected) return;
        // Check if target village already has a chief (mode from-chief)
        // or if linking requires succession (mode from-village and currentChief exists)
        const needsSuccession = mode === "from-chief"
            ? (selected as Village).currentChiefId && (selected as Village).currentChiefId !== chief?.id
            : currentChief && currentChief.id !== (selected as Chief).id;

        if (needsSuccession) {
            setPendingAction("link");
            setSuccessionOpen(true);
        } else {
            performLink();
        }
    };

    const performLink = async (succession?: SuccessionData) => {
        setIsLinking(true);
        try {
            if (mode === "from-chief" && chief) {
                await linkChiefToVillage(chief, selected as Village, succession);
                toast({ title: "✅ Village lié", description: `${chief.name} est maintenant chef de ${(selected as Village).name}.` });
            } else if (mode === "from-village" && village) {
                await linkChiefToVillage(selected as Chief, village, succession);
                toast({ title: "✅ Chef affecté", description: `${(selected as Chief).name} est maintenant chef de ${village.name}.` });
            }
            onLinkedAction();
            onCloseAction();
        } catch (e) {
            toast({ variant: "destructive", title: "Erreur", description: e instanceof Error ? e.message : "Impossible d'effectuer la liaison." });
        } finally {
            setIsLinking(false);
        }
    };

    // ── Unlink (déliaison) ────────────────────────────────────────────────────
    const handleUnlinkClick = () => {
        setPendingAction("unlink");
        setSuccessionOpen(true);
    };

    const performUnlink = async (succession: SuccessionData) => {
        setIsLinking(true);
        try {
            const chiefToUnlink = mode === "from-chief" ? chief : currentChief;
            if (!chiefToUnlink) return;
            await unlinkChiefFromVillage(chiefToUnlink, succession);
            toast({ title: "🔓 Siège libéré", description: `${chiefToUnlink.name} a été archivé. Le siège est maintenant vacant.` });
            onLinkedAction();
            onCloseAction();
        } catch (e) {
            toast({ variant: "destructive", title: "Erreur", description: e instanceof Error ? e.message : "Impossible de délier." });
        } finally {
            setIsLinking(false);
        }
    };

    const handleSuccessionConfirm = async (data: SuccessionData) => {
        setSuccessionOpen(false);
        if (pendingAction === "link") await performLink(data);
        else if (pendingAction === "unlink") await performUnlink(data);
        setPendingAction(null);
    };

    // ── Context info ─────────────────────────────────────────────────────────
    const sourceName = mode === "from-chief" ? chief?.name : village?.name;
    const sourceDetail = mode === "from-chief"
        ? (chief?.role || "Chef")
        : `${village?.region || ""} • ${village?.department || ""}`;

    const isCurrentlyLinked = mode === "from-chief"
        ? !!chief?.villageId
        : !!currentChief;

    const outgoingChiefName = mode === "from-chief"
        ? (items.find(i => (i as Village).id === (selected as Village)?.currentChiefId) as Chief)?.name || ""
        : currentChief?.name || "";

    const incomingName = mode === "from-chief"
        ? chief?.name
        : (selected as Chief)?.name;

    return (
        <>
            <Sheet open={isOpen} onOpenChange={(o) => { if (!o) onCloseAction(); }}>
                <SheetContent className="sm:max-w-lg p-0 flex flex-col h-[100dvh] border-l-0 sm:border-l bg-white">
                    {/* Header */}
                    <div className="bg-slate-950 text-white p-6 shrink-0 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/20" />
                        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 via-emerald-500 to-amber-500" />
                        <SheetHeader className="relative z-10 text-left space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                    <Link2 className="h-4 w-4 text-blue-400" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
                                    {mode === "from-chief" ? "Affecter un village" : "Affecter un chef"}
                                </span>
                            </div>
                            <SheetTitle className="text-xl font-black text-white leading-tight">
                                {sourceName}
                            </SheetTitle>
                            <SheetDescription className="text-slate-400 text-xs">
                                {sourceDetail}
                            </SheetDescription>
                        </SheetHeader>
                    </div>

                    {/* Unlink current if applicable */}
                    {isCurrentlyLinked && (
                        <div className="bg-amber-50 border-b border-amber-100 p-3 flex items-center gap-3 shrink-0">
                            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                            <p className="text-xs text-amber-700 font-bold flex-1">
                                {mode === "from-chief"
                                    ? `Actuellement lié au village "${chief?.village}"`
                                    : `Chef actuel : ${currentChief?.name}`}
                            </p>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[10px] font-black border-amber-200 text-amber-700 hover:bg-amber-100 shrink-0"
                                onClick={handleUnlinkClick}
                                disabled={isLinking}
                            >
                                <Link2Off className="h-3 w-3 mr-1" />
                                Délier
                            </Button>
                        </div>
                    )}

                    {/* Search */}
                    <div className="p-4 border-b border-slate-100 shrink-0">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder={mode === "from-chief" ? "Rechercher un village…" : "Rechercher un chef…"}
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                className="pl-9 h-10 rounded-xl border-slate-200"
                                autoFocus
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest">
                            {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
                        </p>
                    </div>

                    {/* List */}
                    <ScrollArea className="flex-1">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                            </div>
                        ) : (
                            <div className="p-4 space-y-2">
                                {filtered.map(item => {
                                    const id = (item as any).id;
                                    const isSelected = (selected as any)?.id === id;

                                    if (mode === "from-chief") {
                                        const v = item as Village;
                                        const isOccupied = !!v.currentChiefId;
                                        return (
                                            <button
                                                key={id}
                                                onClick={() => handleSelectItem(v)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-200",
                                                    isSelected
                                                        ? "border-slate-900 bg-slate-950 text-white shadow-lg"
                                                        : "border-slate-100 bg-slate-50 hover:border-slate-300 hover:bg-white"
                                                )}
                                            >
                                                <div className={cn(
                                                    "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                                                    isSelected ? "bg-white/10" : "bg-slate-200"
                                                )}>
                                                    <MapPin className={cn("h-5 w-5", isSelected ? "text-white" : "text-slate-500")} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={cn("font-black text-sm truncate", isSelected ? "text-white" : "text-slate-900")}>
                                                        {v.name}
                                                    </p>
                                                    <p className={cn("text-[10px] truncate", isSelected ? "text-slate-400" : "text-slate-500")}>
                                                        {v.region} • {v.department} • {v.subPrefecture}
                                                    </p>
                                                </div>
                                                <Badge className={cn(
                                                    "text-[9px] font-black shrink-0 border-none",
                                                    isOccupied
                                                        ? (isSelected ? "bg-amber-500/20 text-amber-300" : "bg-amber-50 text-amber-700")
                                                        : (isSelected ? "bg-emerald-500/20 text-emerald-300" : "bg-emerald-50 text-emerald-700")
                                                )}>
                                                    {isOccupied ? "OCCUPÉ" : "VACANT"}
                                                </Badge>
                                                {isSelected && <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />}
                                            </button>
                                        );
                                    } else {
                                        const c = item as Chief;
                                        const isActive = c.status === 'actif' || c.status === 'a_vie';
                                        return (
                                            <button
                                                key={id}
                                                onClick={() => handleSelectItem(c)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-200",
                                                    isSelected
                                                        ? "border-slate-900 bg-slate-950 text-white shadow-lg"
                                                        : "border-slate-100 bg-slate-50 hover:border-slate-300 hover:bg-white"
                                                )}
                                            >
                                                <Avatar className="h-10 w-10 rounded-lg shrink-0">
                                                    <AvatarImage src={c.photoUrl || ""} />
                                                    <AvatarFallback className={cn("rounded-lg font-black text-sm", isSelected ? "bg-white/10 text-white" : "bg-slate-200 text-slate-600")}>
                                                        {c.name?.charAt(0) || "?"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className={cn("font-black text-sm truncate", isSelected ? "text-white" : "text-slate-900")}>
                                                        {c.name}
                                                    </p>
                                                    <p className={cn("text-[10px] truncate", isSelected ? "text-slate-400" : "text-slate-500")}>
                                                        {c.role} {c.village ? `• ${c.village}` : "• Sans village"}
                                                    </p>
                                                </div>
                                                <Badge className={cn(
                                                    "text-[9px] font-black shrink-0 border-none",
                                                    isActive
                                                        ? (isSelected ? "bg-emerald-500/20 text-emerald-300" : "bg-emerald-50 text-emerald-700")
                                                        : (isSelected ? "bg-slate-500/20 text-slate-300" : "bg-slate-100 text-slate-500")
                                                )}>
                                                    {c.status === 'archive' ? "ARCHIVÉ" : isActive ? "ACTIF" : c.status?.toUpperCase()}
                                                </Badge>
                                                {isSelected && <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />}
                                            </button>
                                        );
                                    }
                                })}
                            </div>
                        )}
                    </ScrollArea>

                    {/* Footer action */}
                    <div className="p-4 border-t border-slate-100 shrink-0 bg-slate-50">
                        <Button
                            className="w-full h-12 rounded-xl font-black text-sm bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all"
                            disabled={!selected || isLinking}
                            onClick={handleLinkClick}
                        >
                            {isLinking
                                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                : <Link2 className="mr-2 h-4 w-4" />
                            }
                            {selected
                                ? mode === "from-chief"
                                    ? `Lier à "${(selected as Village).name}"`
                                    : `Affecter "${(selected as Chief).name}"`
                                : mode === "from-chief"
                                    ? "Sélectionnez un village"
                                    : "Sélectionnez un chef"
                            }
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Succession Dialog */}
            <SuccessionDialog
                isOpen={successionOpen}
                outgoingChiefName={outgoingChiefName}
                incomingChiefName={pendingAction === "link" ? incomingName : undefined}
                onConfirm={handleSuccessionConfirm}
                onCancel={() => { setSuccessionOpen(false); setPendingAction(null); }}
            />
        </>
    );
}
