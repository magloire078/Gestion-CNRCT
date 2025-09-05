
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, FileText } from "lucide-react";

export default function DisaReportPage() {
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    // Logic to fetch and process data will be added here
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate async work
    setLoading(false);
  };
  
  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Rapport DISA (Déclaration des Salaires)</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Générateur de Rapport DISA Annuel</CardTitle>
          <CardDescription>
            Sélectionnez une année pour générer la déclaration individuelle des salaires pour tous les employés.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end mb-6 p-4 border rounded-lg max-w-md">
            <div className="grid gap-2 flex-1 w-full">
              <Label htmlFor="year">Année de la déclaration</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger id="year"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={generateReport} disabled={loading} className="w-full sm:w-auto">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Générer le rapport
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="flex items-center justify-center min-h-[300px]">
        <div className="text-center text-muted-foreground">
            <FileText className="mx-auto h-12 w-12" />
            <p className="mt-4">Le rapport DISA apparaîtra ici après sa génération.</p>
        </div>
      </Card>
    </div>
  );
}
