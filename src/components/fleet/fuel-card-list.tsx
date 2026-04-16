
"use client";

import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2, Fuel, User, Car, Printer } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { FuelCard, FuelProvider } from "@/types/fuel";
import type { Employe, Fleet } from "@/lib/data";

interface CardListProps {
    cards: FuelCard[];
    providers: FuelProvider[];
    onEdit?: (card: FuelCard) => void;
    onDelete?: (id: string) => void;
    onRecharge?: (card: FuelCard) => void;
    onPrint?: (card: FuelCard) => void;
    employees?: Employe[];
    vehicles?: Fleet[];
}

export function FuelCardList({ cards, providers, onEdit, onDelete, onRecharge, onPrint, employees = [], vehicles = [] }: CardListProps) {
    if (cards.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                Aucune carte enregistrée.
            </div>
        );
    }

    const getProviderName = (id: string) => providers.find(p => p.id === id)?.name || "N/A";

    const getAssignmentLabel = (card: FuelCard) => {
        if (card.assignmentType === 'vehicle') {
            const vehicle = vehicles.find(v => v.plate === card.assignmentId);
            return (
                <div className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    {vehicle ? `${vehicle.makeModel} (${vehicle.plate})` : card.assignmentId}
                </div>
            );
        }
        if (card.assignmentType === 'employee') {
            const employee = employees.find(e => e.id === card.assignmentId);
            return (
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {employee ? employee.name : "Personnel"}
                </div>
            );
        }
        return <div className="flex items-center gap-2 text-muted-foreground italic">{card.assignmentId || "Générique"}</div>;
    };

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="border-border/50 bg-slate-50/50 hover:bg-slate-50/50">
                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-6 pl-8">N° Carte</TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Préstataire</TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Affectation</TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 text-right">Solde Actuel</TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 text-center">Status</TableHead>
                        <TableHead className="sr-only">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {cards.map((c) => (
                        <TableRow key={c.id} className="border-border/20 hover:bg-white/40 transition-all group h-20">
                            <TableCell className="pl-8">
                                <span className="font-mono font-black text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg text-xs tracking-wider">
                                    {c.cardNumber}
                                </span>
                            </TableCell>
                            <TableCell>
                                <span className="font-black text-slate-700 uppercase tracking-tight text-xs">
                                    {getProviderName(c.providerId)}
                                </span>
                            </TableCell>
                            <TableCell>
                                <div className="font-bold text-slate-600 uppercase text-[11px] tracking-wide">
                                    {getAssignmentLabel(c)}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <span className="font-black text-emerald-600 text-sm">
                                    {c.currentBalance.toLocaleString()} <span className="text-[10px] opacity-70">FCFA</span>
                                </span>
                            </TableCell>
                            <TableCell className="text-center">
                                <Badge variant={c.status === 'active' ? 'outline' : 'destructive'} 
                                       className={cn(
                                           "font-black text-[9px] uppercase tracking-[0.15em] rounded-lg px-3 py-1 border-none shadow-sm",
                                           c.status === 'active' ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                                       )}>
                                    {c.status === 'active' ? 'Opérationnelle' : c.status === 'blocked' ? 'Bloquée' : 'Expirée'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right pr-8">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-200/50 transition-colors">
                                            <MoreHorizontal className="h-5 w-5 text-slate-600" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-white/20 bg-white/90 backdrop-blur-xl shadow-2xl">
                                        <div className="px-3 py-2 font-black uppercase text-[9px] tracking-[0.2em] text-slate-400">Actions d'Ordre</div>
                                        {onRecharge && (
                                            <DropdownMenuItem onClick={() => onRecharge(c)} className="rounded-xl font-bold py-2.5 px-3 focus:bg-emerald-50 focus:text-emerald-700 cursor-pointer">
                                                <Fuel className="mr-2 h-4 w-4 text-emerald-500" /> Alimenter la Carte
                                            </DropdownMenuItem>
                                        )}
                                        {onPrint && (
                                            <DropdownMenuItem onClick={() => onPrint(c)} className="rounded-xl font-bold py-2.5 px-3 focus:bg-blue-50 focus:text-blue-700 cursor-pointer">
                                                <Printer className="mr-2 h-4 w-4 text-blue-500" /> Rapport de Mission
                                            </DropdownMenuItem>
                                        )}
                                        {onEdit && (
                                            <DropdownMenuItem onClick={() => onEdit(c)} className="rounded-xl font-bold py-2.5 px-3 focus:bg-slate-100 cursor-pointer">
                                                <Pencil className="mr-2 h-4 w-4 text-slate-600" /> Paramétrer
                                            </DropdownMenuItem>
                                        )}
                                        {onDelete && (
                                            <DropdownMenuItem className="rounded-xl text-rose-600 font-bold py-2.5 px-3 focus:bg-rose-50 focus:text-rose-600 cursor-pointer" onClick={() => onDelete(c.id)}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Révoquer
                                            </DropdownMenuItem>
                                        )}
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
