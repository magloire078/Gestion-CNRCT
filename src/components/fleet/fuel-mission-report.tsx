"use client";

import React, { useRef } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow,
    TableFooter
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { FuelTransaction, FuelCard } from "@/types/fuel";

interface FuelMissionReportProps {
    transactions: FuelTransaction[];
    card: FuelCard;
    month: number; // 0-11
    year: number;
    providerName?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function FuelMissionReport({ transactions, card, month: initialMonth, year: initialYear, providerName, open, onOpenChange }: FuelMissionReportProps) {
    const reportRef = useRef<HTMLDivElement>(null);
    const [month, setMonth] = React.useState(initialMonth);
    const [year, setYear] = React.useState(initialYear);

    const years = React.useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
    }, []);

    const months = [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];

    const filteredTransactions = transactions.filter(t => {
        const d = parseISO(t.date);
        return d.getMonth() === month && d.getFullYear() === year && t.cardId === card.id && t.type === 'expense';
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalLiters = filteredTransactions.reduce((sum, t) => sum + (t.liters || 0), 0);

    const monthName = format(new Date(year, month), 'MMMM yyyy', { locale: fr }).toUpperCase();

    const handlePrint = () => {
        const printContent = reportRef.current;
        const windowUrl = 'about:blank';
        const uniqueName = new Date().getTime();
        const windowName = 'Print' + uniqueName;
        const printWindow = window.open(windowUrl, windowName, 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');

        if (printWindow && printContent) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Rapport Carburant - ${card.cardNumber}</title>
                        <style>
                            @page { size: landscape; margin: 10mm; }
                            body { font-family: sans-serif; font-size: 10pt; color: #333; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th, td { border: 1px solid #ccc; padding: 6px 4px; text-align: left; }
                            th { background-color: #f0f0f0; font-weight: bold; }
                            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                            .header h1 { margin: 0; font-size: 14pt; }
                            .header p { margin: 5px 0; font-weight: bold; }
                            .footer { margin-top: 30px; display: flex; justify-content: space-between; }
                            .signature-box { width: 200px; height: 80px; border: 1px solid #ccc; margin-top: 10px; }
                            .text-right { text-align: right; }
                            .font-bold { font-weight: bold; }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h1>GESTION DU CARBURANT DU MOIS DE ${monthName}</h1>
                            <p>${providerName ? providerName.toUpperCase() : (card.label || 'CARTE')} (${card.cardNumber})</p>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>DATE</th>
                                    <th>N° TICKET</th>
                                    <th>VEHICULE</th>
                                    <th>DESTINATION / TRAJET</th>
                                    <th>CHEF MISSION</th>
                                    <th>DUREE</th>
                                    <th>INDEX (KM)</th>
                                    <th>LITRES</th>
                                    <th>P.U</th>
                                    <th>MONTANT (F)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filteredTransactions.map(t => `
                                    <tr>
                                        <td>${format(parseISO(t.date), 'dd/MM/yyyy')}</td>
                                        <td>${t.receiptNumber || ''}</td>
                                        <td>${t.vehiclePlate || ''}</td>
                                        <td>${t.missionRoute || ''}</td>
                                        <td>${t.missionHead || ''}</td>
                                        <td>${t.missionDuration || ''}</td>
                                        <td>${t.odometer?.toLocaleString() || ''}</td>
                                        <td>${t.liters || ''}</td>
                                        <td>${t.unitPrice || ''}</td>
                                        <td class="text-right">${t.amount.toLocaleString()}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr class="font-bold">
                                    <td colspan="7" class="text-right">TOTAL</td>
                                    <td>${totalLiters.toFixed(2)}</td>
                                    <td></td>
                                    <td class="text-right">${totalAmount.toLocaleString()} F</td>
                                </tr>
                            </tfoot>
                        </table>
                        <div class="footer">
                            <div>
                                <p>Signature Chauffeur / Porteur</p>
                                <div class="signature-box"></div>
                            </div>
                            <div>
                                <p>Visa Responsable Parc Auto</p>
                                <div class="signature-box"></div>
                            </div>
                            <div>
                                <p>Approbation DAFP</p>
                                <div class="signature-box"></div>
                            </div>
                        </div>
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="flex flex-col space-y-4">
                    <div className="flex flex-row items-center justify-between pr-8">
                        <DialogTitle>Aperçu du Rapport de Mission</DialogTitle>
                        <Button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700">
                            <Printer className="h-4 w-4 mr-2" /> Imprimer (PDF)
                        </Button>
                    </div>
                    
                    <div className="flex flex-row gap-4 items-center bg-muted/50 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Mois:</span>
                            <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
                                <SelectTrigger className="w-[140px] bg-white">
                                    <SelectValue placeholder="Mois" />
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map((m, i) => (
                                        <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Année:</span>
                            <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                                <SelectTrigger className="w-[100px] bg-white">
                                    <SelectValue placeholder="Année" />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map(y => (
                                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </DialogHeader>
                
                <div ref={reportRef} className="p-4 border rounded-lg bg-white text-black font-sans print:p-0 print:border-0">
                    <div className="text-center mb-6 border-b-2 border-black pb-4">
                        <h1 className="text-xl font-bold uppercase">GESTION DU CARBURANT DU MOIS DE {monthName}</h1>
                        <p className="font-semibold text-lg">{providerName ? providerName.toUpperCase() : (card.label || 'CARTE')} ({card.cardNumber})</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="border border-gray-300 p-2 text-left">DATE</th>
                                    <th className="border border-gray-300 p-2 text-left">N° TICKET</th>
                                    <th className="border border-gray-300 p-2 text-left">VEHICULE</th>
                                    <th className="border border-gray-300 p-2 text-left">CHEF MISSION</th>
                                    <th className="border border-gray-300 p-2 text-left">TRAJET</th>
                                    <th className="border border-gray-300 p-2 text-left">DUREE</th>
                                    <th className="border border-gray-300 p-2 text-left">INDEX</th>
                                    <th className="border border-gray-300 p-2 text-left">LITRES</th>
                                    <th className="border border-gray-300 p-2 text-left">P.U</th>
                                    <th className="border border-gray-300 p-2 text-right">MONTANT (F)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.length > 0 ? (
                                    filteredTransactions.map((t) => (
                                        <tr key={t.id}>
                                            <td className="border border-gray-300 p-2">{format(parseISO(t.date), 'dd/MM/yyyy')}</td>
                                            <td className="border border-gray-300 p-2">{t.receiptNumber || '-'}</td>
                                            <td className="border border-gray-300 p-2 font-mono text-xs">{t.vehiclePlate || '-'}</td>
                                            <td className="border border-gray-300 p-2 text-xs">{t.missionHead || '-'}</td>
                                            <td className="border border-gray-300 p-2 text-xs">{t.missionRoute || '-'}</td>
                                            <td className="border border-gray-300 p-2 text-xs">{t.missionDuration || '-'}</td>
                                            <td className="border border-gray-300 p-2 text-xs">{t.odometer?.toLocaleString() || '-'}</td>
                                            <td className="border border-gray-300 p-2 text-xs">{t.liters || '-'}</td>
                                            <td className="border border-gray-300 p-2 text-xs">{t.unitPrice || '-'}</td>
                                            <td className="border border-gray-300 p-2 text-right text-xs">{t.amount.toLocaleString()}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={10} className="border border-gray-300 p-4 text-center text-gray-500 italic">
                                            Aucune dépense trouvée pour cette période.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot className="font-bold bg-gray-50">
                                <tr>
                                    <td colSpan={7} className="border border-gray-300 p-2 text-right uppercase">Total</td>
                                    <td className="border border-gray-300 p-2 text-xs">{totalLiters.toFixed(2)}</td>
                                    <td className="border border-gray-300 p-2"></td>
                                    <td className="border border-gray-300 p-2 text-right text-xs">{totalAmount.toLocaleString()} F</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div className="mt-8 grid grid-cols-3 gap-8 text-xs font-semibold">
                        <div className="space-y-12">
                            <p className="text-center">Signature Chauffeur / Porteur</p>
                            <div className="border border-gray-300 h-20 w-full rounded"></div>
                        </div>
                        <div className="space-y-12">
                            <p className="text-center">Visa Responsable Parc Auto</p>
                            <div className="border border-gray-300 h-20 w-full rounded"></div>
                        </div>
                        <div className="space-y-12">
                            <p className="text-center">Approbation DAFP</p>
                            <div className="border border-gray-300 h-20 w-full rounded"></div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
