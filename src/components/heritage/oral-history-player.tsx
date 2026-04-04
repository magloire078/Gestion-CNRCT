
"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, RotateCcw, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface OralHistoryPlayerProps {
    audioUrl: string;
    title?: string;
    className?: string;
}

export function OralHistoryPlayer({ audioUrl, title, className }: OralHistoryPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(0.8);
    
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const setAudioData = () => setDuration(audio.duration);
        const setAudioTime = () => setCurrentTime(audio.currentTime);

        audio.addEventListener("loadedmetadata", setAudioData);
        audio.addEventListener("timeupdate", setAudioTime);

        return () => {
            audio.removeEventListener("loadedmetadata", setAudioData);
            audio.removeEventListener("timeupdate", setAudioTime);
        };
    }, []);

    const togglePlay = () => {
        if (isPlaying) {
            audioRef.current?.pause();
        } else {
            audioRef.current?.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (value: number[]) => {
        const time = value[0];
        setCurrentTime(time);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    return (
        <div className={cn("p-6 rounded-[2rem] bg-slate-900 text-white shadow-2xl relative overflow-hidden group", className)}>
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                <Radio className="h-24 w-24" />
            </div>

            <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <Volume2 className="h-5 w-5 text-slate-950" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">Récit de l'Oralité</p>
                        <h3 className="text-lg font-black tracking-tight">{title || "Histoire & Légende"}</h3>
                    </div>
                </div>

                <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />

                <div className="space-y-2">
                    <Slider
                        value={[currentTime]}
                        max={duration || 100}
                        step={0.1}
                        onValueChange={handleSeek}
                        className="cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-12 w-12 rounded-full border border-white/10 hover:bg-white/10 text-white"
                            onClick={() => {
                                if (audioRef.current) audioRef.current.currentTime = 0;
                            }}
                        >
                            <RotateCcw className="h-5 w-5" />
                        </Button>
                        <Button 
                            variant="default" 
                            size="icon" 
                            className="h-14 w-14 rounded-full bg-white text-slate-950 hover:bg-amber-500 hover:text-slate-950 transition-all shadow-xl"
                            onClick={togglePlay}
                        >
                            {isPlaying ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current ml-1" />}
                        </Button>
                    </div>

                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2">
                         <Volume2 className="h-4 w-4 text-slate-400" />
                         <Slider 
                            value={[volume * 100]} 
                            max={100} 
                            className="w-20" 
                            onValueChange={(v) => {
                                const newVol = v[0] / 100;
                                setVolume(newVol);
                                if (audioRef.current) audioRef.current.volume = newVol;
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
