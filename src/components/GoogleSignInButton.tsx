
"use client";

import { signIn } from "next-auth/react";
import { resetCreditsInMemory } from "@/lib/userCredits";

export default function GoogleSignInButton() {
  const handleGoogleSignIn = () => {
    resetCreditsInMemory();
    const width = 500;
    const height = 650;

    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      "/api/auth/signin/google?callbackUrl=" +
        encodeURIComponent(window.location.origin),
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
