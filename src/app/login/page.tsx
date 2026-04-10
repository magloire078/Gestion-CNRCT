"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOrganizationSettings } from "@/services/organization-service";
import Image from "next/image";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  const [orgName, setOrgName] = useState("Chambre Nationale des Rois et Chefs Traditionnels");
  const [logoUrl, setLogoUrl] = useState<string>("https://cnrct.ci/wp-content/uploads/2018/03/logo_chambre.png");

  useEffect(() => {
    getOrganizationSettings().then(settings => {
      setOrgName(settings.organizationName || "Gestion App");
      setLogoUrl(settings.mainLogoUrl);
    })
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafaf8] relative overflow-hidden p-4">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-10 pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#006039]/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#D4AF37]/5 rounded-full blur-[120px]" />

      <Card className="w-full max-w-md border-primary/5 bg-white/80 backdrop-blur-xl shadow-2xl shadow-[#1a1a1a]/5 rounded-[2rem] overflow-hidden animate-in fade-in zoom-in duration-700">
        <CardHeader className="pt-10 pb-6 px-8">
          <div className="flex flex-col items-center justify-center gap-4 mb-4 group">
            <div className="relative w-24 h-24 transition-all duration-700 ease-in-out group-hover:scale-105">
              <Image
                src={logoUrl}
                alt={orgName}
                fill
                className="object-contain transition-opacity duration-500"
                sizes="96px"
                priority
              />
            </div>
            <div className="text-center">
              <h1 className="text-sm font-bold tracking-[0.3em] uppercase text-[#006039]/60 mb-1">{orgName}</h1>
              <p className="text-[10px] tracking-[0.2em] font-medium text-muted-foreground/60 uppercase">Haute Institution de l'État</p>
            </div>
          </div>
          <CardTitle className="text-3xl font-black text-center text-[#1a1a1a]">Connexion</CardTitle>
          <CardDescription className="text-center text-base mt-2">
            Identifiez-vous pour accéder à l'intranet institutionnel.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <LoginForm />
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Première connexion ?{" "}
            <Link href="/signup" className="font-bold text-[#006039] hover:underline">
              Demander un accès
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
