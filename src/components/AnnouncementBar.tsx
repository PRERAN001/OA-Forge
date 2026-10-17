"use client";

import { useState } from "react";

type Props = {
  message: string;
  /** Optional link, e.g. "/changelog" */
  href?: string;
  linkText?: string;
  /** Let users close the bar for the current page view. Default: true */
  dismissible?: boolean;
};

export default function AnnouncementBar({
  message,
  href,
  linkText = "Learn more",
  dismissible = true,
}: Props) {
  const [visible, setVisible] = useState(true);

  const dismiss = () => {
    setVisible(false);
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