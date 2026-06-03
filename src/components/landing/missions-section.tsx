"use client";

import { Scale, ShieldCheck, MapPin, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export function MissionsSection() {
  const missions = [
    {
      icon: Scale,
      title: "Médiation Royale",
      description: "Règlement non juridictionnel des conflits par la sagesse ancestrale pour une paix durable.",
      color: "from-amber-500/20 to-amber-500/5",
      textColor: "text-amber-600",
      iconBg: "bg-amber-100"
    },
    {
      icon: ShieldCheck,
      title: "Patrimoine & Us",
      description: "Préservation rigoureuse du répertoire national des autorités traditionnelles et des coutumes ivoiriennes.",
      color: "from-slate-900/10 to-slate-900/5",
      textColor: "text-slate-900",
      iconBg: "bg-slate-100"
    },
    {
      icon: MapPin,
      title: "Unité Nationale",
      description: "Mobilisation des populations pour le développement et renforcement de la cohésion républicaine.",
      color: "from-emerald-500/20 to-emerald-500/5",
      textColor: "text-emerald-600",
      iconBg: "bg-emerald-100"
    }
  ];

  return (
    <section className="pt-8 pb-16 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        
        <div className="text-center mb-12 space-y-6">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-slate-900"
          >
            Missions <span className="text-amber-500">Républicaines</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-slate-500 max-w-2xl mx-auto font-medium text-lg leading-relaxed italic"
          >
            En vertu de la Loi Organique n° 2014-428, la Chambre assure la promotion des idéaux de paix, de développement et de cohésion sociale.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {missions.map((mission, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15, duration: 0.6 }}
              className="group relative bg-white rounded-xl p-6 border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-300/50 transition-all duration-500 hover:-translate-y-2 overflow-hidden flex flex-col"
            >
              <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${mission.color} rounded-full blur-3xl -mr-10 -mt-10 opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className={`h-16 w-16 ${mission.iconBg} rounded-2xl flex items-center justify-center mb-4 relative z-10 shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                <mission.icon className={`h-8 w-8 ${mission.textColor}`} />
              </div>
              
              <h3 className="text-2xl font-black mb-4 text-slate-900 uppercase tracking-tight relative z-10">
                {mission.title}
              </h3>
              
              <p className="text-slate-500 font-medium leading-relaxed relative z-10 flex-grow mb-4">
                {mission.description}
              </p>

              <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-900 transition-colors mt-auto relative z-10 cursor-pointer w-fit">
                En savoir plus <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
