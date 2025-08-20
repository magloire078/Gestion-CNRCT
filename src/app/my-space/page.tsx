
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import type { Leave, Employe } from "@/lib/data";
import { subscribeToLeaves, addLeave } from "@/services/leave-service";
import { getEmployee } from "@/services/employee-service";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AddLeaveRequestSheet } from "@/components/leave/add-leave-request-sheet";
import { Mail, Phone, Calendar, Briefcase, ChevronRight, Landmark } from "lucide-react";
import { lastDayOfMonth, format, subMonths, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from "next/link";


type Status = "Approuvé" | "En attente" | "Rejeté";

const statusVariantMap: Record<Status, "default" | "secondary" | "destructive"> =
  {
    "Approuvé": "default",
    "En attente": "secondary",
    "Rejeté": "destructive",
  };


export default function MySpacePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [employeeDetails, setEmployeeDetails] = useState<Employe | null>(null);
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        try {
            return format(parseISO(dateString), 'dd/MM/yyyy');
        } catch (error) {
            return dateString; // Fallback to original string if parsing fails
        }
    };

    useEffect(() => {
        if (user) {
            const unsubLeaves = subscribeToLeaves((allLeaves) => {
                setLeaves(allLeaves.filter(l => l.employee === user.name));
            }, console.error);

            getEmployee(user.id).then(details => {
                setEmployeeDetails(details);
            }).finally(() => setLoadingData(false));

            return () => unsubLeaves();
        }
    }, [user]);

    const handleAddLeaveRequest = async (newLeaveRequest: Omit<Leave, 'id' | 'status'>) => {
        try {
            const newRequest = await addLeave(newLeaveRequest);
            setIsSheetOpen(false);
            toast({
                title: "Demande de congé envoyée",
                description: `Votre demande de ${newRequest.type} a été soumise.`,
            });
        } catch (err) {
            console.error("Failed to add leave request:", err);
            throw err;
        }
    };
    
    const payslipHistory = Array.from({ length: 12 }).map((_, i) => {
        const date = subMonths(new Date(), i);
        const lastDay = lastDayOfMonth(date);
        return {
            period: format(date, "MMMM yyyy", { locale: fr }),
            dateParam: lastDay.toISOString().split('T')[0],
        };
    });

    const loading = authLoading || loadingData;

    if (loading) {
        return (
             <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
                <Card><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
             </div>
        )
    }

    if (!user) {
        return null;
    }
    
    const fullName = `${employeeDetails?.lastName || ''} ${employeeDetails?.firstName || ''}`.trim() || user.name;

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold tracking-tight">Mon Espace</h1>

            <Tabs defaultValue="profile">
                <TabsList className="mb-4">
                    <TabsTrigger value="profile">Profil</TabsTrigger>
                    <TabsTrigger value="payroll">Paie</TabsTrigger>
                    <TabsTrigger value="leaves">Congés</TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informations Personnelles</CardTitle>
                            <CardDescription>Vos informations de profil et professionnelles.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <div className="flex items-center gap-6">
                                 <Avatar className="h-24 w-24">
                                    <AvatarImage src={user.photoUrl} alt={user.name} data-ai-hint="user avatar" />
                                    <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="text-2xl font-bold">{fullName}</h2>
                                    <p className="text-muted-foreground">{employeeDetails?.poste}</p>
                                    <Badge variant="secondary" className="mt-2">{employeeDetails?.department}</Badge>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InfoItem icon={Mail} label="Email" value={user.email} />
                                <InfoItem icon={Phone} label="Téléphone" value={employeeDetails?.mobile || 'N/A'} />
                                <InfoItem icon={Calendar} label="Date d'embauche" value={formatDate(employeeDetails?.dateEmbauche)} />
                                <InfoItem icon={Briefcase} label="Statut" value={employeeDetails?.status || 'N/A'} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payroll">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Landmark className="h-5 w-5 text-primary" /> Mes Bulletins de Paie</CardTitle>
                            <CardDescription>Consultez l'historique de vos bulletins de paie.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="border rounded-lg max-h-96 overflow-y-auto">
                                <ul className="divide-y">
                                {payslipHistory.map(item => (
                                    <li key={item.dateParam}>
                                        <Link href={`/payroll/${user.id}?payslipDate=${item.dateParam}`} className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                                            <span className="font-medium text-sm capitalize">Bulletin de {item.period}</span>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        </Link>
                                    </li>
                                ))}
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="leaves">
                    <Card>
                        <CardHeader>
                             <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Mes Demandes de Congé</CardTitle>
                                    <CardDescription>Soumettez et suivez vos demandes de congé.</CardDescription>
                                </div>
                                <Button onClick={() => setIsSheetOpen(true)}>Nouvelle Demande</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Date de début</TableHead>
                                        <TableHead>Date de fin</TableHead>
                                        <TableHead>Statut</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {leaves.length > 0 ? leaves.map(leave => (
                                        <TableRow key={leave.id}>
                                            <TableCell>{leave.type}</TableCell>
                                            <TableCell>{formatDate(leave.startDate)}</TableCell>
                                            <TableCell>{formatDate(leave.endDate)}</TableCell>
                                            <TableCell><Badge variant={statusVariantMap[leave.status as Status] || "default"}>{leave.status}</Badge></TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">Aucune demande de congé trouvée.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
             <AddLeaveRequestSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onAddLeaveRequest={handleAddLeaveRequest}
            />
        </div>
    )
}


function InfoItem({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
    return (
        <div className="space-y-1">
            <Label className="text-sm text-muted-foreground flex items-center gap-2">
                <Icon className="h-4 w-4" /> {label}
            </Label>
            <p className="font-medium">{value}</p>
        </div>
    )
}
