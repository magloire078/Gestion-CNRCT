"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, AlertCircle, MapPin } from "lucide-react";
import { getVillageByLocation, addVillage } from "@/services/village-service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Village } from "@/lib/data";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type VillageCsvRow = { [key: string]: string | number | undefined | null };

export function ImportVillagesCard() {
    const [file, setFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [successCount, setSuccessCount] = useState(0);
    const { toast } = useToast();
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        setSuccessCount(0);
        setProgress(0);
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleImport = async () => {
        if (!file) {
            setError("Veuillez d'abord sélectionner un fichier.");
            return;
        }

        setIsImporting(true);
        setError(null);
        setSuccessCount(0);
        setProgress(0);

        Papa.parse<VillageCsvRow>(file, {
            header: true,
            skipEmptyLines: "greedy",
            dynamicTyping: false,
            transformHeader: (header) => header.trim().toLowerCase(),
            complete: async (results) => {
                const criticalErrors = results.errors.filter(
                    (e) => e.code !== "TooManyFields" && e.code !== "TooFewFields"
                );

                if (criticalErrors.length > 0) {
                    const firstError = criticalErrors[0];
                    setError(`Erreur critique d'analyse (ligne ${firstError.row}): ${firstError.message}`);
                    setIsImporting(false);
                    return;
                }

                const headers = results.meta.fields || [];
                // Support common variations in standard village datasets
                const requiredHeadersPresent =
                    headers.includes("nom") || headers.includes("village") || headers.includes("localite");

                if (!requiredHeadersPresent) {
                    setError(`Le fichier CSV est invalide. Colonne requise manquante : "Nom", "Village" ou "Localite".`);
                    setIsImporting(false);
                    return;
                }

                const rows = results.data.filter(row => row.nom || row.village || row.localite);
                if (rows.length === 0) {
                    setError("Aucun village valide trouvé dans le fichier.");
                    setIsImporting(false);
                    return;
                }

                let added = 0;
                let skipped = 0;

                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    setProgress(Math.round(((i + 1) / rows.length) * 100));

                    const name = String(row.nom || row.village || row.localite || "").trim();
                    if (!name) continue;

                    const region = String(row.region || "").trim();
                    const department = String(row.departement || "").trim();
                    const subPrefecture = String(row.sous_prefecture || row.commune || row.sp || "").trim();

                    const lat = parseFloat(String(row.latitude || row.lat || ""));
                    const lng = parseFloat(String(row.longitude || row.lng || row.lon || ""));

                    // Check if village already exists
                    try {
                        const existing = await getVillageByLocation(region, department, subPrefecture, name);
                        if (existing) {
                            skipped++;
                            continue;
                        }

                        const newVillage: Omit<Village, "id"> = {
                            name,
                            region,
                            department,
                            subPrefecture,
                            commune: String(row.commune || subPrefecture || "").trim(),
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                        };

                        if (!isNaN(lat) && !isNaN(lng)) {
                            newVillage.latitude = lat;
                            newVillage.longitude = lng;
                        }

                        // Optional demographic data if present
                        if (row.population) {
                            const pop = parseInt(String(row.population).replace(/\D/g, ""));
                            if (!isNaN(pop)) newVillage.population = pop;
                        }

                        await addVillage(newVillage);
                        added++;
                        setSuccessCount(added);
                    } catch (err) {
                        console.error(`Erreur import village ${name}:`, err);
                        // Non-fatal, continue with next row
                    }
                }

                toast({
                    title: "Importation terminée",
                    description: `${added} villages ajoutés. ${skipped} ignorés (déjà existants).`,
                });

                setFile(null);
                if (inputRef.current) inputRef.current.value = "";
                setIsImporting(false);
            },
            error: (err: any) => {
                setError(`Erreur lors de la lecture du fichier : ${err.message}`);
                setIsImporting(false);
            },
        });
    };

    return (
    <Card className="border-white/20 shadow-3xl overflow-hidden bg-white/40 backdrop-blur-xl rounded-[2.5rem] group transition-all duration-700 hover:border-white/40 hover:-translate-y-2 relative">
        <CardHeader className="bg-slate-900 p-10 text-white relative overflow-hidden">
            {/* Decorative Map Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]" />
            
            <div className="flex items-center gap-5 relative z-10">
                <div className="p-4 rounded-[1.5rem] bg-white/10 border border-white/20 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                    <MapPin className="h-7 w-7 text-emerald-400" />
                </div>
                <div className="space-y-1">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400/80">Flux Géo-Spatial</CardTitle>
                    <CardDescription className="text-2xl font-black uppercase tracking-tighter text-white">
                        Cartographie
                    </CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-10 space-y-8 relative z-10">
            <div className="flex flex-col gap-6">
                <div className="relative group/input">
                    <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent scale-x-0 group-hover/input:scale-x-100 transition-transform duration-700" />
                    <Input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        ref={inputRef}
                        disabled={isImporting}
                        className="h-24 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-white hover:border-emerald-500/50 transition-all cursor-pointer flex items-center justify-center text-center font-bold px-10 pt-8 shadow-inner"
                    />
                    <div className="absolute top-5 left-1/2 -translate-x-1/2 pointer-events-none flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover/input:text-emerald-600 transition-colors">
                        <Upload className="h-3.5 w-3.5" /> Fichier des Localités (.csv)
                    </div>
                </div>
                
                <div className="p-6 rounded-2xl bg-white/30 border border-white/40 shadow-inner backdrop-blur-sm space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Structure Requise :</p>
                    <div className="flex flex-wrap gap-2.5">
                        {["Nom", "Région", "Département", "SP"].map((tag) => (
                            <span key={tag} className="px-3 py-1 rounded-xl bg-slate-900/5 border border-slate-900/10 text-[9px] font-black text-slate-700 uppercase tracking-widest shadow-sm">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {isImporting && progress > 0 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-1">
                        <span className="flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin text-emerald-500" />
                            Indexation Géo-Spatiale
                        </span>
                        <span className="text-emerald-600">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2.5 rounded-full overflow-hidden bg-slate-100 shadow-inner" />
                </div>
            )}

            {error && (
                <Alert variant="destructive" className="bg-rose-50 border-rose-100 rounded-[1.5rem] animate-in zoom-in-95 duration-500 shadow-xl shadow-rose-500/5">
                    <AlertCircle className="h-5 w-5 text-rose-600" />
                    <AlertTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-600">Incident Géographique</AlertTitle>
                    <AlertDescription className="text-[10px] font-bold text-rose-500 leading-relaxed uppercase opacity-80 tracking-wide">{error}</AlertDescription>
                </Alert>
            )}
        </CardContent>
        <CardFooter className="p-10 pt-0 relative z-10">
            <Button 
                onClick={handleImport} 
                disabled={isImporting || !file} 
                className={cn(
                    "w-full h-14 rounded-2xl font-black uppercase tracking-[0.3em] text-xs transition-all transform active:scale-95 shadow-2xl",
                    isImporting ? "bg-slate-100 text-slate-400" : "bg-slate-900 border-slate-900 text-white hover:bg-black shadow-slate-900/40"
                )}
            >
                {isImporting ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <Upload className="mr-3 h-5 w-5" />}
                {isImporting ? `Indexation...` : "Importer les Localités"}
            </Button>
        </CardFooter>
    </Card>
    );
}
