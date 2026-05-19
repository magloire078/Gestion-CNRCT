"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

type ResponsiveDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
};

export function ResponsiveDialog({ open, onOpenChange, children }: ResponsiveDialogProps) {
  const isMobile = useIsMobile();
  const Root = isMobile ? Sheet : Dialog;
  return (
    <Root open={open} onOpenChange={onOpenChange}>
      {children}
    </Root>
  );
}

export function ResponsiveDialogTrigger(
  props: React.ComponentProps<typeof DialogTrigger>
) {
  const isMobile = useIsMobile();
  const Trigger = isMobile ? SheetTrigger : DialogTrigger;
  return <Trigger {...props} />;
}

type ResponsiveDialogContentProps = React.ComponentProps<typeof DialogContent> & {
  side?: "top" | "bottom" | "left" | "right";
};

export function ResponsiveDialogContent({
  className,
  children,
  side = "bottom",
  ...props
}: ResponsiveDialogContentProps) {
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <SheetContent
        side={side}
        className={cn(
          side === "bottom" || side === "top"
            ? "h-[90vh] max-h-[90vh] overflow-y-auto rounded-t-2xl"
            : "w-full max-w-md overflow-y-auto",
          className
        )}
      >
        {children}
      </SheetContent>
    );
  }
  return (
    <DialogContent className={className} {...props}>
      {children}
    </DialogContent>
  );
}

export function ResponsiveDialogHeader(
  props: React.ComponentProps<typeof DialogHeader>
) {
  const isMobile = useIsMobile();
  const Header = isMobile ? SheetHeader : DialogHeader;
  return <Header {...props} />;
}

export function ResponsiveDialogFooter(
  props: React.ComponentProps<typeof DialogFooter>
) {
  const isMobile = useIsMobile();
  const Footer = isMobile ? SheetFooter : DialogFooter;
  return <Footer {...props} />;
}

export function ResponsiveDialogTitle(
  props: React.ComponentProps<typeof DialogTitle>
) {
  const isMobile = useIsMobile();
  const Title = isMobile ? SheetTitle : DialogTitle;
  return <Title {...props} />;
}

export function ResponsiveDialogDescription(
  props: React.ComponentProps<typeof DialogDescription>
) {
  const isMobile = useIsMobile();
  const Description = isMobile ? SheetDescription : DialogDescription;
  return <Description {...props} />;
}
