
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
import { getAssets } from "@/services/asset-service";
import { useToast } from "@/hooks/use-toast";
import { X, Image as ImageIcon, AlertCircle } from "lucide-react";
import { SYSCOHADA_SUPPLIES_CATALOG, type SyscohadaItem } from "@/services/syscohada-service";
import { SupplyCategory, subscribeToCategories } from "@/services/supply-category-service";

interface EditSupplySheetProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onUpdateSupplyAction: (id: string, data: Partial<Omit<Supply, 'id'>>, photoFile?: File | null) => Promise<void>;
  supply: Supply;
}

export function EditSupplySheet({
  isOpen,
  onCloseAction,
  onUpdateSupplyAction,
  supply
}: EditSupplySheetProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [supplierReference, setSupplierReference] = useState("");
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
  const [availableCategories, setAvailableCategories] = useState<SupplyCategory[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const unsubscribe = subscribeToCategories(
        (data) => setAvailableCategories(data),
        (err) => console.error("Error fetching categories:", err)
      );
      return () => unsubscribe();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!code && category) {
      const selectedCat = availableCategories.find(c => c.name === category);
      if (selectedCat?.syscohadaAccount) {
        // Only set prefix if not already set or different
        const prefix = `${selectedCat.syscohadaAccount}-`;
        if (!code.startsWith(prefix)) {
          setCode(prefix);
        }
      } else {
        // Fallback for known legacy categories
        if (category === 'Petits matériels, fourniture de bureau et documentation') setCode('6211-');
        else if (category === 'Cartouches d\'encre' || category === 'Matériel de nettoyage') setCode('606-');
        else if (category === 'Fourniture et consommables pour le materiel informatique') setCode('6214-');
      }
    }
  }, [category, code, availableCategories]);

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
    if (supply) {
      setName(supply.name);
      setCode(supply.code || "");
      setCategory(supply.category);
      setSupplierReference(supply.supplierReference || "");
      setInkType(supply.inkType || "");
      setQuantity(supply.quantity);
      setReorderLevel(supply.reorderLevel);
      setLinkedAssetTag(supply.linkedAssetTag || "");
      setPhotoPreview(supply.photoUrl || null);
    }
  }, [supply]);

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


  const handleClose = () => {
    setError("");
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
      await onUpdateSupplyAction(supply.id, {
        name,
        code: code || undefined,
        supplierReference: supplierReference || undefined,
        category: category as Supply['category'],
        quantity,
        reorderLevel,
        inkType: category === 'Cartouches d\'encre' ? inkType : undefined,
        linkedAssetTag: (category === 'Cartouches d\'encre' && linkedAssetTag !== 'none') ? linkedAssetTag : undefined,
      }, photoFile);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la mise à jour.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Modifier la fourniture</SheetTitle>
            <SheetDescription>
              Mettez à jour les informations de cet article.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4 relative">
              <Label htmlFor="code-edit" className="text-right text-[10px] sm:text-xs">Code SYSCOHADA</Label>
              <div className="col-span-3">
                <Input 
                  id="code-edit" 
                  value={code} 
                  onChange={(e) => handleCodeChange(e.target.value)} 
                  placeholder="Ex: 335101" 
                  autoComplete="off"
                />
                {suggestions.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-auto">
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
              <Label htmlFor="name-edit" className="text-right text-xs">Nom de l'article</Label>
              <Input 
                id="name-edit" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="col-span-3" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category-edit" className="text-right">Catégorie</Label>
              <Select value={category} onValueChange={(value: Supply['category']) => setCategory(value)}>
                <SelectTrigger id="category-edit" className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                  ))}
                  {availableCategories.length === 0 && (
                     <SelectItem value="none" disabled>Chargement...</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            {category === 'Cartouches d\'encre' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="inkType-edit" className="text-right">Type/N° d'encre</Label>
                  <Input id="inkType-edit" value={inkType} onChange={(e) => setInkType(e.target.value)} className="col-span-3" placeholder="Ex: HP 651, Toner 12A" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="linkedAssetTag-edit" className="text-right">Imprimante</Label>
                  <Select value={linkedAssetTag || 'none'} onValueChange={setLinkedAssetTag}>
                    <SelectTrigger id="linkedAssetTag-edit" className="col-span-3">
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
              <Label htmlFor="photo-edit" className="text-right text-xs text-slate-500 font-bold">Photo de l'article</Label>
              <div className="col-span-3 flex flex-col gap-2">
                <div className="flex items-center gap-4">
                  {photoPreview ? (
                    <div className="relative w-16 h-16 rounded-md overflow-hidden border border-slate-200 shadow-sm transition-all hover:scale-105 group">
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-md p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm"
                        title="Supprimer la photo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-md bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center transition-colors hover:bg-slate-100 hover:border-slate-300 pointer-events-none">
                      <ImageIcon className="h-6 w-6 text-slate-300" />
                      <span className="text-[8px] text-slate-400 mt-1 uppercase font-bold">Photo</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <Input 
                      id="photo-edit" 
                      type="file" 
                      accept="image/*" 
                      onChange={handlePhotoChange}
                      className="text-xs file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-primary file:text-white hover:file:opacity-90 file:cursor-pointer transition-all border-slate-200"
                    />
                    <p className="text-[10px] text-slate-400 mt-1.5 italic flex items-center gap-1 leading-tight">
                      JPG, PNG ou WEBP (Max 5Mo)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4 text-xs font-bold text-slate-500 mb-2 mt-2">
               <div className="col-span-4 border-b border-slate-100 pb-1">Stock & Alertes</div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity-edit" className="text-right">Quantité</Label>
              <Input id="quantity-edit" type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reorderLevel-edit" className="text-right">Seuil</Label>
              <Input id="reorderLevel-edit" type="number" value={reorderLevel} onChange={(e) => setReorderLevel(Number(e.target.value))} className="col-span-3" />
            </div>
            {error && (
              <div className="col-span-4 flex items-center justify-center gap-2 p-3 rounded-md bg-red-50 text-red-600 border border-red-100 animate-in fade-in zoom-in duration-300">
                <AlertCircle className="h-4 w-4" />
                <p className="text-xs font-bold leading-tight">{error}</p>
              </div>
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
