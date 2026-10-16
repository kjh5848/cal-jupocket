/**
 * 계산기 틀의 순수 함수 — 금액 읽어 주기와 구성 비율(설계 3-6). DOM 은 src/scripts/calc-ui.ts.
 */

/** 36000000 → "3,600만원", 120000000 → "1억 2,000만원", 4166666 → "416만 6,666원". 0·음수·NaN → "" */
export function readWon(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "";
  const v = Math.floor(n);
  const eok = Math.floor(v / 1e8);
  const man = Math.floor((v % 1e8) / 1e4);
  const won = v % 1e4;
  const parts: string[] = [];
  if (eok) parts.push(`${eok.toLocaleString("ko-KR")}억`);
  if (man) parts.push(`${man.toLocaleString("ko-KR")}만`);
  if (won && !eok) parts.push(won.toLocaleString("ko-KR"));
  return parts.join(" ") + "원";
}

/** 구성 비율(반올림 %). 음수·NaN 은 0, 합이 0 이면 전부 0 */
export function shares(parts: number[]): number[] {
  const p = parts.map((x) => (Number.isFinite(x) && x > 0 ? x : 0));
  const sum = p.reduce((a, b) => a + b, 0);
  return sum ? p.map((x) => Math.round((x / sum) * 100)) : p.map(() => 0);
}
