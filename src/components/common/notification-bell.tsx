import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { subscribeToNotifications, markNotificationsAsRead } from "@/services/notification-service";
import type { Notification } from "@/lib/data";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Memoized Notification Item to reduce re-render lag
const NotificationItem = React.memo(({ notif, onSelect }: { notif: Notification, onSelect: () => void }) => {
  return (
    <Link
      href={notif.href}
      className="block p-4 hover:bg-slate-50 transition-colors group"
      onClick={onSelect}
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          "mt-1.5 h-2 w-2 rounded-full transition-all",
          notif.isRead ? "bg-slate-200" : "bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)] scale-110"
        )} />
        <div className="flex-1 space-y-1">
          <p className="font-black text-[11px] uppercase tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">{notif.title}</p>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">{notif.description}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center">
            <span className="h-1 w-1 rounded-full bg-slate-300 mr-2" />
            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: fr })}
          </p>
        </div>
      </div>
    </Link>
  );
});

NotificationItem.displayName = "NotificationItem";

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToNotifications(user.id, (data) => {
        setNotifications(data);
      }, console.error);
      return () => unsubscribe();
    }
  }, [user]);

  // Performance: Limit calculations to memoized values
  const { unreadCount, displayNotifications } = useMemo(() => {
    const unread = notifications.filter(n => !n.isRead).length;
    // Premium Performance Optimization: Only render the top 20 notifications
    // Long lists in popovers are the main cause of INP lag
    const display = notifications.slice(0, 20);
    return { unreadCount: unread, displayNotifications: display };
  }, [notifications]);

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (!open && unreadCount > 0) {
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
      try {
        await markNotificationsAsRead(unreadIds);
      } catch (error) {
        console.error("Failed to mark notifications as read", error);
      }
    }
  };

  const handleSelect = React.useCallback(() => setIsOpen(false), []);

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl hover:bg-slate-100 transition-colors">
          <Bell className="h-5 w-5 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 border-2 border-white text-white text-[8px] font-black">
              {unreadCount}
            </span>
          )}
          <span className="sr-only">Ouvrir les notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 border-none bg-white/90 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden mt-2" align="end" data-ai-hint="notifications-popover">
        <div className="p-4 bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest border-b border-white/10">
          Centre de Notifications
        </div>
        <ScrollArea className="h-96">
          {displayNotifications.length > 0 ? (
            <div className="flex flex-col divide-y divide-slate-100">
              {displayNotifications.map((notif) => (
                <NotificationItem 
                  key={notif.id} 
                  notif={notif} 
                  onSelect={handleSelect} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-6 flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                <Bell className="h-6 w-6 text-slate-300" />
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Silence radio</p>
              <p className="text-xs text-slate-400 text-center font-medium">Vous n'avez aucune notification pour le moment.</p>
            </div>
          )}
        </ScrollArea>
        <div className="p-3 bg-slate-50/50 border-t border-slate-100 text-center">
           <button className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors">Tout marquer comme lu</button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
