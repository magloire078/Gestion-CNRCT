import { PlusCircle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { leaveData } from "@/lib/data";

type Status = 'Approved' | 'Pending' | 'Rejected';

const statusVariantMap: Record<Status, "default" | "secondary" | "destructive"> = {
  'Approved': 'default',
  'Pending': 'secondary',
  'Rejected': 'destructive',
};


export default function LeavePage() {
  const pendingCount = leaveData.filter(l => l.status === 'Pending').length;
  const approvedCount = leaveData.filter(l => l.status === 'Approved').length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Leave Request
        </Button>
      </div>

       <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
            <CardDescription>Leave requests awaiting approval.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Approved Requests</CardTitle>
            <CardDescription>Total approved leave requests.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{approvedCount}</p>
          </CardContent>
        </Card>
       </div>

      <Card>
        <CardHeader>
          <CardTitle>All Leave Requests</CardTitle>
          <CardDescription>Manage all employee leave requests here.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveData.map((leave) => (
                <TableRow key={leave.id}>
                  <TableCell className="font-medium">{leave.employee}</TableCell>
                  <TableCell>{leave.type}</TableCell>
                  <TableCell>{leave.startDate}</TableCell>
                  <TableCell>{leave.endDate}</TableCell>
                  <TableCell>
                     <Badge variant={statusVariantMap[leave.status as Status] || 'default'}>{leave.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" className="h-8 w-8" disabled={leave.status !== 'Pending'}>
                        <Check className="h-4 w-4" />
                        <span className="sr-only">Approve</span>
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8" disabled={leave.status !== 'Pending'}>
                        <X className="h-4 w-4" />
                        <span className="sr-only">Reject</span>
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