/**
 * 유닉스 타임스탬프 변환기 프랑스어판(/fr/tools/unix-time/) 표기 — 계산은 lib/unix-time.ts 그대로, 말만 프랑스어.
 *
 *   lun. 19 octobre 2026, 03:34:56 · dans 3 jours 4 heures · il y a 12 secondes · maintenant
 *
 * 날짜는 Parts(이미 시간대를 적용한 값)를 UTC 자정으로 다시 세워 Intl fr-FR 로 쓴다(timeZone "UTC" 필수 —
 * 없으면 서쪽 시간대 방문자에게 하루 앞 날짜가 보인다). 시각은 24시간 'HH:MM:SS', 밀리초가 있으면 ',789'(소수 쉼표).
 * 지금과의 차이는 relativeTextEn 과 같은 규칙으로 끊는다(하루 넘으면 초 빼고, 100일 넘으면 분도 뺌).
 */
import type { Parts } from "../unix-time";
import { pluralFr } from "./date-format";

const p2 = (n: number) => String(n).padStart(2, "0");
const p3 = (n: number) => String(n).padStart(3, "0");

/** 'lun. 19 octobre 2026, 03:34:56' — 밀리초가 0이 아니면 ',789' */
export function frText(p: Parts): string {
  const date = new Date(Date.UTC(p.y, p.mo - 1, p.d)).toLocaleDateString("fr-FR", {
    timeZone: "UTC",
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const frac = p.ms ? `,${p3(p.ms)}` : "";
  return `${date}, ${p2(p.h)}:${p2(p.mi)}:${p2(p.s)}${frac}`;
}

/** 'dans 3 jours 4 heures 5 minutes' · 'il y a 12 secondes' · 1초 안이면 'maintenant'. 0·1 단수 */
export function relativeTextFr(diffMs: number): string {
  const a = Math.abs(diffMs);
  if (a < 1000) return "maintenant";
  let sec = Math.floor(a / 1000);
  const d = Math.floor(sec / 86_400);
  sec -= d * 86_400;
  const h = Math.floor(sec / 3600);
  const mi = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const parts: string[] = [];
  if (d) parts.push(pluralFr(d, "jour"));
  if (h) parts.push(pluralFr(h, "heure"));
  if (mi && d < 100) parts.push(pluralFr(mi, "minute"));
  if (!d && !h && (s || !mi)) parts.push(pluralFr(s, "seconde"));
  const body = parts.join(" ");
  return diffMs < 0 ? `il y a ${body}` : `dans ${body}`;
}
