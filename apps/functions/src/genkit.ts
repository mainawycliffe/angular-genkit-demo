import { onCallGenkit } from 'firebase-functions/https';
import { z } from 'zod';
import { ai, googleAIapiKey, retriever } from './ai/genkit';

// const recommendBookOutputSchema = z.object({
//   title: z.string(),
//   author: z.string(),
//   description: z.string(),
// });

const recommendBookFlow = ai.defineFlow(
  {
    name: 'generatePoem',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (prompt, { sendChunk }) => {
    const docs = await ai.retrieve({
      retriever,
      query: prompt,
      options: {
        limit: 10, // Options: Return up to 10 documents
      },
    });

    console.log('Retrieved documents:', docs);

    const response = ai.generateStream({
      prompt: `
      You are a book recommendation engine. Recommend a book based on the following subject: ${prompt}.

      The recommendation should include the title, author, and a brief description of the book.
      The response should be in JSON format with the following structure:
      {
        "title": "Book Title",
        "author": "Author Name",
        "description": "Brief description of the book."
      }

      Please provide a single recommendation at a time.
      Make sure to include the title, author, and description in the response.
      Avoid any additional commentary or information.
      Example response:
      {
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "description": "A novel about the American dream and the disillusionment that comes with it."
      }
      Make sure to follow the JSON format strictly, not markdown.
      

Use only the context provided to answer the question.
If you don't know, do not make up an answer.
Do not add or change items on the menu..
      `,
      docs: docs,
    });
    for await (const chunk of response.stream) {
      sendChunk(chunk);
    }
    const data = await response.response;
    console.log('Final response:', data.data);
    return (await response.response).text;
  }
);

export const recommendBook = onCallGenkit(
  {
    secrets: [googleAIapiKey],
  },
  recommendBookFlow
);
