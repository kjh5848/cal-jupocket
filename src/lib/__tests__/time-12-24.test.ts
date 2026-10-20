import { describe, it, expect } from "vitest";
import { parseTime, text24, text12, spoken, textEn, boundary, hourTable, NOON } from "../time-12-24";
import rates from "../../rates/time-12-24-2026.json";

const min = (raw: string) => parseTime(raw)?.min ?? null;

describe("12·24시간제 — 기준(표준국어대사전)", () => {
  it("rates 의 정오·자정 분과 lib 가 같다", () => {
    expect(rates.minutes.noon).toBe(NOON);
    expect(rates.minutes.midnight).toBe(0);
    expect(min("정오")).toBe(rates.minutes.noon);
    expect(min("자정")).toBe(rates.minutes.midnight);
  });
});

describe("roberin #154 대조 입력", () => {
  it("00:00 → 오전 12:00 (자정)", () => {
    expect(text12(min("00:00")!)).toBe("오전 12:00");
    expect(boundary(0)).toBe("자정");
  });
  it("12:00 → 오후 12:00 (정오)", () => {
    expect(text12(min("12:00")!)).toBe("오후 12:00");
    expect(boundary(720)).toBe("정오");
  });
  it("23:59 → 오후 11:59", () => {
    expect(text12(min("23:59")!)).toBe("오후 11:59");
  });
  it("오후 3:40 → 15:40, 오전 12:30 → 00:30", () => {
    expect(text24(min("오후 3:40")!)).toBe("15:40");
    expect(text24(min("오전 12:30")!)).toBe("00:30");
    expect(text24(min("오후 12:00")!)).toBe("12:00");
  });
});

describe("여러 표기를 읽는다", () => {
  it.each([
    ["오후 3시 40분", 940],
    ["오후3시", 900],
    ["3:40 PM", 940],
    ["3pm", 900],
    ["p.m. 3:40", 940],
    ["12 AM", 0],
    ["12:05 a.m.", 5],
    ["오전 0시", 0],
    ["오후 0시", 720],
    ["15시 40분", 940],
    ["1540", 940],
    ["7:05", 425],
    ["0:00", 0],
  ])("%s → %i분", (raw, want) => {
    expect(min(raw as string)).toBe(want);
  });
  it("12시간제 표기면 from 이 12, 아니면 24", () => {
    expect(parseTime("오후 3:40")!.from).toBe("12");
    expect(parseTime("15:40")!.from).toBe("24");
  });
});

describe("못 읽는 것은 null", () => {
  it.each(["", "오후 13:00", "13pm", "24:00", "25:00", "12:60", "7:5", "밤 11:59", "새벽 2시", "abc", "오후"])("%s", (raw) => {
    expect(parseTime(raw)).toBeNull();
  });
});

describe("왕복 — 하루 1,440분 전부", () => {
  it("text12 로 쓴 것을 다시 읽으면 같은 분, text24·spoken·영어도", () => {
    for (let m = 0; m < 1440; m++) {
      expect(min(text12(m))).toBe(m);
      expect(min(text24(m))).toBe(m);
      expect(min(spoken(m))).toBe(m);
      expect(min(textEn(m))).toBe(m);
    }
  });
});

describe("표기", () => {
  it("말로 읽기는 0분이면 분을 뺀다", () => {
    expect(spoken(940)).toBe("오후 3시 40분");
    expect(spoken(0)).toBe("오전 12시");
    expect(spoken(720)).toBe("오후 12시");
  });
  it("영어는 12:00 AM / 12:00 PM", () => {
    expect(textEn(0)).toBe("12:00 AM");
    expect(textEn(720)).toBe("12:00 PM");
    expect(textEn(940)).toBe("3:40 PM");
  });
  it("시간표는 24행, 13시 = 오후 1:00", () => {
    const t = hourTable();
    expect(t.length).toBe(24);
    expect(t[13]).toEqual(["13:00", "오후 1:00"]);
    expect(t[0]).toEqual(["00:00", "오전 12:00"]);
  });
});
