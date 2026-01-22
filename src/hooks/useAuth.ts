import { useEffect, useMemo, useState } from "react";
import { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { signInWithEmail, signOut } from "@/lib/firebase/auth";

type AuthState = {
  user: User | null;
  loading: boolean;
  error?: string;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuth = (): AuthState => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const value = useMemo<AuthState>(() => {
    return {
      user,
      loading,
      error,
      signIn: async (email: string, password: string) => {
        setError(undefined);
        setLoading(true);
        try {
          await signInWithEmail(email, password);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Unable to sign in");
          throw err;
        } finally {
          setLoading(false);
        }
      },
      signOut: async () => {
        await signOut();
      },
    };
  }, [error, loading, user]);

  return value;
};
