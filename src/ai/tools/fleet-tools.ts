'use server';
/**
 * @fileOverview Defines fleet-related tools for the AI assistant.
 * 
 * - getVehicleInfo: A tool to retrieve vehicle information by plate, model, or assigned person.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { searchVehicles } from '@/services/fleet-service';

export const getVehicleInfo = ai.defineTool(
  {
    name: 'getVehicleInfo',
    description: 'Get information about a company vehicle by its license plate, model, or the person it is assigned to.',
    inputSchema: z.object({
      query: z.string().describe('The license plate, model, or assigned person to search for.'),
    }),
    outputSchema: z.string().describe('A JSON string containing the vehicle details or a "not found" message.'),
  },
  async (input) => {
    console.log(`[getVehicleInfo] Searching for vehicle with query: ${input.query}`);
    try {
      const vehicles = await searchVehicles(input.query);
      if (vehicles.length === 0) {
        return 'No vehicle found matching the query.';
      }
      // Return a summary of the found vehicle(s)
      return JSON.stringify(vehicles.map(v => ({
          plate: v.plate,
          makeModel: v.makeModel,
          assignedTo: v.assignedTo,
          maintenanceDue: v.maintenanceDue,
      })));
    } catch (error) {
      console.error('[getVehicleInfo] Error searching for vehicle:', error);
      return 'An error occurred while searching for the vehicle.';
    }
  }
);
