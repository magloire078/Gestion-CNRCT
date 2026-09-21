"use client";

import React, { useState, useMemo } from "react";
import { 
    format, 
    parseISO, 
    isValid, 
    isThisMonth, 
    isThisQuarter, 
    isThisYear, 
    getMonth 
} from "date-fns";
import { fr } from "date-fns/locale";
import { 
    Printer, 
    Calendar, 
    Filter, 
    ShieldAlert, 
    CheckCircle2, 
    Users, 
    AlertTriangle, 
    FileText, 
    MapPin, 
    Tag,
    Clock,
    Sparkles
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { Conflict, ConflictStatus } from "@/types/common";
import { IVORIAN_REGIONS } from "@/constants/regions";
import { getOfficialRegion } from "@/lib/normalization-utils";

export interface ConflictPrintConfig {
    conflicts: Conflict[];
    periodLabel: string;
    stats: {
        total: number;
        resolved: number;
        mediation: number;
        open: number;
        resolutionRate: number;
        topType: string;
    };
}

interface PrintConflictsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    conflicts: Conflict[];
    availableTypes: string[];
    initialPeriod?: string;
    initialRegion?: string;
    onConfirmPrint: (config: ConflictPrintConfig) => void;
}

export function PrintConflictsDialog({
    isOpen,
    onClose,
    conflicts,
    availableTypes,
    initialPeriod = "Tous",
    initialRegion = "Tous",
    onConfirmPrint,
}: PrintConflictsDialogProps) {
    const [mode, setMode] = useState<"preset" | "custom">("preset");
    const [selectedPeriodPreset, setSelectedPeriodPreset] = useState<string>(initialPeriod);
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [selectedRegion, setSelectedRegion] = useState<string>(initialRegion);
    const [selectedStatus, setSelectedStatus] = useState<string>("Tous");
    const [selectedType, setSelectedType] = useState<string>("Tous");

    // Dynamic years available in dataset
    const availableYears = useMemo(() => {
        const years = new Set<string>();
        conflicts.forEach(c => {
            if (c.reportedDate) {
                const year = c.reportedDate.split('-')[0];
                if (year && year.length === 4) years.add(year);
            }
        });
        const currentYear = new Date().getFullYear().toString();
        years.add(currentYear);
        return Array.from(years).sort((a, b) => b.localeCompare(a));
    }, [conflicts]);

    // Computed filtered conflicts
    const filteredConflicts = useMemo(() => {
        return conflicts.filter(conflict => {
            // 1. Period filter
            let matchesPeriod = true;
            if (mode === "custom") {
                if (startDate && conflict.reportedDate < startDate) matchesPeriod = false;
                if (endDate && conflict.reportedDate > endDate) matchesPeriod = false;
            } else {
                if (selectedPeriodPreset !== "Tous") {
                    const date = parseISO(conflict.reportedDate);
                    if (!isValid(date)) {
                        matchesPeriod = false;
                    } else if (selectedPeriodPreset === "Ce Mois") {
                        matchesPeriod = isThisMonth(date);
                    } else if (selectedPeriodPreset === "Ce Trimestre") {
                        matchesPeriod = isThisQuarter(date);
                    } else if (selectedPeriodPreset === "Ce Semestre") {
                        const isCurYear = isThisYear(date);
                        if (!isCurYear) {
                            matchesPeriod = false;
                        } else {
                            const currentMonth = getMonth(new Date());
                            const dateMonth = getMonth(date);
                            const isFirstSemester = currentMonth < 6;
                            matchesPeriod = isFirstSemester ? dateMonth < 6 : dateMonth >= 6;
                        }
                    } else if (selectedPeriodPreset === "Cette Année") {
                        matchesPeriod = isThisYear(date);
                    } else {
                        const conflictYear = conflict.reportedDate.split('-')[0];
                        matchesPeriod = conflictYear === selectedPeriodPreset;
                    }
                }
            }

            // 2. Region filter
            const matchesRegion = selectedRegion === "Tous" || 
                getOfficialRegion(conflict.region || "") === getOfficialRegion(selectedRegion);

            // 3. Status filter
            let matchesStatus = true;
            if (selectedStatus !== "Tous") {
                matchesStatus = (conflict.status || "Ouvert") === selectedStatus;
            }

            // 4. Type filter
            const matchesType = selectedType === "Tous" || conflict.type === selectedType;

            return matchesPeriod && matchesRegion && matchesStatus && matchesType;
        });
    }, [
        conflicts, 
        mode, 
        selectedPeriodPreset, 
        startDate, 
        endDate, 
        selectedRegion, 
        selectedStatus, 
        selectedType
    ]);

    // Computed Period Label for Cover and Headers
    const generatedPeriodLabel = useMemo(() => {
        let periodStr = "Historique Complet";
        if (mode === "custom") {
            if (startDate && endDate) {
                const d1 = parseISO(startDate);
                const d2 = parseISO(endDate);
                periodStr = `Du ${isValid(d1) ? format(d1, "dd/MM/yyyy") : startDate} au ${isValid(d2) ? format(d2, "dd/MM/yyyy") : endDate}`;
            } else if (startDate) {
                const d1 = parseISO(startDate);
                periodStr = `Depuis le ${isValid(d1) ? format(d1, "dd/MM/yyyy") : startDate}`;
            } else if (endDate) {
                const d2 = parseISO(endDate);
                periodStr = `Jusqu'au ${isValid(d2) ? format(d2, "dd/MM/yyyy") : endDate}`;
            }
        } else {
            if (selectedPeriodPreset === "Ce Mois") {
                periodStr = `Mois de ${format(new Date(), "MMMM yyyy", { locale: fr })}`;
            } else if (selectedPeriodPreset === "Ce Trimestre") {
                periodStr = `Trimestre en cours (${format(new Date(), "yyyy")})`;
            } else if (selectedPeriodPreset === "Ce Semestre") {
                const isFirstSem = getMonth(new Date()) < 6;
                periodStr = `${isFirstSem ? "1er Semestre" : "2ème Semestre"} ${format(new Date(), "yyyy")}`;
            } else if (selectedPeriodPreset === "Cette Année") {
                periodStr = `Exercice ${format(new Date(), "yyyy")}`;
            } else if (selectedPeriodPreset !== "Tous") {
                periodStr = `Année ${selectedPeriodPreset}`;
            }
        }

        if (selectedRegion !== "Tous") {
            periodStr += ` — Région ${selectedRegion}`;
        }
        if (selectedStatus !== "Tous") {
            periodStr += ` (Statut: ${selectedStatus})`;
        }

        return periodStr;
    }, [mode, selectedPeriodPreset, startDate, endDate, selectedRegion, selectedStatus]);

    // Computed Stats
    const stats = useMemo(() => {
        const total = filteredConflicts.length;
        if (total === 0) {
            return { total: 0, resolved: 0, mediation: 0, open: 0, resolutionRate: 0, topType: "N/A" };
        }
        const resolved = filteredConflicts.filter(c => c.status === 'Résolu').length;
        const mediation = filteredConflicts.filter(c => c.status === 'En médiation').length;
        const open = filteredConflicts.filter(c => c.status === 'Ouvert' || !c.status).length;
        
        const typeCounts = filteredConflicts.reduce((acc, c) => {
            acc[c.type] = (acc[c.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

        return {
            total,
            resolved,
            mediation,
            open,
            resolutionRate: Math.round((resolved / total) * 100),
            topType
        };
    }, [filteredConflicts]);

    const handlePrintClick = () => {
        onConfirmPrint({
            conflicts: filteredConflicts,
            periodLabel: generatedPeriodLabel,
            stats,
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-none shadow-2xl rounded-2xl bg-white">
                {/* Header with Dark Premium Styling */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-rose-950 p-6 text-white relative">
                    <div className="absolute top-0 right-6 p-2 opacity-10 h-full flex items-center pointer-events-none">
                        <ShieldAlert size={140} strokeWidth={0.7} />
                    </div>
                    <DialogHeader className="relative z-10">
                        <div className="flex items-center gap-3.5">
                            <div className="h-11 w-11 rounded-xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center backdrop-blur-md shadow-lg shadow-rose-950/50">
                                <Printer className="h-5 w-5 text-rose-400" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black uppercase tracking-tight italic">
                                    Impression de l'Historique <span className="text-rose-400">des Conflits</span>
                                </DialogTitle>
                                <DialogDescription className="text-slate-300 text-xs font-medium mt-0.5">
                                    Sélectionnez la période et les critères pour générer le rapport officiel
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                {/* Form Controls */}
                <div className="p-6 space-y-6">
                    {/* Mode Selector Tabs */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-rose-600" /> Mode de Sélection de la Période
                            </Label>
                        </div>
                        <Tabs value={mode} onValueChange={(val) => setMode(val as "preset" | "custom")} className="w-full">
                            <TabsList className="grid grid-cols-2 w-full h-10 bg-slate-100 p-1 rounded-xl">
                                <TabsTrigger value="preset" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    Périodes Prédéfinies
                                </TabsTrigger>
                                <TabsTrigger value="custom" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    Dates Personnalisées
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    {/* Period Controls based on Mode */}
                    {mode === "preset" ? (
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-600">
                                Choisir une période ou une année spécifique
                            </Label>
                            <Select value={selectedPeriodPreset} onValueChange={setSelectedPeriodPreset}>
                                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50 font-medium text-slate-900 focus:ring-rose-500">
                                    <SelectValue placeholder="Sélectionner une période..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-slate-200 max-h-64">
                                    <SelectItem value="Tous" className="font-semibold">✨ Tout l'historique (Tous les dossiers)</SelectItem>
                                    <SelectItem value="Cette Année">📅 Cette Année (Exercice en cours)</SelectItem>
                                    <SelectItem value="Ce Semestre">🗓️ Ce Semestre</SelectItem>
                                    <SelectItem value="Ce Trimestre">📊 Ce Trimestre</SelectItem>
                                    <SelectItem value="Ce Mois">📆 Ce Mois</SelectItem>
                                    <div className="h-px bg-slate-100 my-1" />
                                    <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                        Années Précédentes & Antérieures
                                    </div>
                                    {availableYears.map(year => (
                                        <SelectItem key={year} value={year}>
                                            Année {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-600">
                                    Date de Début
                                </Label>
                                <Input 
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="h-11 rounded-xl border-slate-200 bg-slate-50/50 font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-600">
                                    Date de Fin
                                </Label>
                                <Input 
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="h-11 rounded-xl border-slate-200 bg-slate-50/50 font-medium"
                                />
                            </div>
                        </div>
                    )}

                    {/* Secondary Filters: Region, Status, Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-slate-400" /> Région
                            </Label>
                            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                                <SelectTrigger className="h-9 rounded-lg border-slate-200 bg-slate-50/50 text-xs font-medium">
                                    <SelectValue placeholder="Toutes Régions" />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border-slate-200 max-h-60">
                                    <SelectItem value="Tous">Toutes Régions</SelectItem>
                                    {IVORIAN_REGIONS.map(reg => (
                                        <SelectItem key={reg} value={reg}>{reg}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-slate-400" /> Statut
                            </Label>
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger className="h-9 rounded-lg border-slate-200 bg-slate-50/50 text-xs font-medium">
                                    <SelectValue placeholder="Tous Statuts" />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border-slate-200">
                                    <SelectItem value="Tous">Tous les statuts</SelectItem>
                                    <SelectItem value="Résolu">Résolus uniquement</SelectItem>
                                    <SelectItem value="En médiation">En médiation</SelectItem>
                                    <SelectItem value="Ouvert">Ouverts</SelectItem>
                                    <SelectItem value="Classé sans suite">Classé sans suite</SelectItem>
                                    <SelectItem value="Escaladé à la justice">Escaladé à la justice</SelectItem>
                                    <SelectItem value="En appel">En appel</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                                <Tag className="h-3 w-3 text-slate-400" /> Nature
                            </Label>
                            <Select value={selectedType} onValueChange={setSelectedType}>
                                <SelectTrigger className="h-9 rounded-lg border-slate-200 bg-slate-50/50 text-xs font-medium">
                                    <SelectValue placeholder="Toutes Natures" />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border-slate-200 max-h-60">
                                    <SelectItem value="Tous">Toutes les natures</SelectItem>
                                    {availableTypes.map(t => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Live Preview Summary Card */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-slate-700" />
                                <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                                    Synthèse du Rapport à Imprimer
                                </span>
                            </div>
                            <Badge variant="secondary" className="font-bold text-xs bg-white text-slate-900 border border-slate-200 shadow-sm">
                                {stats.total} dossier{stats.total > 1 ? 's' : ''} sélectionné{stats.total > 1 ? 's' : ''}
                            </Badge>
                        </div>

                        <div className="text-xs text-slate-600 font-medium">
                            <span className="font-bold text-slate-900">En-tête du document : </span>
                            <span className="italic text-rose-700 font-semibold">{generatedPeriodLabel}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60">
                            <div className="bg-white p-2 rounded-lg border border-slate-100 text-center">
                                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Résolus</span>
                                <span className="text-sm font-black text-emerald-800">{stats.resolved}</span>
                                <span className="text-[9px] text-slate-400 block font-mono">({stats.resolutionRate}%)</span>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-slate-100 text-center">
                                <span className="text-[10px] font-bold text-blue-700 uppercase block">En Médiation</span>
                                <span className="text-sm font-black text-blue-800">{stats.mediation}</span>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-slate-100 text-center">
                                <span className="text-[10px] font-bold text-rose-700 uppercase block">Ouverts</span>
                                <span className="text-sm font-black text-rose-800">{stats.open}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <DialogFooter className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between sm:justify-between gap-3">
                    <Button 
                        variant="ghost" 
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-800 font-bold"
                    >
                        Annuler
                    </Button>
                    <Button 
                        onClick={handlePrintClick}
                        disabled={stats.total === 0}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-xs tracking-wider px-6 h-11 rounded-xl shadow-lg shadow-slate-900/20"
                    >
                        <Printer className="mr-2 h-4 w-4 text-rose-400" />
                        Lancer l'Impression ({stats.total})
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
