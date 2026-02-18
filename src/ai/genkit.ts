'use server';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// Genkit utilisera automatiquement les GOOGLE_APPLICATION_CREDENTIALS 
// pour l'authentification si `apiKey` n'est pas fourni.
// Assurez-vous que GEMINI_API_KEY est défini dans votre .env pour le développement local si nécessaire.
export const ai = genkit({
  plugins: [googleAI({
    apiKey: process.env.GEMINI_API_KEY,
  })],
});
