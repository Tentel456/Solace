import { Lecture, Segment } from "./types";

const synonyms: Record<string, string[]> = {
  "теорема пифагора": ["гипотенуза", "катет", "прямоугольный треугольник", "a²+b²=c²", "квадрат стороны"],
  "гипотенуза": ["самая длинная сторона", "напротив прямого угла", "катет", "пифагор"],
  "применение": ["строительство", "навигация", "расстояние", "диагональ", "компьютерная графика"],
  "доказательство": ["площадь", "квадрат", "треугольник", "равенство"],
  "ошибка": ["нельзя", "путать", "квадратный корень", "типичные ошибки"],
  "прямоугольный треугольник": ["прямой угол", "катет", "гипотенуза"]
};
function normalize(s: string) {
  return s.toLocaleLowerCase("ru").replace(/[^\p{L}\p{N}²]+/gu, " ").trim();
}
export function searchLecture(lecture: Lecture, query: string) {
  const q = normalize(query);
  if (!q) return [];
  const terms = q.split(/\s+/).filter(t => t.length > 1);
  const expanded = new Set(terms);
  for (const [key, values] of Object.entries(synonyms)) {
    if (q.includes(normalize(key)) || values.some(v => q.includes(normalize(v)))) {
      normalize(key).split(" ").forEach(t => expanded.add(t));
      values.forEach(v => normalize(v).split(" ").forEach(t => expanded.add(t)));
    }
  }
  const scored = lecture.transcript.map((s: Segment) => {
    const text = normalize(s.text);
    let score = 0;
    for (const term of terms) {
      if (text.includes(term)) score += 3 + Math.min(term.length / 8, 1);
    }
    for (const term of expanded) if (!terms.includes(term) && text.includes(term)) score += 0.8;
    const phrase = q.length > 5 && text.includes(q);
    if (phrase) score += 5;
    // A light semantic fallback: token overlap normalized by query size.
    score = score / Math.max(terms.length, 1);
    return { ...s, score: Number(score.toFixed(3)) };
  }).filter(s => s.score > 0).sort((a, b) => b.score - a.score);
  return scored.slice(0, 8);
}
