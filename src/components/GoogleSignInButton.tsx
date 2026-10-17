
"use client";

<<<<<<< HEAD
import { signIn } from "next-auth/react";
import { resetCreditsInMemory } from "@/lib/userCredits";
=======
import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";
>>>>>>> 5b936cf0f17ea5a32d9a9105b0bb32a03ff2994a

export default function GoogleSignInButton() {
  const { update } = useSession();

  useEffect(() => {
    const handlePopupMessage = async (
      event: MessageEvent<{ type?: string }>
    ) => {
      if (
        event.origin !== window.location.origin ||
        event.data?.type !== "google-sign-in-complete"
      ) {
        return;
      }

      try {
        await update();
      } catch (error) {
        console.error("Failed to refresh the Google sign-in session:", error);
      } finally {
        window.location.reload();
      }
    };

    window.addEventListener("message", handlePopupMessage);
    return () => window.removeEventListener("message", handlePopupMessage);
  }, [update]);

  const handleGoogleSignIn = () => {
    resetCreditsInMemory();
    const width = 500;
    const height = 650;

    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      "/api/auth/signin/google?callbackUrl=" +
        encodeURIComponent(
          `${window.location.origin}/api/auth/google/popup`
        ),
      "roundzero-google-signin",
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    if (!popup) {
      // Popup blocked: fall back to normal sign-in.
      signIn("google");
    }
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      className="flex items-center gap-1.5 rounded-lg border border-[#383838] bg-[#282828] px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:bg-[#383838]"
    >
      Sign In
    </button>
  );
}
