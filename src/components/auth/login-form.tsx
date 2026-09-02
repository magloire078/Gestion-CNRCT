"use client";

import React, { useState, memo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { signIn } from "@/services/auth-service";
import { isMfaChallengeError, getMfaResolver, resolveTotpChallenge } from "@/services/mfa-service";
import type { MultiFactorError, MultiFactorInfo, MultiFactorResolver } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

export const LoginForm = memo(() => {
    const router = useRouter();
    const { toast } = useToast();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // MFA challenge state
    const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);
    const [selectedHint, setSelectedHint] = useState<MultiFactorInfo | null>(null);
    const [totpCode, setTotpCode] = useState("");
    const [mfaBusy, setMfaBusy] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        await new Promise(resolve => setTimeout(resolve, 0));

        try {
            await signIn(email, password);
            router.push("/intranet");
        } catch (err) {
            // MFA required : ouvre la boîte de dialogue de challenge
            if (isMfaChallengeError(err)) {
                const resolver = getMfaResolver(err as MultiFactorError);
                setMfaResolver(resolver);
                setSelectedHint(resolver.hints[0] || null);
                setTotpCode("");
                setLoading(false);
                return;
            }

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

    const handleMfaSubmit = async () => {
        if (!mfaResolver || !selectedHint) return;
        if (!/^\d{6}$/.test(totpCode)) {
            toast({ variant: 'destructive', title: 'Code invalide', description: 'Le code doit contenir exactement 6 chiffres.' });
            return;
        }
        setMfaBusy(true);
        try {
            await resolveTotpChallenge(mfaResolver, selectedHint, totpCode);
            setMfaResolver(null);
            router.push("/intranet");
        } catch (err: any) {
            const msg = err?.code === 'auth/invalid-verification-code'
                ? "Code incorrect. Vérifiez qu'il correspond bien à ce qu'affiche votre application."
                : "L'authentification à deux facteurs a échoué. Réessayez.";
            toast({ variant: 'destructive', title: 'Erreur', description: msg });
        } finally {
            setMfaBusy(false);
        }
    };

    return (
        <>
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

        {/* MFA challenge dialog */}
        <Dialog open={!!mfaResolver} onOpenChange={(o) => { if (!o) { setMfaResolver(null); setTotpCode(""); } }}>
            <DialogContent className="rounded-2xl max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-emerald-600" />
                        Vérification en deux étapes
                    </DialogTitle>
                    <DialogDescription>
                        Ouvrez votre application d'authentification et saisissez le code à 6 chiffres.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {mfaResolver && mfaResolver.hints.length > 1 && (
                        <div>
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">Choisir le facteur</Label>
                            <div className="space-y-2">
                                {mfaResolver.hints.map(h => (
                                    <button
                                        key={h.uid}
                                        type="button"
                                        onClick={() => setSelectedHint(h)}
                                        className={`w-full text-left rounded-xl px-3 py-2 text-sm font-bold border transition-colors ${selectedHint?.uid === h.uid ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                                    >
                                        {h.displayName || 'Second facteur'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <Label htmlFor="mfa-challenge-code" className="text-xs font-black uppercase tracking-widest text-slate-500">Code à 6 chiffres</Label>
                        <Input
                            id="mfa-challenge-code"
                            value={totpCode}
                            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="123 456"
                            className="rounded-xl mt-1 text-center text-2xl font-mono tracking-widest h-14"
                            maxLength={6}
                            disabled={mfaBusy}
                            autoFocus
                            onKeyDown={(e) => { if (e.key === 'Enter' && totpCode.length === 6) { e.preventDefault(); handleMfaSubmit(); } }}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => { setMfaResolver(null); setTotpCode(""); }} disabled={mfaBusy}>Annuler</Button>
                    <Button onClick={handleMfaSubmit} disabled={mfaBusy || totpCode.length !== 6} className="rounded-xl font-bold">
                        {mfaBusy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Valider
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
});

LoginForm.displayName = "LoginForm";
