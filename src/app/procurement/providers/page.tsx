"use client";

import { useState, useEffect, useMemo } from "react";
import { 
    Users, Search, Filter, Mail, Phone, MapPin, 
    MoreVertical, Edit, Trash2, Building2, ExternalLink,
    ChevronRight, ArrowLeft, LayoutGrid, List
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { subscribeToProviders, deleteProvider } from "@/services/procurement-service";
import type { Provider } from "@/lib/data";
import { AddProviderSheet } from "@/components/procurement/add-provider-sheet";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { PermissionGuard } from "@/components/auth/permission-guard";

const categoryColors: Record<string, string> = {
    "Travaux": "bg-blue-100 text-blue-700 border-blue-200",
    "Fournitures": "bg-emerald-100 text-emerald-700 border-emerald-200",
    "Services": "bg-amber-100 text-amber-700 border-amber-200",
    "Prestations Intellectuelles": "bg-purple-100 text-purple-700 border-purple-200",
};

export default function ProvidersPage() {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [search, setSearch] = useState("");
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        return subscribeToProviders((data) => {
            setProviders(data);
            setLoading(false);
        }, console.error);
    }, []);

    const filteredProviders = useMemo(() => {
        return providers.filter(p => 
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.rccm.toLowerCase().includes(search.toLowerCase()) ||
            (p.idu && p.idu.toLowerCase().includes(search.toLowerCase())) ||
            (p.enterpriseType && p.enterpriseType.toLowerCase().includes(search.toLowerCase())) ||
            p.category.toLowerCase().includes(search.toLowerCase())
        );
    }, [providers, search]);

    const handleDelete = async (id: string) => {
        if (confirm("Êtes-vous sûr de vouloir supprimer ce prestataire ?")) {
            try {
                await deleteProvider(id);
                toast.success("Prestataire supprimé");
            } catch (error) {
                toast.error("Erreur lors de la suppression");
            }
        }
    };

    return (
        <PermissionGuard permission="page:procurement:view">
            <div className="container mx-auto py-10 px-4 md:px-6">
                <div className="flex flex-col gap-6">
                    {/* Breadcrumbs / Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                <Link href="/procurement" className="hover:text-primary flex items-center gap-1">
                                    <ArrowLeft className="h-3 w-3" /> Retour au Dashboard
                                </Link>
                                <ChevronRight className="h-3 w-3" />
                                <span className="text-xs font-bold uppercase tracking-wider text-primary">Répertoire</span>
                            </div>
                            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 italic">
                                <Users className="h-8 w-8 text-primary" /> Annuaire des Prestataires
                            </h1>
                        </div>
                        <AddProviderSheet />
                    </div>

                    {/* Filters & View Toggle */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white/20 shadow-sm">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Rechercher par nom, RCCM ou catégorie..." 
                                className="pl-10 rounded-xl bg-white border-slate-200"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button 
                                variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                                size="icon" 
                                onClick={() => setViewMode('grid')}
                                className="rounded-lg h-10 w-10"
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                            <Button 
                                variant={viewMode === 'list' ? 'default' : 'ghost'} 
                                size="icon" 
                                onClick={() => setViewMode('list')}
                                className="rounded-lg h-10 w-10"
                            >
                                <List className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="h-48 bg-slate-100 rounded-2xl border border-slate-200" />
                            ))}
                        </div>
                    ) : (
                        <div className={viewMode === 'grid' 
                            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                            : "flex flex-col gap-4"
                        }>
                            {filteredProviders.map(provider => (
                                <Card key={provider.id} className="group relative overflow-hidden border-white/40 shadow-xl bg-white/70 backdrop-blur-md transition-all hover:shadow-2xl hover:-translate-y-1 rounded-2xl">
                                    <div className={`absolute top-0 left-0 w-1.5 h-full ${categoryColors[provider.category]?.split(' ')[0] || 'bg-slate-200'}`} />
                                    <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className={`w-fit text-[9px] uppercase tracking-tighter ${categoryColors[provider.category]}`}>
                                                    {provider.category}
                                                </Badge>
                                                {provider.enterpriseType && (
                                                    <Badge variant="secondary" className="w-fit text-[9px] uppercase tracking-tighter bg-slate-100 text-slate-600 border-slate-200">
                                                        {provider.enterpriseType}
                                                    </Badge>
                                                )}
                                            </div>
                                            <CardTitle className="text-xl font-black group-hover:text-primary transition-colors">{provider.name}</CardTitle>
                                            <div className="flex flex-col gap-0.5">
                                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">RCCM: {provider.rccm}</CardDescription>
                                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-primary/70">IDU: {provider.idu || 'N/A'}</CardDescription>
                                            </div>
                                        </div>
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
                                                    onClick={() => handleDelete(provider.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" /> Supprimer
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pt-0">
                                        <div className="grid grid-cols-1 gap-2">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Mail className="h-3.5 w-3.5 text-slate-400" />
                                                <span className="truncate">{provider.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Phone className="h-3.5 w-3.5 text-slate-400" />
                                                <span>{provider.phone}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                <MapPin className="h-3.5 w-3.5 shrink-0" />
                                                <span className="line-clamp-1">{provider.address}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 pt-2 border-t border-slate-100">
                                                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                                <span>Contact: {provider.contactPerson}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {filteredProviders.length === 0 && !loading && (
                                <div className="col-span-full py-20 text-center flex flex-col items-center justify-center gap-4 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                                    <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
                                        <Search className="h-8 w-8 text-slate-300" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold text-slate-900">Aucun prestataire trouvé</p>
                                        <p className="text-slate-400">Essayez de modifier votre recherche ou ajoutez un nouveau prestataire.</p>
                                    </div>
                                    <AddProviderSheet />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </PermissionGuard>
    );
}
