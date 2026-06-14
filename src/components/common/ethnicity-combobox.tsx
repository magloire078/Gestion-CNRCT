"use client";

import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ethnicities, majorGroups, Ethnicity } from "@/lib/ivory-coast-ethnicities";

interface EthnicityComboboxProps {
    value?: string | string[];
    onValueChange: (value: string | string[]) => void;
    placeholder?: string;
    disabled?: boolean;
    multiple?: boolean;
    className?: string;
}

export function EthnicityCombobox({
    value,
    onValueChange,
    placeholder = "Sélectionner une ethnie...",
    disabled = false,
    multiple = false,
    className,
}: EthnicityComboboxProps) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const selectedValues = useMemo(() => {
        if (!value) return [];
        return Array.isArray(value) ? value : [value];
    }, [value]);

    const filteredOptions = useMemo(() => {
        if (!searchQuery) return ethnicities;
        const lower = searchQuery.toLowerCase();
        return ethnicities.filter(e => 
            e.name.toLowerCase().includes(lower) || 
            e.majorGroup.toLowerCase().includes(lower) ||
            (e.subGroup && e.subGroup.toLowerCase().includes(lower))
        );
    }, [searchQuery]);

    // Group options by major group
    const groupedOptions = useMemo(() => {
        const groups: Record<string, Ethnicity[]> = {};
        majorGroups.forEach(g => groups[g] = []);
        filteredOptions.forEach(e => {
            if (groups[e.majorGroup]) {
                groups[e.majorGroup].push(e);
            }
        });
        return groups;
    }, [filteredOptions]);

    const handleSelect = (currentValue: string) => {
        const eth = ethnicities.find(e => e.name.toLowerCase() === currentValue.toLowerCase());
        const realValue = eth ? eth.name : currentValue;

        if (multiple) {
            const newValues = selectedValues.includes(realValue)
                ? selectedValues.filter(v => v !== realValue)
                : [...selectedValues, realValue];
            onValueChange(newValues);
            // Don't close popover automatically in multiple mode
        } else {
            onValueChange(realValue);
            setOpen(false);
            setSearchQuery("");
        }
    };

    const displayValue = multiple 
        ? (selectedValues.length > 0 ? selectedValues.join(', ') : '')
        : (typeof value === 'string' ? value : (selectedValues[0] || ''));

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between font-normal h-10", className)}
                    disabled={disabled}
                >
                    <span className="truncate">
                        {displayValue || <span className="text-muted-foreground">{placeholder}</span>}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                    <CommandInput
                        placeholder="Rechercher une ethnie ou un groupe..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                    />
                    <CommandList className="max-h-[300px] overflow-y-auto">
                        <CommandEmpty>Aucune ethnie trouvée.</CommandEmpty>
                        {majorGroups.map(group => {
                            const items = groupedOptions[group];
                            if (!items || items.length === 0) return null;
                            return (
                                <CommandGroup key={group} heading={`Groupe ${group}`}>
                                    {items.map((eth) => (
                                        <CommandItem
                                            key={eth.id}
                                            value={eth.name}
                                            onSelect={handleSelect}
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex flex-col">
                                                    <span>{eth.name}</span>
                                                    {eth.subGroup && (
                                                        <span className="text-[10px] text-muted-foreground">{eth.subGroup}</span>
                                                    )}
                                                </div>
                                                <Check
                                                    className={cn(
                                                        "ml-2 h-4 w-4 shrink-0 text-blue-600",
                                                        selectedValues.includes(eth.name) ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            );
                        })}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
