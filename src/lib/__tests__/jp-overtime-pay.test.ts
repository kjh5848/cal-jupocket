/**
 * 일본 割増賃金 — 労働基準法 第37条·割増賃金令·施行規則 第20条(e-Gov 2026-10-20 확인).
 * 손계산:
 * - 時給 2,000円 時間外 1時間 深夜 1時間 → 2,000 × (0.25 + 0.25) = 1,000円 = 第20条 5割.
 * - 時給 2,000円 時間外 61時間 중 深夜 1時間(60時間 뒤) → 60h × 500 + 1h × 1,000 + 深夜 1h × 500
 *   = 30,000 + 1,000 + 500 = 31,500円. 60時間 넘는 1時間 몫은 1,000 + 500 = 1,500 = 2,000 × 0.75(第20条 7割5分).
 * - 時給 2,000円 休日 1時間 深夜 1時間 → 2,000 × (0.35 + 0.25) = 1,200円 = 第20条 6割.
 * - 時給 1,530.612…円(250,000 ÷ 163.333…, /ja/hourly-wage-base/ 예시) 時間外 20時間 →
 *   250,000 × 12 / 1,960 × 20 × 0.25 = 7,653.06…円.
 */
import { describe, it, expect } from "vitest";
import { overtimePay, formatYenFloor } from "../jp/overtime-pay";

describe("割増賃金 (労働基準法 第37条·施行規則 第20条)", () => {
  it("時間外 + 深夜 = 5割", () => {
    const r = overtimePay({ hourly: 2000, overtimeHours: 1, holidayHours: 0, nightHours: 1 });
    expect(r.premium).toBe(1000);
    expect(r.premium / 2000).toBe(0.5);
    expect(r.baseForExtraHours).toBe(2000);
    expect(r.total).toBe(3000);
  });

  it("60時間を超えた時間外 + 深夜 = 7割5分", () => {
    const r = overtimePay({ hourly: 2000, overtimeHours: 61, holidayHours: 0, nightHours: 1 });
    expect(r.rows.find((x) => x.key === "overtime")!.hours).toBe(60);
    expect(r.rows.find((x) => x.key === "over60")!.hours).toBe(1);
    expect(r.premium).toBe(31500);
    const over60Hour = 2000 * 0.5 + 2000 * 0.25;
    expect(over60Hour / 2000).toBe(0.75);
  });

  it("休日 + 深夜 = 6割", () => {
    const r = overtimePay({ hourly: 2000, overtimeHours: 0, holidayHours: 1, nightHours: 1 });
    expect(r.premium).toBeCloseTo(1200, 9);
    expect(r.baseForExtraHours).toBe(2000);
  });

  it("所定内の深夜だけなら通常の賃金は足さない", () => {
    const r = overtimePay({ hourly: 1200, overtimeHours: 0, holidayHours: 0, nightHours: 10 });
    expect(r.premium).toBe(3000);
    expect(r.baseForExtraHours).toBe(0);
    expect(r.total).toBe(3000);
  });

  it("1,530.61円 × 20時間 × 25% = 7,653.06…円", () => {
    const hourly = 250000 / ((245 * 8) / 12);
    const r = overtimePay({ hourly, overtimeHours: 20, holidayHours: 0, nightHours: 0 });
    expect(r.premium).toBeCloseTo(7653.0612, 3);
    expect(formatYenFloor(r.premium)).toBe("7,653円");
  });

  it("負の値·NaN は 0 として扱う", () => {
    const r = overtimePay({ hourly: -1, overtimeHours: NaN, holidayHours: -3, nightHours: 2 });
    expect(r.total).toBe(0);
  });
});
