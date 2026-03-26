
"use client";

import { Badge } from "@/components/ui/badge";

export function TraditionalHierarchy() {
  const ranks = ["Rois", "Chefs de Province", "Chefs de Canton", "Chefs de Tribu", "Chefs de Village"];

  return (
    <section className="py-8 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-4">Hiérarchie Traditionnelle</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            La Chambre reconnaît et fédère les différentes strates de l'autorité traditionnelle ivoirienne.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
          {ranks.map((rank) => (
            <Badge key={rank} variant="secondary" className="text-lg px-6 py-2 rounded-full border-primary/10">
              {rank}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  );
}
