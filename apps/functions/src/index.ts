// This example is based on the Firebase Functions v2 API.
// For more information, see https://firebase.google.com/docs/functions/version-comparison
import { googleAI } from '@genkit-ai/googleai';
import { onCallGenkit } from 'firebase-functions/https';
import { defineSecret } from 'firebase-functions/params';
import { genkit } from 'genkit';
import { z } from 'zod';

const googleAIapiKey = defineSecret('GEMINI_API_KEY');

const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model('gemini-2.0-flash'), // set default model
});

const generatePoemFlow = ai.defineFlow(
  {
    name: 'generatePoem',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (subject, { sendChunk }) => {
    const response = ai.generateStream({
      prompt: `Write a poem about ${subject}`,
    });
    for await (const chunk of response.stream) {
      sendChunk(chunk);
    }
    return (await response.response).text;
  }
);

export const poem = onCallGenkit(
  {
    secrets: [googleAIapiKey],
  },
  generatePoemFlow
);
