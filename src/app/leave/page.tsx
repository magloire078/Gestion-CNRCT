
"use client";

import { useState, useMemo } from "react";
import { PlusCircle, Check, X, Search } from "lucide-react";
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
import { leaveData, Leave } from "@/lib/data";
import { AddLeaveRequestSheet } from "@/components/leave/add-leave-request-sheet";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Status = "Approved" | "Pending" | "Rejected";

const statusVariantMap: Record<Status, "default" | "secondary" | "destructive"> =
  {
    Approved: "default",
    Pending: "secondary",
    Rejected: "destructive",
  };
  
const leaveTypes = ["Annual Leave", "Sick Leave", "Personal Leave", "Maternity Leave", "Unpaid Leave"];

export default function LeavePage() {
  const [leaves, setLeaves] = useState<Leave[]>(leaveData);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");


  const handleLeaveStatusChange = (id: string, status: Status) => {
    setLeaves((prevLeaves) =>
      prevLeaves.map((leave) =>
        leave.id === id ? { ...leave, status: status } : leave
      )
    );
  };
  
  const handleAddLeaveRequest = (newLeaveRequest: Omit<Leave, 'id' | 'status'>) => {
    const newId = `LVE${(leaves.length + 1).toString().padStart(3, '0')}`;
    const newRequest: Leave = {
      id: newId,
      ...newLeaveRequest,
      status: 'Pending',
    };
    setLeaves([...leaves, newRequest]);
  };

  const filteredLeaves = useMemo(() => {
    return leaves.filter(leave => {
      const matchesSearch = leave.employee.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || leave.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || leave.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [leaves, searchTerm, typeFilter, statusFilter]);

  const pendingCount = leaves.filter((l) => l.status === "Pending").length;
  const approvedCount = leaves.filter((l) => l.status === "Approved").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Gestion des Congés
        </h1>
        <Button onClick={() => setIsSheetOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nouvelle demande de congé
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
            <p className="text-4xl font-bold">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Demandes Approuvées</CardTitle>
            <CardDescription>
              Total des demandes de congé approuvées.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{approvedCount}</p>
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
              {filteredLeaves.map((leave) => (
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
              ))}
            </TableBody>
          </Table>
          {filteredLeaves.length === 0 && (
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
