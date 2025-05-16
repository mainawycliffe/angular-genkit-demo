# Instructions for this Workshop

This workshop is designed to get started with Genkit, Firebase and Angular.

## Prerequisites

- Create a Firebase project and enable Firestore
  - [Firebase Console](https://console.firebase.google.com/)
  - [Firestore Documentation](https://firebase.google.com/docs/firestore)
  - Enable billing for your Firebase project (Use the credits provided for the workshop)
    - [Enable Billing](https://firebase.google.com/docs/projects/billing)
    - Select Pay-As-You-Go plan
- Create a Firebase Web App
  - [Firebase Web App Documentation](https://firebase.google.com/docs/web/setup)
- Install Node.js
  - [Node.js Download](https://nodejs.org/en/download/)
- Install Angular CLI
  - [Angular CLI Documentation](https://angular.io/cli)
- Install Genkit
  - [Genkit Documentation](https://genkit.dev/docs/getting-started)
- Install Firebase CLI
  - [Firebase CLI Documentation](https://firebase.google.com/docs/cli)
- Install Google Cloud SDK
  - [Google Cloud SDK Documentation](https://cloud.google.com/sdk/docs/install)

## Setup

1. Initialize a new Angular project
   ```bash
   ng new genkit-firebase-angular-workshop
   cd genkit-firebase-angular-workshop
   ```
2. Install Genkit, Firebase, firebase-js

   ```bash
    npm install firebase
   ```

3. Initialize Firebase

   ```bash
   firebase init
   ```

   - Select Firestore
   - Select Functions

4. In your firebase functions directory, install the following dependencies:

   ```bash
   cd functions
   npm install firebase-admin firebase-functions genkit zod @genkit-ai/vertexai @genkit-ai/googleai @genkit-ai/firebase
   ```

5. Create a firebase functions for seeding the database with the books data [books.cleaned.ts](apps/functions/src/data/books.cleaned.ts)

   - Create a new file in the `functions/src/data` directory called `books.cleaned.ts`
   - Copy the contents of the [following file](apps/functions/src/data/books.cleaned.ts) into `books.cleaned.ts`.
   - Create a new file in the `functions/src` directory called `seed.ts`, this
     will add the books data to the Firestore database.

     ```ts
     import { FieldValue, getFirestore } from 'firebase-admin/firestore';
     import { onRequest } from 'firebase-functions/v2/https';
     // for googleAIAPIKey, see step 5, import it from the file you will create in step 5
     import { ai, indexConfig } from './ai/genkit';
     import { googleAIapiKey } from './secrets';
     import { books } from './data/books.cleaned';

     export const seedBooks = onRequest(
       {
         timeoutSeconds: 900,
         // googleAIapiKey is a secret, so we need to pass it to the function
         // see step 6
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
                 content: `The title of the book is ${book.title}. The author(s) is/are ${book.authors.join(', ')}. The description is ${book.longDescription}. The category is ${book.categories.join(',')}. The book was published on ${book.publishedDate}. The has ${book.pageCount ?? 'unknown number of '} pages. The books thumbnail url is ${book.thumbnailUrl}.`,
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
     ```

   - This function will take the books data and add it to the Firestore database.
   - In your index, export the function:

   ```ts
   export { seedBooks } from './seed';
   ```

6. Next, create a Firebase secret for the Gemini API Key (create this in a
   separate file) - `functions/src/secrets.ts`.

   ```ts
   import { defineSecret } from 'firebase-functions/params';

   export const googleAIapiKey = defineSecret('GEMINI_API_KEY');
   ```

   - When you deploy, you will be prompted to enter the value for the secret.
     This is your Gemini API key.
   - You can get your Gemini API from Google AI Studio.
     [Google AI Studio](https://aistudio.google.com/)
   - Click on the "Get API Key" button, and create a new API key.
   - Copy the API key and paste it into the prompt when deploying the function.

7. Next, create a firestore compound index for the vector field
   `longDescription_Embedding` in the Firestore database.

   ```bash
    gcloud firestore indexes composite create --project=<project-name> --collection-group=books --query-scope=COLLECTION --field-config=vector-config='{"dimension":"768","flat": "{}"}',field-path=longDescription_Embedding
   ```

   - Replace `<project-name>` with the name of your Firebase project.

8. Next, deploy the function to Firebase.

   ```bash
   firebase deploy --only functions
   ```

   - This will deploy the function to Firebase and create a new secret for the
     Gemini API key.
   - You will see a message that says "Function seedBooks deployed
     successfully", with the URL of the function.
   - Copy the URL of the function, and paste it into your browser.
   - This will run the function and seed the database with the books data.
   - You should see a message that says "Books seeded successfully".
   - You can check the Firestore database to see if the books data has been added.
   - You can also check the Firebase console to see if the function has been
     deployed successfully.

9. Next, create a file `genkit.ts`, inside the `src/ai/` directory, in the
   functions, directory, the full path should be
   `functions/src/ai/genkit.ts`.

   - This file will contain the initialization code for Genkit.

     - We will initialize:

       - a firebase app,
       - firestore instance (to access the database)
       - Genkit instance
       - define the retriever for the books collection in the database

         ```ts
         initializeApp();
         const firestore = getFirestore();

         export const ai = genkit({
           plugins: [googleAI(), vertexAI({ location: 'us-central1' })],
           model: googleAI.model('gemini-2.0-flash'), // set default model
         });

         export const indexConfig = {
           collection: 'books',
           contentField: 'longDescription',
           vectorField: 'longDescription_Embedding',
           embedder: textEmbedding004,
         };

         export const retriever = defineFirestoreRetriever(ai, {
           name: 'booksRetriever',
           firestore,
           collection: 'books', // Collection to query
           contentField: 'longDescription', // Field containing document content
           vectorField: 'longDescription_Embedding', // Field containing vector embeddings
           embedder: textEmbedding004, // Embedder to generate embeddings
           distanceMeasure: 'COSINE', // Default is 'COSINE'; other options: 'EUCLIDEAN', 'DOT_PRODUCT'
         });
         ```

   - This code will initialize Genkit and create a retriever for the books
     collection in the database. We will use this retriever to query the
     database and get 10 similar books based on the user's prompt.
   - We will then pass the results to the AI model to generate a possible
     recommendation for the user based on the books in the database.

10. Next, create a file `recommend.ts`, inside the `src` directory, in the
    functions, directory, the full path should be
    `functions/src/recommend.ts`.

    - This file will import the retriever and the AI model from the `genkit.ts`
      file

      ```ts
      import { defineSecret } from 'firebase-functions/params';
      import { googleAIapiKey } from './genkit';
      ```

    - Next, we will create a Genkit Flow, that will take the user's prompt and
      return a recommendation based on the books in the database.

      ```ts
      import { defineSecret } from 'firebase-functions/params';
      import { googleAIapiKey } from './genkit';
      import { ai, retriever } from './ai/genkit';

      // define the schema for the output of the recommendation
      const recommendBookOutputSchema = z.object({
        title: z.string(),
        description: z.string(),
        id: z.string(),
      });

      const recommendBookFlow = ai.defineFlow(
        {
          name: 'generatePoem',
          inputSchema: z.string(),
          outputSchema: z.array(recommendBookOutputSchema),
        },
        async (prompt) => {
          // IMPLEMENTATION
          // Using vector search to find similar books from the database
          const docs = await ai.retrieve({
            retriever,
            // We use the prompt as the query to find similar books
            query: prompt,
            options: {
              limit: 10, // Options: Return up to 10 documents
            },
          });

          // We will then call the AI model to generate a recommendation based on the
          // books in the database, passing the results of the vector search
          const { output } = await ai.generate({
            prompt: '',
            docs: docs,
            output: {
              format: 'json',
              schema: z.array(recommendBookOutputSchema),
            },
          });
          console.log('Final response:', data, text, output);
          return output;
        }
      );

      // Define the firebase function to call the flow, pass the Gemini API key secret

      export const recommendBook = onCallGenkit(
        {
          // we need to pass the secret to the function
          secrets: [googleAIapiKey],
        },
        recommendBookFlow
      );
      ```

    - This code will create a Genkit Flow that will take the user's prompt and
      return a recommendation based on the books in the database.
    - make sure to export the function in your index file:

    ```ts
    export { recommendBook } from './recommend';
    ```

    - This will export the function and make it available to be called from the
      client.
    - Run firebase deploy to deploy the function to Firebase.

    ```bash
    firebase deploy --only functions
    ```

    - This will deploy the function to Firebase and create a new secret for the
      Gemini API key, if you haven't done so already.

11. Next, in our Angular app, in the `app.component.ts` file, we will remove all
    the content of the `AppComponent` class and replace it with the following code:

```ts
@Component({
  imports: [FormsModule, CommonModule],
  selector: 'app-root',
  // alternative, using template for Single File Component
  // template: ``,
  templateUrl: './app.component.html',
})
export class AppComponent {
  // This is going to be bound to the input field, using the ngModel
  bookSubject = '';

  // A signal to trigger HTTP request using the new resource API
  subject = signal<string | undefined>(undefined);

  // We will need to inject the firebase app and the functions, this will be initialized in the next step
  firebaseApp = inject(FIREBASE_APP);

  // Get an instance of the firebase functions, using the firebase app
  functions = getFunctions(this.firebaseApp);

  // We use the resource API to create a resource that will be used to call the,
  // we can access the loading, error and data states of the resource using the
  // resource property of the class
  resource = resource({
    request: () => ({
      // When the signal is updated, this will trigger the request
      subject: this.subject(),
    }),
    // This is the function that will be called when the request is triggered
    loader: async ({ request }) => {
      if (!request.subject) {
        return;
      }
      // We will use the httpsCallable function to call the firebase function
      const callableFn = httpsCallable(this.functions, 'recommendBook');
      const res = await callableFn(request.subject);
      // We will return the data from the response
      return res.data as Record<string, string>[];
    },
  });
}
```

Then, we will create a template for the component, in the
`app.component.html` file, we will add the following code:

```html
<div class="container">
  <h1>Book Recommendation</h1>
  <form (ngSubmit)="subject.set(bookSubject)" #bookForm="ngForm" class="form">
    <input type="text" name="bookSubject" [(ngModel)]="bookSubject" placeholder="Enter a book subject" required />
    <button type="submit" [disabled]="bookForm.invalid">Submit</button>
  </form>

  @if(resource.loading()) {
  <div class="loading">Loading...</div>
  } @if(resource.error()) {
  <div class="error">{{ resource.error() }}</div>
  }
  <!-- loop over the books content -->
  @for(book of resource.data(); track book['id']) {
  <div class="book">
    <h2>{{ book.title }}</h2>
    <p>{{ book.description }}</p>
    <p>Book ID: {{ book.id }}</p>
  </div>
  } @empty {
  <div class="empty">No books found</div>
  }
</div>
```

- This is a basic example, use your creativity to make it look better and
  add more features.

12. Inside the `src/app/app.config.ts` file, we will need to initialize the
    firebase app, then pass provide the app to the Angular app for dependency
    injection.

    ```ts
    import { ApplicationConfig, InjectionToken, provideZoneChangeDetection } from '@angular/core';
    import { FirebaseApp, initializeApp } from 'firebase/app';

    // create an injection token for the firebase app, that we will use to identify
    // the firebase app in the dependency injection
    export const FIREBASE_APP = new InjectionToken<FirebaseApp>('FIREBASE_APP');

    // initialize the firebase app, this will be used to initialize the firebase
    const initializeFirebaseApp = () =>
      initializeApp(
        // replace the values with your firebase project config
        // you can find this in the firebase console, in the project settings
        // Refer to step 3, create a Firebase Web App
        {
          apiKey: '******',
          authDomain: '******',
          databaseURL: '******',
          projectId: '******',
          storageBucket: '******',
          messagingSenderId: '******',
          appId: '******',
        }
      );

    export const appConfig: ApplicationConfig = {
      providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        {
          provide: FIREBASE_APP,
          // We pass the firebase initializer to the provider
          // This will initialize the firebase app and make it available for
          // dependency injection within the app
          useFactory: initializeFirebaseApp,
        },
      ],
    };
    ```

13. Run the Angular app

    ```bash
    ng serve
    ```

    - This will start the Angular app and make it available at
      [http://localhost:4200](http://localhost:4200).
    - You can now enter a book subject and get a recommendation based on the
      books in the database.
    - If you have any issues, please debug the code, check the console for
      errors and make sure the firebase functions logs for errors.
    - You can check the firebase functions logs in the firebase console, under
      the functions tab.
    - You can also check the firestore database to see if the books data has
      been added successfully.

14. Add more features, be creative and have fun with it.
    - You can add more features to the app, such as:
      - Add a loading spinner while the request is being processed
      - Add error handling for the request
      - Add more fields to the book recommendation
      - Add more styles to the app
      - Add more functionality to the app
      - Use your creativity and have fun with it.
