
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Building2, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { signIn } from "@/services/auth-service";
import { getOrganizationSettings } from "@/services/organization-service";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orgName, setOrgName] = useState("Gestion App");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    getOrganizationSettings().then(settings => {
        setOrgName(settings.organizationName || "Gestion App");
        setLogoUrl(settings.mainLogoUrl);
    })
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
      router.push("/");
    } catch (err) {
      // Capture any error and display its message
      const errorMessage = err instanceof Error ? err.message : "Une erreur inattendue est survenue. Veuillez réessayer.";
      if (errorMessage.includes("auth/invalid-credential") || errorMessage.includes("auth/wrong-password") || errorMessage.includes("auth/user-not-found")) {
          setError("Email ou mot de passe incorrect.");
      } else if (errorMessage.includes("profile-creation-failed")) {
          setError("Votre compte existe mais le profil n'a pas pu être chargé. Veuillez contacter un administrateur.");
      }
      else {
          setError("Une erreur de connexion est survenue. Veuillez réessayer.");
      }
      console.error("Login Error:", err);
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
          <CardTitle className="text-2xl text-center">Connexion</CardTitle>
          <CardDescription className="text-center">
            Entrez votre email ci-dessous pour vous connecter à votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
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
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Link
                    href="/forgot-password"
                    className="ml-auto inline-block text-sm underline"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
                 <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                    onClick={togglePasswordVisibility}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">{showPassword ? 'Cacher' : 'Afficher'} le mot de passe</span>
                  </Button>
                </div>
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erreur de connexion</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Se connecter
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            Vous n'avez pas de compte ?{" "}
            <Link href="/signup" className="underline">
              S'inscrire
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
