/**
 * 유닉스 타임스탬프 변환 독일어판(/de/tools/unix-time/) 표기 — 계산은 lib/unix-time.ts 그대로, 말만 독일어.
 *
 *   Montag, 19. Oktober 2026, 03:34:56 · 03:34:56,789 · in 3 Tagen 2 Stunden 5 Minuten · vor 4 Sekunden · jetzt
 *
 * 날짜 꼴은 date-format.ts 와 같은 BGB 머리 꼴("vom 2. Januar 2002"), 천 단위는 줄바꿈 없는 공백(intDe),
 * 밀리초 소수점은 쉼표(§ 4 SolzG "5,5 Prozent"). Intl 을 쓰지 않는다.
 * 남은 시간 끊는 규칙은 lib/unix-time.ts 의 relativeText 와 같다(100일 넘으면 분 생략, 하루 미만에서만 초).
 */
import type { Parts } from "../unix-time";
import { WEEKDAYS_DE, MONTHS_DE, intDe } from "./date-format";

const p2 = (n: number) => String(n).padStart(2, "0");
const p3 = (n: number) => String(n).padStart(3, "0");

/** 'Montag, 19. Oktober 2026, 03:34:56' (밀리초가 있으면 '03:34:56,789') */
export function deText(p: Parts): string {
  const frac = p.ms ? `,${p3(p.ms)}` : "";
  return `${WEEKDAYS_DE[p.wd]}, ${p.d}. ${MONTHS_DE[p.mo - 1]} ${p.y}, ${p2(p.h)}:${p2(p.mi)}:${p2(p.s)}${frac}`;
}

/** 여격(in/vor 뒤) — 1이면 단수 */
const FORMS = {
  day: ["Tag", "Tagen"],
  hour: ["Stunde", "Stunden"],
  minute: ["Minute", "Minuten"],
  second: ["Sekunde", "Sekunden"],
} as const;
const unit = (n: number, u: keyof typeof FORMS) => `${intDe(n)} ${FORMS[u][n === 1 ? 0 : 1]}`;

/** 차이(밀리초, 대상 − 지금) → 'in 3 Tagen 2 Stunden' · 'vor 5 Minuten' · 1초 안이면 'jetzt' */
export function relativeTextDe(diffMs: number): string {
  const a = Math.abs(diffMs);
  if (a < 1000) return "jetzt";
  let sec = Math.floor(a / 1000);
  const d = Math.floor(sec / 86_400);
  sec -= d * 86_400;
  const h = Math.floor(sec / 3600);
  const mi = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const parts: string[] = [];
  if (d) parts.push(unit(d, "day"));
  if (h) parts.push(unit(h, "hour"));
  if (mi && d < 100) parts.push(unit(mi, "minute"));
  if (!d && !h && (s || !mi)) parts.push(unit(s, "second"));
  return `${diffMs < 0 ? "vor" : "in"} ${parts.join(" ")}`;
}
