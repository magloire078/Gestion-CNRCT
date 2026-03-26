
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden bg-gradient-to-b from-[#006039]/5 via-white to-transparent">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-10 pointer-events-none" />
      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5 text-[#006039] text-xs font-bold uppercase tracking-widest mb-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
            Haute Institution de l'État
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-[#1a1a1a] leading-[1.1]">
            La <span className="text-[#006039]">Chambre Nationale des Rois</span> et Chefs Traditionnels
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto font-light">
            Gardienne des <span className="text-[#D4AF37] font-medium">valeurs ancestrales</span> et pilier de la <span className="text-[#006039] font-medium">paix sociale</span> en Côte d'Ivoire.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-6">
            <Link href="/login">
              <Button size="lg" className="h-14 px-10 text-base bg-[#006039] hover:bg-[#004d2e] shadow-xl shadow-[#006039]/20 transition-all hover:-translate-y-1">
                Espace Intranet
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="h-14 px-10 text-base border-primary/10 hover:bg-primary/5 transition-all">
              Découvrir l'Institution
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
