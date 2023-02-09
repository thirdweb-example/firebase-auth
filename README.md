# thirdweb Auth + Firebase

This template shows you can use thirdweb Auth as a custom authentication provider for Firebase, and automatically create a document in the `users` Firestore collection when a user signs up successfully.

<div className="row" style={{ marginTop: 24 }}>
  <div className="col col--12">
    <QuickstartCard
      name="Example Repo: Firebase Integration"
      link="https://github.com/thirdweb-example/firebase-auth"
      description="Implement thirdweb Auth with Firebase"
      image="/assets/languages/firebase.png"
    />
  </div>
</div>

## Pre-requisites

- [Create a Firebase project](https://firebase.google.com/docs/web/setup#create-project)
- [Register your Firebase app](https://firebase.google.com/docs/web/setup#register-app)
- [Create and export a service account as a JSON file](https://firebase.google.com/docs/admin/setup#initialize-sdk)

## Set Up

To begin with, let's create a new Next.js project with the SDK configured:

```bash
npx thirdweb@latest create app
```

From within the created directory, we need to install `@thirdweb-dev/auth`, `firebase` and `firebase-admin`:

```bash npm2yarn
npm install @thirdweb-dev/auth firebase firebase-admin
```

### Configure Firebase

We'll use environment variables to store our Firebase configuration.

Create a `.env.local` file in the root of your project and add the corresponding values from your Firebase project:

```bash
NEXT_PUBLIC_API_KEY=<firebase-app-api-key>
NEXT_PUBLIC_AUTH_DOMAIN=<firebase-app-auth-domain>
NEXT_PUBLIC_PROJECT_ID=<firebase-app-project-id>
NEXT_PUBLIC_STORAGE_BUCKET=<firebase-app-storage-bucket>
NEXT_PUBLIC_MESSAGING_SENDER_ID=<firebase-app-messaging-sender-id>
NEXT_PUBLIC_APP_ID=<firebase-app-app-id>
FIREBASE_PRIVATE_KEY=<service-account-private-key>
FIREBASE_CLIENT_ID=<service-account-client-id>
FIREBASE_PRIVATE_KEY_ID=<service-account-private-key-id>
FIREBASE_CLIENT_EMAIL=<service-account-client-email>
```

Create a new directory called `lib` and create two helper scripts to initialize Firebase in the browser and server:

- [lib/initFirebase.ts](https://github.com/thirdweb-example/firebase-auth/blob/main/lib/initFirebase.ts)
- [lib/initFirebaseAdmin.ts](https://github.com/thirdweb-example/firebase-auth/blob/main/lib/initFirebaseAdmin.ts)

Now we have an easy way to access Firebase Auth and Firestore in both client and server environments!

### Wallet Private Key

We use our wallet's private key to instantiate the SDK on the server-side.

We recommend using a [Secret Manager to secure your private key](https://portal.thirdweb.com/sdk/set-up-the-sdk/securing-your-private-key).

**WARNING**: In this guide, we'll use environment variables for simplicity; but this is a security vulnerability and not recommended best practice for production environments.

Inside our `.env.local` file, add an environment variable to store your [wallet's private key](https://blog.thirdweb.com/guides/create-a-metamask-wallet/):

```bash
THIRDWEB_AUTH_PRIVATE_KEY=<wallet-private-key>
```

### ThirdwebProvider

Inside the `pages/_app.tsx` file, configure the `authConfig` option:

```ts title="pages/_app.tsx"
import type { AppProps } from "next/app";
import { ChainId, ThirdwebProvider } from "@thirdweb-dev/react";

// This is the chainId your dApp will work on.
const activeChainId = ChainId.Mumbai;

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThirdwebProvider
      desiredChainId={activeChainId}
      authConfig={{
        // The backend URL of the authentication endoints.
        authUrl: "/api/thirdweb-auth",
        // Set this to your domain to prevent signature malleability attacks.
        domain: process.env.NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN,
      }}
    >
      <Component {...pageProps} />
    </ThirdwebProvider>
  );
}

export default MyApp;
```

## Sign Up / Log In Users

The process of creating users in Firebase by authenticating them with their wallet has two steps:

1. Authenticate the user with their wallet
2. Create a user in Firebase with the knowledge that they own this wallet

On the homepage (`pages/index.tsx`), we'll allow the user to connect their wallet and then sign in with Ethereum.

```tsx title="pages/index.tsx"
import React from "react";
import { ConnectWallet, useAddress, useSDK } from "@thirdweb-dev/react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { signInWithCustomToken } from "firebase/auth";
import initializeFirebaseClient from "../lib/initFirebase";

export default function Login() {
  const address = useAddress();
  const { auth, db } = initializeFirebaseClient();

  return (
    <div>
      {address ? (
        <button onClick={() => signIn()}>Sign in with Ethereum</button>
      ) : (
        <ConnectWallet />
      )}
    </div>
  );
}
```

The `signIn` function:

1. Makes a request to the `api/auth/login` endpoint to get a custom token from Firebase
2. Signs the user in with the custom token
3. Creates a user in Firestore with the verified user's address

```tsx title="pages/index.tsx"
// Note: This function lives inside the Login component above.
async function signIn() {
  // Make a request to the API
  const res = await fetch("/api/auth/login", {
    method: "POST",
  });

  // Get the returned JWT token to use it to sign in with
  const { token } = await res.json();

  // Sign in with the token.
  signInWithCustomToken(auth, token)
    .then((userCredential) => {
      // On success, we have access to the user object.
      const user = userCredential.user;

      // If this is a new user, we create a new document in the database.
      const usersRef = doc(db, "users", user.uid!);
      getDoc(usersRef).then((doc) => {
        if (!doc.exists()) {
          // User now has permission to update their own document outlined in the Firestore rules.
          setDoc(usersRef, { createdAt: serverTimestamp() }, { merge: true });
        }
      });
    })
    .catch((error) => {
      console.error(error);
    });
}
```

In this function, you'll notice we're calling the `/api/auth/login` endpoint to get a
[custom JWT token from Firebase](https://firebase.google.com/docs/auth/admin/create-custom-tokens#create_custom_tokens_using_the_firebase_admin_sdk).

### Adding thirdweb API Routes

For thirdweb auth to function, you need to create a new API route. Create a new folder under `pages/api` called `thirdweb-auth` and have a file `[...thirdweb].ts` inside of it. Have the following contents in the file:

```ts
import { ThirdwebAuth } from "@thirdweb-dev/auth/next";
import { PrivateKeyWallet } from "@thirdweb-dev/auth/evm";

// Here we configure thirdweb auth with a domain and wallet
export const { ThirdwebAuthHandler, getUser } = ThirdwebAuth({
  domain: process.env.NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN || "",
  wallet: new PrivateKeyWallet(process.env.THIRDWEB_AUTH_PRIVATE_KEY || ""),
});

// Use the ThirdwebAuthHandler as the default export to handle all requests to /api/auth/*
export default ThirdwebAuthHandler();
```

Let's take a look at that API route.

### Auth API Route

Create a folder that lives in the `/pages/api/auth` directory called `login.ts`.

This API route is responsible for:

1. Checking if the user is authenticated with their wallet.
2. Once the authentication is verified, creating a [custom token](https://firebase.google.com/docs/auth/admin/create-custom-tokens#create_custom_tokens_using_the_firebase_admin_sdk)
   for the user to sign in to Firebase with.

```ts title="pages/api/auth/login.ts"
import { NextApiRequest, NextApiResponse } from "next";
import initializeFirebaseServer from "../../../lib/initFirebaseAdmin";
import { getUser } from "../thirdweb-auth/[...thirdweb]";

export default async function login(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUser(req);

  if (!user) return res.status(401).json({ error: "Unauthorized!" });

  // Initialize the Firebase Admin SDK.
  const { auth } = initializeFirebaseServer();

  // Generate a JWT token for the user to be used on the client-side.
  const token = await auth.createCustomToken(user?.address);

  // Send the token to the client-side.
  return res.status(200).json({ token });
}
```

You'll now be able to use Firebase Authentication to authenticate users with their wallets!

### Firestore Rules (Optional)

You'll likely want to add a [security rule](https://firebase.google.com/docs/firestore/security/get-started)
to your Firestore database that only allows users to update their documents.

```cel title="firestore.rules"
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // The wildcard expression {userId} makes the userId variable available in rules.
    match /users/{userId} {
      // Only allow users to update their own documents.
      allow create, update, delete: if request.auth != null && request.auth.uid == userId;
      // But anybody can read their profile.
      allow read;
    }
  }
}
```

### Viewing the Result

When you click the "Sign in with Ethereum" button and successfully sign in, you'll be signed up as a user in Firebase and a new document will be created in your `users` collection in Firestore:

You can now use all the functionality of Firebase Authentication and Firestore to build your app!

## What's Next?

- [Get the current Firebase user](https://github.com/thirdweb-example/firebase-auth/blob/main/lib/useFirebaseUser.ts)
- [Read the current user's document from Firestore](https://github.com/thirdweb-example/firebase-auth/blob/main/lib/useFirebaseUserDocument.ts)
- [Sign out](https://github.com/thirdweb-example/firebase-auth/blob/main/pages/index.tsx#L84-L89)
