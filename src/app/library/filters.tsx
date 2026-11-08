"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { CurriculumSelects } from "@/components/curriculum-selects";
import type { CurriculumUnit } from "@/lib/curriculum";
import type { CurriculumValue } from "@/lib/curriculum-value";

export function LibraryFilters({ tree, value, tab }: { tree: CurriculumUnit[]; value: CurriculumValue; tab: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function go(next: CurriculumValue) {
    const params = new URLSearchParams();
    if (tab !== "all") params.set("tab", tab);
    for (const [k, v] of Object.entries(next)) if (v) params.set(k, String(v));
    const qs = params.toString();
    startTransition(() => router.push(qs ? `/library?${qs}` : "/library", { scroll: false }));
  }

  return (
    <div aria-busy={pending} className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${pending ? "opacity-70" : ""}`}>
      <CurriculumSelects tree={tree} value={value} onChange={go} allowAll />
    </div>
  );
}
