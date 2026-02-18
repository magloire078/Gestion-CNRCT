
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "../ui/label";
import { getEmployees } from "@/services/employee-service";
import { getLeaves } from "@/services/leave-service";
import { getMissions } from "@/services/mission-service";
import type { Employe, Leave, Mission } from "@/lib/data";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useFormat } from "@/hooks/use-format";

interface ReportData {
  newHires: Employe[];
  terminations: Employe[];
  approvedLeaves: Leave[];
  missions: Mission[];
}

export function EmployeeActivityReport() {
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [month, setMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const { formatDate } = useFormat();

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setReportData(null);

    const selectedYear = parseInt(year);
    const selectedMonth = parseInt(month) - 1; // JS month is 0-indexed

    try {
      const [employees, leaves, missions] = await Promise.all([
        getEmployees(),
        getLeaves(),
        getMissions(),
      ]);

      const newHires = employees.filter(e => {
        if (!e.dateEmbauche) return false;
        const hireDate = new Date(e.dateEmbauche);
        return hireDate.getFullYear() === selectedYear && hireDate.getMonth() === selectedMonth;
      });

      const terminations = employees.filter(e => {
        if (!e.Date_Depart) return false;
        const termDate = new Date(e.Date_Depart);
        return e.status === 'Licencié' && termDate.getFullYear() === selectedYear && termDate.getMonth() === selectedMonth;
      });

      const approvedLeaves = leaves.filter(l => {
        const leaveDate = new Date(l.startDate);
        return l.status === "Approuvé" &&
          leaveDate.getFullYear() === selectedYear &&
          leaveDate.getMonth() === selectedMonth;
      });

      const activeMissions = missions.filter(m => {
        const missionDate = new Date(m.startDate);
        return missionDate.getFullYear() === selectedYear &&
          missionDate.getMonth() === selectedMonth;
      });

      setReportData({
        newHires,
        terminations,
        approvedLeaves,
        missions: activeMissions,
      });

    } catch (err) {
      console.error(err);
      setError("Impossible de générer le rapport. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());
  const months = [
    { value: "1", label: "Janvier" }, { value: "2", label: "Février" },
    { value: "3", label: "Mars" }, { value: "4", label: "Avril" },
    { value: "5", label: "Mai" }, { value: "6", label: "Juin" },
    { value: "7", label: "Juillet" }, { value: "8", label: "Août" },
    { value: "9", label: "Septembre" }, { value: "10", label: "Octobre" },
    { value: "11", label: "Novembre" }, { value: "12", label: "Décembre" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rapport d'Activité des Employés</CardTitle>
        <CardDescription>
          Générez un résumé de l'activité des employés pour un mois donné.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 items-end mb-6 p-4 border rounded-lg">
          <div className="grid gap-2 flex-1 w-full">
            <Label htmlFor="year">Année</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger id="year"><SelectValue /></SelectTrigger>
              <SelectContent>
                {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 flex-1 w-full">
            <Label htmlFor="month">Mois</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger id="month"><SelectValue /></SelectTrigger>
              <SelectContent>
                {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={generateReport} disabled={loading} className="w-full sm:w-auto">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Générer
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {reportData && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-center">
              Rapport pour {months.find(m => m.value === month)?.label} {year}
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ReportSection title="Congés Approuvés" data={reportData.approvedLeaves} renderItem={leave => (
                <div className="flex justify-between">
                  <span>{leave.employee} ({leave.type})</span>
                  <span className="text-muted-foreground">{leave.startDate} au {leave.endDate}</span>
                </div>
              )} />

              <ReportSection title="Missions du Mois" data={reportData.missions} renderItem={mission => (
                <div className="flex justify-between">
                  <span>{mission.title}</span>
                  <span className="text-muted-foreground">{mission.participants.map(p => p.employeeName).join(', ')}</span>
                </div>
              )} />

              <ReportSection title="Nouvelles Embauches" data={reportData.newHires} renderItem={emp => (
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={emp.photoUrl} alt={emp.name} data-ai-hint="user avatar" />
                    <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{emp.name}</p>
                    <p className="text-sm text-muted-foreground">{emp.poste}</p>
                  </div>
                </div>
              )} />
              <ReportSection title="Départs" data={reportData.terminations} renderItem={emp => (
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={emp.photoUrl} alt={emp.name} data-ai-hint="user avatar" />
                    <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{emp.name}</p>
                    <p className="text-sm text-muted-foreground">{emp.department}</p>
                  </div>
                </div>
              )} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


interface ReportSectionProps<T> {
  title: string;
  data: T[];
  renderItem: (item: T) => React.ReactNode;
}

function ReportSection<T>({ title, data, renderItem }: ReportSectionProps<T>) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title} ({data.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ul className="space-y-3">
            {data.map((item, index) => (
              <li key={index} className="text-sm border-b pb-2 last:border-none last:pb-0">
                {renderItem(item)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune donnée pour cette période.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
