import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark } from "./logo";

export function SiteHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="font-display text-base font-bold leading-tight sm:text-xl">ألعاب تعليمية بهوية عُمانية</span>
        </Link>
        <nav className="flex items-center gap-2">{children}</nav>
      </div>
    </header>
  );
}
