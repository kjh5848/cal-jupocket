/**
 * CPA 제휴 광고 등록부.
 *
 * 링크가 바뀌면 이 줄만 고친다. 글(src/pages)에는 추적 링크를 직접 쓰지
 * 않는다 — 네트워크가 준 링크는 유효기간이 있고 캠페인이 끝나면 바뀌는데,
 * 글마다 박아 두면 죽은 링크가 어디 남았는지 아무도 모른다. 글에는
 * `<AffiliateBox id="..." />` 만 두고, 주소·기간·켜고 끄기는 여기서 한다.
 *
 * 등록 방법
 *   1. 네트워크(디비디비딥·애드릭스·디비센스)에서 캠페인 승인 → 추적 링크 발급.
 *      한 광고주는 한 네트워크에서만 신청한다(중복 신청은 무효 처리).
 *      캠페인의 허용 채널(구글전용·당근전용 등)에 "웹사이트/검색"이 있는지 먼저 본다.
 *   2. 아래 항목의 url 에 링크, issuedOn 에 발급일, expiresOn 에 만료일
 *      (모르면 비움)을 넣고 active: true 로 바꾼다.
 *      예) { id: "moving-quote", ..., url: "https://...발급받은링크", issuedOn: "2026-11-02", expiresOn: "2026-12-31", active: true }
 *   3. 글에 `<AffiliateBox id="moving-quote" />` 를 넣는다(후보 목록: docs/affiliates.md).
 *   4. `npx vitest run src/lib/__tests__/affiliates.test.ts` — 만료 14일 전부터
 *      테스트가 깨져 갱신할 때를 알려 준다.
 *
 * 화면 판단은 빌드 시점 날짜(한국 시각)로 한다. 정적 사이트라 만료일이 지나도
 * 다음 빌드 전까지는 상자가 남을 수 있다 — 그래서 테스트가 14일 앞서 알린다.
 */

export type AffiliateNetwork = "dbdbdeep" | "adlix" | "dbsense";
export type AffiliateCategory = "moving" | "legal" | "cleaning";

export interface Affiliate {
  /** 글에서 부르는 이름. 바꾸면 그 id 를 쓰는 글도 같이 고쳐야 한다(테스트가 잡는다). */
  id: string;
  network: AffiliateNetwork;
  /** 광고주(업체) 이름 — 한 광고주는 한 네트워크에서만. */
  advertiser: string;
  category: AffiliateCategory;
  /** 네트워크가 발급한 추적 링크. https 만. 비어 있으면 active 일 수 없다. */
  url: string;
  /** 발급일 YYYY-MM-DD */
  issuedOn: string;
  /** 만료일 YYYY-MM-DD(그날까지 유효). 모르면 생략. */
  expiresOn?: string;
  active: boolean;
  /** 상자 제목 */
  title: string;
  /** 상자 한 줄 설명 */
  blurb: string;
}

export const affiliates: Affiliate[] = [
  {
    id: "moving-quote",
    network: "dbdbdeep",
    advertiser: "(미정) 이사 견적 비교",
    category: "moving",
    url: "",
    issuedOn: "",
    active: false,
    title: "이사 견적, 여러 업체 한 번에 받아 보기",
    blurb: "날짜·짐 양을 한 번 적으면 이사업체 견적을 비교해 볼 수 있습니다.",
  },
  {
    id: "legal-registry",
    network: "adlix",
    advertiser: "(미정) 법무사 등기 상담",
    category: "legal",
    url: "",
    issuedOn: "",
    active: false,
    title: "등기·상속 서류, 법무사 상담 받아 보기",
    blurb: "소유권 이전·상속 등기 비용과 필요 서류를 법무사에게 물어볼 수 있습니다.",
  },
  {
    id: "cleaning-movein",
    network: "dbsense",
    advertiser: "(미정) 입주청소",
    category: "cleaning",
    url: "",
    issuedOn: "",
    active: false,
    title: "입주청소 견적 받아 보기",
    blurb: "평수와 날짜를 적으면 입주청소 업체 견적을 받아 볼 수 있습니다.",
  },
];

/** 오늘(한국 시각) YYYY-MM-DD */
export function todayKst(now = new Date()): string {
  return new Date(now.getTime() + 9 * 3600_000).toISOString().slice(0, 10);
}

/**
 * 화면에 내보낼 항목. 없거나, 꺼져 있거나, 링크가 비었거나, 만료됐으면 null.
 * expiresOn 당일까지는 유효로 본다.
 */
export function affiliateLink(id: string, today: string = todayKst()): Affiliate | null {
  const a = affiliates.find((x) => x.id === id);
  if (!a || !a.active || !a.url) return null;
  if (a.expiresOn && a.expiresOn < today) return null;
  return a;
}
