/**
 * 인적공제 — 기본공제와 추가공제.
 *
 * 소득세법 제50조·제51조·제53조. 숫자는 전부 rates/deduction-2026.json 에서
 * 온다. 여기서 하는 일은 **법이 정한 조건을 코드로 옮기는 것**뿐이다.
 *
 * 이 파일이 조심하는 세 가지:
 *
 * 1. **부녀자와 한부모는 더하지 않는다.** 제51조 제1항 단서가 둘 다
 *    해당하면 제6호(한부모)를 적용한다고 못박는다. 50만 + 100만 = 150만
 *    이라고 쓴 글이 흔한데 틀렸다.
 * 2. **공제 합계는 종합소득금액에서 잘린다.** 제51조 제4항. 식구를 아무리
 *    넣어도 소득금액을 넘는 부분은 없는 것으로 한다 — 소득이 적을수록
 *    공제를 더 넣어도 돌아오는 게 없다.
 * 3. **나이는 과세기간 중 하루라도 해당하면 된다.** 제53조 제5항.
 *    올해 스물한 살이 되는 자녀도, 생일 전이라면 그 해는 대상이다.
 */
import rates from "../rates/deduction-2026.json";
import taxRates from "../rates/2026.json";
import { won } from "./money";

export type Relation =
  | "self"
  | "spouse"
  | "ascendant"
  | "descendant"
  | "sibling";

export interface Person {
  relation: Relation;
  /** 과세기간 중 도달하는 나이(제53조 제5항). 본인·배우자는 쓰지 않는다. */
  age: number;
  /** 연간 소득금액. 본인에게는 소득 요건이 없다. */
  income: number;
  /** 근로소득만 있는 경우 총급여 기준(500만원)으로 본다. */
  salaryOnly?: boolean;
  disabled?: boolean;
  /**
   * 주민등록상 같이 사는가. 직계비속은 따로 살아도 되고(제53조 제1항 단서),
   * 직계존속은 주거 형편에 따른 별거면 같이 사는 것으로 본다(같은 조 제3항).
   */
  livesTogether?: boolean;
  /** 직계존속이 주거 형편 때문에 떨어져 사는 경우(제53조 제3항). */
  separatedForHousing?: boolean;
}

export interface PersonCheck {
  ok: boolean;
  /** 통과하지 못한 이유. 통과했으면 빈 배열. */
  blockers: string[];
  /** 이 사람 몫의 기본공제 */
  basic: number;
  /** 이 사람 몫의 추가공제 항목 */
  additions: { label: string; amount: number }[];
}

const A = rates.additional;

/** 소득 요건(제50조 제1항 제2호·제3호). 본인은 보지 않는다. */
function incomeOk(p: Person): boolean {
  if (p.relation === "self") return true;
  const limit = p.salaryOnly ? rates.incomeTest.salaryOnly : rates.incomeTest.amount;
  return p.income <= limit;
}

/** 나이 요건(제50조 제1항 제3호). 장애인은 나이 제한이 없다. */
function ageOk(p: Person): boolean {
  if (p.relation === "self" || p.relation === "spouse") return true;
  if (p.disabled) return true;
  const { ascendant, descendant, siblingMax, siblingMin } = rates.age;
  if (p.relation === "ascendant") return p.age >= ascendant;
  if (p.relation === "descendant") return p.age <= descendant;
  return p.age <= siblingMax || p.age >= siblingMin;
}

/** 생계 요건(제53조). 직계비속은 동거를 따지지 않는다. */
function livingOk(p: Person): boolean {
  if (p.relation === "self" || p.relation === "spouse") return true;
  if (p.relation === "descendant") return true;
  if (p.livesTogether) return true;
  // 직계존속만 주거 형편에 따른 별거가 인정된다(제53조 제3항).
  return p.relation === "ascendant" && p.separatedForHousing === true;
}

export function checkPerson(p: Person): PersonCheck {
  const blockers: string[] = [];
  if (!incomeOk(p)) {
    blockers.push(
      p.salaryOnly
        ? `총급여 ${rates.incomeTest.salaryOnly.toLocaleString("ko-KR")}원 초과`
        : `소득금액 ${rates.incomeTest.amount.toLocaleString("ko-KR")}원 초과`,
    );
  }
  if (!ageOk(p)) blockers.push("나이 요건 미달");
  if (!livingOk(p)) blockers.push("생계를 같이 하지 않음");

  const ok = blockers.length === 0;
  const additions: { label: string; amount: number }[] = [];
  if (ok) {
    if (p.disabled) additions.push({ label: A.disabled.label, amount: A.disabled.amount });
    if (p.age >= A.elderly.age) {
      additions.push({ label: A.elderly.label, amount: A.elderly.amount });
    }
  }
  return { ok, blockers, basic: ok ? rates.basic.perPerson : 0, additions };
}

export interface Filer {
  isFemale: boolean;
  hasSpouse: boolean;
  /** 종합소득금액. 부녀자공제의 3천만원 한도와 제51조 제4항의 절사에 쓴다. */
  totalIncome: number;
}

/**
 * 신고인 본인에게만 붙는 추가공제 — 부녀자(제3호)와 한부모(제6호).
 * 둘 다 해당하면 한부모만 적용한다(제51조 제1항 단서).
 */
export function filerAddition(
  filer: Filer,
  people: Person[],
): { label: string; amount: number } | null {
  const eligibleDescendant = people.some(
    (p) => p.relation === "descendant" && checkPerson(p).ok,
  );
  const singleParent = !filer.hasSpouse && eligibleDescendant;

  const hasDependent = people.some(
    (p) => p.relation !== "self" && p.relation !== "spouse" && checkPerson(p).ok,
  );
  const female =
    filer.isFemale &&
    filer.totalIncome <= A.female.incomeCap &&
    (filer.hasSpouse || hasDependent);

  // 단서: 둘 다면 한부모.
  if (singleParent) return { label: A.singleParent.label, amount: A.singleParent.amount };
  if (female) return { label: A.female.label, amount: A.female.amount };
  return null;
}

export interface DeductionResult {
  /** 기본공제 대상 인원 */
  count: number;
  basic: number;
  additional: number;
  /** 절사 전 합계 */
  raw: number;
  /** 제51조 제4항으로 잘려나간 금액 */
  discarded: number;
  /** 실제로 소득금액에서 빠지는 금액 */
  applied: number;
  items: { label: string; amount: number }[];
}

export function computeDeduction(filer: Filer, people: Person[]): DeductionResult {
  const checks = people.map(checkPerson);
  const passed = checks.filter((c) => c.ok);

  const basic = passed.length * rates.basic.perPerson;
  const items: { label: string; amount: number }[] = [];
  let additional = 0;
  for (const c of checks) {
    for (const a of c.additions) {
      additional += a.amount;
      items.push(a);
    }
  }
  const own = filerAddition(filer, people);
  if (own) {
    additional += own.amount;
    items.push(own);
  }

  const raw = basic + additional;
  // 제51조 제4항 — 소득금액을 넘는 부분은 없는 것으로 한다.
  const applied = Math.min(raw, Math.max(0, filer.totalIncome));
  return {
    count: passed.length,
    basic,
    additional,
    raw,
    discarded: raw - applied,
    applied,
    items,
  };
}

/** 과세표준에 붙는 산출세액(지방소득세 제외). */
export function taxOn(base: number): number {
  const b = Math.max(0, base);
  const bracket = taxRates.incomeTaxBrackets.find(
    (x) => x.upTo === null || b <= x.upTo,
  )!;
  return Math.max(0, won(b * bracket.rate - bracket.deduction));
}

/**
 * 공제 한 칸이 세금으로 얼마인가.
 *
 * 공제는 세금을 그만큼 깎아주는 게 아니라 **과세표준을 줄인다.** 150만원을
 * 공제받아도 돌아오는 돈은 세율만큼이다. 이 함수가 그 차이를 보여준다 —
 * 지방소득세(소득세액의 10%)까지 더한 실제 차액이다.
 */
export function taxSaved(base: number, deduction: number) {
  const before = taxOn(base);
  const after = taxOn(base - deduction);
  const national = before - after;
  const local = won(national * taxRates.localTaxRate);
  return { national, local, total: national + local };
}
