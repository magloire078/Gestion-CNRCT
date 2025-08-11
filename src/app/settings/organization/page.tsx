
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
  const [faviconPreview, setFaviconPreview] = useState("");

  const [mainLogoFile, setMainLogoFile] = useState<File | null>(null);
  const [secondaryLogoFile, setSecondaryLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);

  const [hasMainLogoChanged, setHasMainLogoChanged] = useState(false);
  const [hasSecondaryLogoChanged, setHasSecondaryLogoChanged] = useState(false);
  const [hasFaviconChanged, setHasFaviconChanged] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [isSavingMain, setIsSavingMain] = useState(false);
  const [isSavingSecondary, setIsSavingSecondary] = useState(false);
  const [isSavingFavicon, setIsSavingFavicon] = useState(false);
  
  const [mainLogoProgress, setMainLogoProgress] = useState<number | null>(null);
  const [secondaryLogoProgress, setSecondaryLogoProgress] = useState<number | null>(null);
  const [faviconProgress, setFaviconProgress] = useState<number | null>(null);

  const mainLogoInputRef = useRef<HTMLInputElement>(null);
  const secondaryLogoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const settings = await getOrganizationSettings();
        setMainLogoPreview(settings.mainLogoUrl);
        setSecondaryLogoPreview(settings.secondaryLogoUrl);
        setFaviconPreview(settings.faviconUrl);
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
  
  const handleSave = async (logoType: 'main' | 'secondary' | 'favicon') => {
      let file: File | null = null;
      let settingsToSave = {};
      let setProgress: React.Dispatch<React.SetStateAction<number | null>> = () => {};
      
      switch(logoType) {
        case 'main':
          file = mainLogoFile;
          settingsToSave = { mainLogoFile: file };
          setProgress = setMainLogoProgress;
          setIsSavingMain(true);
          break;
        case 'secondary':
          file = secondaryLogoFile;
          settingsToSave = { secondaryLogoFile: file };
          setProgress = setSecondaryLogoProgress;
          setIsSavingSecondary(true);
          break;
        case 'favicon':
          file = faviconFile;
          settingsToSave = { faviconFile: file };
          setProgress = setFaviconProgress;
          setIsSavingFavicon(true);
          break;
      }
      
      if (!file) return;

      setProgress(0);

      try {
          const newSettings = await saveOrganizationSettings(settingsToSave, setProgress);
          switch(logoType) {
            case 'main':
              setMainLogoPreview(newSettings.mainLogoUrl);
              setHasMainLogoChanged(false);
              setMainLogoFile(null);
              break;
            case 'secondary':
              setSecondaryLogoPreview(newSettings.secondaryLogoUrl);
              setHasSecondaryLogoChanged(false);
              setSecondaryLogoFile(null);
              break;
            case 'favicon':
              setFaviconPreview(newSettings.faviconUrl);
              setHasFaviconChanged(false);
              setFaviconFile(null);
              // Force reload to update the browser tab favicon
              window.location.reload(); 
              break;
          }

          toast({
            title: "Sauvegarde réussie",
            description: `Le ${logoType === 'favicon' ? 'favicon' : 'logo'} a été mis à jour.`,
          });
      } catch (error) {
          toast({
              variant: "destructive",
              title: "Erreur de sauvegarde",
              description: "Une erreur est survenue lors de la sauvegarde.",
          });
          console.error(error);
      } finally {
         switch(logoType) {
            case 'main': setIsSavingMain(false); break;
            case 'secondary': setIsSavingSecondary(false); break;
            case 'favicon': setIsSavingFavicon(false); break;
         }
          setProgress(null);
      }
  };


  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">Paramètres de l'Organisation</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Identité Visuelle</CardTitle>
          <CardDescription>
            Personnalisez les logos et le favicon utilisés dans l'application et les documents générés.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="space-y-6">
              <Skeleton className="h-28 w-full" />
              <Separator />
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

               <Separator />

              {/* Favicon Section */}
               <div className="space-y-4">
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20 rounded-md">
                      <AvatarImage src={faviconPreview} alt="Favicon" data-ai-hint="favicon"/>
                      <AvatarFallback>ICO</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                      <Label>Favicon</Label>
                      <p className="text-xs text-muted-foreground mb-2">Icône affichée dans l'onglet du navigateur. Fichier .ico, .png, .svg.</p>
                      <Button type="button" variant="outline" size="sm" onClick={() => faviconInputRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" />
                        Changer le favicon
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">Taille max : 2 Mo.</p>
                      <Input 
                        ref={faviconInputRef}
                        type="file"
                        className="hidden"
                        accept="image/x-icon, image/png, image/svg+xml"
                        onChange={(e) => handleFileChange(e, setFaviconPreview, setFaviconFile, setHasFaviconChanged)}
                      />
                       {faviconProgress !== null && (
                        <div className="mt-2 space-y-1">
                            <Label className="text-xs">Téléversement...</Label>
                            <Progress value={faviconProgress} className="h-2" />
                        </div>
                      )}
                  </div>
                </div>
                 <div className="flex justify-end">
                    <Button 
                        type="button" 
                        onClick={() => handleSave('favicon')} 
                        disabled={isSavingFavicon || !hasFaviconChanged}
                    >
                        {isSavingFavicon ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
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
