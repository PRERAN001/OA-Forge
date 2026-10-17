"use client"; // needed if you're on the Next.js App Router

import { useEffect, useState } from "react";

type Props = {
  /** Unique id per announcement. Change it when you post a new one so it shows again. */
  id: string;
  message: string;
  /** Optional link, e.g. "/changelog" */
  href?: string;
  linkText?: string;
  /** Let users close the bar (remembered in localStorage). Default: true */
  dismissible?: boolean;
};

export default function AnnouncementBar({
  id,
  message,
  href,
  linkText = "Learn more",
  dismissible = true,
}: Props) {
  const storageKey = `announcement-dismissed:${id}`;
  // Start hidden, decide after mount. This avoids a server/client hydration mismatch.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(storageKey) !== "1");
    } catch {
      setVisible(true); // storage blocked (private mode etc.), just show it
    }
  }, [storageKey]);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      /* ignore */
    }
  };

  if (!visible) return null;

  return (
    <div
      role="status"
      className="relative flex items-center justify-center gap-3 bg-[#ffa116] px-10 py-2 text-center text-sm font-medium text-black"
    >
      <p className="leading-snug">
        {message}
        {href && (
          <>
            {" "}
            <a
              href={href}
              className="font-semibold underline underline-offset-2 hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
            >
              {linkText}
            </a>
          </>
        )}
      </p>

      {dismissible && (
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md hover:bg-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-black"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}