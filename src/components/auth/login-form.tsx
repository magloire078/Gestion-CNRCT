"use client";

import React, { useState, memo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { signIn } from "@/services/auth-service";

export const LoginForm = memo(() => {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await signIn(email, password);
            router.push("/intranet");
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Une erreur inattendue est survenue. Veuillez réessayer.";
            const errorCode = (err as any).code;

            if (errorMessage.includes("auth/invalid-credential") ||
                errorMessage.includes("auth/wrong-password") ||
                errorMessage.includes("auth/user-not-found") ||
                errorCode === 'auth/invalid-credential') {
                setError("Email ou mot de passe incorrect.");
            } else if (errorCode === 'auth/unauthorized-domain') {
                setError("Ce domaine n'est pas autorisé dans la configuration Firebase (Authorized Domains).");
            } else if (errorMessage.includes("profile-creation-failed")) {
                setError("Votre compte existe mais le profil n'a pas pu être chargé. Veuillez contacter un administrateur.");
            } else if (errorMessage.includes("Firebase configuration is missing")) {
                setError("La configuration Firebase est manquante dans les variables d'environnement Vercel.");
            }
            else {
                setError("Une erreur de connexion est survenue. Vérifiez votre connexion et les paramètres du projet.");
            }
            console.error("Login Error details:", { 
                message: errorMessage, 
                code: errorCode, 
                fullError: err 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleLogin} className="space-y-6">
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
                <div className="grid gap-2">
                    <div className="flex items-center">
                        <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Mot de passe</Label>
                        <Link
                            href="/forgot-password"
                            className="ml-auto inline-block text-xs font-semibold text-[#006039] hover:underline"
                        >
                            Oublié ?
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
                            className="h-12 px-4 rounded-xl border-primary/10 bg-white/50 focus:ring-[#006039] transition-all"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:bg-[#006039]/5 rounded-lg border-none shadow-none"
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
                        <AlertTitle className="text-sm font-bold">Accès refusé</AlertTitle>
                        <AlertDescription className="text-xs">{error}</AlertDescription>
                    </Alert>
                )}
                <Button type="submit" className="w-full h-14 text-base font-bold bg-[#006039] hover:bg-[#004d2e] rounded-xl shadow-lg shadow-[#006039]/20 transition-all hover:-translate-y-0.5" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    Se connecter
                </Button>
            </div>
        </form>
    );
});

LoginForm.displayName = "LoginForm";
