import { onAuthStateChanged, User } from "firebase/auth";
import { useEffect, useState } from "react";
import initializeFirebaseClient from "./initFirebase";

// Helpful hook for you to get the currently authenticated user in Firebase.
export default function useFirebaseUser() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const { auth } = initializeFirebaseClient();

  useEffect(() => {
    const listener = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });
    return () => {
      listener();
    };
  }, [auth]);

  return { isLoading, user };
}
