
"use client";

import { useState, useMemo, useEffect } from "react";
import { PlusCircle, Check, X, Search, Loader2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import type { Leave } from "@/lib/data";
import { AddLeaveRequestSheet } from "@/components/leave/add-leave-request-sheet";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLeaves, addLeave, updateLeaveStatus } from "@/services/leave-service";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

type Status = "Approved" | "Pending" | "Rejected";

const statusVariantMap: Record<Status, "default" | "secondary" | "destructive"> =
  {
    Approved: "default",
    Pending: "secondary",
    Rejected: "destructive",
  };
  
const leaveTypes = ["Annual Leave", "Sick Leave", "Personal Leave", "Maternity Leave", "Unpaid Leave"];

export default function LeavePage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function fetchLeaves() {
      try {
        setLoading(true);
        const fetchedLeaves = await getLeaves();
        setLeaves(fetchedLeaves);
        setError(null);
      } catch (err) {
        setError("Impossible de charger les demandes de congé. Veuillez vérifier la configuration de votre base de données Firestore et les règles de sécurité.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaves();
  }, []);

  const handleLeaveStatusChange = async (id: string, status: Status) => {
    try {
      await updateLeaveStatus(id, status);
      setLeaves((prevLeaves) =>
        prevLeaves.map((leave) =>
          leave.id === id ? { ...leave, status: status } : leave
        )
      );
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
    const newRequest = await addLeave(newLeaveRequest);
    setLeaves(prev => [...prev, newRequest].sort((a,b) => b.startDate.localeCompare(a.startDate)));
     toast({
        title: "Demande ajoutée",
        description: `La demande de congé pour ${newRequest.employee} a été ajoutée.`,
      });
  };

  const filteredLeaves = useMemo(() => {
    return leaves.filter(leave => {
      const matchesSearch = leave.employee.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || leave.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || leave.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [leaves, searchTerm, typeFilter, statusFilter]);

  const pendingCount = useMemo(() => leaves.filter((l) => l.status === "Pending").length, [leaves]);
  const approvedCount = useMemo(() => leaves.filter((l) => l.status === "Approved").length, [leaves]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Gestion des Congés
        </h1>
        <Button onClick={() => setIsSheetOpen(true)} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Nouvelle demande
        </Button>
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

      <Card>
        <CardHeader>
          <CardTitle>Toutes les Demandes de Congé</CardTitle>
          <CardDescription>
            Gérez toutes les demandes de congé des employés ici.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher par employé..."
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
                {leaveTypes.map(type => <SelectItem key={type} value={type}>{type.replace(" Leave","")}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="Pending">En attente</SelectItem>
                <SelectItem value="Approved">Approuvé</SelectItem>
                <SelectItem value="Rejected">Rejeté</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-destructive text-center py-4">{error}</p>}
          <div className="hidden md:block">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Employé</TableHead>
                    <TableHead>Type de congé</TableHead>
                    <TableHead>Date de début</TableHead>
                    <TableHead>Date de fin</TableHead>
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
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell><div className="flex justify-end gap-2"><Skeleton className="h-8 w-8 rounded-md" /><Skeleton className="h-8 w-8 rounded-md" /></div></TableCell>
                    </TableRow>
                    ))
                ) : (
                    filteredLeaves.map((leave) => (
                    <TableRow key={leave.id}>
                        <TableCell className="font-medium">{leave.employee}</TableCell>
                        <TableCell>{leave.type}</TableCell>
                        <TableCell>{leave.startDate}</TableCell>
                        <TableCell>{leave.endDate}</TableCell>
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
                            disabled={leave.status !== "Pending"}
                            onClick={() =>
                                handleLeaveStatusChange(leave.id, "Approved")
                            }
                            >
                            <Check className="h-4 w-4" />
                            <span className="sr-only">Approuver</span>
                            </Button>
                            <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={leave.status !== "Pending"}
                            onClick={() =>
                                handleLeaveStatusChange(leave.id, "Rejected")
                            }
                            >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Rejeter</span>
                            </Button>
                        </div>
                        </TableCell>
                    </TableRow>
                    ))
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
                    filteredLeaves.map((leave) => (
                        <Card key={leave.id}>
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="flex-1 space-y-1">
                                    <p className="font-medium">{leave.employee}</p>
                                    <p className="text-sm text-muted-foreground">{leave.type}</p>
                                    <p className="text-sm text-muted-foreground">{leave.startDate} au {leave.endDate}</p>
                                    <Badge
                                        variant={(statusVariantMap[leave.status as Status] || "default")}
                                        className="mt-1"
                                    >
                                        {leave.status}
                                    </Badge>
                                </div>
                                {leave.status === 'Pending' && (
                                    <div className="flex flex-col gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => handleLeaveStatusChange(leave.id, "Approved")}
                                        >
                                            <Check className="h-4 w-4" />
                                            <span className="sr-only">Approuver</span>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => handleLeaveStatusChange(leave.id, "Rejected")}
                                        >
                                            <X className="h-4 w-4" />
                                            <span className="sr-only">Rejeter</span>
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
          { !loading && filteredLeaves.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
                Aucune demande de congé trouvée.
            </div>
          )}
        </CardContent>
      </Card>
       <AddLeaveRequestSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onAddLeaveRequest={handleAddLeaveRequest}
      />
    </div>
  );
}
