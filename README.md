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

1. Clone this repository to your local machine

   ```bash
    gh repo clone mainawycliffe/angular-genkit-demo

    or

    git clone https://github.com/mainawycliffe/angular-genkit-demo.git
   ```

2. Install NPM Dependencies

   ```bash
    cd angular-genkit-demo
    npm install

   ```

3. Create a Firebase project and enable Firestore

   - Go to the [Firebase Console](https://console.firebase.google.com/)
   - Click on "Add Project"
   - Enter a name for your project
   - Select "Enable Google Analytics" (optional)
   - Click on "Create Project"
   - Click on "Continue"
   - Click on "Add Firebase to your web app"
   - Copy the Firebase config object and paste it into your `src/app/app.config.ts` file
   - This will be used to initialize the Firebase app in the Angular app
   - Click on "Firestore Database" in the left menu, under "Build"
   - Click on "Create Database"
   - Select "Start in Test Mode" (this will allow you to read and write to the
     database with less stringent security rules - DO NOT USE THIS IN
     PRODUCTION)
   - Click on "Next"
   - Click on "Finish"
   - Click on "Continue"

4. Get your Firebase project ID

   - Go to the [Firebase Console](https://console.firebase.google.com/)
   - Click on your project
   - Click on "Project Settings" (gear icon) in the left menu
   - Copy the Project ID and paste it into your `.firebaserc` file, at the root
     of the project

   ```json
   {
     "projects": {
       "default": "<your-project-id>"
     }
   }
   ```

   - At this point, you should have a Firebase project with Firestore enabled and
     the Firebase config object in your `src/app/app.config.ts` file.
   - You should also have a `.firebaserc` file at the root of the project with
     your Firebase project ID.

5. Install Firebase CLI

   - Open a terminal and run the following command to install the Firebase CLI
     globally:

   ```bash
   npm install -g firebase-tools
   ```

   - After the installation is complete, run the following command to log in to
     your Firebase account:

   ```bash
   firebase login --reauth
   ```

   - This will open a browser window and prompt you to log in to your Firebase
     account. After logging in, you will be redirected to the terminal.

6. Next, get Google Gemini API Key from Google AI Studio

   - Go to the [Google AI Studio](https://aistudio.google.com/)
   - Click on "Get API Key" in the top right corner and follow the
     instructions to create a new project and get your API key.
   - Keep the API Key, as you will asked to enter it in the next step.

7. Deploy Firebase

   - In the terminal, run the following command to deploy your Firebase project:

   ```bash
   firebase deploy
   ```

   - This will deploy Firebase Functions and Firestore
   - During the deployment, you will be asked for the Google Gemini API Key
   - Enter the API Key you got from Google AI Studio, in the previous step
   - When the deployment is complete, you will see a URL for the seed data
     firebase function in the terminal.
   - Copy the URL and paste it into your browser to seed the database with
     sample data we will be using in the workshop.
   - You should see a message saying "Data seeded successfully" in the browser.
   - You can also check the Firestore database in the Firebase Console to see
     the seeded data.

8. Create the firebase function for recommending books, based on the seeded
   data.

   - Inside the `functions/src` folder, you will see a file called `recommend.ts`
   - This file contains the basic implementation of the Firebase function that will
     recommend books based on the seeded data, but is not complete.
   - Open the `recommend.ts` file and complete the implementation of the
     `recommendBooks` function.
   - First, look for a Genkit Flow called `recommendBooksFlow` in the file.

   ```ts
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
   ```

   - The prompt is a string that contains the book title entered by the user
     in the Angular app.
   - The output is an array of objects that contain the recommended books
     based on the input book title.
   - Before we can ask Gemini to recommend books, we need to get the seeded data from
     Firestore.
   - This is done by doing a vector search, using a retriever on the seeded
     data. The vector search will do a nearby search on the seeded data and
     return the most relevant data. Then we will pass the relevant data to
     gemini alongside the input book title, to get the recommended books.
   - I have already implemented the vector search and the retriever, so you can
     just use them to get the seeded data. You can find the retriever in the
     `apps/functions/src/ai/genkit.ts` file.
   - First, import the retriever at the top of the `recommend.ts` file:

   ```ts
   import { retriever } from '../ai/genkit';
   ```

   - Then, use the retriever to get the seeded data in the `recommendBooksFlow`
     function:

   ```ts
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
     }
   );
   ```

   - The `docs` variable will contain the seeded data that is relevant to the
     input book title. We are limiting the number of documents to 10, but you
     can change this to any number you want.

     - Next, we need to pass the `docs` variable to Gemini alongside the input
       book title, to get the recommended books. To do this, we need to create a
       prompt that contains the input book title and the relevant data from the
       `docs` variable.

   - The prompt should look like this:

   ```ts
   const prompt = `You are a book recommendation engine for a personal library.
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
    Strictly use the information from the provided documents.`;
   ```

   - Remember, for the prompt, we need to be as specific as possible, so that
     Gemini can understand what we are asking for. We also need to make sure
     that we are using the correct JSON format for the output, so that we can
     parse it in the Angular app.

   - Finally, we need to pass the `prompt` variable to Gemini, together with the
     `docs` variable, to get the recommended books.

     ```ts
     const { output } = await ai.generate({
       prompt: prompt,
       docs: docs,
       output: {
         format: 'json',
         schema: z.array(recommendBookOutputSchema),
       },
     });
     ```

   - The `output` variable will contain the recommended books in the JSON format  
     that we specified in the prompt. We can then return the `output` variable
     from the `recommendBooksFlow` function.
   - We can then return the `output` variable from the `recommendBooksFlow`
     function:

   ```ts
   return output;
   ```

   - The complete `recommend.ts` file should look like this:

   ```ts
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
         thumbnailUrl: docs.find((doc) => doc.metadata.id === book.id)?.metadata.thumbnailUrl,
         publishedDate: docs.find((doc) => doc.metadata.id === book.id)?.metadata.publishedDate,
         author: docs.find((doc) => doc.metadata.id === book.id)?.metadata.authors.join(', '),
         isbn: docs.find((doc) => doc.metadata.id === book.id)?.metadata.isbn,
       }));
     }
   );
   ```

   - Then, inside the `functions/src/index.ts` file, export the
     `recommendBookFlow` function:

   ```ts
   export { recommendBookFlow } from './recommend';
   ```

   - Deploy the Firebase functions again, using the following command:

   ```bash
    firebase deploy
   ```

9. Run the Angular app

- We are using NX to manage the monorepo, so we need to run the Angular app using
  NX.
- In the terminal, run the following command to start the NX workspace:

```bash
  npx nx serve web
```

```

- This will start the Angular app on `http://localhost:4200`
- In the text input, enter a book title and click on the "Search" button
```
