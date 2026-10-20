import { describe, it, expect } from "vitest";
import { parseScaled, toNanos, partsToNanos, inUnit, convertAll, readable, readableJa, readableEn, withUnitEn, clock, split, minSec } from "../sec-convert";
import rates from "../../rates/sec-convert-2026.json";

const ns = (raw: string, u: Parameters<typeof toNanos>[1]) => toNanos(raw, u)!;

describe("초·분·시간 변환 — 기준(SI 표 8)", () => {
  it("rates 의 초 수와 lib 의 단위가 같다", () => {
    expect(inUnit(ns("1", "min"), "s")).toBe(String(rates.secondsPer.min));
    expect(inUnit(ns("1", "h"), "s")).toBe(rates.secondsPer.h.toLocaleString("en-US"));
    expect(inUnit(ns("1", "d"), "s")).toBe(rates.secondsPer.d.toLocaleString("en-US"));
  });
});

describe("roberin #91 대조 입력", () => {
  it("3725초 → 62.083333분 · 62분 5초 · 1:02:05", () => {
    const n = ns("3725", "s");
    expect(inUnit(n, "min")).toBe("62.083333");
    expect(inUnit(n, "h")).toBe("1.034722");
    expect(readable(n)).toBe("1시간 2분 5초"); // roberin 은 '62분 5초' — 시간 자리를 안 씀(표기 차이)
    expect(clock(n)).toBe("1:02:05");
  });
  it("59.5초 → 0.991667분 · 59.5초", () => {
    const n = ns("59.5", "s");
    expect(inUnit(n, "min")).toBe("0.991667");
    expect(readable(n)).toBe("59.5초");
    expect(clock(n)).toBe("0:00:59.5");
  });
  it("'1,440.25'분 → 86,415초 · 1일 0시간 0분 15초", () => {
    const n = ns("1,440.25", "min");
    expect(inUnit(n, "s")).toBe("86,415");
    expect(inUnit(n, "d")).toBe("1.000174");
    expect(readable(n)).toBe("1일 0시간 0분 15초");
    expect(clock(n)).toBe("24:00:15");
  });
});

describe("정확도·경계", () => {
  it("1.1분 = 66초 정확히(부동소수 오차 없음)", () => {
    expect(inUnit(ns("1.1", "min"), "s")).toBe("66");
    expect(readable(ns("1.1", "min"))).toBe("1분 6초");
  });
  it("86400초 = 1일, 0 = 0초", () => {
    expect(convertAll(ns("86400", "s"))).toEqual({ ms: "86,400,000", s: "86,400", min: "1,440", h: "24", d: "1" });
    expect(readable(0n)).toBe("0초");
    expect(clock(0n)).toBe("0:00:00");
  });
  it("1밀리초 → 0.001초 · 분은 0.000017(반올림)", () => {
    const n = ns("1", "ms");
    expect(inUnit(n, "s")).toBe("0.001");
    expect(inUnit(n, "min")).toBe("0.000017");
    expect(readable(n)).toBe("0.001초");
  });
  it("반올림 결과가 60초가 되지 않는다 — 59.9999999초는 받지 않고, 마이크로초 단위로 나눈다", () => {
    expect(parseScaled("59.9999999")).toBeNull();
    expect(split(ns("0.000001", "h")).seconds).toBe("0.0036"); // 0.000001시간 = 3.6밀리초
    expect(readable(ns("59.999999", "s"))).toBe("59.999999초");
  });
  it("입력 형식 — 쉼표·공백 허용, 빈 칸 0, 음수·문자·16자리 정수 거부", () => {
    expect(parseScaled(" 3,600 ")).toBe(3_600_000_000n);
    expect(parseScaled(".5")).toBe(500_000n);
    expect(parseScaled("")).toBe(0n);
    expect(parseScaled("-1")).toBeNull();
    expect(parseScaled("1e3")).toBeNull();
    expect(parseScaled("abc")).toBeNull();
    expect(parseScaled("1234567890123456")).toBeNull();
    expect(inUnit(ns("999999999999999", "d"), "s")).toBe("86,399,999,999,999,913,600");
  });
  it("일·시간·분·초 칸 합치기 — 넘쳐도 더함(90분 = 1시간 30분)", () => {
    const n = partsToNanos("", "", "90", "")!;
    expect(readable(n)).toBe("1시간 30분 0초");
    expect(inUnit(partsToNanos("1", "2", "3", "4.5")!, "s")).toBe("93,784.5");
    expect(partsToNanos("1", "x", "", "")).toBeNull();
  });
});

describe("일본어판 풀어 쓰기(readableJa)", () => {
  it("3725秒 → 1時間2分5秒, 1,440.25分 → 1日0時間0分15秒, 0 → 0秒", () => {
    expect(readableJa(ns("3725", "s"))).toBe("1時間2分5秒");
    expect(readableJa(ns("1,440.25", "min"))).toBe("1日0時間0分15秒");
    expect(readableJa(0n)).toBe("0秒");
  });
  it("10000秒 → 2時間46分40秒, 59.5秒 → 59.5秒, 90分 → 1時間30分0秒", () => {
    expect(readableJa(ns("10000", "s"))).toBe("2時間46分40秒");
    expect(readableJa(ns("59.5", "s"))).toBe("59.5秒");
    expect(readableJa(partsToNanos("", "", "90", "")!)).toBe("1時間30分0秒");
  });
});

describe("총 분 + 남은 초(minSec) — roberin #88 대조", () => {
  it("4:37:12 → 277분 12초(277.2분), 0:00:59 → 0분 59초(0.983333분), 100:59:59 → 6059분 59초", () => {
    const a = partsToNanos("", "4", "37", "12")!;
    expect(inUnit(a, "s")).toBe("16,632");
    expect(inUnit(a, "min")).toBe("277.2");
    expect(minSec(a)).toEqual({ minutes: 277n, seconds: "12" });
    const b = partsToNanos("", "", "", "59")!;
    expect(inUnit(b, "min")).toBe("0.983333");
    expect(minSec(b)).toEqual({ minutes: 0n, seconds: "59" });
    const c = partsToNanos("", "100", "59", "59")!;
    expect(inUnit(c, "s")).toBe("363,599");
    expect(inUnit(c, "min")).toBe("6,059.983333");
    expect(minSec(c)).toEqual({ minutes: 6059n, seconds: "59" });
  });
  it("하루를 넘어도 분으로 이어 센다 — 1일 0시간 1분 30.5초 → 1441분 30.5초", () => {
    expect(minSec(partsToNanos("1", "", "1", "30.5")!)).toEqual({ minutes: 1441n, seconds: "30.5" });
  });
});

describe("영어판 풀어 쓰기(readableEn·withUnitEn)", () => {
  it("3725 s → 1 hour 2 minutes 5 seconds, 1,440.25 min → 1 day 0 hours 0 minutes 15 seconds, 0 → 0 seconds", () => {
    expect(readableEn(ns("3725", "s"))).toBe("1 hour 2 minutes 5 seconds");
    expect(readableEn(ns("1,440.25", "min"))).toBe("1 day 0 hours 0 minutes 15 seconds");
    expect(readableEn(0n)).toBe("0 seconds");
  });
  it("단수는 정확히 1 일 때만 — 1 s, 0.5 s, 61 s, 1,000,000 s(11 days)", () => {
    expect(readableEn(ns("1", "s"))).toBe("1 second");
    expect(readableEn(ns("0.5", "s"))).toBe("0.5 seconds");
    expect(readableEn(ns("61", "s"))).toBe("1 minute 1 second");
    expect(readableEn(ns("1000000", "s"))).toBe("11 days 13 hours 46 minutes 40 seconds");
  });
  it("withUnitEn — 쉼표 값·소수 그대로, '1' 만 단수", () => {
    expect(withUnitEn("3,725", "s")).toBe("3,725 seconds");
    expect(withUnitEn("1", "h")).toBe("1 hour");
    expect(withUnitEn("1.5", "min")).toBe("1.5 minutes");
    expect(withUnitEn("0.001", "s")).toBe("0.001 seconds");
  });
});
