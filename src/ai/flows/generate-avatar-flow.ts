
'use server';
/**
 * @fileOverview An AI flow to generate employee avatars.
 *
 * - generateAvatar - A function that takes a text prompt and returns an image data URI.
 * - GenerateAvatarInput - The input type for the generateAvatar function.
 * - GenerateAvatarOutput - The return type for the generateAvatar function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateAvatarInputSchema = z.string().describe('A text description of the avatar to generate. For example: "Smiling African business woman"');
export type GenerateAvatarInput = z.infer<typeof GenerateAvatarInputSchema>;

const GenerateAvatarOutputSchema = z.string().describe('The generated image as a base64 encoded data URI.');
export type GenerateAvatarOutput = z.infer<typeof GenerateAvatarOutputSchema>;

export async function generateAvatar(input: GenerateAvatarInput): Promise<GenerateAvatarOutput> {
  return generateAvatarFlow(input);
}

const generateAvatarFlow = ai.defineFlow(
  {
    name: 'generateAvatarFlow',
    inputSchema: GenerateAvatarInputSchema,
    outputSchema: GenerateAvatarOutputSchema,
  },
  async (prompt) => {
    const { media } = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: `professional, photorealistic avatar, corporate directory. Description: "${prompt}". centered headshot, neutral background.`,
    });

    if (!media || !media.url) {
      throw new Error('Image generation failed to return an image.');
    }

    return media.url;
  }
);
