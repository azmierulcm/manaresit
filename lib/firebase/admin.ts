import "server-only";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import type { AppOptions, ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function getServiceAccount(): ServiceAccount | undefined {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!raw || raw === "undefined" || raw === "null") {
    return undefined;
  }

  const decoded = raw.trim().startsWith("{")
    ? raw
    : Buffer.from(raw, "base64").toString("utf8");

  const serviceAccount = JSON.parse(decoded);

  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  }

  return serviceAccount;
}

function getAdminAppOptions(): AppOptions {
  const serviceAccount = getServiceAccount();
  const options: AppOptions = {};

  if (serviceAccount) {
    options.credential = cert(serviceAccount);
  }

  if (process.env.FIREBASE_STORAGE_BUCKET) {
    options.storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
  }

  return options;
}

const app =
  getApps()[0] ??
  initializeApp(getAdminAppOptions());

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
adminDb.settings({ ignoreUndefinedProperties: true });
export const adminStorage = getStorage(app);
