"use client";

import {
  collection,
  connectFirestoreEmulator,
  doc,
  initializeFirestore,
  getFirestore,
} from "firebase/firestore";
import { getFirebaseApp } from "@/lib/firebase/client";

let db: ReturnType<typeof getFirestore>;
try {
  db = initializeFirestore(getFirebaseApp(), { ignoreUndefinedProperties: true });
} catch {
  db = getFirestore(getFirebaseApp());
}
export { db };

if (
  typeof window !== "undefined" &&
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true"
) {
  try {
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
  } catch {
    // Firebase only allows connecting an emulator once per app instance.
  }
}

export const collections = {
  users: () => collection(db, "users"),
  transactions: () => collection(db, "transactions"),
  receipts: () => collection(db, "receipts"),
  einvoices: () => collection(db, "einvoices"),
  reports: () => collection(db, "reports"),
};

export const documents = {
  user: (uid: string) => doc(db, "users", uid),
  transaction: (transactionId: string) =>
    doc(db, "transactions", transactionId),
  receipt: (receiptId: string) => doc(db, "receipts", receiptId),
  einvoice: (einvoiceId: string) => doc(db, "einvoices", einvoiceId),
  report: (reportId: string) => doc(db, "reports", reportId),
};
