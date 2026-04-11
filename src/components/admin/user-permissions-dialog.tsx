
"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { PermissionsEditor } from "./permission-matrix";
import { User } from "@/types/auth";
import { ShieldAlert } from "lucide-react";

interface UserPermissionsDialogProps {
    isOpen: boolean;
    onCloseAction: () => void;
    user: User | null;
    onSave?: () => void;
}

export function UserPermissionsDialog({
    isOpen,
    onCloseAction,
    user,
    onSave,
}: UserPermissionsDialogProps) {
    if (!user) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onCloseAction()}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-white/20 bg-white/40 backdrop-blur-3xl rounded-[3rem] shadow-3xl">
                <DialogHeader className="bg-slate-900 p-10 text-white text-left relative overflow-hidden">
                    {/* Institutional Pattern */}
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]" />
                    <div className="relative z-10">
                        <DialogTitle className="flex items-center gap-6 text-3xl font-black uppercase tracking-tighter">
                            <div className="p-4 rounded-2xl bg-amber-500/20 border border-amber-500/30 shadow-2xl backdrop-blur-md">
                                <ShieldAlert className="h-8 w-8 text-amber-400" />
                            </div>
                            <div className="flex flex-col">
                                <span>Exceptions de Sécurité</span>
                                <span className="text-[10px] font-black tracking-[0.4em] text-amber-500/80 mt-1">DÉROGATION INDIVIDUELLE : {user.name}</span>
                            </div>
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-6 opacity-80 leading-loose max-w-2xl">
                            Configuration des droits spécifiques dérogeant au profil institutionnel <span className="text-white font-black px-2 py-0.5 bg-white/10 rounded-lg">{user.role?.name || 'Standard'}</span>. Ces privilèges priment sur les héritages globaux.
                        </DialogDescription>
                    </div>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-slate-50/30">
                    <div className="bg-white/60 backdrop-blur-md rounded-[3rem] border border-white/40 shadow-2xl overflow-hidden ring-1 ring-black/5">
                        <PermissionsEditor 
                            targetId={user.id} 
                            targetType="user" 
                            onSave={onSave}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
