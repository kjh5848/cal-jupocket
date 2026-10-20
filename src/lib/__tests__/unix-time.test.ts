/**
 * 유닉스 타임스탬프 변환 — 기대값은 Python datetime(1970-01-01 UTC + timedelta)으로 따로 계산했다.
 * 규칙: rates/unix-time-2026.json(POSIX 4.19 하루 86400초 · 표준시법 동경 135도 = UTC+9).
 */
import { describe, it, expect } from "vitest";
import rates from "../../rates/unix-time-2026.json";
import { toDay } from "../date-calc";
import {
  KST, INT32_MAX, MIN_MS, MAX_MS,
  parseTimestamp, toParts, koText, isoText, secondsText, floorSeconds, fromParts, relativeText, dateValue, timeValue,
  jaText, relativeTextJa, enText, relativeTextEn,
} from "../unix-time";

const ok = (raw: string, unit?: "auto" | "s" | "ms") => {
  const r = parseTimestamp(raw, unit);
  if (!r.ok) throw new Error(`${raw}: ${r.error}`);
  return r;
};

describe("원문 숫자", () => {
  it("KST = 동경 135도 ÷ 15 = UTC+9, 하루 86400초", () => {
    expect(KST).toBe((135 / 15) * 60);
    expect(rates.secondsPerDay).toBe(86_400);
    expect(rates.sources.length).toBeGreaterThanOrEqual(2);
  });
});

describe("타임스탬프 → 날짜·시각", () => {
  it("0 은 1970-01-01 00:00:00 UTC, 한국 09:00 목요일", () => {
    const r = ok("0");
    expect(r).toEqual({ ok: true, ms: 0, unit: "s" });
    expect(isoText(0, 0)).toBe("1970-01-01T00:00:00.000Z");
    expect(koText(toParts(0, KST))).toBe("1970년 1월 1일 (목) 09:00:00");
  });
  it("2147483647(32비트 끝) = 2038-01-19 03:14:07 UTC · 12:14:07 KST", () => {
    const r = ok(String(INT32_MAX));
    expect(r.ms).toBe(2_147_483_647_000);
    expect(isoText(r.ms, 0)).toBe("2038-01-19T03:14:07.000Z");
    expect(koText(toParts(r.ms, KST))).toBe("2038년 1월 19일 (화) 12:14:07");
    expect(isoText(r.ms, KST)).toBe("2038-01-19T12:14:07.000+09:00");
  });
  it("13자리는 밀리초 — 1760000000123 = 2025-10-09 08:53:20.123 UTC", () => {
    const r = ok("1760000000123");
    expect(r.unit).toBe("ms");
    expect(isoText(r.ms, 0)).toBe("2025-10-09T08:53:20.123Z");
    expect(koText(toParts(r.ms, KST))).toBe("2025년 10월 9일 (목) 17:53:20.123");
    expect(secondsText(r.ms)).toBe("1760000000.123");
  });
  it("음수는 버림 — −1ms = 1969-12-31 23:59:59.999, −1초 = 23:59:59", () => {
    expect(isoText(ok("-1", "ms").ms, 0)).toBe("1969-12-31T23:59:59.999Z");
    expect(secondsText(-1)).toBe("-0.001");
    expect(floorSeconds(-1)).toBe(-1);
    const r = ok("-1");
    expect(r.ms).toBe(-1000);
    expect(isoText(r.ms, 0)).toBe("1969-12-31T23:59:59.000Z");
    expect(koText(toParts(r.ms, KST))).toBe("1970년 1월 1일 (목) 08:59:59");
  });
  it("소수 초는 곱셈 없이 자릿수로 — 1792380896.789 → 1792380896789", () => {
    expect(ok("1792380896.789").ms).toBe(1_792_380_896_789);
    expect(ok("1792380896.7").ms).toBe(1_792_380_896_700);
    expect(ok("0.001").ms).toBe(1);
    expect(ok("-0.5").ms).toBe(-500);
  });
  it("쉼표·공백·밑줄은 지우고 읽는다", () => {
    expect(ok("1,704,067,200").ms).toBe(1_704_067_200_000);
    expect(ok(" 1 704 067 200 ").ms).toBe(1_704_067_200_000);
    expect(ok("1_704_067_200_000").unit).toBe("ms");
  });
  it("자동 판별: 11자리 이하 초, 12자리 이상 밀리초(앞자리 0 은 세지 않음)", () => {
    expect(ok("99999999999").unit).toBe("s");
    expect(isoText(ok("99999999999").ms, 0)).toBe("5138-11-16T09:46:39.000Z");
    expect(ok("100000000000").unit).toBe("ms");
    expect(ok("000000000001").unit).toBe("s");
    expect(ok("1704067200", "ms").ms).toBe(1_704_067_200);
  });
  it("못 읽는 값은 이유와 함께 거절", () => {
    expect(parseTimestamp("")).toEqual({ ok: false, error: "empty" });
    expect(parseTimestamp("abc")).toEqual({ ok: false, error: "format" });
    expect(parseTimestamp("1e9")).toEqual({ ok: false, error: "format" });
    expect(parseTimestamp("1.5", "ms")).toEqual({ ok: false, error: "ms-fraction" });
    expect(parseTimestamp("1.2345")).toEqual({ ok: false, error: "too-precise" });
    expect(parseTimestamp("-2208988801")).toEqual({ ok: false, error: "range" });
    expect(parseTimestamp("99999999999999999")).toEqual({ ok: false, error: "range" });
  });
  it("범위 끝: 1900-01-01 00:00 UTC(월요일) ~ 9999-12-30 23:59:59.999 UTC", () => {
    expect(MIN_MS).toBe(-2_208_988_800_000);
    expect(ok("-2208988800").ms).toBe(MIN_MS);
    expect(koText(toParts(MIN_MS, 0))).toBe("1900년 1월 1일 (월) 00:00:00");
    expect(MAX_MS).toBe(253_402_214_400_000 - 1);
    expect(isoText(MAX_MS, KST)).toBe("9999-12-31T08:59:59.999+09:00");
  });
});

describe("날짜·시각 → 타임스탬프", () => {
  it("2026-10-19 12:34:56.789 KST = 1792380896789, 같은 시각 UTC = 1792413296789", () => {
    expect(fromParts("2026-10-19", "12:34:56", 789, KST)).toBe(1_792_380_896_789);
    expect(fromParts("2026-10-19", "12:34:56", 789, 0)).toBe(1_792_413_296_789);
  });
  it("UTC 0시는 날짜 요일 계산기의 Unix 값(날짜 일련번호 × 86400)과 같다", () => {
    for (const d of ["2000-02-29", "1970-01-01", "1900-01-01", "2026-10-19"]) {
      expect(fromParts(d, "00:00", 0, 0)).toBe(toDay(d)! * 86_400_000);
    }
    expect(fromParts("2000-02-29", "00:00", 0, 0)).toBe(951_782_400_000);
  });
  it("한국 1900-01-01 09:00 = UTC 0시, 08:59 는 범위 밖", () => {
    expect(fromParts("1900-01-01", "09:00", 0, KST)).toBe(MIN_MS);
    expect(fromParts("1900-01-01", "08:59:59", 0, KST)).toBeNull();
  });
  it("없는 날짜·시각은 null", () => {
    expect(fromParts("2026-02-29", "00:00", 0, KST)).toBeNull();
    expect(fromParts("2026-10-19", "24:00", 0, KST)).toBeNull();
    expect(fromParts("2026-10-19", "12:00", 1000, KST)).toBeNull();
    expect(fromParts("2026-10-19", "12:00", 1.5, KST)).toBeNull();
  });
  it("왕복: 날짜 칸 → 밀리초 → 다시 날짜 칸", () => {
    for (const off of [KST, 0, -300, 345]) {
      const ms = fromParts("2024-02-29", "23:59:58", 7, off)!;
      const p = toParts(ms, off);
      expect([dateValue(p), timeValue(p), p.ms]).toEqual(["2024-02-29", "23:59:58", 7]);
    }
  });
});

describe("지금과의 차이", () => {
  it("전·후와 단위", () => {
    expect(relativeText(500)).toBe("지금");
    expect(relativeText(-45_000)).toBe("45초 전");
    expect(relativeText(90_000)).toBe("1분 30초 후");
    expect(relativeText(120_000)).toBe("2분 후");
    expect(relativeText(-(3 * 86_400 + 4 * 3600 + 5 * 60) * 1000)).toBe("3일 4시간 5분 전");
    expect(relativeText(400 * 86_400_000)).toBe("400일 후");
  });
});

describe("일본어판 표기 (/ja/tools/unix-time/)", () => {
  it("日本時間 = UTC+9 — 2026-10-19 12:34:56 JST, 0 は 1970年1月1日（木）09:00:00", () => {
    expect(jaText(toParts(1_792_380_896_000, KST))).toBe("2026年10月19日（月）12:34:56");
    expect(jaText(toParts(0, KST))).toBe("1970年1月1日（木）09:00:00");
    expect(jaText(toParts(-1, 0))).toBe("1969年12月31日（水）23:59:59.999");
    expect(jaText(toParts(INT32_MAX * 1000, KST))).toBe("2038年1月19日（火）12:14:07");
  });
  it("前・後と単位", () => {
    expect(relativeTextJa(500)).toBe("今");
    expect(relativeTextJa(-45_000)).toBe("45秒前");
    expect(relativeTextJa(90_000)).toBe("1分30秒後");
    expect(relativeTextJa(-(3 * 86_400 + 4 * 3600 + 5 * 60) * 1000)).toBe("3日4時間5分前");
    expect(relativeTextJa(400 * 86_400_000)).toBe("400日後");
  });
});

describe("영어판 표기 (/en-us/tools/unix-time/)", () => {
  it("UTC 와 페이지 언어 순서 — en-US 'Mon, Oct 19, 2026', en-GB 'Mon, 19 Oct 2026'", () => {
    expect(enText(toParts(1_792_380_896_000, 0))).toBe("Mon, Oct 19, 2026 03:34:56");
    expect(enText(toParts(0, 0))).toBe("Thu, Jan 1, 1970 00:00:00");
    expect(enText(toParts(-1, 0))).toBe("Wed, Dec 31, 1969 23:59:59.999");
    expect(enText(toParts(INT32_MAX * 1000, 0))).toBe("Tue, Jan 19, 2038 03:14:07");
    expect(enText(toParts(MIN_MS, 0))).toBe("Mon, Jan 1, 1900 00:00:00");
    expect(enText(toParts(0, 0), "en-GB")).toBe("Thu, 1 Jan 1970 00:00:00");
  });
  it("ago · from now 와 단위", () => {
    expect(relativeTextEn(500)).toBe("now");
    expect(relativeTextEn(-45_000)).toBe("45 seconds ago");
    expect(relativeTextEn(-1_000)).toBe("1 second ago");
    expect(relativeTextEn(90_000)).toBe("1 minute 30 seconds from now");
    expect(relativeTextEn(-(3 * 86_400 + 4 * 3600 + 5 * 60) * 1000)).toBe("3 days 4 hours 5 minutes ago");
    expect(relativeTextEn(1_400 * 86_400_000)).toBe("1,400 days from now");
  });
});
