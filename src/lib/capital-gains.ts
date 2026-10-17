/**
 * 양도소득세 어림 — 소득세법 제89조(비과세)·제95조(장기보유특별공제)·제103조(기본공제)·제104조(세율),
 * 시행령 제160조(고가주택), 지방세법 제103조의3(지방소득세 1/10).
 *
 * 부동산 한 건을 한 해에 한 번 파는 경우만 계산한다. 여러 건 합산(제104조 제5항), 필요경비 세부,
 * 감면, 비사업용 토지 판정은 넣지 않았다 — 그래서 '어림' 이다.
 */
import r from "../rates/capital-gains-2026.json";
import { taxOn } from "./deduction";
import tr from "../rates/2026.json";

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

/** 산출세액에 실제로 쓰인 세율 — taxFor 가 고른 쪽(기본세율 구간 + 가산, 또는 단기세율)을 사람이 읽는 말로 */
export function rateLabel(base: number, o: { kind: AssetKind; holdYears: number; nonBusinessLand?: boolean; surcharge?: 0 | 0.2 | 0.3 }): string {
  const b = Math.max(0, base);
  if (b === 0) return "—";
  const bracket = tr.incomeTaxBrackets.find((x) => x.upTo === null || b <= x.upTo)!;
  const add = (o.surcharge ?? 0) + (o.nonBusinessLand ? R.nonBusinessLand.add : 0);
  const basic = `기본 ${Math.round(bracket.rate * 100)}%` + (add ? ` + ${Math.round(add * 100)}%p` : "");
  if (o.holdYears >= 2) return basic;
  const house = o.kind === "house";
  const short = o.holdYears < 1 ? (house ? R.shortTerm.houseUnder1 : R.shortTerm.otherUnder1) : house ? R.shortTerm.house1to2 : R.shortTerm.other1to2;
  const shortTax = Math.floor(b * short);
  return shortTax >= taxFor(b, { ...o, holdYears: 2 }) ? `단기 ${Math.round(short * 100)}%` : basic;
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
  /** 양도일 현재 1세대 1주택인가 — 비과세 요건(보유·거주기간)은 아래에서 따진다 */
  oneHouse?: boolean;
  /** 취득 당시 조정대상지역이었나 — 그러면 보유기간 중 거주 2년이 더 필요하다(시행령 제154조 ①) */
  adjustedAtAcquisition?: boolean;
  /** 이번 과세기간에 남은 기본공제(같은 그룹에서 먼저 판 자산이 쓴 만큼 줄어든다, 제103조). 비우면 250만원 */
  basicLeft?: number;
  /** 다주택 중과(조정대상지역 2주택 +20%p, 3주택 +30%p) */
  surcharge?: 0 | 0.2 | 0.3;
  nonBusinessLand?: boolean;
}

/**
 * 1세대 1주택 비과세 요건 중 기간 — 보유 2년 이상, 취득 당시 조정대상지역이면 거주 2년 이상(제89조 ① 3호·시행령 제154조 ①).
 * 시행령 제154조 ① 단서의 예외(수용·해외이주·부득이한 사유 등)는 따지지 않는다. 못 갖췄으면 무엇이 모자란지 돌려준다.
 */
export function oneHouseUnmet(o: { holdYears: number; residenceYears?: number; adjustedAtAcquisition?: boolean }): "hold" | "residence" | null {
  if (o.holdYears < r.exemption.holdYears) return "hold";
  if (o.adjustedAtAcquisition && (o.residenceYears ?? 0) < r.exemption.residenceYearsIfAdjusted) return "residence";
  return null;
}

export function capitalGains(i: CapitalGainsInput) {
  const gain = Math.max(0, i.sale - i.acquisition - (i.expenses ?? 0));
  const claimed = i.kind === "house" && !!i.oneHouse;
  const unmet = claimed ? oneHouseUnmet(i) : null;
  // 요건을 못 갖춘 1주택은 일반 주택처럼 전부 과세하고 표 1 을 쓴다
  const oneHouse = claimed && unmet === null;
  const high = r.exemption.highPrice;
  // 1세대 1주택 비과세: 12억 이하는 전액, 넘으면 (양도가액 − 12억)/양도가액 비율만 과세(시행령 제160조)
  const ratio = oneHouse ? (i.sale <= high ? 0 : (i.sale - high) / i.sale) : 1;
  const taxableGain = Math.floor(gain * ratio);
  const ltRate = longTermRate({ holdYears: i.holdYears, residenceYears: i.residenceYears, oneHouse, excluded: (i.surcharge ?? 0) > 0 });
  const ltDeduction = Math.floor(taxableGain * ltRate);
  const income = taxableGain - ltDeduction;
  const basicLeft = Math.min(r.basicDeduction.amount, Math.max(0, i.basicLeft ?? r.basicDeduction.amount));
  const basic = Math.min(basicLeft, income);
  const base = income - basic;
  const tax = taxFor(base, { kind: i.kind, holdYears: i.holdYears, nonBusinessLand: i.nonBusinessLand, surcharge: i.surcharge });
  const local = Math.floor(tax * r.localTax.ratio);
  // 비과세로 빠진 양도차익 — gain = exemptPart + ltDeduction + basic + base (모두 정수)
  const exemptPart = gain - taxableGain;
  return { gain, exempt: oneHouse && ratio === 0, oneHouseUnmet: unmet, ratio, taxableGain, exemptPart, ltRate, ltDeduction, income, basic, base, tax, local, total: tax + local };
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
