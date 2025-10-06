
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, Loader2, AlertCircle, HardDriveDownload, DatabaseZap, ShieldCheck, History } from "lucide-react";
import { generateSqlBackup } from "@/services/backup-service";
import { useToast } from "@/hooks/use-toast";

export default function BackupPage() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleBackup = async () => {
    setIsBackingUp(true);
    setError(null);
    toast({
        title: "Génération en cours...",
        description: "La sauvegarde de la base de données est en cours de préparation. Cela peut prendre quelques instants.",
    });

    try {
      const sqlData = await generateSqlBackup();
      const blob = new Blob([sqlData], { type: "application/sql" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const formattedDate = new Date().toISOString().split('T')[0];
      link.download = `backup_cnrct_${formattedDate}.sql`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Sauvegarde réussie",
        description: "Le fichier de sauvegarde a été téléchargé.",
      });

    } catch (err) {
      const message = err instanceof Error ? err.message : "Une erreur inconnue est survenue.";
      setError(message);
      toast({
        variant: "destructive",
        title: "Erreur de sauvegarde",
        description: message,
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Sauvegarde & Restauration</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <HardDriveDownload className="h-8 w-8 text-primary"/>
                    <div>
                        <CardTitle>Sauvegarder la Base de Données</CardTitle>
                        <CardDescription>Créez une sauvegarde complète de vos données au format SQL.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                    Cette action va parcourir toutes les collections de votre base de données Firestore et générer un fichier 
                    <code>.sql</code> contenant des instructions <code>INSERT</code>. Conservez ce fichier en lieu sûr.
                </p>
                <Button onClick={handleBackup} disabled={isBackingUp} className="w-full">
                    {isBackingUp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    {isBackingUp ? "Génération en cours..." : "Lancer la sauvegarde SQL"}
                </Button>
                {error && (
                    <Alert variant="destructive" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Erreur</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>

        <Card className="bg-muted/30 border-dashed">
            <CardHeader>
                 <div className="flex items-center gap-3">
                    <DatabaseZap className="h-8 w-8 text-muted-foreground"/>
                    <div>
                        <CardTitle>Restauration des Données</CardTitle>
                        <CardDescription>Fonctionnalité de restauration à venir.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    La restauration d'une base de données à partir d'un fichier est une opération critique qui sera disponible dans une future mise à jour. Pour le moment, veuillez contacter le support technique pour toute demande de restauration.
                </p>
            </CardContent>
        </Card>
      </div>

       <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <ShieldCheck className="h-8 w-8 text-green-600"/>
                    <div>
                        <CardTitle>Bonnes Pratiques</CardTitle>
                        <CardDescription>Comment utiliser cette fonctionnalité de manière efficace.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
               <p><span className="font-semibold text-foreground">Fréquence :</span> Il est recommandé d'effectuer des sauvegardes régulières (ex: hebdomadaires) et avant toute modification majeure de la structure des données.</p>
               <p><span className="font-semibold text-foreground">Stockage :</span> Conservez vos fichiers de sauvegarde dans un emplacement sécurisé et distinct de votre environnement de travail habituel (ex: un cloud de stockage, un disque dur externe).</p>
                <p><span className="font-semibold text-foreground">Restauration :</span> La restauration écrase les données existantes. Ne l'utilisez qu'en cas de perte de données majeure et après avoir consulté le support si possible.</p>
            </CardContent>
        </Card>
    </div>
  );
}
