import type { CurriculumUnit } from "./curriculum";

export type CurriculumValue = { grade: number | null; subject: number | null; unit: number | null; lesson: number | null };

/** Fill in parents from the chosen lesson or unit, so a deep link shows the full path. */
export function resolveValue(tree: CurriculumUnit[], v: Partial<CurriculumValue>): CurriculumValue {
  const unit =
    (v.lesson && tree.find((u) => u.lessons.some((l) => l.id === v.lesson))) ||
    (v.unit && tree.find((u) => u.id === v.unit)) ||
    null;
  return {
    grade: unit?.grade.id ?? v.grade ?? null,
    subject: unit?.subject.id ?? v.subject ?? null,
    unit: unit?.id ?? null,
    lesson: unit && v.lesson ? v.lesson : null,
  };
}
