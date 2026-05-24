import { cn } from "@/lib/utils";

/** Line-art PNGs from onboarding mockups — served from /public/onboarding */
export const ONBOARDING_ART = {
  opener: "/onboarding/child-in-boat.png",
  lifeStory: "/onboarding/boy-and-dog.png",
  fetching: "/onboarding/dog-fetching.png"
};

export function OnboardingArt({ src, alt = "", className }) {
  return (
    <img
      src={src}
      alt={alt}
      className={cn("mx-auto w-full max-w-[min(100%,280px)] object-contain", className)}
      aria-hidden={!alt}
      loading="lazy"
      decoding="async"
    />
  );
}

export function OpenerIllustration({ className }) {
  return <OnboardingArt src={ONBOARDING_ART.opener} className={className} />;
}

export function LifeStoryIllustration({ className }) {
  return <OnboardingArt src={ONBOARDING_ART.lifeStory} className={className} />;
}

export function FetchingIllustration({ className }) {
  return <OnboardingArt src={ONBOARDING_ART.fetching} className={className} />;
}

import { Compass, HeartHandshake, Users } from "lucide-react";

/** Icon per coach tone — used as avatars on the tone-picker options. */
const TONE_ICON = {
  friend: Users,
  mom: HeartHandshake,
  dad: Compass
};

export function ToneAvatar({ tone, selected = false, className }) {
  const Icon = TONE_ICON[tone] ?? Users;
  return (
    <div
      className={cn(
        "flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors",
        selected
          ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
          : "bg-mist-100 text-mist-700 ring-1 ring-mist-200",
        className
      )}
      aria-hidden
    >
      <Icon className="h-6 w-6" strokeWidth={1.75} />
    </div>
  );
}

/** Larger badge used when we need a single illustration for the selected tone. */
export function ToneIllustration({ tone }) {
  const Icon = TONE_ICON[tone] ?? Users;
  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
      <Icon className="h-9 w-9 text-primary" strokeWidth={1.5} />
    </div>
  );
}
