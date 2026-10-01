import Image from "next/image";

import fullLogo from "@/assets/brand/dray-world-logo.png";
import emblem from "@/assets/brand/dray-world-mark.png";
import globeIcon from "@/assets/brand/dray-world-icon.png";
import { cn } from "@/lib/utils";

// Official DRAY-WORLD logo (supplied by the client). Generated documents still use the
// logo uploaded in Settings.

/** Square globe tile — small UI spots (dashboard sidebar, login). */
export function BrandMark({ className }: { className?: string }) {
  return (
    <Image
      src={globeIcon}
      alt=""
      aria-hidden="true"
      className={cn("size-8 shrink-0 rounded-md bg-white object-contain", className)}
    />
  );
}

/** Emblem only (globe, plane, ship, truck) — wide; used beside the company name. */
export function BrandEmblem({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src={emblem}
      alt=""
      aria-hidden="true"
      priority={priority}
      sizes="160px"
      className={cn("h-10 w-auto shrink-0", className)}
    />
  );
}

/** Full logo with the "Drayworld Logistics Inc." wordmark. Needs a light background. */
export function BrandLogo({
  className,
  priority,
  sizes = "320px",
}: {
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <Image
      src={fullLogo}
      alt="DRAY-WORLD Logistics Inc."
      priority={priority}
      sizes={sizes}
      className={cn("h-auto w-full", className)}
    />
  );
}

/**
 * Company name set as a two-line wordmark, like the logo: the first word large in the
 * display face, the rest small and letter-spaced. Reads the name it is given (database).
 */
export function BrandWordmark({
  name,
  inverted = false,
  className,
}: {
  name: string;
  inverted?: boolean;
  className?: string;
}) {
  const [first, ...rest] = name.trim().split(/\s+/);
  return (
    <span className={cn("block leading-none", className)}>
      <span
        className={cn(
          "block font-display text-[1.45rem] leading-[0.95] font-bold tracking-[0.01em] uppercase",
          inverted ? "text-white" : "text-brand-navy",
        )}
      >
        {first}
      </span>
      {rest.length ? (
        <span
          className={cn(
            "mt-1 block text-[0.62rem] font-semibold tracking-[0.34em] uppercase",
            inverted ? "text-brand-cyan" : "text-brand-blue",
          )}
        >
          {rest.join(" ")}
        </span>
      ) : null}
    </span>
  );
}

export function BrandLockup({
  name,
  tagline,
  className,
  inverted = false,
  emblem: showEmblem = false,
  textClassName,
}: {
  name: string;
  tagline?: string;
  className?: string;
  inverted?: boolean;
  /** Use the wide emblem instead of the square tile (light backgrounds only). */
  emblem?: boolean;
  textClassName?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {showEmblem ? (
        <BrandEmblem priority />
      ) : (
        <BrandMark className={inverted ? "ring-1 ring-white/15" : undefined} />
      )}
      <div className={cn("min-w-0 leading-tight", textClassName)}>
        <div
          className={cn(
            "text-sm leading-tight font-bold tracking-tight",
            inverted ? "text-white" : "text-brand-navy",
          )}
        >
          {name}
        </div>
        {tagline ? (
          <div
            className={cn(
              "truncate text-[11px]",
              inverted
                ? "text-white/60"
                : showEmblem
                  ? "font-medium text-brand-blue"
                  : "text-muted-foreground",
            )}
          >
            {tagline}
          </div>
        ) : null}
      </div>
    </div>
  );
}
