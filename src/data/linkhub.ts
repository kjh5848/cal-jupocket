/**
 * 프로필 링크 허브(링크트리형)의 번호표.
 *
 * ⚠️ 번호는 절대 바꾸지 않는다. 인스타 카드에 "더 자세한 내용은 13번 글"
 * 이라고 박혀서 나가는데, 그 카드는 이미 발행돼 회수할 수 없다. 번호를
 * 재정렬하거나 재사용하면 예전 카드가 엉뚱한 글을 가리키게 된다.
 *
 * 규칙:
 *  - 새 글은 항상 다음 번호를 받는다 (현재 최대 + 1)
 *  - 글을 내려도 그 번호는 비워 둔다 — 다른 글에 물려주지 않는다
 *  - 정렬 순서와 번호는 별개다. 화면 순서는 order 로 바꾸고 no 는 둔다
 *
 * clusters.ts 가 링크의 원본이고, 여기는 번호만 얹는다. 둘이 어긋나면
 * lib/__tests__/linkhub.test.ts 가 깨진다.
 */

export interface HubEntry {
  /** 고정 번호. 한 번 정하면 바뀌지 않는다. */
  no: number;
  href: string;
  /** 허브에서만 쓰는 짧은 제목. 목록에서 길면 못 읽는다. */
  label: string;
  kind: "calc" | "guide";
}

export const hubEntries: HubEntry[] = [
  { no: 1, href: "/freelancer-33/", label: "프리랜서 3.3% 계산기", kind: "calc" },
  { no: 2, href: "/withholding/", label: "원천징수 계산기 (3.3%·8.8%)", kind: "calc" },
  { no: 3, href: "/income-tax-refund/", label: "종소세 환급 예상 계산기", kind: "calc" },
  { no: 4, href: "/vat/", label: "부가세 계산기", kind: "calc" },
  { no: 5, href: "/national-pension-premium/", label: "국민연금 보험료 계산기", kind: "calc" },

  { no: 6, href: "/guide/33-settlement/", label: "3.3%는 종합소득세에서 정산됩니다", kind: "guide" },
  { no: 7, href: "/guide/who-must-file/", label: "종합소득세 신고 대상, 나는 해야 하나", kind: "guide" },
  { no: 8, href: "/guide/income-tax-brackets/", label: "종합소득세 세율 구간 (2026)", kind: "guide" },
  { no: 9, href: "/guide/expense-rate/", label: "단순경비율 vs 기준경비율", kind: "guide" },
  { no: 10, href: "/guide/vat-freelancer/", label: "프리랜서도 부가세를 내야 하나요?", kind: "guide" },
  { no: 11, href: "/guide/simplified-vat/", label: "간이과세 vs 일반과세, 뭐가 유리한가", kind: "guide" },
  { no: 12, href: "/guide/vat-filing/", label: "부가세 신고, 언제 어떻게 하나", kind: "guide" },
  { no: 13, href: "/guide/pension-premium-2026/", label: "국민연금 보험료, 지역가입자는 얼마 내나", kind: "guide" },
  { no: 14, href: "/guide/retirement-planning/", label: "노후대비, 순서대로 정리", kind: "guide" },
  { no: 15, href: "/guide/national-pension-estimate/", label: "국민연금 예상수령액과 수령 시점", kind: "guide" },
  { no: 16, href: "/guide/pension-savings-tax-credit/", label: "연금저축·IRP 세액공제 한도 (2026)", kind: "guide" },
  { no: 17, href: "/guide/irp-account/", label: "IRP란? 소득 있으면 누구나", kind: "guide" },
  { no: 18, href: "/guide/retirement-fund/", label: "노후자금 얼마 있어야 하나", kind: "guide" },
  { no: 19, href: "/guide/severance-to-freelance/", label: "퇴사하고 프리랜서 시작할 때", kind: "guide" },
];

/** 다음에 쓸 번호. 새 글을 추가할 때 이 값을 쓴다. */
export function nextNo(): number {
  return Math.max(...hubEntries.map((e) => e.no)) + 1;
}

export function entryByNo(no: number): HubEntry | undefined {
  return hubEntries.find((e) => e.no === no);
}

export const calcEntries = hubEntries.filter((e) => e.kind === "calc");
export const guideEntries = hubEntries.filter((e) => e.kind === "guide");

/**
 * 허브 화면의 묶음. 19개를 한 줄로 늘어놓으면 번호를 찾기 어렵다.
 * 계산기를 먼저 두고, 글은 주제별로 나눈다. 색은 여기(묶음)에만 쓰고
 * 항목마다 배지를 달지 않는다 — 배지가 줄마다 붙으면 흔한 위젯처럼 보인다.
 */
export interface HubGroup {
  label: string;
  /** clusters.ts 의 id. 묶음 제목의 점 색에만 쓴다. null 이면 브랜드색. */
  cluster: string | null;
  entries: HubEntry[];
}

const inCluster = (prefixes: string[]) =>
  hubEntries.filter(
    (e) => e.kind === "guide" && prefixes.some((p) => e.href.startsWith(p)),
  );

export const hubGroups: HubGroup[] = [
  { label: "계산기", cluster: null, entries: calcEntries },
  {
    label: "종합소득세·원천징수",
    cluster: "income",
    entries: inCluster([
      "/guide/33-settlement",
      "/guide/who-must-file",
      "/guide/income-tax-brackets",
      "/guide/expense-rate",
    ]),
  },
  {
    label: "부가가치세",
    cluster: "vat",
    entries: inCluster([
      "/guide/vat-freelancer",
      "/guide/simplified-vat",
      "/guide/vat-filing",
    ]),
  },
  {
    label: "노후·연금",
    cluster: "retirement",
    entries: inCluster([
      "/guide/pension-premium-2026",
      "/guide/retirement-planning",
      "/guide/national-pension-estimate",
      "/guide/pension-savings-tax-credit",
      "/guide/irp-account",
      "/guide/retirement-fund",
      "/guide/severance-to-freelance",
    ]),
  },
];
