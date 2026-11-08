import { LogoMark } from "@/components/logo";
import { JoinForm } from "./join-form";

export const metadata = { title: "ادخل اللعبة" };

export default async function JoinPage({ searchParams }: PageProps<"/join">) {
  const { code } = await searchParams;
  return (
    <main className="flex min-h-screen flex-1 flex-col items-center bg-indigo px-4 py-10 text-white">
      <div className="flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <LogoMark />
          <h1 className="text-4xl font-bold">قافلة اللبان</h1>
          <p className="text-white/80">اكتب الرمز الظاهر على شاشة الصف.</p>
        </div>
        <JoinForm initialCode={typeof code === "string" ? code : ""} />
      </div>
      <p className="mt-8 text-center text-sm text-white/60">لا نحتاج اسمك ولا بريدك. نستخدم لقبك في هذه اللعبة فقط.</p>
    </main>
  );
}
