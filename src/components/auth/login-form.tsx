"use client";

import React, { useState, memo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { signIn, verifyTotpSignIn } from "@/services/auth-service";
import type { MultiFactorResolver } from "firebase/auth";

export const LoginForm = memo(() => {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // MFA State
    const [resolver, setResolver] = useState<MultiFactorResolver | null>(null);
    const [mfaCode, setMfaCode] = useState("");

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        
        // Yield to allow React to render the loading state and improve INP
        await new Promise(resolve => setTimeout(resolve, 0));

        try {
            await signIn(email, password);
            router.push("/intranet");
        } catch (err: any) {
            if (err.code === 'auth/multi-factor-auth-required') {
                setResolver(err.resolver);
                setLoading(false);
                return; // Stop normal flow
            }

            const errorMessage = err instanceof Error ? err.message : "Une erreur inattendue est survenue. Veuillez réessayer.";
            const errorCode = err.code;

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
            } else if (errorCode === 'auth/too-many-requests') {
                setError("Trop de tentatives. Veuillez réessayer plus tard.");
            } else {
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

    const handleVerifyMfa = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resolver) return;
        
        setLoading(true);
        setError(null);
        try {
            await verifyTotpSignIn(resolver, mfaCode);
            router.push("/intranet");
        } catch (err: any) {
            console.error("MFA Verify Error", err);
            setError("Code Authenticator incorrect.");
        } finally {
            setLoading(false);
        }
    };

    if (resolver) {
        return (
            <form onSubmit={handleVerifyMfa} className="space-y-6">
                <div className="flex flex-col items-center justify-center space-y-4 mb-6">
                    <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                        <h3 className="font-bold text-lg text-slate-900">Vérification en deux étapes</h3>
                        <p className="text-sm text-slate-500">
                            Ouvrez votre application Google Authenticator et saisissez le code à 6 chiffres.
                        </p>
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="mfaCode" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Code TOTP (6 chiffres)</Label>
                    <Input
                        id="mfaCode"
                        type="text"
                        placeholder="123456"
                        required
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value)}
                        disabled={loading}
                        className="h-12 px-4 rounded-xl border-primary/10 text-center tracking-widest font-mono text-lg bg-white/50 focus:ring-[#006039] transition-all"
                        maxLength={6}
                    />
                </div>

                {error && (
                    <Alert variant="destructive" className="rounded-xl bg-destructive/5 border-destructive/10">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">{error}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-3">
                    <Button type="submit" className="w-full h-14 text-base font-bold bg-[#006039] hover:bg-[#004d2e] rounded-xl shadow-lg shadow-[#006039]/20 transition-all hover:-translate-y-0.5" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                        Vérifier et se connecter
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => { setResolver(null); setMfaCode(''); }} className="w-full" disabled={loading}>
                        Annuler
                    </Button>
                </div>
            </form>
        );
    }

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
