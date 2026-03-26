"use client";

import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, ArrowUpCircle, ArrowDownCircle, User, Package, Calendar } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { SupplyTransaction } from "@/lib/data";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface SupplyTransactionListProps {
    transactions: SupplyTransaction[];
    onDelete?: (id: string) => void;
}

export function SupplyTransactionList({ transactions, onDelete }: SupplyTransactionListProps) {
    if (transactions.length === 0) {
        return (
            <div className="text-center py-20 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200 shadow-inner">
                    <Calendar className="h-8 w-8 text-slate-300" />
                </div>
                <p className="font-black text-slate-500 uppercase tracking-widest">Aucun mouvement</p>
                <p className="text-sm text-slate-400 max-w-[300px] mx-auto mt-2 italic">L'historique des distributions et réapprovisionnements apparaîtra ici.</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-slate-100 overflow-hidden bg-white">
            <Table>
                <TableHeader className="bg-slate-50/80">
                    <TableRow className="border-slate-100 hover:bg-transparent">
                        <TableHead className="w-12 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">#</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Date</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Type</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Article</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Bénéficiaire / Source</TableHead>
                        <TableHead className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Quantité</TableHead>
                        <TableHead className="w-12"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.map((t, index) => (
                        <TableRow key={t.id} className="group hover:bg-slate-50/50 transition-colors border-slate-100 uppercase text-[11px]">
                            <TableCell className="text-center text-slate-300 font-mono">
                                {index + 1}
                            </TableCell>
                            <TableCell className="font-medium text-slate-500">
                                {t.date ? format(new Date(t.date), 'dd MMM yyyy', { locale: fr }) : '-'}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    {t.type === 'restock' ? (
                                        <Badge variant="outline" className="text-emerald-600 border-emerald-500 bg-emerald-50/50 gap-1 rounded-lg text-[10px] font-bold py-0.5">
                                            <ArrowUpCircle className="h-3 w-3" /> Réappro.
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-blue-600 border-blue-500 bg-blue-50/50 gap-1 rounded-lg text-[10px] font-bold py-0.5">
                                            <ArrowDownCircle className="h-3 w-3" /> Sortie
                                        </Badge>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="font-black text-slate-900">
                                <div className="flex items-center gap-2">
                                    <Package className="h-3.5 w-3.5 text-slate-400" />
                                    {t.supplyName}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2 font-bold text-slate-700">
                                    <User className="h-3.5 w-3.5 text-slate-400" />
                                    {t.recipientName || 'Administration'}
                                </div>
                            </TableCell>
                            <TableCell className={cn(
                                "text-center font-black text-lg",
                                t.type === 'restock' ? "text-emerald-600" : "text-slate-900"
                             )}>
                                {t.type === 'restock' ? '+' : '-'}{t.quantity}
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-xl shadow-xl border-slate-100">
                                        <DropdownMenuItem className="text-red-600 focus:text-red-600 font-bold" onClick={() => onDelete?.(t.id!)}>
                                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer Trace
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
