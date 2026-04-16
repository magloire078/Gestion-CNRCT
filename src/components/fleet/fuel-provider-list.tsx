
"use client";

import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { FuelProvider } from "@/types/fuel";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ProviderListProps {
    providers: FuelProvider[];
    onEdit?: (provider: FuelProvider) => void;
    onDelete?: (id: string) => void;
}

export function FuelProviderList({ providers, onEdit, onDelete }: ProviderListProps) {
    if (providers.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                Aucun prestataire enregistré.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="border-border/50 bg-slate-50/50 hover:bg-slate-50/50">
                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-6 pl-8">Identité Prestataire</TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Contact / Convention</TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 text-center">Statut</TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 text-center">Enregistré le</TableHead>
                        <TableHead className="sr-only">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {providers.map((p) => (
                        <TableRow key={p.id} className="border-border/20 hover:bg-white/40 transition-all group h-20">
                            <TableCell className="pl-8">
                                <span className="font-black text-slate-900 uppercase tracking-tight text-sm group-hover:text-blue-600 transition-colors">
                                    {p.name}
                                </span>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                                        {p.contactPerson || "Référent non spécifié"}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-tighter italic">
                                        Contrat N° {p.contractNumber || "Indéterminé"}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="text-center">
                                <Badge variant={p.status === 'active' ? 'default' : 'secondary'} 
                                       className={cn(
                                           "font-black text-[9px] uppercase tracking-[0.15em] rounded-lg px-3 py-1 border-none shadow-sm",
                                           p.status === 'active' ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                                       )}>
                                    {p.status === 'active' ? 'Partenaire Actif' : 'Inactif'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {p.createdAt ? format(new Date(p.createdAt), 'dd MMM yyyy', { locale: fr }) : '-'}
                                </span>
                            </TableCell>
                            <TableCell className="text-right pr-8">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-200/50 transition-colors">
                                            <MoreHorizontal className="h-5 w-5 text-slate-600" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-white/20 bg-white/90 backdrop-blur-xl shadow-2xl">
                                        <div className="px-3 py-2 font-black uppercase text-[9px] tracking-[0.2em] text-slate-400">Administration</div>
                                        {onEdit && (
                                            <DropdownMenuItem onClick={() => onEdit(p)} className="rounded-xl font-bold py-2.5 px-3 focus:bg-slate-100 cursor-pointer">
                                                <Pencil className="mr-2 h-4 w-4 text-slate-600" /> Rectifier les infos
                                            </DropdownMenuItem>
                                        )}
                                        {onDelete && (
                                            <DropdownMenuItem className="rounded-xl text-rose-600 font-bold py-2.5 px-3 focus:bg-rose-50 focus:text-rose-600 cursor-pointer" onClick={() => onDelete(p.id)}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Résilier le compte
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
