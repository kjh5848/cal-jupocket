import { describe, it, expect } from "vitest";
import {
  earlyRate,
  deferredRate,
  breakevenAge,
  startAgeForBirthYear,
} from "../pension-timing";

describe("earlyRate", () => {
  it("공단 고시 지급률을 그대로 반환한다", () => {
    expect(earlyRate(5)).toBe(0.7);
    expect(earlyRate(1)).toBe(0.94);
  });
  it("정의되지 않은 연수는 던진다", () => {
    expect(() => earlyRate(6)).toThrow();
  });
});

describe("deferredRate", () => {
  it("1년당 7.2% 가산, 5년이면 136%", () => {
    expect(deferredRate(1)).toBe(1.072);
    expect(deferredRate(5)).toBe(1.36);
  });
  it("연기 한도를 넘으면 던진다", () => {
    expect(() => deferredRate(6)).toThrow();
  });
});

describe("breakevenAge", () => {
  // 조기 5년(60세, 70%) vs 정상(65세, 100%)
  // 0.7*(x-60) = 1.0*(x-65)  →  x = 76.7
  it("조기 5년과 정상 수령은 약 76.7세에 역전된다", () => {
    expect(
      breakevenAge({ age: 60, rate: 0.7 }, { age: 65, rate: 1.0 }),
    ).toBe(76.7);
  });

  // 정상(65세, 100%) vs 연기 5년(70세, 136%)
  // 1.0*(x-65) = 1.36*(x-70)  →  x = 83.9
  it("정상과 연기 5년은 약 83.9세에 역전된다", () => {
    expect(
      breakevenAge({ age: 65, rate: 1.0 }, { age: 70, rate: 1.36 }),
    ).toBe(83.9);
  });

  it("지급률이 같으면 던진다", () => {
    expect(() =>
      breakevenAge({ age: 60, rate: 1.0 }, { age: 65, rate: 1.0 }),
    ).toThrow();
  });
});

describe("startAgeForBirthYear", () => {
  it("1969년 이후 출생은 65세 개시, 60세부터 조기 가능", () => {
    expect(startAgeForBirthYear(1990)).toEqual({
      startAge: 65,
      earliestAge: 60,
    });
  });
  it("구간 경계(1968년생)를 올바르게 찾는다", () => {
    expect(startAgeForBirthYear(1968)).toEqual({
      startAge: 64,
      earliestAge: 59,
    });
  });
  it("가장 오래된 구간(1956년 이전)도 찾는다", () => {
    expect(startAgeForBirthYear(1950)).toEqual({
      startAge: 61,
      earliestAge: 56,
    });
  });
});
