"use client";

import { PermissionGuard } from "@/components/auth/permission-guard";

import { Printer, Download, ArrowLeft, PenTool, Wrench, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getOrganizationSettings } from "@/services/organization-service";
import type { OrganizationSettings } from "@/types/common";
import { TechnicalOfficialReport, type TechnicalItem } from "@/components/reports/technical-official-report";

const inventoryData: TechnicalItem[] = [
  { name: "Escabeau alu ECOPLUS", initial: 1, entered: 0, exit: 0 },
  { name: "Echelle simple PRONOR 5.2 m", initial: 1, entered: 0, exit: 0 },
  { name: "Paquet de limes", initial: 6, entered: 0, exit: 0 },
  { name: "Herbicide solution 480 SL Furagan Bidon de 1L", initial: 13, entered: 0, exit: 0 },
  { name: "Extincteur de gaz carbonique 2kg", initial: 1, entered: 0, exit: 0 },
  { name: "Herbicide glyphader 360 SL", initial: 19, entered: 0, exit: 0 },
  { name: "Extincteur SILICE P9 ABC", initial: 1, entered: 0, exit: 0 },
  { name: "Perceuse électrique BOSCH", initial: 2, entered: 0, exit: 0 },
  { name: "Lame tondeuse TORO séries GTS Model : 29645", initial: 0, entered: 0, exit: 0 },
  { name: "Balai métallique 22 dents", initial: 0, entered: 0, exit: 0 },
  { name: "Cisaille à haie droite", initial: 0, entered: 0, exit: 0 },
  { name: "Clé métallique n° 14", initial: 0, entered: 0, exit: 0 },
  { name: "Pulvérisateur à dos 12 L Vert/Bleu lance", initial: 1, entered: 0, exit: 0 },
];

export default function TechnicalManagementReportPage() {
  const [isPrinting, setIsPrinting] = useState(false);
  const [organizationSettings, setOrganizationSettings] = useState<OrganizationSettings | null>(null);

  useEffect(() => {
    getOrganizationSettings().then(setOrganizationSettings);
  }, []);

  const handlePrint = () => {
    setIsPrinting(true);
  };

  return (
    <PermissionGuard permission="page:reports:view">
      <div className="flex flex-col gap-5 pb-10 max-w-6xl mx-auto py-12 px-6 sm:px-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        {/* Controls - Hidden on Print */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 print:hidden">
          <div className="space-y-4">
            <Link href="/reports">
              <Button variant="ghost" className="rounded-full gap-2 text-slate-500 hover:text-slate-900 transition-colors p-0 h-auto hover:bg-transparent">
                <ArrowLeft className="h-4 w-4" /> Retour aux rapports
              </Button>
            </Link>
            <h1 className="text-5xl font-black tracking-tighter text-slate-900 md:text-6xl leading-none">
              Rapport <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-900">Technique</span>
            </h1>
            <p className="text-slate-500 font-medium max-w-xl text-lg leading-relaxed">
              Gestion et suivi des matériels, outillages et consommables techniques.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={handlePrint} variant="outline" className="rounded-xl border-slate-200 font-bold shadow-sm h-14 px-5 hover:bg-slate-50">
              <Printer className="mr-3 h-5 w-5" /> Imprimer
            </Button>
            <Button onClick={handlePrint} className="bg-slate-900 text-white rounded-xl font-bold shadow-2xl h-14 px-5 hover:bg-slate-800 transition-all border-none uppercase tracking-widest text-xs">
              <Download className="mr-3 h-5 w-5" /> Exporter PDF
            </Button>
          </div>
        </div>

        {/* Preview Card */}
        <Card className="border-none shadow-2xl shadow-slate-200/60 rounded-xl overflow-hidden bg-white/80 backdrop-blur-md group transition-all duration-500">
          <CardContent className="p-0">
            <div className="bg-slate-900 p-12 text-white flex justify-between items-center">
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 group-hover:rotate-6 transition-transform">
                  <Wrench className="h-10 w-10 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight">Inventaire Technique</h2>
                  <p className="text-white/50 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Audit du matériel et outillage • Février 2026</p>
                </div>
              </div>
              <div className="hidden lg:flex items-center gap-3 bg-white/5 px-6 py-4 rounded-2xl border border-white/5">
                <FileText className="h-5 w-5 text-amber-500" />
                <span className="text-xs font-black uppercase tracking-widest">Rapport Consolidé</span>
              </div>
            </div>

            <div className="p-6">
              <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/30 p-1">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-white hover:bg-white border-b border-slate-100 h-20">
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400 pl-10">Désignation</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400 text-center">Initial</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400 text-center">Entrées</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400 text-center">Sorties</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400 text-center pr-10">Stock Final</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryData.map((item, index) => (
                      <TableRow key={index} className="hover:bg-white transition-colors border-b border-slate-50 group/row">
                        <TableCell className="font-black text-slate-900 py-6 pl-10 text-sm uppercase tracking-tight">{item.name}</TableCell>
                        <TableCell className="text-center font-bold text-slate-400 text-sm">{item.initial}</TableCell>
                        <TableCell className="text-center font-black text-emerald-600 text-sm">{item.entered > 0 ? `+ ${item.entered}` : "---"}</TableCell>
                        <TableCell className="text-center font-black text-rose-500 text-sm">{item.exit > 0 ? `- ${item.exit}` : "---"}</TableCell>
                        <TableCell className="text-center pr-10">
                           <span className="inline-flex items-center justify-center h-10 w-14 rounded-xl bg-slate-900 text-white font-black text-sm shadow-xl group-hover/row:scale-110 transition-transform">
                             {item.initial + item.entered - item.exit}
                           </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Standardized Official Report Component */}
        {organizationSettings && (
          <TechnicalOfficialReport 
            items={inventoryData}
            organizationSettings={organizationSettings}
            period="Période du 1er au 28 Février 2026"
            isPrinting={isPrinting}
            onAfterPrint={() => setIsPrinting(false)}
          />
        )}
      </div>
    </PermissionGuard>
  );
}
