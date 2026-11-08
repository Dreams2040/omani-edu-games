import Link from "next/link";
import type { ReactNode } from "react";

export function SiteHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="bg-surface border-b border-border">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span aria-hidden className="inline-block h-8 w-8 rounded-lg bg-green-600 text-white grid place-items-center">
            ⛵
          </span>
          ألعاب الصف العُماني
        </Link>
        <nav className="flex items-center gap-2">{children}</nav>
      </div>
      <div className="door-band" />
    </header>
  );
}
