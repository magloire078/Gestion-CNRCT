"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, FileText, ImageIcon, Loader2, X } from "lucide-react";
import type { Document } from "@/lib/data";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface DocumentPreviewDialogProps {
    document: Document | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DocumentPreviewDialog({ document, open, onOpenChange }: DocumentPreviewDialogProps) {
    const [isLoading, setIsLoading] = useState(true);

    if (!document) return null;

    const isPDF = document.fileName.toLowerCase().endsWith('.pdf') || document.fileType === 'application/pdf';
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].some(ext => document.fileName.toLowerCase().endsWith(ext)) || document.fileType.startsWith('image/');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-900 border-slate-800">
                <DialogHeader className="p-4 bg-slate-800 border-b border-slate-700 shrink-0 flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-700 rounded-lg">
                            {isImage ? <ImageIcon className="h-5 w-5 text-blue-400" /> : <FileText className="h-5 w-5 text-orange-400" />}
                        </div>
                        <div className="flex flex-col">
                            <DialogTitle className="text-white text-base truncate max-w-[300px] md:max-w-[500px]">
                                {document.fileName}
                            </DialogTitle>
                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                {document.category || 'Document'} • {document.region || 'National'}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button asChild variant="secondary" size="sm" className="h-8 text-xs font-bold bg-slate-700 hover:bg-slate-600 border-none text-white">
                            <a href={document.storageUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-3.5 w-3.5" /> Ouvrir
                            </a>
                        </Button>
                        <Button asChild variant="default" size="sm" className="h-8 text-xs font-bold bg-blue-600 hover:bg-blue-700 border-none">
                            <a href={document.storageUrl} download={document.fileName}>
                                <Download className="mr-2 h-3.5 w-3.5" /> Télécharger
                            </a>
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 relative bg-slate-950 flex items-center justify-center overflow-auto p-4">
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50 z-10">
                            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                        </div>
                    )}

                    {isPDF ? (
                        <iframe
                            src={`${document.storageUrl}#toolbar=0`}
                            className="w-full h-full border-none bg-white rounded-sm shadow-2xl"
                            onLoad={() => setIsLoading(false)}
                            title={document.fileName}
                        />
                    ) : isImage ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                            <img
                                src={document.storageUrl}
                                alt={document.fileName}
                                className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
                                onLoad={() => setIsLoading(false)}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 space-y-4 py-20">
                            <div className="p-6 bg-slate-900 rounded-full border border-slate-800">
                                <FileText className="h-16 w-16 opacity-20" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Aperçu non disponible</h3>
                            <p className="text-sm max-w-xs text-center">
                                Ce type de fichier ne peut pas être prévisualisé directement. Veuillez le télécharger pour le consulter.
                            </p>
                            <Button asChild className="bg-slate-800 hover:bg-slate-700 border-slate-700">
                                <a href={document.storageUrl} download={document.fileName}>
                                    <Download className="mr-2 h-4 w-4" /> Télécharger maintenant
                                </a>
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
