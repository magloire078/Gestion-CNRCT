
"use client";

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { ShieldAlert, Lock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface PermissionGuardProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Gardien de permission universel.
 * @param permission Format supporté par useAuth (ex: 'page:employees:view' ou 'feature:supplies:import')
 */
export function PermissionGuard({ permission, children, fallback }: PermissionGuardProps) {
  const { hasPermission, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return null; // On attend que l'auth soit chargée
  }

  const allowed = hasPermission(permission);

  if (!allowed) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4 animate-in fade-in zoom-in duration-500">
        <Card className="max-w-md w-full border-none shadow-2xl rounded-[2rem] overflow-hidden">
          <div className="h-2 bg-red-500 w-full" />
          <CardHeader className="text-center pt-10">
            <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Lock className="h-10 w-10 text-red-500 animate-pulse" />
            </div>
            <CardTitle className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Accès Restreint</CardTitle>
            <CardDescription className="text-slate-500 font-medium px-4 mt-2">
              Désolé, votre profil utilisateur ne dispose pas des privilèges nécessaires pour consulter cette page.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-8">
            <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3 border border-slate-100 mb-6">
              <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0" />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-left">
                Requiert la permission : <span className="text-slate-900">{permission}</span>
              </p>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-6 flex flex-col gap-3">
            <Button 
                onClick={() => router.back()} 
                variant="outline" 
                className="w-full h-12 rounded-xl font-bold border-slate-200"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Retourner en arrière
            </Button>
            <Button 
                onClick={() => router.push('/intranet')} 
                className="w-full h-12 rounded-xl font-bold bg-slate-900"
            >
              Accueil Intranet
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
