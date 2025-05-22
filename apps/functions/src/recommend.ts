import { onCallGenkit } from 'firebase-functions/https';
import { z } from 'zod';
import { ai, googleAIapiKey } from './ai/genkit';

const recommendBookOutputSchema = z.object({
  title: z.string(),
  author: z.string(),
  description: z.string(),
  isbn: z.string(),
  id: z.string(),
  thumbnailUrl: z.string().optional(),
  publishedDate: z.string().optional(),
});

const recommendBookFlow = ai.defineFlow(
  {
    name: 'generatePoem',
    inputSchema: z.string(),
    outputSchema: z.array(recommendBookOutputSchema),
  },
  async (prompt) => {
    //  CODE HERE
  }
);

export const recommendBook = onCallGenkit(
  {
    secrets: [googleAIapiKey],
  },
  recommendBookFlow
);
