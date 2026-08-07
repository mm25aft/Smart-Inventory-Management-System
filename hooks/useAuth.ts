"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";

import { clearAuthCookies, syncAuthCookies } from "@/lib/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { getCurrentUserProfile } from "@/lib/firestore";
import { useAuthStore } from "@/store/authStore";

export function useAuth() {
  const { user, loading, initialized, error, setError, setInitialized, setLoading, setUser } =
    useAuthStore();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const init = async () => {
      try {
        const auth = await getFirebaseAuth();
        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (!firebaseUser) {
            setUser(null);
            setLoading(false);
            setInitialized(true);
            clearAuthCookies();
            return;
          }

          const profile = await getCurrentUserProfile(firebaseUser.uid);
          if (!profile || !profile.isActive) {
            setUser(null);
            clearAuthCookies();
          } else {
            setUser(profile);
            syncAuthCookies(profile);
          }

          setLoading(false);
          setInitialized(true);
        });
      } catch (caughtError) {
        const message =
          caughtError instanceof Error ? caughtError.message : "Authentication initialization failed.";
        setError(message);
        setLoading(false);
        setInitialized(true);
      }
    };

    void init();

    return () => {
      unsubscribe?.();
    };
  }, [setError, setInitialized, setLoading, setUser]);

  return {
    user,
    loading,
    initialized,
    error,
  };
}
