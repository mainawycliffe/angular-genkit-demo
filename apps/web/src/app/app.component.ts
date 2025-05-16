import { CommonModule } from '@angular/common';
import { Component, inject, resource, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { FIREBASE_APP } from './app.config';

@Component({
  imports: [FormsModule, CommonModule],
  selector: 'app-root',
  template: `
    <div
      class="flex flex-col h-screen w-screen p-4 py-9 bg-gray-100 overflow-y-auto"
    >
      <div
        class="flex flex-col flex-1 w-full max-w-[60rem] mx-auto overflow-y-auto"
      >
        <div
          class="flex flex-col flex-1 gap-y-2 border-b overflow-y-auto  border-gray-300"
        >
          <div class="flex flex-row justify-between items-center">
            <h1 class="text-2xl font-bold">Book Recommendation Engine</h1>
          </div>
          <div class="flex flex-col flex-1 overflow-y-auto">
            @if (bookSubject) {
            <h2 class="text-xl font-semibold mb-4">
              Book Recommendations for "{{ bookSubject }}"
            </h2>

            <div
              class="flex flex-col flex-1 justify-end py-4 overflow-y-auto text-lg font-semibold text-gray-800"
            >
              @if(resource.isLoading()) {
              <p class="text-gray-800 whitespace-pre-line ">
                <span class="animate-pulse"> Generating ...</span>
              </p>
              } @else if (resource.error()) {
              <p class="text-red-500">Error: {{ resource.error() | json }}</p>
              } @else if (resource.value()) {

              <div
                class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto"
              >
                @for ( book of resource.value(); track book["id"]) {
                <div
                  class="flex flex-col gap-2 border rounded-lg bg-white shadow-md"
                >
                  <div class="bg-gray-100 rounded aspect-square">
                    @if (book["thumbnailUrl"]) {
                    <img
                      [src]="book['thumbnailUrl']"
                      alt="{{ book['title'] }}"
                      class="aspect-square w-full object-cover"
                    />
                    } @else {
                    <img
                      src="https://via.placeholder.com/150"
                      alt="Placeholder"
                      class="aspect-square w-full object-cover"
                    />
                    }
                  </div>
                  <div class="flex flex-col gap-2 p-4">
                    <h3 class="text-xl font-bold">{{ book['title'] }}</h3>
                    <p class="text-gray-600">Author: {{ book['author'] }}</p>
                    <p class="text-gray-600">ISBN: {{ book['isbn'] }}</p>
                    <p class="text-gray-600">
                      Published Date: {{ book['publishedDate'] | date }}
                    </p>
                  </div>
                </div>
                }
              </div>
              }
            </div>
            } @else {
            <div class="flex flex-col flex-1 justify-center items-center py-4">
              <p class="text-gray-400 text-lg italic">
                Please enter a subject to get book recommendations.
              </p>
            </div>

            }
          </div>
        </div>
        <div class="flex flex-row gap-2 w-full">
          <input
            [(ngModel)]="bookSubject"
            type="text"
            class="w-full p-2 text-lg border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="What kind of book do you want to read?"
          />
          <button
            (click)="poem.set(bookSubject)"
            class="p-2 px-4 bg-blue-500 text-white rounded min-w-max"
            [disabled]="!bookSubject || resource.isLoading()"
          >
            Recommend Books
          </button>
        </div>
      </div>
    </div>
  `,
})
export class AppComponent {
  bookSubject = '';
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
      const callableFn = httpsCallable(this.functions, 'recommendBook');
      const res = await callableFn(request.subject);
      return res.data as Record<string, string>[];
    },
  });
}
