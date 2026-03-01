
"use client";

import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Carte</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="w-10"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {transactions.map((t) => (
                    <TableRow key={t.id}>
                        <TableCell className="text-sm font-medium">
                            {t.date ? format(new Date(t.date), 'dd MMM yyyy HH:mm', { locale: fr }) : '-'}
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                {t.type === 'recharge' ? (
                                    <Badge variant="outline" className="text-emerald-600 border-emerald-500 gap-1">
                                        <ArrowUpCircle className="h-3 w-3" /> Recharge
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-blue-600 border-blue-500 gap-1">
                                        <ArrowDownCircle className="h-3 w-3" /> Plein
                                    </Badge>
                                )}
                            </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{getCardNumber(t.cardId)}</TableCell>
                        <TableCell className="text-xs">
                            {t.type === 'expense' ? (
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 font-medium">
                                        <Car className="h-3 w-3" /> {t.vehiclePlate || 'N/A'}
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <User className="h-3 w-3" /> {t.driverName || 'N/A'}
                                    </div>
                                    {t.odometer && <div className="text-[10px] text-muted-foreground italic">{t.odometer.toLocaleString()} km</div>}
                                </div>
                            ) : (
                                <span className="text-muted-foreground">Rechargement de crédit</span>
                            )}
                        </TableCell>
                        <TableCell className={`text-right font-bold ${t.type === 'recharge' ? 'text-emerald-600' : 'text-primary'}`}>
                            {t.type === 'recharge' ? '+' : '-'}{t.amount.toLocaleString()} FCFA
                            {t.liters && <div className="text-[10px] font-normal text-muted-foreground">{t.liters} L</div>}
                        </TableCell>
                        <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem className="text-destructive" onClick={() => onDelete?.(t.id)}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
