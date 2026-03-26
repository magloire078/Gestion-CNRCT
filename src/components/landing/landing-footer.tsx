
"use client";

import Link from "next/link";
import Image from "next/image";

export function LandingFooter() {
  return (
    <footer className="bg-[#1a1a1a] text-white/70 py-16 border-t border-white/5">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 relative mb-6 grayscale opacity-50 contrast-125">
            <Image 
              src="https://cnrct.ci/wp-content/uploads/2018/03/logo_chambre.png" 
              alt="CNRCT" 
              fill 
              className="object-contain" 
              sizes="64px" 
            />
          </div>
          <p className="font-serif italic text-xl text-white mb-2">Chambre Nationale des Rois et Chefs Traditionnels</p>
          <p className="text-sm tracking-[0.3em] uppercase mb-10 opacity-60">République de Côte d'Ivoire</p>
          <div className="flex gap-8 mb-12">
            <Link href="#" className="hover:text-[#D4AF37] transition-colors">L'Institution</Link>
            <Link href="#" className="hover:text-[#D4AF37] transition-colors">Missions</Link>
            <Link href="#" className="hover:text-[#D4AF37] transition-colors">Contact</Link>
          </div>
          <div className="text-[10px] uppercase tracking-widest opacity-40">
            &copy; {new Date().getFullYear()} CNRCT. Excellence & Tradition.
          </div>
        </div>
      </div>
    </footer>
  );
}
