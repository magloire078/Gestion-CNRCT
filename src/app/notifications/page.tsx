"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { subscribeToNotifications, markNotificationsAsRead } from '@/services/notification-service';
import type { Notification } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToNotifications(user.id, (data) => {
        setNotifications(data);
        setLoading(false);
      }, (err) => {
        console.error(err);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    if (unreadIds.length > 0) {
      await markNotificationsAsRead(unreadIds);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    await markNotificationsAsRead([id]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderNotificationList = (list: Notification[]) => {
    if (list.length === 0) {
      return (
        <div className="text-center py-12 px-6 flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Bell className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Aucune notification</h3>
          <p className="text-sm text-slate-500">Vous êtes à jour !</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4">
        {list.map(notif => (
          <div key={notif.id} className={cn(
            "flex items-start gap-4 p-4 rounded-xl border transition-all",
            notif.isRead ? "bg-white border-slate-200" : "bg-blue-50/50 border-blue-100"
          )}>
            <div className={cn(
              "mt-1.5 h-2 w-2 shrink-0 rounded-full",
              notif.isRead ? "bg-slate-300" : "bg-blue-600"
            )} />
            <div className="flex-1 space-y-1">
              <div className="flex items-start justify-between gap-4">
                <Link href={notif.href} onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}>
                  <p className="font-semibold text-sm text-slate-900 hover:text-blue-600 transition-colors">
                    {notif.title}
                  </p>
                </Link>
                <span className="text-xs text-slate-500 whitespace-nowrap">
                  {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: fr })}
                </span>
              </div>
              <p className="text-sm text-slate-600">{notif.description}</p>
            </div>
            {!notif.isRead && (
              <Button variant="ghost" size="icon" onClick={() => handleMarkAsRead(notif.id)} className="h-8 w-8 shrink-0 text-slate-400 hover:text-slate-900" title="Marquer comme lu">
                <CheckCheck className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Centre de notifications</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gérez vos alertes et restez informé de l'activité du système.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead} variant="outline" className="gap-2">
            <CheckCheck className="h-4 w-4" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-4">
          <Tabs defaultValue="all" className="w-full">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="all">Toutes</TabsTrigger>
                <TabsTrigger value="unread" className="gap-2">
                  Non lues
                  {unreadCount > 0 && (
                    <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      {unreadCount}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="all" className="mt-6">
              {renderNotificationList(notifications)}
            </TabsContent>
            
            <TabsContent value="unread" className="mt-6">
              {renderNotificationList(notifications.filter(n => !n.isRead))}
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>
    </div>
  );
}
