// Template for environment configuration - DO NOT COMMIT REAL VALUES
export const firebaseConfig = {

  apiKey: "AIzaSyDM3S3CiDFR2zjKXUfaGprWZlGJtgzR1_E",

  authDomain: "join-f06a0.firebaseapp.com",

  databaseURL: "https://join-f06a0-default-rtdb.europe-west1.firebasedatabase.app",

  projectId: "join-f06a0",

  storageBucket: "join-f06a0.firebasestorage.app",

  messagingSenderId: "405201082703",

  appId: "1:405201082703:web:6401aaf7aaebf9baafcd3a",

  measurementId: "G-MEASUREMENT_ID" // Falls Sie Google Analytics verwenden

};

export const environment = {
  production: true, // Set to true for production builds
  firebase: firebaseConfig
};


// Instructions:
// 1. Copy this file to environment.ts
// 2. Replace all "YOUR_*" values with your actual Firebase configuration
// 3. Never commit the real environment.ts file to version control
