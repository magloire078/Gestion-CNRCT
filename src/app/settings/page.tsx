
"use client";

import { useTheme } from "next-themes";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ChevronRight } from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>

      <Card>
        <CardHeader>
          <CardTitle>Général</CardTitle>
          <CardDescription>
            Gérez les paramètres généraux de l'application.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Link href="/settings/organization" className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors">
                <div>
                    <p className="font-medium">Organisation</p>
                    <p className="text-sm text-muted-foreground">Gérez les logos et les informations de l'entreprise.</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Apparence</CardTitle>
          <CardDescription>
            Personnalisez l'apparence de l'application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="theme">Thème</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sélectionnez un thème" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Clair</SelectItem>
                <SelectItem value="dark">Sombre</SelectItem>
                <SelectItem value="system">Système</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Gérez la manière dont vous recevez les notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
                <Label htmlFor="email-notifications">Notifications par email</Label>
                <p className="text-sm text-muted-foreground">Recevoir des notifications pour les événements importants.</p>
            </div>
            <Switch id="email-notifications" />
          </div>
          <div className="flex items-center justify-between">
            <div>
                <Label htmlFor="push-notifications">Notifications push</Label>
                <p className="text-sm text-muted-foreground">Recevoir des notifications push sur vos appareils.</p>
            </div>
            <Switch id="push-notifications" disabled />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
