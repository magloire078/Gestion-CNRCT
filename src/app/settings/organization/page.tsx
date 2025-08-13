
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Loader2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { getOrganizationSettings, saveOrganizationName, uploadOrganizationFile, type UploadTaskController } from "@/services/organization-service";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import type { OrganizationSettings } from "@/lib/data";

export default function OrganizationSettingsPage() {
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);
  const [name, setName] = useState("");

  const [mainLogoPreview, setMainLogoPreview] = useState("");
  const [secondaryLogoPreview, setSecondaryLogoPreview] = useState("");
  const [faviconPreview, setFaviconPreview] = useState("");

  const [mainLogoFile, setMainLogoFile] = useState<File | null>(null);
  const [secondaryLogoFile, setSecondaryLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);

  const [hasNameChanged, setHasNameChanged] = useState(false);
  const [hasMainLogoChanged, setHasMainLogoChanged] = useState(false);
  const [hasSecondaryLogoChanged, setHasSecondaryLogoChanged] = useState(false);
  const [hasFaviconChanged, setHasFaviconChanged] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [isSavingName, setIsSavingName] = useState(false);
  
  const [mainLogoProgress, setMainLogoProgress] = useState<number | null>(null);
  const [secondaryLogoProgress, setSecondaryLogoProgress] = useState<number | null>(null);
  const [faviconProgress, setFaviconProgress] = useState<number | null>(null);

  const [mainLogoController, setMainLogoController] = useState<UploadTaskController | null>(null);
  const [secondaryLogoController, setSecondaryLogoController] = useState<UploadTaskController | null>(null);
  const [faviconController, setFaviconController] = useState<UploadTaskController | null>(null);


  const mainLogoInputRef = useRef<HTMLInputElement>(null);
  const secondaryLogoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const loadedSettings = await getOrganizationSettings();
        setSettings(loadedSettings);
        setName(loadedSettings.organizationName);
        setMainLogoPreview(loadedSettings.mainLogoUrl);
        setSecondaryLogoPreview(loadedSettings.secondaryLogoUrl);
        setFaviconPreview(loadedSettings.faviconUrl);
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
      if(file.size > 4 * 1024 * 1024) { 
        toast({
          variant: "destructive",
          title: "Fichier trop volumineux",
          description: "Veuillez sélectionner une image de moins de 4 Mo.",
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

  const handleSaveName = async () => {
    setIsSavingName(true);
    try {
      await saveOrganizationName(name);
      setSettings(prev => prev ? { ...prev, organizationName: name } : { organizationName: name, mainLogoUrl: '', secondaryLogoUrl: '', faviconUrl: '' });
      setHasNameChanged(false);
      toast({
        title: "Nom de l'organisation mis à jour",
      });
      // Force reload to update app-wide settings like title
      window.location.reload();
    } catch (error) {
       toast({ variant: "destructive", title: "Erreur", description: "Impossible de sauvegarder le nom." });
    } finally {
      setIsSavingName(false);
    }
  };
  
  const handleSaveFile = async (fileType: 'main' | 'secondary' | 'favicon') => {
      let file: File | null = null;
      let setProgress: React.Dispatch<React.SetStateAction<number | null>> = () => {};
      let setController: React.Dispatch<React.SetStateAction<UploadTaskController | null>> = () => {};
      let setHasChanged: React.Dispatch<React.SetStateAction<boolean>> = () => {};
      let setFileState: React.Dispatch<React.SetStateAction<File | null>> = () => {};
      let setPreviewState: React.Dispatch<React.SetStateAction<string>> = () => {};

      switch(fileType) {
        case 'main':
          file = mainLogoFile;
          setProgress = setMainLogoProgress;
          setController = setMainLogoController;
          setHasChanged = setHasMainLogoChanged;
          setFileState = setMainLogoFile;
          setPreviewState = setMainLogoPreview;
          break;
        case 'secondary':
          file = secondaryLogoFile;
          setProgress = setSecondaryLogoProgress;
          setController = setSecondaryLogoController;
          setHasChanged = setHasSecondaryLogoChanged;
          setFileState = setSecondaryLogoFile;
          setPreviewState = setSecondaryLogoPreview;
          break;
        case 'favicon':
          file = faviconFile;
          setProgress = setFaviconProgress;
          setController = setFaviconController;
          setHasChanged = setHasFaviconChanged;
          setFileState = setFaviconFile;
          setPreviewState = setFaviconPreview;
          break;
      }
      
      if (!file) return;

      setProgress(0);

      try {
          const newUrl = await uploadOrganizationFile(
              fileType,
              file,
              (p) => setProgress(p), 
              (c) => setController(c)
          );
          
          setSettings(prev => ({...prev!, [`${fileType}LogoUrl`]: newUrl}));
          setPreviewState(newUrl);
          setHasChanged(false);
          setFileState(null);

          toast({
            title: "Sauvegarde réussie",
            description: `Le ${fileType === 'favicon' ? 'favicon' : 'logo'} a été mis à jour.`,
          });
           if(fileType === 'favicon') window.location.reload();

      } catch (error: any) {
          if (error.code !== 'storage/canceled') {
              toast({
                  variant: "destructive",
                  title: "Erreur de sauvegarde",
                  description: "Une erreur est survenue lors du téléversement ou du traitement de l'image.",
              });
              console.error(error);
          } else {
            toast({ title: 'Téléversement annulé' });
          }
      } finally {
         setProgress(null);
         setController(null);
      }
  };

  const handleCancelUpload = (controller: UploadTaskController | null) => {
    if (controller) {
        controller.cancel();
    }
  }


  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">Paramètres de l'Organisation</h1>
      
      {loading ? (
        <Card>
            <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
            <CardContent><Skeleton className="h-32 w-full" /></CardContent>
        </Card>
      ) : (
        <Card>
            <CardHeader>
            <CardTitle>Nom de l'Organisation</CardTitle>
            <CardDescription>
                Modifiez le nom de l'application affiché dans l'interface.
            </CardDescription>
            </CardHeader>
            <CardContent>
                <Label htmlFor="org-name">Nom</Label>
                <Input 
                    id="org-name" 
                    value={name} 
                    onChange={e => { setName(e.target.value); setHasNameChanged(true); }}
                />
            </CardContent>
            <CardFooter>
                <Button onClick={handleSaveName} disabled={isSavingName || !hasNameChanged}>
                    {isSavingName ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Enregistrer le nom
                </Button>
            </CardFooter>
        </Card>
      )}

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
                      <p className="text-xs text-muted-foreground mb-2">Utilisé dans la barre latérale et sur les documents.</p>
                      <Button type="button" variant="outline" size="sm" onClick={() => mainLogoInputRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" />
                        Changer le logo
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">Taille max : 4 Mo. L'IA supprimera l'arrière-plan.</p>
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
                             <div className="flex items-center gap-2">
                                <Progress value={mainLogoProgress} className="h-2 flex-1" />
                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCancelUpload(mainLogoController)}>
                                    <X className="h-4 w-4" />
                                    <span className="sr-only">Annuler</span>
                                </Button>
                             </div>
                        </div>
                      )}
                  </div>
                </div>
                <div className="flex justify-end">
                    <Button 
                        type="button" 
                        onClick={() => handleSaveFile('main')} 
                        disabled={mainLogoProgress !== null || !hasMainLogoChanged}
                    >
                        {mainLogoProgress !== null ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
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
                      <p className="text-xs text-muted-foreground mt-2">Taille max : 4 Mo. L'IA supprimera l'arrière-plan.</p>
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
                             <div className="flex items-center gap-2">
                                <Progress value={secondaryLogoProgress} className="h-2 flex-1" />
                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCancelUpload(secondaryLogoController)}>
                                    <X className="h-4 w-4" />
                                    <span className="sr-only">Annuler</span>
                                </Button>
                             </div>
                        </div>
                      )}
                  </div>
                </div>
                 <div className="flex justify-end">
                    <Button 
                        type="button" 
                        onClick={() => handleSaveFile('secondary')} 
                        disabled={secondaryLogoProgress !== null || !hasSecondaryLogoChanged}
                    >
                        {secondaryLogoProgress !== null ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
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
                      <p className="text-xs text-muted-foreground mt-2">Taille max : 4 Mo.</p>
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
                             <div className="flex items-center gap-2">
                                <Progress value={faviconProgress} className="h-2 flex-1" />
                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCancelUpload(faviconController)}>
                                    <X className="h-4 w-4" />
                                    <span className="sr-only">Annuler</span>
                                </Button>
                             </div>
                        </div>
                      )}
                  </div>
                </div>
                 <div className="flex justify-end">
                    <Button 
                        type="button" 
                        onClick={() => handleSaveFile('favicon')} 
                        disabled={faviconProgress !== null || !hasFaviconChanged}
                    >
                        {faviconProgress !== null ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
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
