"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WizardStep {
  id: number;
  title: string;
  description: string;
  content: React.ReactNode;
}

export interface WizardFormProps {
  title: string;
  subtitle?: string;
  steps: WizardStep[];
  currentStep: number;
  direction?: number;
  isSubmitting?: boolean;
  error?: string;
  submitLabel?: string;
  SubmitIcon?: React.ElementType;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isNextDisabled?: boolean;
  onCancel?: () => void;
  className?: string;
  headerContent?: React.ReactNode;
}

export function WizardForm({
  title,
  subtitle,
  steps,
  currentStep,
  direction = 1,
  isSubmitting = false,
  error,
  submitLabel = "Enregistrer",
  SubmitIcon = Save,
  onPrev,
  onNext,
  onSubmit,
  isNextDisabled = false,
  onCancel,
  className,
  headerContent
}: WizardFormProps) {
  const slideVariants = {
    hidden: (dir: number) => ({ x: dir > 0 ? '50%' : '-50%', opacity: 0 }),
    visible: { x: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
    exit: (dir: number) => ({ x: dir > 0 ? '-50%' : '50%', opacity: 0, transition: { duration: 0.2 } })
  };

  const activeStep = steps.find(s => s.id === currentStep) || steps[0];

  return (
    <div className={cn("flex flex-col md:flex-row h-full w-full bg-slate-50 overflow-hidden", className)}>
      {/* Sidebar Wizard Navigation (Only show if multiple steps) */}
      {steps.length > 1 && (
        <div className="w-full md:w-72 bg-white border-b md:border-r md:border-b-0 border-slate-100 p-4 md:p-6 shrink-0 flex flex-col justify-between">
          <div>
            <div className="hidden md:block mb-4">
              <h2 className="text-xl font-black uppercase tracking-widest text-slate-900">{title}</h2>
              {subtitle && typeof subtitle === 'string' ? <p className="text-xs text-slate-500 mt-1 font-medium">{subtitle}</p> : subtitle}
              {headerContent && <div className="mt-4">{headerContent}</div>}
            </div>
          <div className="flex flex-row md:flex-col justify-between md:justify-start space-y-0 md:space-y-6 overflow-x-auto no-scrollbar pb-2">
            {steps.map((s) => (
              <div key={s.id} className="flex flex-col md:flex-row items-center md:items-start gap-1 md:gap-4 flex-1 md:flex-none">
                <div className={cn(
                  "flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full border-2 text-[10px] md:text-xs font-black shrink-0 transition-all duration-300",
                  currentStep === s.id ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/30" 
                  : currentStep > s.id ? "bg-emerald-500 border-emerald-500 text-white" : "bg-slate-50 border-slate-200 text-slate-400"
                )}>
                  {currentStep > s.id ? "âœ“" : s.id}
                </div>
                <div className="flex flex-col pt-0 md:pt-1 text-center md:text-left">
                  <span className={cn("text-[9px] md:text-sm font-bold uppercase tracking-wider line-clamp-1", currentStep === s.id ? "text-slate-900" : currentStep > s.id ? "text-slate-700" : "text-slate-400")}>
                    {s.title}
                  </span>
                  <span className="hidden md:block text-[10px] text-slate-400">{s.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* Form Content */}
      <div className="flex-1 flex flex-col relative bg-white overflow-hidden min-h-0">
        <div className="p-6 border-b border-slate-100 bg-white z-10 shrink-0">
          <h3 className="text-xl font-semibold leading-none tracking-tight">{activeStep.title}</h3>
          <p className="text-sm text-slate-500 mt-1">{activeStep.description}</p>
        </div>

        <ScrollArea className="flex-1 p-6 relative h-full">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-6 pb-6"
            >
              {activeStep.content}
              
              {error && <p className="text-sm font-black text-red-500 bg-red-50 p-3 rounded-lg border border-red-100 mt-4">{error}</p>}
            </motion.div>
          </AnimatePresence>
        </ScrollArea>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 backdrop-blur-md flex items-center justify-between z-10 shrink-0">
            <Button type="button" variant="ghost" onClick={currentStep === 1 ? onCancel : onPrev} className="font-bold text-slate-600">
                {currentStep === 1 ? "Annuler" : <><ChevronLeft className="mr-2 h-4 w-4" /> PrÃ©cÃ©dent</>}
            </Button>
            
            {currentStep < steps.length ? (
                <Button type="button" onClick={onNext} disabled={isNextDisabled} className="bg-slate-900 hover:bg-slate-800 font-bold px-5 shadow-xl">
                    Suivant <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
            ) : (
                <Button type="button" onClick={onSubmit} disabled={isSubmitting || isNextDisabled} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 shadow-xl shadow-blue-500/20">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SubmitIcon className="mr-2 h-4 w-4" />}
                    {isSubmitting ? "Enregistrement..." : submitLabel}
                </Button>
            )}
        </div>
      </div>
    </div>
  );
}

export interface WizardFormModalProps extends WizardFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WizardFormModal({ isOpen, onClose, ...props }: WizardFormModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-5xl p-0 overflow-hidden bg-slate-50 w-full h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[90vh]">
        <DialogHeader className="sr-only">
          <DialogTitle>{props.title}</DialogTitle>
          <DialogDescription>{props.subtitle || "Formulaire"}</DialogDescription>
        </DialogHeader>
        <WizardForm {...props} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  );
}
