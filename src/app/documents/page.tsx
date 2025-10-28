
"use client";

import { useState, useEffect, useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { generateDocumentAction, FormState } from "./actions";
import { getEmployees } from "@/services/employee-service";
import type { Employe } from "@/lib/data";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, FileText, Bot, Loader2, Printer, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentLayout } from "@/components/common/document-layout";
import { useAuth } from "@/hooks/use-auth";

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
  const { settings } = useAuth();
  const [state, formAction] = useActionState(generateDocumentAction, initialState);
  const [employees, setEmployees] = useState<Employe[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [documentContent, setDocumentContent] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
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

  const prefillContent = (employee: Employe, type: string) => {
    let content = '';
    if (type === 'Attestation de Virement') {
        content = `## Contexte pour l'Attestation de Virement Irrévocable

### Informations sur l'employé
*   **Nom et Prénoms** : ${employee.name || ''}
*   **Matricule Solde** : ${employee.matricule || ''}
*   **Poste** : ${employee.poste || ''}
*   **Numéro de compte** : ${employee.numeroCompte || ''}
*   **Banque** : ${employee.banque || ''}
*   **Salaire de base (pour calcul)** : ${employee.baseSalary || 0}

### Informations sur la décision
*   **Détails de la décision** : n°024/CNRCT/DIR/P. du 01 Août 2017
`;
    } else if (type === 'Employment Contract') {
      content = `## Contexte pour le Contrat de Travail

### Informations sur l'employé
*   **Nom et Prénoms** : ${employee.name || ''}
*   **Poste** : ${employee.poste || ''}
*   **Date d'embauche** : ${employee.dateEmbauche || new Date().toISOString().split('T')[0]}
*   **Lieu de naissance** : ${employee.Lieu_Naissance || ''}
*   **Salaire de base** : ${employee.baseSalary || 0}
`;
    } else if (type === 'Ordre de Mission') {
       content = `## Contexte pour l'Ordre de Mission

*   **Numero Mission** : 947
*   **Type Mission** : REGULARISATION
*   **Nom Employe** : ${employee.name || ''}
*   **Fonction** : ${employee.poste || ''}
*   **Destination** : Abidjan
*   **Objet Mission** : Accompagner le 5ème Vice-Président du Directoire de la CNRCT...
*   **Moyen Transport** : Véhicule CNRCT
*   **Immatriculation** : D 22 009
*   **Date Depart** : Mardi 12 août 2025
*   **Date Retour** : Samedi 16 août 2025
`;
    }
    else {
        content = `Employé: ${employee.name}\nMatricule: ${employee.matricule}\nPoste: ${employee.poste}\nDépartement: ${employee.departmentId}\n`;
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
    }
    if(state.document) {
        setDocumentContent('');
        setSelectedEmployeeId('');
        setDocumentType('');
        if(formRef.current) formRef.current.reset();
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

  const handleDownloadPdf = async () => {
    const printElement = printSectionRef.current;
    if (!state.document || !printElement) return;

    setIsDownloading(true);

    try {
        const canvas = await html2canvas(printElement, { scale: 2 });
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
  
  const formattedDocument = state.document
    ? state.document.split('\n').map((line, index) => <span key={index}>{line}</span>)
    : null;

  return (
    <>
      <div className={isPrinting ? 'print-hidden' : ''}>
        <div className="flex flex-col gap-6">
          <h1 className="text-3xl font-bold tracking-tight">Génération de Documents</h1>
          <div className="grid gap-6 lg:grid-cols-2">
            <form action={formAction} ref={formRef}>
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
                        <SelectItem value="Attestation de Virement">Attestation de Virement</SelectItem>
                        <SelectItem value="Employment Contract">Contrat de travail</SelectItem>
                        <SelectItem value="Ordre de Mission">Ordre de Mission</SelectItem>
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
                   <div id="generated-document-display" className="whitespace-pre-wrap p-4 text-sm rounded-md bg-muted/50 border font-serif h-[400px] overflow-auto">
                    {state.document}
                   </div>
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
        </div>
      </div>
      
      {/* This element is used for both printing and PDF generation */}
      <div className={isPrinting ? '' : 'absolute -z-10 -left-[9999px]'}>
        <div ref={printSectionRef}>
            {settings && state.document && (
                 <DocumentLayout>
                    <pre className="whitespace-pre-wrap text-sm font-serif">
                      {formattedDocument}
                    </pre>
                 </DocumentLayout>
            )}
        </div>
      </div>
    </>
  );
}

    