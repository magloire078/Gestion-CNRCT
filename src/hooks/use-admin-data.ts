
"use client";

import { useState, useEffect } from "react";
import type { User, Role, Department, Direction, Service, Employe } from "@/lib/data";
import { subscribeToUsers } from "@/services/user-service";
import { subscribeToRoles } from "@/services/role-service";
import { subscribeToDepartments } from "@/services/department-service";
import { subscribeToDirections } from "@/services/direction-service";
import { subscribeToServices } from "@/services/service-service";
import { getEmployees } from "@/services/employee-service";

export function useAdminData() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [roles, setRoles] = useState<Role[] | null>(null);
  const [departments, setDepartments] = useState<Department[] | null>(null);
  const [directions, setDirections] = useState<Direction[] | null>(null);
  const [services, setServices] = useState<Service[] | null>(null);
  const [allEmployees, setAllEmployees] = useState<Employe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleError = (entity: string) => (err: Error) => {
      setError(`Impossible de charger : ${entity}.`);
      console.error(err);
    };

    const unsubscribers = [
      subscribeToUsers(setUsers, handleError('utilisateurs')),
      subscribeToRoles(setRoles, handleError('rôles')),
      subscribeToDepartments(setDepartments, handleError('départements')),
      subscribeToDirections(setDirections, handleError('directions')),
      subscribeToServices(setServices, handleError('services')),
    ];

    getEmployees()
      .then(setAllEmployees)
      .catch(handleError('employés'));

    return () => unsubscribers.forEach(unsub => unsub());
  }, []);

  useEffect(() => {
    if (users !== null && roles !== null && departments !== null && directions !== null && services !== null && allEmployees.length > 0) {
      setLoading(false);
    }
  }, [users, roles, departments, directions, services, allEmployees]);

  return { users, roles, departments, directions, services, allEmployees, loading, error };
}
