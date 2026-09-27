import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect, useRef } from "react";

export function useAuth() {
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.currentUser);
  const { signIn, signOut } = useAuthActions();

  // Fire-and-forget profile bootstrap: the FIRST authenticated render after
  // sign-in creates the hunter profile. Mutations also self-bootstrap
  // server-side (profileService.requireProfile), so this is a UI-liveness
  // backstop — it guarantees /profile shows data immediately.
  const ensureProfile = useMutation(api.users.ensureMyProfile);
  const ensured = useRef(false);
  useEffect(() => {
    if (isAuthenticated && !ensured.current) {
      ensured.current = true;
      void ensureProfile({}).catch(() => {
        ensured.current = false; // allow retry on next mount/error
      });
    }
    if (!isAuthenticated) ensured.current = false;
  }, [isAuthenticated, ensureProfile]);

  // Derive isLoading directly from the dependencies instead of managing separate state
  const isLoading = isAuthLoading || user === undefined;

  return {
    isLoading,
    isAuthenticated,
    user,
    signIn,
    signOut,
  };
}
