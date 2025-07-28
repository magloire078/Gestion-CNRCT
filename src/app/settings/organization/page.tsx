
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { getOrganizationSettings, saveOrganizationSettings } from "@/services/organization-service";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrganizationSettingsPage() {
  const { toast } = useToast();
  
  // State for previewing logos in the UI
  const [mainLogoPreview, setMainLogoPreview] = useState("");
  const [secondaryLogoPreview, setSecondaryLogoPreview] = useState("");

  // State to hold the actual data to be saved (can be existing URL or new data URI)
  const [mainLogoData, setMainLogoData] = useState("");
  const [secondaryLogoData, setSecondaryLogoData] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const mainLogoInputRef = useRef<HTMLInputElement>(null);
  const secondaryLogoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const settings = await getOrganizationSettings();
        setMainLogoPreview(settings.mainLogoUrl);
        setSecondaryLogoPreview(settings.secondaryLogoUrl);
        setMainLogoData(settings.mainLogoUrl);
        setSecondaryLogoData(settings.secondaryLogoUrl);
      } catch (error) {
        console.error("Failed to load organization settings:", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les paramètres de l'organisation.",
        });
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [toast]);


  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setPreview: React.Dispatch<React.SetStateAction<string>>,
    setData: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if(file.size > 2 * 1024 * 1024) { // 2MB limit for upload
        toast({
          variant: "destructive",
          title: "Fichier trop volumineux",
          description: "Veuillez sélectionner une image de moins de 2 Mo.",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setPreview(dataUri); // For UI display
        setData(dataUri); // For saving
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveOrganizationSettings({ mainLogoUrl: mainLogoData, secondaryLogoUrl: secondaryLogoData });
      toast({
        title: "Paramètres sauvegardés",
        description: "Les logos de votre organisation ont été mis à jour.",
      });
    } catch (error) {
       toast({
          variant: "destructive",
          title: "Erreur de sauvegarde",
          description: "Une erreur est survenue lors de la sauvegarde des logos.",
        });
        console.error(error);
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">Paramètres de l'Organisation</h1>
      
      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle>Logos de l'entreprise</CardTitle>
            <CardDescription>
              Personnalisez les logos utilisés dans les documents générés comme les bulletins de paie.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
                 <div className="space-y-6">
                    <div className="flex items-center gap-6">
                        <Skeleton className="h-20 w-20 rounded-md" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-9 w-36" />
                        </div>
                    </div>
                    <Separator />
                     <div className="flex items-center gap-6">
                        <Skeleton className="h-20 w-20 rounded-md" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-9 w-36" />
                        </div>
                    </div>
                </div>
            ) : (
             <>
                <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20 rounded-md">
                    <AvatarImage src={mainLogoPreview} alt="Logo principal" data-ai-hint="company logo"/>
                    <AvatarFallback>CNRCT</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <Label>Logo Principal (ex: CNRCT)</Label>
                    <p className="text-xs text-muted-foreground mb-2">Utilisé sur la partie gauche des documents.</p>
                    <Button type="button" variant="outline" size="sm" onClick={() => mainLogoInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Changer le logo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">Taille max : 2 Mo.</p>
                    <Input 
                    ref={mainLogoInputRef}
                    type="file"
                    className="hidden"
                    accept="image/png, image/jpeg, image/svg+xml"
                    onChange={(e) => handleFileChange(e, setMainLogoPreview, setMainLogoData)}
                    />
                </div>
                </div>
                
                <Separator />

                <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20 rounded-md">
                    <AvatarImage src={secondaryLogoPreview} alt="Logo secondaire" data-ai-hint="country emblem"/>
                    <AvatarFallback>RCI</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <Label>Logo Secondaire (ex: Emblème national)</Label>
                    <p className="text-xs text-muted-foreground mb-2">Utilisé sur la partie droite des documents.</p>
                    <Button type="button" variant="outline" size="sm" onClick={() => secondaryLogoInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Changer le logo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">Taille max : 2 Mo.</p>
                    <Input 
                    ref={secondaryLogoInputRef}
                    type="file"
                    className="hidden"
                    accept="image/png, image/jpeg, image/svg+xml"
                    onChange={(e) => handleFileChange(e, setSecondaryLogoPreview, setSecondaryLogoData)}
                    />
                </div>
                </div>
             </>
            )}
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isSaving || loading}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer les modifications
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
