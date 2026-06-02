"use client";

import { useState } from "react";
import { createRoot } from "react-dom/client";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { ClipboardList, Loader2, FileSpreadsheet, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { BlankConflictRegistrationFormContent } from "@/components/conflicts/conflict-print-templates";
import { cn } from "@/lib/utils";

interface BlankFormPdfDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function BlankFormPdfDialog({ open, onOpenChange }: BlankFormPdfDialogProps) {
    const { toast } = useToast();
    const [department, setDepartment] = useState("");
    const [count, setCount] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        const n = Math.max(1, Math.min(50, count || 1));
        onOpenChange(false);
        setIsGenerating(true);

        const host = document.createElement("div");
        host.style.cssText = "position:fixed;left:-10000px;top:0;width:794px;background:white;z-index:-1;";
        document.body.appendChild(host);

        const root = createRoot(host);
        const cleanup = () => {
            root.unmount();
            host.remove();
        };

        try {
            await new Promise<void>((resolve) => {
                root.render(<BlankConflictRegistrationFormContent department={department} />);
                requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
            });
            await new Promise((r) => setTimeout(r, 600));

            const target = host.firstElementChild as HTMLElement;
            const canvas = await html2canvas(target, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
                windowWidth: 794,
            });

            const pdf = new jsPDF("p", "mm", "a4", true);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pdfWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            const imgData = canvas.toDataURL("image/png", 0.95);

            const renderOneForm = (isFirst: boolean) => {
                if (!isFirst) pdf.addPage();
                let heightLeft = imgHeight;
                let position = 0;
                pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
                heightLeft -= pdfHeight;
                while (heightLeft > 0) {
                    position = heightLeft - imgHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
                    heightLeft -= pdfHeight;
                }
            };

            for (let i = 0; i < n; i++) renderOneForm(i === 0);

            const safeDept = (department || "generique")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "");
            const fileName = n > 1
                ? `lot-fiches-conflit-vierge-x${n}-${safeDept}-${new Date().toISOString().slice(0, 10)}.pdf`
                : `fiche-conflit-vierge-${safeDept}-${new Date().toISOString().slice(0, 10)}.pdf`;
            pdf.save(fileName);
            toast({
                title: "PDF généré",
                description: n > 1 ? `Lot de ${n} fiches prêt à imprimer.` : "La fiche d'enregistrement est prête.",
            });
        } catch (err) {
            console.error("Blank PDF generation error:", err);
            toast({ variant: "destructive", title: "Erreur PDF", description: "Impossible de générer la fiche PDF." });
        } finally {
            cleanup();
            setIsGenerating(false);
            setDepartment("");
            setCount(1);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-primary" /> Fiche d'enregistrement vierge
                    </DialogTitle>
                    <DialogDescription>
                        Génère un PDF prêt à être imprimé et rempli à la main par les agents de terrain, puis transmis au siège pour saisie.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="blank-form-dept" className="text-xs font-black uppercase tracking-widest text-slate-500">
                            Département / Service destinataire
                        </Label>
                        <Input
                            id="blank-form-dept"
                            placeholder="Ex : Direction Régionale de l'Ouest"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            className="rounded-xl"
                            disabled={isGenerating}
                        />
                        <p className="text-[11px] text-slate-400 italic">
                            Ce nom apparaîtra en tête de chaque fiche. Laissez vide pour un usage générique.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="blank-form-count" className="text-xs font-black uppercase tracking-widest text-slate-500">
                            Nombre de fiches (1 conflit = 1 fiche)
                        </Label>
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-11 w-11 rounded-xl"
                                onClick={() => setCount(c => Math.max(1, c - 1))}
                                disabled={isGenerating || count <= 1}
                            >
                                <X className="h-4 w-4 rotate-90" />
                            </Button>
                            <Input
                                id="blank-form-count"
                                type="number"
                                min={1}
                                max={50}
                                value={count}
                                onChange={(e) => {
                                    const v = Number(e.target.value);
                                    if (Number.isFinite(v)) setCount(Math.max(1, Math.min(50, Math.floor(v))));
                                }}
                                className="rounded-xl text-center font-black text-lg h-11"
                                disabled={isGenerating}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-11 w-11 rounded-xl"
                                onClick={() => setCount(c => Math.min(50, c + 1))}
                                disabled={isGenerating || count >= 50}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {[1, 5, 10, 25, 50].map(n => (
                                <button
                                    key={n}
                                    type="button"
                                    onClick={() => setCount(n)}
                                    disabled={isGenerating}
                                    className={cn(
                                        "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors",
                                        count === n ? "bg-primary text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                    )}
                                >
                                    x{n}
                                </button>
                            ))}
                        </div>
                        <p className="text-[11px] text-slate-400 italic">
                            Maximum 50 fiches par PDF. Chaque fiche commence sur une nouvelle page.
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isGenerating}>Annuler</Button>
                    <Button onClick={handleGenerate} disabled={isGenerating} className="rounded-xl font-bold">
                        {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
                        {isGenerating
                            ? "Génération…"
                            : count > 1
                                ? `Télécharger le PDF (${count} fiches)`
                                : "Télécharger le PDF"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
