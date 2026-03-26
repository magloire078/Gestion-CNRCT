
"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/5 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 h-24 flex items-center justify-between">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="hidden sm:flex relative w-16 h-16 transition-transform duration-500 group-hover:rotate-6">
            <Image 
              src="https://cnrct.ci/wp-content/uploads/2018/03/logo_chambre.png" 
              alt="Logo CNRCT" 
              fill 
              className="object-contain" 
              sizes="64px" 
              priority 
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl tracking-tight text-[#006039]">CNRCT</span>
            <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-muted-foreground">République de Côte d'Ivoire</span>
          </div>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="default" className="gap-2">
              Connexion Intranet <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
