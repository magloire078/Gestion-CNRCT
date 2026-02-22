
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { sendPasswordReset } from "@/services/auth-service";
import { getOrganizationSettings } from "@/services/organization-service";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [orgName, setOrgName] = useState("Gestion App");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    getOrganizationSettings().then(settings => {
      setOrgName(settings.organizationName || "Gestion App");
      setLogoUrl(settings.mainLogoUrl);
    })
  }, []);

  const handleResetRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await sendPasswordReset(email);
      setSuccess("Si un compte avec cet email existe, un lien de réinitialisation a été envoyé.");
    } catch (err: any) {
      setError("Une erreur est survenue. Veuillez réessayer.");
      console.error("Password Reset Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafaf8] relative overflow-hidden p-4">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-10 pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#006039]/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#D4AF37]/5 rounded-full blur-[120px]" />

      <Card className="w-full max-w-md border-primary/5 bg-white/80 backdrop-blur-xl shadow-2xl shadow-[#1a1a1a]/5 rounded-[2rem] overflow-hidden animate-in fade-in zoom-in duration-700">
        <CardHeader className="pt-10 pb-6 px-8">
          <div className="flex flex-col items-center justify-center gap-4 mb-4 group">
            <div className="relative w-24 h-24 transition-transform duration-500 group-hover:scale-105">
              {logoUrl ? (
                <Image src={logoUrl} alt={orgName} layout="fill" objectFit="contain" priority />
              ) : (
                <Building2 className="h-16 w-16 text-[#006039]" />
              )}
            </div>
            <div className="text-center">
              <h1 className="text-sm font-bold tracking-[0.3em] uppercase text-[#006039]/60 mb-1">{orgName}</h1>
              <p className="text-[10px] tracking-[0.2em] font-medium text-muted-foreground/60 uppercase">Haute Institution de l'État</p>
            </div>
          </div>
          <CardTitle className="text-3xl font-black text-center text-[#1a1a1a]">Mot de passe oublié</CardTitle>
          <CardDescription className="text-center text-base mt-2">
            Entrez votre email institutionnel pour recevoir un lien de réinitialisation sécurisé.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <form onSubmit={handleResetRequest} className="space-y-6">
            <div className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email Professionnel</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nom@exemple.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="h-12 px-4 rounded-xl border-primary/10 bg-white/50 focus:ring-[#006039] transition-all"
                />
              </div>

              {error && (
                <Alert variant="destructive" className="rounded-xl bg-destructive/5 border-destructive/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="text-sm font-bold">Erreur</AlertTitle>
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert variant="default" className="rounded-xl border-[#006039]/20 bg-[#006039]/5 text-[#006039] [&>svg]:text-[#006039]">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle className="text-sm font-bold">Lien envoyé</AlertTitle>
                  <AlertDescription className="text-xs">{success}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full h-14 text-base font-bold bg-[#006039] hover:bg-[#004d2e] rounded-xl shadow-lg shadow-[#006039]/20 transition-all hover:-translate-y-0.5" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Envoyer le lien
              </Button>
            </div>
          </form>
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Vous vous souvenez de votre mot de passe ?{" "}
            <Link href="/login" className="font-bold text-[#006039] hover:underline">
              Se connecter
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
