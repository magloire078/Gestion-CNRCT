
"use client";

import { ArrowRight } from "lucide-react";

export function OrganizationStructure() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-8 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-4">Organisation de la Chambre</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Une structure institutionnelle solide pour assurer la représentation et la médiation des autorités traditionnelles.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <div className="bg-background p-6 rounded-xl border shadow-sm border-primary/10">
            <h4 className="font-bold text-lg mb-2 text-primary">L'Assemblée</h4>
            <p className="text-sm text-muted-foreground">Composée de représentants désignés par leurs pairs (2 par département) pour un mandat de 6 ans.</p>
          </div>
          <div 
            className="bg-background p-6 rounded-xl border shadow-sm border-primary/10 cursor-pointer hover:border-[#006039]/30 transition-all hover:shadow-md group" 
            onClick={() => scrollTo('directoire-section')}
          >
            <h4 className="font-bold text-lg mb-2 text-primary group-hover:text-[#006039] transition-colors">Le Directoire</h4>
            <p className="text-sm text-muted-foreground">
              Organe de direction chargé de l'exécution des décisions de l'Assemblée et de la représentation. 
              <ArrowRight className="inline h-3 w-3 opacity-0 group-hover:opacity-100 transition-all translate-x-1" />
            </p>
          </div>
          <div className="bg-background p-6 rounded-xl border shadow-sm border-primary/10">
            <h4 className="font-bold text-lg mb-2 text-primary">Le Secrétariat</h4>
            <p className="text-sm text-muted-foreground">Assistance administrative et technique pour le bon fonctionnement permanent de l'institution.</p>
          </div>
          <div 
            className="bg-background p-6 rounded-xl border shadow-sm border-primary/10 cursor-pointer hover:border-[#006039]/30 transition-all hover:shadow-md group" 
            onClick={() => scrollTo('regional-committees')}
          >
            <h4 className="font-bold text-lg mb-2 text-primary group-hover:text-[#006039] transition-colors">Comités Régionaux</h4>
            <p className="text-sm text-muted-foreground">
              Relais opérationnels de la Chambre au niveau de chaque région administrative. 
              <ArrowRight className="inline h-3 w-3 opacity-0 group-hover:opacity-100 transition-all translate-x-1" />
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
