/**
 * 일본 割増賃金の基礎となる1時間あたりの賃金 — 일본어판 /ja/hourly-wage-base/ 가 쓴다.
 *
 * 원문(e-Gov API 2026-10-20 확인):
 * - 労働基準法施行規則 第19条 第1項(令和8年4月1日 施行 현행) — 二号 日給 ÷ 1日の所定労働時間数,
 *   四号 月給 ÷ 月の所定労働時間数(月によって異なれば 一年間における一月平均所定労働時間数).
 * - 同 第21条 · 労働基準法 第37条 第5項 — 家族·通勤·別居·子女教育·住宅手当, 臨時の賃金,
 *   1か月を超える期間ごとの賃金은 기초에 넣지 않는다. 어떤 수당이 해당하는지는 사용자가 나눠 넣는다(도구가 판정하지 않음).
 *
 * 第19条는 端数 처리를 정하지 않는다 — 여기서는 끝수 처리하지 않은 값을 돌려주고, 화면은 銭(소수 둘째 자리)까지 잘라 보여 준다.
 */

/** 一年間における一月平均所定労働時間数 = 年間所定労働日数 × 1日の所定労働時間 ÷ 12 */
export function monthlyAverageHours(annualWorkDays: number, dailyHours: number): number {
  if (!(annualWorkDays > 0) || !(dailyHours > 0)) return 0;
  return (annualWorkDays * dailyHours) / 12;
}

/** 年間所定労働日数 = 1年の日数(365 또는 366) − 年間休日 */
export function annualWorkDays(yearDays: 365 | 366, annualHolidays: number): number {
  return Math.max(0, yearDays - Math.max(0, annualHolidays));
}

export interface MonthlyInput {
  /** 基本給(月額, 円) */
  basePay: number;
  /** 基礎に算入する手当の合計(月額, 円) */
  includedAllowances: number;
  /** 基礎から除外する手当の合計(月額, 円) — 計算には使わず、内訳の表示だけ */
  excludedAllowances: number;
  /** 月平均所定労働時間 */
  monthlyHours: number;
}

export interface HourlyResult {
  /** 割増賃金の基礎となる賃金(月額 또는 日額, 円) */
  base: number;
  /** 割った時間数 */
  hours: number;
  /** 1時間あたりの賃金(端数処理なし). 時間数が 0 なら 0 */
  hourly: number;
}

/** 月給制(第19条 四号): (基本給 + 算入する手当) ÷ 月平均所定労働時間 */
export function hourlyFromMonthly(i: MonthlyInput): HourlyResult {
  const base = Math.max(0, i.basePay) + Math.max(0, i.includedAllowances);
  const hours = i.monthlyHours;
  return { base, hours, hourly: hours > 0 ? base / hours : 0 };
}

/** 日給制(第19条 二号): 日給 ÷ 1日の所定労働時間 */
export function hourlyFromDaily(dailyPay: number, dailyHours: number): HourlyResult {
  const base = Math.max(0, dailyPay);
  return { base, hours: dailyHours, hourly: dailyHours > 0 ? base / dailyHours : 0 };
}

/** 銭(소수 둘째 자리) 미만을 잘라 표시용 문자열로 — 법령상 端数 처리가 아니라 화면 표시 */
export function formatSen(yen: number): string {
  const sen = Math.floor(yen * 100 + 1e-7) / 100;
  return sen.toLocaleString("ja-JP", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "円";
}

/** 時間数 표시 — 소수 둘째 자리까지(잘라서), 끝의 0 은 뺀다 */
export function formatHours(h: number): string {
  const v = Math.floor(h * 100 + 1e-7) / 100;
  return v.toLocaleString("ja-JP", { maximumFractionDigits: 2 }) + "時間";
}
