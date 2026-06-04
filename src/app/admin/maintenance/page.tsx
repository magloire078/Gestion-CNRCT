"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Database, ShieldAlert } from "lucide-react";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataMigrationTool } from "@/components/maintenance/data-migration-tool";
import { subscribeToVillages } from "@/services/village-service";
import { subscribeToChiefs } from "@/services/chief-service";
import type { Village } from "@/types/village";
import type { Chief } from "@/types/chief";

export default function MaintenancePage() {
    const { hasPermission } = useAuth();
    const [villages, setVillages] = useState<Village[]>([]);
    const [chiefs, setChiefs] = useState<Chief[]>([]);

    useEffect(() => {
        const u1 = subscribeToVillages(setVillages, () => {});
        const u2 = subscribeToChiefs(setChiefs, () => {});
        return () => {
            u1();
            u2();
        };
    }, []);

    if (!hasPermission('admin:maintenance')) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
                <ShieldAlert className="w-12 h-12 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-bold">Accès réservé</h2>
                <p className="text-muted-foreground mt-2">
                    Seuls les administrateurs disposant de la permission <code>admin:maintenance</code> peuvent accéder à cet espace.
                </p>
                <Button asChild className="mt-6">
                    <Link href="/intranet">Retour à l&apos;accueil</Link>
                </Button>
            </div>
        );
    }

    return (
        <PermissionGuard permission="page:admin:view">
            <div className="space-y-8">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                            <Database className="h-8 w-8 text-slate-400" />
                            Maintenance données
                        </h1>
                        <p className="text-slate-500 mt-2">
                            Diagnostics et outils de migration pour les collections villages, chefs et héritages.
                        </p>
                    </div>
                    <Button asChild variant="outline" className="rounded-xl">
                        <Link href="/villages">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour aux villages
                        </Link>
                    </Button>
                </div>

                <Card className="rounded-2xl border-slate-100 bg-slate-900 text-white overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-amber-400 font-mono text-xs uppercase tracking-widest">
                            Diagnostic Data
                        </CardTitle>
                        <CardDescription className="text-slate-400 font-mono text-xs">
                            Snapshot temps réel des collections villages et chiefs.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-[11px]">
                            <div className="space-y-1">
                                <p>TOTAL VILLAGES: <span className="text-emerald-400">{villages.length}</span></p>
                                <p>TOTAL CHIEFS: <span className="text-emerald-400">{chiefs.length}</span></p>
                                <p>NON-EMPTY REGIONS: <span className="text-emerald-400">{villages.filter(v => !!v.region).length}</span></p>
                                <p>NON-EMPTY DEPTS: <span className="text-emerald-400">{villages.filter(v => !!v.department).length}</span></p>
                                <p>NON-EMPTY SP: <span className="text-emerald-400">{villages.filter(v => !!v.subPrefecture).length}</span></p>
                                <p>NON-EMPTY NAMES: <span className="text-emerald-400">{villages.filter(v => !!v.name).length}</span></p>
                            </div>
                            <div>
                                {villages.length > 0 && (
                                    <>
                                        <p className="text-amber-400 mb-2">RAW DATA SAMPLES (FIRST 10) :</p>
                                        <div className="space-y-1 max-h-60 overflow-auto pr-2">
                                            {villages.slice(0, 10).map((v, i) => (
                                                <p key={v.id} className="border-b border-slate-700 pb-1">
                                                    [{i}] {v.name} | R: &quot;{v.region}&quot; | D: &quot;{v.department}&quot; | SP: &quot;{v.subPrefecture}&quot;
                                                </p>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-100">
                    <CardHeader>
                        <CardTitle>Migration & synchronisation</CardTitle>
                        <CardDescription>
                            Outils ponctuels pour réaligner les liens villages ↔ chefs et propager les renommages.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataMigrationTool />
                    </CardContent>
                </Card>
            </div>
        </PermissionGuard>
    );
}
