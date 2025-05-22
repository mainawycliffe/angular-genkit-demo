import { onCallGenkit } from 'firebase-functions/https';
import { z } from 'zod';
import { ai, googleAIapiKey, retriever } from '../ai/genkit';

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
    // 1. We start by finding relevant books in the database. For this, we do a
    //    vector search using the retriever, passing the prompt as the query.
    // 2. The retriever will return a list of documents that are relevant to the
    //    prompt. We can limit the number of documents returned to a maximum of 10.
    const docs = await ai.retrieve({
      retriever,
      query: prompt,
      options: {
        limit: 10, // Options: Return up to 10 documents
      },
    });

    console.log('Retrieved documents:', docs);

    const { output } = await ai.generate({
      // 3. We define the prompt for the AI model. The prompt includes the task
      //    of recommending books based on the subject provided in the prompt.
      //    We must only recommend books that are explicitly present in the
      //    provided documents and not invent or suggest any books not found
      //    in the documents.
      prompt: prompt,
      // 4. We pass the documents retrieved in step 1 to the AI model as context.
      //    This allows the model to use the information from these documents
      //    to generate the recommendations.
      docs: docs,
      // 5. We specify the output format and schema for the AI model's response.
      //    The output should be a JSON array of objects, each containing the
      //    fields "title", "author", "description", "isbn", and "id". as
      //    specified in the prompt.
      output: {
        format: 'json',
        schema: z.array(recommendBookOutputSchema),
      },
    });

    console.log('Final response:', output);

    // 6. We return the output of the AI model as the final response of the
    //    function. The output will be a JSON array of book recommendations
    //    based on the subject provided in the prompt.
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
