"use client";

export function DeleteSetButton({ action }: { action: () => Promise<void> }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("حذف المجموعة وكل أسئلتها؟ لا يمكن التراجع عن الحذف.")) e.preventDefault();
      }}
    >
      <button type="submit" className="rounded-full px-5 py-2.5 font-semibold text-pomegranate-deep ring-1 ring-pomegranate/40 transition-colors hover:bg-pomegranate-soft">
        حذف المجموعة
      </button>
    </form>
  );
}
