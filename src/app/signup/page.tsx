
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
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
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
  const [orgName, setOrgName] = useState("La Chambre des Rois et des Chefs Traditionnels");
  const [logoUrl, setLogoUrl] = useState<string>("https://cnrct.ci/wp-content/uploads/2018/03/logo_chambre.png");

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
      await signUp({ name, email }, password);
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
    <div className="flex min-h-screen items-center justify-center bg-[#fafaf8] relative overflow-hidden p-4">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-10 pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#006039]/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#D4AF37]/5 rounded-full blur-[120px]" />

      <Card className="w-full max-w-md border-primary/5 bg-white/80 backdrop-blur-xl shadow-2xl shadow-[#1a1a1a]/5 rounded-[2rem] overflow-hidden animate-in fade-in zoom-in duration-700">
        <CardHeader className="pt-10 pb-6 px-8">
          <div className="flex flex-col items-center justify-center gap-4 mb-4 group">
            <div className="relative w-24 h-24 transition-all duration-700 ease-in-out group-hover:scale-105">
              <Image
                src={logoUrl}
                alt={orgName}
                fill
                className="object-contain transition-opacity duration-500"
                sizes="96px"
                priority
              />
            </div>
            <div className="text-center">
              <h1 className="text-sm font-bold tracking-[0.3em] uppercase text-[#006039]/60 mb-1">{orgName}</h1>
              <p className="text-[10px] tracking-[0.2em] font-medium text-muted-foreground/60 uppercase">Haute Institution de l'État</p>
            </div>
          </div>
          <CardTitle className="text-3xl font-black text-center text-[#1a1a1a]">Inscription</CardTitle>
          <CardDescription className="text-center text-base mt-2">
            Créez votre accès à l'intranet de la Chambre.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <form onSubmit={handleSignup} className="space-y-6">
            <div className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Nom Complet</Label>
                <Input
                  id="name"
                  placeholder="Prénom Nom"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="h-12 px-4 rounded-xl border-primary/10 bg-white/50 focus:ring-[#006039] transition-all"
                />
              </div>
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
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="h-12 px-4 rounded-xl border-primary/10 bg-white/50 focus:ring-[#006039] transition-all"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:bg-[#006039]/5 rounded-lg"
                    onClick={togglePasswordVisibility}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              {error && (
                <Alert variant="destructive" className="rounded-xl bg-destructive/5 border-destructive/10 animate-shake">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="text-sm font-bold">Erreur d'inscription</AlertTitle>
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full h-14 text-base font-bold bg-[#006039] hover:bg-[#004d2e] rounded-xl shadow-lg shadow-[#006039]/20 transition-all hover:-translate-y-0.5" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Créer un compte
              </Button>
            </div>
          </form>
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Vous avez déjà un compte ?{" "}
            <Link href="/login" className="font-bold text-[#006039] hover:underline">
              Se connecter
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
