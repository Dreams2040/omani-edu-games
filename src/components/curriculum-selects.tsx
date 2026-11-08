"use client";

import { useState } from "react";
import type { CurriculumUnit } from "@/lib/curriculum";
import { resolveValue, type CurriculumValue } from "@/lib/curriculum-value";

export const selectClass =
  "w-full appearance-none rounded-xl border-2 border-border bg-surface bg-[length:12px] bg-[left_0.9rem_center] bg-no-repeat py-2.5 pe-3.5 ps-9 outline-none transition-colors focus:border-sea disabled:opacity-50";

// Small chevron drawn on the left (the end side in RTL).
const chevron = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%235b6488' stroke-width='2'/%3E%3C/svg%3E\")",
};

function unique<T extends { id: number }>(items: T[]) {
  return [...new Map(items.map((i) => [i.id, i])).values()];
}

/**
 * Cascading grade → subject → unit → lesson selects. Changing a level clears
 * the levels below it. With `allowAll`, each level can be left as "الكل".
 */
export function CurriculumSelects({
  tree,
  value,
  onChange,
  allowAll = false,
  required = false,
}: {
  tree: CurriculumUnit[];
  value: CurriculumValue;
  onChange: (next: CurriculumValue) => void;
  allowAll?: boolean;
  required?: boolean;
}) {
  const grades = unique(tree.map((u) => u.grade)).sort((a, b) => a.number - b.number);
  const subjects = unique(tree.filter((u) => !value.grade || u.grade.id === value.grade).map((u) => u.subject));
  const units = tree.filter((u) => (!value.grade || u.grade.id === value.grade) && (!value.subject || u.subject.id === value.subject));
  const lessons = tree.find((u) => u.id === value.unit)?.lessons ?? [];

  const num = (s: string) => (s ? Number(s) : null);
  const fields = [
    {
      key: "grade",
      label: "الصف",
      all: "كل الصفوف",
      value: value.grade,
      options: grades.map((g) => ({ id: g.id, label: g.name_ar })),
      disabled: false,
      set: (id: number | null) => onChange({ grade: id, subject: null, unit: null, lesson: null }),
    },
    {
      key: "subject",
      label: "المادة",
      all: "كل المواد",
      value: value.subject,
      options: subjects.map((s) => ({ id: s.id, label: s.name_ar })),
      disabled: !allowAll && !value.grade,
      set: (id: number | null) => onChange({ ...value, subject: id, unit: null, lesson: null }),
    },
    {
      key: "unit",
      label: "الوحدة",
      all: "كل الوحدات",
      value: value.unit,
      options: units.map((u) => ({ id: u.id, label: u.title_ar })),
      disabled: !allowAll && !value.subject,
      set: (id: number | null) => onChange({ ...value, unit: id, lesson: null }),
    },
    {
      key: "lesson",
      label: "الدرس",
      all: "كل الدروس",
      value: value.lesson,
      options: lessons.map((l) => ({ id: l.id, label: l.title_ar })),
      disabled: !value.unit,
      set: (id: number | null) => onChange({ ...value, lesson: id }),
    },
  ];

  return (
    <>
      {fields.map((f) => (
        <label key={f.key} className="block min-w-0">
          <span className="mb-1.5 block text-sm font-semibold">{f.label}</span>
          <select
            className={selectClass}
            style={chevron}
            value={f.value ?? ""}
            disabled={f.disabled}
            required={required}
            onChange={(e) => f.set(num(e.target.value))}
          >
            <option value="">{allowAll ? f.all : `اختر ${f.label}`}</option>
            {f.options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      ))}
    </>
  );
}

/** Form field: pick one lesson; submits `lesson_id`. */
export function LessonPicker({ tree, defaultLessonId }: { tree: CurriculumUnit[]; defaultLessonId?: number | null }) {
  const [value, setValue] = useState<CurriculumValue>(() => {
    const resolved = resolveValue(tree, { lesson: defaultLessonId ?? null });
    // With a single grade and subject, choose them up front.
    const grades = unique(tree.map((u) => u.grade));
    const subjects = unique(tree.map((u) => u.subject));
    return {
      ...resolved,
      grade: resolved.grade ?? (grades.length === 1 ? grades[0].id : null),
      subject: resolved.subject ?? (subjects.length === 1 ? subjects[0].id : null),
    };
  });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <CurriculumSelects tree={tree} value={value} onChange={setValue} required />
      <input type="hidden" name="lesson_id" value={value.lesson ?? ""} />
    </div>
  );
}
