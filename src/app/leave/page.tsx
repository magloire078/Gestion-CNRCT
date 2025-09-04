
"use client";

import { useState, useMemo, useEffect } from "react";
import Link from 'next/link';
import { PlusCircle, Check, X, Search, Loader2, FileText, Pencil, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import type { Leave, Employe } from "@/lib/data";
import { AddLeaveRequestSheet } from "@/components/leave/add-leave-request-sheet";
import { EditLeaveRequestSheet } from "@/components/leave/edit-leave-request-sheet";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { subscribeToLeaves, addLeave, updateLeaveStatus, updateLeave } from "@/services/leave-service";
import { getEmployees } from "@/services/employee-service";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { LeaveCalendar } from "@/components/leave/leave-calendar";
import { format, parseISO, eachDayOfInterval, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';


type Status = "Approuvé" | "En attente" | "Rejeté";

const statusVariantMap: Record<Status, "default" | "secondary" | "destructive"> =
  {
    "Approuvé": "default",
    "En attente": "secondary",
    "Rejeté": "destructive",
  };
  
const leaveTypes = ["Congé Annuel", "Congé Maladie", "Congé Personnel", "Congé Maternité", "Congé sans solde"];

export default function LeavePage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [employees, setEmployees] = useState<Employe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const formatDate = (dateString: string) => {
    try {
        return format(parseISO(dateString), 'dd/MM/yyyy');
    } catch (error) {
        return dateString; // Fallback to original string
    }
  };
  
  const calculateWorkingDays = (startDate: string, endDate: string): number => {
    try {
        const start = parseISO(startDate);
        const end = parseISO(endDate);
        const days = eachDayOfInterval({ start, end });
        // Exclude Sundays (0)
        return days.filter(day => getDay(day) !== 0).length;
    } catch {
        return 0;
    }
  };

  useEffect(() => {
    const unsubLeaves = subscribeToLeaves((fetchedLeaves) => {
        setLeaves(fetchedLeaves);
    }, (err) => {
        setError("Impossible de charger les demandes de congé.");
        console.error(err);
        setLoading(false);
    });

    getEmployees().then(fetchedEmployees => {
      setEmployees(fetchedEmployees.filter(e => e.status === 'Actif'));
    }).catch(err => {
      console.error(err);
      setError("Impossible de charger les employés pour la recherche.");
    }).finally(() => setLoading(false));

    return () => {
      unsubLeaves();
    };
  }, []);

  const handleLeaveStatusChange = async (id: string, status: Status) => {
    try {
      await updateLeaveStatus(id, status);
      toast({
        title: "Statut mis à jour",
        description: `La demande a été marquée comme ${status}.`,
      });
    } catch (err) {
       toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut de la demande.",
        variant: "destructive",
      });
    }
  };
  
  const handleAddLeaveRequest = async (newLeaveRequest: Omit<Leave, 'id' | 'status'>) => {
    try {
        const newRequest = await addLeave(newLeaveRequest);
        setIsAddSheetOpen(false);
        toast({
            title: "Demande ajoutée",
            description: `La demande de congé pour ${newRequest.employee} a été ajoutée.`,
        });
    } catch (err) {
        console.error("Failed to add leave request:", err);
        throw err;
    }
  };

  const handleUpdateLeaveRequest = async (id: string, data: Partial<Omit<Leave, "id" | "status">>) => {
    try {
        await updateLeave(id, data);
        setIsEditSheetOpen(false);
        toast({
            title: "Demande de congé mise à jour",
            description: "Les détails du congé ont été modifiés avec succès.",
        });
    } catch (err) {
         console.error("Failed to update leave request:", err);
         throw err;
    }
  };

  const openEditSheet = (leave: Leave) => {
    setSelectedLeave(leave);
    setIsEditSheetOpen(true);
  }

  const filteredLeaves = useMemo(() => {
    return leaves.map(leave => {
        const employeeDetails = employees.find(e => e.name === leave.employee);
        return {
            ...leave,
            employeeDetails
        };
    }).filter(leaveWithDetails => {
        const { employee, employeeDetails } = leaveWithDetails;
        const searchTermLower = searchTerm.toLowerCase();

        const matchesSearch = searchTerm ? (
            employee.toLowerCase().includes(searchTermLower) ||
            (employeeDetails?.firstName?.toLowerCase().includes(searchTermLower)) ||
            (employeeDetails?.lastName?.toLowerCase().includes(searchTermLower)) ||
            (employeeDetails?.matricule?.toLowerCase().includes(searchTermLower))
        ) : true;

        const matchesType = typeFilter === 'all' || leaveWithDetails.type === typeFilter;
        const matchesStatus = statusFilter === 'all' || leaveWithDetails.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
    });
}, [leaves, employees, searchTerm, typeFilter, statusFilter]);


  const pendingCount = useMemo(() => leaves.filter((l) => l.status === "En attente").length, [leaves]);
  const approvedCount = useMemo(() => leaves.filter((l) => l.status === "Approuvé").length, [leaves]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Gestion des Congés
        </h1>
        <div className="flex gap-2">
           <Button variant="outline" asChild>
            <Link href="/leave/report">
              <FileText className="mr-2 h-4 w-4" />
              Rapport des Congés
            </Link>
           </Button>
           <Button onClick={() => setIsAddSheetOpen(true)}>
             <PlusCircle className="mr-2 h-4 w-4" />
             Nouvelle demande
           </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Demandes en attente</CardTitle>
            <CardDescription>
              Demandes de congé en attente d'approbation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-10 w-16"/> : <p className="text-4xl font-bold">{pendingCount}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Demandes Approuvées</CardTitle>
            <CardDescription>
              Total des demandes de congé approuvées cette période.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-10 w-16"/> : <p className="text-4xl font-bold">{approvedCount}</p>}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list">
        <TabsList className="grid w-full grid-cols-2 sm:w-[400px]">
            <TabsTrigger value="list">Liste</TabsTrigger>
            <TabsTrigger value="calendar">Calendrier</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
            <Card>
                <CardHeader>
                <CardTitle>Toutes les Demandes de Congé</CardTitle>
                <CardDescription>
                    Gérez toutes les demandes de congé des employés ici.
                </CardDescription>
                </CardHeader>
                <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher par employé (nom, matricule...)"
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    </div>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filtrer par type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les types</SelectItem>
                        {leaveTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                    </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filtrer par statut" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="En attente">En attente</SelectItem>
                        <SelectItem value="Approuvé">Approuvé</SelectItem>
                        <SelectItem value="Rejeté">Rejeté</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
                 <div className="mb-4 text-sm text-muted-foreground">
                    {filteredLeaves.length} résultat(s) trouvé(s).
                </div>
                {error && <p className="text-destructive text-center py-4">{error}</p>}
                <div className="hidden md:block">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Employé</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Dates</TableHead>
                            <TableHead className="text-center">Jours Ouvrés</TableHead>
                            <TableHead>Motif / N° Décision</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                <TableCell><div className="flex justify-end gap-2"><Skeleton className="h-8 w-8 rounded-md" /><Skeleton className="h-8 w-8 rounded-md" /></div></TableCell>
                            </TableRow>
                            ))
                        ) : (
                            filteredLeaves.map((leave) => {
                                const displayName = leave.employeeDetails ? `${''\'\'' + leave.employeeDetails.lastName || ''} ${''\'\'' + leave.employeeDetails.firstName || ''}`.trim() : leave.employee;
                                const workingDays = calculateWorkingDays(leave.startDate, leave.endDate);
                                return (
                                <TableRow key={leave.id}>
                                    <TableCell className="font-medium">{displayName}</TableCell>
                                    <TableCell>{leave.type}</TableCell>
                                    <TableCell>{formatDate(leave.startDate)} - {formatDate(leave.endDate)}</TableCell>
                                    <TableCell className="text-center font-medium">{workingDays}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                                        {leave.type === "Congé Annuel" ? leave.num_decision : leave.reason || '-'}
                                    </TableCell>
                                    <TableCell>
                                    <Badge
                                        variant={
                                        (statusVariantMap[leave.status as Status] || "default")
                                        }
                                    >
                                        {leave.status}
                                    </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                         <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => openEditSheet(leave)}
                                            >
                                            <Pencil className="h-4 w-4" />
                                            <span className="sr-only">Modifier</span>
                                        </Button>
                                        <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        disabled={leave.status !== "En attente"}
                                        onClick={() =>
                                            handleLeaveStatusChange(leave.id, "Approuvé")
                                        }
                                        >
                                        <Check className="h-4 w-4" />
                                        <span className="sr-only">Approuver</span>
                                        </Button>
                                        <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        disabled={leave.status !== "En attente"}
                                        onClick={() =>
                                            handleLeaveStatusChange(leave.id, "Rejeté")
                                        }
                                        >
                                        <X className="h-4 w-4" />
                                        <span className="sr-only">Rejeter</span>
                                        </Button>
                                    </div>
                                    </TableCell>
                                </TableRow>
                                )
                            })
                        )}
                        </TableBody>
                    </Table>
                </div>
                <div className="grid grid-cols-1 gap-4 md:hidden">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <Card key={i}><CardContent className="p-4"><Skeleton className="h-24 w-full" /></CardContent></Card>
                            ))
                        ) : (
                            filteredLeaves.map((leave) => {
                                const displayName = leave.employeeDetails ? `${''\'\'' + leave.employeeDetails.lastName || ''} ${''\'\'' + leave.employeeDetails.firstName || ''}`.trim() : leave.employee;
                                const workingDays = calculateWorkingDays(leave.startDate, leave.endDate);
                                return (
                                <Card key={leave.id}>
                                    <CardContent className="p-4 flex items-start gap-4">
                                        <div className="flex-1 space-y-1">
                                            <div className="flex justify-between items-start">
                                                <p className="font-medium">{displayName}</p>
                                                <Badge
                                                    variant={(statusVariantMap[leave.status as Status] || "default")}
                                                    className="mt-1"
                                                >
                                                    {leave.status}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{leave.type}</p>
                                            <p className="text-sm text-muted-foreground">{formatDate(leave.startDate)} au {formatDate(leave.endDate)}</p>
                                            <p className="text-sm font-medium pt-1">
                                                <Hash className="inline h-3 w-3 mr-1"/>
                                                {workingDays} jour(s) ouvré(s)
                                            </p>
                                            {(leave.num_decision || leave.reason) && <p className="text-sm text-muted-foreground truncate">
                                                {leave.type === 'Congé Annuel' ? `Décision: ${''\'\'' + leave.num_decision}` : `Motif: ${''\'\'' + leave.reason}`}
                                            </p>}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => openEditSheet(leave)}
                                                >
                                                <Pencil className="h-4 w-4" />
                                                <span className="sr-only">Modifier</span>
                                            </Button>
                                            {leave.status === 'En attente' && (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => handleLeaveStatusChange(leave.id, "Approuvé")}
                                                >
                                                    <Check className="h-4 w-4" />
                                                    <span className="sr-only">Approuver</span>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => handleLeaveStatusChange(leave.id, "Rejeté")}
                                                >
                                                    <X className="h-4 w-4" />
                                                    <span className="sr-only">Rejeter</span>
                                                </Button>
                                            </>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                                )
                            })
                        )}
                    </div>
                { !loading && filteredLeaves.length === 0 && !error && (
                    <div className="text-center py-10 text-muted-foreground">
                        Aucune demande de congé n'a été trouvée.
                        <br />
                        Cliquez sur "Nouvelle demande" pour en ajouter une.
                    </div>
                )}
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="calendar">
             <Card>
                <CardHeader>
                <CardTitle>Calendrier des Congés</CardTitle>
                <CardDescription>
                    Visualisez les congés approuvés pour le mois en cours.
                </CardDescription>
                </CardHeader>
                <CardContent>
                    <LeaveCalendar leaves={leaves.filter(l => l.status === 'Approuvé')} />
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

       <AddLeaveRequestSheet
        isOpen={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
        onAddLeaveRequest={handleAddLeaveRequest}
      />
      <EditLeaveRequestSheet
        isOpen={isEditSheetOpen}
        onClose={() => setIsEditSheetOpen(false)}
        onUpdateLeave={handleUpdateLeaveRequest}
        leaveRequest={selectedLeave}
      />
    </div>
  );
}
