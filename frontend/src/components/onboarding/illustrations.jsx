/** Simple line-art illustrations matching onboarding mockups */

export function ToneIllustration({ tone }) {
  if (tone === "mom") {
    return (
      <svg viewBox="0 0 120 100" className="h-24 w-28 text-charcoal" aria-hidden>
        <circle cx="60" cy="28" r="14" fill="none" stroke="currentColor" strokeWidth="2" />
        <path
          d="M40 52 Q60 42 80 52 L75 88 Q60 78 45 88 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="48" cy="62" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  if (tone === "dad") {
    return (
      <svg viewBox="0 0 120 100" className="h-24 w-28 text-charcoal" aria-hidden>
        <circle cx="55" cy="26" r="13" fill="none" stroke="currentColor" strokeWidth="2" />
        <path
          d="M38 48 Q55 40 72 48 L68 85 Q55 76 42 85 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="72" cy="58" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M68 65 L78 72" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 120 100" className="h-24 w-28 text-charcoal" aria-hidden>
      <circle cx="42" cy="30" r="12" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="78" cy="34" r="12" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M30 55 Q60 72 90 55"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FetchingIllustration() {
  return (
    <svg viewBox="0 0 140 80" className="mx-auto h-20 w-36 text-charcoal" aria-hidden>
      <ellipse cx="70" cy="68" rx="40" ry="6" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <path
        d="M25 50 Q45 30 65 48 T105 42"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="105" cy="42" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M98 40 L88 36 M102 48 L94 54" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
