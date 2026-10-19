/**
 * 일본 학년(学年) — 만 나이 일본어판(/ja/tools/age/)이 생년월일로 小学校 입학 연도·지금 학년을 낸다.
 *
 * 원문(e-Gov 法令API, 2026-10-19 확인):
 * - 学校教育法 第17条 ① 子の満六歳に達した日の翌日以後における最初の学年の初めから … 小学校 … に就学させる義務
 *   ② 小学校の課程を修了した日の翌日以後における最初の学年の初めから … 中学校 …
 * - 学校教育法施行規則 第59条 小学校の学年は、四月一日に始まり、翌年三月三十一日に終わる。
 * - 年齢計算ニ関スル法律 ① 出生の日から起算 ② 民法 第143条 준용 — 第143条 ② 기간은 응당일의 前日에 満了,
 *   마지막 달에 응당일이 없으면 그 달 末日에 満了.
 *
 * 그래서 '満六歳に達した日' = 6번째 생일의 전날(2/29생은 평년 2/28), 그 다음 날 = 생일(평년 2/29생은 3/1).
 * 생일이 4월 1일 이전(1/1~4/1)이면 그해 4월 1일, 4월 2일부터면 이듬해 4월 1일에 입학한다.
 * 中学校는 小学校 6년을 그대로 마친 경우(입학 + 6년)만 낸다 — 유급·월반은 계산하지 않는다.
 */
import { fromDay, toDay } from "../date-calc";
import { dayOfAge } from "../age";

/** 小学校에 들어가는 해(그해 4월 1일 입학) */
export function elementaryEntryYear(birth: number): number {
  const dayAfterReaching6 = dayOfAge(birth, 6); // 満六歳に達した日(생일 전날)의 다음 날
  const y = Number(fromDay(dayAfterReaching6).slice(0, 4));
  return dayAfterReaching6 <= toDay(`${y}-04-01`)! ? y : y + 1;
}

/** 이 날짜가 속한 학년도(4월 1일 ~ 이듬해 3월 31일)의 시작 연도 */
export function schoolYearOf(day: number): number {
  const [y, m] = fromDay(day).split("-").map(Number);
  return m >= 4 ? y : y - 1;
}

export type Stage = "preschool" | "elementary" | "junior" | "after";

export interface SchoolGrade {
  stage: Stage;
  /** 小学 1~6, 中学 1~3. preschool·after 는 0 */
  grade: number;
  /** 小学校 입학 연도 · 中学校 입학 연도(표준 진급) */
  elementaryEntry: number;
  juniorEntry: number;
}

/** 기준일의 학년(표준 진급 가정) */
export function schoolGrade(birth: number, base: number): SchoolGrade {
  const elementaryEntry = elementaryEntryYear(birth);
  const n = schoolYearOf(base) - elementaryEntry + 1;
  const stage: Stage = n <= 0 ? "preschool" : n <= 6 ? "elementary" : n <= 9 ? "junior" : "after";
  const grade = stage === "elementary" ? n : stage === "junior" ? n - 6 : 0;
  return { stage, grade, elementaryEntry, juniorEntry: elementaryEntry + 6 };
}
