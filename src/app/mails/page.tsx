"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import { format, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { 
    PlusCircle, Search, Loader2, Eye, Pencil, Trash2, 
    Download, ShieldAlert, AlertTriangle, CheckCircle2, 
    FileText, Mail, FileSpreadsheet, X, HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaginationControls } from "@/components/common/pagination-controls";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { exportToExcel } from "@/lib/export-utils";

// Service & Component Imports
import type { Mail as MailType, MailStatus, MailPriority, MailCategory, MailComment } from "@/lib/data";
import { 
    subscribeToMails, addMail, updateMail, deleteMail, 
    addMailComment, updateMailStatus 
} from "@/services/mail-service";
import { MailStatsCards } from "@/components/mails/mail-stats-cards";
import { AddMailSheet } from "@/components/mails/add-mail-sheet";
import { EditMailSheet } from "@/components/mails/edit-mail-sheet";
import { MailDetailSheet } from "@/components/mails/mail-detail-sheet";
import { cn } from "@/lib/utils";

const statusVariantMap: Record<MailStatus, string> = {
    "Nouveau": "bg-slate-100 text-slate-700 hover:bg-slate-100",
    "En cours": "bg-blue-100 text-blue-700 hover:bg-blue-100",
    "Traité": "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
    "Classé": "bg-slate-100 text-slate-700 hover:bg-slate-100",
};

const priorityVariantMap: Record<MailPriority, "default" | "secondary" | "outline" | "destructive"> = {
    "Basse": "secondary",
    "Moyenne": "outline",
    "Haute": "default",
    "Urgente": "destructive",
};

export default function MailPage() {
    const { hasPermission } = useAuth();
    const { toast } = useToast();

    // Verification permission
    const canRead = hasPermission("page:mails:view");
    const canCreate = hasPermission("mails:create") || hasPermission("page:admin:view");
    const canEdit = hasPermission("mails:update") || hasPermission("page:admin:view");
    const canDelete = hasPermission("mails:delete") || hasPermission("page:admin:view");

    // Mail State
    const [mails, setMails] = useState<MailType[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Active Sheet/Modal States
    const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
    const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
    const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
    const [selectedMail, setSelectedMail] = useState<MailType | null>(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<string>("Tous");
    const [selectedPriority, setSelectedPriority] = useState<string>("Tous");
    const [selectedCategory, setSelectedCategory] = useState<string>("Tous");
    const [activeTab, setActiveTab] = useState("Tous"); // Tous, Arrivant, Départ, Interne

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Delete Modal state
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [mailToDelete, setMailToDelete] = useState<MailType | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Subscribe to database changes
    useEffect(() => {
        if (!canRead) return;

        const unsubscribe = subscribeToMails(
            (fetchedMails) => {
                setMails(fetchedMails);
                setError(null);
            },
            (err) => {
                console.error("Failed to fetch mails:", err);
                setError("Impossible de charger le registre des courriers.");
                setMails([]);
            }
        );
        return () => unsubscribe();
    }, [canRead]);

    // Handle add mail
    const handleAddMail = async (mailData: Omit<MailType, "id" | "trackingId">) => {
        try {
            await addMail(mailData);
            toast({
                title: "Courrier enregistré",
                description: "Le courrier a été ajouté avec succès au registre.",
            });
        } catch (err: any) {
            console.error("Failed to add mail:", err);
            toast({
                variant: "destructive",
                title: "Erreur",
                description: err.message || "Échec de la création du courrier.",
            });
            throw err;
        }
    };

    // Handle edit mail
    const handleUpdateMail = async (id: string, updatedFields: Partial<Omit<MailType, "id">>) => {
        try {
            await updateMail(id, updatedFields);
            toast({
                title: "Courrier mis à jour",
                description: "Les informations du courrier ont été modifiées avec succès.",
            });
        } catch (err: any) {
            console.error("Failed to update mail:", err);
            toast({
                variant: "destructive",
                title: "Erreur",
                description: err.message || "Échec de la mise à jour.",
            });
            throw err;
        }
    };

    // Handle add note/comment
    const handleAddComment = async (mailId: string, commentData: Omit<MailComment, "id">) => {
        try {
            await addComment(mailId, commentData);
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Impossible d'ajouter le commentaire.",
            });
        }
    };

    // Local helper to sync state after comment updates
    const addComment = async (mailId: string, commentData: Omit<MailComment, "id">) => {
        await addMailComment(mailId, commentData);
        // Refresh details state if open
        if (selectedMail && selectedMail.id === mailId) {
            const updatedComments = selectedMail.comments ? [...selectedMail.comments] : [];
            const newComment: MailComment = {
                id: Math.random().toString(36).substring(2, 9),
                ...commentData,
                date: commentData.date || new Date().toISOString()
            };
            setSelectedMail({
                ...selectedMail,
                comments: [...updatedComments, newComment]
            });
        }
    };

    // Handle change status
    const handleUpdateStatus = async (mailId: string, status: MailStatus, author: string, reason?: string) => {
        try {
            await updateMailStatus(mailId, status, author, reason);
            toast({
                title: "Statut modifié",
                description: `Le courrier a été marqué comme "${status}".`,
            });
            // Update selected mail if open
            if (selectedMail && selectedMail.id === mailId) {
                const updatedComments = selectedMail.comments ? [...selectedMail.comments] : [];
                const systemComment: MailComment = {
                    id: Math.random().toString(36).substring(2, 9),
                    date: new Date().toISOString(),
                    author: "Système",
                    content: `Statut modifié en : ${status}. Par : ${author}${reason ? ` (Motif : ${reason})` : ''}`,
                    type: 'Statut'
                };
                setSelectedMail({
                    ...selectedMail,
                    status,
                    comments: [...updatedComments, systemComment]
                });
            }
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Échec de la mise à jour du statut.",
            });
        }
    };

    // Handle change assignee
    const handleUpdateAssignee = async (mailId: string, employeeId: string | undefined, employeeName: string | undefined) => {
        try {
            await updateMail(mailId, {
                assignedEmployeeId: employeeId || null as any,
                assignedEmployeeName: employeeName || null as any
            });
            // Update selected mail if open
            if (selectedMail && selectedMail.id === mailId) {
                setSelectedMail({
                    ...selectedMail,
                    assignedEmployeeId: employeeId || undefined,
                    assignedEmployeeName: employeeName || undefined
                });
            }
            toast({
                title: "Assignation mise à jour",
                description: employeeName ? `Courrier assigné à ${employeeName}.` : "Assignation retirée.",
            });
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Échec de l'assignation.",
            });
        }
    };

    // Handle delete mail
    const handleDeleteMail = async () => {
        if (!mailToDelete) return;
        setIsDeleting(true);
        try {
            await deleteMail(mailToDelete.id);
            toast({
                title: "Courrier supprimé",
                description: "Le courrier a été définitivement retiré du registre.",
            });
            setIsDeleteDialogOpen(false);
            setMailToDelete(null);
        } catch (err: any) {
            console.error(err);
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Échec de la suppression.",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    // Export to Excel
    const handleExportExcel = () => {
        if (!filteredMails || filteredMails.length === 0) return;
        
        const dataToExport = filteredMails.map(mail => ({
            "N° Enregistrement": mail.trackingId || "-",
            "Type": mail.type,
            "Objet": mail.title,
            "Expéditeur / Émetteur": mail.sender,
            "Destinataire": mail.recipient,
            "Catégorie": mail.category,
            "Priorité": mail.priority,
            "Statut": mail.status,
            "Date d'Entrée": mail.entryDate || "-",
            "Date Limite": mail.dueDate || "-",
            "Agent Assigné": mail.assignedEmployeeName || "Non assigné",
            "Créé le": mail.createdAt ? format(parseISO(mail.createdAt), "dd/MM/yyyy HH:mm") : "-"
        }));

        exportToExcel(dataToExport, `Registre_Courriers_${activeTab}_CNRCT`);
    };

    // Filter Logic
    const filteredMails = useMemo(() => {
        if (!mails) return [];
        return mails.filter(mail => {
            // Tab type filter
            if (activeTab !== "Tous" && mail.type !== activeTab) return false;

            // Search Term
            const matchesSearch = 
                mail.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                mail.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
                mail.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (mail.trackingId && mail.trackingId.toLowerCase().includes(searchTerm.toLowerCase()));

            if (!matchesSearch) return false;

            // Status Filter
            if (selectedStatus !== "Tous" && mail.status !== selectedStatus) return false;

            // Priority Filter
            if (selectedPriority !== "Tous" && mail.priority !== selectedPriority) return false;

            // Category Filter
            if (selectedCategory !== "Tous" && mail.category !== selectedCategory) return false;

            return true;
        });
    }, [mails, activeTab, searchTerm, selectedStatus, selectedPriority, selectedCategory]);

    // Pagination Calculation
    const totalPages = Math.ceil(filteredMails.length / itemsPerPage);
    const paginatedMails = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredMails.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredMails, currentPage, itemsPerPage]);

    // Handle page transitions on filters changing
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedStatus, selectedPriority, selectedCategory, activeTab]);

    if (!canRead) {
        return (
            <div className="flex flex-col items-center justify-center h-[500px] text-center p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
                <ShieldAlert className="h-16 w-16 text-rose-500 mb-4 animate-bounce" />
                <h2 className="text-xl font-bold text-slate-800">Accès Refusé</h2>
                <p className="text-sm text-slate-500 mt-2">Vous n'avez pas les permissions nécessaires pour accéder à la gestion des courriers.</p>
            </div>
        );
    }

    const isLoading = mails === null;

    return (
        <div className="p-6 space-y-6">
            
            {/* Header section */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Mail className="h-6 w-6 text-blue-600" />
                        Gestion des Courriers
                    </h1>
                    <p className="text-xs text-slate-500 font-medium">
                        Suivez, enregistrez et attribuez les courriers arrivants, départs et mémos internes du CNRCT.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 border-slate-200 hover:border-slate-300 font-bold text-xs flex items-center gap-1.5"
                        onClick={handleExportExcel}
                        disabled={filteredMails.length === 0}
                    >
                        <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                        Exporter Excel
                    </Button>

                    {canCreate && (
                        <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 flex items-center gap-1.5"
                            onClick={() => setIsAddSheetOpen(true)}
                        >
                            <PlusCircle className="h-4 w-4" />
                            Enregistrer un Courrier
                        </Button>
                    )}
                </div>
            </div>

            {/* Statistics Cards */}
            {!isLoading && <MailStatsCards mails={mails} />}

            {/* Dashboard Tabs & Filters */}
            <Card className="border-none shadow-xl shadow-slate-900/5 bg-white">
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between flex-wrap gap-4">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                        <TabsList className="bg-slate-100 border border-slate-200/50">
                            <TabsTrigger value="Tous" className="text-xs font-bold px-4">Tous</TabsTrigger>
                            <TabsTrigger value="Arrivant" className="text-xs font-bold px-4">Arrivants</TabsTrigger>
                            <TabsTrigger value="Départ" className="text-xs font-bold px-4">Départs</TabsTrigger>
                            <TabsTrigger value="Interne" className="text-xs font-bold px-4">Internes</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {/* Filter controls */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Search Input */}
                        <div className="relative w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Objet, Ref, Expéditeur..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 h-9 text-xs border-slate-200 bg-slate-50 focus:bg-white"
                            />
                            {searchTerm && (
                                <button 
                                    onClick={() => setSearchTerm("")} 
                                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                                    title="Effacer la recherche"
                                    aria-label="Effacer la recherche"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {/* Status Select */}
                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                            <SelectTrigger className="h-9 w-36 text-xs bg-slate-50 border-slate-200 font-semibold text-slate-700">
                                <SelectValue placeholder="Statut" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Tous">Tous Statuts</SelectItem>
                                <SelectItem value="Nouveau">Nouveau</SelectItem>
                                <SelectItem value="En cours">En cours</SelectItem>
                                <SelectItem value="Traité">Traité</SelectItem>
                                <SelectItem value="Classé">Classé</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Priority Select */}
                        <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                            <SelectTrigger className="h-9 w-36 text-xs bg-slate-50 border-slate-200 font-semibold text-slate-700">
                                <SelectValue placeholder="Priorité" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Tous">Toutes Priorités</SelectItem>
                                <SelectItem value="Basse">Basse</SelectItem>
                                <SelectItem value="Moyenne">Moyenne</SelectItem>
                                <SelectItem value="Haute">Haute</SelectItem>
                                <SelectItem value="Urgente">Urgente</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Category Select */}
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="h-9 w-36 text-xs bg-slate-50 border-slate-200 font-semibold text-slate-700">
                                <SelectValue placeholder="Catégorie" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Tous">Toutes Catégories</SelectItem>
                                <SelectItem value="Administratif">Administratif</SelectItem>
                                <SelectItem value="Financier">Financier</SelectItem>
                                <SelectItem value="Juridique">Juridique</SelectItem>
                                <SelectItem value="Technique">Technique</SelectItem>
                                <SelectItem value="RH">RH</SelectItem>
                                <SelectItem value="Autre">Autre</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-80 gap-3">
                            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                            <span className="text-xs font-semibold text-slate-500">Chargement du registre...</span>
                        </div>
                    ) : paginatedMails.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-80 text-center p-6">
                            <Mail className="h-12 w-12 text-slate-300 mb-3" />
                            <h3 className="text-sm font-bold text-slate-800">Aucun courrier trouvé</h3>
                            <p className="text-xs text-slate-400 mt-1 max-w-sm">Aucun enregistrement ne correspond aux filtres ou à la recherche actuels.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow className="border-b border-slate-100">
                                        <TableHead className="w-[120px] text-xs font-bold text-slate-500 uppercase tracking-wider pl-6">N° Enreg.</TableHead>
                                        <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Objet & Type</TableHead>
                                        <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expéditeur / Destinataire</TableHead>
                                        <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date limite / Reçu le</TableHead>
                                        <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assignation</TableHead>
                                        <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Statut</TableHead>
                                        <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-right pr-6">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedMails.map((mail) => {
                                        // Overdue calculation
                                        const isOverdue = mail.dueDate && 
                                            new Date(mail.dueDate) < new Date() && 
                                            mail.status !== 'Traité' && 
                                            mail.status !== 'Classé';

                                        return (
                                            <TableRow key={mail.id} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors">
                                                {/* Registration number */}
                                                <TableCell className="pl-6">
                                                    <span className="text-xs font-black text-slate-700 tracking-tight uppercase">
                                                        {mail.trackingId || "-"}
                                                    </span>
                                                </TableCell>

                                                {/* Title / Object & Type badge */}
                                                <TableCell>
                                                    <div className="space-y-1 max-w-[280px]">
                                                        <span className="text-xs font-bold text-slate-900 block truncate leading-snug">
                                                            {mail.title}
                                                        </span>
                                                        <div className="flex items-center gap-1.5">
                                                            <Badge variant="outline" className="text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded uppercase shrink-0">
                                                                {mail.type}
                                                            </Badge>
                                                            <span className="text-[10px] text-slate-400 font-semibold">{mail.category}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Sender & Recipient details */}
                                                <TableCell className="text-xs font-semibold">
                                                    <div className="space-y-0.5">
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">De :</span>
                                                            <span className="text-slate-800">{mail.sender}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">À :</span>
                                                            <span className="text-slate-800">{mail.recipient}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Date & Overdue notifications */}
                                                <TableCell className="text-xs font-semibold text-slate-600">
                                                    <div className="space-y-0.5">
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-slate-800">
                                                                {mail.entryDate ? format(parseISO(mail.entryDate), "dd/MM/yyyy") : "-"}
                                                            </span>
                                                        </div>
                                                        {mail.dueDate ? (
                                                            <div className="flex items-center gap-1">
                                                                <span className={cn(
                                                                    "text-[10px] font-bold uppercase tracking-wider",
                                                                    isOverdue ? "text-rose-500 animate-pulse" : "text-slate-400"
                                                                )}>
                                                                    Lim. : {format(parseISO(mail.dueDate), "dd/MM/yyyy")}
                                                                </span>
                                                                {isOverdue && <AlertTriangle className="h-3 w-3 text-rose-500 animate-bounce" />}
                                                            </div>
                                                        ) : (
                                                            <span className="text-[10px] text-slate-400 italic font-semibold">Pas de limite</span>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                {/* Assigned Employee */}
                                                <TableCell className="text-xs font-bold">
                                                    {mail.assignedEmployeeName ? (
                                                        <span className="text-slate-800">{mail.assignedEmployeeName}</span>
                                                    ) : (
                                                        <span className="text-slate-400 italic font-semibold">Non assigné</span>
                                                    )}
                                                </TableCell>

                                                {/* Status & Priority Badge */}
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={cn(
                                                            "text-[9px] px-2 py-0.5 rounded-full border font-black uppercase tracking-wider",
                                                            statusVariantMap[mail.status]
                                                        )}>
                                                            {mail.status}
                                                        </span>
                                                        <Badge variant={priorityVariantMap[mail.priority]} className="text-[9px] px-1.5 py-0">
                                                            {mail.priority}
                                                        </Badge>
                                                    </div>
                                                </TableCell>

                                                {/* Actions */}
                                                <TableCell className="text-right pr-6">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {/* Quick Attachment open */}
                                                        {mail.attachmentUrl && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 hover:bg-slate-100 hover:text-blue-600 rounded-full shrink-0"
                                                                asChild
                                                            >
                                                                <a href={mail.attachmentUrl} target="_blank" rel="noopener noreferrer" title="Ouvrir la pièce jointe">
                                                                    <FileText className="h-4 w-4" />
                                                                </a>
                                                            </Button>
                                                        )}

                                                        {/* Actions Dropdown */}
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    className="h-8 w-8 hover:bg-slate-100 rounded-full shrink-0"
                                                                    title="Actions"
                                                                    aria-label="Actions"
                                                                >
                                                                    <Eye className="h-4 w-4 text-slate-500" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-40 bg-white border border-slate-200 rounded-lg shadow-lg">
                                                                <DropdownMenuItem
                                                                    onClick={() => {
                                                                        setSelectedMail(mail);
                                                                        setIsDetailSheetOpen(true);
                                                                    }}
                                                                    className="text-xs font-semibold cursor-pointer"
                                                                >
                                                                    <Eye className="h-3.5 w-3.5 mr-2 text-slate-400" />
                                                                    Détails / Suivi
                                                                </DropdownMenuItem>

                                                                {canEdit && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setSelectedMail(mail);
                                                                            setIsEditSheetOpen(true);
                                                                        }}
                                                                        className="text-xs font-semibold cursor-pointer"
                                                                    >
                                                                        <Pencil className="h-3.5 w-3.5 mr-2 text-slate-400" />
                                                                        Modifier
                                                                    </DropdownMenuItem>
                                                                )}

                                                                {canDelete && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setMailToDelete(mail);
                                                                            setIsDeleteDialogOpen(true);
                                                                        }}
                                                                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer focus:bg-rose-50"
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5 mr-2 text-rose-400" />
                                                                        Supprimer
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Pagination */}
            {!isLoading && filteredMails.length > 0 && (
                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <PaginationControls
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        onItemsPerPageChange={setItemsPerPage}
                        totalItems={filteredMails.length}
                    />
                </div>
            )}

            {/* Dialogs and Sheets */}
            <AddMailSheet
                isOpen={isAddSheetOpen}
                onCloseAction={() => setIsAddSheetOpen(false)}
                onAddMailAction={handleAddMail}
            />

            <EditMailSheet
                isOpen={isEditSheetOpen}
                onCloseAction={() => {
                    setIsEditSheetOpen(false);
                    setSelectedMail(null);
                }}
                mail={selectedMail}
                onUpdateMailAction={handleUpdateMail}
            />

            <MailDetailSheet
                isOpen={isDetailSheetOpen}
                onCloseAction={() => {
                    setIsDetailSheetOpen(false);
                    setSelectedMail(null);
                }}
                mail={selectedMail}
                onAddCommentAction={handleAddComment}
                onUpdateStatusAction={handleUpdateStatus}
                onUpdateAssigneeAction={handleUpdateAssignee}
            />

            {/* Delete Alert Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="bg-white border border-slate-200 rounded-lg">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-slate-900 font-bold">Confirmer la suppression</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 text-xs">
                            Êtes-vous sûr de vouloir supprimer définitivement le courrier <strong className="text-slate-700">{mailToDelete?.trackingId}</strong> ? Cette action est irréversible et supprimera tout l'historique de traitement associé.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel asChild>
                            <Button variant="outline" className="border-slate-200 text-xs font-semibold" disabled={isDeleting}>
                                Annuler
                            </Button>
                        </AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <Button 
                                onClick={handleDeleteMail}
                                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs border-none"
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Suppression...
                                    </>
                                ) : (
                                    "Supprimer"
                                )}
                            </Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}
