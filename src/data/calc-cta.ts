/**
 * 글 → 계산기 버튼(CalcCta) 등록부.
 *
 * 설계: docs/superpowers/specs/2026-11-07-cta-redesign-design.md
 *
 * 글을 읽고 "내 경우는?"이 생긴 사람을 그 묶음의 계산기로 보낸다. 버튼은
 * 도착지를 그대로 말한다 — 문구와 도착지가 다른 버튼(속이는 이동)은 만들지
 * 않는다. 문구가 없는 계산기는 버튼을 그리지 않는다. 어색한 기본 문구로
 * 300편에 한꺼번에 붙이는 것보다 문구를 쓴 계산기부터 붙이는 편이 낫다.
 *
 * 문구에 숫자(요율·금액)를 쓰지 않는다 — 숫자는 계산기와 글이 rates 로 낸다.
 */
import { clusters } from "./clusters";

export interface CalcCta {
  /** 독자의 고민 한 줄 (40자 이내) */
  q: string;
  /** 계산기가 무엇을 해 주는지 한 줄 (60자 이내) */
  sub: string;
  /** 버튼에 쓰는 계산기 이름 */
  label: string;
}

export const calcCta: Record<string, CalcCta> = {
  "/guide/loan-calculator/": {
    q: "내 대출이면 매달 얼마, 이자는 총 얼마일까?",
    sub: "원금·기간·금리만 넣으면 상환 방식 세 가지를 나란히 계산합니다.",
    label: "대출 이자 계산기",
  },
  "/guide/minus-account-calculator/": {
    q: "이번 결제일에 마이너스통장 이자가 얼마 나갈까?",
    sub: "쓴 금액과 날수로 결제일에 나갈 이자를 계산합니다.",
    label: "마이너스통장 이자 계산기",
  },
  "/guide/deposit-interest-calculator/": {
    q: "내 예금, 세금 떼고 실제로 얼마 받을까?",
    sub: "원금·금리·기간으로 세금을 뗀 이자를 계산합니다.",
    label: "예금 이자 계산기",
  },
  "/guide/dsr-calculator/": {
    q: "지금 대출에 더하면 DSR이 몇 %가 될까?",
    sub: "가진 대출과 연소득으로 DSR을 계산합니다.",
    label: "DSR 계산기",
  },
  "/guide/installment-savings-calculator/": {
    q: "매달 넣는 적금, 만기에 손에 쥐는 돈은?",
    sub: "월 납입액·금리·기간으로 세금을 뗀 이자를 계산합니다.",
    label: "적금 이자 계산기",
  },
  "/guide/prepayment-fee-calculator/": {
    q: "지금 대출을 갚으면 수수료가 얼마 나올까?",
    sub: "갚을 원금·약정 요율·남은 날로 중도상환수수료를 계산합니다.",
    label: "중도상환수수료 계산기",
  },
  "/guide/parking-account-interest-calculator/": {
    q: "파킹통장에 두면 한 달에 이자가 얼마 붙을까?",
    sub: "잔액과 금리로 세금을 뗀 이자를 계산합니다.",
    label: "파킹통장 이자 계산기",
  },
};

/**
 * 계산기 → 다음 단계. 계산 결과를 본 사람이 이어서 할 일(세 번째 페이지).
 * 도착지는 실제 계산기여야 하고 문구는 그 계산기가 답하는 질문이다.
 */
export const calcNext: Record<string, CalcCta & { href: string }> = {
  "/guide/loan-calculator/": {
    href: "/guide/prepayment-fee-calculator/",
    q: "더 낮은 금리로 갈아타면 수수료는 얼마일까?",
    sub: "지금 대출을 먼저 갚을 때 내는 중도상환수수료를 계산합니다.",
    label: "중도상환수수료 계산기",
  },
  "/guide/prepayment-fee-calculator/": {
    href: "/guide/loan-calculator/",
    q: "갈아탄 대출이면 매달 얼마를 갚게 될까?",
    sub: "새 금리·기간으로 월 상환액과 총 이자를 다시 계산합니다.",
    label: "대출 이자 계산기",
  },
  "/guide/dsr-calculator/": {
    href: "/guide/loan-calculator/",
    q: "한도 안에서 빌리면 매달 얼마를 갚을까?",
    sub: "빌릴 금액·기간·금리로 월 상환액과 총 이자를 계산합니다.",
    label: "대출 이자 계산기",
  },
  "/guide/minus-account-calculator/": {
    href: "/guide/loan-calculator/",
    q: "같은 돈을 일반 대출로 빌리면 매달 얼마일까?",
    sub: "원금·기간·금리로 상환 방식별 월 상환액을 계산합니다.",
    label: "대출 이자 계산기",
  },
  "/guide/deposit-interest-calculator/": {
    href: "/guide/installment-savings-calculator/",
    q: "한 번에 말고 매달 나눠 넣으면 얼마를 받을까?",
    sub: "월 납입액·금리·기간으로 적금 이자를 계산합니다.",
    label: "적금 이자 계산기",
  },
  "/guide/installment-savings-calculator/": {
    href: "/guide/deposit-interest-calculator/",
    q: "모은 돈을 예금에 한 번에 넣으면 얼마가 붙을까?",
    sub: "원금·금리·기간으로 세금을 뗀 예금 이자를 계산합니다.",
    label: "예금 이자 계산기",
  },
  "/guide/parking-account-interest-calculator/": {
    href: "/guide/deposit-interest-calculator/",
    q: "예금으로 묶어 두면 이자가 더 붙을까?",
    sub: "같은 돈을 예금에 넣었을 때 세금을 뗀 이자를 계산합니다.",
    label: "예금 이자 계산기",
  },
};

const norm = (p: string) => (p.endsWith("/") ? p : `${p}/`);

/** 계산기 페이지의 다음 단계 버튼. 등록 안 된 계산기는 null. */
export function nextFor(path: string): (CalcCta & { href: string }) | null {
  return calcNext[norm(path)] ?? null;
}

/**
 * 이 글에서 보낼 계산기. 계산기 페이지 자신이거나, 묶음에 없거나,
 * 문구가 등록된 계산기가 없으면 null.
 *
 * clusters 는 "글, 글, 그 글들의 계산기" 순서로 짜여 있어서 먼저 뒤쪽으로
 * 가장 가까운 계산기를 찾고, 없으면 앞쪽으로 찾는다.
 */
export function ctaFor(path: string): (CalcCta & { href: string }) | null {
  const here = norm(path);
  for (const c of clusters) {
    const i = c.links.findIndex((l) => norm(l.href) === here);
    if (i < 0) continue;
    if (c.links[i].kind === "calc") return null;
    const has = (j: number) => c.links[j]?.kind === "calc" && calcCta[norm(c.links[j].href)];
    for (let j = i + 1; j < c.links.length; j++) if (has(j)) return { href: norm(c.links[j].href), ...calcCta[norm(c.links[j].href)] };
    for (let j = i - 1; j >= 0; j--) if (has(j)) return { href: norm(c.links[j].href), ...calcCta[norm(c.links[j].href)] };
    return null;
  }
  return null;
}
