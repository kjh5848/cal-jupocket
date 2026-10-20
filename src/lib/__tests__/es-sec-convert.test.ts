import { describe, it, expect } from "vitest";
import { toNanos, convertAll, minSec, partsToNanos } from "../sec-convert";
import {
  readInputEs,
  digitsEs,
  withUnitEs,
  readableEs,
  clockEs,
  clockTextEs,
  partsSubEs,
  heroLabelEs,
  heroSubEs,
} from "../es/sec-convert";
import { parseNumberEs } from "../es/number";

const N = " ";

describe("스페인판 초·분·시간 변환 표기", () => {
  it("입력: 쉼표 소수, 세 자리 점 묶음은 천 단위(es/number 와 같은 규칙)", () => {
    expect(readInputEs("1,5")).toBe("1.5");
    expect(readInputEs("1.5")).toBe("1.5");
    expect(readInputEs("1.500")).toBe("1500");
    expect(readInputEs(`86${N}400`)).toBe("86400");
    expect(readInputEs("86 400")).toBe("86400");
    expect(readInputEs("1.234,5")).toBe("1234.5");
    expect(readInputEs("1,2,3")).toBe("x");
    expect(readInputEs("12.34,5")).toBe("x");
    expect(readInputEs("")).toBe("");
    for (const raw of ["1,5", "1.5", "1.500", "1.234,5", "86 400", "7,75"])
      expect(Number(readInputEs(raw))).toBe(parseNumberEs(raw));
    expect(toNanos(readInputEs("1,5"), "h")).toBe(toNanos("1.5", "h"));
    expect(toNanos(readInputEs("1,2,3"), "s")).toBeNull();
    // 정수 15자리 + 소수 6자리도 문자열 그대로 넘긴다
    expect(readInputEs("123456789012345,123456")).toBe("123456789012345.123456");
  });

  it("숫자: 소수 쉼표, 다섯 자리 이상만 세 자리 묶음", () => {
    expect(digitsEs("3,600")).toBe("3600");
    expect(digitsEs("86,400")).toBe(`86${N}400`);
    expect(digitsEs("1,440.25")).toBe("1440,25");
    expect(digitsEs("100,000")).toBe(`100${N}000`);
    expect(digitsEs("0.083333")).toBe("0,083333");
    expect(digitsEs("90")).toBe("90");
  });

  it("단위: 1 만 단수", () => {
    expect(withUnitEs("0", "s")).toBe("0 segundos");
    expect(withUnitEs("1", "h")).toBe("1 hora");
    expect(withUnitEs("1", "d")).toBe("1 día");
    expect(withUnitEs("1.5", "h")).toBe("1,5 horas");
    expect(withUnitEs("1", "ms")).toBe("1 milisegundo");
    expect(withUnitEs("5,400", "s")).toBe("5400 segundos");
  });

  it("5400 segundos = 90 minutos = 1,5 horas = 1 hora, 30 minutos y 0 segundos", () => {
    const n = toNanos("5400", "s")!;
    const all = convertAll(n);
    expect(withUnitEs(all.min, "min")).toBe("90 minutos");
    expect(withUnitEs(all.h, "h")).toBe("1,5 horas");
    expect(readableEs(n)).toBe("1 hora, 30 minutos y 0 segundos");
    expect(clockEs(n)).toBe("1:30:00");
    expect(heroLabelEs(all.s, "s")).toBe("5400 segundos =");
    expect(heroSubEs(all.min, "s", "1:30:00")).toBe("90 minutos · h:mm:ss 1:30:00");
  });

  it("100 000 segundos = 1 día, 3 horas, 46 minutos y 40 segundos, reloj 27:46:40", () => {
    const n = toNanos("100000", "s")!;
    expect(readableEs(n)).toBe("1 día, 3 horas, 46 minutos y 40 segundos");
    expect(clockEs(n)).toBe("27:46:40");
    expect(digitsEs(convertAll(n).h)).toBe("27,777778");
  });

  it("앞쪽 0 단위는 빼고, 하나면 'y' 없이", () => {
    expect(readableEs(toNanos("0", "s")!)).toBe("0 segundos");
    expect(readableEs(toNanos("45", "s")!)).toBe("45 segundos");
    expect(readableEs(toNanos("270", "s")!)).toBe("4 minutos y 30 segundos");
    expect(readableEs(toNanos("90.5", "s")!)).toBe("1 minuto y 30,5 segundos");
    expect(clockEs(toNanos("90.5", "s")!)).toBe("0:01:30,5");
    expect(clockTextEs("0:01:30.5")).toBe("0:01:30,5");
  });

  it("7,75 horas = 7 horas, 45 minutos y 0 segundos; 465 minutos = 7,75 horas", () => {
    expect(readableEs(toNanos(readInputEs("7,75"), "h")!)).toBe("7 horas, 45 minutos y 0 segundos");
    expect(digitsEs(convertAll(toNanos("465", "min")!).h)).toBe("7,75");
  });

  it("두 번째 계산기: 2 h 15 min → 8100 segundos", () => {
    const n = partsToNanos("", "2", "15", "")!;
    const all = convertAll(n);
    expect(withUnitEs(all.s, "s")).toBe("8100 segundos");
    expect(partsSubEs(all.min, minSec(n), all.h, readableEs(n))).toBe(
      "135 minutos · 2,25 horas · 2 horas, 15 minutos y 0 segundos",
    );
    const m = partsToNanos("", "", "", "100.5")!;
    const a = convertAll(m);
    expect(partsSubEs(a.min, minSec(m), a.h, readableEs(m))).toBe(
      "1,675 minutos (1 min 40,5 s) · 0,027917 horas · 1 minuto y 40,5 segundos",
    );
  });

  it("90 000 milisegundos = 90 segundos = 1,5 minutos", () => {
    const all = convertAll(toNanos("90000", "ms")!);
    expect(digitsEs(all.s)).toBe("90");
    expect(digitsEs(all.min)).toBe("1,5");
    expect(digitsEs(convertAll(toNanos("1", "ms")!).s)).toBe("0,001");
  });
});
