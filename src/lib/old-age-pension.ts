/**
 * 노령연금 — 수급 자격·나이·지급률·소득 감액. 금액(기본연금액·A값)은 다루지 않고 비율만 낸다.
 *
 *   자격       가입기간 10년 이상                           국민연금법 제61조 ①
 *   나이       60세 + 출생연도별 1~5세                       부칙 <법률 제8541호> 제8조
 *   지급률     20년 이상 100%, 10~20년 50% + 1년마다 5%      제63조 ①
 *   조기       최대 5년 앞당김, 1년마다 6% 감액              제61조 ②·제63조 ②
 *   연기       최대 5년, 매월 0.6% 가산                      제62조, 부칙 <제11143호> 제6조
 *   소득 감액  초과소득월액 200만원부터 구간별, 연금액 1/2 한도  제63조의2(2026. 6. 17. 시행)
 *
 * 수급 나이·조기·연기 지급률은 pension-timing.ts 를 그대로 쓴다.
 */
import r from "../rates/pension-2026.json";
import { earlyRate, deferredRate, startAgeForBirthYear } from "./pension-timing";

const P = r.partialCoverage;
const fl = (v: number) => Math.floor(v + 1e-6);

/** 가입기간(년, 소수 가능)에 따른 기본연금액 대비 지급 비율 — 10년 미만이면 0(노령연금 없음) */
export function coverageRate(years: number): number {
  if (years < r.minCoverageYears) return 0;
  if (years >= P.full) return 1;
  const months = Math.floor(years * 12 + 1e-9) - r.minCoverageYears * 12;
  return Math.round((P.baseRate + (P.perYear * months) / 12) * 10000) / 10000;
}

/** 출생연도 → 수급 나이, 조기 가능 최저 나이, 연기 최대 나이 */
export function pensionAges(birthYear: number) {
  const { startAge, earliestAge } = startAgeForBirthYear(birthYear);
  return { startAge, earliestAge, latestAge: startAge + r.deferredPension.maxYearsDeferred };
}

/** 몇 살부터 받기 시작하느냐에 따른 지급률(정상 = 1). 조기 최저 나이보다 이르면 null */
export function rateAtStart(birthYear: number, age: number): number | null {
  const { startAge, earliestAge, latestAge } = pensionAges(birthYear);
  if (age < earliestAge) return null;
  if (age < startAge) return earlyRate(startAge - age);
  if (age === startAge) return 1;
  return deferredRate(Math.min(age, latestAge) - startAge);
}

/** 소득 감액액 — 초과소득월액(소득월액 − A값) 구간별, 노령연금액(부양가족연금액 제외)의 2분의 1 한도 */
export function earningsReduction(excessMonthly: number, pension: number): number {
  const b = [...r.earningsReduction.brackets].reverse().find((x) => excessMonthly >= x.from);
  if (!b) return 0;
  const cut = fl(b.base + (excessMonthly - b.from) * b.rate);
  return Math.min(cut, fl(Math.max(0, pension) * r.earningsReduction.cap));
}
