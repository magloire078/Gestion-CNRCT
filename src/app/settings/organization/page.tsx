
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { getOrganizationSettings, saveOrganizationSettings } from "@/services/organization-service";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

export default function OrganizationSettingsPage() {
  const { toast } = useToast();
  
  const [mainLogoPreview, setMainLogoPreview] = useState("");
  const [secondaryLogoPreview, setSecondaryLogoPreview] = useState("");

  const [mainLogoData, setMainLogoData] = useState("");
  const [secondaryLogoData, setSecondaryLogoData] = useState("");

  const [mainLogoFile, setMainLogoFile] = useState<File | null>(null);
  const [secondaryLogoFile, setSecondaryLogoFile] = useState<File | null>(null);

  const [hasMainLogoChanged, setHasMainLogoChanged] = useState(false);
  const [hasSecondaryLogoChanged, setHasSecondaryLogoChanged] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [isSavingMain, setIsSavingMain] = useState(false);
  const [isSavingSecondary, setIsSavingSecondary] = useState(false);
  
  const [mainLogoProgress, setMainLogoProgress] = useState<number | null>(null);
  const [secondaryLogoProgress, setSecondaryLogoProgress] = useState<number | null>(null);

  const mainLogoInputRef = useRef<HTMLInputElement>(null);
  const secondaryLogoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const settings = await getOrganizationSettings();
        setMainLogoPreview(settings.mainLogoUrl);
        setMainLogoData(settings.mainLogoUrl);
        setSecondaryLogoPreview(settings.secondaryLogoUrl);
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
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    setChanged: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if(file.size > 2 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Fichier trop volumineux",
          description: "Veuillez sélectionner une image de moins de 2 Mo.",
        });
        return;
      }
      setFile(file);
      setChanged(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSave = async (logoType: 'main' | 'secondary') => {
      const isMain = logoType === 'main';
      const file = isMain ? mainLogoFile : secondaryLogoFile;
      const settingsToSave = isMain ? { mainLogoFile: file } : { secondaryLogoFile: file };
      const setProgress = isMain ? setMainLogoProgress : setSecondaryLogoProgress;
      
      if (!file) return;

      if (isMain) setIsSavingMain(true);
      else setIsSavingSecondary(true);
      setProgress(0);

      try {
          const newSettings = await saveOrganizationSettings(settingsToSave, setProgress);
          if (isMain) {
              setMainLogoPreview(newSettings.mainLogoUrl);
              setHasMainLogoChanged(false);
              setMainLogoFile(null);
          } else {
              setSecondaryLogoPreview(newSettings.secondaryLogoUrl);
              setHasSecondaryLogoChanged(false);
              setSecondaryLogoFile(null);
          }

          toast({
            title: "Logo sauvegardé",
            description: `Le logo ${isMain ? 'principal' : 'secondaire'} a été mis à jour.`,
          });
      } catch (error) {
          toast({
              variant: "destructive",
              title: "Erreur de sauvegarde",
              description: "Une erreur est survenue lors de la sauvegarde du logo.",
          });
          console.error(error);
      } finally {
          if (isMain) setIsSavingMain(false);
          else setIsSavingSecondary(false);
          setProgress(null);
      }
  };


  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">Paramètres de l'Organisation</h1>
      
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
              <Skeleton className="h-28 w-full" />
              <Separator />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : (
            <>
              {/* Main Logo Section */}
              <div className="space-y-4">
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
                        onChange={(e) => handleFileChange(e, setMainLogoPreview, setMainLogoFile, setHasMainLogoChanged)}
                      />
                      {mainLogoProgress !== null && (
                        <div className="mt-2 space-y-1">
                            <Label className="text-xs">Téléversement...</Label>
                            <Progress value={mainLogoProgress} className="h-2" />
                        </div>
                      )}
                  </div>
                </div>
                <div className="flex justify-end">
                    <Button 
                        type="button" 
                        onClick={() => handleSave('main')} 
                        disabled={isSavingMain || !hasMainLogoChanged}
                    >
                        {isSavingMain ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Enregistrer
                    </Button>
                </div>
              </div>
              
              <Separator />

              {/* Secondary Logo Section */}
               <div className="space-y-4">
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
                        onChange={(e) => handleFileChange(e, setSecondaryLogoPreview, setSecondaryLogoFile, setHasSecondaryLogoChanged)}
                      />
                       {secondaryLogoProgress !== null && (
                        <div className="mt-2 space-y-1">
                            <Label className="text-xs">Téléversement...</Label>
                            <Progress value={secondaryLogoProgress} className="h-2" />
                        </div>
                      )}
                  </div>
                </div>
                 <div className="flex justify-end">
                    <Button 
                        type="button" 
                        onClick={() => handleSave('secondary')} 
                        disabled={isSavingSecondary || !hasSecondaryLogoChanged}
                    >
                        {isSavingSecondary ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Enregistrer
                    </Button>
                 </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
