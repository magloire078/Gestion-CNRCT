
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, writeBatch } from "firebase/firestore";
import { getOfficialRegion, getOfficialDepartment, getOfficialSubPrefecture, findRegionByDepartment, findClosestRegion, findClosestDepartment, findHierarchyByName } from "@/lib/normalization-utils";
import { Loader2, Database, CheckCircle2, AlertCircle, RefreshCw, LifeBuoy, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MigrationStats {
    total: number;
    toUpdate: number;
    updated: number;
    errors: number;
}

export function DataMigrationTool() {
    const [status, setStatus] = useState<"idle" | "analyzing" | "confirming" | "migrating" | "completed">("idle");
    const [stats, setStats] = useState({
        villages: { total: 0, toUpdate: 0, updated: 0, errors: 0 },
        chiefs: { total: 0, toUpdate: 0, updated: 0, errors: 0 },
        employees: { total: 0, toUpdate: 0, updated: 0, errors: 0 },
        repository: { total: 0, toUpdate: 0, updated: 0, errors: 0 },
    });
    const [pendingChanges, setPendingChanges] = useState<Record<string, any[]>>({});
    const [rescueStats, setRescueStats] = useState({ total: 0, repairable: 0 });
    const [syncStats, setSyncStats] = useState({ total: 0, outOfSync: 0 });
    const [progress, setProgress] = useState(0);
    const progressRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    // Cleanly update progress bar width without inline-style lint warnings
    useEffect(() => {
        if (progressRef.current) {
            progressRef.current.style.width = `${progress}%`;
        }
    }, [progress]);

    const analyzeData = async () => {
        setStatus("analyzing");
        const newStats = { ...stats };
        const changes: Record<string, any[]> = {};
        let repairable = 0;

        try {
            // 1. Analyze Villages
            const villageSnap = await getDocs(collection(db, "villages"));
            changes.villages = [];
            newStats.villages = { total: villageSnap.size, toUpdate: 0, updated: 0, errors: 0 };
            
            villageSnap.forEach(snap => {
                const data = snap.data();
                
                // Check if rescue is needed (region, department or SP is missing)
                if (!data.region || !data.department || !data.subPrefecture) {
                    repairable++;
                }

                const officialRegion = getOfficialRegion(data.region);
                const officialDept = getOfficialDepartment(officialRegion, data.department);
                const officialSP = getOfficialSubPrefecture(officialRegion, officialDept, data.subPrefecture);

                if (officialRegion !== data.region || officialDept !== data.department || officialSP !== data.subPrefecture) {
                    changes.villages.push({
                        id: snap.id,
                        old: { region: data.region, department: data.department, subPrefecture: data.subPrefecture },
                        new: { region: officialRegion, department: officialDept, subPrefecture: officialSP }
                    });
                    newStats.villages.toUpdate++;
                }
            });
            
            setRescueStats({ total: villageSnap.size, repairable });
            
            // ... (Chiefs, Employees, Documents analysis remains the same but shortened for brevity in this replace)
            const chiefSnap = await getDocs(collection(db, "chiefs"));
            changes.chiefs = [];
            newStats.chiefs = { total: chiefSnap.size, toUpdate: 0, updated: 0, errors: 0 };
            chiefSnap.forEach(snap => {
                const data = snap.data();
                const officialRegion = getOfficialRegion(data.region);
                const officialDept = getOfficialDepartment(officialRegion, data.department);
                const officialSP = getOfficialSubPrefecture(officialRegion, officialDept, data.subPrefecture);
                if (officialRegion !== data.region || officialDept !== data.department || officialSP !== data.subPrefecture) {
                    changes.chiefs.push({ id: snap.id, old: { region: data.region, department: data.department, subPrefecture: data.subPrefecture }, new: { region: officialRegion, department: officialDept, subPrefecture: officialSP } });
                    newStats.chiefs.toUpdate++;
                }
            });

            const empSnap = await getDocs(collection(db, "employees"));
            changes.employees = [];
            newStats.employees = { total: empSnap.size, toUpdate: 0, updated: 0, errors: 0 };
            empSnap.forEach(snap => {
                const data = snap.data();
                const officialRegion = getOfficialRegion(data.Region);
                const officialDept = getOfficialDepartment(officialRegion, data.Departement || data.department);
                if (officialRegion !== data.Region || (data.Departement && officialDept !== data.Departement)) {
                    changes.employees.push({ id: snap.id, old: { region: data.Region, department: data.Departement }, new: { region: officialRegion, department: officialDept } });
                    newStats.employees.toUpdate++;
                }
            });

            const docSnap = await getDocs(collection(db, "repository"));
            changes.repository = [];
            newStats.repository = { total: docSnap.size, toUpdate: 0, updated: 0, errors: 0 };
            docSnap.forEach(snap => {
                const data = snap.data();
                const officialRegion = getOfficialRegion(data.region);
                if (officialRegion !== data.region) {
                    changes.repository.push({ id: snap.id, old: { region: data.region }, new: { region: officialRegion } });
                    newStats.repository.toUpdate++;
                }
            });

            // 5. Analyze Synchronization (Chiefs -> Villages)
            const villageMap: Record<string, any> = {};
            villageSnap.forEach(s => villageMap[s.id] = s.data());
            
            let outOfSync = 0;
            const syncChanges: any[] = [];

            chiefSnap.forEach(snap => {
                const chief = snap.data();
                if (chief.villageId && villageMap[chief.villageId]) {
                    const village = villageMap[chief.villageId];
                    const isOut = 
                        chief.region !== village.region || 
                        chief.department !== village.department || 
                        chief.subPrefecture !== village.subPrefecture ||
                        chief.village !== village.name;
                    
                    if (isOut) {
                        outOfSync++;
                        syncChanges.push({ id: snap.id, villageId: chief.villageId });
                    }
                }
            });
            setSyncStats({ total: chiefSnap.size, outOfSync });
            setPendingChanges(prev => ({ ...prev, sync: syncChanges }));

            setStats(newStats);
            setPendingChanges(changes);
            setStatus("confirming");
        } catch (error) {
            console.error("Analysis failed", error);
            toast({ variant: "destructive", title: "Erreur d'analyse", description: "Impossible de scanner la base de données." });
            setStatus("idle");
        }
    };

    const runRescue = async () => {
        setStatus("migrating");
        let batch = writeBatch(db);
        let count = 0;
        let successCount = 0;

        try {
            const villageSnap = await getDocs(collection(db, "villages"));
            const totalDocs = villageSnap.size;
            
            for (const snap of villageSnap.docs) {
                const data = snap.data();
                if (!data.region || !data.department || !data.subPrefecture) {
                    let targetDept = data.department || "";
                    let targetRegion = data.region || "Abidjan";
                    let targetSP = data.subPrefecture || "";
                    let method = "GPS/Dept proximity";

                    // 1. ULTIMATE REPAIR: Try to match by Village Name in official nomenclature
                    const officialHierarchy = findHierarchyByName(data.name);
                    if (officialHierarchy) {
                        targetRegion = officialHierarchy.r;
                        targetDept = officialHierarchy.d;
                        targetSP = officialHierarchy.sp;
                        method = "Name Match (Precise)";
                    } else {
                        // 2. FALLBACK: Try to find the best Department by GPS
                        if (!targetDept && data.latitude && data.longitude) {
                            targetDept = findClosestDepartment(data.latitude, data.longitude);
                        }

                        // 3. Deduce Region from Department
                        if (targetDept) {
                            const inferredRegion = findRegionByDepartment(targetDept);
                            if (inferredRegion) targetRegion = inferredRegion;
                        } 
                        // 4. Fallback to Region Proximity
                        else if (!targetRegion && data.latitude && data.longitude) {
                            targetRegion = findClosestRegion(data.latitude, data.longitude);
                        }

                        // 5. Default SP to Department if still empty
                        if (!targetSP) targetSP = targetDept;
                    }

                    const ref = doc(db, "villages", snap.id);
                    batch.update(ref, {
                        region: targetRegion,
                        department: targetDept,
                        subPrefecture: targetSP,
                        updatedAt: new Date().toISOString(),
                        rescueNote: `Auto-repaired via ${method}`
                    });
                    
                    count++;
                    successCount++;
                    
                    // Update progress every 50 docs
                    if (successCount % 50 === 0) {
                        setProgress(Math.round((successCount / totalDocs) * 100));
                    }

                    if (count >= 400) {
                        await batch.commit();
                        batch = writeBatch(db);
                        count = 0;
                    }
                } else {
                    // Even if not repairing, count towards progress to keep it moving
                    successCount++;
                    if (successCount % 100 === 0) {
                        setProgress(Math.round((successCount / totalDocs) * 100));
                    }
                }
            }

            if (count > 0) await batch.commit();
            
            toast({ title: "Opération de sauvetage terminée", description: `${successCount} villages ont été réparés.` });
            setStatus("completed");
        } catch (error) {
            console.error("Rescue failed", error);
            toast({ variant: "destructive", title: "Erreur de sauvetage", description: "L'opération a échoué." });
            setStatus("idle");
        }
    };

    const runSyncChiefs = async () => {
        if (!confirm("Voulez-vous synchroniser les données administratives des chefs avec leurs villages ?")) return;
        
        setStatus("migrating");
        setProgress(0);
        let count = 0;
        let successCount = 0;
        let batch = writeBatch(db);

        try {
            const chiefSnap = await getDocs(collection(db, "chiefs"));
            const villageSnap = await getDocs(collection(db, "villages"));
            const villageMap: Record<string, any> = {};
            villageSnap.forEach(s => villageMap[s.id] = s.data());

            const total = chiefSnap.size;

            for (const snap of chiefSnap.docs) {
                const chief = snap.data();
                if (chief.villageId && villageMap[chief.villageId]) {
                    const village = villageMap[chief.villageId];
                    const isOut = 
                        chief.region !== village.region || 
                        chief.department !== village.department || 
                        chief.subPrefecture !== village.subPrefecture ||
                        chief.village !== village.name;

                    if (isOut) {
                        const ref = doc(db, "chiefs", snap.id);
                        batch.update(ref, {
                            region: village.region,
                            department: village.department,
                            subPrefecture: village.subPrefecture,
                            village: village.name,
                            updatedAt: new Date().toISOString()
                        });
                        count++;
                    }
                }
                
                successCount++;
                if (successCount % 20 === 0) {
                    setProgress(Math.round((successCount / total) * 100));
                }

                if (count >= 400) {
                    await batch.commit();
                    batch = writeBatch(db);
                    count = 0;
                }
            }

            if (count > 0) await batch.commit();
            setStatus("completed");
            toast({ title: "Synchronisation terminée", description: "Les chefs sont maintenant en accord avec leurs villages." });
        } catch (error) {
            console.error(error);
            setStatus("idle");
            toast({ variant: "destructive", title: "Erreur", description: "Échec de la synchronisation." });
        }
    };

    const runMigration = async () => {
        setStatus("migrating");
        let batch = writeBatch(db);
        let count = 0;

        try {
            // Migrate Villages
            for (const change of pendingChanges.villages || []) {
                const ref = doc(db, "villages", change.id);
                batch.update(ref, { 
                    region: change.new.region, 
                    department: change.new.department, 
                    subPrefecture: change.new.subPrefecture,
                    updatedAt: new Date().toISOString()
                });
                count++;
                if (count >= 400) { 
                    await batch.commit(); 
                    batch = writeBatch(db);
                    count = 0; 
                }
            }

            // Migrate Chiefs
            for (const change of pendingChanges.chiefs || []) {
                const ref = doc(db, "chiefs", change.id);
                batch.update(ref, { 
                    region: change.new.region, 
                    department: change.new.department, 
                    subPrefecture: change.new.subPrefecture,
                    "audit.updatedAt": new Date().toISOString()
                });
                count++;
                if (count >= 400) { 
                    await batch.commit(); 
                    batch = writeBatch(db);
                    count = 0; 
                }
            }

            // Migrate Employees
            for (const change of pendingChanges.employees || []) {
                const ref = doc(db, "employees", change.id);
                const updates: any = { Region: change.new.region };
                if (change.new.department) updates.Departement = change.new.department;
                batch.update(ref, updates);
                count++;
                if (count >= 400) { 
                    await batch.commit(); 
                    batch = writeBatch(db);
                    count = 0; 
                }
            }

            // Migrate Repository
            for (const change of pendingChanges.repository || []) {
                const ref = doc(db, "repository", change.id);
                batch.update(ref, { region: change.new.region });
                count++;
                if (count >= 400) { 
                    await batch.commit(); 
                    batch = writeBatch(db);
                    count = 0; 
                }
            }

            if (count > 0) await batch.commit();

            toast({ title: "Migration terminée", description: "Toutes les données ont été normalisées." });
            setStatus("completed");
        } catch (error) {
            console.error("Migration failed", error);
            toast({ variant: "destructive", title: "Erreur de migration", description: "La mise à jour a échoué à mi-parcours." });
            setStatus("idle");
        }
    };

    return (
        <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-900 text-white p-8">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <Database className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-black italic uppercase">Maintenance Territoriale</CardTitle>
                        <CardDescription className="text-slate-400 font-bold">Normalisation globale des noms administratifs</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8">
                <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(stats).map(([key, s]) => (
                            <div key={key} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{key}</p>
                                <div className="flex items-end gap-2">
                                    <span className="text-2xl font-black text-slate-900">{s.total}</span>
                                    {s.toUpdate > 0 && (
                                        <span className="text-xs font-bold text-amber-600 mb-1">({s.toUpdate} à corriger)</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        {status === "idle" && (
                            <>
                                <p className="text-slate-500 font-medium mb-6 max-w-md">
                                    Cette opération va scanner toute la base de données et corriger les fautes d'orthographe sur les régions et départements pour correspondre à la nomenclature officielle.
                                </p>
                                <Button onClick={analyzeData} className="h-14 px-10 rounded-2xl bg-slate-900 font-black uppercase tracking-widest text-xs hover:bg-slate-800">
                                    Lancer l'analyse
                                </Button>
                            </>
                        )}

                        {status === "analyzing" && (
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
                                <p className="font-bold text-slate-600">Analyse du territoire en cours...</p>
                            </div>
                        )}

                        {status === "confirming" && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 w-full max-w-2xl">
                                    <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl text-left">
                                        <h4 className="flex items-center gap-2 text-amber-800 font-black uppercase text-sm mb-3">
                                            <RefreshCw className="h-5 w-5" /> Normalisation
                                        </h4>
                                        <ul className="space-y-2 text-xs font-bold text-amber-700">
                                            <li>• {stats.villages.toUpdate} villages à corriger</li>
                                            <li>• {stats.chiefs.toUpdate} autorités à mettre à jour</li>
                                            <li>• {stats.employees.toUpdate} agents à corriger</li>
                                            <li>• {stats.repository.toUpdate} archives à re-classer</li>
                                        </ul>
                                        <Button onClick={runMigration} className="w-full mt-4 h-12 rounded-xl bg-amber-600 font-black uppercase tracking-widest text-[10px] hover:bg-amber-700 text-white">
                                            Lancer la normalisation
                                        </Button>
                                    </div>

                                    {rescueStats.repairable > 0 && (
                                        <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl text-left">
                                            <h4 className="flex items-center gap-2 text-emerald-800 font-black uppercase text-sm mb-3">
                                                <LifeBuoy className="h-5 w-5" /> Opération Sauvetage
                                            </h4>
                                            <p className="text-[10px] font-bold text-emerald-700 mb-4">
                                                {rescueStats.repairable} villages n'ont aucune région. Nous pouvons les réparer en utilisant leurs coordonnées GPS ou leur département.
                                            </p>
                                            <Button onClick={runRescue} className="w-full h-12 rounded-xl bg-emerald-600 font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20">
                                                Réparer les {rescueStats.repairable} villages
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                <Button variant="ghost" onClick={() => setStatus("idle")} className="h-14 px-8 rounded-2xl font-bold">
                                    Retour
                                </Button>
                            </>
                        )}

                        {status === "migrating" && (
                            <div className="flex flex-col items-center py-12 gap-6">
                                <div className="relative">
                                    <RefreshCw className="h-16 w-16 text-emerald-600 animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center font-black text-xs">
                                        {progress}%
                                    </div>
                                </div>
                                <div className="text-center">
                                    <h3 className="font-black text-xl mb-2">OPÉRATION EN COURS...</h3>
                                    <p className="text-slate-500 text-sm font-bold">Veuillez ne pas fermer cette fenêtre.</p>
                                </div>
                                <div className="w-full max-w-md bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                                    <div 
                                        ref={progressRef}
                                        className="h-full bg-emerald-600 transition-all duration-300 ease-out shadow-[0_0_20px_rgba(5,150,105,0.4)]"
                                    />
                                    {/* Column 3: Synchronization */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                                <RefreshCw className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm">SYNCHRONISATION</h4>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Chefs & Villages</p>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                                            <div className="flex justify-between items-center text-xs font-bold">
                                                <span className="text-slate-500 uppercase tracking-widest">Chefs analysés</span>
                                                <span className="text-slate-900">{syncStats.total}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs font-bold">
                                                <span className="text-slate-500 uppercase tracking-widest">Désynchronisés</span>
                                                <span className={syncStats.outOfSync > 0 ? "text-blue-600" : "text-emerald-600"}>
                                                    {syncStats.outOfSync}
                                                </span>
                                            </div>
                                            
                                            <Button 
                                                onClick={runSyncChiefs}
                                                disabled={syncStats.outOfSync === 0}
                                                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none"
                                            >
                                                <RefreshCw className="mr-2 h-4 w-4" />
                                                Synchroniser
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {status === "completed" && (
                            <div className="flex flex-col items-center gap-4">
                                <CheckCircle2 className="h-16 w-16 text-emerald-500 mb-2" />
                                <h3 className="text-2xl font-black text-slate-900">Base de données assainie !</h3>
                                <p className="text-slate-500 font-medium">Toutes les données territoriales sont désormais conformes à la nomenclature officielle.</p>
                                <Button onClick={() => setStatus("idle")} variant="outline" className="mt-4 rounded-xl font-bold">
                                    Terminer
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
