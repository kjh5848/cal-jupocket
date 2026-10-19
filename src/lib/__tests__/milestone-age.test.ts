import { describe, it, expect } from "vitest";
import { toDay, fromDay, dday } from "../date-calc";
import { milestones, nextMilestone, MILESTONES } from "../milestone-age";
import { age } from "../age";

const d = (s: string) => toDay(s)!;
const byKey = (list: ReturnType<typeof milestones>, k: string) => list!.find((m) => m.key === k)!;

// 기대값은 Python datetime 으로 따로 뽑았다. roberin #102 의 1964-03-15 예시(만 나이 기준 날짜·D-day)와 같다.
describe("환갑·칠순 계산기", () => {
  it("1964-03-15 · 기준 2026-10-19 — 환갑 2024-03-15(D+948) · 칠순 2034-03-15(D-2704) · 세는 나이 칠순 2033년", () => {
    const base = d("2026-10-19");
    const list = milestones(d("1964-03-15"), base)!;
    const hw = byKey(list, "hwangap");
    expect([fromDay(hw.day), hw.year, hw.countingYear, hw.countingAge]).toEqual(["2024-03-15", 2024, 2024, 61]);
    expect(dday(hw.day, base)).toBe("D+948");
    expect(fromDay(byKey(list, "jingap").day)).toBe("2025-03-15");
    const ch = byKey(list, "chilsun");
    expect([fromDay(ch.day), ch.year, ch.countingYear, ch.countingAge]).toEqual(["2034-03-15", 2034, 2033, 70]);
    expect(ch.daysLeft).toBe(2704);
    expect(byKey(list, "heesu").daysLeft).toBe(5261);
    expect(fromDay(byKey(list, "palsun").day)).toBe("2044-03-15");
    expect(fromDay(byKey(list, "misu").day)).toBe("2052-03-15");
    expect(fromDay(byKey(list, "gusun").day)).toBe("2054-03-15");
    expect(byKey(list, "baeksu").daysLeft).toBe(13296);
    expect(nextMilestone(list)!.key).toBe("chilsun");
  });

  it("2월 29일생은 평년이면 3월 1일(만 나이 계산기와 같은 셈) — 1956-02-29 칠순 2026-03-01, 팔순 2036-02-29", () => {
    const birth = d("1956-02-29");
    const list = milestones(birth, d("2026-10-19"))!;
    expect(fromDay(byKey(list, "chilsun").day)).toBe("2026-03-01");
    expect(fromDay(byKey(list, "heesu").day)).toBe("2033-03-01");
    expect(fromDay(byKey(list, "palsun").day)).toBe("2036-02-29");
    // 만 나이 계산기와 교차 확인 — 3월 1일에 만 70세, 2월 28일엔 아직 69세
    expect(age(birth, d("2026-03-01"))!.years).toBe(70);
    expect(age(birth, d("2026-02-28"))!.years).toBe(69);
  });

  it("기념일 당일은 D-Day 이고 '다가오는' 쪽 — 1966-10-19 환갑 2026-10-19", () => {
    const base = d("2026-10-19");
    const list = milestones(d("1966-10-19"), base)!;
    const hw = byKey(list, "hwangap");
    expect(hw.daysLeft).toBe(0);
    expect(dday(hw.day, base)).toBe("D-Day");
    expect(nextMilestone(list)!.key).toBe("hwangap");
  });

  it("세는 나이 해 = 출생 연도 + N − 1(환갑·진갑만 + N) · 다 지나면 다음 없음 · 미래 출생은 null", () => {
    const list = milestones(d("1920-05-05"), d("2026-10-19"))!;
    for (const m of list) {
      expect(m.countingYear).toBe(m.yearDefined ? 1920 + m.n : 1920 + m.n - 1);
      expect(m.year).toBe(1920 + m.n);
    }
    expect(nextMilestone(list)).toBeNull();
    expect(milestones(d("2027-01-01"), d("2026-10-19"))).toBeNull();
  });

  it("이름은 사전에서 확인한 11개, 나이 순", () => {
    expect(MILESTONES.map((m) => m.name)).toEqual(["환갑", "진갑", "칠순", "망팔", "희수", "팔순", "망구", "미수", "구순", "망백", "백수"]);
    const ns = MILESTONES.map((m) => m.n);
    expect([...ns].sort((a, b) => a - b)).toEqual(ns);
  });
});
