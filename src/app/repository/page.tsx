
"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, FileText, Loader2, Download, PackageOpen, X, Search } from "lucide-react";
import { useDropzone } from 'react-dropzone';
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Octets';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Octets', 'Ko', 'Mo', 'Go', 'To'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


export default function RepositoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

   useEffect(() => {
    const unsubscribe = subscribeToDocuments(
      (docs) => {
        setDocuments(docs);
        setLoadingDocs(false);
      },
      (error) => {
        console.error("Failed to subscribe to documents", error);
        toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les documents." });
        setLoadingDocs(false);
      }
    );
    return () => unsubscribe();
  }, [toast]);


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
  
    const fileTypes = useMemo(() => {
        if (!documents) return [];
        const allTypes = documents.map(doc => {
            const parts = doc.fileName.split('.');
            return parts.length > 1 ? parts.pop()!.toUpperCase() : 'INCONNU';
        });
        return [...new Set(allTypes)].sort();
    }, [documents]);

    const filteredDocuments = useMemo(() => {
        return documents.filter(doc => {
            const matchesSearch = doc.fileName.toLowerCase().includes(searchTerm.toLowerCase());
            const fileExtension = (doc.fileName.split('.').pop() || '').toUpperCase();
            const matchesType = typeFilter === 'all' || fileExtension === typeFilter;
            return matchesSearch && matchesType;
        });
    }, [documents, searchTerm, typeFilter]);


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
                            <ul className="space-y-1">
                                {filesToUpload.map(file => (
                                    <li key={file.name} className="flex items-center justify-between text-sm text-muted-foreground">
                                        <span className="truncate pr-2">{file.name}</span>
                                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeFile(file.name)}><X className="h-3 w-3"/></Button>
                                    </li>
                                ))}
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
                    <CardTitle>Documents en Ligne</CardTitle>
                    <CardDescription>
                        Liste de tous les documents disponibles dans le référentiel.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder="Rechercher par nom..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Filtrer par type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les types</SelectItem>
                                {fileTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                     {loadingDocs ? (
                        <Skeleton className="h-48 w-full" />
                     ) : filteredDocuments.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>N°</TableHead>
                                    <TableHead>Nom du fichier</TableHead>
                                    <TableHead>Taille</TableHead>
                                    <TableHead>Date d'ajout</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredDocuments.map((doc, index) => (
                                    <TableRow key={doc.id}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            {doc.fileName}
                                        </TableCell>
                                        <TableCell>{formatBytes(doc.fileSize)}</TableCell>
                                        <TableCell>{format(parseISO(doc.uploadDate), 'dd/MM/yyyy', { locale: fr })}</TableCell>
                                        <TableCell className="text-right">
                                            <Button asChild variant="outline" size="sm">
                                                <Link href={doc.storageUrl} target="_blank" download={doc.fileName}>
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Télécharger
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
                            <PackageOpen className="h-12 w-12 text-muted-foreground" />
                            <p className="text-muted-foreground mt-4">Aucun document trouvé.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
