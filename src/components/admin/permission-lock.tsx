
"use client";

import { useState, useEffect, useRef } from 'react';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Shield, LockKeyhole, Loader2, UnlockKeyhole, Timer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SESSION_DURATION_MS = 15 * 60 * 1000; // 15 minutes

interface PermissionLockProps {
    children: React.ReactNode;
    userEmail: string;
}

export function PermissionLock({ children, userEmail }: PermissionLockProps) {
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(SESSION_DURATION_MS);
    const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
    const { toast } = useToast();

    const clearTimers = () => {
        if (lockTimer.current) clearTimeout(lockTimer.current);
        if (countdownTimer.current) clearInterval(countdownTimer.current);
    };

    const lock = () => {
        setIsUnlocked(false);
        clearTimers();
    };

    const startSessionTimer = () => {
        clearTimers();
        setTimeLeft(SESSION_DURATION_MS);
        lockTimer.current = setTimeout(() => {
            lock();
            toast({ title: 'Session expirée', description: 'La section permissions a été verrouillée automatiquement.' });
        }, SESSION_DURATION_MS);
        countdownTimer.current = setInterval(() => {
            setTimeLeft(prev => Math.max(0, prev - 1000));
        }, 1000);
    };

    useEffect(() => () => clearTimers(), []);

    const handleUnlock = async () => {
        if (!password || !userEmail) return;
        setLoading(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error('Utilisateur non connecté');
            const credential = EmailAuthProvider.credential(userEmail, password);
            await reauthenticateWithCredential(currentUser, credential);
            setIsUnlocked(true);
            setDialogOpen(false);
            setPassword('');
            startSessionTimer();
            toast({ title: 'Section déverrouillée', description: 'La session expirera dans 15 minutes.' });
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Mot de passe incorrect',
                description: 'Veuillez saisir votre mot de passe de connexion actuel.',
            });
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (ms: number) => {
        const m = Math.floor(ms / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (!isUnlocked) {
        return (
            <>
                <div className="relative flex flex-col items-center justify-center gap-8 rounded-[3rem] border border-white/10 bg-card/40 py-24 text-center backdrop-blur-md shadow-2xl group overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px]" />
                    
                    <div className="relative">
                        <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-slate-900 shadow-2xl ring-8 ring-slate-900/10 group-hover:scale-105 transition-transform duration-500">
                            <LockKeyhole className="h-10 w-10 text-emerald-400" />
                        </div>
                        <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg border-2 border-white">
                            <Shield className="h-4 w-4" />
                        </div>
                    </div>
                    
                    <div className="space-y-3 relative z-10 px-6">
                        <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Périmètre Sécurisé</h3>
                        <p className="max-w-md text-[11px] font-medium text-slate-500 uppercase tracking-widest leading-relaxed">
                            L'accès à la configuration des privilèges nécessite une <span className="text-slate-900 font-black">re-authentification institutionnelle</span> immédiate.
                        </p>
                    </div>
                    
                    <Button 
                        onClick={() => setDialogOpen(true)} 
                        className="gap-3 h-14 px-10 rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-slate-900/20 active:scale-95 transition-all"
                    >
                        <UnlockKeyhole className="h-5 w-5" />
                        Ouvrir le Verrou
                    </Button>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="sm:max-w-md border-white/10 p-0 overflow-hidden bg-white/90 backdrop-blur-2xl rounded-[3rem] shadow-2xl">
                        <DialogHeader className="bg-slate-900 p-8 text-white text-left">
                            <DialogTitle className="flex items-center gap-4 text-2xl font-black uppercase tracking-tighter">
                                <Shield className="h-6 w-6 text-emerald-400" />
                                Authentification
                            </DialogTitle>
                            <DialogDescription className="text-slate-300 font-medium">
                                Confirmez votre identité pour déverrouiller les paramètres de sécurité.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="unlock-email" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Identifiant</Label>
                                <Input id="unlock-email" value={userEmail} disabled className="h-11 rounded-xl bg-slate-100 border-none font-bold text-slate-500" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="unlock-password" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mot de Passe Actuel</Label>
                                <Input
                                    id="unlock-password"
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                                    autoFocus
                                    className="h-11 rounded-xl border-slate-200 focus:ring-slate-900 font-bold"
                                />
                            </div>
                        </div>
                        <DialogFooter className="p-8 bg-slate-50 border-t border-slate-100 sm:flex-row flex-col gap-3">
                            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-xl font-bold uppercase tracking-widest text-[10px] h-11">Annuler</Button>
                            <Button 
                                onClick={handleUnlock} 
                                disabled={loading || !password} 
                                className="bg-slate-900 hover:bg-black text-white px-8 h-11 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-slate-900/20 active:scale-95 transition-all gap-2"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UnlockKeyhole className="h-4 w-4" />}
                                Valider l'Accès
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-6 py-3 backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <UnlockKeyhole className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Périmètre Déverrouillé</span>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <Timer className="h-4 w-4 opacity-50" />
                        <span>Expiration : <span className="text-slate-900">{formatTime(timeLeft)}</span></span>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={lock} 
                        className="gap-2 h-9 px-4 rounded-xl text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors font-black uppercase tracking-widest text-[9px]"
                    >
                        <LockKeyhole className="h-3.5 w-3.5" />
                        Verrouiller
                    </Button>
                </div>
            </div>
            {children}
        </div>
    );
}
