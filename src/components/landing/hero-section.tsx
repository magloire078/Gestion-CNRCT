"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ShieldCheck, ChevronRight, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function HeroSection() {
  return (
    <section className="relative min-h-[60vh] flex items-center pt-16 pb-12 md:pt-20 md:pb-16 overflow-hidden bg-slate-50">
      {/* Premium Background Elements */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523805081730-61444927f07a?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-[0.03] pointer-events-none mix-blend-luminosity" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-slate-50/90 to-white" />
      
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 -left-64 h-96 w-96 bg-amber-500/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-64 h-96 w-96 bg-emerald-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center space-y-12">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center gap-6"
          >
            <div className="flex items-center gap-3">
                <Badge variant="outline" className="px-4 py-1.5 rounded-full border-amber-200 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-[0.3em] shadow-sm flex items-center gap-2">
                    <Crown className="h-3.5 w-3.5" />
                    Haute Institution de l'État
                </Badge>
                <Badge variant="outline" className="px-4 py-1.5 rounded-full border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-[0.3em] shadow-sm hidden sm:flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Loi Organique N° 2014-428
                </Badge>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-[5.5rem] font-black tracking-tighter text-slate-900 leading-[1.1] sm:leading-[0.9] uppercase break-words">
              La Chambre Nationale <br className="hidden md:block"/> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-500 to-emerald-600">des Rois & Chefs Traditionnels</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-500 leading-relaxed max-w-3xl mx-auto font-medium italic mt-4">
              Gardienne des <span className="text-slate-900 font-black">valeurs ancestrales</span> et pilier inébranlable de la <span className="text-emerald-700 font-black">paix sociale</span> en Côte d'Ivoire.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8"
          >
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-16 px-12 rounded-2xl text-sm font-black uppercase tracking-widest bg-slate-900 hover:bg-black text-white shadow-2xl shadow-slate-900/30 transition-all hover:scale-105 active:scale-95 group">
                Espace Intranet
                <ChevronRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-16 px-12 rounded-2xl text-sm font-black uppercase tracking-widest border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-lg shadow-slate-200/50 transition-all hover:scale-105 active:scale-95">
              Découvrir l'Institution
            </Button>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
