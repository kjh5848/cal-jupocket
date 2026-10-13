/**
 * 양도소득세 어림 — 소득세법 제89조(비과세)·제95조(장기보유특별공제)·제103조(기본공제)·제104조(세율),
 * 시행령 제160조(고가주택), 지방세법 제103조의3(지방소득세 1/10).
 *
 * 부동산 한 건을 한 해에 한 번 파는 경우만 계산한다. 여러 건 합산(제104조 제5항), 필요경비 세부,
 * 감면, 비사업용 토지 판정은 넣지 않았다 — 그래서 '어림' 이다.
 */
import r from "../rates/capital-gains-2026.json";
import { taxOn } from "./deduction";

const R = r.rates;
const LT = r.longTermDeduction;

export type AssetKind = "house" | "land" | "other";

/** 장기보유특별공제율 — 표 1(일반) 또는 표 2(1세대 1주택, 2년 이상 거주) */
export function longTermRate(o: { holdYears: number; residenceYears?: number; oneHouse?: boolean; excluded?: boolean }): number {
  const hold = Math.floor(o.holdYears);
  if (o.excluded || hold < LT.minYears) return 0;
  const reside = Math.floor(o.residenceYears ?? 0);
  if (o.oneHouse && reside >= 2) {
    const h = Math.min(LT.table2.holdStart + (hold - 3) * LT.table2.holdPerYear, LT.table2.holdMax);
    const rz = reside < 3 ? LT.table2.resideTwoYears : Math.min(LT.table2.resideTwoYears + 0.04 + (reside - 3) * LT.table2.residePerYear, LT.table2.resideMax);
    return Math.round((h + rz) * 100) / 100;
  }
  return Math.round(Math.min(LT.table1.start + (hold - 3) * LT.table1.perYear, LT.table1.max) * 100) / 100;
}

/** 세율을 적용한 산출세액 — 단기세율·비사업용 토지·다주택 중과는 큰 쪽(제104조 제1항 후단·제4항·제7항) */
export function taxFor(base: number, o: { kind: AssetKind; holdYears: number; nonBusinessLand?: boolean; surcharge?: 0 | 0.2 | 0.3 }): number {
  const b = Math.max(0, base);
  const house = o.kind === "house";
  const candidates: number[] = [];
  const basic = taxOn(b);
  const add = (o.surcharge ?? 0) + (o.nonBusinessLand ? R.nonBusinessLand.add : 0);
  candidates.push(Math.floor(basic + b * add));
  if (o.holdYears < 1) candidates.push(Math.floor(b * (house ? R.shortTerm.houseUnder1 : R.shortTerm.otherUnder1)));
  else if (o.holdYears < 2) candidates.push(Math.floor(b * (house ? R.shortTerm.house1to2 : R.shortTerm.other1to2)));
  // 보유 2년 미만이면 단기세율과 기본(+가산)세율 중 큰 것
  return o.holdYears < 2 ? Math.max(...candidates) : candidates[0];
}

export interface CapitalGainsInput {
  kind: AssetKind;
  /** 양도가액(실지거래가액) */
  sale: number;
  /** 취득가액 */
  acquisition: number;
  /** 자본적지출·양도비 등 필요경비(취득가액 외) */
  expenses?: number;
  holdYears: number;
  residenceYears?: number;
  /** 1세대 1주택 비과세 요건(보유 2년, 조정대상지역 취득이면 거주 2년)을 갖춘 주택인가 */
  oneHouseExempt?: boolean;
  /** 다주택 중과(조정대상지역 2주택 +20%p, 3주택 +30%p) */
  surcharge?: 0 | 0.2 | 0.3;
  nonBusinessLand?: boolean;
}

export function capitalGains(i: CapitalGainsInput) {
  const gain = Math.max(0, i.sale - i.acquisition - (i.expenses ?? 0));
  const oneHouse = i.kind === "house" && !!i.oneHouseExempt;
  const high = r.exemption.highPrice;
  // 1세대 1주택 비과세: 12억 이하는 전액, 넘으면 (양도가액 − 12억)/양도가액 비율만 과세(시행령 제160조)
  const ratio = oneHouse ? (i.sale <= high ? 0 : (i.sale - high) / i.sale) : 1;
  const taxableGain = Math.floor(gain * ratio);
  const ltRate = longTermRate({ holdYears: i.holdYears, residenceYears: i.residenceYears, oneHouse, excluded: (i.surcharge ?? 0) > 0 });
  const ltDeduction = Math.floor(taxableGain * ltRate);
  const income = taxableGain - ltDeduction;
  const basic = Math.min(r.basicDeduction.amount, income);
  const base = income - basic;
  const tax = taxFor(base, { kind: i.kind, holdYears: i.holdYears, nonBusinessLand: i.nonBusinessLand, surcharge: i.surcharge });
  const local = Math.floor(tax * r.localTax.ratio);
  return { gain, exempt: oneHouse && ratio === 0, ratio, taxableGain, ltRate, ltDeduction, income, basic, base, tax, local, total: tax + local };
}

/** 대주주 주식 세율 — 과세표준 3억원 이하 20%, 초과분 25% (중소기업 외 1년 미만은 30%) */
export function majorShareTax(base: number, shortNonSme = false): number {
  const b = Math.max(0, base);
  if (shortNonSme) return Math.floor(b * R.shares.majorShort);
  const [low, high] = R.shares.majorBrackets;
  return b <= low.upTo! ? Math.floor(b * low.rate) : Math.floor(high.base! + (b - low.upTo!) * high.rate);
}

/** 해외주식 — 연간 양도차익(같은 그룹 손익 통산 후)에서 250만원을 빼고 20%(중소기업 10%) + 지방소득세 1/10 */
export function overseasStockTax(netGain: number, sme = false) {
  const base = Math.max(0, netGain - r.basicDeduction.amount);
  const tax = Math.floor(base * (sme ? R.shares.overseasSme : R.shares.overseasOther));
  const local = Math.floor(tax * r.localTax.ratio);
  return { base, tax, local, total: tax + local };
}

/** 예정신고기한 — 양도일이 속하는 달(주식은 반기)의 말일부터 2개월이 되는 날(그 달의 말일) */
export function preliminaryDue(y: number, m: number, kind: "realEstate" | "shares"): Date {
  const endMonth = kind === "shares" ? (m <= 6 ? 6 : 12) : m;
  return new Date(Date.UTC(y, endMonth - 1 + r.filing.preliminary.realEstateMonths + 1, 0));
}
