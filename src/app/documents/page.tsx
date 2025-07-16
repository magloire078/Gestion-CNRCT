
"use client";

import { useState, useEffect, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { generateDocumentAction, FormState } from "./actions";
import { employeeData } from "@/lib/data";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, FileText, Bot, Loader2, User } from "lucide-react";

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
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [documentContent, setDocumentContent] = useState('');

  useEffect(() => {
    if (selectedEmployeeId && selectedEmployeeId !== 'none') {
      const employee = employeeData.find(emp => emp.id === selectedEmployeeId);
      if (employee) {
        const content = `Employé: ${employee.name}\nRôle: ${employee.role}\nDépartement: ${employee.department}\n`;
        setDocumentContent(content);
      }
    } else {
      setDocumentContent('');
    }
  }, [selectedEmployeeId]);

  useEffect(() => {
    if (state.fields?.documentContent) {
      setDocumentContent(state.fields.documentContent);
    }
  }, [state.fields?.documentContent]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Génération de Documents</h1>
        </div>
        <form action={formAction}>
          <Card>
            <CardHeader>
              <CardTitle>Créer un nouveau document</CardTitle>
              <CardDescription>Utilisez l'IA pour générer des documents juridiques et politiques pour votre organisation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="documentType">Type de document</Label>
                <Select name="documentType" required defaultValue={state.fields?.documentType}>
                  <SelectTrigger id="documentType" className="w-full">
                    <SelectValue placeholder="Sélectionnez un type de document..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Employment Contract">Contrat de travail</SelectItem>
                    <SelectItem value="Company Policy">Politique d'entreprise</SelectItem>
                    <SelectItem value="Warning Letter">Lettre d'avertissement</SelectItem>
                    <SelectItem value="Termination Letter">Lettre de licenciement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

               <div className="space-y-2">
                <Label htmlFor="employee">Sélectionner un employé (Optionnel)</Label>
                <Select onValueChange={setSelectedEmployeeId}>
                  <SelectTrigger id="employee" className="w-full">
                     <SelectValue placeholder="Sélectionnez un employé pour pré-remplir..." />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="none">Aucun</SelectItem>
                    {employeeData.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.name} ({emp.role})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentContent">Informations Clés & Contexte</Label>
                <Textarea
                  id="documentContent"
                  name="documentContent"
                  placeholder="Ex: Pour John Doe, poste d'Ingénieur Logiciel, début le 1er août 2024, avec un salaire de 80 000 $ par an..."
                  rows={8}
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
      </div>

      <div className="flex flex-col gap-6 lg:mt-12">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Document Généré</CardTitle>
            <CardDescription>Le contenu généré par l'IA apparaîtra ici.</CardDescription>
          </CardHeader>
          <CardContent>
            {state.document ? (
               <div className="whitespace-pre-wrap p-4 text-sm rounded-md bg-muted/50 border font-mono h-[300px] overflow-auto">
                {state.document}
               </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed rounded-lg">
                <Bot className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">Votre document est en attente de génération.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
