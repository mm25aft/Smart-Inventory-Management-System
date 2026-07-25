import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  type Auth,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function hasFirebaseConfig() {
  return Object.values(firebaseConfig).every(Boolean);
}

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firebaseDb: Firestore | null = null;
let firebaseStorage: FirebaseStorage | null = null;

export function getFirebaseApp() {
  if (!hasFirebaseConfig()) {
    throw new Error("Missing Firebase configuration. Check your .env.local values.");
  }

  if (!firebaseApp) {
    firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }

  return firebaseApp;
}

export function getFirebaseDb() {
  if (!firebaseDb) {
    firebaseDb = getFirestore(getFirebaseApp());
  }

  return firebaseDb;
}

export function getFirebaseStorage() {
  if (!firebaseStorage) {
    firebaseStorage = getStorage(getFirebaseApp());
  }

  return firebaseStorage;
}

export async function getFirebaseAuth() {
  if (!firebaseAuth) {
    firebaseAuth = getAuth(getFirebaseApp());
    if (typeof window !== "undefined") {
      await setPersistence(firebaseAuth, browserLocalPersistence);
    }
  }

  return firebaseAuth;
}

export const firebaseReady = hasFirebaseConfig();
