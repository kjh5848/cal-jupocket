/**
 * 전기차 세금 — 자동차세(정액)와 취득세 감면.
 *
 *   자동차세   비영업용 10만원 · 영업용 2만원(1대당 연세액)     지방세법 제127조 ① 3호, 시행령 제123조 2호
 *   교육세     비영업용 자동차세의 30%                          제150조 7호 · 제151조 ① 7호
 *   취득세     과세표준 × 7% − min(세액, 140만원)                제12조 ① 2호 가목 · 지특법 제66조 ④
 *
 * 전기차는 배기량이 없어 '그 밖의 승용자동차'로 1대당 정액이다. 차령 감면(제2호)은
 * 제1호(배기량 과세) 차만 대상이라 전기차는 오래 타도 그대로다.
 *
 * 취득세 감면은 2026년 12월 31일까지 취득분이다(지특법 제66조 ④). 그 뒤 취득은 법이
 * 바뀌지 않는 한 감면이 없다 — 연도를 받아 그대로 계산한다.
 *
 * 숫자는 `src/rates/electric-car-2026.json` 에서만 온다.
 */
import r from "../rates/electric-car-2026.json";

const V = r.vehicleTax;
const A = r.acquisitionTax;
const E = r.exemption;
const fl = (v: number) => Math.floor(v + 1e-6);

/** 전기차 1대 1년 자동차세 — 본세·지방교육세·합계 */
export function evVehicleTax(business = false) {
  const base = business ? V.business : V.nonBusiness;
  const edu = business ? 0 : fl(base * V.eduRate);
  return { base, edu, total: base + edu, perHalf: (base + edu) / 2 };
}

/** 감면이 적용되는 마지막 취득일(YYYY-MM-DD) 이내인가 */
export function acquisitionExemptOn(date: string): boolean {
  return date <= E.acquisition.until;
}

/**
 * 전기차 취득세 — price 는 부가가치세를 뺀 사실상취득가격(보조금 받은 몫 포함).
 * date 가 감면 기한(2026-12-31) 이내면 140만원 한도로 깎는다.
 */
export function evAcquisitionTax(price: number, date = "2026-12-31") {
  const gross = fl(Math.max(0, price) * A.rate);
  const exempt = acquisitionExemptOn(date) ? Math.min(gross, E.acquisition.cap) : 0;
  return { gross, exempt, tax: gross - exempt };
}

/** 취득세가 전부 면제되는 차값 상한 — 140만원 ÷ 7% */
export function evFullExemptPrice(): number {
  return Math.round(E.acquisition.cap / A.rate);
}
