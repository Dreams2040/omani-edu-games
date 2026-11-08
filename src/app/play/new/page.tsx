import Link from "next/link";
import { notFound } from "next/navigation";
import { TeacherHeader } from "@/components/teacher-header";
import { questionCount } from "@/lib/arabic";
import { createClient } from "@/lib/supabase/server";
import { StartForm } from "./start-form";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function NewGamePage({ searchParams }: PageProps<"/play/new">) {
  const { set } = await searchParams;
  if (typeof set !== "string" || !UUID.test(set)) notFound();

  const supabase = await createClient();
  const { data } = await supabase
    .from("question_sets")
    .select("id, title, lesson:lessons!inner(title_ar), questions(count)")
    .eq("id", set)
    .maybeSingle();
  if (!data) notFound();

  return (
    <>
      <TeacherHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <Link href={`/sets/${data.id}`} className="text-sm font-semibold text-sea-deep hover:underline">
            العودة إلى المجموعة
          </Link>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">لعبة جديدة</h1>
          <p className="mb-8 mt-1 text-muted">
            {data.title}، درس {data.lesson.title_ar}، {questionCount(data.questions[0]?.count ?? 0)}
          </p>
          <StartForm setId={data.id} />
        </div>
      </main>
    </>
  );
}
