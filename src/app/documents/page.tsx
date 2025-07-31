
"use client";

import { useState, useEffect, useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { generateDocumentAction, FormState } from "./actions";
import { getEmployees } from "@/services/employee-service";
import type { Employee } from "@/lib/data";


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, FileText, Bot, Loader2, Printer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [state, formAction] = useActionState(generateDocumentAction, initialState);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [documentContent, setDocumentContent] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    async function fetchEmployees() {
        try {
            const fetchedEmployees = await getEmployees();
            setEmployees(fetchedEmployees);
        } catch (error) {
            console.error("Failed to fetch employees:", error);
        } finally {
            setLoadingEmployees(false);
        }
    }
    fetchEmployees();
  }, []);

  const prefillContent = (employee: Employee, type: string) => {
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
    } else {
        content = `Employé: ${employee.name}\nMatricule: ${employee.matricule}\nPoste: ${employee.poste}\nDépartement: ${employee.department}\n`;
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
  }, [selectedEmployeeId, documentType, employees]);


  useEffect(() => {
    if (state.fields) {
      if(state.fields.documentType) setDocumentType(state.fields.documentType);
      if(state.fields.documentContent) setDocumentContent(state.fields.documentContent);
    }
    if(state.document) {
        setDocumentContent('');
        setSelectedEmployeeId('');
        if(formRef.current) formRef.current.reset();
    }
  }, [state]);

  useEffect(() => {
    if (isPrinting) {
      setTimeout(() => {
        window.print();
        setIsPrinting(false);
      }, 300);
    }
  }, [isPrinting]);

  const handlePrint = () => {
    if(state.document) {
      setIsPrinting(true);
    }
  };

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
                <CardDescription>Le contenu généré par l'IA apparaîtra ici. Copiez le contenu ou imprimez la page.</CardDescription>
              </CardHeader>
              <CardContent>
                {state.document ? (
                   <div className="whitespace-pre-wrap p-4 text-sm rounded-md bg-muted/50 border font-serif h-[400px] overflow-auto">
                    {state.document}
                   </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed rounded-lg">
                    <Bot className="h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">Votre document est en attente de génération.</p>
                  </div>
                )}
              </CardContent>
               <CardFooter>
                <Button variant="outline" onClick={handlePrint} disabled={!state.document}>
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimer
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
      
      {isPrinting && state.document && (
        <div id="print-section" className="bg-white text-black p-8 font-serif print:shadow-none print:border-none print:p-0">
          <pre className="whitespace-pre-wrap text-sm">
            {state.document}
          </pre>
        </div>
      )}
    </>
  );
}
