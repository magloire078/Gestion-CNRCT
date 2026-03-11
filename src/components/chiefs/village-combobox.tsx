"use client";

import { useState, useEffect, useMemo } from "react";
import { Check, ChevronsUpDown, PlusCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { addVillage, getVillages } from "@/services/village-service";
import type { Village } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { divisions } from "@/lib/ivory-coast-divisions";

interface VillageComboboxProps {
    value?: string;
    onValueChange: (value: string, villageId?: string) => void;
    region?: string;
    department?: string;
    subPrefecture?: string;
    placeholder?: string;
    disabled?: boolean;
}

export function VillageCombobox({
    value,
    onValueChange,
    region,
    department,
    subPrefecture,
    placeholder = "Sélectionner ou ajouter un village...",
    disabled,
}: VillageComboboxProps) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [firestoreVillages, setFirestoreVillages] = useState<Village[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const { toast } = useToast();

    // Load villages from Firestore (custom villages)
    useEffect(() => {
        getVillages().then(setFirestoreVillages).catch(console.error);
    }, []);

    // Villages from the ivory-coast-divisions static file for current location
    const staticVillages = useMemo<string[]>(() => {
        if (region && department && subPrefecture) {
            return divisions[region]?.[department]?.[subPrefecture] || [];
        }
        return [];
    }, [region, department, subPrefecture]);

    // Merge static and Firestore villages, deduplicated, filtered by location if possible
    const allVillageOptions = useMemo(() => {
        const firestoreNames = firestoreVillages
            .filter(v => !region || !v.region || v.region === region)
            .filter(v => !subPrefecture || !v.subPrefecture || v.subPrefecture === subPrefecture)
            .map(v => ({ name: v.name, id: v.id, isFirestore: true }));

        const staticNames = staticVillages
            .filter(name => !firestoreNames.some(fv => fv.name.toLowerCase() === name.toLowerCase()))
            .map(name => ({ name, id: undefined, isFirestore: false }));

        return [...firestoreNames, ...staticNames].sort((a, b) => a.name.localeCompare(b.name));
    }, [firestoreVillages, staticVillages, region, subPrefecture]);

    const filteredOptions = useMemo(() => {
        if (!searchQuery) return allVillageOptions;
        const lower = searchQuery.toLowerCase();
        return allVillageOptions.filter(v => v.name.toLowerCase().includes(lower));
    }, [allVillageOptions, searchQuery]);

    const showAddOption = searchQuery.trim().length > 1 &&
        !allVillageOptions.some(v => v.name.toLowerCase() === searchQuery.trim().toLowerCase());

    const handleCreateVillage = async () => {
        const newName = searchQuery.trim();
        if (!newName) return;
        setIsCreating(true);
        try {
            const newVillage = await addVillage({
                name: newName,
                region: region || '',
                department: department || '',
                subPrefecture: subPrefecture || '',
            } as Omit<Village, 'id'>);
            setFirestoreVillages(prev => [...prev, newVillage]);
            onValueChange(newVillage.name, newVillage.id);
            setOpen(false);
            setSearchQuery("");
            toast({ title: "Village ajouté", description: `"${newName}" a été ajouté au répertoire.` });
        } catch (e) {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible d'ajouter le village." });
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal"
                    disabled={disabled}
                >
                    {value || <span className="text-muted-foreground">{placeholder}</span>}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                    <CommandInput
                        placeholder="Rechercher ou taper un nom..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                    />
                    <CommandList>
                        {filteredOptions.length === 0 && !showAddOption && (
                            <CommandEmpty>Aucun village trouvé.</CommandEmpty>
                        )}
                        <CommandGroup>
                            {filteredOptions.map((village) => (
                                <CommandItem
                                    key={village.name}
                                    value={village.name}
                                    onSelect={(currentValue) => {
                                        onValueChange(currentValue, village.id);
                                        setOpen(false);
                                        setSearchQuery("");
                                    }}
                                >
                                    <Check
                                        className={cn("mr-2 h-4 w-4", value === village.name ? "opacity-100" : "opacity-0")}
                                    />
                                    {village.name}
                                    {village.isFirestore && (
                                        <span className="ml-auto text-xs text-muted-foreground">Personnalisé</span>
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>

                        {showAddOption && (
                            <>
                                <CommandSeparator />
                                <CommandGroup>
                                    <CommandItem
                                        onSelect={handleCreateVillage}
                                        disabled={isCreating}
                                        className="text-primary cursor-pointer"
                                    >
                                        {isCreating ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                        )}
                                        Ajouter &ldquo;{searchQuery.trim()}&rdquo;
                                    </CommandItem>
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
