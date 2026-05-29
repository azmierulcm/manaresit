"use client";

import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getAuth,
  connectAuthEmulator,
  setPersistence,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { getFirebaseApp } from "@/lib/firebase/client";

export const auth = getAuth(getFirebaseApp());

if (
  typeof window !== "undefined" &&
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true"
) {
  try {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", {
      disableWarnings: true,
    });
  } catch {
    // Firebase only allows connecting an emulator once per app instance.
  }
}

export async function signInWithGoogle() {
  await setPersistence(auth, browserLocalPersistence);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return signInWithPopup(auth, provider);
}

export async function signOutCurrentUser() {
  return signOut(auth);
}

export async function getCurrentUserIdToken() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("You must be signed in to continue.");
  }

  return user.getIdToken();
}
