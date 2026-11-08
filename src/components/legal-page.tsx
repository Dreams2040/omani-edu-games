import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

export const LAST_UPDATED = "8 نوفمبر 2026";

export function LegalPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <>
      <SiteHeader>
        <Link href="/login" className="whitespace-nowrap rounded-full bg-sea px-5 py-2 font-semibold text-white transition-colors hover:bg-sea-deep">
          دخول المعلم
        </Link>
      </SiteHeader>
      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <p className="text-sm text-muted">آخر تحديث: {LAST_UPDATED}</p>
          <h1 className="mt-2 text-4xl font-bold">{title}</h1>
          <p className="mt-4 text-lg text-muted">{intro}</p>
          <div className="legal mt-10 space-y-8">{children}</div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-2xl font-bold">{title}</h2>
      <div className="space-y-3 text-lg leading-loose [&_li]:ms-6 [&_li]:list-disc [&_ul]:space-y-2">{children}</div>
    </section>
  );
}
