"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus } from "lucide-react";

/**
 * Page d'accueil minimaliste affichée quand le mode neutre (marque blanche)
 * est activé dans les paramètres d'administration : aucune donnée
 * institutionnelle, aucun logo, aucun nom d'organisation.
 */
export function NeutralLanding() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4">
            <div className="w-full max-w-sm text-center space-y-8">
                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold text-slate-900">Portail de gestion</h1>
                    <p className="text-sm text-slate-500">Accédez à votre espace sécurisé.</p>
                </div>

                <div className="flex flex-col gap-3">
                    <Button asChild size="lg" className="h-12">
                        <Link href="/login">
                            <LogIn className="mr-2 h-4 w-4" />
                            Connexion
                        </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="h-12">
                        <Link href="/signup">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Créer un compte
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
