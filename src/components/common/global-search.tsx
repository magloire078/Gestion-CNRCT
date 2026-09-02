"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Users, Crown, ShieldAlert, Briefcase, MapPin, Landmark, Loader2 } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useAuth } from "@/hooks/use-auth";
import { globalSearch, SearchResult, SearchResultType } from "@/services/search-service";
import { Button } from "@/components/ui/button";

function getIconForType(type: SearchResultType) {
  switch (type) {
    case 'employee': return <Users className="mr-2 h-4 w-4" />;
    case 'chief': return <Crown className="mr-2 h-4 w-4" />;
    case 'conflict': return <ShieldAlert className="mr-2 h-4 w-4" />;
    case 'mission': return <Briefcase className="mr-2 h-4 w-4" />;
    case 'village': return <MapPin className="mr-2 h-4 w-4" />;
    case 'heritage': return <Landmark className="mr-2 h-4 w-4" />;
    default: return <Search className="mr-2 h-4 w-4" />;
  }
}

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  
  const { hasPermission } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  React.useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await globalSearch(query, hasPermission);
        setResults(res);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, hasPermission]);

  const onSelect = (url: string) => {
    setOpen(false);
    router.push(url);
  };

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const groupLabels: Record<string, string> = {
    employee: "Employés",
    chief: "Rois & Chefs",
    conflict: "Conflits",
    mission: "Missions",
    village: "Villages",
    heritage: "Patrimoine"
  };

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-9 p-0 xl:h-9 xl:w-60 xl:justify-start xl:px-3 xl:py-2 bg-slate-50/50 backdrop-blur border-slate-200/50 hover:bg-slate-100"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 xl:mr-2" />
        <span className="hidden xl:inline-flex text-slate-500 text-sm">Recherche globale...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-slate-100 px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Rechercher (employé, chef, conflit, village...)" 
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : query.length < 2 ? (
              "Tapez au moins 2 caractères..."
            ) : (
              "Aucun résultat trouvé."
            )}
          </CommandEmpty>
          
          {Object.entries(groupedResults).map(([type, items]) => (
            <CommandGroup key={type} heading={groupLabels[type] || type}>
              {items.map((item) => (
                <CommandItem
                  key={`${item.type}-${item.id}`}
                  value={`${item.title} ${item.subtitle}`}
                  onSelect={() => onSelect(item.url)}
                  className="flex flex-col items-start py-2 cursor-pointer"
                >
                  <div className="flex items-center w-full">
                    {getIconForType(item.type as SearchResultType)}
                    <span className="font-medium truncate">{item.title}</span>
                  </div>
                  {item.subtitle && (
                    <span className="text-xs text-muted-foreground pl-6 truncate w-full">
                      {item.subtitle}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
