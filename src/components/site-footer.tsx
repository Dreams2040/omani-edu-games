import Link from "next/link";

const LINKS = [
  { href: "/privacy", label: "سياسة الخصوصية" },
  { href: "/student-privacy", label: "خصوصية الطلاب" },
  { href: "/terms", label: "شروط الاستخدام" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-6 text-sm text-muted sm:px-6">
        <span>ألعاب تعليمية بهوية عُمانية. لا نجمع أي بيانات شخصية عن الطلاب.</span>
        <nav aria-label="روابط الموقع" className="flex flex-wrap gap-x-5 gap-y-2">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="font-semibold hover:text-foreground hover:underline">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
