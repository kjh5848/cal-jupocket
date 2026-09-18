/**
 * 카드에 인쇄되는 숫자가 계산기와 같은지 검사한다.
 *
 * 카드는 이미지로 구워져 인스타로 나간다 — 발행 후에는 고칠 수 없고,
 * 틀린 숫자가 박힌 이미지는 그대로 남는다. 그래서 표의 모든 행을
 * 실제 계산 함수와 대조한다. 요율이나 상·하한이 바뀌면 여기서 먼저 깨진다.
 */
import { describe, it, expect } from "vitest";
import { cardSets, cardSetBySlug } from "../../data/cards";
import { compute } from "../pension-premium";
import { computeLateFiling } from "../penalty";
import { estimateRefund } from "../income-tax";
import { taxSaved, computeDeduction, type Person } from "../deduction";
import deduction from "../../rates/deduction-2026.json";
import penalty from "../../rates/penalty-2026.json";
import { parseMarkup } from "../card-markup";
import { entryByNo } from "../../data/linkhub";
import rates from "../../rates/pension-premium-2026.json";
import vat from "../../rates/vat-2026.json";
import vatPenalty from "../../rates/vat-penalty-2026.json";
import { onSupply } from "../vat-penalty";
import { computeGift, relationCap, taxFreeCeiling } from "../gift";
import {
  computeInheritance,
  taxFreeCeiling as inheritanceCeiling,
} from "../inheritance";
import gift from "../../rates/gift-2026.json";

/** "28만 5,000원" 같은 표기를 숫자로 되돌린다. */
function parseWon(label: string): number {
  // "19만 원" 처럼 만 단위만 있고 뒤가 비는 표기도 받아야 한다.
  const m = label.match(/^(?:([\d,]+)만)?\s*(?:([\d,]+)\s*)?원$/);
  if (!m) throw new Error(`읽을 수 없는 금액 표기: ${label}`);
  const man = m[1] ? Number(m[1].replace(/,/g, "")) : 0;
  const rest = m[2] ? Number(m[2].replace(/,/g, "")) : 0;
  return man * 10000 + rest;
}

describe("parseWon (테스트용 헬퍼)", () => {
  it("만 단위와 나머지를 합친다", () => {
    expect(parseWon("28만 5,000원")).toBe(285000);
    expect(parseWon("19만 원")).toBe(190000);
    expect(parseWon("62만 6,050원")).toBe(626050);
  });
});

describe("pension-2026 카드", () => {
  const set = cardSetBySlug("pension-2026");

  it("세트가 존재한다", () => {
    expect(set).toBeDefined();
  });

  const table = set?.cards.find((c) => c.kind === "table");

  it("표 카드가 있다", () => {
    expect(table).toBeDefined();
  });

  it("표의 모든 행이 계산기 결과와 일치한다", () => {
    if (table?.kind !== "table") throw new Error("표 카드 없음");
    for (const row of table.rows) {
      const income = Number(row.label.replace(/[^\d]/g, "")) * 10000;
      expect(parseWon(row.value)).toBe(compute(income).monthly);
    }
  });

  it("상한 행이 실제 상한값을 쓴다", () => {
    if (table?.kind !== "table") throw new Error("표 카드 없음");
    const last = table.rows[table.rows.length - 1];
    expect(last.label).toContain(String(rates.standardIncomeCeiling / 10000));
    expect(parseWon(last.value)).toBe(compute(rates.standardIncomeCeiling).monthly);
  });

  it("리스트 카드가 현재 요율을 말한다", () => {
    const list = set?.cards.find((c) => c.kind === "list");
    if (list?.kind !== "list") throw new Error("리스트 카드 없음");
    const joined = list.items.map((i) => i.text).join(" ");
    expect(joined).toContain(`${rates.rate * 100}%`);
  });
});

describe("모든 카드 세트 공통", () => {
  it.each(cardSets.map((s) => s.slug))("%s — 마지막은 유도 카드다", (slug) => {
    const set = cardSetBySlug(slug)!;
    expect(set.cards[set.cards.length - 1].kind).toBe("cta");
  });

  it.each(cardSets.map((s) => s.slug))("%s — 캐러셀 10장 제한을 넘지 않는다", (slug) => {
    expect(cardSetBySlug(slug)!.cards.length).toBeLessThanOrEqual(10);
  });

  it.each(cardSets.map((s) => s.slug))("%s — 숫자를 쓴 카드에는 출처가 있다", (slug) => {
    for (const card of cardSetBySlug(slug)!.cards) {
      if (card.kind === "cta") continue;
      expect(card.footnote.length).toBeGreaterThan(0);
    }
  });

  it.each(cardSets.map((s) => s.slug))("%s — 강조 표시가 닫혀 있다", (slug) => {
    for (const card of cardSetBySlug(slug)!.cards) {
      const texts =
        card.kind === "list"
          ? card.items.map((i) => i.text)
          : card.kind === "note"
            ? [card.body]
            : [];
      for (const t of texts) {
        // 파싱 후 남은 원시 표시가 있으면 문법이 깨진 것이다.
        const rendered = parseMarkup(t)
          .map((tok) => tok.text)
          .join("");
        expect(rendered).not.toMatch(/\[\[|\]\]|\{\{|\}\}/);
      }
    }
  });
});

/**
 * 상속세 카드는 "배우자가 있고 없고"로 면제한도가 갈리는 것이 전부다.
 * 표의 금액이 계산기와 어긋나면 인스타에 나간 이미지를 고칠 수 없다.
 */
describe("inheritance-tax 카드", () => {
  const set = cardSetBySlug("inheritance-tax");

  /**
   * 상속세는 자릿수가 커서 "2억 3,280만 원" 처럼 억이 앞에 붙는다.
   * 공용 parseWon 은 만 단위까지만 읽으므로 여기서 따로 읽는다.
   */
  const parseEok = (label: string): number => {
    const m = label.match(
      /^(?:([\d,]+)억)?\s*(?:([\d,]+)만)?\s*(?:([\d,]+)\s*)?원$/,
    );
    if (!m) throw new Error(`읽을 수 없는 금액 표기: ${label}`);
    const n = (v?: string) => (v ? Number(v.replace(/,/g, "")) : 0);
    return n(m[1]) * 100_000_000 + n(m[2]) * 10_000 + n(m[3]);
  };

  it("세트가 존재한다", () => {
    expect(set).toBeDefined();
  });

  it("면제한도 표가 계산기의 공제 합계와 같다", () => {
    const table = set!.cards.find(
      (c) => c.kind === "table" && c.title.includes("얼마부터"),
    );
    if (table?.kind !== "table") throw new Error("면제한도 표 없음");
    const byLabel = (needle: string) =>
      table.rows.find((r) => r.label.includes(needle))!;

    expect(parseEok(byLabel("배우자 + 자녀").value)).toBe(
      inheritanceCeiling({ hasSpouse: true, children: 2 }),
    );
    expect(parseEok(byLabel("자녀만").value)).toBe(
      inheritanceCeiling({ hasSpouse: false, children: 2 }),
    );
  });

  it("세액 표의 모든 행이 계산기 결과와 일치한다", () => {
    const table = set!.cards.find(
      (c) => c.kind === "table" && c.title.includes("배우자와 자녀"),
    );
    if (table?.kind !== "table") throw new Error("세액 표 없음");
    for (const row of table.rows) {
      const estate = Number(row.label.replace(/[^\d]/g, "")) * 100_000_000;
      const r = computeInheritance({ estate, hasSpouse: true, children: 2 });
      expect(parseEok(row.value)).toBe(r.payable);
    }
  });

  it("표지의 금액이 배우자 없는 10억 상속의 세액이다", () => {
    const cover = set!.cards.find((c) => c.kind === "cover");
    if (cover?.kind !== "cover") throw new Error("표지 없음");
    const noSpouse = computeInheritance({
      estate: 1_000_000_000,
      hasSpouse: false,
      children: 2,
    });
    const withSpouse = computeInheritance({
      estate: 1_000_000_000,
      hasSpouse: true,
      children: 2,
    });
    // "한 집은 0원, 한 집은 8,730만원"
    expect(withSpouse.payable).toBe(0);
    expect(cover.title).toContain(
      (noSpouse.payable / 10000).toLocaleString("ko-KR"),
    );
  });

  it("26번 글(상속세)을 가리킨다", () => {
    const cta = set!.cards.find((c) => c.kind === "cta");
    if (cta?.kind !== "cta") throw new Error("cta 없음");
    expect(entryByNo(cta.refNo!)?.href).toBe("/guide/inheritance-tax/");
  });
});

describe("카드가 지목하는 번호", () => {
  it("refNo 는 허브에 실제로 있는 번호다 — 없는 번호를 가리키면 독자가 길을 잃는다", () => {
    for (const set of cardSets) {
      for (const card of set.cards) {
        if (card.kind !== "cta" || card.refNo === undefined) continue;
        expect(entryByNo(card.refNo)).toBeDefined();
      }
    }
  });

  it("pension-2026 은 국민연금 보험료 글을 가리킨다", () => {
    const cta = cardSetBySlug("pension-2026")!.cards.find((c) => c.kind === "cta");
    if (cta?.kind !== "cta") throw new Error("cta 없음");
    expect(entryByNo(cta.refNo!)?.href).toBe("/guide/pension-premium-2026/");
  });
});

describe("vat-filing 카드", () => {
  const set = cardSetBySlug("vat-filing");
  const all = JSON.stringify(set);

  it("세트가 존재한다", () => {
    expect(set).toBeDefined();
  });

  it("납부의무 면제 기준이 rates 값과 같다", () => {
    const man = vat.simplified.paymentExemptionUnder / 10000;
    expect(all).toContain(`${man.toLocaleString()}만원`);
  });

  it("현황신고 기한이 rates 값과 같다", () => {
    // "다음 해 2월 10일" 에서 날짜 부분만 대조한다.
    expect(vat.closingReportDeadline).toContain("2월 10일");
    expect(all).toContain("2월 10일");
  });

  it("확정신고 기간이 rates 값과 같다", () => {
    expect(vat.filing.period2.finalReturn).toContain("1월 1일~1월 25일");
    expect(all).toContain("1월 1일~25일");
    expect(vat.filing.period1.finalReturn).toContain("7월 1일~7월 25일");
    expect(all).toContain("7월 1일~25일");
  });

  it("예정고지 달이 rates 값과 같다", () => {
    expect(all).toContain(vat.filing.prepaymentMonths);
  });

  it("예정고지 비율을 퍼센트로 옮겨 적었다", () => {
    expect(all).toContain(`${vat.filing.prepaymentRate * 100}%`);
  });

  it("12번 글(부가세 신고)을 가리킨다", () => {
    const cta = set!.cards.find((c) => c.kind === "cta");
    if (cta?.kind !== "cta") throw new Error("cta 없음");
    expect(entryByNo(cta.refNo!)?.href).toBe("/guide/vat-filing/");
  });
});

/**
 * 카드가 "13번 글" 이라고 지목해 놓고 사이트 버튼은 계산기로 보내고 있었다.
 * 세트가 자기 자신과 모순이면 읽는 사람만 헤맨다 — 둘은 같은 곳이어야 한다.
 */
describe("세트의 link 와 카드의 refNo 는 같은 곳을 가리킨다", () => {
  it.each(cardSets.map((s) => s.slug))("%s", (slug) => {
    const set = cardSets.find((s) => s.slug === slug)!;
    const cta = set.cards.find((c) => c.kind === "cta");
    if (!cta || cta.kind !== "cta" || cta.refNo === undefined) return;

    const entry = entryByNo(cta.refNo);
    expect(entry, `허브에 ${cta.refNo}번이 없다`).toBeDefined();
    expect(new URL(set.link).pathname).toBe(entry!.href);
  });
});

/**
 * 가산세 카드는 금액과 감면율을 동시에 말한다. 둘 중 하나만 틀려도
 * 카드를 본 사람이 신고 시점을 잘못 잡는다 — 회수할 수 없는 종류의 실수다.
 */
describe("late-filing-penalty 세트", () => {
  const set = cardSetBySlug("late-filing-penalty");

  it("감면율 표가 rates 와 같다", () => {
    const t = set?.cards.find(
      (c) => c.kind === "table" && c.sub.includes("감면율"),
    );
    if (t?.kind !== "table") throw new Error("감면율 표 없음");
    for (const step of penalty.lateFilingRelief) {
      const row = t.rows.find((r) => r.label.startsWith(`${step.withinMonths}개월`));
      expect(row, `${step.withinMonths}개월 행`).toBeDefined();
      expect(row!.value).toContain(`${step.relief * 100}%`);
    }
  });

  it("금액 표가 computeLateFiling 과 같다", () => {
    const t = set?.cards.find(
      (c) => c.kind === "table" && c.sub.includes("100만원"),
    );
    if (t?.kind !== "table") throw new Error("금액 표 없음");
    for (const row of t.rows) {
      const days = Number(row.label.replace(/[^\d]/g, ""));
      const expected = computeLateFiling({ tax: 1_000_000, daysLate: days }).total;
      expect(parseWon(row.value), `${days}일`).toBe(expected);
    }
  });

  it("리스트 카드가 현재 요율을 말한다", () => {
    const list = set?.cards.find((c) => c.kind === "list");
    if (list?.kind !== "list") throw new Error("리스트 카드 없음");
    const joined = list.items.map((i) => i.text).join(" ");
    // 0.00022 * 100 은 0.022000000000000002 가 된다 — 표시용으로 반올림해서
    // 비교한다. rateSchedule() 이 같은 함정을 1000배 트릭으로 피한 것과 같다.
    const pct = (n: number) => +(n * 100).toFixed(4);
    expect(joined).toContain(`${pct(penalty.noReport.general)}%`);
    expect(joined).toContain(`${pct(penalty.latePayment.dailyRate)}%`);
  });

  it("CTA 가 21번 글을 가리킨다", () => {
    const cta = set?.cards.find((c) => c.kind === "cta");
    if (cta?.kind !== "cta") throw new Error("CTA 없음");
    expect(cta.refNo).toBe(21);
  });
});

/**
 * 여러 거래처 카드는 "환급"과 "추가납부"를 같은 표에서 말한다. 부호가
 * 뒤집힌 채로 인쇄되면 읽는 사람이 정반대로 준비한다 — 금액뿐 아니라
 * 방향까지 계산 결과와 대조한다.
 */
describe("multiple-payers 세트", () => {
  const set = cardSetBySlug("multiple-payers");

  /** "6만 5,000원 추가납부" → { won, refund:false } */
  function parseOutcome(value: string) {
    const m = value.match(/^(.*원)\s*(환급|추가납부)$/);
    if (!m) throw new Error(`읽을 수 없는 결과 표기: ${value}`);
    return { won: parseWon(m[1]), refund: m[2] === "환급" };
  }

  /** 카드가 절대값만 찍으므로 계산 결과도 부호와 크기를 나눠 본다. */
  function expected(gross: number, expenseRate: number) {
    const diff = estimateRefund({ grossIncome: gross, expenseRate, dependents: 1 }).refund;
    return { won: Math.abs(diff), refund: diff >= 0 };
  }

  it("세트가 존재한다", () => {
    expect(set).toBeDefined();
  });

  it("거래처 수 표가 estimateRefund 와 같다", () => {
    const t = set?.cards.find((c) => c.kind === "table" && c.sub.includes("한 곳당 600만원"));
    if (t?.kind !== "table") throw new Error("거래처 수 표 없음");
    for (const row of t.rows) {
      // "10곳 (6,000만원)" 에서 괄호 안 합계를 읽는다.
      const man = Number(row.label.match(/\(([\d,]+)만원\)/)![1].replace(/,/g, ""));
      expect(parseOutcome(row.value), row.label).toEqual(expected(man * 10000, 0.6));
    }
  });

  it("경비율 30% 표가 estimateRefund 와 같다", () => {
    const t = set?.cards.find((c) => c.kind === "table" && c.sub.includes("경비율 30%"));
    if (t?.kind !== "table") throw new Error("경비율 30% 표 없음");
    for (const row of t.rows) {
      const man = Number(row.label.replace(/[^\d]/g, ""));
      expect(parseOutcome(row.value), row.label).toEqual(expected(man * 10000, 0.3));
    }
  });

  it("표지가 말하는 전환 지점이 실제로 뒤집히는 지점이다", () => {
    const cover = set?.cards.find((c) => c.kind === "cover");
    if (cover?.kind !== "cover") throw new Error("표지 없음");
    const man = Number(cover.sub.match(/([\d,]+)만원부터/)![1].replace(/,/g, ""));
    const at = man * 10000;
    // 그 금액에서는 추가납부이고, 10만원 앞에서는 아직 환급이어야 한다.
    expect(estimateRefund({ grossIncome: at, expenseRate: 0.6, dependents: 1 }).refund).toBeLessThan(0);
    expect(
      estimateRefund({ grossIncome: at - 100_000, expenseRate: 0.6, dependents: 1 }).refund,
    ).toBeGreaterThanOrEqual(0);
  });

  it("CTA 가 22번 글을 가리킨다", () => {
    const cta = set?.cards.find((c) => c.kind === "cta");
    if (cta?.kind !== "cta") throw new Error("CTA 없음");
    expect(entryByNo(cta.refNo!)?.href).toBe("/guide/multiple-payers/");
  });
});

describe("family-deduction 세트", () => {
  const set = cardSetBySlug("family-deduction");

  it("세트가 존재한다", () => {
    expect(set).toBeDefined();
  });

  it("세금 감소 표가 taxSaved 와 같다", () => {
    // "과세표준 1,400만원 (6%)" / "5,000만원 (15%)" 두 꼴을 모두 읽는다.
    const t = set?.cards.find(
      (c) => c.kind === "table" && c.sub.includes("1명당"),
    );
    if (t?.kind !== "table") throw new Error("세금 감소 표 없음");

    for (const row of t.rows) {
      const m = row.label.match(/([\d,]+)억?\s*([\d,]*)만원/);
      expect(m, `금액을 못 읽음: ${row.label}`).not.toBeNull();
      const base = row.label.includes("억")
        ? Number(m![1].replace(/,/g, "")) * 100_000_000 +
          Number((m![2] || "0").replace(/,/g, "")) * 10_000
        : Number(m![1].replace(/,/g, "")) * 10_000;

      const expected = taxSaved(base, deduction.basic.perPerson).total;
      expect(parseWon(row.value), row.label).toBe(expected);
    }
  });

  it("요건 표의 나이가 rates 와 같다", () => {
    const t = set?.cards.find(
      (c) => c.kind === "table" && c.sub.includes("소득금액"),
    );
    if (t?.kind !== "table") throw new Error("요건 표 없음");
    const find = (label: string) => t.rows.find((r) => r.label === label)!.value;

    expect(find("부모·조부모")).toContain(`${deduction.age.ascendant}세 이상`);
    expect(find("자녀·손자녀")).toContain(`${deduction.age.descendant}세 이하`);
    expect(find("형제자매")).toContain(`${deduction.age.siblingMax}세 이하`);
    expect(find("형제자매")).toContain(`${deduction.age.siblingMin}세 이상`);
  });

  it("표지가 말하는 132만원이 실제 계산과 같다", () => {
    // 표지 문구는 이미지로 구워져 회수할 수 없다. 전제(과세표준 7,000만원,
    // 부모 두 분)까지 같이 확인한다.
    const cover = set?.cards.find((c) => c.kind === "cover");
    if (cover?.kind !== "cover") throw new Error("표지 없음");

    const BASE = 70_000_000;
    const people: Person[] = [
      { relation: "self", age: 45, income: BASE },
      { relation: "ascendant", age: 74, income: 0, separatedForHousing: true },
      { relation: "ascendant", age: 71, income: 0, separatedForHousing: true },
    ];
    const withParents = computeDeduction(
      { isFemale: false, hasSpouse: false, totalIncome: BASE },
      people,
    );
    const gap =
      taxSaved(BASE, withParents.applied).total -
      taxSaved(BASE, deduction.basic.perPerson).total;

    expect(cover.sub).toContain("7,000만원");
    expect(cover.sub).toContain(`${Math.round(gap / 10_000).toLocaleString("ko-KR")}만원`);
  });

  it("부녀자·한부모 중복 배제를 말한다", () => {
    const note = set?.cards.find((c) => c.kind === "note");
    if (note?.kind !== "note") throw new Error("note 카드 없음");
    expect(note.body).toContain(
      `${deduction.additional.female.amount / 10_000}만원`,
    );
    expect(note.body).toContain(
      `${deduction.additional.singleParent.amount / 10_000}만원`,
    );
    // 더한 값(150만원)을 정답처럼 적으면 안 된다 — "틀립니다" 맥락에서만 나온다.
    expect(note.body).toContain("틀립니다");
  });

  it("23번 글을 가리킨다", () => {
    const cta = set?.cards.find((c) => c.kind === "cta");
    if (cta?.kind !== "cta") throw new Error("cta 없음");
    expect(entryByNo(cta.refNo!)?.href).toBe("/guide/family-deduction/");
  });
});

describe("vat-penalty 세트", () => {
  const set = cardSetBySlug("vat-penalty");

  it("세트가 존재한다", () => {
    expect(set).toBeDefined();
  });

  it("세금계산서 표의 금액이 요율 × 공급가액과 같다", () => {
    const t = set!.cards[1];
    if (t.kind !== "table") throw new Error("표 카드 없음");
    const SUPPLY = 10_000_000;
    const expected: Record<string, number> = {
      "지연발급 1%": vatPenalty.taxInvoice.lateIssue,
      "미발급 2%": vatPenalty.taxInvoice.notIssued,
      "부실기재 1%": vatPenalty.taxInvoice.wrongEntry,
      "전자 미전송 0.5%": vatPenalty.taxInvoice.eTransmitNone,
      };
    for (const row of t.rows) {
      const rate = expected[row.label];
      expect(rate, `요율을 못 찾음: ${row.label}`).toBeDefined();
      expect(parseWon(row.value)).toBe(onSupply(SUPPLY, rate));
    }
  });

  it("합계표·등록 표의 금액이 요율 × 기준금액과 같다", () => {
    const t = set!.cards[3];
    if (t.kind !== "table") throw new Error("표 카드 없음");
    const cases: [string, number, number][] = [
      ["매출 합계표 미제출 0.5%", vatPenalty.salesList.notSubmitted, 10_000_000],
      ["예정신고 빠뜨림 0.3%", vatPenalty.salesList.lateAtFinalReturn, 10_000_000],
      ["매입 합계표 미제출 0.5%", vatPenalty.purchaseList.notSubmittedOrWrong, 10_000_000],
      ["사업자등록 지연 1%", vatPenalty.registration.lateRegistration, 30_000_000],
      ];
    for (const [label, rate, base] of cases) {
      const row = t.rows.find((r) => r.label === label);
      expect(row, `행을 못 찾음: ${label}`).toBeDefined();
      expect(parseWon(row!.value)).toBe(onSupply(base, rate));
    }
  });

  it("출처는 전부 부가가치세법 제60조다 — 국세기본법 가산세와 섞이면 안 된다", () => {
    for (const card of set!.cards) {
      if (card.kind === "cta") continue;
      expect(card.footnote).toContain("부가가치세법 제60조");
      expect(card.footnote).not.toContain("국세기본법");
    }
  });

  it("24번 글을 가리킨다", () => {
    const cta = set!.cards[set!.cards.length - 1];
    if (cta.kind !== "cta") throw new Error("cta 없음");
    expect(entryByNo(cta.refNo!)?.href).toBe("/guide/vat-penalty/");
  });
});

/**
 * 증여세 카드는 관계별 한도와 금액을 동시에 말한다. 한도를 잘못 박으면
 * "괜찮은 줄 알고" 넘긴 사람이 생기고, 그건 이미지로 나간 뒤에 못 고친다.
 */
describe("gift-tax 세트", () => {
  const set = cardSetBySlug("gift-tax");

  it("관계별 한도 표가 rates 와 같다", () => {
    const t = set?.cards.find(
      (c) => c.kind === "table" && c.sub.includes("10년간"),
    );
    if (t?.kind !== "table") throw new Error("한도 표 없음");
    const expected: Record<string, number> = {
      배우자: relationCap("spouse"),
      "부모·조부모": relationCap("ascendant"),
      "자녀·손자녀": relationCap("descendant"),
      "형제자매·삼촌·사위": relationCap("relative"),
      "그 외의 사람": relationCap("other"),
    };
    for (const row of t.rows) {
      const want = expected[row.label];
      expect(want, `표에 없는 관계: ${row.label}`).toBeDefined();
      const got = row.value === "0원"
        ? 0
        : row.value.endsWith("억 원")
          ? Number(row.value.replace(/[^\d]/g, "")) * 100_000_000
          : parseWon(row.value);
      expect(got, row.label).toBe(want);
    }
  });

  it("금액 표가 계산 함수 결과와 일치한다", () => {
    const t = set?.cards.find(
      (c) => c.kind === "table" && c.sub.includes("신고세액공제"),
    );
    if (t?.kind !== "table") throw new Error("금액 표 없음");
    for (const row of t.rows) {
      const 억 = Number(row.label.replace(/[^\d]/g, "")) * 100_000_000;
      const r = computeGift({ amount: 억, relation: "ascendant" });
      expect(parseWon(row.value), row.label).toBe(r.payable);
    }
  });

  it("표지가 말하는 경계는 5천만 + 혼인·출산 1억이다", () => {
    const cover = set?.cards.find((c) => c.kind === "cover");
    if (cover?.kind !== "cover") throw new Error("표지 없음");
    const ceiling = taxFreeCeiling("ascendant", { marriageBirth: true });
    expect(ceiling).toBe(150_000_000);
    expect(cover.title).toContain("1억 5천만원");
    expect(cover.sub).toContain(
      `${gift.marriageBirthDeduction.marriageWindowYears}년`,
    );
  });

  it("신고기한 카드가 rates 의 개월 수를 말한다", () => {
    const note = set?.cards.find((c) => c.kind === "note");
    if (note?.kind !== "note") throw new Error("note 카드 없음");
    expect(note.title).toContain(`${gift.deadline.months}개월`);
  });

  it("27번 글(증여세)을 가리킨다", () => {
    const cta = set!.cards.find((c) => c.kind === "cta");
    if (cta?.kind !== "cta") throw new Error("cta 없음");
    expect(entryByNo(cta.refNo!)?.href).toBe("/guide/gift-tax/");
  });
});
