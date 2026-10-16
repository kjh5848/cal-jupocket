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

/** 구성 비율(정수 %, 합은 늘 100). 내림한 뒤 모자란 만큼 나머지가 큰 쪽부터 1씩 — 각각 반올림하면 9.5/90.5 가 10+91=101 이 된다. 음수·NaN 은 0, 합이 0 이면 전부 0 */
export function shares(parts: number[]): number[] {
  const p = parts.map((x) => (Number.isFinite(x) && x > 0 ? x : 0));
  const sum = p.reduce((a, b) => a + b, 0);
  if (!sum) return p.map(() => 0);
  const raw = p.map((x) => (x / sum) * 100);
  const out = raw.map(Math.floor);
  let left = 100 - out.reduce((a, b) => a + b, 0);
  const order = raw.map((v, i) => [v - out[i], i] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (const [, i] of order) {
    if (left <= 0) break;
    out[i] += 1;
    left -= 1;
  }
  return out;
}
