import { defineFirestoreRetriever } from '@genkit-ai/firebase';
import googleAI, { textEmbedding004 } from '@genkit-ai/googleai';
import vertexAI from '@genkit-ai/vertexai';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import { genkit } from 'genkit';

export const googleAIapiKey = defineSecret('GEMINI_API_KEY');

initializeApp();
const firestore = getFirestore();

export const ai = genkit({
  plugins: [googleAI(), vertexAI({ location: 'us-central1' })],
  model: googleAI.model('gemini-2.0-flash'), // set default model
});

export const indexConfig = {
  collection: 'books',
  contentField: 'content',
  vectorField: 'contentEmbedding',
  embedder: textEmbedding004,
};

export const retriever = defineFirestoreRetriever(ai, {
  name: 'booksRetriever',
  firestore,
  collection: 'books', // Collection to query
  contentField: 'content', // Field containing document content
  vectorField: 'contentEmbedding', // Field containing vector embeddings
  embedder: textEmbedding004, // Embedder to generate embeddings
  distanceMeasure: 'COSINE', // Default is 'COSINE'; other options: 'EUCLIDEAN', 'DOT_PRODUCT'
});
