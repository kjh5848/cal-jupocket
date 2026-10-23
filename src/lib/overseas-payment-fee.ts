/**
 * 해외결제·환전 수수료 — 같은 외화 금액을 현금 환전 · 카드 현지통화 결제 · 카드 원화결제(DCC) · 외화 충전 카드로
 * 낼 때 원화로 얼마가 드는지 나란히 놓는다(범용, /tools/overseas-payment-fee/).
 *
 * 환율·수수료율은 은행·카드사·상품·시각마다 달라 법 숫자가 없다 — rates 없이 산식 출처만 여기 둔다.
 *
 *   기준        외화 금액 ÷ 고시 단위(엔·동·루피아 100) × 매매기준율. 막대 0 의 자리.
 *   현금 환전   적용 환율 = 매매기준율 + (현찰 살 때 환율 − 매매기준율) × (1 − 우대율).
 *               KB국민은행 환율 안내(kbthink.com/fx.html): 현찰 살 때 = 기준환율 + 기준환율 × 스프레드,
 *               '환율 우대 100% 는 매매기준율 그대로 환전' — 우대율은 그 차이(스프레드)를 깎는 비율이다.
 *   카드 결제   신용카드 개인회원 표준약관(2026.04.01, 신한카드 게시본) 제27조 ②·③:
 *               외화 대금은 국제브랜드사 환율로 미 달러로 바꾼 뒤 카드사 접수일 대외결제대행은행 최초고시 전신환매도율로
 *               원화 청구. 국제브랜드수수료 = 거래미화금액 × 브랜드 수수료율 × 전신환매도율,
 *               해외서비스수수료 = 거래미화금액 × 카드사 수수료율 × 전신환매도율(브랜드 수수료는 빼고 산정).
 *               달러가 아닌 통화는 그 통화의 '송금 보낼 때' 환율로 바로 바꾸는 어림이다(브랜드의 달러 환산을 건너뜀).
 *   원화결제    카드 현지통화 결제 청구액 × (1 + 원화결제 수수료율). 가맹점 쪽 환율에 붙는 웃돈을 한 비율로 본 어림 —
 *               금융감독원 안내 '결제금액의 약 3~8%'(2025-07 휴가철 안내). 기본값은 두지 않는다.
 *   충전 카드   외화 금액 ÷ 단위 × 충전 환율(비우면 매매기준율) + 그 금액 × 결제 수수료율(비우면 0).
 *
 * 단수: 약관·안내에 원 단위 처리 규정이 없다. 항목마다 원 미만 반올림(카드는 원금·브랜드·카드사 수수료를 따로).
 * 실제 청구는 카드사 접수일 환율이라 결제한 날 본 값과 다르다.
 */

export type Method = "cash" | "card" | "dcc" | "prepaid";

export interface FeeInput {
  /** 낼 외화 금액 */
  amount: number;
  /** 환율 고시 단위 — 엔·동·루피아 100, 나머지 1 */
  unit: number;
  /** 매매기준율(단위당 원) */
  base: number;
  /** 현찰 살 때 환율 · 우대율(%) — 환율이 없으면 이 방법은 계산하지 않는다 */
  cash?: { rate: number; prefPct: number };
  /** 전신환매도율(송금 보낼 때) · 브랜드 수수료율(%) · 카드사 해외서비스 수수료율(%) */
  card?: { rate: number; brandPct: number; servicePct: number };
  /** 원화결제 수수료율(%) — card 가 있어야 계산한다 */
  dccPct?: number;
  /** 충전 환율(없으면 매매기준율) · 결제 수수료율(%, 없으면 0) */
  prepaid?: { rate?: number; feePct?: number };
}

export interface MethodResult {
  method: Method;
  /** 원화로 내는 돈 */
  won: number;
  /** 매매기준율로 바꾼 금액보다 더 내는 돈 */
  extra: number;
  /** 더 내는 돈을 나눈 것: 환율 차이 · 브랜드·카드사(충전 카드 결제) 수수료 · 원화결제 수수료 */
  parts: { rate: number; fee: number; dcc: number };
  /** 카드만: 원금·브랜드 수수료·카드사 수수료 */
  card?: { principal: number; brand: number; service: number };
  /** 현금만: 우대 뒤 적용 환율 */
  appliedRate?: number;
}

export type FeeResult =
  | { ok: true; baseWon: number; methods: MethodResult[]; cheapest: Method }
  | { ok: false; reason: "amount" | "unit" | "base" | "cash-rate" | "pref" | "card-rate" | "pct" };

/** 부동소수 꼬리(1,510.1899999…)를 걷어 낸 뒤 원 미만 반올림 */
export const roundWon = (x: number) => Math.round(Number(x.toFixed(6)));

const pctOk = (p: number | undefined) => p === undefined || (Number.isFinite(p) && p >= 0 && p <= 100);

export function compareMethods(input: FeeInput): FeeResult {
  const { amount, unit, base, cash, card, dccPct, prepaid } = input;
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, reason: "amount" };
  if (unit !== 1 && unit !== 100) return { ok: false, reason: "unit" };
  if (!Number.isFinite(base) || base <= 0) return { ok: false, reason: "base" };
  if (cash && (!Number.isFinite(cash.rate) || cash.rate < base)) return { ok: false, reason: "cash-rate" };
  if (cash && !pctOk(cash.prefPct)) return { ok: false, reason: "pref" };
  if (card && (!Number.isFinite(card.rate) || card.rate <= 0)) return { ok: false, reason: "card-rate" };
  if (!pctOk(card?.brandPct) || !pctOk(card?.servicePct) || !pctOk(dccPct) || !pctOk(prepaid?.feePct)) {
    return { ok: false, reason: "pct" };
  }
  if (prepaid?.rate !== undefined && (!Number.isFinite(prepaid.rate) || prepaid.rate <= 0)) {
    return { ok: false, reason: "card-rate" };
  }

  const q = amount / unit;
  const baseWon = roundWon(q * base);
  const methods: MethodResult[] = [];

  if (cash) {
    const appliedRate = base + (cash.rate - base) * (1 - cash.prefPct / 100);
    const won = roundWon(q * appliedRate);
    methods.push({ method: "cash", won, extra: won - baseWon, parts: { rate: won - baseWon, fee: 0, dcc: 0 }, appliedRate });
  }

  if (card) {
    const principal = roundWon(q * card.rate);
    const brand = roundWon((q * card.brandPct * card.rate) / 100);
    const service = roundWon((q * card.servicePct * card.rate) / 100);
    const won = principal + brand + service;
    methods.push({
      method: "card",
      won,
      extra: won - baseWon,
      parts: { rate: principal - baseWon, fee: brand + service, dcc: 0 },
      card: { principal, brand, service },
    });
    if (dccPct !== undefined) {
      const dcc = roundWon((won * dccPct) / 100);
      methods.push({
        method: "dcc",
        won: won + dcc,
        extra: won + dcc - baseWon,
        parts: { rate: principal - baseWon, fee: brand + service, dcc },
        card: { principal, brand, service },
      });
    }
  }

  if (prepaid) {
    const principal = roundWon(q * (prepaid.rate ?? base));
    const fee = roundWon((principal * (prepaid.feePct ?? 0)) / 100);
    const won = principal + fee;
    methods.push({ method: "prepaid", won, extra: won - baseWon, parts: { rate: principal - baseWon, fee, dcc: 0 } });
  }

  if (!methods.length) return { ok: false, reason: "cash-rate" };
  const cheapest = methods.reduce((a, b) => (b.won < a.won ? b : a)).method;
  return { ok: true, baseWon, methods, cheapest };
}
