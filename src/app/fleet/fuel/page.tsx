"use client";

import React, { useState, useMemo, useEffect } from "react";
import { PlusCircle, Building2, History, LayoutDashboard, Plus, Fuel, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

// Services
import {
    subscribeToFuelProviders,
    subscribeToFuelCards,
    subscribeToFuelTransactions,
    deleteFuelTransaction,
    deleteFuelProvider,
    deleteFuelCard
} from "@/services/fuel-card-service";
import { subscribeToEmployees } from "@/services/employee-service";
import { subscribeToVehicles } from "@/services/fleet-service";
import { Employe, Fleet } from "@/lib/data";

// Components
import { useAuth } from "@/hooks/use-auth";
import { PermissionGuard } from "@/components/auth/permission-guard";
import dynamic from "next/dynamic";

// Dynamic imports for dialogs to improve INP
const FuelProviderDialog = dynamic(() => import("@/components/fleet/fuel-forms").then(mod => mod.FuelProviderDialog));
const FuelCardDialog = dynamic(() => import("@/components/fleet/fuel-forms").then(mod => mod.FuelCardDialog));
const FuelRechargeDialog = dynamic(() => import("@/components/fleet/fuel-forms").then(mod => mod.FuelRechargeDialog));
const FuelExpenseDialog = dynamic(() => import("@/components/fleet/fuel-forms").then(mod => mod.FuelExpenseDialog));
const FuelMissionReport = dynamic(() => import("@/components/fleet/fuel-mission-report").then(mod => mod.FuelMissionReport));

import { FuelProviderList } from "@/components/fleet/fuel-provider-list";
import { FuelCardList } from "@/components/fleet/fuel-card-list";
import { FuelTransactionList } from "@/components/fleet/fuel-transaction-list";

// Types
import { FuelProvider, FuelCard, FuelTransaction } from "@/types/fuel";

export default function FuelManagementPage() {
    const [providers, setProviders] = useState<FuelProvider[]>([]);
    const [cards, setCards] = useState<FuelCard[]>([]);
    const [transactions, setTransactions] = useState<FuelTransaction[]>([]);
    const [employees, setEmployees] = useState<Employe[]>([]);
    const [vehicles, setVehicles] = useState<Fleet[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    // Dialog/Form States
    const [isProviderDialogOpen, setIsProviderDialogOpen] = useState(false);
    const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
    const [isRechargeDialogOpen, setIsRechargeDialogOpen] = useState(false);
    const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<FuelProvider | null>(null);
    const [selectedCardForEdit, setSelectedCardForEdit] = useState<FuelCard | null>(null);

    const [selectedCard, setSelectedCard] = useState<FuelCard | null>(null);

    const { user } = useAuth();
    
    // Permission checks (Super-Admin always has all rights)
    const canCreate = user?.roleId === 'super-admin' || user?.roleId === 'LHcHyfBzile3r0vyFOFb' || user?.resourcePermissions?.fuel?.create;
    const canUpdate = user?.roleId === 'super-admin' || user?.roleId === 'LHcHyfBzile3r0vyFOFb' || user?.resourcePermissions?.fuel?.update;
    const canDelete = user?.roleId === 'super-admin' || user?.roleId === 'LHcHyfBzile3r0vyFOFb' || user?.resourcePermissions?.fuel?.delete;

    useEffect(() => {
        let unsubProviders = () => {};
        let unsubCards = () => {};
        let unsubTrans = () => {};
        let unsubEmployees = () => {};
        let unsubVehicles = () => {};

        // Stagger subscriptions to avoid main thread blocking
        const timers: NodeJS.Timeout[] = [];

        timers.push(setTimeout(() => {
            unsubProviders = subscribeToFuelProviders(setProviders, (err) => {
                console.error(err);
                toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les prestataires." });
            });
        }, 0));

        timers.push(setTimeout(() => {
            unsubCards = subscribeToFuelCards(setCards, (err) => {
                console.error(err);
                toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les cartes." });
            });
        }, 50));

        timers.push(setTimeout(() => {
            unsubTrans = subscribeToFuelTransactions(setTransactions, (err) => {
                console.error(err);
                toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les transactions." });
            });
        }, 100));

        timers.push(setTimeout(() => {
            unsubEmployees = subscribeToEmployees(setEmployees, (err) => {
                console.error(err);
                toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les employés." });
            });
        }, 150));

        timers.push(setTimeout(() => {
            unsubVehicles = subscribeToVehicles(setVehicles, (err) => {
                console.error(err);
                toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les véhicules." });
            });
        }, 200));

        const loadingTimer = setTimeout(() => setLoading(false), 800);

        return () => {
            unsubProviders();
            unsubCards();
            unsubTrans();
            unsubEmployees();
            unsubVehicles();
            timers.forEach(clearTimeout);
            clearTimeout(loadingTimer);
        };
    }, []);

    const stats = useMemo(() => {
        const totalBudget = transactions.filter(t => t.type === 'recharge').reduce((acc, t) => acc + (t.amount || 0), 0);
        const totalSpent = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + (t.amount || 0), 0);
        const currentBalance = cards.reduce((acc, c) => acc + (c.currentBalance || 0), 0);

        return { totalBudget, totalSpent, currentBalance };
    }, [transactions, cards]);

    const handleDeleteTransaction = async (id: string) => {
        if (!confirm("Voulez-vous vraiment supprimer cette transaction ? Le solde de la carte sera rétabli.")) return;
        try {
            await deleteFuelTransaction(id);
            toast({ title: "Succès", description: "Transaction supprimée et solde mis à jour." });
        } catch (err) {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer la transaction." });
        }
    };

    const handleDeleteProvider = async (id: string) => {
        if (!confirm("Voulez-vous vraiment supprimer ce prestataire ?")) return;
        try {
            await deleteFuelProvider(id);
            toast({ title: "Succès", description: "Prestataire supprimé." });
        } catch (err) {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer le prestataire." });
        }
    };

    const handleDeleteCard = async (id: string) => {
        if (!confirm("Voulez-vous vraiment supprimer cette carte ?")) return;
        try {
            await deleteFuelCard(id);
            toast({ title: "Succès", description: "Carte supprimée." });
        } catch (err) {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer la carte." });
        }
    };

    const handleEditProvider = (provider: FuelProvider) => {
        setSelectedProvider(provider);
        setIsProviderDialogOpen(true);
    };

    const handleEditCard = (card: FuelCard) => {
        setSelectedCardForEdit(card);
        setIsCardDialogOpen(true);
    };

    if (loading) {
        return (
            <div className="p-6 space-y-6">
                <Skeleton className="h-10 w-1/3" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
                <Skeleton className="h-[400px]" />
            </div>
        );
    }

    return (
        <PermissionGuard permission="page:fuel:view">
        <div className="flex flex-col gap-10 pb-12">
            {/* Institutional Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="h-14 w-1 flex-shrink-0 bg-slate-900 rounded-full" />
                        <div>
                            <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900">
                                Gestion Carburant
                            </h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1 pl-1">
                                Surveillance des Flux Énergétiques et Dotations
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 pl-4">
                        <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Flux financiers en temps réel</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-white/10 shadow-2xl bg-slate-900 text-white overflow-hidden relative group transition-all duration-500 hover:scale-[1.02] rounded-[2.5rem]">
                    <CardHeader className="p-8 relative z-10">
                        <CardDescription className="text-slate-400 font-black uppercase text-[9px] tracking-[0.2em]">Budget Recharge Cumulé</CardDescription>
                        <CardTitle className="text-4xl font-black mt-2">{stats.totalBudget.toLocaleString()} <span className="text-sm font-bold text-slate-400">FCFA</span></CardTitle>
                    </CardHeader>
                    <div className="absolute -bottom-6 -right-6 opacity-10 group-hover:opacity-20 transition-all duration-700 pointer-events-none group-hover:rotate-0 group-hover:scale-110">
                        <PlusCircle className="h-32 w-32 -rotate-12" />
                    </div>
                </Card>

                <Card className="border-white/10 shadow-xl bg-card/40 backdrop-blur-md overflow-hidden relative group transition-all duration-500 hover:scale-[1.02] rounded-[2.5rem]">
                    <CardHeader className="p-8 relative z-10">
                        <CardDescription className="text-slate-500 font-black uppercase text-[9px] tracking-[0.2em]">Solde Disponible (Cartes)</CardDescription>
                        <CardTitle className="text-4xl font-black mt-2 text-slate-900">{stats.currentBalance.toLocaleString()} <span className="text-sm font-bold text-slate-400">FCFA</span></CardTitle>
                    </CardHeader>
                    <div className="absolute -bottom-6 -right-6 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-700 pointer-events-none">
                        <CreditCard className="h-32 w-32" />
                    </div>
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
                </Card>

                <Card className="border-white/10 shadow-xl bg-card/40 backdrop-blur-md overflow-hidden relative group transition-all duration-500 hover:scale-[1.02] rounded-[2.5rem]">
                    <CardHeader className="p-8 relative z-10">
                        <CardDescription className="text-slate-500 font-black uppercase text-[9px] tracking-[0.2em]">Consommation Totale</CardDescription>
                        <CardTitle className="text-4xl font-black mt-2 text-blue-600">{stats.totalSpent.toLocaleString()} <span className="text-sm font-bold text-slate-400">FCFA</span></CardTitle>
                    </CardHeader>
                    <div className="absolute -bottom-6 -right-6 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-700 pointer-events-none">
                        <Fuel className="h-32 w-32" />
                    </div>
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
                </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-8">
                <TabsList className="bg-transparent border-b border-border/50 rounded-none w-full justify-start h-auto p-0 gap-8">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-slate-900 data-[state=active]:shadow-none rounded-none py-4 px-0 h-auto font-black uppercase text-[11px] tracking-widest text-slate-400 data-[state=active]:text-slate-900 transition-all">
                        <LayoutDashboard className="h-4 w-4 mr-2" /> Vue d&apos;ensemble
                    </TabsTrigger>
                    <TabsTrigger value="providers" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-slate-900 data-[state=active]:shadow-none rounded-none py-4 px-0 h-auto font-black uppercase text-[11px] tracking-widest text-slate-400 data-[state=active]:text-slate-900 transition-all">
                        <Building2 className="h-4 w-4 mr-2" /> Prestataires
                    </TabsTrigger>
                    <TabsTrigger value="cards" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-slate-900 data-[state=active]:shadow-none rounded-none py-4 px-0 h-auto font-black uppercase text-[11px] tracking-widest text-slate-400 data-[state=active]:text-slate-900 transition-all">
                        <CreditCard className="h-4 w-4 mr-2" /> Cartes
                    </TabsTrigger>
                    <TabsTrigger value="history" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-slate-900 data-[state=active]:shadow-none rounded-none py-4 px-0 h-auto font-black uppercase text-[11px] tracking-widest text-slate-400 data-[state=active]:text-slate-900 transition-all">
                        <History className="h-4 w-4 mr-2" /> Transactions
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-8 outline-none">
                    <Card className="border-white/10 shadow-2xl bg-card/40 backdrop-blur-md overflow-hidden rounded-[2.5rem] px-2">
                        <CardHeader className="border-b border-border/50 bg-primary/5 py-8 px-8 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl font-black uppercase tracking-tight text-slate-900">Activités Récentes</CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Flux financiers et consommation des 30 derniers jours</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <FuelTransactionList transactions={transactions.slice(0, 10)} cards={cards} onDelete={canDelete ? handleDeleteTransaction : undefined} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="providers" className="outline-none">
                    <Card className="border-white/10 shadow-2xl bg-card/40 backdrop-blur-md overflow-hidden rounded-[2.5rem] px-2">
                        <CardHeader className="border-b border-border/50 bg-primary/5 py-8 px-8 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl font-black uppercase tracking-tight text-slate-900">Registre des Prestataires</CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Total: {providers.length} entités certifiées</CardDescription>
                            </div>
                            {canCreate && (
                                <Button className="h-12 px-6 rounded-xl bg-slate-900 shadow-lg shadow-slate-900/20 font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all text-white" onClick={() => {
                                    setSelectedProvider(null);
                                    setIsProviderDialogOpen(true);
                                }}>
                                    <Plus className="h-4 w-4 mr-2 text-emerald-400" /> Nouveau Prestataire
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="p-0">
                            <FuelProviderList providers={providers} onDelete={canDelete ? handleDeleteProvider : undefined} onEdit={canUpdate ? handleEditProvider : undefined} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="cards" className="outline-none">
                    <Card className="border-white/10 shadow-2xl bg-card/40 backdrop-blur-md overflow-hidden rounded-[2.5rem] px-2">
                        <CardHeader className="border-b border-border/50 bg-primary/5 py-8 px-8 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl font-black uppercase tracking-tight text-slate-900">Gestion des Dotations</CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Cartes affectées aux véhicules ou au personnel</CardDescription>
                            </div>
                            {canCreate && (
                                <Button className="h-12 px-6 rounded-xl bg-slate-900 shadow-lg shadow-slate-900/20 font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all text-white" onClick={() => {
                                    setSelectedCardForEdit(null);
                                    setIsCardDialogOpen(true);
                                }}>
                                    <Plus className="h-4 w-4 mr-2 text-emerald-400" /> Nouvelle Carte
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="p-0">
                            <FuelCardList
                                cards={cards}
                                providers={providers}
                                employees={employees}
                                vehicles={vehicles}
                                onDelete={canDelete ? handleDeleteCard : undefined}
                                onEdit={canUpdate ? handleEditCard : undefined}
                                onRecharge={canCreate ? (card) => {
                                    setSelectedCard(card);
                                    setIsRechargeDialogOpen(true);
                                } : undefined}
                                onPrint={(card) => {
                                    setSelectedCard(card);
                                    setIsReportDialogOpen(true);
                                }}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="outline-none">
                    <Card className="border-white/10 shadow-2xl bg-card/40 backdrop-blur-md overflow-hidden rounded-[2.5rem] px-2">
                        <CardHeader className="border-b border-border/50 bg-primary/5 py-8 px-8 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl font-black uppercase tracking-tight text-slate-900">Historique Transactionnel</CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Rechargements et consommations consolidés</CardDescription>
                            </div>
                            <div className="flex gap-3">
                                {canCreate && (
                                    <>
                                        <Button variant="outline" className="h-12 px-6 rounded-xl border-emerald-200 bg-emerald-50/50 backdrop-blur-md font-black uppercase tracking-widest text-[10px] text-emerald-700 hover:bg-emerald-50 transition-all" onClick={() => setIsRechargeDialogOpen(true)}>
                                            <PlusCircle className="h-4 w-4 mr-2" /> Recharger
                                        </Button>
                                        <Button className="h-12 px-6 rounded-xl bg-slate-900 shadow-lg shadow-slate-900/20 font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all text-white" onClick={() => setIsExpenseDialogOpen(true)}>
                                            <Plus className="h-4 w-4 mr-2 text-blue-400" /> Enregistrer un plein
                                        </Button>
                                    </>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <FuelTransactionList transactions={transactions} cards={cards} onDelete={canDelete ? handleDeleteTransaction : undefined} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Dialogs */}
            <FuelProviderDialog
                open={isProviderDialogOpen}
                onOpenChangeAction={setIsProviderDialogOpen}
                provider={selectedProvider}
            />
            <FuelCardDialog
                open={isCardDialogOpen}
                onOpenChangeAction={setIsCardDialogOpen}
                providers={providers}
                employees={employees}
                vehicles={vehicles}
                card={selectedCardForEdit}
            />
            <FuelRechargeDialog
                open={isRechargeDialogOpen}
                onOpenChangeAction={setIsRechargeDialogOpen}
                cards={cards}
                defaultCardId={selectedCard?.id}
            />
            <FuelExpenseDialog
                open={isExpenseDialogOpen}
                onOpenChangeAction={setIsExpenseDialogOpen}
                cards={cards}
                employees={employees}
                vehicles={vehicles}
            />

            {selectedCard && (
                <FuelMissionReport
                    open={isReportDialogOpen}
                    onOpenChange={setIsReportDialogOpen}
                    card={selectedCard}
                    transactions={transactions}
                    providerName={providers.find(p => p.id === selectedCard.providerId)?.name}
                    month={new Date().getMonth()}
                    year={new Date().getFullYear()}
                />
            )}
        </div>
        </PermissionGuard>
    );
}
