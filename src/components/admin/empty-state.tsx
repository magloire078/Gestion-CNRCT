import React from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
}

export function EmptyState({ icon: Icon, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground bg-muted/5 rounded-lg border border-dashed border-border/50">
      <Icon className="h-8 w-8 opacity-20" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
