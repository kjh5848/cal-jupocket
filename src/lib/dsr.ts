/**
 * DSR(총부채원리금상환비율) — 은행 차주단위 기준.
 *
 *   DSR(%) = 대출의 연간 원리금 상환액 ÷ 연소득 × 100        세칙 별표 18 제12호 가목
 *   한도    총대출 1억원 초과 차주는 40% 이내                  감독규정 별표 6 제4장 4. 가목
 *
 * 연간 원리금은 세칙 별표 18 <표 3> 부채산정방식을 따른다.
 *   주담대 분할상환     분할상환 첫 12개월 실제 원금 + 이자 (만기 40년 상한, 제12-2호 사목)
 *   주담대 일시상환     대출총액 ÷ 기간(최대 10년) + 1년 이자
 *   신용대출 분할상환   대출총액 ÷ 약정만기(5~10년으로 맞춤) + 첫 12개월 이자
 *   신용대출 그 밖      대출총액(마이너스통장은 한도) ÷ 5년 + 1년 이자
 *   전세자금대출        넣지 않음
 *
 * 금액은 원 미만 버림, DSR 은 소수 둘째 자리 반올림 — 규정에 단수 처리가 없다(rates: dsr-2026.json assumptions).
 */
import r from "../rates/dsr-2026.json";

export type DsrLoanKind = "mortgage" | "credit" | "jeonse";
export type DsrMethod = "level" | "principal" | "bullet";

export interface DsrLoan {
  kind: DsrLoanKind;
  /** 대출금액(원) — 마이너스통장은 한도 */
  amount: number;
  /** 연 이자율(%) */
  ratePct: number;
  /** 대출기간(년) */
  years: number;
  method: DsrMethod;
}

export interface DsrLoanAnnual {
  principal: number;
  interest: number;
  total: number;
  /** DSR 에 쓴 기간(년) — 원금을 나누는 햇수 또는 상환 기간 */
  termYears: number;
}

const fl = (v: number) => Math.floor(v + 1e-6);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** 분할상환 첫 12개월(기간이 짧으면 그만큼)의 원금·이자 합 — 원 미만 버리지 않은 값 */
function firstYear(P: number, ratePct: number, months: number, method: "level" | "principal") {
  const i = ratePct / 1200;
  const n = Math.max(1, Math.round(months));
  const A = i === 0 ? P / n : (P * i) / (1 - Math.pow(1 + i, -n));
  let bal = P;
  let principal = 0;
  let interest = 0;
  const count = Math.min(12, n);
  for (let k = 0; k < count; k++) {
    const it = bal * i;
    const pr = method === "level" ? A - it : P / n;
    interest += it;
    principal += pr;
    bal -= pr;
  }
  // 원리금균등은 합계가 정확히 A × 회차 — 원금을 거꾸로 구해 소수 오차로 1원 어긋나지 않게 한다
  if (method === "level") principal = A * count - interest;
  return { principal, interest };
}

/** 대출 하나의 연간 원리금(원 미만 버리지 않은 값) — 금액에 비례한다 */
function annualRaw(l: DsrLoan): { principal: number; interest: number; termYears: number } {
  const P = Math.max(0, l.amount);
  const rate = Math.max(0, l.ratePct);
  const years = Math.max(1, l.years || 0);
  if (l.kind === "jeonse" || P === 0) return { principal: 0, interest: 0, termYears: 0 };
  if (l.kind === "mortgage") {
    const y = Math.min(years, r.maxTermYears);
    if (l.method === "bullet") {
      const t = Math.min(y, 10);
      return { principal: P / t, interest: (P * rate) / 100, termYears: t };
    }
    return { ...firstYear(P, rate, y * 12, l.method), termYears: y };
  }
  // 신용대출
  if (l.method === "bullet") return { principal: P / 5, interest: (P * rate) / 100, termYears: 5 };
  const t = clamp(years, 5, 10);
  return { principal: P / t, interest: firstYear(P, rate, years * 12, l.method).interest, termYears: t };
}

export function dsrLoanAnnual(l: DsrLoan): DsrLoanAnnual {
  const a = annualRaw(l);
  const principal = fl(a.principal);
  const interest = fl(a.interest);
  return { principal, interest, total: fl(a.principal + a.interest), termYears: a.termYears };
}

export interface DsrInput {
  /** 연소득(원) */
  income: number;
  newLoan: DsrLoan;
  /** 스트레스 금리(%p) — 새 대출 금리에 더한다. 기본 0 */
  stressPct?: number;
  others: DsrLoan[];
}

export interface DsrResult {
  newAnnual: DsrLoanAnnual;
  otherAnnual: number;
  totalAnnual: number;
  /** DSR(%) 소수 둘째 자리 반올림. 소득 0 이면 Infinity */
  dsr: number;
  limitPct: number;
  /** 총대출(새 대출 + 기존, 한도대출은 한도) */
  totalLoan: number;
  /** 총대출 1억원 초과라 40% 규제 대상인가 */
  regulated: boolean;
  /** 같은 조건으로 40% 를 채우는 새 대출 최대 금액(원 미만 버림, 0 이상) */
  maxNewLoan: number;
  /** 스트레스 금리를 더한 새 대출 금리(%) */
  appliedRatePct: number;
}

export function dsr(inp: DsrInput): DsrResult {
  const stress = Math.max(0, inp.stressPct ?? 0);
  const appliedRatePct = Math.max(0, inp.newLoan.ratePct) + stress;
  const nl = { ...inp.newLoan, ratePct: appliedRatePct };
  const newAnnual = dsrLoanAnnual(nl);
  const otherAnnual = inp.others.reduce((s, o) => s + dsrLoanAnnual(o).total, 0);
  const totalAnnual = newAnnual.total + otherAnnual;
  const income = Math.max(0, inp.income);
  const dsrPct = income > 0 ? Math.round((totalAnnual / income) * 10000) / 100 : Infinity;
  const limitPct = r.bankLimit.ratioPct;
  const totalLoan = Math.max(0, inp.newLoan.amount) + inp.others.reduce((s, o) => s + Math.max(0, o.amount), 0);

  // 연간 원리금은 대출금액에 비례 — 1원당 연간 원리금으로 남은 여력을 나눈다
  const unit = annualRaw({ ...nl, amount: 100_000_000 });
  const perWon = (unit.principal + unit.interest) / 100_000_000;
  const room = (income * limitPct) / 100 - otherAnnual;
  const maxNewLoan = perWon > 0 && room > 0 ? fl(room / perWon) : 0;

  return {
    newAnnual,
    otherAnnual,
    totalAnnual,
    dsr: dsrPct,
    limitPct,
    totalLoan,
    regulated: totalLoan > r.bankLimit.totalLoanOver,
    maxNewLoan,
    appliedRatePct,
  };
}
