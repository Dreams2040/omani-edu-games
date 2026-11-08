// Arabic count phrases: "سؤال واحد"، "سؤالان"، "5 أسئلة"، "12 سؤالاً".
export function arabicCount(n: number, one: string, two: string, few: string, many: string, none = `لا ${few}`) {
  if (n === 0) return none;
  if (n === 1) return one;
  if (n === 2) return two;
  if (n <= 10) return `${n} ${few}`;
  return `${n} ${many}`;
}

export const questionCount = (n: number) => arabicCount(n, "سؤال واحد", "سؤالان", "أسئلة", "سؤالاً", "لا أسئلة بعد");
export const setCount = (n: number) => arabicCount(n, "مجموعة واحدة", "مجموعتان", "مجموعات", "مجموعة");
export const lessonCount = (n: number) => arabicCount(n, "درس واحد", "درسان", "دروس", "درساً");
