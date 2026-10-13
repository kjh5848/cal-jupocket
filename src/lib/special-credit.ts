/**
 * 연말정산 특별세액공제 어림 — 의료비·교육비·기부금(소득세법 제59조의4 제2항~제4항),
 * 고향사랑 기부금(조특법 제58조)·정치자금(제76조).
 *
 * 세액공제는 산출세액을 넘지 못한다(제61조). 여기서는 산출세액 한도를 적용하기 전
 * 공제액을 계산한다 — 결정세액이 0원이 되면 그 아래로는 내려가지 않는다.
 */
import r from "../rates/special-credit-2026.json";

const M = r.medical;

export interface MedicalInput {
  /** 총급여 */
  pay: number;
  /** 일반 의료비(제1호) — 본인·6세 이하·65세 이상·장애인 외 기본공제대상자 */
  general?: number;
  /** 본인·6세 이하·65세 이상·장애인·중증질환자 등(제2호) */
  special?: number;
  /** 미숙아·선천성이상아(제3호) */
  premature?: number;
  /** 난임시술(제4호) */
  infertility?: number;
}

/**
 * 의료비 세액공제 — 제59조의4 제2항.
 * 일반 의료비는 총급여 3%를 넘는 부분(700만원 한도). 앞 순서가 3%에 못 미치면 그 미달액을 뒤 순서에서 뺀다.
 */
export function medicalCredit(i: MedicalInput) {
  const threshold = Math.floor(i.pay * M.thresholdRate);
  const g = i.general ?? 0, s = i.special ?? 0, p = i.premature ?? 0, f = i.infertility ?? 0;
  let short = threshold; // 아직 채우지 못한 3%
  const gBase = Math.min(Math.max(0, g - short), M.generalCap);
  short = Math.max(0, short - g);
  const sBase = Math.max(0, s - short);
  short = Math.max(0, short - s);
  const pBase = Math.max(0, p - short);
  short = Math.max(0, short - p);
  const fBase = Math.max(0, f - short);
  const credit = Math.floor(gBase * M.rates.general + sBase * M.rates.special + pBase * M.rates.premature + fBase * M.rates.infertility);
  return { threshold, gBase, sBase, pBase, fBase, credit };
}

export interface EducationPerson {
  kind: "self" | "university" | "school" | "disabled";
  amount: number;
}

/** 교육비 세액공제 — 제59조의4 제3항. 대학생 900만원, 취학 전·초중고 300만원 1명당 한도, 15% */
export function educationCredit(people: EducationPerson[]) {
  const C = r.education.caps;
  const base = people.reduce((sum, p) => {
    const cap = p.kind === "university" ? C.university : p.kind === "school" ? C.school : Infinity;
    return sum + Math.min(Math.max(0, p.amount), cap);
  }, 0);
  return { base, credit: Math.floor(base * r.education.rate) };
}

export interface DonationInput {
  /** 소득금액(종합소득금액, 원천징수세율 이자·배당 제외) */
  income: number;
  /** 특례기부금 */
  special?: number;
  /** 종교단체 외 일반기부금 */
  general?: number;
  /** 종교단체 일반기부금 */
  religious?: number;
}

/**
 * 기부금 세액공제 — 제59조의4 제4항.
 * 일반기부금 한도: 종교단체가 있으면 소득금액×10% + min(소득금액×20%, 종교단체 외), 없으면 소득금액×30%.
 * 소득금액은 종합소득금액에서 특례기부금을 뺀 금액. 특례기부금 자체의 한도는 읽지 않아 소득금액으로만 막는다.
 */
export function donationCredit(i: DonationInput) {
  const L = r.donation.generalLimit;
  const sp = Math.min(Math.max(0, i.special ?? 0), Math.max(0, i.income));
  const y = Math.max(0, i.income - sp);
  const gen = Math.max(0, i.general ?? 0);
  const rel = Math.max(0, i.religious ?? 0);
  const limit = rel > 0 ? Math.floor(y * L.religiousRate) + Math.min(Math.floor(y * L.otherRate), gen) : Math.floor(y * L.nonReligiousRate);
  const generalIn = Math.min(gen + rel, limit);
  const total = sp + generalIn;
  const D = r.donation;
  const credit = Math.floor(Math.min(total, D.highFrom) * D.rate + Math.max(0, total - D.highFrom) * D.highRate);
  return { limit, generalIn, carry: gen + rel - generalIn, total, credit };
}

/** 고향사랑 기부금 세액공제 — 조특법 제58조 제1항. 10만원까지 100/110, 20만원까지 40%, 2천만원까지 15%(특별재난 30%) */
export function hometownCredit(amount: number, disaster = false): number {
  const a = Math.min(Math.max(0, amount), 20_000_000);
  const t1 = Math.min(a, 100_000) * (100 / 110);
  const t2 = Math.max(0, Math.min(a, 200_000) - 100_000) * 0.4;
  const t3 = Math.max(0, a - 200_000) * (disaster ? 0.3 : 0.15);
  return Math.floor(t1 + t2 + t3);
}

/** 정치자금 기부금 세액공제 — 조특법 제76조 제1항. 10만원까지 100/110, 초과분 15%(3천만원 초과분 25%) */
export function politicalCredit(amount: number): number {
  const a = Math.max(0, amount);
  return Math.floor(Math.min(a, 100_000) * (100 / 110) + Math.max(0, Math.min(a, 30_000_000) - 100_000) * 0.15 + Math.max(0, a - 30_000_000) * 0.25);
}
