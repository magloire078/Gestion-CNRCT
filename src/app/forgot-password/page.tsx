
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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
           <div className="flex flex-col items-center justify-center gap-2 mb-4">
             {logoUrl ? (
                  <Image src={logoUrl} alt={orgName} width={80} height={80} className="object-contain" />
              ) : (
                  <Building2 className="h-10 w-10 text-primary" />
              )}
              <h1 className="text-2xl font-semibold tracking-tight text-center">{orgName}</h1>
          </div>
          <CardTitle className="text-2xl text-center">Mot de passe oublié</CardTitle>
          <CardDescription className="text-center">
            Entrez votre email pour recevoir un lien de réinitialisation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetRequest}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nom@exemple.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erreur</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                 <Alert variant="default" className="border-green-500 text-green-700 dark:border-green-600 dark:text-green-400 [&>svg]:text-green-500">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Succès</AlertTitle>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Envoyer le lien
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            Vous vous souvenez de votre mot de passe ?{" "}
            <Link href="/login" className="underline">
              Se connecter
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
