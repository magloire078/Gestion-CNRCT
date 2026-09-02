
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
import { ChevronRight, ShieldAlert, ShieldCheck, Loader2 } from "lucide-react";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { useAuth } from "@/components/auth/auth-provider";
import { generateTotpSecret, verifyTotpEnrollment } from "@/services/auth-service";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  
  // MFA TOTP State
  const [totpSecret, setTotpSecret] = useState<any>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secretKey, setSecretKey] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [mfaSuccess, setMfaSuccess] = useState(false);

  const handleStartEnrollTotp = async () => {
    if (!user?.email) return;
    setMfaLoading(true);
    setMfaError(null);
    try {
      const { totpSecret, qrCodeUrl, secretKey } = await generateTotpSecret(user.email);
      setTotpSecret(totpSecret);
      setQrCodeUrl(qrCodeUrl);
      setSecretKey(secretKey);
    } catch (err: any) {
      console.error(err);
      setMfaError("Impossible de générer le secret TOTP.");
    } finally {
      setMfaLoading(false);
    }
  };

  const handleVerifyTotpCode = async () => {
    if (!totpSecret || !mfaCode) return;
    setMfaLoading(true);
    setMfaError(null);
    try {
      await verifyTotpEnrollment(totpSecret, mfaCode);
      setMfaSuccess(true);
      setTotpSecret(null);
    } catch (err: any) {
      console.error(err);
      setMfaError("Code incorrect ou expiré.");
    } finally {
      setMfaLoading(false);
    }
  };

  return (
    <PermissionGuard permission="page:settings:view">
      <div className="flex flex-col gap-6 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>

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

        <Card className="border-red-100">
          <CardHeader className="bg-red-50/50">
            <CardTitle className="flex items-center gap-2 text-red-700">
              <ShieldAlert className="h-5 w-5" />
              Sécurité du Compte (MFA - Authenticator)
            </CardTitle>
            <CardDescription>
              L'Authentification Multi-Facteurs (MFA) via une application comme Google Authenticator protège votre compte administrateur.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {mfaSuccess ? (
              <div className="flex items-center gap-3 p-4 bg-green-50 text-green-700 rounded-lg">
                <ShieldCheck className="h-6 w-6" />
                <p className="font-medium">L'authentification à deux facteurs est activée sur votre compte.</p>
              </div>
            ) : totpSecret && qrCodeUrl ? (
              <div className="space-y-4">
                <p className="text-sm">1. Scannez ce QR Code avec votre application Authenticator (ex: Google Authenticator).</p>
                <div className="flex justify-center bg-white p-4 rounded-lg border inline-block">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`} alt="QR Code MFA" className="w-48 h-48" />
                </div>
                <p className="text-sm">Clé secrète (si impossible de scanner) : <strong className="tracking-widest font-mono bg-slate-100 p-1 rounded">{secretKey}</strong></p>
                
                <p className="text-sm mt-4">2. Saisissez le code à 6 chiffres généré par l'application :</p>
                <div className="grid gap-2 max-w-sm">
                  <Input 
                    value={mfaCode}
                    onChange={e => setMfaCode(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    className="tracking-widest font-mono text-center text-lg"
                  />
                </div>
                {mfaError && <p className="text-sm text-red-600">{mfaError}</p>}
                <div className="flex gap-2">
                  <Button onClick={handleVerifyTotpCode} disabled={mfaLoading || mfaCode.length !== 6}>
                    {mfaLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Vérifier et Activer
                  </Button>
                  <Button variant="outline" onClick={() => setTotpSecret(null)}>Annuler</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Générez un QR Code pour configurer votre application d'authentification (Google Authenticator, Microsoft Authenticator, Authy...).
                </p>
                <div className="flex gap-2 max-w-sm">
                  <Button onClick={handleStartEnrollTotp} disabled={mfaLoading}>
                    {mfaLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Configurer le MFA (Authenticator)
                  </Button>
                </div>
                {mfaError && <p className="text-sm text-red-600">{mfaError}</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}
