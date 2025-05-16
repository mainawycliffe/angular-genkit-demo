import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import { ai, googleAIapiKey, indexConfig } from './ai/genkit';
import { books } from './data/books.cleaned';

export const seedBooks = onRequest(
  {
    timeoutSeconds: 900,
    secrets: [googleAIapiKey],
    memory: '1GiB',
  },
  async (_, res) => {
    const firestore = getFirestore();

    const resSeed = await Promise.allSettled(
      books.map(async (book) => {
        const embedding = (
          await ai.embed({
            embedder: indexConfig.embedder,
            options: {},
            metadata: {},
            content: `The title of the book is ${
              book.title
            }. The author(s) is/are ${book.authors.join(
              ', '
            )}. The description is ${
              book.longDescription
            }. The category is ${book.categories.join(
              ','
            )}. The book was published on ${book.publishedDate}. The has ${
              book.pageCount ?? 'unknown number of '
            } pages. The books thumbnail url is ${book.thumbnailUrl}.`,
          })
        )[0].embedding;

        return firestore.collection('books').add({
          ...book,
          longDescription_Embedding: FieldValue.vector(embedding),
        });
      })
    );

    const errors = resSeed.filter((result) => result.status === 'rejected');

    if (errors.length > 0) {
      console.error('Errors occurred while seeding books:', errors);
      res.status(500).send('Error seeding books');
      return;
    }

    res.status(200).send('Books seeded successfully');
  }
);
