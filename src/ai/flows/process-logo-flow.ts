'use server';
/**
 * @fileOverview An AI flow to process uploaded logos by removing their background.
 *
 * - processLogo - A function that takes an image data URI and returns a new one with a transparent background.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ProcessLogoInputSchema = z
  .string()
  .describe(
    "A logo image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  );

const ProcessLogoOutputSchema = z
  .string()
  .describe(
    'The processed logo image with a transparent background, as a base64 encoded data URI.'
  );

export async function processLogo(
  input: z.infer<typeof ProcessLogoInputSchema>
): Promise<z.infer<typeof ProcessLogoOutputSchema>> {
  return processLogoFlow(input);
}

const processLogoFlow = ai.defineFlow(
  {
    name: 'processLogoFlow',
    inputSchema: ProcessLogoInputSchema,
    outputSchema: ProcessLogoOutputSchema,
  },
  async (logoDataUri) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: [
        {
          media: { url: logoDataUri, contentType: 'image/png' },
        },
        {
          text: 'Segment the subject of this logo and make the background transparent. Output the result as a PNG image.',
        },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media || !media.url) {
      throw new Error('Logo processing failed to return an image.');
    }

    return media.url;
  }
);
