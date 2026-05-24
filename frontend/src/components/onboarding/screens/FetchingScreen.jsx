import { useEffect } from "react";
import { FetchingIllustration } from "../illustrations.jsx";

export default function FetchingScreen({ onFetch, error }) {
  useEffect(() => {
    onFetch();
  }, [onFetch]);

  return (
    <div className="flex flex-1 flex-col items-center px-1 pb-8 pt-4 text-center sm:px-2">
      <h1 className="font-display text-2xl font-semibold text-charcoal sm:text-3xl">
        Fetching your bank and credit info…
      </h1>
      <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
        While you wait, think about why you&apos;re here and what a path forward could look
        like. We&apos;ll surface your interest black holes in a moment.
      </p>
      <div className="my-10">
        <FetchingIllustration />
      </div>
      <div className="flex gap-1.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 animate-pulse rounded-full bg-primary"
            style={{ animationDelay: `${i * 200}ms` }}
          />
        ))}
      </div>
      {error && (
        <p className="mt-6 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
