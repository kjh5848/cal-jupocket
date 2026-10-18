/**
 * 복권 당첨금 세금 — 소득세법 제84조 제2호(건별 200만원 이하 과세 안 함), 제129조 제1항 제6호(20%, 3억원 초과분 30%),
 * 제14조 제3항 제8호 라목(분리과세), 지방세법 제103조의13(소득세의 10%). rates: lottery-2026.json
 * 끝수: 국고금 관리법 제47조 ①(10원 미만은 계산하지 않는다), 지방세는 지방세기본법 제59조가 그 조문을 준용한다.
 *
 * 당첨금 전액을 소득금액으로 본다 — 복권 구입비를 필요경비로 빼는 조문을 찾지 못했다(notVerified).
 */
import r from "../rates/lottery-2026.json";

/** 10원 미만 버림(국고금 관리법 제47조 ①) */
const cut10 = (v: number) => Math.floor(v / 10) * 10;
/** 정수 × 백분율 원 미만 버림 — 부동소수점 곱셈은 1원 모자랄 수 있다 */
const byPct = (amount: number, rate: number) => Math.floor((amount * Math.round(rate * 100)) / 100);

export interface LotteryTax {
  prize: number;
  taxable: boolean;
  /** 소득세 중 3억원까지 20% 부분 */
  baseTax: number;
  /** 소득세 중 3억원 초과분 30% 부분 */
  overTax: number;
  tax: number;
  local: number;
  total: number;
  net: number;
  /** 세금 합계 ÷ 당첨금 */
  effective: number;
}

export function lotteryTax(prize: number): LotteryTax {
  const p = Math.max(0, Math.floor(prize));
  const taxable = p > r.minimum.upTo;
  const over = Math.max(0, p - r.rate.over);
  // 원천징수세액 = 소득금액 × 세율, 그 합계에서 10원 미만을 버린다. 3억원을 넘으면 20% 부분(6천만원)은 10원 단위로 떨어져 30% 부분만 끝수가 생긴다.
  const tax = taxable ? cut10(byPct(p - over, r.rate.base) + byPct(over, r.rate.overRate)) : 0;
  const baseTax = over ? byPct(r.rate.over, r.rate.base) : tax;
  const overTax = tax - baseTax;
  const local = cut10(byPct(tax, r.local.ratio));
  const total = tax + local;
  return { prize: p, taxable, baseTax, overTax, tax, local, total, net: p - total, effective: p ? total / p : 0 };
}

export interface LottoPage extends LotteryTax {
  /** 3억원을 넘는 당첨금 */
  overAmount: number;
  /** 넘는 부분까지 20%(지방소득세 포함 22%)였다면 덜 냈을 세금 — 30% 구간 때문에 더 뗀 돈 */
  overExtra: number;
  /** 실제로 뗀 비율, 소수 둘째 자리 */
  effectiveRate: number;
}

export function lottoPage(prize: number): LottoPage {
  const x = lotteryTax(prize);
  const overAmount = Math.max(0, x.prize - r.rate.over);
  let overExtra = 0;
  if (overAmount) {
    const flatTax = cut10(byPct(x.prize, r.rate.base));
    overExtra = x.total - (flatTax + cut10(byPct(flatTax, r.local.ratio)));
  }
  return { ...x, overAmount, overExtra, effectiveRate: x.prize ? Math.round((x.total / x.prize) * 10000) / 100 : 0 };
}
