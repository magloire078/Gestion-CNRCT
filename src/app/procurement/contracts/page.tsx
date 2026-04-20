"use client";

import { useState, useEffect, useMemo } from "react";
import { 
    Briefcase, Search, Filter, Calendar, 
    MoreVertical, Edit, Trash2, ArrowLeft,
    ChevronRight, Bookmark, Wallet, TrendingUp,
    CheckCircle2, Clock, XCircle
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { subscribeToContracts, deleteContract } from "@/services/procurement-service";
import type { Contract } from "@/lib/data";
import { AddContractSheet } from "@/components/procurement/add-contract-sheet";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { PermissionGuard } from "@/components/auth/permission-guard";

const statusIcons: Record<string, any> = {
    'Passation': <Clock className="h-3 w-3" />,
    'En cours': <TrendingUp className="h-3 w-3" />,
    'Terminé': <CheckCircle2 className="h-3 w-3" />,
    'Résilié': <XCircle className="h-3 w-3" />,
};

const statusColors: Record<string, string> = {
    'Passation': "bg-amber-100 text-amber-700 border-amber-200",
    'En cours': "bg-blue-100 text-blue-700 border-blue-200",
    'Terminé': "bg-emerald-100 text-emerald-700 border-emerald-200",
    'Résilié': "bg-rose-100 text-rose-700 border-rose-200",
};

export default function ContractsPage() {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        return subscribeToContracts((data) => {
            setContracts(data);
            setLoading(false);
        }, console.error);
    }, []);

    const filteredContracts = useMemo(() => {
        return contracts.filter(c => 
            c.title.toLowerCase().includes(search.toLowerCase()) ||
            c.reference.toLowerCase().includes(search.toLowerCase()) ||
            c.providerName.toLowerCase().includes(search.toLowerCase())
        );
    }, [contracts, search]);

    const handleDelete = async (id: string) => {
        if (confirm("Êtes-vous sûr de vouloir supprimer ce marché ?")) {
            try {
                await deleteContract(id);
                toast.success("Marché supprimé");
            } catch (error) {
                toast.error("Erreur lors de la suppression");
            }
        }
    };

    return (
        <PermissionGuard permission="page:procurement:view">
            <div className="container mx-auto py-10 px-4 md:px-6 pb-24">
                <div className="flex flex-col gap-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                <Link href="/procurement" className="hover:text-primary flex items-center gap-1">
                                    <ArrowLeft className="h-3 w-3" /> Dashboard
                                </Link>
                                <ChevronRight className="h-3 w-3" />
                                <span className="text-xs font-bold uppercase tracking-wider text-primary italic">Marchés Publics</span>
                            </div>
                            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 italic">
                                <Briefcase className="h-8 w-8 text-primary" /> Suivi des Marchés & Contrats
                            </h1>
                        </div>
                        <AddContractSheet />
                    </div>

                    {/* Search */}
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Rechercher par objet, référence ou prestataire..." 
                            className="pl-10 rounded-xl bg-white border-slate-200 shadow-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Table / List */}
                    <div className="grid grid-cols-1 gap-4">
                        {filteredContracts.map(contract => (
                            <Card key={contract.id} className="group overflow-hidden border-white/40 shadow-lg bg-white/70 backdrop-blur-md transition-all hover:shadow-xl rounded-2xl">
                                <CardContent className="p-0">
                                    <div className="flex flex-col md:flex-row md:items-center">
                                        {/* Status Sidebar (Desktop) */}
                                        <div className={`hidden md:flex w-2 self-stretch ${statusColors[contract.status]?.split(' ')[0]}`} />
                                        
                                        <div className="flex-1 p-5 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                                            {/* Contract Info */}
                                            <div className="md:col-span-2 space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge variant="outline" className={`text-[9px] uppercase tracking-tighter flex items-center gap-1 ${statusColors[contract.status]}`}>
                                                        {statusIcons[contract.status]} {contract.status}
                                                    </Badge>
                                                    <Badge variant="secondary" className="text-[9px] uppercase tracking-tighter bg-slate-100 text-slate-600">
                                                        {contract.type}
                                                    </Badge>
                                                </div>
                                                <h3 className="text-lg font-black text-slate-900 group-hover:text-primary transition-colors line-clamp-1 italic">
                                                    {contract.title}
                                                </h3>
                                                <div className="flex items-center gap-3 text-xs text-slate-500 font-bold uppercase tracking-widest">
                                                    <span className="flex items-center gap-1"><Bookmark className="h-3 w-3" /> {contract.reference}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1 text-slate-900">{contract.providerName}</span>
                                                </div>
                                            </div>

                                            {/* Budget Link */}
                                            <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Imputation Budgétaire</p>
                                                <p className="text-sm font-bold text-slate-700 truncate">[{contract.budgetLineCode}] {contract.budgetLineName}</p>
                                                <p className="text-[10px] font-bold text-primary">Budget Année {contract.budgetYear}</p>
                                            </div>

                                            {/* Financial Info */}
                                            <div className="flex flex-col items-end md:items-end gap-1">
                                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Montant Total</p>
                                                <p className="text-xl font-black text-slate-900">{formatCurrency(contract.totalAmount)}</p>
                                                <Progress 
                                                    value={(contract.amountPaid / contract.totalAmount) * 100} 
                                                    className="w-24 h-1.5 bg-slate-100 mt-1" 
                                                    indicatorClassName="bg-emerald-500"
                                                />
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">Payé: {formatCurrency(contract.amountPaid)}</p>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center justify-between md:justify-end gap-2 p-5 pt-0 md:pt-5 bg-slate-50/50 md:bg-transparent border-t md:border-t-0 border-slate-100">
                                            <div className="flex md:hidden items-center gap-2 text-xs text-muted-foreground font-bold italic">
                                                <Calendar className="h-3.5 w-3.5" /> {contract.engagementDate}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button size="sm" variant="outline" className="rounded-lg h-9 font-bold text-xs" asChild>
                                                    <Link href={`/procurement/contracts/${contract.id}`}>Détails</Link>
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-xl">
                                                        <DropdownMenuItem className="text-xs font-bold gap-2">
                                                            <Edit className="h-3.5 w-3.5" /> Modifier
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem 
                                                            className="text-xs font-bold gap-2 text-destructive"
                                                            onClick={() => handleDelete(contract.id)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" /> Supprimer
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {filteredContracts.length === 0 && !loading && (
                            <div className="py-20 text-center flex flex-col items-center justify-center gap-4 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 italic">
                                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
                                    <Briefcase className="h-8 w-8 text-slate-300" />
                                </div>
                                <p className="text-xl font-bold text-slate-900 italic">Aucun marché trouvé</p>
                                <AddContractSheet />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PermissionGuard>
    );
}
