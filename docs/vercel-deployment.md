# Vercel Deployment

Manaresit is ready to deploy on Vercel from the GitHub repository:

```txt
https://github.com/azmierulcm/manaresit
```

## Import Project

1. Open Vercel.
2. Choose **Add New Project**.
3. Import `azmierulcm/manaresit` from GitHub.
4. Keep the framework preset as **Next.js**.
5. Keep the root directory as the repository root.
6. Use the default build command:

```bash
npm run build
```

## Environment Variables

Add these variables in Vercel under **Project Settings > Environment Variables**.

```txt
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=manaresit
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=manaresit.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=691305577735
NEXT_PUBLIC_FIREBASE_APP_ID=1:691305577735:web:1ba92e8e488d5428d899a2
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-QDFH0PEWE7
NEXT_PUBLIC_USE_FIREBASE_EMULATORS=false

FIREBASE_SERVICE_ACCOUNT_KEY=
FIREBASE_STORAGE_BUCKET=manaresit.firebasestorage.app
```

Use the same base64 service-account value from local `.env.local` for
`FIREBASE_SERVICE_ACCOUNT_KEY`. Do not commit that value to GitHub.

The app can build without `FIREBASE_SERVICE_ACCOUNT_KEY`, but receipt upload
and any server-side Firebase Admin calls require it at runtime.

## Firebase Auth

After the first Vercel deployment finishes, copy the Vercel domain and add it
to Firebase Authentication authorized domains:

```txt
Firebase Console > Authentication > Settings > Authorized domains
```

Add both the generated Vercel domain and any custom production domain.

## Deploy Flow

After the Vercel project is connected to GitHub:

```bash
git push origin main
```

Every push to `main` will trigger a new Vercel production deployment.
