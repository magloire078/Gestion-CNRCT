
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import { config } from 'dotenv';

// Charge les variables d'environnement depuis le fichier .env en développement
if (process.env.NODE_ENV === 'development') {
    config({ path: `.env` });
}

// Genkit utilisera automatiquement les GOOGLE_APPLICATION_CREDENTIALS 
// pour l'authentification si `apiKey` n'est pas fourni.
// Assurez-vous que GEMINI_API_KEY est défini dans votre .env pour le développement local si nécessaire.
export const ai = genkit({
  plugins: [googleAI({
     apiKey: process.env.GEMINI_API_KEY,
  })],
});
