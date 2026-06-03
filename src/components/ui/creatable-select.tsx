"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"

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

export interface CreatableSelectItem {
    value: string
    label: string
}

interface CreatableSelectProps {
    items: CreatableSelectItem[]
    value?: string
    onValueChange: (value: string) => void
    placeholder?: string
    searchPlaceholder?: string
    emptyMessage?: string
    className?: string
    disabled?: boolean
}

export const CreatableSelect = React.memo(({
    items,
    value,
    onValueChange,
    placeholder = "Sélectionner ou créer...",
    searchPlaceholder = "Rechercher ou créer...",
    emptyMessage = "Aucun résultat trouvé.",
    className,
    disabled = false,
}: CreatableSelectProps) => {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState("")

    // We allow the value to be something not in items yet
    const selectedLabel = React.useMemo(
        () => items.find((item) => item.value === value)?.label || value,
        [items, value]
    )

    const exactMatch = items.some((item) => item.label.toLowerCase() === inputValue.toLowerCase())

    return (
        <Popover open={open} onOpenChange={(newOpen) => {
            setOpen(newOpen)
            if (!newOpen) setInputValue("") // Reset input on close
        }}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between font-normal", className)}
                    disabled={disabled}
                >
                    <span className="truncate">
                        {selectedLabel || placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                    <CommandInput 
                        placeholder={searchPlaceholder} 
                        value={inputValue}
                        onValueChange={setInputValue}
                    />
                    <CommandList>
                        <CommandEmpty>
                            {inputValue.length > 0 && !exactMatch ? (
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start font-normal text-primary"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        onValueChange(inputValue)
                                        setOpen(false)
                                    }}
                                >
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Créer "{inputValue}"
                                </Button>
                            ) : emptyMessage}
                        </CommandEmpty>
                        <CommandGroup>
                            {inputValue.length > 0 && !exactMatch && (
                                <CommandItem
                                    value={inputValue}
                                    onSelect={() => {
                                        onValueChange(inputValue)
                                        setOpen(false)
                                    }}
                                    className="text-primary font-medium"
                                >
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Créer "{inputValue}"
                                </CommandItem>
                            )}
                            {items.map((item) => (
                                <CommandItem
                                    key={item.value}
                                    value={item.label}
                                    onSelect={() => {
                                        onValueChange(item.value)
                                        setOpen(false)
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
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
});
