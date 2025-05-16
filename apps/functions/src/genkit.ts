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
      prompt: `
You are a library book recommendation engine, from my personal library. Recommend books based on the following subject: ${prompt}.

Please provide upto five book recommendations at a time.

The output should be a JSON array of object with the following fields: title, author, description, isbn, and id of each book in the response. 

(All the fields are available in the documents retrieved from the database (metadata).)

Avoid any additional commentary or information.
Example response:
[
  {
    "isbn": "978-3-16-148410-0",
    "id": "1",
    "title": "Book Title",
    "description": "A brief description of the book.",
    "author": "Author Name"
  }
]
      
Use only the context provided to answer the question.
If you don't know, do not make up an answer.
      `,
      docs: docs,
      output: {
        format: 'json',
        schema: z.array(recommendBookOutputSchema),
        contentType: 'application/json',
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
