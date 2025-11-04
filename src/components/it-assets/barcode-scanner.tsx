"use client";

import { useState, useEffect, useRef } from "react";
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const getCameraPermission = async () => {
      if (isOpen) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setHasCameraPermission(true);
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Accès Caméra Refusé',
            description: 'Veuillez autoriser l\'accès à la caméra dans les paramètres de votre navigateur.',
          });
        }
      } else {
        // Stop camera when dialog is closed
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      }
    };

    getCameraPermission();

    return () => {
      // Cleanup on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, toast]);

  const handleScanSuccess = (result: any) => {
    if (result) {
      onScan(result.getText());
    }
  };

  const handleScanError = (error: any) => {
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
          {isOpen && hasCameraPermission ? (
            <>
              <Scanner
                onResult={handleScanSuccess}
                onError={handleScanError}
                constraints={{
                  video: {
                    facingMode: 'environment'
                  }
                }}
              />
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-3/4 h-1/2 border-2 border-dashed border-primary rounded-lg" />
              </div>
            </>
          ) : (
            <div className="absolute inset-0 bg-black/80 text-white flex flex-col items-center justify-center p-4">
              <CameraOff className="h-12 w-12 mb-4" />
              <Alert variant="destructive" className="bg-transparent border-destructive/50 text-white [&>svg]:text-white">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Accès Caméra Requis</AlertTitle>
                <AlertDescription>
                  Pour utiliser le scanner, veuillez autoriser l'accès à la caméra.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}