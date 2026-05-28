# Manaresit

Starter architecture and core code for a Next.js 14, TypeScript, Tailwind CSS,
Firebase, Sharp, and Recharts receipt-first budget tracker.

## Included

- Responsive Airbnb-inspired dashboard at `app/page.tsx`
- Mobile-first dashboard rhythm: balance, scanner, quick stats, charts, activity
- Receipt upload API route at `app/api/receipts/upload/route.ts`
- Sharp-based receipt compression to AVIF
- Firebase Admin helper for Auth, Firestore, and Storage
- Typed `ReceiptDoc`, `TransactionDoc`, and `EinvoiceDoc` models
- Firestore and Storage rules for user-owned private data
- Small shadcn-style UI primitives: `Button`, `Card`, and `Badge`
- Firebase Functions placeholder for async receipt OCR processing

## Environment

Copy `.env.example` to `.env.local` and provide:

```txt
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
NEXT_PUBLIC_USE_FIREBASE_EMULATORS=false

FIREBASE_SERVICE_ACCOUNT_KEY=
FIREBASE_STORAGE_BUCKET=
```

`FIREBASE_SERVICE_ACCOUNT_KEY` may be raw JSON or base64-encoded JSON.

## Firebase Setup

1. Create a Firebase project named `manaresit`.
2. Add a Web App in Firebase Console and copy the web config values into
   `.env.local`.
3. Enable Authentication and turn on Google sign-in.
4. Create Firestore in production mode.
5. Create Cloud Storage.
6. Confirm `.firebaserc` points to the `manaresit` Firebase project.
7. Create a service account key in Google Cloud IAM and paste the JSON into
   `FIREBASE_SERVICE_ACCOUNT_KEY`, or paste a base64-encoded copy.
8. Set `FIREBASE_STORAGE_BUCKET` to the same value as
   `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`.

Deploy rules:

```bash
npm run firebase:deploy:rules
```

Run Firebase emulators:

```bash
npm run firebase:emulators
```

When using emulators locally, set:

```txt
NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true
```

## Run Locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

For Cloud Functions:

```bash
cd functions
npm install
npm run build
```

## Deploy

Deploy with Vercel through GitHub. See
[`docs/vercel-deployment.md`](docs/vercel-deployment.md).
