import {
  ApplicationConfig,
  InjectionToken,
  provideZoneChangeDetection,
} from '@angular/core';
import { FirebaseApp, initializeApp } from 'firebase/app';

export const FIREBASE_APP = new InjectionToken<FirebaseApp>('FIREBASE_APP');

const initializeFirebaseApp = () =>
  initializeApp({
    apiKey: 'AIzaSyBPyQxfUqbZ3LcehijHEWUsTQN-lDGJ-ok',
    authDomain: 'angular-genkit-demo.firebaseapp.com',
    databaseURL: 'https://angular-genkit-demo-default-rtdb.firebaseio.com',
    projectId: 'angular-genkit-demo',
    storageBucket: 'angular-genkit-demo.firebasestorage.app',
    messagingSenderId: '603362092209',
    appId: '1:603362092209:web:a014f398175c653b60ee90',
  });

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    {
      provide: FIREBASE_APP,
      useFactory: initializeFirebaseApp,
    },
  ],
};
