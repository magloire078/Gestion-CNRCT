
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
import { signUp } from "@/services/auth-service";
import { getOrganizationSettings } from "@/services/organization-service";
import Image from "next/image";

export default function SignupPage() {
    const router = useRouter();
    const [name, setName] = useState("");
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

    const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (password.length < 6) {
          setError("Le mot de passe doit contenir au moins 6 caractères.");
          return;
        }
        setLoading(true);
        setError(null);
        try {
            await signUp({name, email}, password);
            router.push("/");
        } catch (err: any) {
            if (err.code === 'auth/email-already-in-use') {
                setError("Cette adresse email est déjà utilisée. Essayez de vous connecter.");
            } else {
                setError(err.message || "Échec de l'inscription. Veuillez réessayer.");
            }
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
          <CardTitle className="text-2xl text-center">Inscription</CardTitle>
          <CardDescription className="text-center">
            Créez un compte pour commencer à gérer vos ressources.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nom Complet</Label>
                <Input id="name" placeholder="Prénom Nom" required value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
              </div>
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
                <Label htmlFor="password">Mot de passe</Label>
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
                  <AlertTitle>Erreur d'inscription</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Créer un compte
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            Vous avez déjà un compte ?{" "}
            <Link href="/login" className="underline">
              Se connecter
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
