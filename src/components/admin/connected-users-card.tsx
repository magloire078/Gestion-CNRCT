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
    <Card className="border-border/50 shadow-sm flex flex-col h-full bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3 border-b border-border/10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold">Employés en ligne</CardTitle>
          <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20 gap-1.5 py-0.5 px-2 font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            {onlineUsers.length}
          </Badge>
        </div>
        <CardDescription>Utilisateurs actifs au cours des 5 dernières minutes.</CardDescription>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <ScrollArea className="h-[250px]">
          <div className="p-4 space-y-4">
            {onlineUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground opacity-50 italic">
                <p className="text-sm">Aucun utilisateur en ligne actuellement.</p>
              </div>
            ) : (
              onlineUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between group p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-9 w-9 border border-border/50 shadow-sm transition-transform group-hover:scale-105">
                        <AvatarImage src={user.photoUrl} alt={user.name} />
                        <AvatarFallback className="text-xs bg-primary/5 text-primary font-bold">
                          {user.name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-green-500 shadow-sm" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-none">{user.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-bold opacity-70">
                        {user.role?.name || 'Collaborateur'}
                      </p>
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-medium bg-muted/30 px-2 py-0.5 rounded-full opacity-60 group-hover:opacity-100 transition-opacity">
                    Actif
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
