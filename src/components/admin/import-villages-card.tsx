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
        <Card className="border-primary/20 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="bg-primary/5 pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Importer des Villages
                </CardTitle>
                <CardDescription>
                    Importez une liste de villages (.csv). Le système ignorera les doublons (Nom + Région + Dép + SP).
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="flex flex-col gap-4">
                    <Input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        ref={inputRef}
                        disabled={isImporting}
                    />
                    <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
                        <strong>Format attendu (colonnes) :</strong>
                        <ul className="list-disc pl-4 mt-1 space-y-0.5">
                            <li><code>nom</code> ou <code>village</code> (Obligatoire)</li>
                            <li><code>region</code>, <code>departement</code>, <code>sous_prefecture</code></li>
                            <li><code>latitude</code>, <code>longitude</code> (Optionnel, pour la carte)</li>
                            <li><code>population</code> (Optionnel)</li>
                        </ul>
                    </div>
                </div>

                {isImporting && progress > 0 && (
                    <div className="mt-4 space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Importation en cours...</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-primary h-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-xs text-center text-muted-foreground mt-1">
                            {successCount} village(s) ajouté(s)...
                        </p>
                    </div>
                )}

                {error && (
                    <Alert variant="destructive" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Erreur d'importation</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
            </CardContent>
            <CardFooter>
                <Button onClick={handleImport} disabled={isImporting || !file} className="w-full">
                    {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    {isImporting ? "Traitement..." : "Importer le fichier CSV"}
                </Button>
            </CardFooter>
        </Card>
    );
}
