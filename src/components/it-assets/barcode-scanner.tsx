
"use client";

import { useState, useEffect } from "react";
import { Scanner } from "react-zxing";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CameraOff, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
}

export function BarcodeScanner({ isOpen, onClose, onScan }: BarcodeScannerProps) {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      // Vérifier les permissions au moment où le dialogue s'ouvre
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(() => {
          setHasCameraPermission(true);
        })
        .catch((error) => {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Accès Caméra Refusé',
            description: 'Veuillez autoriser l\'accès à la caméra dans les paramètres de votre navigateur.',
          });
        });
    }
  }, [isOpen, toast]);

  const handleScanSuccess = (result: any) => {
    if (result) {
      onScan(result.getText());
    }
  };

  const handleScanError = (error: any) => {
    // On ignore les erreurs de "not found" qui arrivent en continu
    if (error && error.name !== 'NotFoundException') {
      console.error("Scan Error:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scanner un Code-Barres / QR Code</DialogTitle>
          <DialogDescription>
            Pointez la caméra de votre appareil vers le code à scanner.
          </DialogDescription>
        </DialogHeader>
        <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
          {isOpen && hasCameraPermission === true && (
            <>
              <Scanner
                onResult={handleScanSuccess}
                onError={handleScanError}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-3/4 h-1/2 border-2 border-dashed border-primary rounded-lg" />
              </div>
            </>
          )}
          {hasCameraPermission === null && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p>Demande d'accès à la caméra...</p>
            </div>
          )}
          {hasCameraPermission === false && (
            <div className="absolute inset-0 bg-black/80 text-white flex flex-col items-center justify-center p-4">
                <CameraOff className="h-12 w-12 mb-4" />
                <Alert variant="destructive" className="bg-transparent border-destructive/50 text-white [&>svg]:text-white">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Accès Caméra Refusé</AlertTitle>
                    <AlertDescription>
                       Pour utiliser le scanner, veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur.
                    </AlertDescription>
                </Alert>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
