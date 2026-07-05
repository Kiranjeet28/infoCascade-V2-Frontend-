import { useEffect, useState } from "react";

/**
 * Client-side single-submission lock.
 *
 * NOTE: This is a UX deterrent only — a determined attacker can clear
 * localStorage or hit the backend directly. Real brute-force / DoS
 * protection must be enforced server-side (IP rate limit, captcha, WAF).
 */
export function useSubmissionLock(key: string) {
  const storageKey = `submitted:${key}`;
  const [submittedAt, setSubmittedAt] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setSubmittedAt(Number(raw) || Date.now());
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  function markSubmitted() {
    const now = Date.now();
    try {
      localStorage.setItem(storageKey, String(now));
    } catch {
      /* ignore */
    }
    setSubmittedAt(now);
  }

  return { alreadySubmitted: submittedAt !== null, submittedAt, markSubmitted };
}
