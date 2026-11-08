import Link from "next/link";
import { signOut } from "@/app/login/actions";
import { SiteHeader } from "./site-header";

const LINKS = [
  { href: "/dashboard", label: "دروسي" },
  { href: "/library", label: "مكتبة الأسئلة" },
] as const;

export function TeacherHeader({ current }: { current?: (typeof LINKS)[number]["href"] }) {
  return (
    <SiteHeader compactBrand>
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={current === l.href ? "page" : undefined}
          className="whitespace-nowrap rounded-full px-3 py-2 font-semibold text-muted transition-colors hover:bg-indigo-soft hover:text-foreground aria-[current=page]:bg-sea-soft aria-[current=page]:text-sea-deep sm:px-4"
        >
          {l.label}
        </Link>
      ))}
      <form action={signOut}>
        <button
          type="submit"
          className="whitespace-nowrap rounded-full px-3 py-2 font-semibold text-muted transition-colors hover:bg-indigo-soft hover:text-foreground sm:px-4"
        >
          خروج
        </button>
      </form>
    </SiteHeader>
  );
}
