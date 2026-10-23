/**
 * 영국 Vehicle Excise Duty(승용차) — VERA 1994 Sch 1 Part 1AA·IA·I 와 GOV.UK vehicle-tax-rate-tables 표 값을 손으로 고정.
 * 손계산: 2021-05-01 등록 휘발유 120g/km 첫 면허 → Table 1 (110, 130] → £455 · 이후 £200(6개월 £110, DD £105, 12회 DD 합계 £210)
 *         같은 차 가격 £45,000, 2026-06-01 시작(첫 등록 6주년 전) → £640(6개월 £352) · 2027-06-01 시작이면 6주년 지나 £200
 *         2010 등록 145g/km → band F £225(6개월 £123.75, DD £118.13) · 2005 등록 240g/km → L 이지만 2006-03-23 전 → £445
 *         1999 등록 1,600cc → £375(12회 DD 합계 £393.75)
 * s.4 비율 대조: GOV.UK 표 값 = 연액 × 105%·55%·52.5% 를 1p 반올림(반은 올림)한 값과 같다 — 페이지는 표 값을 쓰고 곱하지 않는다.
 */
import { describe, it, expect } from "vitest";
import rates from "../../rates/gb/vehicle-excise-duty-2026.json";
import {
  FIRST_STANDARD, FIRST_DIESEL, OLD_BANDS, LATER_POUNDS, EXPENSIVE_POUNDS, THRESHOLD_ZERO, THRESHOLD_OTHER,
  eraOf, firstLicencePounds, oldBandOf, isExpensive, vehicleTax, bandLabel, gbpP, type Input,
} from "../gb/vehicle-tax";

const base: Input = {
  registered: "2021-05-01", taxFrom: "2026-06-01", fuel: "petrol", co2: 120, engineCc: 1500, listPrice: 25000, payment: "later",
};

describe("rates (legislation.gov.uk·gov.uk 2026-10-23·24)", () => {
  it("초안이 아니고 남은 미확인이 없다", () => {
    expect((rates as Record<string, unknown>).draft).toBeUndefined();
    expect((rates as Record<string, unknown>).notVerified).toBeUndefined();
  });
  it("첫 면허 Table 1 £10~£5,690 · Table 2 £135~£5,690", () => {
    expect(FIRST_STANDARD.map((b) => b.pounds)).toEqual([10, 115, 135, 280, 365, 405, 455, 560, 1410, 2270, 3420, 4850, 5690]);
    expect(FIRST_DIESEL.map((b) => b.pounds)).toEqual([135, 280, 365, 405, 455, 560, 1410, 2270, 3420, 4850, 5690, 5690]);
  });
  it("이후 £200 · £640 · 기준 £40,000 / £50,000", () => {
    expect(LATER_POUNDS).toBe(200);
    expect(EXPENSIVE_POUNDS).toBe(640);
    expect(THRESHOLD_OTHER).toBe(40000);
    expect(THRESHOLD_ZERO).toBe(50000);
  });
  it("band A~M £20~£790", () => {
    expect(OLD_BANDS.map((b) => b.pounds)).toEqual([20, 20, 35, 170, 200, 225, 275, 325, 360, 410, 445, 760, 790]);
  });
  it("GOV.UK 표 값은 s.4 비율 × 연액의 1p 반올림과 같다(대조용)", () => {
    const r = (pounds: number, ratio: number) => Math.round(pounds * 100 * ratio * 1000) / 1000;
    const half = (x: number) => Math.floor(x + 0.5);
    const rows: [number, { monthlyDirectDebitTotal: number; sixMonths: number | null; sixMonthsDirectDebit: number | null }][] = [
      [200, rates.post2017.laterLicences.govUkPence],
      [640, rates.post2017.expensiveCar.govUkPence],
      [230, rates.before2001.govUkPence.upTo1549cc],
      [375, rates.before2001.govUkPence.over1549cc],
      ...OLD_BANDS.map((b) => [b.pounds, b.govUkPence] as [number, typeof b.govUkPence]),
    ];
    for (const [p, g] of rows) {
      expect(g.monthlyDirectDebitTotal).toBe(half(r(p, 1.05)));
      if (g.sixMonths !== null) expect(g.sixMonths).toBe(half(r(p, 0.55)));
      if (g.sixMonthsDirectDebit !== null) expect(g.sixMonthsDirectDebit).toBe(half(r(p, 0.525)));
    }
  });
});

describe("체계 나누기", () => {
  it("2017-04-01 · 2001-03-01 경계", () => {
    expect(eraOf("2017-04-01")).toBe("post2017");
    expect(eraOf("2017-03-31")).toBe("2001to2017");
    expect(eraOf("2001-03-01")).toBe("2001to2017");
    expect(eraOf("2001-02-28")).toBe("pre2001");
  });
});

describe("첫 면허 (para 1GC)", () => {
  it("0g/km £10 · 1g £115 · 50g £115 · 51g £135 · 255g £4,850 · 256g £5,690", () => {
    expect(firstLicencePounds(0, false)).toBe(10);
    expect(firstLicencePounds(1, false)).toBe(115);
    expect(firstLicencePounds(50, false)).toBe(115);
    expect(firstLicencePounds(51, false)).toBe(135);
    expect(firstLicencePounds(120, false)).toBe(455);
    expect(firstLicencePounds(255, false)).toBe(4850);
    expect(firstLicencePounds(256, false)).toBe(5690);
  });
  it("RDE2 미충족 경유: 0~50g £135 · 120g £560", () => {
    expect(firstLicencePounds(0, true)).toBe(135);
    expect(firstLicencePounds(50, true)).toBe(135);
    expect(firstLicencePounds(120, true)).toBe(560);
  });
  it("첫 면허는 12개월만, 가격과 무관", () => {
    const r = vehicleTax({ ...base, payment: "first", listPrice: 90000 });
    expect(r.annualPounds).toBe(455);
    expect(r.pay).toBeNull();
    expect(r.expensive).toBe(false);
  });
});

describe("이후 면허 (para 1GD·1GE)", () => {
  it("£200 과 GOV.UK 표", () => {
    const r = vehicleTax(base);
    expect(r.annualPounds).toBe(200);
    expect(r.pay).toEqual({ monthlyDirectDebitTotal: 21000, sixMonths: 11000, sixMonthsDirectDebit: 10500 });
  });
  it("£45,000 · 6주년 전 → £640(6개월 £352) · 6주년 당일부터 £200", () => {
    const r = vehicleTax({ ...base, listPrice: 45000 });
    expect(r.annualPounds).toBe(640);
    expect(r.pay!.sixMonths).toBe(35200);
    expect(vehicleTax({ ...base, listPrice: 45000, taxFrom: "2027-06-01" }).annualPounds).toBe(200);
    expect(isExpensive(45000, 120, "2020-05-01", "2026-04-30")).toBe(true);
    expect(isExpensive(45000, 120, "2020-05-01", "2026-05-01")).toBe(false);
  });
  it("가격이 기준과 같으면 해당 없음 · 초과면 해당", () => {
    expect(isExpensive(40000, 120, "2022-01-01", "2026-06-01")).toBe(false);
    expect(isExpensive(40001, 120, "2022-01-01", "2026-06-01")).toBe(true);
  });
  it("0g/km: 기준 £50,000, 2025-04-01 전 등록은 제외", () => {
    expect(isExpensive(45000, 0, "2025-06-01", "2026-06-01")).toBe(false);
    expect(isExpensive(55000, 0, "2025-06-01", "2026-06-01")).toBe(true);
    expect(isExpensive(55000, 0, "2025-03-31", "2026-06-01")).toBe(false);
    expect(vehicleTax({ ...base, fuel: "electric", registered: "2025-04-01", listPrice: 60000 }).annualPounds).toBe(640);
  });
});

describe("2001~2017 등록 (para 1B)", () => {
  it("145g/km → F £225, 6개월 £123.75, DD £118.13", () => {
    const r = vehicleTax({ ...base, registered: "2010-06-01", co2: 145 });
    expect(r.band).toBe("F");
    expect(r.annualPounds).toBe(225);
    expect(r.pay).toEqual({ monthlyDirectDebitTotal: 23625, sixMonths: 12375, sixMonthsDirectDebit: 11813 });
  });
  it("band A~C 6개월 N/A", () => {
    const r = vehicleTax({ ...base, registered: "2012-01-01", co2: 115 });
    expect(r.band).toBe("C");
    expect(r.annualPounds).toBe(35);
    expect(r.pay!.sixMonths).toBeNull();
  });
  it("2006-03-23 전 등록 L·M → £445(K 행) · 그 뒤는 £760", () => {
    expect(vehicleTax({ ...base, registered: "2005-01-01", co2: 240 }).annualPounds).toBe(445);
    expect(vehicleTax({ ...base, registered: "2005-01-01", co2: 240 }).pay!.sixMonths).toBe(24475);
    expect(vehicleTax({ ...base, registered: "2006-03-23", co2: 240 }).annualPounds).toBe(760);
  });
  it("경계 100g A · 101g B · 전기 0g A £20", () => {
    expect(oldBandOf(100).band).toBe("A");
    expect(oldBandOf(101).band).toBe("B");
    expect(vehicleTax({ ...base, registered: "2014-01-01", fuel: "electric", co2: 99 }).annualPounds).toBe(20);
  });
});

describe("2001 전 등록 (para 1)", () => {
  it("1,549cc £230 · 1,550cc £375(12회 DD £393.75)", () => {
    expect(vehicleTax({ ...base, registered: "1999-01-01", engineCc: 1549 }).annualPounds).toBe(230);
    const r = vehicleTax({ ...base, registered: "1999-01-01", engineCc: 1550 });
    expect(r.annualPounds).toBe(375);
    expect(r.pay!.monthlyDirectDebitTotal).toBe(39375);
  });
});

describe("표기", () => {
  it("bandLabel · gbpP", () => {
    expect(bandLabel(FIRST_STANDARD[0])).toBe("0g/km");
    expect(bandLabel(FIRST_STANDARD[1])).toBe("1 to 50g/km");
    expect(bandLabel(FIRST_STANDARD[12])).toBe("over 255g/km");
    expect(bandLabel(OLD_BANDS[0])).toBe("up to 100g/km");
    expect(gbpP(11813)).toBe("£118.13");
    expect(gbpP(569000)).toBe("£5,690");
  });
  it("2026-04-01 전 시작은 표시", () => {
    expect(vehicleTax({ ...base, taxFrom: "2026-03-31" }).beforeRates).toBe(true);
  });
});
