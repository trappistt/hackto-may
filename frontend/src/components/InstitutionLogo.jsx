import { cn } from "@/lib/utils";

export default function InstitutionLogo({
  src,
  alt,
  className,
  imgClassName,
  fallback = null
}) {
  if (!src) return fallback;

  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-lg bg-white p-1",
        className
      )}
    >
      <img
        src={src}
        alt={alt}
        className={cn("max-h-full max-w-full object-contain", imgClassName)}
        loading="lazy"
      />
    </div>
  );
}
