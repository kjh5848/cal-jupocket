/**
 * 시간 계산기 — 기대값은 Python datetime(+ timedelta)으로 따로 계산했다(roberin 숫자를 정답으로 쓰지 않음).
 * 서머타임 없는 벽시계 산술이라 기기 시간대와 상관없이 같아야 한다(TZ=America/New_York 에서도 확인).
 */
import { describe, it, expect } from "vitest";
import {
  MIN_AT, MAX_AT, parseAt, toMinutes, shiftAt, split, splitText, atParts, atText, ampmText, dayShiftText, between, hoursText,
} from "../time-calc";

const at = (date: string, time: string) => {
  const v = parseAt(date, time);
  if (v === null) throw new Error(`${date} ${time}`);
  return v;
};
const add = (date: string, time: string, sign: 1 | -1, d: string, h: string, m: string) => {
  const r = shiftAt(at(date, time), toMinutes(d, h, m)!, sign);
  if (r === null) throw new Error("range");
  return atParts(r);
};

describe("시작 일시 ± 일·시간·분", () => {
  it("09:30 + 2시간 45분 = 같은 날 12:15 (월)", () => {
    expect(add("2026-10-19", "09:30", 1, "0", "2", "45")).toEqual({ date: "2026-10-19", time: "12:15", wd: 1 });
  });
  it("윤년 2024-02-28 23:00 + 1일 1시간 = 2024-03-01 00:00 (금)", () => {
    expect(add("2024-02-28", "23:00", 1, "1", "1", "0")).toEqual({ date: "2024-03-01", time: "00:00", wd: 5 });
  });
  it("2026-01-01 00:10 − 30분 = 2025-12-31 23:40 (수) — 해 넘김", () => {
    expect(add("2026-01-01", "00:10", -1, "0", "0", "30")).toEqual({ date: "2025-12-31", time: "23:40", wd: 3 });
  });
  it("30시간 90분처럼 넘친 값도 그대로 더한다 = 1일 7시간 30분", () => {
    expect(toMinutes("0", "30", "90")).toBe(1890);
    expect(splitText(1890)).toBe("1일 7시간 30분");
    expect(add("2026-10-19", "10:00", 1, "0", "30", "90")).toEqual({ date: "2026-10-20", time: "17:30", wd: 2 });
  });
  it("2026-03-01 − 365일 = 2025-03-01 (토)", () => {
    expect(add("2026-03-01", "00:00", -1, "365", "", "")).toEqual({ date: "2025-03-01", time: "00:00", wd: 6 });
  });
  it("범위 끝 9999-12-30 23:59 까지, 넘으면 null", () => {
    expect(add("9999-12-30", "23:00", 1, "0", "0", "59")).toEqual({ date: "9999-12-30", time: "23:59", wd: 4 });
    expect(shiftAt(at("9999-12-30", "23:00"), 60, 1)).toBeNull();
    expect(shiftAt(at("1900-01-01", "00:00"), 1, -1)).toBeNull();
    expect(MAX_AT - MIN_AT + 1).toBe((at("9999-12-30", "00:00") - at("1900-01-01", "00:00")) + 1440);
  });
});

describe("입력 검사", () => {
  it("없는 날짜·시각은 null", () => {
    expect(parseAt("2026-02-29", "10:00")).toBeNull();
    expect(parseAt("2026-10-19", "24:00")).toBeNull();
    expect(parseAt("2026-10-19", "10:60")).toBeNull();
    expect(parseAt("2026-10-19", "")).toBeNull();
  });
  it("초가 붙은 시각(브라우저 step)은 분까지만 읽는다", () => {
    expect(parseAt("2026-10-19", "09:30:59")).toBe(parseAt("2026-10-19", "09:30"));
  });
  it("기간은 0 이상의 정수만 — 빈 칸 0, 쉼표 허용, 음수·소수는 null", () => {
    expect(toMinutes("", "", "")).toBe(0);
    expect(toMinutes("1,000", "", "")).toBe(1_440_000);
    expect(toMinutes("-1", "", "")).toBeNull();
    expect(toMinutes("", "1.5", "")).toBeNull();
    expect(toMinutes("", "", "abc")).toBeNull();
  });
});

describe("두 일시 사이", () => {
  it("09:00 ~ 18:00 = 9시간 = 540분", () => {
    const b = between(at("2026-10-19", "09:00"), at("2026-10-19", "18:00"));
    expect(b).toEqual({ sign: 1, total: 540, split: { d: 0, h: 9, m: 0 }, hours: 9 });
  });
  it("밤샘 22:30 ~ 다음 날 06:15 = 7시간 45분 = 465분 = 7.75시간", () => {
    const b = between(at("2026-10-19", "22:30"), at("2026-10-20", "06:15"));
    expect(b.total).toBe(465);
    expect(splitText(b.total)).toBe("7시간 45분");
    expect(hoursText(b.total)).toBe("7.75");
  });
  it("끝이 더 이르면 크기는 같고 sign −1", () => {
    const b = between(at("2026-10-20", "06:15"), at("2026-10-19", "22:30"));
    expect(b.sign).toBe(-1);
    expect(b.total).toBe(465);
  });
  it("윤년 2024-02-28 08:00 ~ 03-01 08:00 = 2일 = 48시간", () => {
    const b = between(at("2024-02-28", "08:00"), at("2024-03-01", "08:00"));
    expect(b.split).toEqual({ d: 2, h: 0, m: 0 });
    expect(hoursText(b.total)).toBe("48");
  });
  it("총 시간은 소수 둘째 자리 반올림 — 100분 = 1.67", () => {
    expect(hoursText(100)).toBe("1.67");
    expect(hoursText(0)).toBe("0");
  });
});

describe("표기", () => {
  it("atText · 오전·오후 · 며칠 옮겨 갔나", () => {
    expect(atText(at("2026-10-19", "12:15"))).toBe("2026년 10월 19일 (월) 12:15");
    expect(ampmText(at("2026-10-19", "00:05"))).toBe("오전 12:05");
    expect(ampmText(at("2026-10-19", "12:05"))).toBe("오후 12:05");
    expect(ampmText(at("2026-10-19", "17:30"))).toBe("오후 5:30");
    expect(ampmText(at("1969-12-31", "09:00"))).toBe("오전 9:00");
    const s = at("2026-10-19", "10:00");
    expect(dayShiftText(s, at("2026-10-19", "23:59"))).toBe("같은 날");
    expect(dayShiftText(s, at("2026-10-20", "00:00"))).toBe("다음 날");
    expect(dayShiftText(s, at("2026-10-18", "23:00"))).toBe("전날");
    expect(dayShiftText(s, at("2026-10-22", "01:00"))).toBe("3일 뒤");
    expect(dayShiftText(s, at("2026-10-09", "01:00"))).toBe("10일 전");
    expect(split(0)).toEqual({ d: 0, h: 0, m: 0 });
    expect(splitText(0)).toBe("0분");
  });
});
