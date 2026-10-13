/**
 * 취득세 + 지방교육세 + 농어촌특별세 합계, 중과·생애최초 감면 — 지방세법 제11조·제13조의2·제151조, 농어촌특별세법 제5조·제4조 제11호,
 * 지방세특례제한법 제36조의3. 기본 세율은 acquisition-tax.ts(local-tax-2026.json), 나머지는 acquisition-extra-2026.json.
 *
 * 중과 대상의 농어촌특별세는 확인하지 않아 넣지 않았다(notVerified).
 */
import x from "../rates/acquisition-extra-2026.json";
import { bill, type Cause } from "./acquisition-tax";

const fl = (v: number) => Math.floor(v + 1e-6);

export type Kind = "house" | "house8" | "house12" | "officetel" | "land" | "gift" | "inheritance";

/** 국민주택 규모 이하(85㎡, 일부 읍·면 100㎡)면 농특세 비과세 */
export interface TotalOptions {
  smallArea?: boolean;
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
    acq = fl(p * rate);
    edu = fl(p * (x.baseRate - x.surchargeBaseRate) * 0.2);
  } else {
    const b = bill({ price: p, cause: causeOf[kind] });
    rate = b.rate;
    acq = b.acquisitionTax;
    edu = b.educationTax;
  }
  // 농특세: 표준세율 2%로 계산한 취득세의 10% = 0.2%. 주택이면서 국민주택 규모 이하면 비과세. 중과분은 계산하지 않는다
  const isHouse = kind === "house" || kind === "house8" || kind === "house12";
  const rural = kind === "house8" || kind === "house12" ? null : isHouse && o.smallArea ? 0 : fl(p * x.surchargeBaseRate * x.rural.rate);
  // 생애최초 감면 — 12억원 이하 주택 유상취득. 감면받으면 중과를 적용하지 않으므로 house 로만 계산
  let relief = 0;
  if (o.firstHome && kind === "house" && p <= x.firstHome.priceLimit) {
    relief = Math.min(acq, o.firstHome === "small" ? x.firstHome.small : x.firstHome.general);
  }
  const total = acq - relief + edu + (rural ?? 0);
  return { rate, acq, relief, edu, rural, total };
}
