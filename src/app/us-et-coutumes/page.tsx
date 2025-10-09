
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookText } from "lucide-react";

export default function UsEtCoutumesPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Us & Coutumes</h1>
      <Card>
        <CardHeader>
            <CardTitle>Répertoire des Us et Coutumes</CardTitle>
            <CardDescription>
                Cette section est en cours de développement.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed rounded-lg">
                <BookText className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">
                    Le répertoire numérique des us et coutumes de Côte d'Ivoire sera bientôt disponible ici.
                </p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
