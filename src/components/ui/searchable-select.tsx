"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export interface SearchableSelectItem {
    value: string
    label: string
    searchTerms?: string
}

interface SearchableSelectProps {
    items: SearchableSelectItem[]
    value?: string
    onValueChange: (value: string) => void
    placeholder?: string
    searchPlaceholder?: string
    emptyMessage?: string
    className?: string
    disabled?: boolean
}

export const SearchableSelect = React.memo(({
    items,
    value,
    onValueChange,
    placeholder = "Sélectionner...",
    searchPlaceholder = "Rechercher...",
    emptyMessage = "Aucun résultat trouvé.",
    className,
    disabled = false,
}: SearchableSelectProps) => {
    const [open, setOpen] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")
    const deferredQuery = React.useDeferredValue(searchQuery)

    const selectedItem = React.useMemo(
        () => items.find((item) => item.value === value),
        [items, value]
    )

    const handleOpenChange = React.useCallback((nextOpen: boolean) => {
        React.startTransition(() => {
            setOpen(nextOpen)
            if (!nextOpen) {
                setSearchQuery("")
            }
        })
    }, [])

    const filteredItems = React.useMemo(() => {
        const q = deferredQuery.trim().toLowerCase()
        if (!q) {
            return items.slice(0, 40)
        }
        const matches: SearchableSelectItem[] = []
        for (let i = 0; i < items.length; i++) {
            const item = items[i]
            const searchTarget = (item.searchTerms ? `${item.searchTerms} ${item.label}` : item.label).toLowerCase()
            if (searchTarget.includes(q)) {
                matches.push(item)
                if (matches.length >= 40) break
            }
        }
        return matches
    }, [items, deferredQuery])

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between font-normal", className)}
                    disabled={disabled}
                >
                    <span className="truncate">
                        {selectedItem ? selectedItem.label : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            {open && (
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command shouldFilter={false}>
                        <CommandInput 
                            placeholder={searchPlaceholder} 
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                        />
                        <CommandList>
                            {filteredItems.length === 0 ? (
                                <CommandEmpty>{emptyMessage}</CommandEmpty>
                            ) : (
                                <CommandGroup>
                                    {filteredItems.map((item) => (
                                        <CommandItem
                                            key={item.value}
                                            value={item.value}
                                            onSelect={() => {
                                                onValueChange(item.value)
                                                handleOpenChange(false)
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    value === item.value ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {item.label}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            )}
        </Popover>
    )
});
