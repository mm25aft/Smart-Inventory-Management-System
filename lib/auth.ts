import { deleteApp, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
} from "firebase/auth";

import { getFirebaseAuth } from "@/lib/firebase";
import { getCurrentUserProfile, saveUserProfile } from "@/lib/firestore";
import type { AppUser, UserRole } from "@/types";

const authCookieNames = ["ims-auth", "ims-role", "ims-active", "ims-name", "ims-email"];

function cookieOptions() {
  return "path=/; max-age=2592000; SameSite=Lax";
}

function setCookie(name: string, value: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=${encodeURIComponent(value)}; ${cookieOptions()}`;
}

function clearCookie(name: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export function clearAuthCookies() {
  authCookieNames.forEach(clearCookie);
}

export function syncAuthCookies(user: AppUser | null) {
  if (!user) {
    clearAuthCookies();
    return;
  }

  setCookie("ims-auth", "1");
  setCookie("ims-role", user.role);
  setCookie("ims-active", user.isActive ? "1" : "0");
  setCookie("ims-name", user.name);
  setCookie("ims-email", user.email);
}

export async function loginWithEmail(email: string, password: string) {
  const auth = await getFirebaseAuth();
  const credentials = await signInWithEmailAndPassword(auth, email, password);
  const profile = await getCurrentUserProfile(credentials.user.uid);

  if (!profile) {
    throw new Error("Your account exists in Firebase Auth but no Firestore profile was found.");
  }

  if (!profile.isActive) {
    await signOut(auth);
    throw new Error("Your account has been deactivated. Contact an administrator.");
  }

  syncAuthCookies(profile);
  return profile;
}

export async function logoutCurrentUser() {
  const auth = await getFirebaseAuth();
  await signOut(auth);
  clearAuthCookies();
}

export async function updateCurrentProfile(name: string) {
  const auth = await getFirebaseAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("No authenticated user found.");
  }

  await updateProfile(currentUser, { displayName: name });
}

export async function updateCurrentPassword(nextPassword: string) {
  const auth = await getFirebaseAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("No authenticated user found.");
  }

  await updatePassword(currentUser, nextPassword);
}

export async function inviteUserAccount(payload: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  performedBy: string;
}) {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const secondaryApp = initializeApp(firebaseConfig, `invite-${Date.now()}`);

  try {
    const secondaryAuth = (await import("firebase/auth")).getAuth(secondaryApp);
    const credentials = await createUserWithEmailAndPassword(
      secondaryAuth,
      payload.email,
      payload.password,
    );

    await saveUserProfile(
      credentials.user.uid,
      {
        name: payload.name,
        email: payload.email,
        role: payload.role,
        isActive: true,
      },
      payload.performedBy,
    );

    return credentials.user.uid;
  } finally {
    await deleteApp(secondaryApp);
  }
}
