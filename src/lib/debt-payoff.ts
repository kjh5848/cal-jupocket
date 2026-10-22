/**
 * 부채 상환 계획 — 빚 여러 개를 한 달 예산으로 어떤 순서로 갚으면 언제 끝나고 이자가 얼마인가(범용, /tools/debt-payoff/).
 *
 *   한 달 예산   모든 빚의 월 최소 상환액 합 + 추가 상환액(12개월마다 증가율만큼 늘림, 원 미만 버림)
 *   한 달 순서   ① 남은 빚마다 이자 = 잔액 × 연 이자율 ÷ 12 (원 미만 버림)를 잔액에 더한다
 *                ② 빚마다 최소 상환액을 낸다(잔액보다 많으면 잔액만)
 *                ③ 남은 예산(추가 상환액 + 끝난 빚의 최소 상환액)을 목표 빚에 낸다 — 목표가 그달 끝나고
 *                   돈이 남으면 같은 달 다음 목표로 넘긴다
 *   목표 순서   눈사태 = 연 이자율 높은 순(같으면 잔액 작은 순) · 눈덩이 = 처음 잔액 작은 순(같으면 이자율 높은 순)
 *               · 직접 = 사용자가 정한 번호 순. 마지막은 입력 순서. 순서는 처음 입력으로 한 번 정하고 바꾸지 않는다.
 *
 * 법 숫자가 없는 투영이다 — 실제 대출·카드는 일할 이자·수수료·변동금리·결제일이 있어 고지서와 다를 수 있다.
 * 단수는 lib/loan.ts 와 같게 이자를 원 미만 버림, 마지막 달은 남은 잔액만 낸다(그래서 낸 돈 = 원금 + 이자가 1원까지 맞음).
 * 어떤 빚이든 최소 상환액이 첫 달 이자 이하면 그 빚만 보고는 줄지 않으므로 오류로 돌려준다. 600개월(50년)을 넘으면 멈춘다.
 * 오늘 날짜는 읽지 않는다 — 몇 년 몇 월에 끝나는지는 화면이 시작 연월을 넣어 monthLabel 로 바꾼다.
 */

export type Strategy = "avalanche" | "snowball" | "custom";

export interface Debt {
  name: string;
  /** 지금 남은 잔액(원) */
  balance: number;
  /** 연 이자율(%) */
  ratePct: number;
  /** 월 최소 상환액(원) */
  minPayment: number;
  /** 직접 지정 순서(1이 먼저) — custom 에서만 */
  priority?: number;
}

export interface PayoffInput {
  debts: Debt[];
  strategy: Strategy;
  /** 매달 더 갚을 돈(원) */
  extra: number;
  /** 추가 상환액을 해마다 몇 % 늘릴지 */
  extraGrowthPct: number;
}

export interface PayoffRow {
  /** 몇 번째 달(1부터) */
  month: number;
  payment: number;
  principal: number;
  interest: number;
  /** 그달 끝 남은 잔액 합계 */
  balance: number;
}

export interface DebtOutcome {
  name: string;
  /** 처음 입력한 순서(0부터) */
  index: number;
  /** 몇 번째 목표였나(1부터) */
  order: number;
  /** 다 갚은 달(1부터) */
  payoffMonth: number;
  interest: number;
  paid: number;
}

export type PayoffResult =
  | {
      ok: true;
      months: number;
      totalDebt: number;
      totalInterest: number;
      totalPaid: number;
      /** 첫 달 예산 = 최소 상환액 합 + 추가 상환액 */
      startBudget: number;
      rows: PayoffRow[];
      /** 입력 순서대로 */
      debts: DebtOutcome[];
    }
  | { ok: false; reason: "empty" }
  | { ok: false; reason: "min-too-low"; index: number; firstInterest: number }
  | { ok: false; reason: "too-long" };

export const MAX_MONTHS = 600;

const monthlyInterest = (balance: number, ratePct: number) => Math.floor((balance * ratePct) / 100 / 12);

/** 목표 순서 — 처음 입력으로 한 번 정한다. 돌려주는 값은 입력 순서 번호의 배열 */
export function targetOrder(debts: Debt[], strategy: Strategy): number[] {
  const idx = debts.map((_, i) => i);
  const by = (a: number, b: number) => {
    const x = debts[a];
    const y = debts[b];
    if (strategy === "avalanche") return y.ratePct - x.ratePct || x.balance - y.balance || a - b;
    if (strategy === "snowball") return x.balance - y.balance || y.ratePct - x.ratePct || a - b;
    return (x.priority ?? 99) - (y.priority ?? 99) || a - b;
  };
  return idx.sort(by);
}

/** 빈 줄(잔액 0)은 뺀다 */
const usable = (d: Debt) => Number.isFinite(d.balance) && d.balance > 0;

export function payoffPlan(input: PayoffInput): PayoffResult {
  const debts = input.debts.filter(usable).map((d) => ({
    ...d,
    balance: Math.floor(d.balance),
    minPayment: Math.max(0, Math.floor(d.minPayment || 0)),
    ratePct: Math.max(0, d.ratePct || 0),
  }));
  if (debts.length === 0) return { ok: false, reason: "empty" };
  for (let i = 0; i < debts.length; i++) {
    const first = monthlyInterest(debts[i].balance, debts[i].ratePct);
    if (debts[i].minPayment <= first) return { ok: false, reason: "min-too-low", index: i, firstInterest: first };
  }

  const order = targetOrder(debts, input.strategy);
  const mins = debts.reduce((s, d) => s + d.minPayment, 0);
  const extra = Math.max(0, Math.floor(input.extra || 0));
  const growth = Math.max(0, input.extraGrowthPct || 0) / 100;
  const bal = debts.map((d) => d.balance);
  const interestOf = debts.map(() => 0);
  const paidOf = debts.map(() => 0);
  const payoffMonth = debts.map(() => 0);
  const rows: PayoffRow[] = [];
  const totalDebt = bal.reduce((s, b) => s + b, 0);

  for (let m = 1; m <= MAX_MONTHS; m++) {
    let budget = mins + Math.floor(extra * Math.pow(1 + growth, Math.floor((m - 1) / 12)));
    let interest = 0;
    let payment = 0;
    // ① 이자
    for (let i = 0; i < debts.length; i++) {
      if (bal[i] <= 0) continue;
      const it = monthlyInterest(bal[i], debts[i].ratePct);
      bal[i] += it;
      interestOf[i] += it;
      interest += it;
    }
    // ② 최소 상환액
    for (let i = 0; i < debts.length; i++) {
      if (bal[i] <= 0) continue;
      const pay = Math.min(debts[i].minPayment, bal[i]);
      bal[i] -= pay;
      paidOf[i] += pay;
      payment += pay;
      budget -= pay;
    }
    // ③ 남은 예산을 목표 순서대로
    for (const i of order) {
      if (budget <= 0) break;
      if (bal[i] <= 0) continue;
      const pay = Math.min(budget, bal[i]);
      bal[i] -= pay;
      paidOf[i] += pay;
      payment += pay;
      budget -= pay;
    }
    for (let i = 0; i < debts.length; i++) if (bal[i] <= 0 && payoffMonth[i] === 0) payoffMonth[i] = m;
    const left = bal.reduce((s, b) => s + Math.max(0, b), 0);
    rows.push({ month: m, payment, principal: payment - interest, interest, balance: left });
    if (left === 0) {
      const rank = new Map(order.map((i, k) => [i, k + 1]));
      const totalInterest = interestOf.reduce((s, v) => s + v, 0);
      return {
        ok: true,
        months: m,
        totalDebt,
        totalInterest,
        totalPaid: totalDebt + totalInterest,
        startBudget: mins + extra,
        rows,
        debts: debts.map((d, i) => ({
          name: d.name,
          index: i,
          order: rank.get(i)!,
          payoffMonth: payoffMonth[i],
          interest: interestOf[i],
          paid: paidOf[i],
        })),
      };
    }
  }
  return { ok: false, reason: "too-long" };
}

/** 몇 번째 달 → 'YYYY년 M월'. 1번째 달이 시작 연월 */
export function monthLabel(startYear: number, startMonth: number, month: number): string {
  const t = startYear * 12 + (startMonth - 1) + (month - 1);
  return `${Math.floor(t / 12)}년 ${(t % 12) + 1}월`;
}

/** 개월 → '3년 2개월' */
export function spellMonths(months: number): string {
  const y = Math.floor(months / 12);
  const r = months % 12;
  return [y ? `${y}년` : "", r ? `${r}개월` : ""].filter(Boolean).join(" ") || "0개월";
}
