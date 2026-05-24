import { cn } from "@/lib/utils";
import Logo from "@/components/Logo.jsx";

export function SiteHeader({ subtitle, actions, logoSize = "lg" }) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <Logo size={logoSize} />
        {subtitle && (
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export default function AppShell({ children, className, narrow }) {
  return (
    <div className="min-h-screen bg-background">
      <div
        className={cn(
          "mx-auto w-full px-4 py-6 sm:px-6 lg:py-8",
          narrow ? "max-w-lg lg:max-w-2xl" : "max-w-6xl",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
