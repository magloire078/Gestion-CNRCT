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
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestion des Cartes Carburant</h1>
                    <p className="text-muted-foreground mt-1">
                        Suivi des prestataires, dotations budgétaires et consommation de la flotte.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-muted p-1">
                    <TabsTrigger value="overview" className="gap-2">
                        <LayoutDashboard className="h-4 w-4" /> Vue d&apos;ensemble
                    </TabsTrigger>
                    <TabsTrigger value="providers" className="gap-2">
                        <Building2 className="h-4 w-4" /> Prestataires
                    </TabsTrigger>
                    <TabsTrigger value="cards" className="gap-2">
                        <CreditCard className="h-4 w-4" /> Cartes
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2">
                        <History className="h-4 w-4" /> Transactions
                    </TabsTrigger>
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="space-y-6 outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-100 dark:border-blue-900/20">
                            <CardHeader className="pb-2">
                                <CardDescription className="text-blue-600 font-medium">Budget Recharge Cumulé</CardDescription>
                                <CardTitle className="text-3xl font-bold">{stats.totalBudget.toLocaleString()} FCFA</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 text-xs text-blue-600/80">
                                    <PlusCircle className="h-3 w-3" />
                                    <span>Total des dotations reçues</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-100 dark:border-emerald-900/20">
                            <CardHeader className="pb-2">
                                <CardDescription className="text-emerald-600 font-medium">Solde Disponible (Cartes)</CardDescription>
                                <CardTitle className="text-3xl font-bold">{stats.currentBalance.toLocaleString()} FCFA</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 text-xs text-emerald-600/80">
                                    <CreditCard className="h-3 w-3" />
                                    <span>Encours total sur les cartes</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-100 dark:border-amber-900/20">
                            <CardHeader className="pb-2">
                                <CardDescription className="text-amber-600 font-medium">Consommation Totale</CardDescription>
                                <CardTitle className="text-3xl font-bold">{stats.totalSpent.toLocaleString()} FCFA</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 text-xs text-amber-600/80">
                                    <Fuel className="h-3 w-3" />
                                    <span>Total dépensé par les utilisateurs</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Activités Récentes</CardTitle>
                            <CardDescription>Flux financiers et consommation des 30 derniers jours.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FuelTransactionList transactions={transactions.slice(0, 10)} cards={cards} onDelete={canDelete ? handleDeleteTransaction : undefined} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* PROVIDERS TAB */}
                <TabsContent value="providers" className="outline-none">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardTitle>Liste des Prestataires</CardTitle>
                                <CardDescription>Entreprises fournissant les services de carburant (Total: {providers.length})</CardDescription>
                            </div>
                            {canCreate && (
                                <Button className="gap-2" onClick={() => {
                                    setSelectedProvider(null);
                                    setIsProviderDialogOpen(true);
                                }}>
                                    <Plus className="h-4 w-4" /> Nouveau Prestataire
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            <FuelProviderList providers={providers} onDelete={canDelete ? handleDeleteProvider : undefined} onEdit={canUpdate ? handleEditProvider : undefined} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* CARDS TAB */}
                <TabsContent value="cards" className="outline-none">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardTitle>Gestion des Cartes Carburant</CardTitle>
                                <CardDescription>Cartes affectées aux véhicules ou au personnel.</CardDescription>
                            </div>
                            {canCreate && (
                                <Button className="gap-2" onClick={() => {
                                    setSelectedCardForEdit(null);
                                    setIsCardDialogOpen(true);
                                }}>
                                    <Plus className="h-4 w-4" /> Nouvelle Carte
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
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

                {/* HISTORY TAB */}
                <TabsContent value="history" className="outline-none">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardTitle>Historique Complet</CardTitle>
                                <CardDescription>Toutes les transactions de rechargement et de consommation.</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                {canCreate && (
                                    <>
                                        <Button variant="outline" className="gap-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50" onClick={() => setIsRechargeDialogOpen(true)}>
                                            <PlusCircle className="h-4 w-4" /> Recharger
                                        </Button>
                                        <Button className="gap-2" onClick={() => setIsExpenseDialogOpen(true)}>
                                            <Plus className="h-4 w-4" /> Enregistrer un plein
                                        </Button>
                                    </>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
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
