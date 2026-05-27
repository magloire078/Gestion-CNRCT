"use client";

import { motion } from "framer-motion";
import { Crown, Tent, Map, Milestone, Home } from "lucide-react";

export function TraditionalHierarchy() {
  const ranks = [
    { label: "Rois", icon: Crown, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Chefs de Province", icon: Map, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Chefs de Canton", icon: Milestone, color: "text-indigo-500", bg: "bg-indigo-50" },
    { label: "Chefs de Tribu", icon: Tent, color: "text-rose-500", bg: "bg-rose-50" },
    { label: "Chefs de Village", icon: Home, color: "text-emerald-500", bg: "bg-emerald-50" }
  ];

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">
            Hiérarchie <span className="text-amber-500">Traditionnelle</span>
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto font-medium italic">
            La Chambre reconnaît et fédère les différentes strates de l'autorité traditionnelle ivoirienne.
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-6 max-w-5xl mx-auto">
          {ranks.map((rank, idx) => (
            <motion.div
              key={rank.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-center gap-3 bg-white px-6 py-4 rounded-[1.5rem] border border-slate-100 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              <div className={`h-10 w-10 rounded-xl ${rank.bg} flex items-center justify-center`}>
                <rank.icon className={`h-5 w-5 ${rank.color}`} />
              </div>
              <span className="font-black text-slate-700 uppercase tracking-tight text-sm">
                {rank.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
