"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ProfileState = { error?: string; saved?: boolean };

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");

  const fullName = String(formData.get("full_name") ?? "").trim().slice(0, 120);
  const school = String(formData.get("school") ?? "").trim().slice(0, 160);

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName || null, school: school || null })
    .eq("id", userId);

  if (error) return { error: "تعذّر حفظ الملف الشخصي. حاول مرة أخرى." };

  revalidatePath("/dashboard");
  return { saved: true };
}
