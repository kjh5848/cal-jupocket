/**
 * 대출 상환 — 원리금균등·원금균등·만기일시 상환표(월 단위).
 *
 *   회차 이자    남은 원금 × 연 이자율 ÷ 12                 (월 단위 약정 이자)
 *   원리금균등   매달 내는 돈 A = P·i / (1 − (1+i)^−m)       i = 연 이자율/12, m = 원금 갚는 회차 수
 *   원금균등     매달 갚는 원금 = P / m, 이자는 남은 원금에
 *   만기일시     매달 이자만, 마지막 회차에 원금 전부
 *   거치기간     대출기간 안에 포함 — 그 회차 수만큼 이자만 내고, 남은 회차로 원금을 갚는다
 *
 * 단수: 법령에 대출 이자 원 단위 처리 규정이 없다(상품 약정을 따른다). 여기서는 회차 이자·매달 내는 돈·
 * 매달 원금을 원 미만 버림으로 하고, 버려서 남은 원금은 마지막 회차가 전부 갚는다 —
 * 그래서 마지막 잔액은 항상 0원이고 총 납부액 = 원금 + 이자 합계가 1원까지 맞는다.
 * 실제 은행은 일수(일할) 계산·변동금리·수수료가 있어 이 표와 다를 수 있다.
 */

export type LoanMethod = "level" | "principal" | "bullet";

export interface LoanInput {
  /** 대출원금(원) */
  principal: number;
  /** 대출기간(개월, 거치기간 포함) */
  months: number;
  /** 연 이자율(%) — 4.5 는 연 4.5% */
  ratePct: number;
  method: LoanMethod;
  /** 거치기간(개월) — 원리금균등·원금균등에서만. 대출기간보다 짧아야 한다 */
  graceMonths?: number;
}

export interface LoanRow {
  no: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface LoanResult {
  rows: LoanRow[];
  /** 첫 회차(거치기간이면 거치 뒤 첫 회차) 납입액 — 원리금균등은 매달 같은 금액 */
  firstPayment: number;
  /** 거치기간 중 매달 이자 */
  gracePayment: number;
  lastPayment: number;
  totalInterest: number;
  totalPaid: number;
  /** 원금 갚는 회차 수 */
  repayMonths: number;
}

const fl = (v: number) => Math.floor(v + 1e-6);

/** 원리금균등 매달 내는 돈(원 미만 버림). i = 월 이자율(소수) */
export function levelPayment(principal: number, i: number, m: number): number {
  if (m <= 0) return 0;
  if (i === 0) return fl(principal / m);
  return fl((principal * i) / (1 - Math.pow(1 + i, -m)));
}

export function loanSchedule(inp: LoanInput): LoanResult {
  const P = Math.max(0, fl(inp.principal));
  const n = Math.max(1, Math.floor(inp.months));
  const rate = Math.max(0, inp.ratePct);
  const i = rate / 1200;
  const g = inp.method === "bullet" ? 0 : Math.min(Math.max(0, Math.floor(inp.graceMonths ?? 0)), n - 1);
  const m = n - g;
  const interestOf = (bal: number) => fl((bal * rate) / 1200);

  const rows: LoanRow[] = [];
  let bal = P;
  const A = inp.method === "level" ? levelPayment(P, i, m) : 0;
  const per = inp.method === "principal" ? fl(P / m) : 0;

  for (let no = 1; no <= n; no++) {
    const interest = interestOf(bal);
    let pr = 0;
    if (no === n) pr = bal;
    else if (no <= g) pr = 0;
    else if (inp.method === "level") pr = Math.min(bal, Math.max(0, A - interest));
    else if (inp.method === "principal") pr = Math.min(bal, per);
    else pr = 0;
    bal -= pr;
    rows.push({ no, payment: pr + interest, principal: pr, interest, balance: bal });
  }

  const totalInterest = rows.reduce((s, r) => s + r.interest, 0);
  return {
    rows,
    firstPayment: rows[g].payment,
    gracePayment: g > 0 ? rows[0].payment : 0,
    lastPayment: rows[n - 1].payment,
    totalInterest,
    totalPaid: P + totalInterest,
    repayMonths: inp.method === "bullet" ? 1 : m,
  };
}

/** 같은 조건으로 세 방식 비교 */
export function compareMethods(inp: Omit<LoanInput, "method">) {
  return (["level", "principal", "bullet"] as const).map((method) => ({ method, ...loanSchedule({ ...inp, method }) }));
}
