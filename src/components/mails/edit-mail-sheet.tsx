"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import type { Mail, MailType, MailPriority, MailCategory, Employe } from "@/lib/data";
import { getEmployeeDirectory } from "@/services/employee-service";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Loader2, Upload, X, FileText } from "lucide-react";
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

interface EditMailSheetProps {
  isOpen: boolean;
  onCloseAction: () => void;
  mail: Mail | null;
  onUpdateMailAction: (id: string, updatedFields: Partial<Omit<Mail, "id">>) => Promise<void>;
}

const CATEGORIES: MailCategory[] = [
  "Administratif",
  "Financier",
  "Juridique",
  "Technique",
  "RH",
  "Autre"
];

const PRIORITIES: MailPriority[] = [
  "Basse",
  "Moyenne",
  "Haute",
  "Urgente"
];

export function EditMailSheet({
  isOpen,
  onCloseAction,
  mail,
  onUpdateMailAction,
}: EditMailSheetProps) {
  const [allEmployees, setAllEmployees] = useState<Employe[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  // Form states
  const [type, setType] = useState<MailType>("Arrivant");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sender, setSender] = useState("");
  const [recipient, setRecipient] = useState("");
  const [category, setCategory] = useState<MailCategory>("Administratif");
  const [priority, setPriority] = useState<MailPriority>("Moyenne");
  const [entryDate, setEntryDate] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [assignedEmployeeId, setAssignedEmployeeId] = useState<string>("");
  const [isEmployeePopoverOpen, setIsEmployeePopoverOpen] = useState(false);

  // File Upload states
  const [isUploading, setIsUploading] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState<string>("");
  const [attachmentName, setAttachmentName] = useState<string>("");
  const [uploadError, setUploadError] = useState<string>("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load employees list
  useEffect(() => {
    if (isOpen) {
      async function fetchEmployees() {
        try {
          setLoadingEmployees(true);
          const employees = await getEmployeeDirectory();
          setAllEmployees(employees.filter(e => e.status === "Actif"));
        } catch (err) {
          console.error("Failed to load employees for assignment:", err);
        } finally {
          setLoadingEmployees(false);
        }
      }
      fetchEmployees();
    }
  }, [isOpen]);

  // Load selected mail values
  useEffect(() => {
    if (isOpen && mail) {
      setType(mail.type);
      setTitle(mail.title);
      setDescription(mail.description || "");
      setSender(mail.sender);
      setRecipient(mail.recipient);
      setCategory(mail.category);
      setPriority(mail.priority);
      setEntryDate(mail.entryDate || "");
      setDueDate(mail.dueDate || "");
      setAssignedEmployeeId(mail.assignedEmployeeId || "");
      setAttachmentUrl(mail.attachmentUrl || "");
      setAttachmentName(mail.attachmentName || "");
      setError("");
      setUploadError("");
    }
  }, [isOpen, mail]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError("");
    try {
      const url = await uploadToCloudinary(file);
      setAttachmentUrl(url);
      setAttachmentName(file.name);
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "Échec du téléversement du fichier.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeAttachment = () => {
    setAttachmentUrl("");
    setAttachmentName("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mail) return;
    if (!title || !sender || !recipient || !entryDate) {
      setError("Veuillez remplir tous les champs obligatoires (*).");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const assignedEmployee = allEmployees.find(emp => emp.id === assignedEmployeeId);
      const assignedEmployeeName = assignedEmployee
        ? `${assignedEmployee.lastName || ""} ${assignedEmployee.firstName || ""}`.trim()
        : undefined;

      await onUpdateMailAction(mail.id, {
        type,
        title,
        description: description || undefined,
        sender,
        recipient,
        category,
        priority,
        entryDate,
        dueDate: dueDate || undefined,
        assignedEmployeeId: assignedEmployeeId || undefined,
        assignedEmployeeName: assignedEmployeeName || null as any,
        attachmentUrl: attachmentUrl || undefined,
        attachmentName: attachmentName || undefined,
      });

      onCloseAction();
    } catch (err: any) {
      console.error("Error updating mail:", err);
      setError(err.message || "Une erreur est survenue lors de la mise à jour.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedEmployee = allEmployees.find(emp => emp.id === assignedEmployeeId);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onCloseAction(); }}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col h-full bg-slate-50">
        <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
          <SheetHeader className="space-y-1">
            <SheetTitle className="text-xl font-bold tracking-tight text-slate-900">Modifier le Courrier</SheetTitle>
            <SheetDescription className="text-xs text-slate-500">
              Modifiez les informations du courrier ci-dessous. Le numéro d'enregistrement restera inchangé.
            </SheetDescription>
          </SheetHeader>
        </div>

        <ScrollArea className="flex-1 px-6 py-4">
          <form onSubmit={handleSubmit} id="edit-mail-form" className="space-y-5 pb-6">
            {error && (
              <div className="p-3 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 border border-rose-100">
                {error}
              </div>
            )}

            {mail?.trackingId && (
              <div className="p-3 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">N° Enregistrement</span>
                <span className="text-sm font-black text-slate-700 tracking-tight">{mail.trackingId}</span>
              </div>
            )}

            {/* Type de courrier */}
            <div className="space-y-1.5">
              <Label htmlFor="type" className="text-xs font-bold text-slate-700 uppercase tracking-wider">Type de Courrier *</Label>
              <Select value={type} onValueChange={(val: MailType) => setType(val)}>
                <SelectTrigger className="bg-white border-slate-200">
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arrivant">Arrivant (Reçu de l'extérieur)</SelectItem>
                  <SelectItem value="Départ">Départ (Envoyé à l'extérieur)</SelectItem>
                  <SelectItem value="Interne">Interne (Note de service / Mémo)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Objet du courrier */}
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-bold text-slate-700 uppercase tracking-wider">Objet du Courrier *</Label>
              <Input
                id="title"
                placeholder="Ex: Demande de subvention, Note circulaire..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-white border-slate-200"
                required
              />
            </div>

            {/* Expéditeur & Destinataire */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="sender" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {type === "Arrivant" ? "Expéditeur (Externe) *" : "Émetteur (Interne / Service) *"}
                </Label>
                <Input
                  id="sender"
                  placeholder={type === "Arrivant" ? "Ex: Ministère de l'Intérieur" : "Ex: Service RH"}
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  className="bg-white border-slate-200"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="recipient" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {type === "Départ" ? "Destinataire (Externe) *" : "Destinataire (Interne) *"}
                </Label>
                <Input
                  id="recipient"
                  placeholder={type === "Départ" ? "Ex: M. le Maire" : "Ex: Cabinet du Président"}
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="bg-white border-slate-200"
                  required
                />
              </div>
            </div>

            {/* Catégorie & Priorité */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-xs font-bold text-slate-700 uppercase tracking-wider">Catégorie *</Label>
                <Select value={category} onValueChange={(val: MailCategory) => setCategory(val)}>
                  <SelectTrigger className="bg-white border-slate-200">
                    <SelectValue placeholder="Sélectionner la catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="priority" className="text-xs font-bold text-slate-700 uppercase tracking-wider">Priorité *</Label>
                <Select value={priority} onValueChange={(val: MailPriority) => setPriority(val)}>
                  <SelectTrigger className="bg-white border-slate-200">
                    <SelectValue placeholder="Sélectionner la priorité" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((prio) => (
                      <SelectItem key={prio} value={prio}>{prio}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date d'entrée & Date Limite */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="entryDate" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {type === "Arrivant" ? "Date de Réception *" : type === "Départ" ? "Date d'Envoi *" : "Date de Création *"}
                </Label>
                <Input
                  id="entryDate"
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="bg-white border-slate-200"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dueDate" className="text-xs font-bold text-slate-700 uppercase tracking-wider">Date Limite de Traitement</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-white border-slate-200"
                />
              </div>
            </div>

            {/* Agent Assigné */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Assigner à un Agent</Label>
              <Popover open={isEmployeePopoverOpen} onOpenChange={setIsEmployeePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isEmployeePopoverOpen}
                    className="w-full justify-between bg-white border-slate-200 font-normal text-slate-700"
                  >
                    {selectedEmployee
                      ? `${selectedEmployee.lastName || ""} ${selectedEmployee.firstName || ""}`.trim()
                      : "Sélectionner un agent..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[34rem] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Rechercher un employé..." />
                    <CommandEmpty>Aucun agent trouvé.</CommandEmpty>
                    <CommandGroup>
                      <CommandList className="max-h-[200px] overflow-y-auto">
                        <CommandItem
                          onSelect={() => {
                            setAssignedEmployeeId("");
                            setIsEmployeePopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              assignedEmployeeId === "" ? "opacity-100" : "opacity-0"
                            )}
                          />
                          Aucun (Non assigné)
                        </CommandItem>
                        {allEmployees.map((emp) => {
                          const fullName = `${emp.lastName || ""} ${emp.firstName || ""}`.trim();
                          return (
                            <CommandItem
                              key={emp.id}
                              value={fullName}
                              onSelect={() => {
                                setAssignedEmployeeId(emp.id);
                                setIsEmployeePopoverOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  assignedEmployeeId === emp.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {fullName} <span className="text-xs text-slate-400 ml-1">({emp.poste || "Agent"})</span>
                            </CommandItem>
                          );
                        })}
                      </CommandList>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-bold text-slate-700 uppercase tracking-wider">Description / Résumé</Label>
              <Textarea
                id="description"
                placeholder="Entrez des détails ou remarques sur le contenu du courrier..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-white border-slate-200 min-h-[80px]"
              />
            </div>

            {/* Attachment File Section */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Pièce Jointe (Scan PDF, Image...)</Label>
              {attachmentUrl ? (
                <div className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden mr-2">
                    <FileText className="h-5 w-5 text-blue-500 shrink-0" />
                    <span className="text-xs font-semibold text-slate-700 truncate">{attachmentName}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-400 hover:text-slate-600 shrink-0"
                    onClick={removeAttachment}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative border-2 border-dashed border-slate-200 hover:border-blue-400 bg-white rounded-lg p-5 flex flex-col items-center justify-center transition-colors">
                  <input
                    type="file"
                    id="attachment-file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    title="Téléverser un fichier"
                    aria-label="Sélectionner une pièce jointe"
                  />
                  {isUploading ? (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                      <span className="text-xs text-slate-500 font-medium">Téléversement en cours...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center">
                      <Upload className="h-6 w-6 text-slate-400 mb-2" />
                      <span className="text-xs font-semibold text-slate-700">Cliquez pour téléverser un fichier</span>
                      <span className="text-[10px] text-slate-400 mt-1">PDF, JPG, PNG, DOCX jusqu'à 10 Mo</span>
                    </div>
                  )}
                </div>
              )}
              {uploadError && (
                <span className="text-[10px] text-rose-600 font-semibold">{uploadError}</span>
              )}
            </div>
          </form>
        </ScrollArea>

        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
          <SheetClose asChild>
            <Button variant="outline" className="border-slate-200 font-semibold text-xs" disabled={isSubmitting}>
              Annuler
            </Button>
          </SheetClose>
          <Button
            form="edit-mail-form"
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 font-semibold text-xs text-white"
            disabled={isSubmitting || isUploading}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mise à jour...
              </>
            ) : (
              "Enregistrer"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
