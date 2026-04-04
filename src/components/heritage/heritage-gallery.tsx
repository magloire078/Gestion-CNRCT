
"use client";

import { useState } from "react";
import { Image as ImageIcon, Maximize2, MoveRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeritageGalleryProps {
    images: string[];
    className?: string;
}

export function HeritageGallery({ images, className }: HeritageGalleryProps) {
    const [activeIndex, setActiveIndex] = useState(0);

    if (!images || images.length === 0) return null;

    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-4 gap-6", className)}>
            {/* Main Featured Image */}
            <div className="md:col-span-3 rounded-[3rem] overflow-hidden relative group aspect-video shadow-2xl bg-slate-100">
                <img 
                    src={images[activeIndex]} 
                    alt={`Vue ${activeIndex + 1}`} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />
                <div className="absolute bottom-8 left-8 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                        <ImageIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-white">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Archive Visuelle</p>
                        <p className="text-lg font-black tracking-tight">Détail du Patrimoine {activeIndex + 1}/{images.length}</p>
                    </div>
                </div>
                
                <button 
                    aria-label="Agrandir l'image"
                    className="absolute top-8 right-8 h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                >
                    <Maximize2 className="h-5 w-5" />
                </button>
            </div>

            {/* Thumbnails Sidebar */}
            <div className="hidden md:flex flex-col gap-4 overflow-y-auto max-h-[500px] pr-2 scrollbar-hide">
                {images.map((img, idx) => (
                    <button
                        key={idx}
                        onClick={() => setActiveIndex(idx)}
                        aria-label={`Afficher l'image ${idx + 1}`}
                        className={cn(
                            "relative aspect-square rounded-2xl overflow-hidden border-2 transition-all group shrink-0",
                            activeIndex === idx 
                                ? "border-amber-500 ring-4 ring-amber-500/20 scale-95" 
                                : "border-transparent opacity-60 hover:opacity-100 hover:scale-[1.02]"
                        )}
                    >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        {activeIndex !== idx && (
                            <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <MoveRight className="h-5 w-5 text-white" />
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {/* Mobile Thumbnails */}
            <div className="flex md:hidden gap-3 overflow-x-auto pb-4 scrollbar-hide">
                 {images.map((img, idx) => (
                    <button
                        key={idx}
                        onClick={() => setActiveIndex(idx)}
                        aria-label={`Afficher l'image ${idx + 1}`}
                        className={cn(
                            "relative aspect-square w-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all",
                            activeIndex === idx 
                                ? "border-amber-500 scale-90" 
                                : "border-transparent opacity-60"
                        )}
                    >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                ))}
            </div>
        </div>
    );
}
