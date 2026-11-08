import "server-only";
import { createClient } from "@/lib/supabase/server";

export type CurriculumUnit = {
  id: number;
  title_ar: string;
  semester: number;
  grade: { id: number; number: number; name_ar: string };
  subject: { id: number; name_ar: string };
  lessons: { id: number; title_ar: string }[];
};

// The whole curriculum tree, small enough to send to the browser for the
// cascading grade → subject → unit → lesson pickers.
export async function getCurriculum(): Promise<CurriculumUnit[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("units")
    .select("id, title_ar, semester, position, grade:grades!inner(id, number, name_ar), subject:subjects!inner(id, name_ar), lessons(id, title_ar, position)")
    .order("semester")
    .order("position")
    .order("position", { referencedTable: "lessons" });

  return (data ?? [])
    .map((u) => ({
      id: u.id,
      title_ar: u.title_ar,
      semester: u.semester,
      grade: u.grade,
      subject: u.subject,
      lessons: u.lessons.map((l) => ({ id: l.id, title_ar: l.title_ar })),
    }))
    .sort((a, b) => a.grade.number - b.grade.number);
}
