/**
 * 영국 Vehicle Excise Duty(승용차) — 첫 등록일·CO2·연료·배기량·차 가격 → 12개월 세액과 GOV.UK 표의 납부 방식별 금액.
 * 영국판 /en-gb/vehicle-tax/ 가 쓴다.
 *
 * 원문(rates/gb/vehicle-excise-duty-2026.json — 법 2026-10-23, GOV.UK 표 2026-10-24 확인):
 * - VERA 1994 Sch 1 Part 1AA(2017-04-01 이후 등록): 첫 면허 para 1GC Table 1·2(구간은 하한 초과~상한 이하, 첫 줄만 0 포함),
 *   이후 para 1GD £200, para 1GE 가격 £40,000(0g/km £50,000) '초과'·첫 등록 6주년 전에 효력이 생기는 면허 → £640
 *   (2025-04-01 전 등록 0g/km 는 제외, 첫 면허에는 붙지 않음).
 * - Part IA para 1B(2001-03-01~2017-03-31 등록): band A~M, 2006-03-23 전 등록은 L·M 도 £445.
 * - Part I para 1(2001-03-01 전 등록): 1,549cc 이하 £230, 초과 £375.
 * - 6개월·Direct Debit 금액: VERA s.4 비율을 곱하지 않고 GOV.UK 표 값(govUkPence)을 그대로 — 1p 끝수 규칙이 끼지 않는다.
 * - 2026-27 금액은 FA 2026 s.92(11) 로 2026-04-01 이후 받는 면허부터.
 *
 * 금액은 파운드(연액, 정수)와 펜스(표 값, 정수).
 */
import rates from "../../rates/gb/vehicle-excise-duty-2026.json";

export type Era = "post2017" | "2001to2017" | "pre2001";
export type Fuel = "petrol" | "dieselRde2" | "dieselOther" | "electric";
export type Payment = "first" | "later";

interface Band { overGkm: number | null; upToGkm: number | null; pounds: number }
interface Pay { monthlyDirectDebitTotal: number; sixMonths: number | null; sixMonthsDirectDebit: number | null }
interface OldBand extends Band { band: string; before2006_03_23?: number; govUkPence: Pay }

const P17 = rates.post2017;
export const FIRST_STANDARD = P17.firstLicence.standard as Band[];
export const FIRST_DIESEL = P17.firstLicence.higherRateDiesel.bands as Band[];
export const LATER_POUNDS = P17.laterLicences.annualPounds;
export const EXPENSIVE_POUNDS = P17.expensiveCar.annualPounds;
export const EXPENSIVE_EXTRA = P17.expensiveCar.extraOverStandardPounds;
export const THRESHOLD_ZERO = P17.expensiveCar.thresholdPounds.zeroEmission;
export const THRESHOLD_OTHER = P17.expensiveCar.thresholdPounds.other;
export const OLD_BANDS = rates.registered2001to2017.bands as OldBand[];
export const PRE2001_SMALL = rates.before2001.upTo1549ccOrElectricPounds;
export const PRE2001_LARGE = rates.before2001.over1549ccPounds;
export const RATIOS = rates.paymentOptions;

/** 날짜는 'YYYY-MM-DD' 문자열로 비교한다 */
export const POST2017_FROM = "2017-04-01";
export const FROM_2001 = "2001-03-01";
export const L_M_CUTOFF = "2006-03-23";
export const ZERO_EXEMPT_BEFORE = "2025-04-01";
export const RATES_FROM = "2026-04-01";

export function eraOf(registered: string): Era {
  if (registered >= POST2017_FROM) return "post2017";
  if (registered >= FROM_2001) return "2001to2017";
  return "pre2001";
}

/** (over, upTo] 구간, over 가 null 이면 0 이상 */
function inBand(b: Band, g: number): boolean {
  const lo = b.overGkm === null ? g >= 0 : g > b.overGkm;
  const hi = b.upToGkm === null ? true : g <= b.upToGkm;
  return lo && hi;
}

/** 2017-04 이후 등록 첫 면허(12개월) — Table 1, Euro 6d(RDE2) 미충족 경유는 Table 2 */
export function firstLicencePounds(co2: number, dieselNotRde2: boolean): number {
  const t = dieselNotRde2 ? FIRST_DIESEL : FIRST_STANDARD;
  return t.find((b) => inBand(b, co2))!.pounds;
}

/** 2001~2017 등록 band */
export function oldBandOf(co2: number): OldBand {
  return OLD_BANDS.find((b) => inBand(b, co2))!;
}

/** 첫 등록일 + n 년 (같은 월·일, 2/29 는 3/1) */
function addYears(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y + n, m - 1, d));
  return t.toISOString().slice(0, 10);
}

/**
 * para 1GE — £640 가 붙는가: 가격이 기준 '초과', 면허 시작이 첫 등록 6주년 전, (2025-04-01 이후 등록 또는 0g/km 초과).
 * 첫 면허에는 붙지 않는다(호출하는 쪽이 later 일 때만 부른다).
 */
export function isExpensive(listPricePounds: number, co2: number, registered: string, taxFrom: string): boolean {
  const zero = co2 === 0;
  const threshold = zero ? THRESHOLD_ZERO : THRESHOLD_OTHER;
  if (!(listPricePounds > threshold)) return false;
  if (!(taxFrom < addYears(registered, 6))) return false;
  if (zero && registered < ZERO_EXEMPT_BEFORE) return false;
  return true;
}

export interface Input {
  /** 첫 등록일 YYYY-MM-DD */
  registered: string;
  /** 이번 세금이 시작하는 날 YYYY-MM-DD */
  taxFrom: string;
  fuel: Fuel;
  /** g/km 정수(전기는 0) */
  co2: number;
  /** cc(2001-03 전 등록만) */
  engineCc: number;
  /** 파운드(2017-04 이후 등록·이후 면허만) */
  listPrice: number;
  /** 2017-04 이후 등록: 첫 면허인지 */
  payment: Payment;
}

export interface Result {
  era: Era;
  /** 12개월 한 번(= 12개월 Direct Debit 한 번) 파운드 */
  annualPounds: number;
  /** GOV.UK 표 값 — 첫 면허는 null(12개월 한 번만) */
  pay: Pay | null;
  /** 결과를 설명하는 줄(화면용 영어) */
  rule: string;
  band?: string;
  expensive: boolean;
  /** 2026-04-01 전에 시작하는 세금 — 이 표가 아님 */
  beforeRates: boolean;
}

export function vehicleTax(i: Input): Result {
  const era = eraOf(i.registered);
  const co2 = i.fuel === "electric" ? 0 : Math.max(0, Math.round(i.co2));
  const beforeRates = i.taxFrom < RATES_FROM;
  if (era === "pre2001") {
    const small = i.fuel === "electric" || i.engineCc <= 1549;
    const g = rates.before2001.govUkPence;
    return {
      era, beforeRates, expensive: false,
      annualPounds: small ? PRE2001_SMALL : PRE2001_LARGE,
      pay: small ? g.upTo1549cc : g.over1549cc,
      rule: small ? "Registered before 1 March 2001, engine not over 1,549cc" : "Registered before 1 March 2001, engine over 1,549cc",
    };
  }
  if (era === "2001to2017") {
    const b = oldBandOf(co2);
    const early = i.registered < L_M_CUTOFF && b.before2006_03_23 !== undefined;
    const k = OLD_BANDS.find((x) => x.band === "K")!;
    return {
      era, beforeRates, expensive: false, band: b.band,
      annualPounds: early ? b.before2006_03_23! : b.pounds,
      pay: early ? k.govUkPence : b.govUkPence,
      rule: early
        ? `Band ${b.band}, registered before 23 March 2006 — charged at the Band K rate`
        : `Band ${b.band} (${bandLabel(b)})`,
    };
  }
  if (i.payment === "first") {
    const dieselNot = i.fuel === "dieselOther";
    return {
      era, beforeRates, expensive: false, pay: null,
      annualPounds: firstLicencePounds(co2, dieselNot),
      rule: `First tax payment, ${co2}g/km CO2${dieselNot ? " (diesel not meeting RDE2)" : ""}`,
    };
  }
  const expensive = isExpensive(i.listPrice, co2, i.registered, i.taxFrom);
  return {
    era, beforeRates, expensive,
    annualPounds: expensive ? EXPENSIVE_POUNDS : LATER_POUNDS,
    pay: (expensive ? P17.expensiveCar.govUkPence : P17.laterLicences.govUkPence) as Pay,
    rule: expensive
      ? `Standard rate £${LATER_POUNDS} + £${EXPENSIVE_EXTRA} expensive car supplement`
      : `Standard rate`,
  };
}

/** '1 to 50g/km' 같은 GOV.UK 표기 */
export function bandLabel(b: Band): string {
  if (b.overGkm === null) return b.upToGkm === 0 ? "0g/km" : `up to ${b.upToGkm}g/km`;
  if (b.upToGkm === null) return `over ${b.overGkm}g/km`;
  return `${b.overGkm + 1} to ${b.upToGkm}g/km`;
}

/** 펜스 → '£118.13', 파운드 정수면 '£200' */
export function gbpP(pence: number): string {
  const whole = pence % 100 === 0;
  return (pence / 100).toLocaleString("en-GB", {
    style: "currency", currency: "GBP",
    minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2,
  });
}

/** 파운드 정수 → '£5,690' */
export function gbp0(pounds: number): string {
  return gbpP(pounds * 100);
}
