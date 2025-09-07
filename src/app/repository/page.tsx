
"use client";

import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { uploadDocument, subscribeToDocuments } from "@/services/repository-service";
import type { Document } from "@/lib/data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Loader2 } from "lucide-react";
import { useDropzone } from 'react-dropzone';

export default function RepositoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFilesToUpload(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
  });

  const removeFile = (fileName: string) => {
    setFilesToUpload(prev => prev.filter(f => f.name !== fileName));
  }

  const handleUpload = async () => {
    if (filesToUpload.length === 0 || !user) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
        let totalUploaded = 0;
        const totalFiles = filesToUpload.length;

        for (const file of filesToUpload) {
            await uploadDocument(file, user.id);
            totalUploaded++;
            setUploadProgress((totalUploaded / totalFiles) * 100);
        }

        toast({
            title: "Téléversement terminé",
            description: `${totalFiles} fichier(s) ont été ajoutés au référentiel.`,
        });
        setFilesToUpload([]);
    } catch (err) {
        console.error("Upload failed", err);
        toast({
            variant: "destructive",
            title: "Erreur de téléversement",
            description: "Un problème est survenu. Veuillez réessayer."
        });
    } finally {
        setIsUploading(false);
        setUploadProgress(0);
    }
  };


  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Référentiel Documentaire</h1>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
            <Card {...getRootProps()} className={`transition-colors ${isDragActive ? 'border-primary bg-primary/10' : ''}`}>
                <CardHeader>
                    <CardTitle>Téléverser des Documents</CardTitle>
                    <CardDescription>
                        Glissez-déposez vos fichiers ici ou utilisez le bouton pour les sélectionner.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground text-center">
                                    <span className="font-semibold">Cliquez pour choisir</span> ou glissez-déposez
                                </p>
                            </div>
                            <input {...getInputProps()} id="dropzone-file" type="file" className="hidden" multiple />
                        </label>
                    </div>
                     {filesToUpload.length > 0 && (
                        <div className="mt-4 space-y-2">
                            <p className="text-sm font-medium">Fichiers à téléverser :</p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground">
                                {filesToUpload.map(file => <li key={file.name}>{file.name} <button onClick={() => removeFile(file.name)} className="text-destructive text-xs ml-2">[X]</button></li>)}
                            </ul>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button onClick={handleUpload} disabled={isUploading || filesToUpload.length === 0}>
                        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        {isUploading ? 'Envoi...' : `Envoyer ${filesToUpload.length} fichier(s)`}
                    </Button>
                </CardFooter>
            </Card>
            {isUploading && <Progress value={uploadProgress} className="mt-2" />}
        </div>
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Documents Récents</CardTitle>
                    <CardDescription>
                        Les derniers documents ajoutés au référentiel.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">La liste des documents s'affichera ici.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
