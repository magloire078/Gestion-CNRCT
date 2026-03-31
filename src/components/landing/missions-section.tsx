
"use client";

import { Scale, ShieldCheck, MapPin } from "lucide-react";

export function MissionsSection() {
  return (
    <section className="py-8 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-4">Nos Missions</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            En vertu de la Loi Organique n° 2014-428, la Chambre (CNRCT) assure la promotion des idéaux de paix, de développement et de cohésion sociale.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="group bg-white rounded-xl p-8 border border-primary/5 shadow-sm transition-all hover:shadow-2xl hover:shadow-[#006039]/10 hover:-translate-y-2">
            <div className="h-14 w-14 bg-[#006039]/10 rounded-lg flex items-center justify-center mb-8 transition-colors group-hover:bg-[#006039] group-hover:text-white">
              <Scale className="h-7 w-7 transition-transform group-hover:scale-110" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-[#1a1a1a]">Médiation Royale</h3>
            <p className="text-muted-foreground leading-relaxed">
              Règlement non juridictionnel des conflits par la sagesse ancestrale pour une paix durable.
            </p>
          </div>
          <div className="group bg-white rounded-xl p-8 border border-primary/5 shadow-sm transition-all hover:shadow-2xl hover:shadow-[#D4AF37]/10 hover:-translate-y-2">
            <div className="h-14 w-14 bg-[#D4AF37]/10 rounded-lg flex items-center justify-center mb-8 transition-colors group-hover:bg-[#D4AF37] group-hover:text-white">
              <ShieldCheck className="h-7 w-7 transition-transform group-hover:scale-110" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-[#1a1a1a]">Patrimoine & Us</h3>
            <p className="text-muted-foreground leading-relaxed">
              Préservation rigoureuse du répertoire national des autorités traditionnelles et des coutumes ivoiriennes.
            </p>
          </div>
          <div className="group bg-white rounded-xl p-8 border border-primary/5 shadow-sm transition-all hover:shadow-2xl hover:shadow-[#006039]/10 hover:-translate-y-2">
            <div className="h-14 w-14 bg-[#006039]/10 rounded-lg flex items-center justify-center mb-8 transition-colors group-hover:bg-[#006039] group-hover:text-white">
              <MapPin className="h-7 w-7 transition-transform group-hover:scale-110" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-[#1a1a1a]">Unité Nationale</h3>
            <p className="text-muted-foreground leading-relaxed">
              Mobilisation des populations pour le développement et renforcement de la cohésion républicaine.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
