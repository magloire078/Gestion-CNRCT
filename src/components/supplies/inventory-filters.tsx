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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                <input
                    placeholder="Filtrer par nom ou code..."
                    className="pl-9 h-10 w-full md:w-[250px] rounded-xl border border-slate-200 focus:ring-slate-900 outline-none px-3 text-sm focus:border-slate-900 bg-white"
                    value={searchTerm}
                    onChange={e => onSearchChange(e.target.value)}
                />
            </div>
            <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
                <SelectTrigger className="w-full sm:w-[200px] h-10 rounded-xl border-slate-200 text-slate-900 font-bold">
                    <Filter className="mr-2 h-3.5 w-3.5 text-slate-400" />
                    <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {availableCategories.map(cat => (
                        <SelectItem key={cat.id} value={cat.name}>
                            {cat.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
});

InventoryFilters.displayName = "InventoryFilters";
