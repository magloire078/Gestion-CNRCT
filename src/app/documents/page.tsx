"use client";

import { useFormState, useFormStatus } from "react-dom";
import { generateDocumentAction, FormState } from "./actions";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, FileText, Bot, Loader2 } from "lucide-react";

const initialState: FormState = {
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
      Generate Document
    </Button>
  );
}

export default function DocumentGeneratorPage() {
  const [state, formAction] = useFormState(generateDocumentAction, initialState);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Document Generation</h1>
        </div>
        <form action={formAction}>
          <Card>
            <CardHeader>
              <CardTitle>Create a New Document</CardTitle>
              <CardDescription>Use AI to generate legal and policy documents for your organization.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="documentType">Document Type</Label>
                <Select name="documentType" required>
                  <SelectTrigger id="documentType" className="w-full">
                    <SelectValue placeholder="Select a document type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Employment Contract">Employment Contract</SelectItem>
                    <SelectItem value="Company Policy">Company Policy</SelectItem>
                    <SelectItem value="Warning Letter">Warning Letter</SelectItem>
                    <SelectItem value="Termination Letter">Termination Letter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="documentContent">Key Information & Context</Label>
                <Textarea
                  id="documentContent"
                  name="documentContent"
                  placeholder="e.g., For John Doe, position of Software Engineer, starting on August 1st, 2024, with a salary of $80,000 per year..."
                  rows={8}
                  required
                />
              </div>

              {state.issues && (
                <Alert variant="destructive">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
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
            <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Generated Document</CardTitle>
            <CardDescription>The AI-generated content will appear here.</CardDescription>
          </CardHeader>
          <CardContent>
            {state.document ? (
               <div className="whitespace-pre-wrap p-4 text-sm rounded-md bg-muted/50 border font-mono h-[300px] overflow-auto">
                {state.document}
               </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed rounded-lg">
                <Bot className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">Your document is waiting to be generated.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
