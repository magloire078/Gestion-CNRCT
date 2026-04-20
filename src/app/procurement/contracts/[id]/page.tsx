"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { 
    Briefcase, Calendar, DollarSign, ArrowLeft, 
    ChevronRight, Bookmark, Building2, Link as LinkIcon,
    AlertCircle, FileText, CheckCircle2, Clock, XCircle,
    TrendingUp, Calculator, Wallet, MoreVertical, Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
    subscribeToContracts, subscribeToInvoices, 
    deleteInvoice, syncContractPayments 
} from "@/services/procurement-service";
import type { Contract, Invoice } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import { AddInvoiceSheet } from "@/components/procurement/add-invoice-sheet";
import { toast } from "sonner";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { PermissionGuard } from "@/components/auth/permission-guard";

export default function ContractDetailPage() {
    const { id } = useParams() as { id: string };
    const [contract, setContract] = useState<Contract | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubContract = subscribeToContracts((data) => {
            const found = data.find(c => c.id === id);
            if (found) setContract(found);
            setLoading(false);
        }, console.error);

        const unsubInvoices = subscribeToInvoices(id, setInvoices, console.error);

        return () => {
            unsubContract();
            unsubInvoices();
        };
    }, [id]);

    const stats = useMemo(() => {
        if (!contract) return null;
        const totalPaid = invoices.filter(i => i.status === 'Payée').reduce((acc, i) => acc + i.amount, 0);
        const totalPending = invoices.filter(i => i.status === 'En attente' || i.status === 'Validée').reduce((acc, i) => acc + i.amount, 0);
        const remaining = contract.totalAmount - totalPaid;
        const progress = (totalPaid / contract.totalAmount) * 100;
        
        return { totalPaid, totalPending, remaining, progress };
    }, [contract, invoices]);

    const handleDeleteInvoice = async (invoiceId: string) => {
        if (confirm("Supprimer cette facture ?")) {
            try {
                await deleteInvoice(invoiceId);
                await syncContractPayments(id);
                toast.success("Facture supprimée");
            } catch (error) {
                toast.error("Erreur");
            }
        }
    };

    if (loading) return <div className="p-20 text-center animate-pulse">Chargement des détails du marché...</div>;
    if (!contract) return <div className="p-20 text-center text-rose-500 font-bold underline">Marché introuvable</div>;

    return (
        <PermissionGuard permission="page:procurement:view">
            <div className="container mx-auto py-10 px-4 md:px-6">
                <div className="flex flex-col gap-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                <Link href="/procurement/contracts" className="hover:text-primary flex items-center gap-1">
                                    <ArrowLeft className="h-3 w-3" /> Liste des Marchés
                                </Link>
                                <ChevronRight className="h-3 w-3" />
                                <span className="text-xs font-bold uppercase tracking-wider text-primary truncate max-w-[200px] italic">
                                    {contract.reference}
                                </span>
                            </div>
                            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 italic">
                                <Briefcase className="h-8 w-8 text-primary" /> {contract.title}
                            </h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <AddInvoiceSheet contract={contract} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Info */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Summary Card */}
                            <Card className="border-white/40 shadow-xl bg-white/70 backdrop-blur-md rounded-3xl overflow-hidden">
                                <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                                    <CardTitle className="text-lg font-black flex items-center gap-2 italic text-slate-800">
                                        <Bookmark className="h-5 w-5 text-primary" /> Informations Générales
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Prestataire</p>
                                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-100 italic">
                                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black">
                                                    {contract.providerName.charAt(0)}
                                                </div>
                                                <span className="font-bold text-slate-900 underline decoration-primary/30 underline-offset-4">{contract.providerName}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Imputation Budgétaire</p>
                                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-100">
                                                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 font-bold">
                                                    <LinkIcon className="h-5 w-5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900">[{contract.budgetLineCode}] {contract.budgetLineName}</span>
                                                    <span className="text-[10px] text-amber-600 font-black tracking-widest uppercase">Gestion {contract.budgetYear}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Montant Contracté</span>
                                                <span className="text-2xl font-black text-slate-900">{formatCurrency(contract.totalAmount)}</span>
                                            </div>
                                            <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-600">
                                                <Wallet className="h-6 w-6" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Début Exécution</p>
                                                <p className="text-sm font-bold text-slate-700">{contract.startDate}</p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Fin Prévue</p>
                                                <p className="text-sm font-bold text-slate-700">{contract.endDate}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Invoices Table */}
                            <Card className="border-white/40 shadow-xl bg-white/70 backdrop-blur-md rounded-3xl overflow-hidden mb-20">
                                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100">
                                    <div>
                                        <CardTitle className="text-lg font-black flex items-center gap-2 italic">
                                            <FileText className="h-5 w-5 text-emerald-600" /> Facturation & Règlements
                                        </CardTitle>
                                        <CardDescription>Historique des factures enregistrées pour ce marché.</CardDescription>
                                    </div>
                                    <AddInvoiceSheet contract={contract} />
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/50">
                                                <tr>
                                                    <th className="px-6 py-4">Référence</th>
                                                    <th className="px-6 py-4">Date</th>
                                                    <th className="px-6 py-4 text-right">Montant</th>
                                                    <th className="px-6 py-4">Statut</th>
                                                    <th className="px-6 py-4"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {invoices.map(invoice => (
                                                    <tr key={invoice.id} className="group hover:bg-slate-50/80 transition-colors">
                                                        <td className="px-6 py-4 font-bold text-slate-900">{invoice.reference}</td>
                                                        <td className="px-6 py-4 text-slate-600">{invoice.date}</td>
                                                        <td className="px-6 py-4 text-right font-black">{formatCurrency(invoice.amount)}</td>
                                                        <td className="px-6 py-4">
                                                            <Badge variant="outline" className={`text-[10px] uppercase font-bold ${
                                                                invoice.status === 'Payée' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                                invoice.status === 'Annulée' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                                'bg-blue-50 text-blue-700 border-blue-200'
                                                            }`}>
                                                                {invoice.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem className="text-xs font-bold text-destructive gap-2" onClick={() => handleDeleteInvoice(invoice.id)}>
                                                                        <Trash2 className="h-3.5 w-3.5" /> Supprimer
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {invoices.length === 0 && (
                                                    <tr>
                                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic font-bold">
                                                            Aucune facture enregistrée pour ce marché.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar Stats */}
                        <div className="space-y-6">
                            <Card className="border-white/40 shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl overflow-hidden p-6 relative">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><Calculator className="h-20 w-20" /></div>
                                <div className="relative z-10 space-y-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Statut Financier</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold">Reste à payer</span>
                                            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                                                {stats?.progress.toFixed(1)}% Payé
                                            </Badge>
                                        </div>
                                        <p className="text-3xl font-black text-white">{formatCurrency(stats?.remaining || 0)}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Progress 
                                            value={stats?.progress || 0} 
                                            className="h-2 bg-white/10" 
                                            indicatorClassName="bg-emerald-400"
                                        />
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter text-slate-400">
                                            <span>0%</span>
                                            <span>Consommation du Marché</span>
                                            <span>100%</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/10 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-400 font-bold">Déjà Payé</span>
                                            <span className="text-sm font-black text-emerald-400">{formatCurrency(stats?.totalPaid || 0)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-400 font-bold">En attente</span>
                                            <span className="text-sm font-black text-amber-400">{formatCurrency(stats?.totalPending || 0)}</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card className="border-white/40 shadow-xl bg-white/70 backdrop-blur-md rounded-3xl p-6">
                                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 italic">Action Rapide</CardTitle>
                                <Button className="w-full bg-slate-900 rounded-2xl h-12 font-bold gap-2 mb-3">
                                    <TrendingUp className="h-4 w-4" /> Mettre à jour le statut
                                </Button>
                                <p className="text-[10px] text-center text-slate-400 italic">
                                    Le montant payé est automatiquement recalculé à partir des factures marquées comme "Payée".
                                </p>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </PermissionGuard>
    );
}
