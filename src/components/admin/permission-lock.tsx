
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
                <div className="relative flex flex-col items-center justify-center gap-6 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/20 py-16 text-center backdrop-blur-sm">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/20">
                        <LockKeyhole className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">Section protégée</h3>
                        <p className="max-w-sm text-sm text-muted-foreground">
                            La gestion des permissions nécessite une vérification de votre identité.
                            Votre session sera déverrouillée pendant <strong>15 minutes</strong>.
                        </p>
                    </div>
                    <Button onClick={() => setDialogOpen(true)} className="gap-2">
                        <Shield className="h-4 w-4" />
                        Déverrouiller
                    </Button>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" />
                                Confirmer votre identité
                            </DialogTitle>
                            <DialogDescription>
                                Saisissez votre mot de passe de connexion pour accéder à la gestion des permissions.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label htmlFor="unlock-email">Email</Label>
                                <Input id="unlock-email" value={userEmail} disabled className="bg-muted" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="unlock-password">Mot de passe</Label>
                                <Input
                                    id="unlock-password"
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Votre mot de passe actuel"
                                    onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                                    autoFocus
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
                            <Button onClick={handleUnlock} disabled={loading || !password} className="gap-2">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UnlockKeyhole className="h-4 w-4" />}
                                Déverrouiller
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2">
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                    <UnlockKeyhole className="h-4 w-4" />
                    <span>Section déverrouillée</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Timer className="h-4 w-4" />
                        <span>Expire dans {formatTime(timeLeft)}</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={lock} className="gap-1.5 h-7 text-xs">
                        <LockKeyhole className="h-3 w-3" />
                        Verrouiller
                    </Button>
                </div>
            </div>
            {children}
        </div>
    );
}
