
"use client";

import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
      <WifiOff className="h-16 w-16 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold mb-2">Vous êtes hors ligne</h1>
      <p className="text-muted-foreground">
        Il semble que vous n'ayez pas de connexion Internet. Certaines fonctionnalités peuvent être indisponibles.
      </p>
    </div>
  );
}
