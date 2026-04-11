import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { User } from "@/types/auth";

interface ConnectedUsersCardProps {
  users: User[];
}

export function ConnectedUsersCard({ users }: ConnectedUsersCardProps) {
  const onlineUsers = users.filter(u => {
    if (!u.lastActive) return false;
    const lastActive = u.lastActive.toDate().getTime();
    const now = Date.now();
    // Considérer comme en ligne si actif au cours des 5 dernières minutes
    return (now - lastActive) < 5 * 60 * 1000;
  });

  return (
    <Card className="border-white/20 shadow-3xl flex flex-col h-full bg-white/40 backdrop-blur-xl overflow-hidden rounded-[2.5rem] group transition-all duration-700 hover:border-white/40 hover:-translate-y-2">
      <CardHeader className="p-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 group-hover:text-slate-900 transition-colors">Sessions Actives</CardTitle>
            <CardDescription className="text-xl font-black uppercase tracking-tighter text-slate-900">Surveillance Live</CardDescription>
          </div>
          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 gap-2.5 py-1.5 px-4 font-black uppercase tracking-widest text-[9px] shadow-2xl animate-in zoom-in-95 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            {onlineUsers.length} en ligne
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <ScrollArea className="h-[300px] px-8 pb-8 custom-scrollbar">
          <div className="space-y-3 pt-6">
            {onlineUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in zoom-in-95 duration-700">
                <div className="h-16 w-16 rounded-[1.5rem] bg-slate-900/5 border border-slate-900/10 flex items-center justify-center mb-5">
                    <span className="text-2xl opacity-50">💤</span>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Aucune activité institutionnelle détectée</p>
              </div>
            ) : (
              onlineUsers.map((user, idx) => (
                <div 
                    key={user.id} 
                    className="flex items-center justify-between group/user p-4 rounded-2xl bg-white/30 border border-white/40 hover:bg-white hover:border-blue-500/30 transition-all duration-500 shadow-sm hover:shadow-xl hover:-translate-y-1 animate-in slide-in-from-right-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-12 w-12 border-2 border-white shadow-2xl transition-all duration-500 group-hover/user:scale-110 group-hover/user:rotate-3">
                        <AvatarImage src={user.photoUrl} alt={user.name} />
                        <AvatarFallback className="text-xs bg-slate-900 text-white font-black uppercase tracking-tighter">
                          {user.name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 shadow-lg z-10" />
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase tracking-tight text-slate-900 group-hover/user:text-blue-600 transition-colors">{user.name}</p>
                      <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-[0.15em] font-black opacity-60">
                        {user.role?.name || 'Officier de Liaison'}
                      </p>
                    </div>
                  </div>
                  <div className="text-[8px] font-black uppercase tracking-[0.25em] text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 transition-all duration-500 group-hover/user:bg-blue-600 group-hover/user:text-white group-hover/user:border-blue-700 group-hover/user:shadow-lg group-hover/user:shadow-blue-500/20">
                    Online
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
