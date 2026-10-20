/**
 * 유닉스 타임스탬프 변환기 스페인판(/es/tools/unix-time/) 표기 — 계산은 lib/unix-time.ts 그대로, 말만 스페인어.
 *
 *   lunes, 19 de octubre de 2026, 03:34:56 · dentro de 3 días, 4 horas y 5 minutos · hace 12 segundos · ahora
 *
 * 날짜는 Parts(이미 시간대를 적용한 값)에서 요일·월 이름을 손으로 붙인다(date-format.ts 와 같은 이유 — Intl 약어·쉼표가
 * ICU 판마다 다를 수 있음). 시각은 24시간 'HH:MM:SS', 밀리초가 있으면 ',789'(소수 쉼표 — RD 2032/2009 Anexo III 2.8).
 * 지금과의 차이는 relativeTextEn 과 같은 규칙으로 끊는다(하루 넘으면 초 빼고, 100일 넘으면 분도 뺌).
 */
import type { Parts } from "../unix-time";
import { WEEKDAYS_ES, MONTHS_ES, pluralEs } from "./date-format";

const p2 = (n: number) => String(n).padStart(2, "0");
const p3 = (n: number) => String(n).padStart(3, "0");

/** 'lunes, 19 de octubre de 2026, 03:34:56' — 밀리초가 0이 아니면 ',789' */
export function esText(p: Parts): string {
  const frac = p.ms ? `,${p3(p.ms)}` : "";
  return `${WEEKDAYS_ES[p.wd]}, ${p.d} de ${MONTHS_ES[p.mo - 1]} de ${p.y}, ${p2(p.h)}:${p2(p.mi)}:${p2(p.s)}${frac}`;
}

/** 'dentro de 3 días, 4 horas y 5 minutos' · 'hace 12 segundos' · 1초 안이면 'ahora'. 1만 단수 */
export function relativeTextEs(diffMs: number): string {
  const a = Math.abs(diffMs);
  if (a < 1000) return "ahora";
  let sec = Math.floor(a / 1000);
  const d = Math.floor(sec / 86_400);
  sec -= d * 86_400;
  const h = Math.floor(sec / 3600);
  const mi = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const parts: string[] = [];
  if (d) parts.push(pluralEs(d, "día", "días"));
  if (h) parts.push(pluralEs(h, "hora", "horas"));
  if (mi && d < 100) parts.push(pluralEs(mi, "minuto", "minutos"));
  if (!d && !h && (s || !mi)) parts.push(pluralEs(s, "segundo", "segundos"));
  const body = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} y ${parts[parts.length - 1]}` : parts[0];
  return diffMs < 0 ? `hace ${body}` : `dentro de ${body}`;
}
