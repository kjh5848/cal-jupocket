/**
 * 일본 割増賃金(残業代) — 일본어판 /ja/overtime-pay/ 가 쓴다. 근거는 rates/jp/overtime-2026.json.
 *
 * 원문(e-Gov API 2026-10-20 확인):
 * - 労働基準法 第37条 第1項 — 時間外·休日 割増, 政令(平成六年政令第五号)이 時間外 2割5分·休日 3割5分.
 *   ただし書 — 1か月 60時間을 넘은 時間外는 5割.
 * - 同 第4項 — 午後10時〜午前5時 深夜 2割5分.
 * - 労働基準法施行規則 第20条 — 時間外 + 深夜 5割(60時間 넘는 분은 7割5分), 休日 + 深夜 6割.
 *   → 0.25 + 0.25 · 0.5 + 0.25 · 0.35 + 0.25 와 같으므로, 深夜 시간을 따로 받아 0.25 를 더하면
 *     深夜가 60時間 앞인지 뒤인지 묻지 않아도 第20条 값과 같다.
 * - 厚生労働省 리플릿(2022.4) — 60時間 산정에 法定休日 노동은 넣지 않는다(法定休日 시간은 holidayHours 로 따로).
 *
 * 조문에 端数 처리 규정이 없다 — 끝수 처리하지 않은 값을 돌려주고, 화면이 표시만 정한다.
 */

export const RATE_OVERTIME = 0.25;
export const RATE_OVERTIME_OVER60 = 0.5;
export const RATE_HOLIDAY = 0.35;
export const RATE_NIGHT = 0.25;
export const OVER60_THRESHOLD = 60;

export interface OvertimeInput {
  /** 割増賃金の基礎となる1時間あたりの賃金(円) */
  hourly: number;
  /** 法定時間外労働の月合計(法定休日の労働は除く) */
  overtimeHours: number;
  /** 法定休日の労働時間 */
  holidayHours: number;
  /** 午後10時〜午前5時の労働時間(所定内·時間外·休日すべて) */
  nightHours: number;
}

export interface OvertimeRow {
  key: "overtime" | "over60" | "holiday" | "night";
  hours: number;
  rate: number;
  /** 割増分 = hourly × hours × rate (端数処理なし) */
  premium: number;
}

export interface OvertimeResult {
  rows: OvertimeRow[];
  /** 割増分の合計 */
  premium: number;
  /** 時間外·休日の時間に対する通常の賃金(hourly × (時間外 + 休日)) — 深夜は含めない */
  baseForExtraHours: number;
  /** premium + baseForExtraHours */
  total: number;
}

const pos = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

export function overtimePay(i: OvertimeInput): OvertimeResult {
  const hourly = pos(i.hourly);
  const ot = pos(i.overtimeHours);
  const within = Math.min(ot, OVER60_THRESHOLD);
  const over60 = Math.max(0, ot - OVER60_THRESHOLD);
  const holiday = pos(i.holidayHours);
  const night = pos(i.nightHours);
  const rows: OvertimeRow[] = [
    { key: "overtime", hours: within, rate: RATE_OVERTIME, premium: hourly * within * RATE_OVERTIME },
    { key: "over60", hours: over60, rate: RATE_OVERTIME_OVER60, premium: hourly * over60 * RATE_OVERTIME_OVER60 },
    { key: "holiday", hours: holiday, rate: RATE_HOLIDAY, premium: hourly * holiday * RATE_HOLIDAY },
    { key: "night", hours: night, rate: RATE_NIGHT, premium: hourly * night * RATE_NIGHT },
  ];
  const premium = rows.reduce((s, r) => s + r.premium, 0);
  const baseForExtraHours = hourly * (ot + holiday);
  return { rows, premium, baseForExtraHours, total: premium + baseForExtraHours };
}

/** 1円未満を切り捨てた表示用の円 — 법령상 端数 처리가 아니라 화면 표시 */
export function formatYenFloor(yen: number): string {
  return Math.floor(yen + 1e-7).toLocaleString("ja-JP") + "円";
}
