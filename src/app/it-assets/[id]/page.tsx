"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    ChevronLeft, Pencil, Laptop, 
    Monitor, Printer, Keyboard, 
    Mouse, FileCode, Package, 
    Server, QrCode, Tag, 
    User, Calendar, Info,
    History, Settings, Shield,
    Cpu, HardDrive, Network
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { getAsset } from "@/services/asset-service";
import type { Asset } from "@/lib/data";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const assetIcons: Record<string, React.ElementType> = {
    "Ordinateur": Laptop,
    "Moniteur": Monitor,
    "Imprimante": Printer,
    "Clavier": Keyboard,
    "Souris": Mouse,
    "Logiciel": FileCode,
    "Équipement Réseau": Server,
    "Autre": Package,
};

export default function AssetDetailPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const [asset, setAsset] = useState<Asset | null>(null);
    const [loading, setLoading] = useState(true);
    const { hasPermission } = useAuth();

    const canEdit = hasPermission('page:it-assets:view'); // Based on current perms in page.tsx

    useEffect(() => {
        async function fetchAsset() {
            try {
                const data = await getAsset(id);
                if (data) {
                    setAsset(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchAsset();
    }, [id]);

    if (loading) {
        return (
            <div className="container mx-auto py-8 space-y-8">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                        <Skeleton className="h-40 w-full" />
                        <Skeleton className="h-80 w-full" />
                    </div>
                    <Skeleton className="h-[500px] w-full" />
                </div>
            </div>
        );
    }

    if (!asset) {
        return (
            <div className="container mx-auto py-20 text-center">
                <h1 className="text-2xl font-bold">Actif non trouvé</h1>
                <Button variant="link" onClick={() => router.push("/it-assets")}>
                    Retour à l'inventaire
                </Button>
            </div>
        );
    }

    const Icon = assetIcons[asset.type] || Package;

    const statusColors = {
        'En utilisation': 'bg-emerald-100 text-emerald-800 border-emerald-200',
        'En stock': 'bg-blue-100 text-blue-800 border-blue-200',
        'En réparation': 'bg-amber-100 text-amber-800 border-amber-200',
        'Retiré': 'bg-slate-100 text-slate-800 border-slate-200',
    };

    return (
        <div className="container mx-auto py-8 space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.push("/it-assets")} className="rounded-full h-10 w-10">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-extrabold tracking-tight">{asset.modele}</h1>
                            <Badge className={cn("rounded-full px-4 py-1 border shadow-none", statusColors[asset.status as keyof typeof statusColors])}>
                                {asset.status}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground mt-1 flex items-center gap-2">
                            <Tag className="h-4 w-4" /> N° Inventaire: {asset.tag} • {asset.fabricant}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" className="rounded-lg h-10">
                        <QrCode className="mr-2 h-4 w-4" /> Étiquette
                    </Button>
                    {canEdit && (
                        <Button onClick={() => router.push(`/it-assets/${asset.tag}/edit`)} className="bg-slate-900 rounded-lg h-10 text-white hover:bg-slate-800">
                            <Pencil className="mr-2 h-4 w-4" /> Modifier l'actif
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Key Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-none shadow-sm bg-blue-50/50">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="h-12 w-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                                    <Icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Type</p>
                                    <p className="text-sm font-bold">{asset.type}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm bg-purple-50/50">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="h-12 w-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600">
                                    <User className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">Assigné à</p>
                                    <p className="text-sm font-bold">{asset.assignedTo || "En stock"}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm bg-emerald-50/50">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="h-12 w-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                                    <Network className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Adresse IP</p>
                                    <p className="text-sm font-bold font-mono">{asset.ipAddress || "Statique"}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs defaultValue="specs" className="w-full">
                        <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 gap-8">
                            <TabsTrigger value="specs" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none py-4 px-0 h-auto">
                                <Info className="h-4 w-4 mr-2" /> Spécifications
                            </TabsTrigger>
                            <TabsTrigger value="history" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none py-4 px-0 h-auto">
                                <History className="h-4 w-4 mr-2" /> Historique
                            </TabsTrigger>
                            <TabsTrigger value="settings" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none py-4 px-0 h-auto">
                                <Settings className="h-4 w-4 mr-2" /> Configuration
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="specs" className="py-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="border-none shadow-sm bg-slate-50">
                                    <CardHeader>
                                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                                            <Cpu className="h-4 w-4 text-primary" /> Identifiants Matériels
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex justify-between border-b pb-2">
                                            <span className="text-sm text-muted-foreground">N° de Série</span>
                                            <span className="text-sm font-medium font-mono">{asset.numeroDeSerie || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between border-b pb-2">
                                            <span className="text-sm text-muted-foreground">Fabricant</span>
                                            <span className="text-sm font-medium">{asset.fabricant}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Modèle</span>
                                            <span className="text-sm font-medium">{asset.modele}</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-sm bg-slate-50">
                                    <CardHeader>
                                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                                            <HardDrive className="h-4 w-4 text-primary" /> Détails Techniques
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex justify-between border-b pb-2">
                                            <span className="text-sm text-muted-foreground">N° Inventaire</span>
                                            <span className="text-sm font-medium font-mono">{asset.tag}</span>
                                        </div>
                                        <div className="flex justify-between border-b pb-2">
                                            <span className="text-sm text-muted-foreground">Catégorie</span>
                                            <span className="text-sm font-medium">{asset.type}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Sous-type</span>
                                            <span className="text-sm font-medium">{asset.typeOrdinateur || "Global"}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="border-none shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg">Notes & Commentaires</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-slate-600 leading-relaxed italic">
                                        "Cet actif a été assigné le {new Date().toLocaleDateString('fr-FR')} suite à une nouvelle demande d'équipement. 
                                        L'état général est bon, aucune réparation majeure signalée sur ce poste."
                                    </p>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="history" className="py-6">
                            <div className="space-y-8 relative before:absolute before:inset-0 before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
                                <div className="flex items-start gap-6 relative z-10">
                                    <div className="h-6 w-6 rounded-full bg-emerald-500 border-4 border-white shadow-sm ring-1 ring-slate-100 flex items-center justify-center">
                                        <CheckCircle2 className="h-4 w-4 text-white p-0.5" />
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border shadow-sm flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="font-bold text-sm">Assignation à {asset.assignedTo}</p>
                                            <span className="text-[10px] text-muted-foreground">Il y a 2 mois</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Modification du statut : En stock → En utilisation</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-6 relative z-10">
                                    <div className="h-6 w-6 rounded-full bg-slate-300 border-4 border-white shadow-sm ring-1 ring-slate-100 flex items-center justify-center">
                                        <Info className="h-3 w-3 text-slate-500" />
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border shadow-sm flex-1 opacity-60">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="font-bold text-sm">Inventaire Initial</p>
                                            <span className="text-[10px] text-muted-foreground">Il y a 1 an</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Entrée de l'actif dans la base de données par l'administration IT.</p>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="settings" className="py-6 space-y-6">
                             <Card className="border-none shadow-sm bg-amber-50/50">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-amber-600" /> Accès & Sécurité
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center bg-white p-3 rounded-lg border">
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground">Mot de passe de session</p>
                                            <p className="font-mono text-sm">••••••••</p>
                                        </div>
                                        <Button variant="ghost" size="sm" className="text-primary h-8">Afficher</Button>
                                    </div>
                                    <div className="flex justify-between items-center bg-white p-3 rounded-lg border">
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground">Propriétaire du domaine</p>
                                            <p className="text-sm">CNRCT\AD_ADMIN</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card className="border-none shadow-lg overflow-hidden bg-slate-900 text-white">
                        <div className="h-2 bg-blue-500 w-full" />
                        <CardHeader>
                            <CardTitle className="text-lg">Résumé de l'actif</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col items-center py-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                                <Icon className="h-16 w-16 text-blue-400 mb-4" />
                                <h3 className="text-xl font-bold">{asset.tag}</h3>
                                <p className="text-slate-400 text-xs italic">Identifiant unique CNRCT</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">Assigné le</p>
                                    <p className="text-sm font-medium">12/01/2024</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">Garantie</p>
                                    <p className="text-sm font-medium text-emerald-400">Valide</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-800 space-y-2">
                                <Button variant="ghost" className="w-full justify-between h-10 px-0 text-slate-400 hover:text-white" onClick={() => router.push(`/employees/${asset.assignedTo}`)}>
                                    <span className="flex items-center gap-2">
                                        <User className="h-4 w-4" /> Profil de l'utilisateur
                                    </span>
                                    <ChevronLeft className="h-4 w-4 rotate-180" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="bg-slate-50 border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4">
                        <QrCode className="h-10 w-10 text-slate-300" />
                        <div>
                            <p className="font-bold text-sm">Générer Code QR</p>
                            <p className="text-[11px] text-muted-foreground">Créez un code QR pour l'étiquetage physique de cet actif.</p>
                        </div>
                        <Button variant="outline" size="sm" className="w-full mt-2">
                            Aperçu & Impression
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
