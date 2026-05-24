import { cn } from "@/lib/utils";

const SIZES = {
  sm: "h-7",
  md: "h-9",
  lg: "h-12",
  xl: "h-16"
};

export default function Logo({ size = "md", className, ...props }) {
  return (
    <img
      src="/moneytor-logo.png"
      alt="Moneytor"
      className={cn("w-auto max-w-full object-contain object-left", SIZES[size], className)}
      {...props}
    />
  );
}
