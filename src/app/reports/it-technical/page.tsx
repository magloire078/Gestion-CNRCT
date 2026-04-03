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
import { InstitutionalHeader } from "@/components/reports/institutional-header";
import { InstitutionalFooter } from "@/components/reports/institutional-footer";
import { InstitutionalReportWrapper } from "@/components/reports/institutional-report-wrapper";

const inventoryData = [
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

  const handlePrint = () => {
    setIsPrinting(true);
  };

  return (
    <PermissionGuard permission="page:reports:view">
      <div className="flex flex-col gap-8 pb-20 max-w-5xl mx-auto py-10 px-6 sm:px-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        {/* Controls - Hidden on Print */}
        <div className="flex items-center justify-between print:hidden">
          <Link href="/reports">
            <Button variant="ghost" className="rounded-full gap-2 text-slate-500 hover:text-slate-900 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Retour aux rapports
            </Button>
          </Link>
          <div className="flex gap-4">
            <Button onClick={handlePrint} variant="outline" className="rounded-xl border-slate-200 font-bold shadow-sm h-12 px-6">
              <Printer className="mr-2 h-4 w-4" /> Imprimer le rapport
            </Button>
            <Button onClick={handlePrint} className="bg-slate-900 text-white rounded-xl font-bold shadow-xl h-12 px-6 hover:bg-slate-800 transition-all border-none font-bold uppercase tracking-widest text-[11px]">
              <Download className="mr-2 h-4 w-4" /> PDF
            </Button>
          </div>
        </div>

        <InstitutionalReportWrapper isPrinting={isPrinting} onAfterPrint={() => setIsPrinting(false)}>
          {/* Main Report Container */}
          <div id="printable-report" className="border-none shadow-2xl shadow-slate-200/60 rounded-[2.5rem] overflow-hidden bg-white print:shadow-none print:m-0 print:border-none">
            <div className="p-12 md:p-16 space-y-12">
              
              {/* Reusable Institutional Header */}
              <InstitutionalHeader 
                title="Le point de la gestion des matériels et outillages techniques" 
                period="Période du 1er au 28 Février 2026"
              />

            {/* Observation Note */}
            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6 flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                 <FileText className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                 <p className="text-xs font-black uppercase text-amber-900 tracking-widest mb-1 italic">Note de Gestion</p>
                 <p className="text-sm font-bold text-amber-700 italic">NB : Rien à signaler</p>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="space-y-4">
               <div className="flex items-center gap-3 mb-2">
                  <Wrench className="h-5 w-5 text-slate-400" />
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Suivi des Stocks</h3>
               </div>
               
               <div className="overflow-hidden rounded-3xl border border-slate-100 shadow-sm p-1">
                 <Table>
                   <TableHeader>
                     <TableRow className="bg-slate-900 hover:bg-slate-900 border-none rounded-t-2xl">
                       <TableHead className="text-white font-black uppercase text-[10px] tracking-widest h-14 pl-8 rounded-tl-2xl">Désignation</TableHead>
                       <TableHead className="text-white font-black uppercase text-[10px] tracking-widest h-14 text-center">Stock Initial</TableHead>
                       <TableHead className="text-white font-black uppercase text-[10px] tracking-widest h-14 text-center">Stock Entré</TableHead>
                       <TableHead className="text-white font-black uppercase text-[10px] tracking-widest h-14 text-center">Stock Sorti</TableHead>
                       <TableHead className="text-white font-black uppercase text-[10px] tracking-widest h-14 text-center pr-8 rounded-tr-2xl">Stock Restant</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {inventoryData.map((item, index) => (
                       <TableRow key={index} className="hover:bg-slate-50 border-b border-slate-50 transition-colors">
                         <TableCell className="font-bold text-slate-700 py-4 pl-8 text-sm">{item.name}</TableCell>
                         <TableCell className="text-center font-black text-slate-900 text-sm bg-slate-50/40">{item.initial}</TableCell>
                         <TableCell className="text-center font-bold text-emerald-600 text-sm">{item.entered}</TableCell>
                         <TableCell className="text-center font-bold text-rose-500 text-sm">{item.exit}</TableCell>
                         <TableCell className="text-center pr-8">
                            <span className="inline-flex items-center justify-center h-8 w-12 rounded-lg bg-slate-900 text-white font-black text-xs shadow-md">
                              {item.initial + item.entered - item.exit}
                            </span>
                         </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </div>
            </div>

            {/* Reusable Institutional Footer */}
            <InstitutionalFooter 
              date="04/03/2026"
              signatoryName="COULIBALY Hamadou"
              signatoryTitle="Contrôleur Interne et Qualité, CNRCT"
            />
            </div>
          </div>
        </InstitutionalReportWrapper>

        {/* Global CSS for Printing */}
        <style jsx global>{`
          @media print {
            @page {
              size: A4;
              margin: 10mm;
            }
            /* Hide everything first */
            body * {
              visibility: hidden;
            }
            /* Show report and its children */
            #printable-report, #printable-report * {
              visibility: visible;
            }
            /* Positioning the report for print */
            #printable-report {
              position: absolute;
              left: 0;
              top: 0;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
            }
            /* Fix background colors for print */
            .bg-slate-900 {
              background-color: #0f172a !important;
              -webkit-print-color-adjust: exact;
            }
            .bg-slate-50\/40 {
               background-color: #f8fafc !important;
               -webkit-print-color-adjust: exact;
            }
          }
        `}</style>
      </div>
    </PermissionGuard>
  );
}
