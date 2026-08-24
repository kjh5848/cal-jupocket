/**
 * 콘텐츠 클러스터 정의 — 같은 주제의 글·계산기를 한 묶음으로 본다.
 *
 * 가이드 글의 사이드바(RelatedContent.astro)·썸네일(ArticleThumb.astro)·
 * 내부 링크가 이 한 곳을 근거로 움직인다. 글을 추가하면 여기 links에 한
 * 줄(icon 포함) 넣으면 사이드바·썸네일에 자동 반영된다.
 *
 * kind: "calc"는 계산기(사이드바 배지), "guide"는 설명 글.
 * icon: data/icons.ts의 키(썸네일 워터마크 아이콘).
 */
export interface ClusterLink {
  href: string;
  title: string;
  kind: "calc" | "guide";
  icon: string;
}

export interface Cluster {
  id: string;
  /** 사이드바·썸네일 라벨 */
  title: string;
  links: ClusterLink[];
}

/** 클러스터별 썸네일 색(고정 — 그래픽/이미지처럼 라이트·다크 공통). */
export const clusterColor: Record<
  string,
  { bg: string; wm: string; ink: string; mark: string }
> = {
  income: { bg: "#e1f5ee", wm: "#9fe1cb", ink: "#0f6e56", mark: "#0f6e56" },
  vat: { bg: "#e6f1fb", wm: "#b5d4f4", ink: "#0c447c", mark: "#0b5cad" },
  retirement: { bg: "#eeedfe", wm: "#cecbf6", ink: "#3c3489", mark: "#534ab7" },
};

export const clusters: Cluster[] = [
  {
    id: "income",
    title: "종합소득세·원천징수",
    links: [
      { href: "/freelancer-33/", title: "프리랜서 3.3% 계산기", kind: "calc", icon: "percent" },
      { href: "/withholding/", title: "원천징수 계산기 (3.3%·8.8%)", kind: "calc", icon: "receipt" },
      { href: "/income-tax-refund/", title: "종소세 환급 예상 계산기", kind: "calc", icon: "coins" },
      { href: "/guide/33-settlement/", title: "3.3%는 종합소득세에서 정산됩니다", kind: "guide", icon: "refresh" },
      { href: "/guide/who-must-file/", title: "종합소득세 신고 대상, 나는 해야 하나", kind: "guide", icon: "checklist" },
      { href: "/guide/income-tax-brackets/", title: "종합소득세 세율 구간(2026)", kind: "guide", icon: "chart" },
      { href: "/guide/expense-rate/", title: "단순경비율 vs 기준경비율", kind: "guide", icon: "document" },
    ],
  },
  {
    id: "vat",
    title: "부가가치세",
    links: [
      { href: "/vat/", title: "부가세 계산기", kind: "calc", icon: "calculator" },
      { href: "/guide/vat-freelancer/", title: "프리랜서도 부가세를 내야 하나요?", kind: "guide", icon: "receipt" },
      { href: "/guide/simplified-vat/", title: "간이과세 vs 일반과세, 뭐가 유리한가", kind: "guide", icon: "scale" },
      { href: "/guide/vat-filing/", title: "부가세 신고, 언제 어떻게 하나", kind: "guide", icon: "calendar" },
    ],
  },
  {
    id: "retirement",
    title: "프리랜서 노후·연금",
    links: [
      { href: "/national-pension-premium/", title: "국민연금 보험료 계산기 (지역가입)", kind: "calc", icon: "calculator" },
      { href: "/guide/retirement-planning/", title: "프리랜서 노후대비, 순서대로 정리", kind: "guide", icon: "umbrella" },
      { href: "/guide/national-pension-estimate/", title: "국민연금 예상수령액 조회 후 시점 정하기", kind: "guide", icon: "calendar" },
      { href: "/guide/pension-savings-tax-credit/", title: "연금저축·IRP 세액공제 한도(2026)", kind: "guide", icon: "coins" },
      { href: "/guide/irp-account/", title: "IRP란? 프리랜서도 열 수 있는 계좌", kind: "guide", icon: "wallet" },
      { href: "/guide/retirement-fund/", title: "노후자금 얼마 있어야 하나", kind: "guide", icon: "chart" },
      { href: "/guide/severance-to-freelance/", title: "퇴사하고 프리랜서 시작할 때", kind: "guide", icon: "briefcase" },
    ],
  },
];

/** 경로 정규화 — 뒤 슬래시 유무를 흡수한다. */
function norm(path: string): string {
  const p = path.split("?")[0].split("#")[0];
  return p.endsWith("/") ? p : p + "/";
}

/**
 * 주어진 경로가 속한 클러스터에서, 현재 글을 뺀 나머지 링크를 돌려준다.
 * 어느 클러스터에도 없으면 null.
 */
export function relatedFor(
  path: string,
): { title: string; links: ClusterLink[] } | null {
  const here = norm(path);
  const cluster = clusters.find((c) =>
    c.links.some((l) => norm(l.href) === here),
  );
  if (!cluster) return null;
  const links = cluster.links.filter((l) => norm(l.href) !== here);
  if (links.length === 0) return null;
  return { title: cluster.title, links };
}

/**
 * 주어진 경로의 썸네일 정보(클러스터 라벨·색·아이콘). 클러스터에 없으면 null.
 */
export function thumbFor(path: string): {
  clusterTitle: string;
  icon: string;
  color: { bg: string; wm: string; ink: string; mark: string };
} | null {
  const here = norm(path);
  const cluster = clusters.find((c) =>
    c.links.some((l) => norm(l.href) === here),
  );
  if (!cluster) return null;
  const link = cluster.links.find((l) => norm(l.href) === here)!;
  return {
    clusterTitle: cluster.title,
    icon: link.icon,
    color: clusterColor[cluster.id],
  };
}
