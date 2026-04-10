
"use client";

import { useState, useRef, useEffect } from "react";
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
import { Upload, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { updateUserProfile, changePassword } from "@/services/auth-service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, User as UserIcon } from "lucide-react";
import { SupplyRequestDialog } from "@/components/profile/supply-request-dialog";
import { SupplyRequestList } from "@/components/profile/supply-request-list";

export default function ProfilePage() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  // Profile state
  const [name, setName] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhotoPreview(user.photoUrl || "");
    }
  }, [user]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingProfile(true);
    setProfileError(null);
    try {
      await updateUserProfile(user.id, { name, photoFile });
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été enregistrées avec succès.",
      });
      setPhotoFile(null); // Reset file input after successful upload
    } catch (err) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue.";
      setProfileError(message);
      toast({ variant: "destructive", title: "Erreur", description: message });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword !== confirmPassword) {
      setPasswordError("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Le nouveau mot de passe doit comporter au moins 6 caractères.");
      return;
    }
    setIsSavingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast({
        title: "Mot de passe modifié",
        description: "Votre mot de passe a été mis à jour.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
        const message = err instanceof Error ? err.message : "Une erreur est survenue.";
        setPasswordError(message);
        toast({ variant: "destructive", title: "Erreur", description: message });
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (authLoading || !user) {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Mon Profil</h1>
          <p className="text-slate-500 mt-1">Gérez vos informations et vos demandes de fournitures.</p>
        </div>
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl h-11">
          <TabsTrigger value="info" className="rounded-lg px-6 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <UserIcon className="mr-2 h-4 w-4" /> Personnel
          </TabsTrigger>
          <TabsTrigger value="supplies" className="rounded-lg px-6 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <ShoppingBag className="mr-2 h-4 w-4" /> Mes Fournitures
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-6">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-1 space-y-6">
              <Card className="rounded-2xl border-none shadow-sm bg-slate-50/50">
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="relative group">
                    <Avatar className="h-32 w-32 mb-6 border-4 border-white shadow-xl">
                      <AvatarImage src={photoPreview} alt={user.name} />
                      <AvatarFallback className="bg-slate-200 text-slate-500 text-3xl font-black">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="absolute bottom-6 right-0 h-10 w-10 rounded-full shadow-lg border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity" 
                      onClick={() => photoInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800">{user.name}</h3>
                  <p className="text-slate-500 font-medium mb-4">{user.email}</p>
                  <Badge className="bg-slate-900 text-white px-4 py-1 rounded-full font-bold uppercase tracking-wider text-[10px]">
                    {user.role?.name || "Rôle non défini"}
                  </Badge>
                  <Input
                    ref={photoInputRef}
                    type="file"
                    className="hidden"
                    accept="image/png, image/jpeg"
                    onChange={handlePhotoChange}
                  />
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-none shadow-sm bg-slate-50/50 overflow-hidden">
                <CardHeader className="bg-white/50 border-b border-slate-100">
                    <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400">
                        <ShieldCheck className="h-4 w-4" />
                        Permissions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 flex flex-wrap gap-2">
                    {user.permissions && user.permissions.length > 0 ? (
                        user.permissions.map(p => <Badge key={p} variant="outline" className="bg-white border-slate-200 text-slate-600 font-bold">{p}</Badge>)
                    ) : (
                        <p className="text-sm text-slate-400 font-medium italic">Aucune permission spéciale.</p>
                    )}
                  </CardContent>
              </Card>
            </div>
            <div className="md:col-span-2 space-y-8">
              <Card className="rounded-2xl border-slate-100 shadow-sm">
                <form onSubmit={handleUpdateProfile}>
                  <CardHeader>
                    <CardTitle className="text-xl font-black">Informations de base</CardTitle>
                    <CardDescription>Mettez à jour vos informations publiques.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-slate-400">Nom complet</Label>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl border-slate-200 h-12 focus:ring-slate-900" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-slate-400">Adresse Email</Label>
                      <Input id="email" type="email" value={user.email} disabled className="rounded-xl border-slate-100 bg-slate-50 text-slate-400 h-12" />
                    </div>
                    {profileError && (
                        <Alert variant="destructive" className="rounded-xl border-red-100 bg-red-50 text-red-900">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle className="font-bold">Erreur</AlertTitle>
                          <AlertDescription>{profileError}</AlertDescription>
                        </Alert>
                    )}
                  </CardContent>
                  <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-6">
                    <Button type="submit" disabled={isSavingProfile} className="bg-slate-900 hover:bg-black rounded-xl px-8 font-black">
                      {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Enregistrer
                    </Button>
                  </CardFooter>
                </form>
              </Card>

              <Card className="rounded-2xl border-slate-100 shadow-sm">
                <form onSubmit={handleChangePassword}>
                  <CardHeader>
                    <CardTitle className="text-xl font-black">Sécurité</CardTitle>
                    <CardDescription>Changer votre mot de passe pour sécuriser votre compte.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="text-xs font-black uppercase tracking-widest text-slate-400">Mot de passe actuel</Label>
                      <Input id="currentPassword" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="rounded-xl border-slate-200 h-12 focus:ring-slate-900" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="newPassword" className="text-xs font-black uppercase tracking-widest text-slate-400">Nouveau mot de passe</Label>
                          <Input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="rounded-xl border-slate-200 h-12 focus:ring-slate-900" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword" className="text-xs font-black uppercase tracking-widest text-slate-400">Confirmation</Label>
                          <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="rounded-xl border-slate-200 h-12 focus:ring-slate-900" />
                        </div>
                    </div>
                     {passwordError && (
                        <Alert variant="destructive" className="rounded-xl">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle className="font-bold">Erreur</AlertTitle>
                          <AlertDescription>{passwordError}</AlertDescription>
                        </Alert>
                    )}
                  </CardContent>
                  <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-6">
                    <Button type="submit" disabled={isSavingPassword} className="bg-slate-900 hover:bg-black rounded-xl px-8 font-black">
                        {isSavingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Mettre à jour le mot de passe
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="supplies" className="mt-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
                <div>
                    <h2 className="text-2xl font-black text-slate-900">Suivi des Demandes</h2>
                    <p className="text-slate-500 font-medium">Consultez l'état de vos demandes de fournitures en temps réel.</p>
                </div>
                <SupplyRequestDialog />
            </div>
            
            <SupplyRequestList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
