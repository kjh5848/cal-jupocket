/**
 * 카드뉴스 세트 정의.
 *
 * 인스타 피드 캐러셀 4:5(1080×1350). 디자인은 실제 고참여 게시물을 보고
 * 정했다 — 밝은 배경, 번호 리스트, 금액표, 형광펜 강조, 그리고 출처.
 * (캐릭터 일러스트를 쓴 게시물은 좋아요 37개였고, 밀도 높은 표는 850개였다.)
 *
 * 숫자는 rates/*.json 검증본에서만 가져온다. 여기에 직접 적은 값도 전부
 * 그 파일과 대조한 것이다 — 확인 안 된 숫자는 카드에 넣지 않는다.
 *
 * 문구 강조: [[형광펜]] {{경고}} — src/lib/card-markup.ts 참고.
 */
import { clusterColor } from "./clusters";

/**
 * 표지 카드 — 사진 위에 한 문장.
 *
 * 안쪽 카드는 밀도가 강점이지만(조밀한 표·번호 목록), 첫 장은 역할이
 * 다르다. 넘길지 말지를 0.5초에 정하게 만드는 자리라 읽을거리가 아니라
 * 멈춤장치여야 한다. 그래서 표지만 사진을 쓴다.
 *
 * 사진은 public/photos/ 에 두고 흑백·저채도로 고른다 — 브랜드색과
 * 형광펜이 그 위에 얹히기 때문이다.
 */
export interface CoverCard {
  kind: "cover";
  /** public 기준 경로. 예: /photos/card-calendar.jpg */
  photo: string;
  /** 사진 설명 — 스크린샷에는 안 나오지만 갤러리 alt 로 쓴다. */
  photoAlt: string;
  badge: string;
  title: string;
  /** 제목 아래 한 줄. 숫자를 여기 둔다. */
  sub: string;
  footnote: string;
}

export interface ListCard {
  kind: "list";
  badge: string;
  title: string;
  /** detail 은 한 줄짜리 보조 설명. 카드가 비어 보이지 않게 하는 동시에
   *  "그래서 나한테 얼마인데"를 바로 답해준다. */
  items: { text: string; detail: string }[];
  footnote: string;
}

export interface TableCard {
  kind: "table";
  title: string;
  sub: string;
  rows: { label: string; value: string; tone?: "mark" | "warn" }[];
  footnote: string;
}

export interface NoteCard {
  kind: "note";
  badge: string;
  title: string;
  body: string;
  footnote: string;
}

export interface CtaCard {
  kind: "cta";
  title: string;
  sub: string;
  /** 프로필 링크 허브(data/linkhub.ts)의 번호. 카드가 "13번 글"이라고
   *  지목하면 독자가 허브에서 그 번호를 찾는다. 번호는 고정이라 안전하다. */
  refNo?: number;
}

export type Card = CoverCard | ListCard | TableCard | NoteCard | CtaCard;

export interface CardSet {
  slug: string;
  /** clusters.ts 의 클러스터 id. 액센트 색을 여기서 가져온다. */
  cluster: keyof typeof clusterColor;
  /** 캡션에 붙일 글 주소. */
  link: string;
  cards: Card[];
}

export const cardSets: CardSet[] = [
  {
    slug: "pension-2026",
    cluster: "retirement",
    link: "https://jupocket.com/guide/pension-premium-2026/",
    cards: [
      {
        kind: "list",
        badge: "2026 국민연금",
        title: "올해 바뀌는 것 4가지",
        items: [
          {
            text: "보험료율 [[9% → 9.5%]]",
            detail: "월소득 300만원이면 월 28만 5,000원",
          },
          {
            text: "기준소득월액 상한 [[659만원]]",
            detail: "이보다 많이 벌어도 보험료는 그대로",
          },
          {
            text: "기준소득월액 하한 41만원",
            detail: "적게 벌어도 이만큼 기준으로는 냄",
          },
          {
            text: "지역가입자는 {{전액 본인 부담}}",
            detail: "직장인은 회사와 절반씩 나눠 냄",
          },
        ],
        footnote: "2026.7.1~2027.6.30 적용 · 출처 국민연금공단",
      },
      {
        kind: "table",
        title: "월소득별 내 보험료",
        sub: "지역가입자 기준 · 2026년 9.5%",
        rows: [
          { label: "100만원", value: "9만 5,000원" },
          { label: "200만원", value: "19만 원" },
          { label: "300만원", value: "28만 5,000원" },
          { label: "400만원", value: "38만 원", tone: "mark" },
          { label: "500만원", value: "47만 5,000원" },
          { label: "600만원", value: "57만 원" },
          { label: "659만원 이상", value: "62만 6,050원", tone: "warn" },
        ],
        footnote: "10원 미만 절사 · 출처 국민연금공단",
      },
      {
        kind: "note",
        badge: "알아두면 좋은 것",
        title: "659만원에서 멈춥니다",
        body:
          "기준소득월액 상한이 659만원이라, 그 위로는 아무리 벌어도 보험료가 [[더 늘지 않습니다]].\n\n월 700만원을 벌든 1,500만원을 벌든 똑같이 62만 6,050원입니다.\n\n반대로 소득이 41만원보다 적어도 하한 41만원이 적용돼, 그만큼을 기준으로는 내야 합니다.\n\n상한과 하한은 {{매년 7월에 조정}}됩니다.",
        footnote: "출처 국민연금공단",
      },
      {
        kind: "cta",
        title: "표에 없는\n내 소득은?",
        sub: "계산기에 금액만 넣으면 바로 나와요",
        refNo: 13,
      },
    ],
  },
  {
    slug: "vat-filing",
    cluster: "vat",
    link: "https://jupocket.com/guide/vat-filing/",
    cards: [
      {
        kind: "list",
        badge: "부가세 신고",
        title: "놓치면 안 되는 날짜",
        items: [
          {
            text: "2기 확정신고 [[1월 1일~25일]]",
            detail: "작년 하반기(7~12월) 매출분",
          },
          {
            text: "1기 확정신고 [[7월 1일~25일]]",
            detail: "올해 상반기(1~6월) 매출분",
          },
          {
            text: "예정고지 납부 4월·10월",
            detail: "직전 과세기간 납부세액의 50%",
          },
          {
            text: "면세사업자는 {{2월 10일}}",
            detail: "부가세 신고가 아니라 사업장현황신고",
          },
        ],
        footnote: "개인사업자 기준 · 출처 국세청",
      },
      {
        kind: "table",
        title: "유형별 신고 시기",
        sub: "개인사업자 기준",
        rows: [
          { label: "일반과세", value: "1월·7월" },
          { label: "간이과세", value: "1월", tone: "mark" },
          { label: "면세사업자", value: "2월 10일", tone: "warn" },
        ],
        footnote: "간이과세는 연 1회 · 면세는 사업장현황신고 · 출처 국세청",
      },
      {
        kind: "note",
        badge: "놓치기 쉬운 것",
        title: "4,800만원 미만이면",
        body:
          "간이과세자는 해당 과세기간 공급대가가 4,800만원 미만이면 [[납부의무가 면제]]됩니다.\n\n다만 면제되는 건 '납부'이지 '신고'가 아닙니다. 신고는 그대로 해야 합니다.\n\n이 둘을 헷갈려서 {{신고까지 건너뛰면}} 문제가 됩니다.",
        footnote: "출처 국세청 · 부가가치세법 제69조",
      },
      {
        kind: "cta",
        title: "내 부가세는\n얼마일까?",
        sub: "공급가액만 넣으면 바로 나와요",
        refNo: 12,
      },
    ],
  },
  {
    slug: "late-filing-penalty",
    cluster: "income",
    link: "https://jupocket.com/guide/late-filing-penalty/",
    cards: [
      {
        kind: "cover",
        photo: "/photos/card-calendar.jpg",
        photoAlt: "달력의 날짜 숫자 클로즈업",
        badge: "종합소득세 · 부가세",
        title: "신고 놓쳤어도\n가산세는 깎입니다",
        sub: "1개월 안에 신고하면 무신고가산세 50% 감면. 6개월이 지나면 한 푼도 안 깎입니다.",
        footnote: "국세기본법 제48조 제2항 제2호 · 출처 국가법령정보센터",
      },
      {
        kind: "table",
        title: "며칠 늦었나로 갈린다",
        sub: "세액 100만원 기준 가산세 합계",
        rows: [
          { label: "10일", value: "102,200원" },
          { label: "30일", value: "106,600원", tone: "mark" },
          { label: "31일", value: "146,820원", tone: "warn" },
          { label: "181일", value: "239,820원" },
        ],
        footnote: "31일째 감면율이 50%에서 30%로 떨어진다 · 출처 국가법령정보센터",
      },
      {
        kind: "table",
        title: "언제 신고하느냐가 전부",
        sub: "무신고가산세 감면율",
        rows: [
          { label: "1개월 이내", value: "50% 감면", tone: "mark" },
          { label: "3개월 이내", value: "30% 감면" },
          { label: "6개월 이내", value: "20% 감면" },
          { label: "6개월 초과", value: "감면 없음", tone: "warn" },
        ],
        footnote: "국세기본법 제48조 제2항 제2호 · 출처 국가법령정보센터",
      },
      {
        kind: "list",
        badge: "신고 기한 지남",
        title: "가산세는 두 개가 따로 붙는다",
        items: [
          {
            text: "무신고가산세 [[세액의 20%]]",
            detail: "기한 후 신고하면 깎인다",
          },
          {
            text: "납부지연가산세 [[1일 0.022%]]",
            detail: "매일 늘고 감면 대상이 아니다",
          },
          {
            text: "깎이는 건 {{무신고분뿐}}",
            detail: "\"가산세 절반 감면\"은 절반만 맞는 말",
          },
          {
            text: "6개월 넘기면 감면 [[0%]]",
            detail: "국세기본법 제48조 제2항 제2호",
          },
        ],
        footnote: "국세기본법 제47조의2·제47조의4 · 출처 국가법령정보센터",
      },
      {
        kind: "note",
        badge: "놓치기 쉬운 것",
        title: "돈이 없어도 신고는 먼저",
        body:
          "세금을 당장 못 내도 [[신고부터 하면]] 무신고가산세가 깎입니다.\n\n신고와 납부는 별개입니다. 신고를 미루면 깎일 기회까지 같이 사라집니다.\n\n{{6개월이 지나면}} 감면이 아예 없어집니다.",
        footnote: "국세기본법 제48조 · 출처 국가법령정보센터",
      },
      {
        kind: "cta",
        title: "내 가산세는\n얼마일까?",
        sub: "세액과 지난 일수만 넣으면 나와요",
        refNo: 21,
      },
    ],
  },
  {
    slug: "multiple-payers",
    cluster: "income",
    link: "https://jupocket.com/guide/multiple-payers/",
    cards: [
      {
        kind: "cover",
        photo: "/photos/card-papers.jpg",
        photoAlt: "사방으로 흩어진 서류 뭉치에 파묻힌 사람",
        badge: "종합소득세 · 원천징수",
        title: "3.3% 뗐어도\n5월에 더 낼 수 있습니다",
        sub: "거래처가 흩어져 있으면 합계가 작아 보입니다. 경비율 60%·본인 1명이면 합계 5,760만원부터 추가납부입니다.",
        footnote: "소득세법 제50조·제129조 · 국세청 세율표 · 2026-08-10 확인",
      },
      {
        kind: "table",
        title: "곳 수만 늘렸을 뿐인데",
        sub: "한 곳당 600만원 · 경비율 60% · 본인 1명",
        rows: [
          { label: "3곳 (1,800만원)", value: "32만 2,000원 환급" },
          { label: "5곳 (3,000만원)", value: "43만 원 환급", tone: "mark" },
          { label: "8곳 (4,800만원)", value: "25만 9,000원 환급" },
          { label: "10곳 (6,000만원)", value: "6만 5,000원 추가납부", tone: "warn" },
        ],
        footnote: "거래처당 받은 금액은 내내 같다 · 출처 국세청 세율표",
      },
      {
        kind: "table",
        title: "경비가 적으면 더 빨리",
        sub: "경비율 30% · 본인 1명 · 총수입 합계 기준",
        rows: [
          { label: "1,000만원", value: "7만 원 환급", tone: "mark" },
          { label: "2,000만원", value: "2만 원 추가납부", tone: "warn" },
          { label: "3,000만원", value: "60만 5,000원 추가납부" },
          { label: "4,000만원", value: "132만 5,000원 추가납부", tone: "warn" },
        ],
        footnote: "경비율은 업종마다 다르다 · 출처 국세청 세율표",
      },
      {
        kind: "list",
        badge: "왜 어긋나나",
        title: "떼는 기준과 매기는 기준이 다르다",
        items: [
          {
            text: "거래처는 [[자기가 준 금액]]만 본다",
            detail: "다른 곳 수입도 내 공제도 알 수 없다",
          },
          {
            text: "3.3%는 [[정률]] — 누구에게나 같은 비율",
            detail: "소득세법 제129조",
          },
          {
            text: "실제 세율은 {{합친 뒤}} 정해진다",
            detail: "6%~45% 누진세율",
          },
          {
            text: "그래서 합계가 커지면 [[모자란다]]",
            detail: "차액을 5월에 더 낸다",
          },
        ],
        footnote: "소득세법 제129조 · 국세청 누진세율표 · 2026-08-10 확인",
      },
      {
        kind: "note",
        badge: "놓치기 쉬운 것",
        title: "한 곳만 신고하면 나머지는 무신고",
        body:
          "거래처별로 따로 신고하는 제도는 없습니다. [[합산해서 한 번]]입니다.\n\n금액이 작아 잊어버린 거래처 하나가 빠져도 그만큼은 {{신고하지 않은 것}}으로 남습니다.\n\n홈택스 지급명세서 조회로 지급처부터 확인하세요.",
        footnote: "신고 기간 5월 1일~31일 · 출처 국세청",
      },
      {
        kind: "cta",
        title: "내 합계면\n환급일까?",
        sub: "총수입과 경비율만 넣으면 나와요",
        refNo: 22,
      },
    ],
  },
  {
    slug: "family-deduction",
    cluster: "income",
    link: "https://jupocket.com/guide/family-deduction/",
    cards: [
      {
        kind: "cover",
        photo: "/photos/card-family.jpg",
        photoAlt: "노인의 손이 아이의 손을 감싸 쥔 모습",
        badge: "종합소득세 · 연말정산",
        title: "따로 사는 부모님도\n공제 대상입니다",
        sub: "주거 형편에 따른 별거는 법이 인정합니다. 두 분을 놓치면 과세표준 7,000만원 기준 매년 132만원입니다.",
        footnote: "소득세법 제53조 제3항 · 출처 국가법령정보센터",
      },
      {
        kind: "table",
        title: "150만원 공제가\n실제로 깎는 세금",
        sub: "1명당 · 지방소득세 포함",
        rows: [
          { label: "과세표준 1,400만원 (6%)", value: "99,000원" },
          { label: "5,000만원 (15%)", value: "247,500원" },
          { label: "8,800만원 (24%)", value: "396,000원", tone: "mark" },
          { label: "1억 5,000만원 (35%)", value: "577,500원" },
        ],
        footnote: "공제는 세금이 아니라 과세표준을 줄인다 · 소득세법 제50조",
      },
      {
        kind: "table",
        title: "누구를 넣을 수 있나",
        sub: "소득금액 100만원 이하는 공통 조건",
        rows: [
          { label: "배우자", value: "나이 제한 없음" },
          { label: "부모·조부모", value: "60세 이상" },
          { label: "자녀·손자녀", value: "20세 이하" },
          { label: "형제자매", value: "20세 이하 또는 60세 이상", tone: "warn" },
        ],
        footnote: "장애인은 나이 제한을 받지 않는다 · 소득세법 제50조 제1항 제3호",
      },
      {
        kind: "list",
        badge: "여기서 걸린다",
        title: "세 가지를 조심하세요",
        items: [
          {
            text: "소득 100만원은 [[수입이 아니라 소득금액]]",
            detail: "필요경비를 뺀 뒤의 금액. 근로소득만 있으면 총급여 500만원까지 대상",
          },
          {
            text: "형제자매는 {{21~59세가 비어 있다}}",
            detail: "실제로 부양하고 있어도 이 나이대는 공제 대상이 아니다",
          },
          {
            text: "나이는 [[그 해 하루라도 해당하면]] 된다",
            detail: "올해 스물한 살이 되어도 스무 살이던 날이 있었다면 그 해는 대상",
          },
        ],
        footnote: "소득세법 제50조·제53조 제5항 · 출처 국가법령정보센터",
      },
      {
        kind: "note",
        badge: "흔한 오해",
        title: "이 둘은 더해지지 않습니다",
        body:
          "부녀자 50만원과 한부모 100만원에 모두 해당되면 한부모만 적용합니다.\n제51조 제1항 단서가 그렇게 정하고 있어서, 둘을 더해 150만원으로 잡으면 틀립니다.",
        footnote: "소득세법 제51조 제1항 단서 · 출처 국가법령정보센터",
      },
      {
        kind: "cta",
        title: "우리 집은\n몇 명일까?",
        sub: "요건과 금액을 표로 정리해 뒀어요",
        refNo: 23,
      },
    ],
  },
  {
    slug: "vat-penalty",
    cluster: "vat",
    link: "https://jupocket.com/guide/vat-penalty/",
    cards: [
      {
        kind: "cover",
        photo: "/photos/card-documents.jpg",
        photoAlt: "쌓인 서류 뭉치를 손으로 든 모습",
        badge: "부가가치세",
        title: "제때 신고해도\n붙는 가산세가 있습니다",
        sub: "세금계산서를 늦게 주면 공급가액의 1%. 1천만원짜리 한 건이면 10만원입니다.",
        footnote: "부가가치세법 제60조 제2항 제1호 · 출처 국가법령정보센터",
      },
      {
        kind: "table",
        title: "세금계산서 한 건, 얼마",
        sub: "공급가액 1,000만원 기준",
        rows: [
          { label: "지연발급 1%", value: "10만 원" },
          { label: "미발급 2%", value: "20만 원", tone: "warn" },
          { label: "부실기재 1%", value: "10만 원" },
          { label: "전자 미전송 0.5%", value: "5만 원", tone: "mark" },
        ],
        footnote: "부가가치세법 제60조 제2항 · 출처 국가법령정보센터",
      },
      {
        kind: "list",
        badge: "왜 제때 신고했는데",
        title: "기준이 세액이 아니다",
        items: [
          {
            text: "제60조는 [[공급가액]]에 붙는다",
            detail: "무신고가산세는 세액 기준 — 다른 법이다",
          },
          {
            text: "납부세액이 {{0원이어도}} 붙는다",
            detail: "환급받는 과세기간에도 환급액에서 뺀다",
          },
          {
            text: "신고를 제때 해도 붙는다",
            detail: "발급·전송·합계표는 신고와 별개 의무",
          },
          {
            text: "근거가 [[부가가치세법]]이다",
            detail: "무신고·납부지연은 국세기본법 소관",
          },
        ],
        footnote: "부가가치세법 제60조 · 출처 국가법령정보센터",
      },
      {
        kind: "table",
        title: "합계표와 등록도 본다",
        sub: "합계표는 공급가액 1,000만원 · 등록은 3,000만원 기준",
        rows: [
          { label: "매출 합계표 미제출 0.5%", value: "5만 원" },
          { label: "예정신고 빠뜨림 0.3%", value: "3만 원" },
          { label: "매입 합계표 미제출 0.5%", value: "5만 원" },
          { label: "사업자등록 지연 1%", value: "30만 원", tone: "warn" },
        ],
        footnote: "부가가치세법 제60조 제1항·제6항·제7항 · 출처 국가법령정보센터",
      },
      {
        kind: "note",
        badge: "잘못 계산하기 쉬운 것",
        title: "해당하는 걸 다 더하면 틀립니다",
        body:
          "제60조 제9항이 [[중복 적용을 막는 규칙]]을 따로 둡니다.\n\n등록이 늦어 제1항이 붙은 부분에는 매출 합계표 가산세를 다시 붙이지 않습니다.\n\n{{전부 합한 금액}}은 실제보다 큽니다.",
        footnote: "부가가치세법 제60조 제9항 · 출처 국가법령정보센터",
      },
      {
        kind: "cta",
        title: "내 경우엔\n어디가 걸릴까?",
        sub: "요율과 근거 조항을 표로 정리해 뒀어요",
        refNo: 24,
      },
    ],
  },
  {
    slug: "gift-tax",
    cluster: "inheritance",
    link: "https://jupocket.com/guide/gift-tax/",
    cards: [
      {
        kind: "cover",
        photo: "/photos/card-hands.jpg",
        photoAlt: "무릎 위에 포개어 놓은 노인의 손",
        badge: "증여세",
        title: "결혼할 때 받는 돈은\n1억 5천만원까지 0원입니다",
        sub: "혼인신고 전후 2년 안에 받아야 합니다. 그 창이 지나면 한도가 5천만원입니다.",
        footnote: "상속세 및 증여세법 제53조·제53조의2 · 출처 국가법령정보센터",
      },
      {
        kind: "table",
        title: "누가 주느냐로 갈립니다",
        sub: "10년간 합해서 이 금액까지 세금 0원",
        rows: [
          { label: "배우자", value: "6억 원" },
          { label: "부모·조부모", value: "5,000만 원", tone: "mark" },
          { label: "자녀·손자녀", value: "5,000만 원" },
          { label: "형제자매·삼촌·사위", value: "1,000만 원", tone: "warn" },
          { label: "그 외의 사람", value: "0원", tone: "warn" },
        ],
        footnote: "상속세 및 증여세법 제53조 · 출처 국세청 증여세 안내",
      },
      {
        kind: "list",
        badge: "왜 자꾸 10년인가",
        title: "한 번 쓰면 끝이 아닙니다",
        items: [
          {
            text: "한도는 [[10년 합산]]이다",
            detail: "직전 10년 안에 공제받은 금액을 먼저 뺀다",
          },
          {
            text: "10년이 지나면 [[다시 생긴다]]",
            detail: "5천만원씩 두 번, 10년 띄우면 양쪽 다 0원",
          },
          {
            text: "아버지와 어머니는 {{한 사람}}이다",
            detail: "직계존속이면 그 배우자를 동일인으로 본다",
          },
          {
            text: "10년 안에 또 받으면 첫 원부터 과세",
            detail: "같은 5천만원인데 이번엔 485만원이 나온다",
          },
        ],
        footnote: "상속세 및 증여세법 제47조 제2항·제53조 · 출처 국가법령정보센터",
      },
      {
        kind: "table",
        title: "부모가 성년 자녀에게 주면",
        sub: "5천만원 공제 후 · 신고세액공제 3% 반영",
        rows: [
          { label: "1억원 받으면", value: "485만 원" },
          { label: "2억원 받으면", value: "1,940만 원" },
          { label: "3억원 받으면", value: "3,880만 원" },
          { label: "5억원 받으면", value: "7,760만 원", tone: "warn" },
        ],
        footnote: "상속세 및 증여세법 제53조·제56조·제69조 · 출처 국세청 증여세 안내",
      },
      {
        kind: "note",
        badge: "기한을 자주 틀립니다",
        title: "증여세는 3개월, 상속세가 6개월입니다",
        body:
          "증여받은 날이 속하는 달의 말일부터 [[3개월]] 이내에 신고합니다.\n\n6월 10일에 받았다면 9월 30일까지입니다.\n\n기한을 넘기면 {{신고세액공제 3%부터 사라지고}} 무신고가산세가 따로 붙습니다.",
        footnote: "상속세 및 증여세법 제68조·제69조 · 출처 국세청 증여세 안내",
      },
      {
        kind: "cta",
        title: "우리 집은\n얼마까지 괜찮을까?",
        sub: "관계별 한도와 결혼·출산 1억을 표로 정리해 뒀어요",
        refNo: 27,
      },
    ],
  },
  {
    slug: "late-filing-refund",
    cluster: "income",
    link: "https://jupocket.com/guide/late-filing-refund/",
    cards: [
      {
        kind: "cover",
        photo: "/photos/card-mailboxes.jpg",
        photoAlt: "라벨이 붙은 낡은 금속 서류함이 격자로 늘어선 모습",
        badge: "종합소득세 · 기한후신고",
        title: "신고를 놓쳤는데\n오히려 돌려받는 경우",
        sub: "낼 세액이 없으면 무신고가산세도 0원입니다. 다만 세무서가 먼저 결정해 버리면 그때 문이 닫힙니다.",
        footnote: "국세기본법 제45조의3·제47조의2 · 출처 국가법령정보센터",
      },
      {
        kind: "note",
        badge: "왜 돌려받나",
        title: "3.3%는 세금이 아니라 예납입니다",
        body:
          "3.3%는 세금이 확정된 것이 아니라 [[미리 떼어 둔 돈]]입니다.\n\n경비와 공제를 반영한 실제 세액이 그보다 적으면 차액이 남습니다.\n\n다만 {{신고를 해야 계산이 시작됩니다}} — 가만히 있으면 차액도 그대로 있습니다.",
        footnote: "국세기본법 제45조의3 제1항 · 출처 국가법령정보센터",
      },
      {
        kind: "table",
        title: "환급이면 가산세가 0원인 이유",
        sub: "20%를 무엇에 곱하는지가 핵심입니다",
        rows: [
          { label: "곱하는 대상", value: "납부하여야 할 세액" },
          { label: "낼 세액이 남으면", value: "그 세액의 20%", tone: "warn" },
          { label: "돌려받으면", value: "0원 × 20% = 0원", tone: "mark" },
          { label: "납부지연가산세도", value: "0원" },
        ],
        footnote: "국세기본법 제47조의2 제1항 · 출처 국가법령정보센터",
      },
      {
        kind: "list",
        badge: "언제까지 · 언제 들어오나",
        title: "날짜가 아니라 사건이 문을 닫습니다",
        items: [
          {
            text: "마감일은 [[따로 없다]]",
            detail: "관할 세무서장이 결정하여 통지하기 전까지 가능하다",
          },
          {
            text: "{{먼저 결정되면 끝}}이다",
            detail: "통지를 받기 전이라면 늦었다 싶은 때에도 아직 열려 있다",
          },
          {
            text: "결정·통지는 [[신고일부터 3개월]] 이내",
            detail: "오래 걸리면 그 사유를 신고인에게 통지하게 돼 있다",
          },
          {
            text: "환급가산금은 연 3.1%",
            detail: "신고일이 아니라 30일이 지난 날의 다음 날부터 센다",
          },
        ],
        footnote: "국세기본법 제45조의3·제52조, 시행규칙 제19조의3 · 출처 국가법령정보센터",
      },
      {
        kind: "note",
        badge: "이미 신고했다면",
        title: "그건 기한후신고가 아니라 경정청구입니다",
        body:
          "신고는 했는데 공제를 빠뜨려 덜 돌려받았다면 [[5년 이내]]에 경정청구를 합니다.\n\n세무서는 청구를 받은 날부터 2개월 이내에 답해야 합니다.\n\n[[기한후신고를 한 사람도]] 그 뒤에 다시 경정청구를 할 수 있습니다 — 조문에 나란히 적혀 있습니다.",
        footnote: "국세기본법 제45조의2 제1항·제3항 · 출처 국가법령정보센터",
      },
      {
        kind: "cta",
        title: "나는 돌려받나\n더 내야 하나?",
        sub: "기한후신고가 언제까지 되는지, 돈이 언제 나오는지 정리해 뒀어요",
        refNo: 28,
      },
    ],
  },
  {
    slug: "inheritance-tax",
    cluster: "inheritance",
    link: "https://jupocket.com/guide/inheritance-tax/",
    cards: [
      {
        kind: "cover",
        photo: "/photos/card-key.jpg",
        photoAlt: "낡은 나무문 자물쇠에 꽂힌 오래된 열쇠",
        badge: "상속세",
        title: "같은 10억인데\n한 집은 0원, 한 집은 8,730만원",
        sub: "배우자가 있으면 면제한도가 10억, 없으면 5억입니다. 갈리는 건 재산이 아니라 가족 구성입니다.",
        footnote: "상속세 및 증여세법 · 출처 국세청 상속공제 안내",
      },
      {
        kind: "table",
        title: "우리 집은 얼마부터 내나",
        sub: "이 금액까지는 상속세가 0원",
        rows: [
          { label: "배우자 + 자녀", value: "10억 원", tone: "mark" },
          { label: "배우자 + 자녀 없음", value: "10억 원" },
          { label: "자녀만 (배우자 없음)", value: "5억 원", tone: "warn" },
        ],
        footnote: "일괄공제 5억 + 배우자공제 최소 5억 · 출처 국세청 상속공제 안내",
      },
      {
        kind: "list",
        badge: "왜 이렇게 갈리나",
        title: "공제는 더하는 게 아니라 고르는 것",
        items: [
          {
            text: "기초공제 2억 + 인적공제 vs [[일괄공제 5억]]",
            detail: "둘을 더하지 않는다 — 큰 쪽 하나만 쓴다",
          },
          {
            text: "대부분 [[일괄공제 5억]]이 크다",
            detail: "인적공제를 채워 5억을 넘기기가 쉽지 않다",
          },
          {
            text: "배우자공제는 [[따로]] 붙는다",
            detail: "실제로 받은 게 없어도 최소 5억, 그래서 합이 10억",
          },
          {
            text: "배우자가 {{단독 상속}}이면 일괄공제를 못 쓴다",
            detail: "기초공제 + 인적공제 합계만 쓴다",
          },
        ],
        footnote: "상속세 및 증여세법 · 출처 국세청 상속공제 안내",
      },
      {
        kind: "table",
        title: "배우자와 자녀 둘이 있다면",
        sub: "면제한도 10억 적용 · 신고세액공제 3% 반영",
        rows: [
          { label: "10억원 물려받으면", value: "0원", tone: "mark" },
          { label: "15억원 물려받으면", value: "8,730만 원" },
          { label: "20억원 물려받으면", value: "2억 3,280만 원" },
          { label: "30억원 물려받으면", value: "6억 2,080만 원", tone: "warn" },
        ],
        footnote: "상속세 및 증여세법 세율 10~50% · 출처 국세청 상속세 세율",
      },
      {
        kind: "note",
        badge: "기한을 자주 틀립니다",
        title: "상속세는 6개월, 증여세가 3개월입니다",
        body:
          "상속개시일이 속하는 달의 말일부터 [[6개월]] 이내에 신고합니다.\n\n3월 10일에 돌아가셨다면 9월 30일까지입니다.\n\n기한을 넘기면 {{신고세액공제 3%부터 사라지고}} 무신고가산세가 따로 붙습니다.",
        footnote: "상속세 및 증여세법 · 출처 국세청 신고납부기한",
      },
      {
        kind: "cta",
        title: "우리 집은\n얼마부터 내나?",
        sub: "가족 구성을 넣으면 면제한도와 세액까지 바로 나와요",
        refNo: 26,
      },
    ],
  },
  {
    slug: "retirement-pension-loan",
    cluster: "retirement",
    link: "https://jupocket.com/guide/retirement-pension-loan/",
    cards: [
      {
        kind: "cover",
        photo: "/photos/card-safebox.jpg",
        photoAlt: "금고함이 줄지어 늘어선 벽, 가운데 한 칸만 열려 있다",
        badge: "퇴직연금 · IRP",
        title: "중도인출은 거절돼도\n담보대출은 됩니다",
        sub: "대학등록금·혼례비·장례비가 그렇습니다. 적립금의 50%까지, 계좌는 깨지 않고.",
        footnote: "근로자퇴직급여 보장법 제7조 · 시행령 제2조",
      },
      {
        kind: "list",
        badge: "담보대출이 되는 사유",
        title: "이 사유가 아니면 안 됩니다",
        items: [
          {
            text: "무주택자가 [[본인 명의로 주택 구입]]",
            detail: "시행령 제2조 제1항 제1호",
          },
          {
            text: "무주택자의 [[전세금·임차보증금]]",
            detail: "한 사업장에서 근로하는 동안 1회 한정",
          },
          {
            text: "6개월 이상 요양이 필요한 [[의료비]]",
            detail: "본인·배우자·부양가족 — 담보는 금액 요건 없음",
          },
          {
            text: "5년 이내 [[파산선고·개인회생 개시결정]]",
            detail: "담보를 제공하는 날부터 거꾸로 계산해 5년",
          },
          {
            text: "[[대학등록금·혼례비·장례비]]",
            detail: "중도인출 사유에는 아예 없는 칸",
          },
          {
            text: "휴업으로 임금 감소 또는 {{재난 피해}}",
            detail: "한도를 고용노동부장관 고시가 따로 정한다",
          },
        ],
        footnote: "근로자퇴직급여 보장법 시행령 제2조 제1항 · 출처 국가법령정보센터",
      },
      {
        kind: "table",
        title: "얼마까지 담보로 잡히나",
        sub: "가입자별 적립금의 50%",
        rows: [
          { label: "적립금 3,000만원", value: "1,500만 원" },
          { label: "적립금 6,000만원", value: "3,000만 원", tone: "mark" },
          { label: "적립금 1억원", value: "5,000만 원" },
        ],
        footnote: "시행령 제2조 제2항 제1호 · 실제 대출 실행액은 사업자 심사에서 정해집니다",
      },
      {
        kind: "table",
        title: "중도인출은 더 좁습니다",
        sub: "같은 사유인데 인출 쪽에만 조건이 붙는다",
        rows: [
          { label: "대학등록금·혼례비·장례비", value: "인출 불가", tone: "warn" },
          { label: "휴업으로 임금 감소", value: "인출 불가", tone: "warn" },
          { label: "의료비 (DC형)", value: "연봉의 12.5% 초과", tone: "warn" },
          { label: "주택·전세금·파산·회생", value: "둘 다 가능", tone: "mark" },
        ],
        footnote: "시행령 제2조 제1항 vs 제14조·제18조 · 출처 국가법령정보센터",
      },
      {
        kind: "note",
        badge: "먼저 확인할 것",
        title: "퇴직금제도만 있으면 둘 다 안 됩니다",
        body:
          "법이 말하는 [[퇴직연금제도]]는 DB·DC·IRP 셋입니다.\n\n회사가 퇴직연금에 가입하지 않고 퇴직금제도만 두고 있으면 {{담보대출도 중도인출도 열리지 않습니다}}.\n\n반대로 DB형은 중도인출 자체가 없어서 담보대출이 사실상 유일한 길입니다.",
        footnote: "근로자퇴직급여 보장법 제2조 제7호·제22조",
      },
      {
        kind: "cta",
        title: "내 사유가\n되는 건가?",
        sub: "담보로 되는 사유와 한도, 중도인출과 갈리는 지점을 글에 정리했어요",
        refNo: 30,
      },
    ],
  },
  {
    slug: "unlisted-stock-value",
    cluster: "inheritance",
    link: "https://jupocket.com/guide/unlisted-stock-value/",
    cards: [
      {
        kind: "cover",
        photo: "/photos/card-balance.jpg",
        photoAlt: "어두운 실내에 놓인 빈티지 양팔저울, 두 접시가 비어 있다",
        badge: "상속세 · 증여세",
        title: "최대주주 20% 할증,\n중소기업은 빠집니다",
        sub: "가족회사 주식을 넘기면서 20%를 얹어 신고하셨다면, 먼저 그 회사가 중소기업인지 보세요.",
        footnote: "상증세법 제63조 제3항 · 시행령 제53조 제6항·제8항 제9호",
      },
      {
        kind: "table",
        title: "1주당 얼마가 나오나",
        sub: "순자산 20억 · 발행주식 1만주 예시",
        rows: [
          { label: "순손익가치 — 3년 가중평균 ÷ 10%", value: "260,000원" },
          { label: "순자산가치 — 순자산 ÷ 주식수", value: "200,000원" },
          { label: "가중평균 3 : 2", value: "236,000원", tone: "mark" },
          { label: "부동산과다보유법인이면 2 : 3", value: "224,000원" },
        ],
        footnote:
          "시행령 제54조 제1항 · 환원율 연 10%는 시행규칙 제17조 · 출처 국가법령정보센터",
      },
      {
        kind: "table",
        title: "3년 내리 적자여도 0이 아닙니다",
        sub: "순자산가치의 80%가 하한",
        rows: [
          { label: "순손익가치 (음수 → 0)", value: "0원" },
          { label: "순자산가치", value: "200,000원" },
          {
            label: "가중평균 (0 × 3 + 20만 × 2) ÷ 5",
            value: "80,000원",
            tone: "warn",
          },
          { label: "하한 — 순자산가치 × 80%", value: "160,000원", tone: "mark" },
        ],
        footnote: "시행령 제54조 제1항 단서 · 제56조 제1항 후단",
      },
      {
        kind: "list",
        badge: "가중평균을 안 쓰는 경우",
        title: "이때는 순자산가치로만 봅니다",
        items: [
          {
            text: "[[청산 중]]이거나 사업 계속이 곤란한 법인",
            detail: "시행령 제54조 제4항 제1호",
          },
          {
            text: "사업개시 전 · 개시 후 3년 미만 · [[휴업·폐업]]",
            detail: "제2호 — 적격분할 신설법인은 분할 전 사업개시일부터 기산",
          },
          {
            text: "자산의 [[80% 이상이 부동산]]인 법인",
            detail: "제3호 — 가중평균액이 순자산가치보다 낮은 경우로 한정",
          },
          {
            text: "자산의 [[80% 이상이 주식]]인 법인",
            detail: "제5호 — 제3호와 같은 단서가 붙는다",
          },
          {
            text: "정관상 [[잔여 존속기한이 3년 이내]]",
            detail: "제6호 — 제4호는 2018년에 삭제돼 번호가 건너뛴다",
          },
        ],
        footnote: "상증세법 시행령 제54조 제4항 · 출처 국가법령정보센터",
      },
      {
        kind: "table",
        title: "할증 20%, 붙는 곳과 빠지는 곳",
        sub: "가중평균 → 하한 → 할증 순서다",
        rows: [
          {
            label: "1주당 236,000원에 20% 가산",
            value: "283,200원",
            tone: "warn",
          },
          { label: "3,000주를 증여하면", value: "8억 4,960만원", tone: "warn" },
          { label: "중소기업기본법상 중소기업", value: "할증 없음", tone: "mark" },
          { label: "중견기업 · 매출 5천억 미만", value: "할증 없음", tone: "mark" },
          { label: "3년 연속 결손금 법인", value: "할증 없음", tone: "mark" },
        ],
        footnote:
          "상증세법 제63조 제3항 · 시행령 제53조 · 지분은 1년 이내 양도·증여분도 합산",
      },
      {
        kind: "cta",
        title: "우리 회사는\n얼마로 나오나?",
        sub: "순손익가치·순자산가치·하한·할증을 조문 순서대로 글에 정리했어요",
        refNo: 31,
      },
    ],
  },
];

export function cardSetBySlug(slug: string): CardSet | undefined {
  return cardSets.find((s) => s.slug === slug);
}
