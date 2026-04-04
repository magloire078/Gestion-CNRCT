
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { Badge } from "@/components/ui/badge";
import { MapPin, MoreVertical, Eye, Pencil, Trash2, FileIcon, FileImage, FileStack, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { deleteDocument } from "@/services/repository-service";
import { getEmployee } from "@/services/employee-service";
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
} from "@/components/ui/dialog";
import { 
    LayoutGrid, 
    List, 
    Database, 
    Zap, 
    Clock3, 
    TrendingUp,
    FileCheck2,
    CalendarDays,
    ChevronRight,
    Library,
    ExternalLink
} from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { updateDocument } from "@/services/repository-service";


function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Octets';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Octets', 'Ko', 'Mo', 'Go', 'To'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


const CATEGORIES: Document['category'][] = [
    'Actes Royaux', 'Procès-Verbaux', 'Rapports d\'Activité', 'Courriers', 'Communication', 'Autres'
];

const REGIONS = [
    "Abidjan", "Agnéby-Tiassa", "Bafing", "Bagoué", "Bélier", "Béré", "Bounkani", 
    "Cavally", "Folon", "Gbeke", "Gboklè", "Goh", "Gontougo", "Grands-Ponts", 
    "Guémon", "Hambol", "Haut-Sassandra", "Iffou", "Indénié-Djuablin", "Kabadougou", 
    "Kavadougou", "Lôh-Djiboua", "Marahoué", "Mé", "N'Zi", "Nawa", "Poro", 
    "Région des Ponts", "San-Pédro", "Sud-Comoé", "Tchologo", "Tonkpi", "Worodougou", "Zanzan"
];

const CATEGORY_COLORS: Record<string, string> = {
    'Actes Royaux': 'bg-amber-100 text-amber-700 border-amber-200',
    'Procès-Verbaux': 'bg-blue-100 text-blue-700 border-blue-200',
    'Rapports d\'Activité': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Courriers': 'bg-purple-100 text-purple-700 border-purple-200',
    'Communication': 'bg-pink-100 text-pink-700 border-pink-200',
    'Autres': 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function RepositoryPage() {
    const { user } = useAuth();
    const { toast } = useToast();

    const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
    const [uploadCategory, setUploadCategory] = useState<Document['category']>('Autres');
    const [uploadRegion, setUploadRegion] = useState<string>("National");
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [documents, setDocuments] = useState<Document[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(true);

    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [regionFilter, setRegionFilter] = useState("all");
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

    // Modal States
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Calculated Stats
    const stats = useMemo(() => {
        if (!documents.length) return null;
        const totalSize = documents.reduce((acc, doc) => acc + (doc.fileSize || 0), 0);
        const lastUpload = documents.length > 0 ? documents[0].uploadDate : null;
        
        // Storage limit (simulated: 10GB = 10 * 1024 * 1024 * 1024 bytes)
        const STORAGE_LIMIT = 10 * 1024 * 1024 * 1024;
        const percentUsed = Math.round((totalSize / STORAGE_LIMIT) * 100);

        return {
            count: documents.length,
            sizeStr: formatBytes(totalSize),
            percentUsed,
            lastUpload
        };
    }, [documents]);

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

        // Regional Auto-Filter for COMITE REGIONAL
        if (user?.employeeId && user?.role?.name?.toLowerCase().includes('régional')) {
            getEmployee(user.employeeId).then(emp => {
                if (emp?.Region) {
                    setRegionFilter(emp.Region);
                }
            });
        }

        return () => unsubscribe();
    }, [toast, user]);

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
        if (!uploadCategory) {
            toast({ variant: "destructive", title: "Catégorie manquante", description: "Veuillez sélectionner une catégorie." });
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            let totalUploaded = 0;
            const totalFiles = filesToUpload.length;

            for (const file of filesToUpload) {
                await uploadDocument(file, user.id, { 
                    category: uploadCategory, 
                    region: uploadRegion === "National" ? undefined : uploadRegion 
                });
                totalUploaded++;
                setUploadProgress((totalUploaded / totalFiles) * 100);
            }

            toast({
                title: "Téléversement terminé",
                description: `${totalFiles} fichier(s) ont été ajoutés au référentiel.`,
            });
            setFilesToUpload([]);
            setUploadCategory('Autres');
            setUploadRegion("National");
        } catch (err: any) {
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

    const handleDelete = async () => {
        if (!selectedDoc) return;
        setIsDeleting(true);
        try {
            await deleteDocument(selectedDoc.id);
            toast({ title: "Document supprimé", description: "Le fichier a été retiré du référentiel." });
            setIsDeleteDialogOpen(false);
            setSelectedDoc(null);
        } catch (error) {
            console.error("Failed to delete", error);
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer le document." });
        } finally {
            setIsDeleting(false);
        }
    };

    const getFileIcon = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') return <FileText className="h-5 w-5 text-orange-500" />;
        if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) return <FileImage className="h-5 w-5 text-blue-500" />;
        return <FileIcon className="h-5 w-5 text-slate-400" />;
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
            const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
            const matchesRegion = regionFilter === 'all' || (doc.region || "National") === regionFilter;
            
            return matchesSearch && matchesType && matchesCategory && matchesRegion;
        });
    }, [documents, searchTerm, typeFilter, categoryFilter, regionFilter]);

    return (
        <PermissionGuard permission="page:repository:view">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                             <Library className="h-5 w-5 text-indigo-600" />
                             <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest text-indigo-600 border-indigo-200 bg-indigo-50">
                                 Archives Nationales Cloud
                             </Badge>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Référentiel Documentaire</h1>
                        <p className="text-slate-500 font-medium">Gestion souveraine du patrimoine informationnel du CNRCT.</p>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                        <Button 
                            variant={viewMode === 'table' ? 'secondary' : 'ghost'} 
                            size="sm" 
                            className={cn("h-8 px-3 rounded-lg font-bold text-xs shadow-none", viewMode === 'table' ? "bg-white shadow-sm" : "text-slate-500")}
                            onClick={() => setViewMode('table')}
                        >
                            <List className="h-3.5 w-3.5 mr-2" /> Liste
                        </Button>
                        <Button 
                            variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                            size="sm" 
                            className={cn("h-8 px-3 rounded-lg font-bold text-xs shadow-none", viewMode === 'grid' ? "bg-white shadow-sm" : "text-slate-500")}
                            onClick={() => setViewMode('grid')}
                        >
                            <LayoutGrid className="h-3.5 w-3.5 mr-2" /> Grille
                        </Button>
                    </div>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white group hover:shadow-2xl transition-all duration-500">
                        <CardHeader className="pb-2">
                            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <FileCheck2 className="h-5 w-5 text-indigo-600" />
                            </div>
                            <CardDescription className="text-[10px] font-black uppercase tracking-widest">Total Documents</CardDescription>
                            <CardTitle className="text-3xl font-black text-slate-900">{stats?.count || 0}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-[10px] text-slate-400 font-medium">Patrimoine numérique protégé</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-slate-900 group hover:shadow-2xl transition-all duration-500 text-white">
                        <CardHeader className="pb-2">
                            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center mb-2">
                                <Database className="h-5 w-5 text-white" />
                            </div>
                            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-white/60">Volume Cloud National</CardDescription>
                            <CardTitle className="text-3xl font-black">{stats?.sizeStr || "0 Octets"}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between text-[10px] items-end font-bold">
                                <span className="text-white/60 uppercase">Capacité</span>
                                <span>{stats?.percentUsed || 0}% de 10 Go</span>
                            </div>
                            <Progress value={stats?.percentUsed || 0} className="h-1.5 bg-white/10" indicatorClassName="bg-indigo-400" />
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white group hover:shadow-2xl transition-all duration-500">
                        <CardHeader className="pb-2">
                            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <Zap className="h-5 w-5 text-amber-600" />
                            </div>
                            <CardDescription className="text-[10px] font-black uppercase tracking-widest">Activité Récente</CardDescription>
                            <CardTitle className="text-xl font-black text-slate-900">Mise à jour</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <div className="flex items-center gap-2">
                               <Clock3 className="h-3 w-3 text-slate-400" />
                               <span className="text-[11px] font-bold text-slate-500">
                                   {stats?.lastUpload ? format(parseISO(stats.lastUpload), 'dd/MM/yyyy HH:mm', { locale: fr }) : "Aucune activité"}
                               </span>
                           </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white group hover:shadow-2xl transition-all duration-500">
                        <CardHeader className="pb-2">
                            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <TrendingUp className="h-5 w-5 text-emerald-600" />
                            </div>
                            <CardDescription className="text-[10px] font-black uppercase tracking-widest">Couverture Régionale</CardDescription>
                            <CardTitle className="text-3xl font-black text-slate-900">33</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-[10px] text-slate-400 font-medium">Conseils régionaux synchronisés</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Categories Visual Scroller */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <ChevronRight className="h-2 w-2 text-primary" strokeWidth={4} /> Parcourir les Sélections
                        </h3>
                    </div>
                    <ScrollArea className="w-full whitespace-nowrap pb-4">
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setCategoryFilter('all')}
                                className={cn(
                                    "flex flex-col items-start gap-4 p-5 rounded-[2rem] border min-w-[200px] transition-all duration-300 text-left",
                                    categoryFilter === 'all' 
                                        ? "bg-slate-900 text-white border-transparent shadow-xl shadow-slate-900/20" 
                                        : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                                )}
                            >
                                <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center", categoryFilter === 'all' ? "bg-white/10" : "bg-slate-100")}>
                                    <FileStack className={cn("h-5 w-5", categoryFilter === 'all' ? "text-white" : "text-slate-500")} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Tous</p>
                                    <p className="text-sm font-bold">Référentiel Global</p>
                                </div>
                            </button>

                            {CATEGORIES.map(cat => (
                                <button 
                                    key={cat}
                                    onClick={() => setCategoryFilter(cat!)}
                                    className={cn(
                                        "flex flex-col items-start gap-4 p-5 rounded-[2rem] border min-w-[200px] transition-all duration-300 text-left",
                                        categoryFilter === cat 
                                            ? "bg-indigo-600 text-white border-transparent shadow-xl shadow-indigo-600/20" 
                                            : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                                    )}
                                >
                                    <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center", categoryFilter === cat ? "bg-white/10" : "bg-slate-100")}>
                                        <FileText className={cn("h-5 w-5", categoryFilter === cat ? "text-white" : "text-slate-500")} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{cat?.split(' ')[0]}</p>
                                        <p className="text-sm font-bold">{cat}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </div>

                <div className="grid lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-1 space-y-6">
                        <Card {...getRootProps()} className={`transition-colors border-dashed ${isDragActive ? 'border-primary bg-primary/10' : ''}`}>
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg">Ajouter des fichiers</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-center w-full">
                                    <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Upload className="w-6 h-6 mb-2 text-muted-foreground" />
                                            <p className="text-xs text-muted-foreground text-center px-4">
                                                Glissez-déposez ou <span className="font-bold text-primary underline">parcourez</span>
                                            </p>
                                        </div>
                                        <input {...getInputProps()} id="dropzone-file" type="file" className="hidden" multiple />
                                    </label>
                                </div>

                                {filesToUpload.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                                            {filesToUpload.map(file => (
                                                <div key={file.name} className="flex items-center justify-between text-[11px] bg-muted/40 p-1.5 rounded border">
                                                    <span className="truncate pr-2 font-medium">{file.name}</span>
                                                    <Button variant="ghost" size="icon" className="h-4 w-4 shrink-0" onClick={() => removeFile(file.name)}><X className="h-3 w-3" /></Button>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-3 pt-3 border-t">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase text-slate-500">Catégorie</label>
                                                <Select value={uploadCategory} onValueChange={(v) => setUploadCategory(v as any)}>
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {CATEGORIES.map(cat => <SelectItem key={cat} value={cat!}>{cat}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase text-slate-500">Région concernée</label>
                                                <Select value={uploadRegion} onValueChange={setUploadRegion}>
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="National">National (Global)</SelectItem>
                                                        {REGIONS.map(reg => <SelectItem key={reg} value={reg}>{reg}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <Button onClick={handleUpload} disabled={isUploading} className="w-full h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700">
                                                {isUploading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Upload className="mr-2 h-3 w-3" />}
                                                {isUploading ? 'Envoi...' : `Publier ${filesToUpload.length} fichier(s)`}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        {isUploading && <Progress value={uploadProgress} className="h-1" />}
                    </div>

                    <div className="lg:col-span-3">
                        <Card className="border-none shadow-none bg-transparent">
                            <CardHeader className="px-0 pt-0">
                                <div className="flex flex-col md:flex-row gap-3">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            placeholder="Rechercher un document..."
                                            className="pl-9 h-10 border-slate-200"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                            <SelectTrigger className="w-[140px] h-10 text-xs rounded-xl font-bold border-slate-200">
                                                <SelectValue placeholder="Catégorie" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl font-bold">
                                                <SelectItem value="all">Toutes Catégories</SelectItem>
                                                {CATEGORIES.map(cat => <SelectItem key={cat} value={cat!}>{cat}</SelectItem>)}
                                            </SelectContent>
                                        </Select>

                                        <Select value={regionFilter} onValueChange={setRegionFilter}>
                                            <SelectTrigger className="w-[140px] h-10 text-xs rounded-xl font-bold border-slate-200">
                                                <SelectValue placeholder="Région" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl font-bold">
                                                <SelectItem value="all">Toutes Régions</SelectItem>
                                                <SelectItem value="National">National</SelectItem>
                                                {REGIONS.map(reg => <SelectItem key={reg} value={reg}>{reg}</SelectItem>)}
                                            </SelectContent>
                                        </Select>

                                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                                            <SelectTrigger className="w-[110px] h-10 text-xs rounded-xl font-bold border-slate-200">
                                                <SelectValue placeholder="Type" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl font-bold">
                                                <SelectItem value="all">Extensions</SelectItem>
                                                {fileTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                            </SelectContent>
                                        </Select>

                                        <div className="flex bg-slate-100/50 p-1 rounded-xl ml-auto border border-slate-200/50">
                                            <Button 
                                                variant={viewMode === 'table' ? "secondary" : "ghost"} 
                                                size="sm" 
                                                className={cn("h-8 px-3 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all", viewMode === 'table' ? "bg-white shadow-sm text-indigo-600" : "text-slate-400 hover:text-slate-600")}
                                                onClick={() => setViewMode('table')}
                                            >
                                                <List className="h-3.5 w-3.5 mr-2" /> Liste
                                            </Button>
                                            <Button 
                                                variant={viewMode === 'grid' ? "secondary" : "ghost"} 
                                                size="sm" 
                                                className={cn("h-8 px-3 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all", viewMode === 'grid' ? "bg-white shadow-sm text-indigo-600" : "text-slate-400 hover:text-slate-600")}
                                                onClick={() => setViewMode('grid')}
                                            >
                                                <LayoutGrid className="h-3.5 w-3.5 mr-2" /> Grille
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="px-0 pt-6">
                                <div className="rounded-[2rem] border-none bg-transparent overflow-hidden">
                                    {loadingDocs ? (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <Skeleton className="h-48 rounded-3xl" />
                                            <Skeleton className="h-48 rounded-3xl" />
                                            <Skeleton className="h-48 rounded-3xl" />
                                        </div>
                                    ) : filteredDocuments.length > 0 ? (
                                        viewMode === 'table' ? (
                                            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-slate-50/50 border-b-slate-100">
                                                            <TableHead className="w-12 font-bold text-xs uppercase text-slate-500">#</TableHead>
                                                            <TableHead className="font-bold text-xs uppercase text-slate-500">Document</TableHead>
                                                            <TableHead className="font-bold text-xs uppercase text-slate-500">Catégorie</TableHead>
                                                            <TableHead className="font-bold text-xs uppercase text-slate-500 px-4">Portée</TableHead>
                                                            <TableHead className="font-bold text-xs uppercase text-slate-500">Date de Publication</TableHead>
                                                            <TableHead className="text-right font-bold text-xs uppercase text-slate-500">Actions</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {filteredDocuments.map((doc, index) => (
                                                            <TableRow key={doc.id} className="group hover:bg-slate-50/80 transition-colors border-b-slate-50">
                                                                <TableCell className="text-slate-400 font-mono text-[10px] pl-6">{index + 1}</TableCell>
                                                                <TableCell>
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                                                                            {getFileIcon(doc.fileName)}
                                                                        </div>
                                                                        <div className="flex flex-col min-w-0">
                                                                            <span className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors truncate max-w-[200px] md:max-w-[300px]">
                                                                                {doc.fileName}
                                                                            </span>
                                                                            <span className="text-[10px] text-slate-400 font-medium tracking-tight uppercase">{formatBytes(doc.fileSize)} • {(doc.fileName.split('.').pop() || '').toUpperCase()}</span>
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge variant="outline" className={cn("text-[10px] font-black uppercase tracking-tight px-2.5 py-1 rounded-lg border-0", CATEGORY_COLORS[doc.category || 'Autres'])}>
                                                                        {doc.category || 'Non classé'}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="px-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="h-2 w-2 rounded-full bg-slate-200" />
                                                                        <span className="text-xs font-bold text-slate-600">{doc.region || 'National'}</span>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-xs font-bold text-slate-500">
                                                                    {format(parseISO(doc.uploadDate), 'dd MMM yyyy', { locale: fr })}
                                                                </TableCell>
                                                                <TableCell className="text-right pr-6">
                                                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <Button 
                                                                            variant="ghost" 
                                                                            size="sm" 
                                                                            className="h-8 w-8 p-0 hover:bg-slate-100 rounded-lg"
                                                                            onClick={() => { setSelectedDoc(doc); setIsPreviewOpen(true); }}
                                                                        >
                                                                            <Eye className="h-4 w-4" />
                                                                        </Button>
                                                                        
                                                                        <DropdownMenu>
                                                                            <DropdownMenuTrigger asChild>
                                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
                                                                                    <MoreVertical className="h-4 w-4" />
                                                                                </Button>
                                                                            </DropdownMenuTrigger>
                                                                            <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-slate-100">
                                                                                <DropdownMenuItem onSelect={() => { setSelectedDoc(doc); setIsEditOpen(true); }} className="rounded-xl font-medium">
                                                                                    <Pencil className="mr-2 h-4 w-4" /> Modifier métadonnées
                                                                                </DropdownMenuItem>
                                                                                <DropdownMenuItem asChild className="rounded-xl font-medium">
                                                                                    <Link href={doc.storageUrl} target="_blank" download={doc.fileName}>
                                                                                        <Download className="mr-2 h-4 w-4" /> Télécharger
                                                                                    </Link>
                                                                                </DropdownMenuItem>
                                                                                <div className="h-px bg-slate-100 my-2 px-2" />
                                                                                <DropdownMenuItem 
                                                                                    onSelect={() => { setSelectedDoc(doc); setIsDeleteDialogOpen(true); }}
                                                                                    className="text-red-500 rounded-xl font-bold focus:text-red-600 focus:bg-red-50"
                                                                                >
                                                                                    <Trash2 className="mr-2 h-4 w-4" /> Supprimer du Vault
                                                                                </DropdownMenuItem>
                                                                            </DropdownMenuContent>
                                                                        </DropdownMenu>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {filteredDocuments.map((doc) => (
                                                    <Card key={doc.id} className="border-none shadow-xl shadow-slate-200/40 rounded-[2rem] overflow-hidden group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                                                        <CardHeader className="p-6 pb-2">
                                                            <div className="flex justify-between items-start mb-4">
                                                                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm transition-transform group-hover:scale-110">
                                                                    {getFileIcon(doc.fileName)}
                                                                </div>
                                                                <Badge variant="outline" className={cn("text-[10px] font-black uppercase tracking-tight px-2.5 py-1 rounded-lg border-0", CATEGORY_COLORS[doc.category || 'Autres'])}>
                                                                    {doc.category || 'Non classé'}
                                                                </Badge>
                                                            </div>
                                                            <CardTitle className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight line-clamp-2 min-h-[2.5rem]">
                                                                {doc.fileName}
                                                            </CardTitle>
                                                            <CardDescription className="flex items-center gap-2 mt-2">
                                                                <CalendarDays className="h-3 w-3" />
                                                                <span className="text-[11px] font-bold text-slate-500">{format(parseISO(doc.uploadDate), 'dd MMMM yyyy', { locale: fr })}</span>
                                                            </CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="p-6 pt-2">
                                                            <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400">
                                                                <span className="flex items-center gap-1.5 uppercase"><Database className="h-3 w-3" /> {formatBytes(doc.fileSize)}</span>
                                                                <span className="flex items-center gap-1.5 uppercase"><MapPin className="h-3 w-3" /> {doc.region || 'National'}</span>
                                                            </div>
                                                        </CardContent>
                                                        <CardFooter className="p-4 bg-slate-50/50 flex gap-2">
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm" 
                                                                className="flex-1 h-9 rounded-xl font-bold text-xs bg-white border-slate-200"
                                                                onClick={() => { setSelectedDoc(doc); setIsPreviewOpen(true); }}
                                                            >
                                                                <Eye className="h-3.5 w-3.5 mr-2" /> Aperçu
                                                            </Button>
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm" 
                                                                className="h-9 w-9 rounded-xl border-slate-200"
                                                                onClick={() => { setSelectedDoc(doc); setIsEditOpen(true); }}
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </CardFooter>
                                                    </Card>
                                                ))}
                                            </div>
                                        )
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-24 bg-white/50 rounded-[3rem] border-2 border-dashed border-slate-200">
                                            <div className="p-6 rounded-full bg-slate-100 mb-6">
                                                <PackageOpen className="h-12 w-12 text-slate-300" />
                                            </div>
                                            <h3 className="text-xl font-black text-slate-900">Le coffre est vide</h3>
                                            <p className="text-slate-500 font-medium max-w-[300px] text-center mt-2">
                                                Aucun document ne correspond à vos critères de recherche actuels.
                                            </p>
                                            <Button 
                                                variant="outline" 
                                                className="mt-6 rounded-xl font-bold"
                                                onClick={() => {
                                                    setSearchTerm("");
                                                    setCategoryFilter("all");
                                                    setRegionFilter("all");
                                                    setTypeFilter("all");
                                                }}
                                            >
                                                Réinitialiser les filtres
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Modals for Document Actions */}
                <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                    <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
                        <DialogHeader className="p-6 pb-2 border-b bg-white">
                            <div className="flex justify-between items-start">
                                <div>
                                    <DialogTitle className="text-xl font-black">{selectedDoc?.fileName}</DialogTitle>
                                    <DialogDescription className="text-xs font-bold text-indigo-600 uppercase mt-1">
                                        {selectedDoc?.category} • {selectedDoc?.region || 'National'}
                                    </DialogDescription>
                                </div>
                                <div className="flex gap-2">
                                    {selectedDoc && (
                                        <Button asChild variant="outline" size="sm" className="rounded-xl font-bold border-slate-200">
                                            <Link href={selectedDoc.storageUrl} target="_blank">
                                                <ExternalLink className="h-4 w-4 mr-2" /> Ouvrir en Plein Écran
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </DialogHeader>
                        <div className="flex-1 bg-slate-50 relative min-h-0">
                            {selectedDoc ? (
                                <iframe 
                                    src={selectedDoc.storageUrl} 
                                    className="w-full h-full border-none"
                                    title="Aperçu du document"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="sm:max-w-[425px] rounded-[2rem] shadow-2xl border-none">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black">Modifier les Métadonnées</DialogTitle>
                            <DialogDescription className="font-medium text-slate-500">
                                Mettez à jour les informations de classification de ce document institutionnel.
                            </DialogDescription>
                        </DialogHeader>
                        {selectedDoc && (
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const updates = {
                                    category: formData.get('category') as Document['category'],
                                    region: formData.get('region') as string,
                                };
                                updateDocument(selectedDoc.id, updates)
                                    .then(() => setIsEditOpen(false))
                                    .catch((err: any) => console.error("Update error:", err));
                            }} className="space-y-6 pt-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Catégorie d&apos;Archive</label>
                                    <Select name="category" defaultValue={selectedDoc.category}>
                                        <SelectTrigger className="rounded-xl h-12 border-slate-200 font-bold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl font-bold">
                                            {CATEGORIES.map(cat => <SelectItem key={cat} value={cat!}>{cat}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Région de Portée</label>
                                    <Select name="region" defaultValue={selectedDoc.region || 'National'}>
                                        <SelectTrigger className="rounded-xl h-12 border-slate-200 font-bold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl font-bold">
                                            <SelectItem value="National">National (Général)</SelectItem>
                                            {REGIONS.map(reg => <SelectItem key={reg} value={reg}>{reg}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button type="submit" className="w-full h-12 rounded-xl font-black bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
                                    Enregistrer dans le Vault
                                </Button>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-black">Confirmer la Suppression ?</AlertDialogTitle>
                            <AlertDialogDescription className="font-medium text-slate-500">
                                Cette action retirera définitivement <span className="font-bold text-slate-900">{selectedDoc?.fileName}</span> du coffre-fort numérique. Cette opération est irréversible.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-3 sm:gap-2">
                            <AlertDialogCancel className="rounded-xl font-bold h-11 border-slate-200">Annuler</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (selectedDoc) {
                                        setIsDeleting(true);
                                        deleteDocument(selectedDoc.id)
                                            .then(() => {
                                                setIsDeleteDialogOpen(false);
                                                setIsDeleting(false);
                                            });
                                    }
                                }}
                                className="rounded-xl font-black h-11 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200 focus:ring-red-600"
                                disabled={isDeleting}
                            >
                                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                Supprimer Définitivement
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </PermissionGuard>
    );
}
