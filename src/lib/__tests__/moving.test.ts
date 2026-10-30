/**
 * 이사 시리즈 — 손없는날 음력 표(천문연)와 법정 기한 숫자(rates/moving-2026.json)를 원문 예시로 고정한다.
 * 제목·설명에 쓰는 숫자가 계산·rates 와 맞는지도 본다(제목은 guide-meta 가 문자열로 읽어 리터럴로 둔다).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import m from "../../rates/moving-2026.json";
import lunar from "../../rates/lunar-2026.json";
import holidays from "../../rates/kr-holidays-2026.json";
import { toLunar, isSonDay, sonDays, coveredMonths, leaseReportRequired } from "../moving";
import { movingSeries } from "../../data/series/moving";

describe("음력 표 — 천문연 음양력 변환 조회값", () => {
  it("달이 끊김 없이 이어진다(윤달 없음)", () => {
    for (let i = 1; i < lunar.months.length; i++) {
      const a = lunar.months[i - 1];
      const next = new Date(Date.parse(`${a.solarStart}T00:00:00Z`) + a.days * 86_400_000).toISOString().slice(0, 10);
      expect(lunar.months[i].solarStart, `${a.lunarYear}.${a.lunarMonth} 다음`).toBe(next);
    }
  });

  it("천문연 양력→음력 조회(/life/solc)로 따로 대조한 날", () => {
    expect(toLunar("2026-11-08")).toEqual({ year: 2026, month: 9, day: 29, leap: false });
    expect(toLunar("2026-11-18")).toEqual({ year: 2026, month: 10, day: 10, leap: false });
    expect(toLunar("2026-11-28")).toEqual({ year: 2026, month: 10, day: 20, leap: false });
    expect(toLunar("2026-12-17")).toEqual({ year: 2026, month: 11, day: 9, leap: false });
    expect(toLunar("2027-01-07")).toEqual({ year: 2026, month: 11, day: 30, leap: false });
    expect(toLunar("2026-11-01").day).toBe(22);
  });

  it("관공서 공휴일 표의 음력 명절과 맞는다(설날·부처님 오신 날·추석)", () => {
    const by = new Map(holidays.holidays.map((h) => [h.name + h.date.slice(0, 4), h.date]));
    expect(toLunar(by.get("설날2027")!)).toMatchObject({ month: 1, day: 1 });
    expect(toLunar(by.get("설날 전날2027")!)).toMatchObject({ month: 12, day: 30 });
    expect(toLunar(by.get("부처님 오신 날2027")!)).toMatchObject({ month: 4, day: 8 });
    expect(toLunar(by.get("추석2027")!)).toMatchObject({ month: 8, day: 15 });
  });

  it("표 밖은 내지 않는다", () => {
    expect(() => toLunar("2026-10-10")).toThrow();
    expect(() => toLunar("2028-01-27")).toThrow();
    expect(() => sonDays(2026, 10)).toThrow();
  });
});

describe("손없는날", () => {
  it("2026년 11월은 8·17·18·27·28일", () => {
    expect(sonDays(2026, 11).map((d) => d.day)).toEqual([8, 17, 18, 27, 28]);
    expect(isSonDay("2026-11-18")).toBe(true);
    expect(isSonDay("2026-11-19")).toBe(false);
  });

  it("2026년 12월은 7·8·17·18·27·28일, 12월 25일은 공휴일 표시", () => {
    expect(sonDays(2026, 12).map((d) => d.day)).toEqual([7, 8, 17, 18, 27, 28]);
  });

  it("작은달(29일)에는 30일이 없다 — 음력 2027년 1월", () => {
    // 음 1월은 2027-02-07 시작 29일 → 음 1.29 = 03-07, 음 2.09 = 03-16
    expect(sonDays(2027, 3).map((d) => d.day)).toEqual([7, 16, 17, 26, 27]);
  });

  it("주말·공휴일 표시", () => {
    const nov = sonDays(2026, 11);
    expect(nov.find((d) => d.day === 8)).toMatchObject({ weekday: "일", offDay: true });
    expect(nov.find((d) => d.day === 17)).toMatchObject({ weekday: "화", offDay: false });
    expect(nov.find((d) => d.day === 28)).toMatchObject({ weekday: "토", offDay: true });
  });

  it("표가 덮는 달은 2026년 11월 ~ 2027년 12월", () => {
    const c = coveredMonths();
    expect(c[0]).toEqual({ year: 2026, month: 11 });
    expect(c[c.length - 1]).toEqual({ year: 2027, month: 12 });
    expect(c.length).toBe(14);
  });
});

describe("법정 기한 — 국가법령정보센터 원문", () => {
  it("주민등록법 제16조 ① 14일, 제40조 ④ 5만원 이하", () => {
    expect(m.moveIn.reportDays).toBe(14);
    expect(m.moveIn.fineMax).toBe(50_000);
    expect(m.moveIn.deemedLaws).toContain("병역법");
    expect(m.moveIn.deemedLaws).toContain("민방위기본법");
  });

  it("확정일자에는 법정 기한이 없다(주택임대차보호법 제3조의2 ②·제3조의6)", () => {
    expect(m.lease.fixedDateDeadline).toBeNull();
  });

  it("임대차 신고 — 30일, 보증금 6천만원 초과 또는 월 30만원 초과, 과태료 100만원 이하", () => {
    expect(m.leaseReport.days).toBe(30);
    expect(m.leaseReport.fineMax).toBe(1_000_000);
    expect(leaseReportRequired(60_000_000, 300_000)).toBe(false); // 둘 다 '초과' 아님
    expect(leaseReportRequired(60_000_001, 0)).toBe(true);
    expect(leaseReportRequired(10_000_000, 300_001)).toBe(true);
  });
});

describe("이사 시리즈 제목·설명의 숫자", () => {
  const nov = sonDays(2026, 11).map((d) => `${d.day}`);
  const dec = sonDays(2026, 12).map((d) => `${d.day}`);
  const allowed = new Set([
    ...nov,
    ...dec,
    ...nov.map((d) => `${d}일`),
    ...dec.map((d) => `${d}일`),
    "9",
    "10",
    "19",
    "20",
    "29",
    "30",
    "0",
    "0일", // 음력 끝자리 9·0일
    "30일", // 음력 30일
    "2026",
    "2027",
    "11",
    "12",
    `${m.moveIn.reportDays}`,
    `${m.moveIn.reportDays}일`,
    `${m.leaseReport.days}일`,
    `${m.moveIn.fineMax / 10_000}만원`,
    `${m.leaseReport.depositOver / 10_000_000}천만원`,
    `${m.leaseReport.monthlyRentOver / 10_000}만원`,
  ]);
  for (const s of [movingSeries.hub, ...movingSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title.replace(/\s/g, "")).toContain(s.keyword.replace(/\s/g, ""));
      for (const x of head.matchAll(/\d[\d,.]*(?:일|만원|천만원)?/g)) expect(allowed.has(x[0]), x[0]).toBe(true);
    });
  }
});
