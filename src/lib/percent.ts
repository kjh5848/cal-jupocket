/**
 * 퍼센트 계산기(/tools/percent/) — 법 숫자가 없는 산술 도구.
 *
 * 다섯 가지 질문을 한 함수씩 둔다. 결과는 소수 둘째 자리 반올림(round2)으로
 * 맞춘다. 부동소수 그대로 반올림하면 12,345 × 33.3% = 4,110.885 가 4,110.8849…
 * 로 저장돼 .88 로 내려가므로, 15자리로 먼저 끊어 오차를 지운 뒤 반올림한다.
 * 기준값이 0이면 나눌 수 없으니 null 을 돌려주고 화면이 안내를 띄운다.
 */

/** 소수 둘째 자리 반올림(0.5는 0에서 먼 쪽). 부동소수 오차를 먼저 지운다. */
export function round2(x: number): number {
  if (!Number.isFinite(x)) return x;
  const clean = Number(x.toPrecision(15));
  const s = Math.sign(clean);
  const r = s * (Math.round(Number(`${Math.abs(clean)}e2`)) / 100);
  return r === 0 ? 0 : r;
}

/** 입력 칸 문자열 → 숫자. 쉼표·공백·% 를 지우고, 못 읽으면 NaN. 전각 숫자·기호(２０％, 일본어 입력기)는 반각으로 읽는다. */
export function parseNumber(raw: string): number {
  const t = raw.normalize("NFKC").replace(/[,\s%]/g, "");
  if (t === "" || t === "-" || t === ".") return NaN;
  return /^-?\d*\.?\d*$/.test(t) ? Number(t) : NaN;
}

/** 화면 표기 — 천 단위 쉼표, 소수는 둘째 자리까지(끝 0은 지움). */
export function formatNumber(x: number): string {
  return round2(x).toLocaleString("ko-KR", { maximumFractionDigits: 2 });
}

/** B 는 A 의 몇 %인가 — B ÷ A × 100. A 가 0이면 null. */
export function ratio(a: number, b: number): number | null {
  if (a === 0) return null;
  return round2((b / a) * 100);
}

/** A 의 B% 는 얼마인가 — A × B ÷ 100. */
export function percentOf(a: number, p: number): number {
  return round2((a * p) / 100);
}

/**
 * A 에서 B 로 몇 % 변했나 — (B − A) ÷ |A| × 100.
 * 기준이 음수일 때도 '늘면 +, 줄면 −' 로 읽히도록 분모에 절댓값을 쓴다
 * (−100 → −50 은 늘어난 것이므로 +50%).
 */
export function change(a: number, b: number): { rate: number; diff: number } | null {
  if (a === 0) return null;
  return { rate: round2(((b - a) / Math.abs(a)) * 100), diff: round2(b - a) };
}

/** A 를 B% 올리거나 내린 값 — 할인은 내리기. */
export function adjust(a: number, p: number, dir: "up" | "down"): { result: number; amount: number } {
  const amount = round2((a * p) / 100);
  return { result: round2(dir === "up" ? a + (a * p) / 100 : a - (a * p) / 100), amount };
}

/**
 * B% 올린(내린) 뒤의 값 A 에서 원래 값 — A ÷ (1 ± B/100).
 * 100% 내린 값은 0 이 되므로 원래 값을 알 수 없다 → null.
 */
export function original(a: number, p: number, dir: "up" | "down"): { base: number; amount: number } | null {
  const factor = dir === "up" ? 100 + p : 100 - p;
  if (factor === 0) return null;
  const base = (a * 100) / factor;
  return { base: round2(base), amount: round2(a - base) };
}

/**
 * 일본식 歩合 표기 — 1割 = 10%, 1分 = 1%, 1厘 = 0.1%(25% → 2割5分, 12.5% → 1割2分5厘).
 * 일본에서 할인을 '3割引き' 로 말하므로 일본어판 결과 옆에 같이 보인다.
 * 0 초과 100 이하, 소수 첫째 자리까지만(그보다 잘면 歩合 로 쓰지 않는다) — 아니면 null.
 */
export function toWari(p: number): string | null {
  const t = Math.round(p * 10);
  if (!(p > 0 && p <= 100) || Math.abs(p * 10 - t) > 1e-9) return null;
  const wari = Math.floor(t / 100);
  const bu = Math.floor((t % 100) / 10);
  const rin = t % 10;
  return `${wari ? `${wari}割` : ""}${bu ? `${bu}分` : ""}${rin ? `${rin}厘` : ""}`;
}
