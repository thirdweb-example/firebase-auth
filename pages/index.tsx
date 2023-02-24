import { ConnectWallet, useAddress, useAuth } from "@thirdweb-dev/react";
import { signInWithCustomToken, signOut } from "firebase/auth";
import React from "react";
import initializeFirebaseClient from "../lib/initFirebase";
import { getDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";
import styles from "../styles/Home.module.css";
import useFirebaseUser from "../lib/useFirebaseUser";
import useFirebaseDocument from "../lib/useFirebaseUserDocument";
import Image from "next/image";

export default function Login() {
  const thirdwebAuth = useAuth();
  const address = useAddress();
  const { auth, db } = initializeFirebaseClient();
  const { user, isLoading: loadingAuth } = useFirebaseUser();
  const { document, isLoading: loadingDocument } = useFirebaseDocument();

  const signIn = async () => {
    // Use the same address as the one specified in _app.tsx.
    const payload = await thirdwebAuth?.login();

    try {
      // Make a request to the API with the payload.
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ payload }),
      });

      // Get the returned JWT token to use it to sign in with
      const { token } = await res.json();

      // Sign in with the token.
      const userCredential = await signInWithCustomToken(auth, token);
      // On success, we have access to the user object.
      const user = userCredential.user;

      // If this is a new user, we create a new document in the database.
      const usersRef = doc(db, "users", user.uid!);
      const userDoc = await getDoc(usersRef);

      if (!userDoc.exists()) {
        // User now has permission to update their own document outlined in the Firestore rules.
        setDoc(usersRef, { createdAt: serverTimestamp() }, { merge: true });
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className={styles.container}>
      <div>
        <div className={styles.iconContainer}>
          <Image
            className={styles.icon}
            src="/thirdweb.png"
            alt="thirdweb icon"
            width={100}
            height={100}
          />
          <Image
            className={styles.icon}
            src="/firebase.png"
            alt="firebase icon"
            width={100}
            height={100}
          />
        </div>

        <h1 className={styles.h1}>thirdweb + Firebase</h1>

        <p className={styles.explain}>
          By clicking the button below, you authenticate with your wallet.
        </p>
        <p className={styles.explain}>
          You will have a user created for you in Firebase Auth and a document
          created for you in Firestore.
        </p>

        {address ? (
          <div>
            {!user ? (
              <button onClick={() => signIn()} className={styles.mainButton}>
                Sign in with Wallet
              </button>
            ) : (
              <button
                onClick={() => signOut(auth)}
                className={styles.mainButton}
              >
                Sign Out
              </button>
            )}

            <hr className={styles.divider} />

            <h2>Current Firebase Information</h2>

            <p>
              <b>User ID: </b>
              {loadingAuth ? "Loading..." : user?.uid || "Not logged in"}
            </p>

            <p>
              <b>Document ID: </b>
              {loadingDocument ? "Loading..." : document?.id || "No document"}
            </p>
          </div>
        ) : (
          <ConnectWallet className={styles.connectBtn} />
        )}
      </div>
    </div>
  );
}
