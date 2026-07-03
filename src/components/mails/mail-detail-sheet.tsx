"use client";

import { useState, useEffect } from "react";
import { format, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Mail, MailStatus, MailComment, Employe } from "@/lib/data";
import { getEmployeeDirectory } from "@/services/employee-service";
import { cn } from "@/lib/utils";
import { 
  FileText, MessageSquare, Clock, CheckCircle2, 
  HelpCircle, UserPlus, AlertCircle, Loader2, Download,
  ExternalLink, Calendar, Check, ChevronsUpDown
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface MailDetailSheetProps {
  isOpen: boolean;
  onCloseAction: () => void;
  mail: Mail | null;
  onAddCommentAction: (mailId: string, comment: Omit<MailComment, "id">) => Promise<void>;
  onUpdateStatusAction: (mailId: string, status: MailStatus, author: string, reason?: string) => Promise<void>;
  onUpdateAssigneeAction: (mailId: string, employeeId: string | undefined, employeeName: string | undefined) => Promise<void>;
}

const statusColors: Record<MailStatus, string> = {
  "Nouveau": "bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200",
  "En cours": "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200",
  "Traité": "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200",
  "Classé": "bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200",
};

const priorityColors = {
  "Basse": "bg-slate-100 text-slate-600 border-slate-200",
  "Moyenne": "bg-blue-100 text-blue-600 border-blue-200",
  "Haute": "bg-amber-100 text-amber-700 border-amber-200",
  "Urgente": "bg-rose-100 text-rose-700 border-rose-200 animate-pulse",
};

const typeIconMap = {
  Note: MessageSquare,
  Statut: CheckCircle2,
  Assignation: UserPlus,
  Autre: HelpCircle,
} as const;

const typeColorMap = {
  Note: "bg-blue-100 text-blue-600 border-blue-200",
  Statut: "bg-emerald-100 text-emerald-600 border-emerald-200",
  Assignation: "bg-orange-100 text-orange-600 border-orange-200",
  Autre: "bg-slate-100 text-slate-600 border-slate-200",
} as const;

export function MailDetailSheet({
  isOpen,
  onCloseAction,
  mail,
  onAddCommentAction,
  onUpdateStatusAction,
  onUpdateAssigneeAction,
}: MailDetailSheetProps) {
  const { user } = useAuth();
  const [allEmployees, setAllEmployees] = useState<Employe[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  // Interaction states
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [statusReason, setStatusReason] = useState("");
  const [isStatusPopoverOpen, setIsStatusPopoverOpen] = useState(false);
  const [isEmployeePopoverOpen, setIsEmployeePopoverOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      async function fetchEmployees() {
        try {
          setLoadingEmployees(true);
          const employees = await getEmployeeDirectory();
          setAllEmployees(employees.filter(e => e.status === "Actif"));
        } catch (err) {
          console.error("Failed to load employees:", err);
        } finally {
          setLoadingEmployees(false);
        }
      }
      fetchEmployees();
    }
  }, [isOpen]);

  if (!mail) return null;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const authorName = user?.name || user?.email || "Système";
      await onAddCommentAction(mail.id, {
        date: new Date().toISOString(),
        author: authorName,
        content: newComment.trim(),
        type: "Note"
      });
      setNewComment("");
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleStatusChange = async (newStatus: MailStatus) => {
    if (newStatus === mail.status) return;

    setIsChangingStatus(true);
    try {
      const authorName = user?.name || user?.email || "Système";
      await onUpdateStatusAction(mail.id, newStatus, authorName, statusReason.trim() || undefined);
      setIsStatusPopoverOpen(false);
      setStatusReason("");
    } catch (err) {
      console.error("Failed to change status:", err);
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handleAssigneeChange = async (employeeId: string) => {
    try {
      const selectedEmp = allEmployees.find(emp => emp.id === employeeId);
      const selectedName = selectedEmp 
        ? `${selectedEmp.lastName || ""} ${selectedEmp.firstName || ""}`.trim()
        : undefined;

      const authorName = user?.name || user?.email || "Système";

      // 1. Update mail doc
      await onUpdateAssigneeAction(mail.id, employeeId || undefined, selectedName);

      // 2. Add an assignment history comment
      const assignmentContent = selectedName 
        ? `Courrier réassigné à : ${selectedName}`
        : "Courrier désassigné (Aucun agent)";
      await onAddCommentAction(mail.id, {
        date: new Date().toISOString(),
        author: authorName,
        content: assignmentContent,
        type: "Assignation"
      });

      setIsEmployeePopoverOpen(false);
    } catch (err) {
      console.error("Failed to reassign mail:", err);
    }
  };

  // Sort comments by date descending for timeline view
  const sortedComments = mail.comments
    ? [...mail.comments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onCloseAction(); }}>
      <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col h-full bg-slate-50 border-l border-slate-200">
        
        {/* Header */}
        <div className="p-6 bg-white border-b border-slate-100 flex flex-col shrink-0 gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
              {mail.trackingId || "N° NON DÉFINI"}
            </span>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-[10px] font-black uppercase tracking-[0.1em] px-2.5 py-0.5 rounded-full border",
                statusColors[mail.status]
              )}>
                {mail.status}
              </span>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-[0.1em] px-2.5 py-0.5 rounded-full border",
                priorityColors[mail.priority]
              )}>
                {mail.priority}
              </span>
            </div>
          </div>
          <SheetHeader className="space-y-1">
            <SheetTitle className="text-xl font-bold tracking-tight text-slate-900 leading-snug">{mail.title}</SheetTitle>
            <SheetDescription className="text-xs text-slate-500">
              Courrier {mail.type} · Enregistré le {mail.entryDate ? format(parseISO(mail.entryDate), "dd MMMM yyyy", { locale: fr }) : "-"}
            </SheetDescription>
          </SheetHeader>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1 px-6 py-5">
          <div className="space-y-6 pb-8">
            
            {/* Main Metadata Grid */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">Informations Générales</h3>
              
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block mb-1">Émetteur / Expéditeur</span>
                  <span className="text-slate-900 font-semibold">{mail.sender}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-1">Destinataire</span>
                  <span className="text-slate-900 font-semibold">{mail.recipient}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-1">Catégorie</span>
                  <span className="text-slate-900 font-semibold">{mail.category}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-1">Date limite de traitement</span>
                  <span className={cn(
                    "font-semibold",
                    mail.dueDate ? "text-slate-900" : "text-slate-400 italic"
                  )}>
                    {mail.dueDate ? format(parseISO(mail.dueDate), "dd MMMM yyyy", { locale: fr }) : "Aucune date limite"}
                  </span>
                </div>
              </div>

              {mail.description && (
                <div className="border-t border-slate-100 pt-3 mt-2">
                  <span className="text-slate-400 text-xs font-bold block mb-1">Description / Résumé</span>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{mail.description}</p>
                </div>
              )}
            </div>

            {/* Quick Actions (Reassign & Status Update) */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">Actions de Traitement</h3>
              
              <div className="grid grid-cols-2 gap-4">
                
                {/* Status Update Button / Popover */}
                <div className="space-y-1">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Changer le Statut</span>
                  <Popover open={isStatusPopoverOpen} onOpenChange={setIsStatusPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between bg-slate-50 border-slate-200 text-xs font-semibold text-slate-700">
                        {mail.status}
                        <ChevronsUpDown className="ml-2 h-3.5 w-3.5 opacity-50 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3 bg-white border border-slate-200 rounded-lg shadow-xl" align="start">
                      <div className="space-y-3">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">Nouveau statut</span>
                        <div className="grid gap-1">
                          {(["Nouveau", "En cours", "Traité", "Classé"] as MailStatus[]).map((statusVal) => (
                            <Button
                              key={statusVal}
                              variant={mail.status === statusVal ? "default" : "ghost"}
                              size="sm"
                              className="w-full justify-start text-xs font-semibold"
                              onClick={() => handleStatusChange(statusVal)}
                              disabled={isChangingStatus}
                            >
                              {statusVal}
                            </Button>
                          ))}
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="status-reason" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Motif / Commentaire (Optionnel)</Label>
                          <Input
                            id="status-reason"
                            placeholder="Ex: Dossier validé..."
                            value={statusReason}
                            onChange={(e) => setStatusReason(e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Assignment Dropdown */}
                <div className="space-y-1">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Réassigner le Dossier</span>
                  <Popover open={isEmployeePopoverOpen} onOpenChange={setIsEmployeePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isEmployeePopoverOpen}
                        className="w-full justify-between bg-slate-50 border-slate-200 text-xs font-semibold text-slate-700 truncate"
                        disabled={loadingEmployees}
                      >
                        {mail.assignedEmployeeName || "Non assigné"}
                        <ChevronsUpDown className="ml-2 h-3.5 w-3.5 opacity-50 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Rechercher un employé..." className="text-xs h-9" />
                        <CommandEmpty className="text-xs p-3">Aucun agent trouvé.</CommandEmpty>
                        <CommandGroup>
                          <CommandList className="max-h-[160px] overflow-y-auto">
                            <CommandItem
                              onSelect={() => handleAssigneeChange("")}
                              className="text-xs"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  !mail.assignedEmployeeId ? "opacity-100" : "opacity-0"
                                )}
                              />
                              Non assigné (Désattribuer)
                            </CommandItem>
                            {allEmployees.map((emp) => {
                              const fullName = `${emp.lastName || ""} ${emp.firstName || ""}`.trim();
                              return (
                                <CommandItem
                                  key={emp.id}
                                  value={fullName}
                                  onSelect={() => handleAssigneeChange(emp.id)}
                                  className="text-xs"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      mail.assignedEmployeeId === emp.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {fullName}
                                </CommandItem>
                              );
                            })}
                          </CommandList>
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

              </div>
            </div>

            {/* Pièce Jointe Section */}
            {mail.attachmentUrl && (
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden mr-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Document Numérisé</span>
                    <span className="text-xs font-semibold text-slate-800 truncate block">{mail.attachmentName || "Piece_Jointe.pdf"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="sm" className="h-8 text-xs font-bold flex items-center gap-1.5 border-slate-200" asChild>
                    <a href={mail.attachmentUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Ouvrir
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-xs font-bold flex items-center gap-1.5 border-slate-200" asChild>
                    <a href={mail.attachmentUrl} download={mail.attachmentName || "Piece_Jointe.pdf"}>
                      <Download className="h-3.5 w-3.5" />
                      Télécharger
                    </a>
                  </Button>
                </div>
              </div>
            )}

            {/* Treatment Timeline / Logs */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                Journal de Traitement
              </h3>

              {/* Add Note Form */}
              <form onSubmit={handleAddComment} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-3">
                <Label htmlFor="comment" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nouvelle Note de Traitement</Label>
                <Textarea
                  id="comment"
                  placeholder="Saisissez des détails sur l'avancement du dossier, les actions menées..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="text-xs min-h-[60px] bg-slate-50 border-slate-200 focus:bg-white"
                  required
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-8"
                    disabled={isSubmittingComment || !newComment.trim()}
                  >
                    {isSubmittingComment ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      "Ajouter la note"
                    )}
                  </Button>
                </div>
              </form>

              {/* Comments Timeline */}
              {sortedComments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed rounded-xl border-slate-200 bg-slate-50/50">
                  <Calendar className="h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-500">Aucune étape de traitement enregistrée</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Ajoutez une note ou modifiez le statut pour commencer.</p>
                </div>
              ) : (
                <div className="relative space-y-4 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  {sortedComments.map((comment, index) => {
                    const Icon = typeIconMap[comment.type as keyof typeof typeIconMap] || HelpCircle;
                    const commentColors = typeColorMap[comment.type as keyof typeof typeColorMap] || typeColorMap.Autre;
                    const isNewest = index === 0;

                    return (
                      <div key={comment.id} className="relative flex items-start group">
                        {/* Dot / Icon */}
                        <div className={cn(
                          "absolute left-0 flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shadow-sm transition-all group-hover:scale-110",
                          commentColors,
                          isNewest && "ring-4 ring-slate-100 ring-offset-0"
                        )}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>

                        {/* Content */}
                        <div className="ml-14 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">{comment.author}</span>
                              <span className={cn(
                                "text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border",
                                commentColors
                              )}>
                                {comment.type || 'Action'}
                              </span>
                            </div>
                            <time className="text-[10px] font-semibold text-slate-400">
                              {(() => {
                                const d = parseISO(comment.date);
                                return isValid(d) ? format(d, "dd MMMM yyyy 'à' HH:mm", { locale: fr }) : comment.date;
                              })()}
                            </time>
                          </div>
                          <div className="p-3.5 rounded-xl bg-white border border-slate-100 shadow-sm transition-all group-hover:border-slate-200">
                            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>

          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-end shrink-0">
          <SheetClose asChild>
            <Button variant="outline" className="border-slate-200 font-semibold text-xs">
              Fermer
            </Button>
          </SheetClose>
        </div>

      </SheetContent>
    </Sheet>
  );
}
