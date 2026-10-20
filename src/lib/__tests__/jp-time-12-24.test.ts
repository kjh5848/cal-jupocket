import { describe, expect, it } from "vitest";
import { parseTimeJa, text24, textJa, colonJa, textEn, alt12, hourTableJa, NOON } from "../jp/time-12-24";

describe("parseTimeJa — 改暦ノ布告 時刻表의 끝점", () => {
  it("午前0時 = 0:00, 午前12時 = 12:00(午刻), 午後12時 = 그날 끝(다음 날 0:00)", () => {
    expect(parseTimeJa("午前0時")).toEqual({ min: 0, from: "12" });
    expect(parseTimeJa("午前12時")).toEqual({ min: NOON, from: "12" });
    expect(parseTimeJa("午後12時")).toEqual({ min: 0, from: "12", dayEnd: true });
    expect(parseTimeJa("正午")?.min).toBe(NOON);
  });
  it("午後0時台 = 12時台(人事院規則 '午後零時三十分')", () => {
    expect(parseTimeJa("午後0時")?.min).toBe(NOON);
    expect(parseTimeJa("午後0時30分")?.min).toBe(750);
    expect(parseTimeJa("午前0時30分")?.min).toBe(30);
  });
  it("午前12時30分·午後12時30分 은 시각표에 없어 받지 않음", () => {
    expect(parseTimeJa("午前12時30分")).toBeNull();
    expect(parseTimeJa("午後12時30分")).toBeNull();
    expect(parseTimeJa("午後12時半")).toBeNull();
    expect(parseTimeJa("午後13時")).toBeNull();
  });
});

describe("parseTimeJa — 여러 표기", () => {
  it("午後3時40分 · 午後3:40 · 15:40 · 1540 · 全角 · 3:40 PM 은 모두 15:40", () => {
    for (const s of ["午後3時40分", "午後3:40", "午後 3:40", "15:40", "15時40分", "1540", "１５：４０", "3:40 PM", "3:40pm", "p.m. 3:40"]) {
      expect(parseTimeJa(s)?.min, s).toBe(940);
    }
  });
  it("時半 = 30分", () => {
    expect(parseTimeJa("午前9時半")?.min).toBe(570);
    expect(parseTimeJa("21時半")?.min).toBe(1290);
  });
  it("AM·PM 은 디지털 시계 표기 — 12:30 AM = 0:30, 12 PM = 12:00, 0 AM 은 받지 않음", () => {
    expect(parseTimeJa("12:30 AM")?.min).toBe(30);
    expect(parseTimeJa("12 PM")?.min).toBe(NOON);
    expect(parseTimeJa("0:30 AM")).toBeNull();
  });
  it("24:00·25時·60分·빈칸·말 표기는 받지 않음", () => {
    for (const s of ["24:00", "25時", "10:60", "", "深夜0時", "夜12時"]) expect(parseTimeJa(s), s).toBeNull();
  });
  it("넣은 표기 쪽을 기억", () => {
    expect(parseTimeJa("15:40")?.from).toBe("24");
    expect(parseTimeJa("午後3時40分")?.from).toBe("12");
  });
});

describe("표기", () => {
  it("0時 기준 12時間表記", () => {
    expect(textJa(0)).toBe("午前0時");
    expect(textJa(30)).toBe("午前0時30分");
    expect(textJa(NOON)).toBe("午後0時");
    expect(textJa(750)).toBe("午後0時30分");
    expect(textJa(940)).toBe("午後3時40分");
    expect(textJa(1439)).toBe("午後11時59分");
    expect(colonJa(940)).toBe("午後3:40");
    expect(colonJa(5)).toBe("午前0:05");
  });
  it("24時間表記·영어", () => {
    expect(text24(5)).toBe("00:05");
    expect(text24(940)).toBe("15:40");
    expect(textEn(0)).toBe("12:00 AM");
    expect(textEn(NOON)).toBe("12:00 PM");
    expect(textEn(940)).toBe("3:40 PM");
  });
  it("布告 시각표의 다른 이름은 0:00·12:00 에만", () => {
    expect(alt12(0)).toBe("午後12時");
    expect(alt12(NOON)).toBe("午前12時");
    expect(alt12(1)).toBe("");
    expect(alt12(750)).toBe("");
  });
  it("0~23時 표", () => {
    const t = hourTableJa();
    expect(t).toHaveLength(24);
    expect(t[0]).toEqual(["00:00", "午前0時"]);
    expect(t[12]).toEqual(["12:00", "午後0時"]);
    expect(t[15]).toEqual(["15:00", "午後3時"]);
  });
  it("하루 모든 분에서 왕복이 맞음", () => {
    for (let m = 0; m < 1440; m++) {
      expect(parseTimeJa(textJa(m))?.min).toBe(m);
      expect(parseTimeJa(colonJa(m))?.min).toBe(m);
      expect(parseTimeJa(text24(m))?.min).toBe(m);
      expect(parseTimeJa(textEn(m))?.min).toBe(m);
    }
  });
});
