/**
 * 환갑·칠순 계산기(/tools/milestone-age/) — 생년월일 · 기준일 → 환갑·진갑·칠순·희수·팔순·미수·구순·백수 날짜.
 *
 * 이름과 나이는 표준국어대사전 뜻풀이(rates/milestone-age-2026.json). 법으로 정한 나이가 아니라 말과 관습이다.
 *
 * 정한 규칙(테스트로 고정):
 * - 환갑은 '태어난 지 60돌이 되는 해' → 출생 연도 + 60, 진갑은 + 61. 만 나이·세는 나이 어느 쪽이든 같은 해.
 * - 나머지는 사전이 'N 살'이라고만 적는다 → 기본은 만 N세가 되는 날(출생 연도 + N), 세는 나이로 지내면
 *   출생 연도 + N − 1 해. 두 해를 함께 보이고 하나를 정답으로 정하지 않는다.
 * - 만 N세가 되는 날은 만 나이 계산기와 같은 셈(lib/age.ts dayOfAge — 2월 29일생은 평년이면 3월 1일).
 * - 기준일과 같은 날은 '다가오는'에 넣는다(D-Day).
 */
import { dayOfAge } from "./age";

export interface MilestoneDef {
  key: string;
  name: string;
  hanja: string;
  /** 사전의 나이(환갑은 60돌) */
  n: number;
  /** 같은 뜻의 다른 이름 */
  alias?: string;
  /** 사전이 '해'로 정의해 만·세는 나이 구분이 없는가(환갑·진갑) */
  yearDefined: boolean;
  /** 짧은 뜻 */
  meaning: string;
}

export const MILESTONES: MilestoneDef[] = [
  { key: "hwangap", name: "환갑", hanja: "還甲", n: 60, alias: "회갑", yearDefined: true, meaning: "태어난 지 60돌이 되는 해" },
  { key: "jingap", name: "진갑", hanja: "進甲", n: 61, yearDefined: true, meaning: "환갑의 이듬해" },
  { key: "chilsun", name: "칠순", hanja: "七旬", n: 70, alias: "고희", yearDefined: false, meaning: "일흔 살" },
  { key: "mangpal", name: "망팔", hanja: "望八", n: 71, yearDefined: false, meaning: "여든을 바라보는 일흔한 살" },
  { key: "heesu", name: "희수", hanja: "喜壽", n: 77, yearDefined: false, meaning: "일흔일곱 살" },
  { key: "palsun", name: "팔순", hanja: "八旬", n: 80, yearDefined: false, meaning: "여든 살" },
  { key: "manggu", name: "망구", hanja: "望九", n: 81, yearDefined: false, meaning: "아흔을 바라보는 여든한 살" },
  { key: "misu", name: "미수", hanja: "米壽", n: 88, yearDefined: false, meaning: "여든여덟 살" },
  { key: "gusun", name: "구순", hanja: "九旬", n: 90, yearDefined: false, meaning: "아흔 살" },
  { key: "mangbaek", name: "망백", hanja: "望百", n: 91, yearDefined: false, meaning: "백을 바라보는 아흔한 살" },
  { key: "baeksu", name: "백수", hanja: "白壽", n: 99, yearDefined: false, meaning: "아흔아홉 살" },
];

export interface Milestone extends MilestoneDef {
  /** 만 n세가 되는 날(일련번호) */
  day: number;
  /** 그날의 연도 = 출생 연도 + n */
  year: number;
  /** 세는 나이로 지내는 해. 환갑·진갑은 year 와 같다 */
  countingYear: number;
  /** 그해 세는 나이 */
  countingAge: number;
  /** 기준일까지 일수(양수면 남음, 0 = 오늘, 음수면 지남) */
  daysLeft: number;
}

function yearOf(n: number): number {
  return new Date(n * 86_400_000).getUTCFullYear();
}

/** 생년월일 · 기준일(일련번호) → 기념 나이 목록. 출생일이 기준일보다 뒤면 null */
export function milestones(birth: number, base: number): Milestone[] | null {
  if (birth > base) return null;
  const by = yearOf(birth);
  return MILESTONES.map((m) => {
    const day = dayOfAge(birth, m.n);
    const countingYear = m.yearDefined ? by + m.n : by + m.n - 1;
    return {
      ...m,
      day,
      year: by + m.n,
      countingYear,
      countingAge: countingYear - by + 1,
      daysLeft: day - base,
    };
  });
}

/** 기준일 당일이거나 그 뒤로 가장 먼저 오는 기념 나이. 다 지났으면 null */
export function nextMilestone(list: Milestone[]): Milestone | null {
  return list.find((m) => m.daysLeft >= 0) ?? null;
}
