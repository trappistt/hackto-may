import { useEffect } from "react";
import { FetchingIllustration } from "../illustrations.jsx";
import { fetchingHeading, fetchingSubheading } from "../toneCopy.js";

export default function FetchingScreen({ tone = "friend", onFetch, error }) {
  useEffect(() => {
    onFetch();
  }, [onFetch]);

  return (
    <div className="flex flex-1 flex-col items-center px-1 pb-8 pt-4 text-center sm:px-2">
      <h1 className="font-display text-2xl font-semibold text-charcoal sm:text-3xl">
        {fetchingHeading(tone)}
      </h1>
      <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {fetchingSubheading(tone)}
      </p>
      <div className="my-8 w-full max-w-xs sm:max-w-sm">
        <FetchingIllustration className="max-h-44" />
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
