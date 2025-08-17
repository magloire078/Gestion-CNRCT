
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
import { Upload, Loader2, Save, X, Building2, Globe, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { getOrganizationSettings, saveOrganizationName, uploadOrganizationFile } from "@/services/organization-service";
import { Skeleton } from "@/components/ui/skeleton";
import type { OrganizationSettings } from "@/lib/data";

type FileType = 'mainLogo' | 'secondaryLogo' | 'favicon';

interface FileState {
    file: File | null;
    preview: string;
    isSaving: boolean;
}

export default function OrganizationSettingsPage() {
    const { toast } = useToast();
    
    const [name, setName] = useState("");
    const [initialName, setInitialName] = useState("");
    const [isSavingName, setIsSavingName] = useState(false);

    const [files, setFiles] = useState<Record<FileType, FileState>>({
        mainLogo: { file: null, preview: "", isSaving: false },
        secondaryLogo: { file: null, preview: "", isSaving: false },
        favicon: { file: null, preview: "", isSaving: false },
    });
    
    const [loading, setLoading] = useState(true);
    
    const mainLogoInputRef = useRef<HTMLInputElement>(null);
    const secondaryLogoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        async function loadSettings() {
            setLoading(true);
            try {
                const loadedSettings = await getOrganizationSettings();
                setName(loadedSettings.organizationName);
                setInitialName(loadedSettings.organizationName);
                setFiles({
                    mainLogo: { file: null, preview: loadedSettings.mainLogoUrl, isSaving: false },
                    secondaryLogo: { file: null, preview: loadedSettings.secondaryLogoUrl, isSaving: false },
                    favicon: { file: null, preview: loadedSettings.faviconUrl, isSaving: false },
                });
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: FileType) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 4 * 1024 * 1024) { 
                toast({
                    variant: "destructive",
                    title: "Fichier trop volumineux",
                    description: "Veuillez sélectionner une image de moins de 4 Mo.",
                });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFiles(prev => ({
                    ...prev,
                    [fileType]: { ...prev[fileType], file, preview: reader.result as string }
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveName = async () => {
        setIsSavingName(true);
        try {
            await saveOrganizationName(name);
            setInitialName(name);
            toast({ title: "Nom de l'organisation mis à jour" });
            // Optional: force reload to update app-wide settings like title, though this is disruptive.
            // window.location.reload(); 
        } catch (error) {
           toast({ variant: "destructive", title: "Erreur", description: "Impossible de sauvegarder le nom." });
        } finally {
          setIsSavingName(false);
        }
    };
  
    const handleSaveFile = async (fileType: FileType) => {
        const fileState = files[fileType];
        if (!fileState.file) return;

        setFiles(prev => ({ ...prev, [fileType]: { ...prev[fileType], isSaving: true } }));

        try {
            const newUrl = await uploadOrganizationFile(fileType, fileState.file);
            
            setFiles(prev => ({
                ...prev,
                [fileType]: { file: null, preview: newUrl || prev[fileType].preview, isSaving: false }
            }));

            toast({
                title: "Sauvegarde réussie",
                description: `Le fichier a été mis à jour.`,
            });
            
            if (fileType === 'favicon' || fileType === 'mainLogo') {
                 toast({ description: "Rechargement de la page pour appliquer les changements..."});
                 setTimeout(() => window.location.reload(), 2000);
            }

        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Erreur de sauvegarde",
                description: "Une erreur est survenue lors du téléversement de l'image.",
            });
            console.error(error);
            setFiles(prev => ({ ...prev, [fileType]: { ...prev[fileType], isSaving: false } }));
        }
    };
    
    if (loading) {
        return (
             <div className="flex flex-col gap-6 max-w-2xl mx-auto">
                <Skeleton className="h-8 w-1/3" />
                <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
             </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight">Paramètres de l'Organisation</h1>
            
            <Card>
                <CardHeader>
                    <CardTitle>Nom de l'Organisation</CardTitle>
                    <CardDescription>Modifiez le nom de l'application affiché dans l'interface.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="org-name">Nom</Label>
                        <Input id="org-name" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSaveName} disabled={isSavingName || name === initialName}>
                        {isSavingName ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Enregistrer le nom
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Identité Visuelle</CardTitle>
                    <CardDescription>Personnalisez les logos et le favicon de l'application.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                   <LogoUploader
                     title="Logo Principal"
                     description="Utilisé dans la barre latérale et sur les documents."
                     icon={Building2}
                     fileState={files.mainLogo}
                     onFileChange={(e) => handleFileChange(e, 'mainLogo')}
                     onSave={() => handleSaveFile('mainLogo')}
                     inputRef={mainLogoInputRef}
                   />
                   <Separator />
                   <LogoUploader
                     title="Logo Secondaire"
                     description="Utilisé sur la partie droite des documents."
                     icon={Globe}
                     fileState={files.secondaryLogo}
                     onFileChange={(e) => handleFileChange(e, 'secondaryLogo')}
                     onSave={() => handleSaveFile('secondaryLogo')}
                     inputRef={secondaryLogoInputRef}
                   />
                   <Separator />
                   <LogoUploader
                     title="Favicon"
                     description="Icône affichée dans l'onglet du navigateur (.ico, .png)."
                     icon={Heart}
                     fileState={files.favicon}
                     onFileChange={(e) => handleFileChange(e, 'favicon')}
                     onSave={() => handleSaveFile('favicon')}
                     inputRef={faviconInputRef}
                   />
                </CardContent>
            </Card>
        </div>
    );
}


interface LogoUploaderProps {
  title: string;
  description: string;
  icon: React.ElementType;
  fileState: FileState;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

function LogoUploader({ title, description, icon: Icon, fileState, onFileChange, onSave, inputRef }: LogoUploaderProps) {
    const { file, preview, isSaving } = fileState;
    return (
        <div className="space-y-4">
            <div className="flex items-start gap-6">
                <Avatar className="h-20 w-20 rounded-md">
                    <AvatarImage src={preview} alt={title} />
                    <AvatarFallback><Icon className="h-8 w-8 text-muted-foreground" /></AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <Label className="text-base font-medium">{title}</Label>
                    <p className="text-sm text-muted-foreground">{description}</p>
                    <p className="text-xs text-muted-foreground mt-1">Taille max : 4 Mo.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Changer
                </Button>
                <Input ref={inputRef} type="file" className="hidden" accept="image/png, image/jpeg, image/svg+xml, image/x-icon" onChange={onFileChange} />
            </div>
            {file && (
                <div className="flex justify-end">
                    <Button type="button" onClick={onSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Enregistrer le {title.toLowerCase()}
                    </Button>
                </div>
            )}
        </div>
    )
}
