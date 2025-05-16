import { onCallGenkit } from 'firebase-functions/https';
import { z } from 'zod';
import { ai, googleAIapiKey, retriever } from './ai/genkit';

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
    const docs = await ai.retrieve({
      retriever,
      query: prompt,
      options: {
        limit: 10, // Options: Return up to 10 documents
      },
    });

    console.log('Retrieved documents:', docs);

    const { data, text, output } = await ai.generate({
      prompt: `You are a book recommendation engine for a personal library.
  Your task is to recommend books based on the subject: ${prompt}.
  You MUST ONLY recommend books that are explicitly present in the provided documents.
  Do NOT invent or suggest any books not found in the documents.
  Provide up to five book recommendations.

  The output MUST be a JSON array of objects. Each object must have the following fields: "title", "author", "description", "isbn", and "id".

  Example of the required JSON output format:
  [
    {
    "isbn": "978-3-16-148410-0",
    "id": "1",
    "title": "Book Title",
    "description": "A brief description of the book.",
    "author": "Author Name"
    }
  ]

  Do not include any additional commentary, explanations, or information beyond the JSON array.
  If no relevant books are found in the provided documents for the given subject, return an empty JSON array [].
  Strictly use the information from the provided documents.`,
      docs: docs,
      output: {
        format: 'json',
        schema: z.array(recommendBookOutputSchema),
      },
    });
    console.log('Final response:', data, text, output);
    return output.map((book) => ({
      ...book,
      thumbnailUrl: docs.find((doc) => doc.metadata.id === book.id)?.metadata
        .thumbnailUrl,
      publishedDate: docs.find((doc) => doc.metadata.id === book.id)?.metadata
        .publishedDate,
      author: docs
        .find((doc) => doc.metadata.id === book.id)
        ?.metadata.authors.join(', '),
      isbn: docs.find((doc) => doc.metadata.id === book.id)?.metadata.isbn,
    }));
  }
);

export const recommendBook = onCallGenkit(
  {
    secrets: [googleAIapiKey],
  },
  recommendBookFlow
);
