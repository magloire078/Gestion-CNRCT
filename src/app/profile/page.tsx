
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { toast } = useToast();
  const router = useRouter();

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic to update profile comes here
    toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été enregistrées avec succès.",
    });
    router.push('/');
  };
  
   const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic to update password comes here
    toast({
        title: "Mot de passe modifié",
        description: "Votre mot de passe a été mis à jour.",
    });
  };

  return (
    <div className="flex flex-col gap-6">
       <h1 className="text-3xl font-bold tracking-tight">Profil</h1>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src="https://placehold.co/100x100.png" alt="Admin" data-ai-hint="user avatar" />
                <AvatarFallback>A</AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-semibold">Admin User</h3>
              <p className="text-muted-foreground">admin@cnrct.com</p>
              <Button variant="outline" size="sm" className="mt-4">
                <Upload className="mr-2 h-4 w-4" />
                Changer la photo
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
          
            <Card>
             <form onSubmit={handleUpdate}>
              <CardHeader>
                <CardTitle>Informations Personnelles</CardTitle>
                <CardDescription>Mettez à jour les informations de votre compte.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">Prénom</Label>
                        <Input id="firstName" defaultValue="Admin" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName">Nom</Label>
                        <Input id="lastName" defaultValue="User" />
                    </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="admin@cnrct.com" />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit">Enregistrer les modifications</Button>
              </CardFooter>
              </form>
            </Card>

            <Card className="mt-6">
               <form onSubmit={handleChangePassword}>
                <CardHeader>
                    <CardTitle>Changer le mot de passe</CardTitle>
                    <CardDescription>Mettez à jour votre mot de passe ici.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                        <Input id="currentPassword" type="password" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                        <Input id="newPassword" type="password" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                        <Input id="confirmPassword" type="password" />
                    </div>
                </CardContent>
                 <CardFooter>
                    <Button type="submit">Changer le mot de passe</Button>
                </CardFooter>
                </form>
            </Card>
         
        </div>
      </div>
    </div>
  );
}
