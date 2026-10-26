/**
 * 손실 원금 복구 계산기 독일어판(/de/tools/loss-recovery/) 표기·읽기 — 계산은 lib/loss-recovery.ts 그대로(산술, 조사표 독일 칸 '같음').
 *
 *   30 % · +42,86 % · 3 000,00 Euro · 2 Jahre und 3 Monate · 날짜별 종가 줄 '01.09.2026; 20,50'
 *
 * 금액 꼴은 lib/de/debt-payoff.ts euroCentDe 와 같다(천 단위 공백·소수 쉼표·'Euro'). 종가 줄은 독일 표기를 읽는다 —
 * 날짜는 31.12.2026 · 31.12. · 2026-12-31, 종가는 줄의 마지막 숫자(1.234,56 · 1234,56 · 1234.56). 줄의 쉼표를 날짜와 가격 사이 구분으로 쓰지 않고 세미콜론·탭·공백으로 가른다.
 * 팔 때 비용(매도 세율·수수료)은 사용자가 넣는 %라 독일 세율은 다루지 않는다.
 */
import { spellMonthsDe } from "./debt-payoff";
import { parseNumberDe } from "../percent";
import type { Close } from "../loss-recovery";

/** 소수 둘째 자리까지·끝 0 지움, 소수 쉼표 — 42.857 → '42,86' */
export function numDe(x: number): string {
  const r = Math.round(x * 100) / 100;
  const [int, frac] = Math.abs(r).toFixed(2).split(".");
  const f = frac.replace(/0+$/, "");
  const grouped = int.replace(/\B(?=(\d{3})+$)/g, " ");
  return `${r < 0 ? "-" : ""}${grouped}${f ? `,${f}` : ""}`;
}

/** '42,86 %' (공백 + %, § 4 SolzG 1995 '5,5 Prozent' 꼴 대신 화면에서는 짧게 %) */
export function pctDe(x: number): string {
  return `${numDe(x)} %`;
}

/** 부호를 붙인 퍼센트 — '+42,86 %' · '−30 %' · '0 %' */
export function signedPctDe(x: number): string {
  const r = Math.round(x * 100) / 100;
  return r > 0 ? `+${pctDe(r)}` : r < 0 ? `−${pctDe(-r)}` : "0 %";
}

/** 유로 금액(센트까지) — 3000 → '3 000,00 Euro', 음수는 '-' */
export function eurDe(x: number): string {
  const c = Math.round(x * 100);
  const abs = Math.abs(c);
  const s = `${String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+$)/g, " ")},${String(abs % 100).padStart(2, "0")} Euro`;
  return c < 0 ? `-${s}` : s;
}

/** 입력칸 유로 → 숫자. '10 000' · '10.000,50' · '10000' → 10000 · 10000.5 · 10000. 못 읽으면 NaN */
export function readEurDe(raw: string): number {
  return parseNumberDe(raw);
}

/** lib/loss-recovery formatMonths 의 독일어 */
export function formatMonthsDe(m: number | null): string {
  if (m === null) return "Wird nicht erreicht";
  if (m === Infinity) return "Über 100 Jahre";
  if (m === 0) return "Bereits erreicht";
  return spellMonthsDe(m);
}

/**
 * 한 줄에 '날짜; 종가' 또는 종가만. 날짜(31.12.2026 · 31.12. · 2026-12-31)는 그대로 두고, 숫자가 없는 줄은 건너뛴다.
 * 종가는 날짜를 뺀 줄의 마지막 숫자. 0 이하는 건너뛴다.
 */
export function parseClosesDe(text: string): Close[] {
  const out: Close[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const dm = line.match(/\d{4}-\d{1,2}-\d{1,2}|\d{1,2}\.\d{1,2}\.(?:\d{2,4})?/);
    const rest = dm ? `${line.slice(0, dm.index)} ${line.slice(dm.index! + dm[0].length)}` : line;
    const nums = rest.match(/\d[\d.]*(?:,\d+)?/g);
    if (!nums) continue;
    const price = parseNumberDe(nums[nums.length - 1].replace(/\.$/, ""));
    if (!(price > 0)) continue;
    out.push({ date: dm ? dm[0] : null, price });
  }
  return out;
}
