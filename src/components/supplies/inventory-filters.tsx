"use client";

import React, { memo } from "react";
import { Search, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SupplyCategory } from "@/services/supply-category-service";

interface InventoryFiltersProps {
    searchTerm: string;
    onSearchChange: (val: string) => void;
    categoryFilter: string;
    onCategoryFilterChange: (val: string) => void;
    availableCategories: SupplyCategory[];
}

export const InventoryFilters = memo(({
    searchTerm,
    onSearchChange,
    categoryFilter,
    onCategoryFilterChange,
    availableCategories
}: InventoryFiltersProps) => {
    return (
        <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative group w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                <input
                    placeholder="Rechercher un article..."
                    className="pl-9 h-11 w-full md:w-[280px] rounded-2xl border border-white/10 focus:ring-slate-900 outline-none px-3 text-sm focus:border-slate-900 bg-card/40 backdrop-blur-md font-medium shadow-sm transition-all"
                    value={searchTerm}
                    onChange={e => onSearchChange(e.target.value)}
                />
            </div>
            <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
                <SelectTrigger className="w-full sm:w-[220px] h-11 rounded-2xl border-white/10 bg-card/40 backdrop-blur-md text-foreground font-black uppercase tracking-widest text-[10px] shadow-sm">
                    <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-white/10 bg-card/90 backdrop-blur-xl">
                    <SelectItem value="all" className="font-bold">Toutes les dotations</SelectItem>
                    {availableCategories.map(cat => (
                        <SelectItem key={cat.id} value={cat.name} className="font-bold uppercase tracking-widest text-[10px]">
                            {cat.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
});

InventoryFilters.displayName = "InventoryFilters";
