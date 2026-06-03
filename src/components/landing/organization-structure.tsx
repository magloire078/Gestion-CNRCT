"use client";

import { ArrowRight, Users, Crown, Briefcase, Map } from "lucide-react";
import { motion } from "framer-motion";

export function OrganizationStructure() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const structures = [
    {
      title: "L'Assemblée",
      desc: "Composée de représentants désignés par leurs pairs (2 par département) pour un mandat de 6 ans.",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      title: "Le Directoire",
      desc: "Organe de direction chargé de l'exécution des décisions de l'Assemblée et de la représentation.",
      icon: Crown,
      color: "text-amber-600",
      bg: "bg-amber-50",
      targetId: "directoire-section"
    },
    {
      title: "Le Secrétariat",
      desc: "Assistance administrative et technique pour le bon fonctionnement permanent de l'institution.",
      icon: Briefcase,
      color: "text-slate-600",
      bg: "bg-slate-100"
    },
    {
      title: "Comités Régionaux",
      desc: "Relais opérationnels de la Chambre au niveau de chaque région administrative.",
      icon: Map,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      targetId: "regional-committees"
    }
  ];

  return (
    <section className="py-16 bg-slate-50 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-20 space-y-6">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-slate-900"
          >
            Organisation <span className="text-slate-400">Structurelle</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-slate-500 max-w-2xl mx-auto font-medium text-lg leading-relaxed italic"
          >
            Une structure institutionnelle solide pour assurer la représentation et la médiation des autorités traditionnelles.
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {structures.map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              onClick={() => item.targetId && scrollTo(item.targetId)}
              className={`bg-white p-5 rounded-xl border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden ${item.targetId ? 'cursor-pointer' : ''}`}
            >
              {item.targetId && (
                <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </div>
              )}
              
              <div className={`h-14 w-14 rounded-2xl ${item.bg} flex items-center justify-center mb-6 shadow-sm transition-transform group-hover:scale-110`}>
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>
              
              <h4 className="font-black text-xl mb-3 text-slate-900 uppercase tracking-tight group-hover:text-amber-600 transition-colors">
                {item.title}
              </h4>
              
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
