import Link from "next/link";
import { Slot } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Brand } from "./brand";

export function PillNav({ children, className, brandHref = "/" }: { children?: ReactNode; className?: string; brandHref?: string }) {
  return (
    <nav
      aria-label="Primary"
      className={cn(
        "glass fixed top-4 left-1/2 z-30 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-1 rounded-full p-1 ring-1 ring-foreground/10",
        className,
      )}
    >
      <Link href={brandHref} className="rounded-full py-1 pr-3 pl-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <Brand compact />
      </Link>
      {children}
    </nav>
  );
}

export function PillLink({
  active,
  asChild,
  className,
  ...props
}: ComponentProps<"button"> & { active?: boolean; asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-active={active || undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-active:bg-accent data-active:text-foreground",
        className,
      )}
      {...props}
    />
  );
}
