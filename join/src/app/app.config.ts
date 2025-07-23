import { ApplicationConfig, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    isDevMode() 
      ? provideRouter(routes) 
      : provideRouter(routes, withHashLocation()),
    provideAnimations(), 
    provideZoneChangeDetection({ eventCoalescing: true }), 

    provideFirebaseApp(() => initializeApp({ 
      projectId: "join-f06a0", 
      appId: "1:405201082703:web:6401aaf7aaebf9baafcd3a", 
      databaseURL: "https://join-f06a0-default-rtdb.europe-west1.firebasedatabase.app", 
      storageBucket: "join-f06a0.firebasestorage.app", 
      apiKey: "AIzaSyDM3S3CiDFR2zjKXUfaGprWZlGJtgzR1_E", 
      authDomain: "join-f06a0.firebaseapp.com", 
      messagingSenderId: "405201082703", 
      measurementId: "G-MEASUREMENT_ID" 
    })), 

    provideFirestore(() => getFirestore())
  ]
};
