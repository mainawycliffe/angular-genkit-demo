import {
  ApplicationConfig,
  InjectionToken,
  provideZoneChangeDetection,
} from '@angular/core';
import { FirebaseApp, initializeApp } from 'firebase/app';

export const FIREBASE_APP = new InjectionToken<FirebaseApp>('FIREBASE_APP');

const initializeFirebaseApp = () =>
  initializeApp({
    // Your Firebase configuration object here
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
