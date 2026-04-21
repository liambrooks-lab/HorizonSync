import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type BrandAssetProps = {
  className?: string;
  href?: string;
  priority?: boolean;
};

function wrapWithLink(
  content: ReactNode,
  href: string | undefined,
  className?: string,
) {
  if (!href) {
    return content;
  }

  return (
    <Link className={className} href={href}>
      {content}
    </Link>
  );
}

export function BrandLogo({ className, href, priority = false }: BrandAssetProps) {
  const content = (
    <span
      className={cn(
        "inline-flex overflow-hidden rounded-[22px] border border-white/10 bg-white/95 shadow-[0_18px_48px_-24px_rgba(114,78,255,0.7)]",
        className,
      )}
    >
      <Image
        alt="HorizonSync logo"
        className="h-full w-full object-cover"
        height={659}
        priority={priority}
        src="/branding/horizonsync-logo.jpg"
        width={770}
      />
    </span>
  );

  return wrapWithLink(content, href, "inline-flex");
}

export function BrandWordmark({ className, href, priority = false }: BrandAssetProps) {
  const content = (
    <span className={cn("inline-flex", className)}>
      <Image
        alt="HorizonSync wordmark"
        className="h-auto w-full object-contain"
        height={210}
        priority={priority}
        src="/branding/horizonsync-banner.jpg"
        width={989}
      />
    </span>
  );

  return wrapWithLink(content, href, "inline-flex");
}

type BrandSignatureProps = {
  className?: string;
  href?: string;
  priority?: boolean;
  orientation?: "horizontal" | "stacked";
  showLabel?: boolean;
};

export function BrandSignature({
  className,
  href,
  orientation = "horizontal",
  priority = false,
  showLabel = true,
}: BrandSignatureProps) {
  const isHorizontal = orientation === "horizontal";

  const content = (
    <span
      className={cn(
        "inline-flex items-center",
        isHorizontal ? "gap-3" : "flex-col gap-3",
        className,
      )}
    >
      <BrandLogo className="h-12 w-12 rounded-[18px]" priority={priority} />
      {showLabel ? (
        <BrandWordmark
          className={cn(isHorizontal ? "w-[168px]" : "w-[220px]")}
          priority={priority}
        />
      ) : null}
    </span>
  );

  return wrapWithLink(content, href, "inline-flex");
}
