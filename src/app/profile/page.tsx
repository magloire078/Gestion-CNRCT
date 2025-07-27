
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
import { Upload, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { updateUserProfile, changePassword } from "@/services/auth-service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Profil</h1>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={photoPreview} alt={user.name} data-ai-hint="user avatar" />
                <AvatarFallback>{user.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-semibold">{user.name}</h3>
              <p className="text-muted-foreground">{user.email}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => photoInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Changer la photo
              </Button>
              <Input
                ref={photoInputRef}
                type="file"
                className="hidden"
                accept="image/png, image/jpeg"
                onChange={handlePhotoChange}
              />
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
          <Card>
            <form onSubmit={handleUpdateProfile}>
              <CardHeader>
                <CardTitle>Informations Personnelles</CardTitle>
                <CardDescription>Mettez à jour les informations de votre compte.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={user.email} disabled />
                </div>
                {profileError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Erreur</AlertTitle>
                      <AlertDescription>{profileError}</AlertDescription>
                    </Alert>
                )}
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSavingProfile}>
                  {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enregistrer les modifications
                </Button>
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
                  <Input id="currentPassword" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <Input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                  <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                </div>
                 {passwordError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Erreur</AlertTitle>
                      <AlertDescription>{passwordError}</AlertDescription>
                    </Alert>
                )}
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSavingPassword}>
                    {isSavingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Changer le mot de passe
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

    