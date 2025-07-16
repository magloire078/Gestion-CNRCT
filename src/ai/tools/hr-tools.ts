'use server';
/**
 * @fileOverview Defines HR-related tools for the AI assistant.
 * 
 * - getEmployeeInfo: A tool to retrieve employee information by name or matricule.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { searchEmployees } from '@/services/employee-service';

export const getEmployeeInfo = ai.defineTool(
  {
    name: 'getEmployeeInfo',
    description: 'Get information about an employee by their name or matricule number.',
    inputSchema: z.object({
      query: z.string().describe('The name or matricule of the employee to search for.'),
    }),
    outputSchema: z.string().describe('A JSON string containing the employee details or a "not found" message.'),
  },
  async (input) => {
    console.log(`[getEmployeeInfo] Searching for employee with query: ${input.query}`);
    try {
      const employees = await searchEmployees(input.query);
      if (employees.length === 0) {
        return 'No employee found matching the query.';
      }
      // Return a summary of the found employee(s)
      return JSON.stringify(employees.map(e => ({
          name: e.name,
          matricule: e.matricule,
          role: e.role,
          department: e.department,
          status: e.status,
      })));
    } catch (error) {
      console.error('[getEmployeeInfo] Error searching for employee:', error);
      return 'An error occurred while searching for the employee.';
    }
  }
);
