import { Component, inject, resource, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { FIREBASE_APP } from './app.config';

@Component({
  imports: [FormsModule],
  selector: 'app-root',
  template: `
    <div class="flex flex-col h-screen w-screen p-4 py-9 bg-gray-100">
      <div class="flex flex-col flex-1 w-full max-w-[60rem] mx-auto">
        <div class="flex flex-col flex-1 gap-y-2 border-b border-gray-300">
          <div class="flex flex-row justify-between items-center">
            <h1 class="text-2xl font-bold">Poem Generator</h1>
          </div>
          <div class="flex flex-col flex-1">
            <h2 class="text-xl font-semibold mb-4">Generated Poem</h2>
            <div
              class="flex flex-col flex-1 justify-end py-4 overflow-y-auto text-lg font-semibold text-gray-800"
            >
              <!-- presserver line breaks -->
              <p class="text-gray-800 whitespace-pre-line ">
                {{ resource.isLoading() ? 'Generating...' : resource.value() }}
              </p>
            </div>
          </div>
        </div>
        <div class="flex flex-row gap-2 w-full">
          <input
            [(ngModel)]="poemSubject"
            type="text"
            class="w-full p-2 text-lg border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Subject for the poem to be generated"
          />
          <button
            (click)="poem.set(poemSubject)"
            class="p-2 px-4 bg-blue-500 text-white rounded min-w-max"
            [disabled]="!poemSubject || resource.isLoading()"
          >
            Generate Poem
          </button>
        </div>
      </div>
    </div>
  `,
})
export class AppComponent {
  poemSubject = '';
  poem = signal<string | undefined>(undefined);

  firebaseApp = inject(FIREBASE_APP);

  functions = getFunctions(this.firebaseApp);

  resource = resource({
    request: () => ({
      subject: this.poem(),
    }),
    loader: async ({ request }) => {
      if (!request.subject) {
        return;
      }
      const callableFn = httpsCallable(this.functions, 'poem');
      const res = await callableFn(request.subject);
      return res.data;
    },
  });
}
