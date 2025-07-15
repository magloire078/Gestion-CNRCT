
"use client";

import { useState } from "react";
import { PlusCircle, Check, X } from "lucide-react";
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
import { leaveData } from "@/lib/data";

type Status = "Approved" | "Pending" | "Rejected";

const statusVariantMap: Record<Status, "default" | "secondary" | "destructive"> =
  {
    Approved: "default",
    Pending: "secondary",
    Rejected: "destructive",
  };

export default function LeavePage() {
  const [leaves, setLeaves] = useState(leaveData);

  const handleLeaveStatusChange = (id: string, status: Status) => {
    setLeaves((prevLeaves) =>
      prevLeaves.map((leave) =>
        leave.id === id ? { ...leave, status: status } : leave
      )
    );
  };

  const pendingCount = leaves.filter((l) => l.status === "Pending").length;
  const approvedCount = leaves.filter((l) => l.status === "Approved").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Gestion des Congés
        </h1>
        <Button>
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
              {leaves.map((leave) => (
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
        </CardContent>
      </Card>
    </div>
  );
}
