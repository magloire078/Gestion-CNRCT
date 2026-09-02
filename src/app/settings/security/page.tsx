"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, KeyRound, Smartphone, Trash2, Loader2, Copy, CheckCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import {
    getEnrolledFactors,
    reauthenticateWithPassword,
    startTotpEnrollment,
    finishTotpEnrollment,
    unenrollFactor,
    type TotpEnrollmentStart,
} from "@/services/mfa-service";
import type { MultiFactorInfo } from "firebase/auth";
import { logAudit } from "@/services/audit-log-service";

export default function SecuritySettingsPage() {
    const { toast } = useToast();
    const [factors, setFactors] = useState<MultiFactorInfo[]>([]);
    const [loading, setLoading] = useState(true);

    // Enrollment state
    const [enrollOpen, setEnrollOpen] = useState(false);
    const [enrollStep, setEnrollStep] = useState<'password' | 'scan' | 'done'>('password');
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("Mon téléphone");
    const [enrollData, setEnrollData] = useState<TotpEnrollmentStart | null>(null);
    const [verificationCode, setVerificationCode] = useState("");
    const [busy, setBusy] = useState(false);
    const [copiedKey, setCopiedKey] = useState(false);

    // Unenroll state
    const [unenrollTarget, setUnenrollTarget] = useState<MultiFactorInfo | null>(null);
    const [unenrollPassword, setUnenrollPassword] = useState("");

    const refreshFactors = () => {
        const user = auth.currentUser;
        if (user) {
            setFactors(getEnrolledFactors(user));
        }
        setLoading(false);
    };

    useEffect(() => {
        const unsub = auth.onAuthStateChanged((u) => {
            if (u) setFactors(getEnrolledFactors(u));
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const resetEnroll = () => {
        setEnrollStep('password');
        setPassword("");
        setDisplayName("Mon téléphone");
        setEnrollData(null);
        setVerificationCode("");
        setCopiedKey(false);
    };

    const handleReauthAndStart = async () => {
        const user = auth.currentUser;
        if (!user) return;
        setBusy(true);
        try {
            await reauthenticateWithPassword(user, password);
            const data = await startTotpEnrollment(user, user.email || 'user', 'CNRCT');
            setEnrollData(data);
            setEnrollStep('scan');
        } catch (err: any) {
            const msg = err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential'
                ? "Mot de passe incorrect."
                : "Impossible de démarrer l'enrôlement. Vérifiez que TOTP est bien activé dans la console Firebase.";
            toast({ variant: 'destructive', title: 'Erreur', description: msg });
        } finally {
            setBusy(false);
        }
    };

    const handleFinishEnroll = async () => {
        const user = auth.currentUser;
        if (!user || !enrollData) return;
        if (!/^\d{6}$/.test(verificationCode)) {
            toast({ variant: 'destructive', title: 'Code invalide', description: 'Le code doit contenir exactement 6 chiffres.' });
            return;
        }
        setBusy(true);
        try {
            await finishTotpEnrollment(user, enrollData.secret, verificationCode, displayName.trim() || 'Second facteur');
            setEnrollStep('done');
            refreshFactors();
            void logAudit({
                action: 'permission-change',
                resource: 'user',
                resourceId: user.uid,
                resourceLabel: user.displayName || user.email || user.uid,
                summary: `Activation MFA (TOTP) — ${displayName}`,
            });
            toast({ title: 'MFA activée', description: 'Votre second facteur est maintenant enregistré.' });
        } catch (err: any) {
            const msg = err?.code === 'auth/invalid-verification-code'
                ? "Code incorrect. Vérifiez qu'il correspond bien à ce qu'affiche votre application."
                : "L'enregistrement a échoué. Réessayez ou générez un nouveau QR code.";
            toast({ variant: 'destructive', title: 'Erreur', description: msg });
        } finally {
            setBusy(false);
        }
    };

    const handleUnenroll = async () => {
        const user = auth.currentUser;
        if (!user || !unenrollTarget) return;
        setBusy(true);
        try {
            await reauthenticateWithPassword(user, unenrollPassword);
            await unenrollFactor(user, unenrollTarget);
            void logAudit({
                action: 'permission-change',
                resource: 'user',
                resourceId: user.uid,
                resourceLabel: user.displayName || user.email || user.uid,
                summary: `Désactivation MFA — ${unenrollTarget.displayName || 'facteur'}`,
            });
            toast({ title: 'Facteur retiré', description: 'Le second facteur a été désenregistré.' });
            setUnenrollTarget(null);
            setUnenrollPassword("");
            refreshFactors();
        } catch (err: any) {
            const msg = err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential'
                ? "Mot de passe incorrect."
                : "Impossible de retirer ce facteur.";
            toast({ variant: 'destructive', title: 'Erreur', description: msg });
        } finally {
            setBusy(false);
        }
    };

    const copyManualKey = async () => {
        if (!enrollData) return;
        await navigator.clipboard.writeText(enrollData.manualEntryKey);
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
    };

    return (
        <PermissionGuard permission="page:profile:view">
            <div className="flex flex-col gap-8 pb-20">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tighter uppercase text-slate-900 flex items-center gap-3">
                        <ShieldCheck className="h-10 w-10 text-emerald-600" />
                        Sécurité du compte
                    </h1>
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 pl-1">
                        Authentification à double facteur (MFA)
                    </p>
                </div>

                {!loading && factors.length === 0 && (
                    <Alert className="border-amber-200 bg-amber-50">
                        <ShieldAlert className="h-5 w-5 text-amber-600" />
                        <AlertTitle className="text-amber-900 font-black">Aucun second facteur activé</AlertTitle>
                        <AlertDescription className="text-amber-800">
                            Votre compte n'est protégé que par un mot de passe. Activer une application d'authentification (Google Authenticator, Microsoft Authenticator, 1Password…) rend une intrusion pratiquement impossible même si votre mot de passe fuit.
                        </AlertDescription>
                    </Alert>
                )}

                <Card className="rounded-3xl border-none shadow-xl">
                    <CardHeader>
                        <div className="flex items-start justify-between flex-wrap gap-4">
                            <div>
                                <CardTitle className="text-xl font-black uppercase tracking-tight text-slate-900">Facteurs enregistrés</CardTitle>
                                <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">
                                    {factors.length === 0 ? 'Aucun facteur pour l\'instant' : `${factors.length} facteur${factors.length > 1 ? 's' : ''} configuré${factors.length > 1 ? 's' : ''}`}
                                </CardDescription>
                            </div>
                            <Button onClick={() => { resetEnroll(); setEnrollOpen(true); }} className="rounded-xl font-black text-xs uppercase tracking-widest">
                                <KeyRound className="h-4 w-4 mr-2" /> Ajouter un facteur
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <p className="text-sm text-slate-400 italic py-6 text-center">Chargement…</p>
                        ) : factors.length === 0 ? (
                            <div className="py-8 text-center">
                                <Smartphone className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                                <p className="text-sm font-bold text-slate-500">Aucun facteur enregistré</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {factors.map(f => (
                                    <div key={f.uid} className="py-4 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-11 w-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                                <Smartphone className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900">{f.displayName || 'Second facteur'}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <Badge variant="secondary" className="font-black text-[9px] uppercase tracking-widest">
                                                        {f.factorId === 'totp' ? 'App Authenticator' : f.factorId}
                                                    </Badge>
                                                    {f.enrollmentTime && (
                                                        <span className="text-[10px] font-bold text-slate-400">
                                                            Depuis {new Date(f.enrollmentTime).toLocaleDateString('fr-FR')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => setUnenrollTarget(f)} className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg font-black text-[10px] uppercase tracking-widest">
                                            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Retirer
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Enrollment dialog */}
                <Dialog open={enrollOpen} onOpenChange={(o) => { setEnrollOpen(o); if (!o) resetEnroll(); }}>
                    <DialogContent className="rounded-2xl max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <KeyRound className="h-5 w-5 text-primary" /> Activer l'authentification à deux facteurs
                            </DialogTitle>
                            <DialogDescription>
                                {enrollStep === 'password' && "Confirmez votre mot de passe pour continuer."}
                                {enrollStep === 'scan' && "Scannez le QR code avec votre application d'authentification, puis entrez le code à 6 chiffres."}
                                {enrollStep === 'done' && "Votre compte est désormais protégé par un second facteur."}
                            </DialogDescription>
                        </DialogHeader>

                        {enrollStep === 'password' && (
                            <div className="space-y-3 py-2">
                                <Label htmlFor="mfa-password" className="text-xs font-black uppercase tracking-widest text-slate-500">Mot de passe actuel</Label>
                                <Input
                                    id="mfa-password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="rounded-xl"
                                    disabled={busy}
                                />
                                <Label htmlFor="mfa-display" className="text-xs font-black uppercase tracking-widest text-slate-500 pt-2 block">Nom de l'appareil (aide-mémoire)</Label>
                                <Input
                                    id="mfa-display"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="iPhone perso, Pixel bureau…"
                                    className="rounded-xl"
                                    disabled={busy}
                                />
                            </div>
                        )}

                        {enrollStep === 'scan' && enrollData && (
                            <div className="space-y-4 py-2">
                                <div className="flex justify-center bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                    {/* Le QR est servi par un service tiers ; l'utilisateur peut aussi copier la clé manuellement */}
                                    <img src={enrollData.qrCodeUrl} alt="QR code TOTP" className="rounded-lg" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Ou saisie manuelle</p>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 text-xs font-mono bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 break-all">
                                            {enrollData.manualEntryKey}
                                        </code>
                                        <Button variant="outline" size="icon" onClick={copyManualKey} className="rounded-lg">
                                            {copiedKey ? <CheckCheck className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="mfa-code" className="text-xs font-black uppercase tracking-widest text-slate-500">Code à 6 chiffres</Label>
                                    <Input
                                        id="mfa-code"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="123 456"
                                        className="rounded-xl mt-1 text-center text-xl font-mono tracking-widest"
                                        maxLength={6}
                                        disabled={busy}
                                    />
                                </div>
                            </div>
                        )}

                        {enrollStep === 'done' && (
                            <div className="py-6 text-center space-y-3">
                                <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                                    <ShieldCheck className="h-8 w-8 text-emerald-600" />
                                </div>
                                <p className="text-sm font-bold text-slate-700">
                                    À chaque connexion, votre application d'authentification vous demandera un code.
                                </p>
                                <p className="text-[11px] italic text-slate-400">
                                    Conservez votre appareil accessible. En cas de perte, contactez un administrateur pour réinitialiser votre compte.
                                </p>
                            </div>
                        )}

                        <DialogFooter>
                            {enrollStep === 'password' && (
                                <>
                                    <Button variant="ghost" onClick={() => setEnrollOpen(false)} disabled={busy}>Annuler</Button>
                                    <Button onClick={handleReauthAndStart} disabled={busy || !password} className="rounded-xl font-bold">
                                        {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Continuer
                                    </Button>
                                </>
                            )}
                            {enrollStep === 'scan' && (
                                <>
                                    <Button variant="ghost" onClick={() => setEnrollOpen(false)} disabled={busy}>Annuler</Button>
                                    <Button onClick={handleFinishEnroll} disabled={busy || verificationCode.length !== 6} className="rounded-xl font-bold">
                                        {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Valider
                                    </Button>
                                </>
                            )}
                            {enrollStep === 'done' && (
                                <Button onClick={() => setEnrollOpen(false)} className="rounded-xl font-bold w-full">Fermer</Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Unenroll dialog */}
                <Dialog open={!!unenrollTarget} onOpenChange={(o) => { if (!o) { setUnenrollTarget(null); setUnenrollPassword(""); } }}>
                    <DialogContent className="rounded-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-rose-600">
                                <Trash2 className="h-5 w-5" /> Retirer un facteur MFA
                            </DialogTitle>
                            <DialogDescription>
                                Confirmez votre mot de passe pour retirer <span className="font-bold">{unenrollTarget?.displayName}</span>. Attention : votre compte redeviendra protégé uniquement par le mot de passe.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-2 space-y-3">
                            <Label htmlFor="unenroll-password" className="text-xs font-black uppercase tracking-widest text-slate-500">Mot de passe actuel</Label>
                            <Input
                                id="unenroll-password"
                                type="password"
                                value={unenrollPassword}
                                onChange={(e) => setUnenrollPassword(e.target.value)}
                                className="rounded-xl"
                                disabled={busy}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setUnenrollTarget(null)} disabled={busy}>Annuler</Button>
                            <Button variant="destructive" onClick={handleUnenroll} disabled={busy || !unenrollPassword} className="rounded-xl font-bold">
                                {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Retirer
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </PermissionGuard>
    );
}
