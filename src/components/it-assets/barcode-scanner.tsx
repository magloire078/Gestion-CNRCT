
"use client";

import { useState, useEffect, useRef } from "react";
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CameraOff, AlertTriangle, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
}

export function BarcodeScanner({ isOpen, onClose, onScan }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) return;

    const codeReader = new BrowserMultiFormatReader();
    let selectedDeviceId: string;

    const getCameraPermissionAndStart = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setHasCameraPermission(true);
        
        const videoInputDevices = await codeReader.listVideoInputDevices();
        selectedDeviceId = videoInputDevices[0].deviceId;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        codeReader.decodeFromVideoDevice(selectedDeviceId, videoRef.current, (result, err) => {
          if (result) {
            onScan(result.getText());
            codeReader.reset();
            stream.getTracks().forEach(track => track.stop());
          }
          if (err && !(err instanceof NotFoundException)) {
            console.error(err);
          }
        });

      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Accès Caméra Refusé',
          description: 'Veuillez autoriser l\'accès à la caméra dans les paramètres de votre navigateur.',
        });
      }
    };
    
    getCameraPermissionAndStart();

    return () => {
      codeReader.reset();
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, onScan, toast]);

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
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-3/4 h-1/2 border-2 border-dashed border-primary rounded-lg" />
            </div>
            {hasCameraPermission === false && (
                <div className="absolute inset-0 bg-black/80 text-white flex flex-col items-center justify-center">
                    <CameraOff className="h-12 w-12 mb-4" />
                    <p className="text-center">Accès à la caméra requis.</p>
                </div>
            )}
        </div>
        {hasCameraPermission === false && (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Accès Caméra Refusé</AlertTitle>
                <AlertDescription>
                   Pour utiliser le scanner, veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur.
                </AlertDescription>
            </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}
