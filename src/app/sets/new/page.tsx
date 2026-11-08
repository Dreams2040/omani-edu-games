import Link from "next/link";
import { TeacherHeader } from "@/components/teacher-header";
import { getCurriculum } from "@/lib/curriculum";
import { createSet } from "../actions";
import { SetForm } from "../set-form";

export default async function NewSetPage({ searchParams }: PageProps<"/sets/new">) {
  const { lesson } = await searchParams;
  const lessonId = Number(lesson);
  const tree = await getCurriculum();

  return (
    <>
      <TeacherHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
          <Link href="/library" className="text-sm font-semibold text-sea-deep hover:underline">
            العودة إلى المكتبة
          </Link>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">مجموعة أسئلة جديدة</h1>
          <p className="mb-8 mt-1 text-muted">اربطها بالدرس، ثم أضف الأسئلة في الخطوة التالية.</p>
          <div className="rounded-3xl bg-surface p-6 ring-1 ring-border sm:p-8">
            <SetForm
              tree={tree}
              action={createSet}
              submitLabel="أنشئ المجموعة"
              initial={{ title: "", description: "", lesson_id: Number.isInteger(lessonId) && lessonId > 0 ? lessonId : null, is_public: false }}
            />
          </div>
        </div>
      </main>
    </>
  );
}
