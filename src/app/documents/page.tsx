
"use client";

import { useState, useEffect, useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { generateDocumentAction, FormState } from "./actions";
import { getEmployees } from "@/services/employee-service";
import type { Employe } from "@/lib/data";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { sanitizeHtml } from "@/lib/sanitize";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, FileText, Bot, Loader2, Printer, Download, Trash2, Eye, Calendar, User as UserIcon, FileSpreadsheet, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentLayout } from "@/components/common/document-layout";
import { useAuth } from "@/hooks/use-auth";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { getCurrentDocumentNumber } from "@/services/document-service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { getGeneratedDocuments, deleteGeneratedDocument } from "@/services/document-history-service";
import type { GeneratedDocument } from "@/lib/data";

const initialState: FormState = {
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
      Générer le Document
    </Button>
  );
}

export default function DocumentGeneratorPage() {
  const { user, settings } = useAuth();
  const [state, formAction] = useActionState(generateDocumentAction, initialState);
  const [employees, setEmployees] = useState<Employe[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [documentContent, setDocumentContent] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [nextAutoNumber, setNextAutoNumber] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const { toast } = useToast();
  const [history, setHistory] = useState<GeneratedDocument[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedHistoryDoc, setSelectedHistoryDoc] = useState<GeneratedDocument | null>(null);

  const [filterType, setFilterType] = useState('all');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterAgent, setFilterAgent] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const docs = await getGeneratedDocuments();
      setHistory(docs);
    } catch (error) {
      console.error("Failed to fetch document history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce document de l'historique ?")) return;
    try {
      await deleteGeneratedDocument(id);
      toast({
        title: "Document supprimé",
        description: "Le document a été retiré de l'historique.",
      });
      fetchHistory();
    } catch (error) {
      console.error("Failed to delete document from history:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer le document.",
      });
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);
  const formRef = useRef<HTMLFormElement>(null);
  const printSectionRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    async function fetchInitialData() {
        try {
            const fetchedEmployees = await getEmployees();
            setEmployees(fetchedEmployees);
        } catch (error) {
            console.error("Failed to fetch initial data:", error);
        } finally {
            setLoadingEmployees(false);
        }
    }
    fetchInitialData();
  }, []);

  useEffect(() => {
    async function fetchNextNumber() {
      if (documentType) {
        try {
          const num = await getCurrentDocumentNumber(documentType);
          setNextAutoNumber(String(num).padStart(3, '0'));
        } catch (error) {
          console.error("Failed to fetch next document number:", error);
          setNextAutoNumber('');
        }
      } else {
        setNextAutoNumber('');
      }
    }
    fetchNextNumber();
  }, [documentType]);

  const prefillContent = (employee: Employe, type: string) => {
    let content = '';
    const todayStr = new Date().toISOString().split('T')[0];

    if (type === 'Attestation de Virement') {
        content = `Nom: ${employee.name || ''}
Matricule: ${employee.matricule || ''}
Poste: ${employee.poste || ''}
Numero Compte: ${employee.numeroCompte || ''}
Banque: ${employee.banque || ''}
Salaire de base: ${employee.baseSalary || 0}
Decision: n°024/CNRCT/DIR/P. du 01 Août 2017
`;
    } else if (type === 'Attestation Irrevocable de Virement de Salaire') {
        content = `Nom: ${employee.name || ''}
Matricule: ${employee.matricule || ''}
Poste: ${employee.poste || ''}
Numero Compte: ${employee.numeroCompte || ''}
Banque: ${employee.banque || ''}
Salaire de base: ${employee.baseSalary || 0}
Decision: ${employee.Num_Decision || 'n°024/CNRCT/DIR/P. du 01 Août 2017'}
`;
    } else if (type === 'Attestation de Presence Effective au Poste') {
        const civility = employee.sexe === 'Femme' ? 'Madame' : 'Monsieur';
        content = `Civilite: ${civility}
Nom: ${employee.name || ''}
Matricule Solde: ${employee.matricule || ''}
Matricule CNPS: ${employee.cnpsEmploye || ''}
Precedent Poste: Caissière
Decision Precedent Poste: N° 073/CNRCT/DIR./P. du 13 juin 2016
Nouveau Poste: ${employee.poste || ''}
Decision Promotion: N° 057/CNRCT/DIR/P. du 02 août 2021
Date Prise de Service: ${employee.dateEmbauche || todayStr}
Date d observation: ${todayStr}
Signataire Nom: FATOGOMA YEO
Signataire Titre: Préfet
Signataire Fonction: P. Le Président du Directoire et P.O\\nLe Secrétaire Général
`;
    } else if (type === 'Certificat de Travail') {
        content = `Nom: ${employee.name || ''}
Matricule: ${employee.matricule || ''}
Poste: ${employee.poste || ''}
Date d embauche: ${employee.dateEmbauche || ''}
Date de depart: ${employee.Date_Depart || ''}
`;
    } else if (type === 'Certificat de Prise de Service') {
        content = `Nom: ${employee.name || ''}
Matricule: ${employee.matricule || ''}
Poste: ${employee.poste || ''}
Date d embauche: ${employee.dateEmbauche || todayStr}
Decision de nomination: ${employee.Num_Decision || ''}
`;
    } else if (type === 'Certificat de Cessation de Service') {
        content = `Nom: ${employee.name || ''}
Matricule: ${employee.matricule || ''}
Poste: ${employee.poste || ''}
Date de depart: ${employee.Date_Depart || todayStr}
Motif: Fin de contrat / convenance personnelle
`;
    } else if (type === 'Certificat de Cessation Definitive de Service') {
        content = `Nom: ${employee.name || ''}
Matricule: ${employee.matricule || ''}
Poste: ${employee.poste || ''}
Date de depart: ${employee.Date_Depart || todayStr}
Motif: Retraite / Fin de mandat
`;
    } else if (type === 'Employment Contract') {
      content = `Nom: ${employee.name || ''}
Poste: ${employee.poste || ''}
Date d embauche: ${employee.dateEmbauche || todayStr}
Lieu de naissance: ${employee.Lieu_Naissance || ''}
Salaire de base: ${employee.baseSalary || 0}
`;
    } else if (type === 'Ordre de Mission') {
       content = `Numero Mission: 947
Type Mission: REGULARISATION
Nom: ${employee.name || ''}
Poste: ${employee.poste || ''}
Destination: Abidjan
Objet Mission: Accompagner le 5ème Vice-Président du Directoire de la CNRCT...
Moyen Transport: Véhicule CNRCT
Immatriculation: D 22 009
Date Depart: ${todayStr}
Date Retour: ${todayStr}
`;
    } else if (type === 'Decision de Cessation Definitive de Service') {
        content = `Nom: ${employee.name || ''}
Matricule: ${employee.matricule || ''}
Poste: ${employee.poste || ''}
Date de Cessation: ${employee.Date_Depart || todayStr}
Motif: Retraite / Fin de mandat
Decision Numero: 054/CNRCT/DIR/P.
`;
    } else if (type === 'Decision d Octroi de Conge Annuel') {
        content = `Nom: ${employee.name || ''}
Matricule: ${employee.matricule || ''}
Poste: ${employee.poste || ''}
Date Debut Conge: ${todayStr}
Date Fin Conge: ${todayStr}
Nombre Jours: 30
Decision Numero: 012/CNRCT/DIR/P.
`;
    } else if (type === 'Decision d Octroi de Conge de Maternite') {
        content = `Nom: ${employee.name || ''}
Matricule: ${employee.matricule || ''}
Poste: ${employee.poste || ''}
Date Debut Conge: ${todayStr}
Date Fin Conge: ${todayStr}
Nombre Semaines: 14
Decision Numero: 015/CNRCT/DIR/P.
`;
    } else {
        content = `Employé: ${employee.name}\nMatricule: ${employee.matricule}\nPoste: ${employee.poste}\nDépartement: ${employee.departmentId || ''}\n`;
    }
    setDocumentContent(content);
  }

  useEffect(() => {
    if (selectedEmployeeId && selectedEmployeeId !== 'none' && documentType) {
      const employee = employees.find(emp => emp.id === selectedEmployeeId);
      if (employee) {
        prefillContent(employee, documentType);
      }
    } else if (!selectedEmployeeId || selectedEmployeeId === 'none') {
       setDocumentContent('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployeeId, documentType, employees]);


  useEffect(() => {
    if (state.fields) {
      if(state.fields.documentType) setDocumentType(state.fields.documentType);
      if(state.fields.documentContent) setDocumentContent(state.fields.documentContent);
      if(state.fields.documentNumber) setDocumentNumber(state.fields.documentNumber);
    }
    if(state.document) {
        setDocumentContent('');
        setSelectedEmployeeId('');
        setDocumentType('');
        setDocumentNumber('');
        if(formRef.current) formRef.current.reset();
        fetchHistory();
    }
  }, [state]);

  useEffect(() => {
    if (isPrinting) {
      const originalTitle = document.title;
      const employeeName = selectedEmployeeId ? employees.find(e => e.id === selectedEmployeeId)?.name.replace(/\s+/g, '_') : 'document';
      document.title = `${documentType.replace(/\s+/g, '_')}_${employeeName}`;
      
      setTimeout(() => {
        window.print();
        document.title = originalTitle;
        setIsPrinting(false);
      }, 300);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPrinting]);

  const handlePrint = () => {
    if(state.document) {
      setIsPrinting(true);
    }
  };

  const filteredHistory = history.filter(doc => {
    if (filterType !== 'all' && doc.documentType !== filterType) return false;
    if (filterEmployee && !doc.employeeName.toLowerCase().includes(filterEmployee.toLowerCase())) return false;
    if (filterAgent && !doc.generatedByName.toLowerCase().includes(filterAgent.toLowerCase())) return false;
    if (filterStartDate && new Date(doc.createdAt) < new Date(filterStartDate)) return false;
    if (filterEndDate) {
      const end = new Date(filterEndDate);
      end.setHours(23, 59, 59, 999);
      if (new Date(doc.createdAt) > end) return false;
    }
    return true;
  });

  const handleDownloadPdf = async () => {
    const printElement = printSectionRef.current;
    if (!state.document || !printElement) return;

    setIsDownloading(true);

    try {
        const canvas = await html2canvas(printElement, { 
          scale: 2, 
          useCORS: true,
          width: 794,
          windowWidth: 794
        });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const imgProps= pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
        let height = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, height);
        height -= pdfHeight;

        while (height > 0) {
            position = position - pdfHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, height);
            height -= pdfHeight;
        }
        
        const employeeName = selectedEmployeeId ? employees.find(e => e.id === selectedEmployeeId)?.name.replace(/\s+/g, '_') : 'document';
        pdf.save(`${documentType.replace(/\s+/g, '_')}_${employeeName}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch(error) {
        console.error("Failed to generate PDF", error);
    } finally {
        setIsDownloading(false);
    }
  };
  
  const formattedDocument = state.document || null;

  return (
    <PermissionGuard permission="page:documents:view">
      <div className={isPrinting ? 'print-hidden' : ''}>
        <div className="flex flex-col gap-6">
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Documents</h1>

          <Tabs defaultValue="generator" className="w-full">
            <TabsList className="grid w-[400px] grid-cols-2 mb-6">
              <TabsTrigger value="generator">Générateur</TabsTrigger>
              <TabsTrigger value="history" onClick={fetchHistory}>Tableau de bord & Historique</TabsTrigger>
            </TabsList>

            <TabsContent value="generator" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <form action={formAction} ref={formRef}>
                  {/* Hidden fields for history tracking */}
                  <input type="hidden" name="agentId" value={user?.id || ''} />
                  <input type="hidden" name="agentName" value={user?.name || user?.email || 'Agent'} />
                  <input type="hidden" name="employeeId" value={selectedEmployeeId} />
                  <input type="hidden" name="employeeName" value={selectedEmployeeId && selectedEmployeeId !== 'none' ? employees.find(e => e.id === selectedEmployeeId)?.name || '' : 'Externe'} />

                  <Card>
                    <CardHeader>
                      <CardTitle>Créer un nouveau document</CardTitle>
                      <CardDescription>Utilisez l'IA pour générer des documents juridiques et politiques pour votre organisation.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="documentType">Type de document</Label>
                        <Select name="documentType" required value={documentType} onValueChange={setDocumentType}>
                          <SelectTrigger id="documentType" className="w-full">
                            <SelectValue placeholder="Sélectionnez un type de document..." />
                          </SelectTrigger>
                          <SelectContent>
                            {/* Certificats */}
                            <SelectItem value="Certificat de Travail">Certificat de Travail</SelectItem>
                            <SelectItem value="Certificat de Prise de Service">Certificat de Prise de Service</SelectItem>
                            <SelectItem value="Certificat de Cessation de Service">Certificat de Cessation de Service</SelectItem>
                            <SelectItem value="Certificat de Cessation Definitive de Service">Certificat de Cessation Définitive de Service</SelectItem>

                            {/* Attestations */}
                            <SelectItem value="Attestation Irrevocable de Virement de Salaire">Attestation Irrévocable de Virement de Salaire</SelectItem>
                            <SelectItem value="Attestation de Presence Effective au Poste">Attestation de Présence Effective au Poste</SelectItem>
                            <SelectItem value="Attestation de Virement">Attestation de Virement Simple</SelectItem>
                            <SelectItem value="Employment Contract">Contrat de travail</SelectItem>
                            <SelectItem value="Ordre de Mission">Ordre de Mission</SelectItem>

                            {/* Décisions */}
                            <SelectItem value="Decision de Cessation Definitive de Service">Décision de Cessation Définitive de Service</SelectItem>
                            <SelectItem value="Decision d Octroi de Conge Annuel">Décision d'Octroi de Congé Annuel</SelectItem>
                            <SelectItem value="Decision d Octroi de Conge de Maternite">Décision d'Octroi de Congé de Maternité</SelectItem>

                            <SelectItem value="Company Policy">Politique d'entreprise</SelectItem>
                            <SelectItem value="Warning Letter">Lettre d'avertissement</SelectItem>
                            <SelectItem value="Termination Letter">Lettre de licenciement</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                       <div className="space-y-2">
                        <Label htmlFor="employee">Sélectionner un employé pour pré-remplir</Label>
                        {loadingEmployees ? (
                            <Skeleton className="h-10 w-full" />
                        ) : (
                        <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId} disabled={loadingEmployees || !documentType}>
                          <SelectTrigger id="employee" className="w-full">
                             <SelectValue placeholder={!documentType ? "Choisissez d'abord un type de document" : "Sélectionnez un employé..."} />
                          </SelectTrigger>
                          <SelectContent>
                             <SelectItem value="none">Aucun</SelectItem>
                            {employees.map(emp => (
                              <SelectItem key={emp.id} value={emp.id}>{emp.name} ({emp.matricule})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="documentNumber">Numéro de document</Label>
                        <Input
                          id="documentNumber"
                          name="documentNumber"
                          placeholder={nextAutoNumber ? `Automatique (Prochain : ${nextAutoNumber})` : "Ex: 080"}
                          value={documentNumber}
                          onChange={(e) => setDocumentNumber(e.target.value)}
                          disabled={!documentType}
                        />
                        <p className="text-xs text-muted-foreground">
                          Laissez vide pour utiliser le numéro automatique ou saisissez un numéro de document manuellement.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="documentContent">Informations Clés & Contexte</Label>
                        <Textarea
                          id="documentContent"
                          name="documentContent"
                          placeholder="Sélectionnez un type de document et éventuellement un employé pour commencer..."
                          rows={10}
                          required
                          value={documentContent}
                          onChange={(e) => setDocumentContent(e.target.value)}
                        />
                      </div>

                      {state.issues && (
                        <Alert variant="destructive">
                          <Terminal className="h-4 w-4" />
                          <AlertTitle>Erreur</AlertTitle>
                          <AlertDescription>
                            <ul className="list-disc pl-5">
                              {state.issues.map((issue) => (
                                <li key={issue}>{issue}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                    <CardFooter>
                      <SubmitButton />
                    </CardFooter>
                  </Card>
                </form>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Document Généré</CardTitle>
                    <CardDescription>Le contenu généré par l'IA apparaîtra ici. Copiez le contenu ou imprimez/téléchargez.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {state.document ? (
                       <div 
                         id="generated-document-display" 
                         className="p-4 text-sm rounded-md bg-white border font-serif h-[400px] overflow-auto"
                         dangerouslySetInnerHTML={{ __html: sanitizeHtml(state.document) }}
                       />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed rounded-lg">
                        <Bot className="h-12 w-12 text-muted-foreground" />
                        <p className="mt-4 text-muted-foreground">Votre document est en attente de génération.</p>
                      </div>
                    )}
                  </CardContent>
                   <CardFooter className="gap-2">
                    <Button variant="outline" onClick={handlePrint} disabled={!state.document || isPrinting}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimer
                    </Button>
                    <Button variant="outline" onClick={handleDownloadPdf} disabled={!state.document || isDownloading}>
                        {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Télécharger en PDF
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              {/* Statistics Panel */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total documents</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{filteredHistory.length}</div>
                    <p className="text-xs text-muted-foreground">Sur la période sélectionnée</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Types générés</CardTitle>
                    <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Array.from(new Set(filteredHistory.map(d => d.documentType))).length}
                    </div>
                    <p className="text-xs text-muted-foreground">Catégories distinctes</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Agents actifs</CardTitle>
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Array.from(new Set(filteredHistory.map(d => d.generatedByName))).length}
                    </div>
                    <p className="text-xs text-muted-foreground">Agents et collaborateurs</p>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Filtres de recherche</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-5 items-end">
                  <div className="space-y-2">
                    <Label>Type de document</Label>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les types</SelectItem>
                        <SelectItem value="Certificat de Travail">Certificat de Travail</SelectItem>
                        <SelectItem value="Certificat de Prise de Service">Certificat de Prise de Service</SelectItem>
                        <SelectItem value="Certificat de Cessation de Service">Certificat de Cessation de Service</SelectItem>
                        <SelectItem value="Certificat de Cessation Definitive de Service">Certificat de Cessation Définitive de Service</SelectItem>
                        <SelectItem value="Attestation Irrevocable de Virement de Salaire">Attestation Irrévocable de Virement</SelectItem>
                        <SelectItem value="Attestation de Presence Effective au Poste">Attestation de Présence Effective</SelectItem>
                        <SelectItem value="Attestation de Virement">Attestation de Virement Simple</SelectItem>
                        <SelectItem value="Employment Contract">Contrat de travail</SelectItem>
                        <SelectItem value="Ordre de Mission">Ordre de Mission</SelectItem>
                        <SelectItem value="Decision de Cessation Definitive de Service">Décision Cessation de Service</SelectItem>
                        <SelectItem value="Decision d Octroi de Conge Annuel">Décision Congé Annuel</SelectItem>
                        <SelectItem value="Decision d Octroi de Conge de Maternite">Décision Congé Maternité</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date de début</Label>
                    <Input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Date de fin</Label>
                    <Input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Demandeur (Employé)</Label>
                    <Input placeholder="Nom du demandeur..." value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Agent (Généré par)</Label>
                    <Input placeholder="Nom de l'agent..." value={filterAgent} onChange={e => setFilterAgent(e.target.value)} />
                  </div>
                </CardContent>
              </Card>

              {/* History Table */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Historique des documents</CardTitle>
                  <Button variant="outline" size="sm" onClick={fetchHistory} disabled={loadingHistory}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loadingHistory ? 'animate-spin' : ''}`} />
                    Actualiser
                  </Button>
                </CardHeader>
                <CardContent>
                  {loadingHistory ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredHistory.length === 0 ? (
                    <p className="text-center py-12 text-muted-foreground text-sm">
                      Aucun document trouvé dans l'historique avec ces critères.
                    </p>
                  ) : (
                    <div className="overflow-x-auto border rounded-md">
                      <table className="min-w-full divide-y divide-border text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">N°</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Demandeur</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Généré par</th>
                            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {filteredHistory.map((doc) => (
                            <tr key={doc.id} className="hover:bg-muted/30">
                              <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-xs">
                                {new Date(doc.createdAt).toLocaleDateString('fr-FR')} {new Date(doc.createdAt).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                              </td>
                              <td className="px-4 py-3 font-medium whitespace-nowrap">{doc.documentType}</td>
                              <td className="px-4 py-3 whitespace-nowrap font-mono">{doc.documentNumber}</td>
                              <td className="px-4 py-3 whitespace-nowrap">{doc.employeeName}</td>
                              <td className="px-4 py-3 whitespace-nowrap">{doc.generatedByName}</td>
                              <td className="px-4 py-3 text-right whitespace-nowrap space-x-1">
                                <Button variant="outline" size="sm" onClick={() => setSelectedHistoryDoc(doc)}>
                                  <Eye className="h-4 w-4 mr-1" /> Visualiser
                                </Button>
                                <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteHistory(doc.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

        </div>
      </div>

      {/* Detail Dialog overlay */}
      {selectedHistoryDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border">
            <CardHeader className="border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  {selectedHistoryDoc.documentType} N° {selectedHistoryDoc.documentNumber}
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setSelectedHistoryDoc(null)}>
                  ✕
                </Button>
              </div>
              <CardDescription>
                Généré le {new Date(selectedHistoryDoc.createdAt).toLocaleString('fr-FR')} par {selectedHistoryDoc.generatedByName} pour {selectedHistoryDoc.employeeName}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow overflow-auto p-6 bg-muted/10 font-serif text-sm leading-relaxed max-h-[500px]">
              <div 
                className="border bg-white p-8 max-w-[210mm] mx-auto shadow-sm"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedHistoryDoc.generatedText) }}
              />
            </CardContent>
            <CardFooter className="gap-2 justify-end border-t pt-4">
              <Button variant="outline" onClick={() => {
                 navigator.clipboard.writeText(selectedHistoryDoc.generatedText);
                 toast({ title: "Texte copié", description: "Le contenu a été copié dans le presse-papiers." });
              }}>
                Copier le texte
              </Button>
              <Button onClick={() => {
                 setDocumentType(selectedHistoryDoc.documentType);
                 setDocumentNumber(selectedHistoryDoc.documentNumber);
                 setDocumentContent(selectedHistoryDoc.content);
                 state.document = selectedHistoryDoc.generatedText;
                 setSelectedHistoryDoc(null);
                 toast({ title: "Document chargé", description: "Le document est prêt dans l'aperçu du Générateur." });
              }}>
                Charger dans le Générateur
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      
      {/* This element is used for both printing and PDF generation */}
      <div className={isPrinting ? '' : 'absolute -z-10 -left-[9999px]'} style={{ width: isPrinting ? '' : '210mm' }}>
        <div ref={printSectionRef} id="print-section" style={{ width: '210mm' }}>
            {state.document && (
                 <DocumentLayout>
                    <div 
                      className="text-sm font-serif bg-white text-black p-2"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(formattedDocument || '') }}
                    />
                 </DocumentLayout>
            )}
        </div>
      </div>
    </PermissionGuard>
  );
}

    