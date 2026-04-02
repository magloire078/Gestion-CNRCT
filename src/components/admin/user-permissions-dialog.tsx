
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
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <ShieldAlert className="h-5 w-5 text-amber-600" />
                        Exceptions de Permissions : {user.name}
                    </DialogTitle>
                    <DialogDescription>
                        Configurez des droits spécifiques qui surchargent ceux du groupe <strong>{user.role?.name || 'Non assigné'}</strong>.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    <PermissionsEditor 
                        targetId={user.id} 
                        targetType="user" 
                        onSave={onSave}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
