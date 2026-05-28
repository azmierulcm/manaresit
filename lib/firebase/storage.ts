"use client";

import { connectStorageEmulator, getStorage, ref } from "firebase/storage";
import { getFirebaseApp } from "@/lib/firebase/client";

export const storage = getStorage(getFirebaseApp());

if (
  typeof window !== "undefined" &&
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true"
) {
  try {
    connectStorageEmulator(storage, "127.0.0.1", 9199);
  } catch {
    // Firebase only allows connecting an emulator once per app instance.
  }
}

export function receiptStorageRef(uid: string, receiptId: string) {
  return ref(storage, `users/${uid}/receipts/${receiptId}.avif`);
}

export function reportStorageRef(uid: string, reportId: string, fileName: string) {
  return ref(storage, `users/${uid}/reports/${reportId}/${fileName}`);
}
