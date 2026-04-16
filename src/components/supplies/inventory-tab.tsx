"use client";

import React, { memo } from "react";
import { 
  Package, 
  Search, 
  Filter, 
  Archive, 
  AlertTriangle,
  Zap,
  BarChart3
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { Supply } from "@/types/supply";
import { SupplyCategory } from "@/services/supply-category-service";
import { PaginationControls } from "@/components/common/pagination-controls";
import { InventoryFilters } from "./inventory-filters";

interface InventoryTabProps {
    loading: boolean;
    error: string | null;
    filteredSupplies: Supply[];
    paginatedSupplies: Supply[];
    stats: any;
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    categoryFilter: string;
    searchTerm: string;
    viewMode: 'table' | 'grid';
    availableCategories: SupplyCategory[];
    isPending: boolean;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (n: number) => void;
    onCategoryFilterChange: (val: string) => void;
    onSearchChange: (val: string) => void;
    // Render functions to keep components in parent scope for now or passed down
    renderSupplyRow: (item: Supply, index: number) => React.ReactNode;
    renderSupplyCard: (item: Supply) => React.ReactNode;
}

export const InventoryTab = memo(({
    loading,
    error,
    filteredSupplies,
    paginatedSupplies,
    stats,
    currentPage,
    totalPages,
    itemsPerPage,
    categoryFilter,
    searchTerm,
    viewMode,
    availableCategories,
    isPending,
    onPageChange,
    onItemsPerPageChange,
    onCategoryFilterChange,
    onSearchChange,
    renderSupplyRow,
    renderSupplyCard
}: InventoryTabProps) => {
    return (
        <div className={cn("space-y-6 transition-opacity duration-300", isPending && "opacity-60 pointer-events-none", "contain-layout")}>
            {/* --- Statistical Dashboard --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="border-white/10 shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative group transition-[transform,shadow] duration-200 hover:shadow-2xl hover:-translate-y-1">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                            <Package className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Articles</span>
                            <span className="text-xl font-black">{stats.total}</span>
                        </div>
                    </CardContent>
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Archive className="h-10 w-10 rotate-12" />
                    </div>
                </Card>
                
                <Card className="border-white/10 shadow-xl bg-card/40 backdrop-blur-md overflow-hidden relative group transition-[transform,shadow] duration-200 hover:shadow-2xl hover:-translate-y-1 border-l-4 border-l-red-500">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                            stats.outOfStock > 0 ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-300"
                        )}>
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">En Rupture</span>
                            <span className={cn("text-xl font-black", stats.outOfStock > 0 ? "text-red-600" : "text-slate-900")}>
                                {stats.outOfStock}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-white/10 shadow-xl bg-card/40 backdrop-blur-md overflow-hidden relative group transition-[transform,shadow] duration-200 hover:shadow-2xl hover:-translate-y-1 border-l-4 border-l-amber-500">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                            stats.lowStock > 0 ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-300"
                        )}>
                            <Zap className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Stock Critique</span>
                            <span className={cn("text-xl font-black", stats.lowStock > 0 ? "text-amber-600" : "text-slate-900")}>
                                {stats.lowStock}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-white/10 shadow-xl bg-card/40 backdrop-blur-md overflow-hidden relative group transition-[transform,shadow] duration-200 hover:shadow-2xl hover:-translate-y-1 border-l-4 border-l-emerald-500">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                            <BarChart3 className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Santé Globale</span>
                            <span className="text-xl font-black text-emerald-600">{Math.round(stats.avgHealth)}%</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0 pt-0 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                {categoryFilter !== 'all' ? categoryFilter : 'Inventaire Complet'}
                            </CardTitle>
                            <CardDescription>
                                {filteredSupplies.length} article(s) trouvé(s)
                            </CardDescription>
                        </div>
                        <InventoryFilters 
                            searchTerm={searchTerm}
                            onSearchChange={onSearchChange}
                            categoryFilter={categoryFilter}
                            onCategoryFilterChange={onCategoryFilterChange}
                            availableCategories={availableCategories}
                        />
                    </div>
                </CardHeader>
                <CardContent className="pt-6 px-0">
                    {error && <div className="p-8 text-center text-red-500 font-bold">{error}</div>}
                    
                    {viewMode === 'table' ? (
                        <div className="rounded-xl border border-slate-100 overflow-hidden bg-white">
                            <Table>
                                <TableHeader className="bg-slate-50/80">
                                <TableRow className="border-slate-100 hover:bg-transparent">
                                    <TableHead className="py-4 pl-6 font-bold text-slate-700 uppercase tracking-wider text-[11px]">Ordre</TableHead>
                                    <TableHead className="py-4 font-bold text-slate-700 uppercase tracking-wider text-[11px]">Code</TableHead>
                                    <TableHead className="py-4 font-bold text-slate-700 uppercase tracking-wider text-[11px]">Désignation</TableHead>
                                    <TableHead className="py-4 font-bold text-slate-700 uppercase tracking-wider text-[11px]">Catégorie</TableHead>
                                    <TableHead className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Stock</TableHead>
                                    <TableHead className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Seuil Alerte</TableHead>
                                    <TableHead className="w-[180px] text-[10px] font-bold uppercase tracking-widest text-slate-400">Santé du Stock</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                                </TableHeader>
                                <TableBody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-4 mx-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-3 w-full rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                    </TableRow>
                                    ))
                                ) : paginatedSupplies.length > 0 ? (
                                    paginatedSupplies.map((item, index) => renderSupplyRow(item, index))
                                ) : null}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <Card key={i} className="rounded-2xl border-slate-100"><CardContent className="p-6"><Skeleton className="h-40 w-full rounded-xl" /></CardContent></Card>
                                ))
                            ) : paginatedSupplies.map((supply) => renderSupplyCard(supply))}
                        </div>
                    )}

                    {!loading && filteredSupplies.length === 0 && (
                        <div className="text-center py-32 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                            <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200 shadow-inner">
                                <Archive className="h-10 w-10 text-slate-300" />
                            </div>
                            <p className="font-black text-slate-500 uppercase tracking-widest">Aucun article trouvé</p>
                            <p className="text-sm text-slate-400 max-w-[300px] mx-auto mt-2 italic">Ajustez vos filtres ou effectuez une recherche plus précise.</p>
                        </div>
                    )}
                </CardContent>
                {totalPages > 1 && (
                    <CardFooter className="bg-white/50 border-t border-slate-100 px-6 py-4 rounded-b-xl mt-4">
                        <PaginationControls
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={onPageChange}
                            itemsPerPage={itemsPerPage}
                            onItemsPerPageChange={onItemsPerPageChange}
                            totalItems={filteredSupplies.length}
                            isPending={isPending}
                        />
                    </CardFooter>
                )}
            </Card>
        </div>
    );
});
