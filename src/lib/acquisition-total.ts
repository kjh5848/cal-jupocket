/**
 * 취득세 + 지방교육세 + 농어촌특별세 합계, 중과·생애최초 감면 — 지방세법 제11조·제13조의2·제151조, 농어촌특별세법 제5조·제4조 제11호,
 * 지방세특례제한법 제36조의3. 기본 세율은 acquisition-tax.ts(local-tax-2026.json), 나머지는 acquisition-extra-2026.json.
 *
 * 중과 대상의 농어촌특별세는 확인하지 않아 넣지 않았다(notVerified).
 *
 * 농특세 비과세(제4조 제11호 '서민주택')는 취득 원인을 가리지 않는다 — 시행령 제4조 제5항은 국민주택 규모 이하
 * 주거용 건물과 부속토지라고만 정한다. 그래서 증여·상속·신축이라도 그 대상이 85㎡ 이하 주택이면 0원이다.
 */
import x from "../rates/acquisition-extra-2026.json";
import { bill, byRate, type Cause } from "./acquisition-tax";

const fl = (v: number) => Math.floor(v + 1e-6);

export type Kind = "house" | "house8" | "house12" | "officetel" | "land" | "gift" | "inheritance";

/** 국민주택 규모 이하(85㎡, 일부 읍·면 100㎡)면 농특세 비과세 */
export interface TotalOptions {
  smallArea?: boolean;
  /** gift·inheritance 의 대상이 주택인가 — 그래야 smallArea 비과세가 붙는다 */
  house?: boolean;
  /** 생애최초 감면 — "general"(200만원) | "small"(300만원) */
  firstHome?: false | "general" | "small";
}

const causeOf: Record<Exclude<Kind, "house8" | "house12">, Cause> = {
  house: "housePaid",
  officetel: "paidOther",
  land: "paidOther",
  gift: "gift",
  inheritance: "inheritanceOther",
};

export function acquisitionTotal(price: number, kind: Kind, o: TotalOptions = {}) {
  const p = Math.max(0, fl(price));
  let acq: number;
  let edu: number;
  let rate: number;
  if (kind === "house8" || kind === "house12") {
    const times = kind === "house8" ? x.surcharge.two : x.surcharge.four;
    rate = x.baseRate + x.surchargeBaseRate * times;
    acq = byRate(p, rate);
    edu = byRate(p, (x.baseRate - x.surchargeBaseRate) * 0.2);
  } else {
    const b = bill({ price: p, cause: causeOf[kind] });
    rate = b.rate;
    acq = b.acquisitionTax;
    edu = b.educationTax;
  }
  // 농특세: 표준세율 2%로 계산한 취득세의 10% = 0.2%. 주택이면서 국민주택 규모 이하면 비과세. 중과분은 계산하지 않는다
  const isHouse = kind === "house" || kind === "house8" || kind === "house12" || ((kind === "gift" || kind === "inheritance") && !!o.house);
  const rural = kind === "house8" || kind === "house12" ? null : isHouse && o.smallArea ? 0 : byRate(p, x.surchargeBaseRate * x.rural.rate);
  // 생애최초 감면 — 12억원 이하 주택 유상취득. 감면받으면 중과를 적용하지 않으므로 house 로만 계산
  let relief = 0;
  if (o.firstHome && kind === "house" && p <= x.firstHome.priceLimit) {
    relief = Math.min(acq, o.firstHome === "small" ? x.firstHome.small : x.firstHome.general);
  }
  const total = acq - relief + edu + (rural ?? 0);
  return { rate, acq, relief, edu, rural, total };
}

/**
 * 유상거래 주택의 중과 배수 — 지방세법 제13조의2 제1항(acquisition-extra-2026.json surcharge.eight·twelve).
 * 0 이면 표준세율(1~3%), 2 면 4% + 2% × 2 = 8%, 4 면 12%.
 *
 * houses 는 이번 집을 넣은 1세대 주택 수. 일시적 2주택(시행령)과 중과 제외 주택은 가리지 않는다 — 화면이 안내한다.
 */
export function surchargeTimes(houses: number, regulated: boolean, corporate: boolean): 0 | 2 | 4 {
  if (corporate) return 4;
  const n = Math.max(1, Math.floor(houses));
  if (regulated) return n >= 3 ? 4 : n === 2 ? 2 : 0;
  return n >= 4 ? 4 : n === 3 ? 2 : 0;
}

export interface PageOptions {
  cause: Cause;
  /** 신축·증여·상속(농지 외)의 대상이 주택인가. housePaid 는 늘 주택 */
  house?: boolean;
  /** 전용 85㎡ 이하(읍·면 100㎡) — 주택일 때 농특세 비과세 */
  smallArea?: boolean;
  /** 주택 유상거래만: 취득 후 1세대 주택 수 · 조정대상지역 · 법인 */
  houses?: number;
  regulated?: boolean;
  corporate?: boolean;
}

/**
 * 취득세 계산기(/acquisition-tax/) 한 장 — 원인 7가지 + 주택 유상거래 중과 판정 + 농특세.
 * rural 이 null 이면 중과라 농특세를 확인하지 않은 경우(0원이 아니다).
 */
export function acquisitionPage(price: number, o: PageOptions) {
  const p = Math.max(0, fl(price));
  const isHouse = o.cause === "housePaid" || (!!o.house && (o.cause === "original" || o.cause === "gift" || o.cause === "inheritanceOther"));
  const times = o.cause === "housePaid" ? surchargeTimes(o.houses ?? 1, !!o.regulated, !!o.corporate) : 0;
  const b = bill({ price: p, cause: o.cause });
  if (times > 0) {
    const t = acquisitionTotal(p, times === 2 ? "house8" : "house12");
    return { rate: t.rate, acq: t.acq, edu: t.edu, rural: null as number | null, total: t.total, times, isHouse, deadline: b.deadline };
  }
  const rural = p === 0 || (isHouse && o.smallArea) ? 0 : byRate(p, x.surchargeBaseRate * x.rural.rate);
  return { rate: b.rate, acq: b.acquisitionTax, edu: b.educationTax, rural: rural as number | null, total: b.acquisitionTax + b.educationTax + rural, times, isHouse, deadline: b.deadline };
}
