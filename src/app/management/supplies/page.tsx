"use client";

import { PendingRequestsManager } from "@/components/supplies/pending-requests-manager";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { ShoppingBag, ShieldCheck, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ManagementSuppliesPage() {
  return (
    <PermissionGuard permission="management:supplies:validate">
      <div className="flex flex-col gap-8 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-blue-600" />
              Validations Fournitures
            </h1>
            <p className="text-slate-500 mt-1 font-medium italic">
              Module de validation hiérarchique pour les demandes de matériel.
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-sm">
             <div className="px-4 py-2 bg-white rounded-lg shadow-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Mode Superviseur</span>
             </div>
          </div>
        </div>

        <div className="grid gap-6">
            <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
                <CardHeader className="p-8 border-b border-slate-50">
                    <div className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-slate-400 mb-2">
                        <ShoppingBag className="h-4 w-4" />
                        Flux de travail
                    </div>
                    <CardTitle className="text-2xl font-black text-slate-900">Demandes en attente de signature</CardTitle>
                    <CardDescription className="text-slate-500 font-medium max-w-2xl">
                        En tant que responsable, vous devez valider la pertinence des demandes avant qu'elles ne soient traitées par le service logistique.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                    <PendingRequestsManager mode="supervisor" />
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-6">
                 <Card className="rounded-2xl border-slate-100 bg-slate-50/50">
                    <CardContent className="p-6 space-y-2">
                        <p className="text-xs font-black uppercase tracking-widest text-blue-600">Étape 1</p>
                        <h4 className="font-bold text-slate-900">Validation Supérieur</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                            Le supérieur direct ou le DAAF donne son accord de principe sur l'utilité du matériel demandé.
                        </p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border-slate-100 bg-slate-50/50">
                    <CardContent className="p-6 space-y-2">
                        <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Étape 2</p>
                        <h4 className="font-bold text-slate-900">Préparation Stock</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                            Une fois validée, la demande apparaît dans le tableau de bord du gestionnaire de stock pour sortie.
                        </p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border-slate-100 bg-slate-50/50">
                    <CardContent className="p-6 space-y-2">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Étape 3</p>
                        <h4 className="font-bold text-slate-900">Livraison & Clôture</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                            L'employé reçoit ses articles et le stock est automatiquement déduit de l'inventaire global.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
