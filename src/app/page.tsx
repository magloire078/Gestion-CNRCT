import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Users, FileWarning, Laptop, Car } from 'lucide-react';
import { leaveData, employeeData, assetData, fleetData } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function DashboardPage() {
  const onLeaveCount = employeeData.filter(e => e.status === 'On Leave').length;
  const pendingLeaveCount = leaveData.filter(l => l.status === 'Pending').length;

  const stats = [
    {
      title: 'Total des employés',
      value: employeeData.length,
      icon: Users,
      description: `${onLeaveCount} en congé`,
    },
    {
      title: 'Approbations en attente',
      value: pendingLeaveCount,
      icon: FileWarning,
      description: 'Demandes de congé',
    },
    {
      title: 'Actifs Informatiques',
      value: assetData.length,
      icon: Laptop,
      description: 'Matériel et logiciels suivis',
    },
    {
      title: 'Véhicules de la Flotte',
      value: fleetData.length,
      icon: Car,
      description: 'Voitures et camionnettes de société',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Tableau de Bord</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Demandes de Congé Récentes</CardTitle>
            <CardDescription>Un aperçu rapide des dernières demandes de congé.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leaveData.slice(0, 3).map(leave => (
                <div key={leave.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage
                        src={`https://placehold.co/40x40.png`}
                        data-ai-hint="user avatar"
                      />
                      <AvatarFallback>{leave.employee.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{leave.employee}</p>
                      <p className="text-sm text-muted-foreground">{leave.type}</p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">{leave.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Nouvelles Recrues</CardTitle>
            <CardDescription>Bienvenue aux nouveaux membres de notre équipe.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {employeeData.slice(0, 3).map(emp => (
                <div key={emp.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                       <AvatarImage
                        src={`https://placehold.co/40x40.png`}
                        data-ai-hint="user avatar"
                      />
                      <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{emp.name}</p>
                      <p className="text-sm text-muted-foreground">{emp.role}</p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">{emp.department}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
