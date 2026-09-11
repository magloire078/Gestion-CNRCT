"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface InstitutionalReportWrapperProps {
  children: ReactNode;
  isPrinting: boolean;
  onAfterPrint?: () => void;
  orientation?: 'portrait' | 'landscape';
}

/**
 * InstitutionalReportWrapper V8 - "Clone" of the working IT Assets pattern.
 * Uses a direct Portal to document.body and the #print-section ID.
 */
export function InstitutionalReportWrapper({ 
  children, 
  isPrinting, 
  onAfterPrint, 
  orientation = 'portrait' 
}: InstitutionalReportWrapperProps) {
  const [mounted, setMounted] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isPrinting && mounted) {
      setIsPreparing(true);
      
      if (orientation === 'landscape') {
        document.body.classList.add('print-landscape');
      }

      // Minimal delay to ensure DOM portal is mounted and styles applied
      const timer = setTimeout(() => {
        setIsPreparing(false);
        
        // Final quick tick before triggering native print
        setTimeout(() => {
          window.print();
          
          if (orientation === 'landscape') {
            document.body.classList.remove('print-landscape');
          }
          
          if (onAfterPrint) onAfterPrint();
        }, 50);
      }, 120);

      return () => {
        clearTimeout(timer);
        document.body.classList.remove('print-landscape');
      };
    }
  }, [isPrinting, mounted, orientation, onAfterPrint]);

  if (!mounted || !isPrinting) return null;

  const content = (
    <div 
      id="print-section" 
      className="bg-white text-black w-full min-h-screen font-sans"
    >
      {/* Visual Loader - Hidden during actual print */}
      {isPreparing && (
        <div className="fixed inset-0 z-[2147483647] bg-white flex flex-col items-center justify-center print:hidden">
          <div className="relative">
            <div className="h-24 w-24 rounded-full border-4 border-[#006039]/20 border-t-[#006039] animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-[#006039]/10 animate-pulse" />
            </div>
          </div>
          <h2 className="mt-4 text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
            Génération du Rapport
          </h2>
          <p className="mt-2 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
            Finalisation de la mise en page institutionnelle...
          </p>
        </div>
      )}

      {/* Actual Content */}
      <div className="w-full relative print:m-0 print:p-0">
        {children}
      </div>

      <style jsx global>{`
        @media print {
          /* Force isolation via the project's global CSS standard */
          #print-section {
            display: block !important;
            visibility: visible !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  );

  return createPortal(content, document.body);
}
