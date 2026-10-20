import { describe, expect, it } from "vitest";
import { INT32_MAX, toParts } from "../unix-time";
import { deText, relativeTextDe } from "../de/unix-time";

describe("deText — 독일어판 날짜·시각", () => {
  it("에포크와 그 앞뒤", () => {
    expect(deText(toParts(0, 0))).toBe("Donnerstag, 1. Januar 1970, 00:00:00");
    expect(deText(toParts(-1000, 0))).toBe("Mittwoch, 31. Dezember 1969, 23:59:59");
  });
  it("2038 한계와 넘친 값", () => {
    expect(deText(toParts(INT32_MAX * 1000, 0))).toBe("Dienstag, 19. Januar 2038, 03:14:07");
    expect(deText(toParts(-(INT32_MAX + 1) * 1000, 0))).toBe("Freitag, 13. Dezember 1901, 20:45:52");
  });
  it("페이지 첫 예시 — UTC 와 MESZ(UTC + 2 Stunden, § 4 Abs. 2 EinhZeitG)", () => {
    expect(deText(toParts(1_792_380_896_000, 0))).toBe("Montag, 19. Oktober 2026, 03:34:56");
    expect(deText(toParts(1_792_380_896_000, 120))).toBe("Montag, 19. Oktober 2026, 05:34:56");
  });
  it("밀리초는 쉼표", () => {
    expect(deText(toParts(1_792_380_896_789, 0))).toBe("Montag, 19. Oktober 2026, 03:34:56,789");
    expect(deText(toParts(5, 0))).toBe("Donnerstag, 1. Januar 1970, 00:00:00,005");
  });
});

describe("relativeTextDe — 지금과의 차이", () => {
  const S = 1000, M = 60 * S, H = 60 * M, D = 24 * H;
  it("1초 안이면 jetzt", () => {
    expect(relativeTextDe(0)).toBe("jetzt");
    expect(relativeTextDe(-999)).toBe("jetzt");
  });
  it("단수·복수(여격)", () => {
    expect(relativeTextDe(1 * S)).toBe("in 1 Sekunde");
    expect(relativeTextDe(-4 * S)).toBe("vor 4 Sekunden");
    expect(relativeTextDe(-1 * M)).toBe("vor 1 Minute");
    expect(relativeTextDe(3 * D + 2 * H + 5 * M)).toBe("in 3 Tagen 2 Stunden 5 Minuten");
    expect(relativeTextDe(-(1 * D + 1 * H))).toBe("vor 1 Tag 1 Stunde");
  });
  it("하루 넘으면 초 생략, 100일 넘으면 분 생략, 천 단위 공백", () => {
    expect(relativeTextDe(1 * D + 7 * S)).toBe("in 1 Tag");
    expect(relativeTextDe(100 * D + 3 * H + 9 * M)).toBe("in 100 Tagen 3 Stunden");
    expect(relativeTextDe(-(4321 * D))).toBe("vor 4 321 Tagen");
  });
});
