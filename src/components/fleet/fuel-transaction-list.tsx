
"use client";

import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MoreHorizontal, Trash2, ArrowUpCircle, ArrowDownCircle, Fuel, User, Car } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { FuelTransaction, FuelCard } from "@/types/fuel";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface TransactionListProps {
    transactions: FuelTransaction[];
    cards: FuelCard[];
    onDelete?: (id: string) => void;
}

export function FuelTransactionList({ transactions, cards, onDelete }: TransactionListProps) {
    if (transactions.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                Aucune transaction enregistrée.
            </div>
        );
    }

    const getCardNumber = (id: string) => cards.find(c => c.id === id)?.cardNumber || "N/A";

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="border-border/50 bg-slate-50/50 hover:bg-slate-50/50">
                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-6 pl-8">Chronologie</TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 text-center">Nature Flux</TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Carte Source</TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Justificatifs & Opération</TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 text-right pr-8">Volume / Montant</TableHead>
                        <TableHead className="sr-only">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.map((t) => (
                        <TableRow key={t.id} className="border-border/20 hover:bg-white/40 transition-all group h-24">
                            <TableCell className="pl-8">
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-slate-900 uppercase tracking-tight">
                                        {t.date ? format(new Date(t.date), 'dd MMM yyyy', { locale: fr }) : '-'}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">
                                        {t.date ? format(new Date(t.date), 'HH:mm', { locale: fr }) : ''}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="text-center">
                                {t.type === 'recharge' ? (
                                    <Badge variant="outline" className="font-black text-[9px] uppercase tracking-[0.1em] rounded-lg px-2.5 py-1 bg-emerald-50 text-emerald-700 border-none shadow-sm gap-1.5">
                                        <ArrowUpCircle className="h-3 w-3" /> Dotation
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="font-black text-[9px] uppercase tracking-[0.1em] rounded-lg px-2.5 py-1 bg-blue-50 text-blue-700 border-none shadow-sm gap-1.5">
                                        <ArrowDownCircle className="h-3 w-3" /> Consommation
                                    </Badge>
                                )}
                            </TableCell>
                            <TableCell>
                                <span className="font-mono font-black text-slate-500 text-xs bg-slate-50 px-2 py-1 rounded-md border border-slate-100 group-hover:text-slate-900 transition-colors">
                                    {getCardNumber(t.cardId)}
                                </span>
                            </TableCell>
                            <TableCell>
                                {t.type === 'expense' ? (
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <div className="h-5 w-5 rounded bg-slate-900 flex items-center justify-center">
                                                <Car className="h-3 w-3 text-white" />
                                            </div>
                                            <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{t.vehiclePlate || 'Véhicule N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                            <div className="flex items-center gap-1">
                                                <User className="h-3 w-3" /> {t.driverName || 'Inconnu'}
                                            </div>
                                            {t.receiptNumber && (
                                                <div className="flex items-center gap-1 text-blue-600">
                                                    <Fuel className="h-3 w-3" /> Ticket: {t.receiptNumber}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Crédit de compte prestataire</span>
                                )}
                            </TableCell>
                            <TableCell className="text-right pr-8">
                                <div className="flex flex-col items-end">
                                    <span className={cn(
                                        "font-black text-base tracking-tighter",
                                        t.type === 'recharge' ? "text-emerald-600" : "text-slate-900"
                                    )}>
                                        {t.type === 'recharge' ? '+' : '-'}{t.amount.toLocaleString()} <span className="text-[10px] opacity-60">FCFA</span>
                                    </span>
                                    {t.liters && (
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                            {t.liters} Litres délivrés
                                        </span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                {onDelete && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-200/50 transition-colors">
                                                <MoreHorizontal className="h-5 w-5 text-slate-600" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-white/20 bg-white/90 backdrop-blur-xl shadow-2xl">
                                            <div className="px-3 py-2 font-black uppercase text-[9px] tracking-[0.2em] text-slate-400">Contrôle</div>
                                            <DropdownMenuItem className="rounded-xl text-rose-600 font-bold py-2.5 px-3 focus:bg-rose-50 focus:text-rose-600 cursor-pointer" onClick={() => onDelete(t.id)}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Annuler l'écriture
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
