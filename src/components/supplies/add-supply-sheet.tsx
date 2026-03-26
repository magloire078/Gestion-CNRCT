
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Supply, Asset } from "@/lib/data";
import { supplyCategories } from "@/lib/constants/supply";
import { X, Image as ImageIcon } from "lucide-react";
import { getAssets } from "@/services/asset-service";
import { useToast } from "@/hooks/use-toast";
import { SYSCOHADA_SUPPLIES_CATALOG, type SyscohadaItem } from "@/services/syscohada-service";

interface AddSupplySheetProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onAddSupplyAction: (supply: Omit<Supply, "id">, photoFile?: File | null) => Promise<void>;
}

export function AddSupplySheet({
  isOpen,
  onCloseAction,
  onAddSupplyAction,
}: AddSupplySheetProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState<Supply['category'] | "">("");
  const [inkType, setInkType] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [reorderLevel, setReorderLevel] = useState(10);
  const [linkedAssetTag, setLinkedAssetTag] = useState<string | "">("");
  const [printers, setPrinters] = useState<Asset[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<SyscohadaItem[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    if (!code && category) {
      if (category === 'Papeterie') setCode('602-');
      else if (category === 'Cartouches d\'encre' || category === 'Matériel de nettoyage') setCode('606-');
      else setCode('606-');
    }
  }, [category, code]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCodeChange = useCallback((val: string) => {
    setCode(val);
    if (val.length >= 2) {
      const filtered = SYSCOHADA_SUPPLIES_CATALOG.filter(item => 
        item.code.startsWith(val) || item.name.toLowerCase().includes(val.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  }, []);

  const selectSuggestion = useCallback((item: SyscohadaItem) => {
    setCode(item.code);
    setName(item.name);
    setCategory(item.category);
    setSuggestions([]);
  }, []);

  useEffect(() => {
    async function fetchPrinters() {
      if (category === 'Cartouches d\'encre') {
        try {
          const allAssets = await getAssets();
          const printerAssets = allAssets.filter(asset => asset.type === 'Imprimante');
          setPrinters(printerAssets);
        } catch (err) {
          console.error("Failed to fetch printers:", err);
          toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger la liste des imprimantes." });
        }
      }
    }
    if (isOpen) {
      fetchPrinters();
    }
  }, [category, isOpen, toast]);

  const resetForm = () => {
    setName("");
    setCode("");
    setCategory("");
    setInkType("");
    setQuantity(0);
    setReorderLevel(10);
    setLinkedAssetTag("");
    setError("");
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleClose = () => {
    resetForm();
    onCloseAction();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category || quantity < 0 || reorderLevel < 0) {
      setError("Veuillez remplir tous les champs obligatoires avec des valeurs valides.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const lastRestockDate = new Date().toISOString().split('T')[0];
      await onAddSupplyAction({
        name,
        code: code || undefined,
        category: category as Supply['category'],
        quantity,
        reorderLevel,
        lastRestockDate,
        inkType: category === 'Cartouches d\'encre' ? inkType : undefined,
        linkedAssetTag: (category === 'Cartouches d\'encre' && linkedAssetTag !== 'none') ? linkedAssetTag : undefined,
      }, photoFile);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'ajout de la fourniture.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Ajouter une nouvelle fourniture</SheetTitle>
            <SheetDescription>
              Remplissez les détails ci-dessous pour ajouter un nouvel article à l'inventaire.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4 relative">
              <Label htmlFor="code" className="text-right text-xs">Code SYSCOHADA</Label>
              <div className="col-span-3">
                <Input 
                  id="code" 
                  value={code} 
                  onChange={(e) => handleCodeChange(e.target.value)} 
                  placeholder="Ex: 335101" 
                  autoComplete="off"
                />
                {suggestions.length > 0 && (
                  <div className="absolute z-50 mt-1 w-[calc(75%)] bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-auto">
                    {suggestions.map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 flex flex-col gap-0.5 border-b border-slate-50 last:border-0"
                        onClick={() => selectSuggestion(item)}
                      >
                        <span className="text-xs font-black text-slate-900">{item.code}</span>
                        <span className="text-[10px] text-slate-500 font-medium">{item.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Nom de l'article</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="col-span-3" 
                placeholder="Ex: Rame de papier A4" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">Catégorie</Label>
              <Select value={category} onValueChange={(value: Supply['category']) => setCategory(value)}>
                <SelectTrigger id="category" className="col-span-3">
                  <SelectValue placeholder="Sélectionnez une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {supplyCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {category === 'Cartouches d\'encre' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="inkType" className="text-right">Type/N° d'encre</Label>
                  <Input id="inkType" value={inkType} onChange={(e) => setInkType(e.target.value)} className="col-span-3" placeholder="Ex: HP 651, Toner 12A" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="linkedAssetTag" className="text-right">Imprimante</Label>
                  <Select value={linkedAssetTag || 'none'} onValueChange={setLinkedAssetTag}>
                    <SelectTrigger id="linkedAssetTag" className="col-span-3">
                      <SelectValue placeholder="Lier à une imprimante..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucune</SelectItem>
                      {printers.map(printer => (
                        <SelectItem key={printer.tag} value={printer.tag}>
                          {printer.modele} ({printer.tag})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="photo" className="text-right text-xs">Photo de l'article</Label>
              <div className="col-span-3 flex flex-col gap-2">
                <div className="flex items-center gap-4">
                  {photoPreview ? (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 shadow-sm transition-all hover:scale-105">
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-lg p-1 hover:bg-red-600 transition-colors shadow-sm"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center transition-colors hover:bg-slate-100 hover:border-slate-300 pointer-events-none">
                      <ImageIcon className="h-6 w-6 text-slate-300" />
                      <span className="text-[8px] text-slate-400 mt-1 uppercase font-bold">Photo</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <Input 
                      id="photo" 
                      type="file" 
                      accept="image/*" 
                      onChange={handlePhotoChange}
                      className="text-xs file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-primary file:text-white hover:file:opacity-90 file:cursor-pointer transition-all border-slate-200"
                    />
                    <p className="text-[10px] text-slate-400 mt-1.5 italic flex items-center gap-1 leading-tight">
                      Formats JPG, PNG ou WEBP (Max 5Mo)
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">Quantité en stock</Label>
              <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reorderLevel" className="text-right">Niveau de réapprovisionnement</Label>
              <Input id="reorderLevel" type="number" value={reorderLevel} onChange={(e) => setReorderLevel(Number(e.target.value))} className="col-span-3" />
            </div>
            {error && (
              <p className="col-span-4 text-center text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button type="button" variant="outline" onClick={handleClose}>Annuler</Button>
            </SheetClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
