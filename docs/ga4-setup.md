# GA4 연결 방법 (cal 저장소에서 실제로 쓰는 방식)

다른 사이트·다른 세션에 그대로 옮길 수 있게 적는다.
**두 가지가 별개다** — ① 사이트가 데이터를 *보내는* 것, ② 스크립트가
데이터를 *읽어오는* 것. 둘은 자격증명도 다르고 실패 방식도 다르다.

---

## ① 사이트 → GA4 (수집)

측정 ID 하나를 코드에 박고 `<head>` 에서 gtag.js 를 부른다. GTM 을 쓰지 않는다.

**`src/data/analytics.ts`** — 값과 검증만 있는 파일

```ts
export const GA4_MEASUREMENT_ID = "G-XXXXXXXXXX";
export function isValidGa4Id(id: string): boolean {
  return /^G-[A-Z0-9]{8,12}$/.test(id);
}
export const GA4_ENABLED = isValidGa4Id(GA4_MEASUREMENT_ID);
```

측정 ID는 **페이지 소스에 그대로 나가는 공개값**이라 `.env` 에 숨기지
않는다. 숨기면 빌드마다 환경변수가 필요해져 배포만 까다로워진다.

`GA4_ENABLED` 가 있는 이유: 속성을 만들기 전에 배선만 해 두고 ID가 나오면
한 줄만 채운다. 그리고 **틀린 ID면 아무것도 렌더하지 않는다** — 오타난 ID로
로더만 부르면 무게는 늘고 데이터는 안 쌓이는데 그걸 한참 뒤에 안다.

**`src/components/GtagHead.astro`** — `<head>` 에 넣는 로더

```astro
---
import { GA4_MEASUREMENT_ID, GA4_ENABLED } from "../data/analytics";
const boot = `
window.dataLayer = window.dataLayer || [];
function gtag(){ dataLayer.push(arguments); }
window.gtag = gtag;
gtag("js", new Date());
gtag("config", ${JSON.stringify(GA4_MEASUREMENT_ID)});
`.trim();
---
{GA4_ENABLED && (
  <>
    <script is:inline async
      src={`https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`} />
    <script is:inline set:html={boot} />
  </>
)}
```

### 여기서 실제로 데였던 것

**`define:vars` 를 쓰지 않는다.** 쓰면 Astro 가 스크립트를 블록으로 감싸고,
블록 안의 `function` 선언이 전역에 올라가지 않는다. 페이지뷰는 `dataLayer`
큐로 처리돼 **멀쩡히 수집되기 때문에** 문제를 못 느끼다가, 나중에
`gtag("event", …)` 를 부르는 순간 `gtag is not defined` 로 터진다.
`is:inline` + `set:html` 로 쓰고 `window.gtag` 를 명시적으로 박는다.

각 페이지의 `<head>` 에 `<GtagHead />` 를 넣으면 끝이다.

---

## ② GA4 → 스크립트 (조회)

`npm run seo` 가 Search Console 과 GA4 Data API 를 읽는다.
**서비스 계정 JWT 를 `node:crypto` 로 직접 서명한다** — `googleapis` 패키지를
넣지 않는다(이 저장소의 다른 API 호출도 전부 원시 HTTP 라 관례를 맞춘다).

### 준비물

| | 어디에 | 비밀인가 |
|---|---|---|
| 서비스 계정 키 JSON | `.secrets/google.json` | **예** — `.gitignore` 에 `.secrets/` |
| `GA4_PROPERTY_ID` (숫자) | `.env` | 아니오(하지만 .env 는 커밋 안 함) |
| `GSC_SITE_URL` (`sc-domain:example.com`) | `.env` | 아니오 |

### 클라우드 콘솔에서

1. Google Cloud 프로젝트에서 **서비스 계정**을 만들고 **JSON 키**를 받는다
2. 그 JSON 을 `.secrets/google.json` 으로 둔다 (`client_email`,
   `private_key` 두 필드를 쓴다)
3. **GA4** → 관리 → 속성 액세스 관리 → 그 `client_email` 을 **뷰어**로 추가
4. **Search Console** → 설정 → 사용자 및 권한 → 같은 주소를 추가
5. GA4 → 관리 → 속성 설정에서 **속성 ID(숫자)** 를 복사해 `.env` 에
   `GA4_PROPERTY_ID=` 로 넣는다 (측정 ID `G-…` 와 다른 값이다 — 헷갈리기 쉽다)

**3번과 4번을 빠뜨리면 키는 멀쩡한데 빈 결과만 온다.** 그래서
`--check` 모드를 따로 뒀다. 접근 가능한 속성 목록을 먼저 보여준다.

```bash
node social/seo.mjs --check   # 자격증명·권한만 확인. 제일 먼저 이것
node social/seo.mjs           # 최근 28일
node social/seo.mjs --days 7
```

### 코드 요점 (`social/seo.mjs`)

```js
const KEY_FILE = join(HERE, "..", ".secrets", "google.json");
const SCOPES = [
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/analytics.readonly",
].join(" ");
// JWT 를 만들어 RS256 으로 서명하고 oauth2.googleapis.com/token 에서
// 액세스 토큰으로 바꾼다 — createSign("RSA-SHA256") 한 번이면 끝난다.
```

읽는 엔드포인트는 둘이다.

- `https://analyticsdata.googleapis.com/v1beta/properties/<ID>:runReport`
- `https://searchconsole.googleapis.com/webmasters/v3/...`

### 유입 출처를 보려면 차원을 따로 물어야 한다

처음에는 `landingPage` 만 물었다. 그래서 답글 링크에 `utm_*` 를 달아도
보고서에 **아무것도 나타나지 않았다.** 방문 페이지만 보면 "무엇을 봤나"
까지만 알고 "어디서 왔나"는 모른다.

```js
dimensions: [
  { name: "sessionSource" },
  { name: "sessionMedium" },
  { name: "sessionCampaignName" },   // sessionCampaign 이 아니다 — 400 난다
],
metrics: [{ name: "sessions" }, { name: "activeUsers" }],
```

`sessionCampaign` 으로 쓰면 `Field sessionCampaign is not a valid dimension`
400 이 온다. **`sessionCampaignName`** 이 맞다.

---

## 헷갈리기 쉬운 두 쌍

| | 무엇 | 어디 |
|---|---|---|
| 측정 ID | `G-XXXXXXXXXX` | 코드에 공개로 박는다(①) |
| 속성 ID | 숫자 9~10자리 | `.env`(②). API 가 이걸 쓴다 |
| GSC 지연 | 약 3일 | `GSC_LAG` 로 기간을 뒤로 민다 |
| GA4 지연 | 거의 없음 | 같은 날 데이터가 나온다 |

GSC 는 **"데이터가 없음"과 "권한이 없음"이 둘 다 빈 결과로 보인다.**
새로 붙였는데 0이 나오면 먼저 `--check` 로 속성 목록이 뜨는지부터 본다.

---

## 옮겨 갈 때 할 일 (체크리스트)

- [ ] GA4 속성·스트림을 그 도메인으로 만들고 측정 ID를 `analytics.ts` 에
- [ ] `<GtagHead />` 를 모든 페이지 `<head>` 에
- [ ] 배포 후 실제 페이지 소스에 `gtag/js?id=G-…` 가 있는지 확인
- [ ] 서비스 계정 키를 `.secrets/google.json` 에 두고 `.gitignore` 확인
- [ ] GA4·GSC 양쪽에 `client_email` 을 뷰어로 추가
- [ ] `.env` 에 `GA4_PROPERTY_ID`, `GSC_SITE_URL`
- [ ] `node social/seo.mjs --check` 가 속성 목록을 보여주는지
- [ ] 유입 출처를 볼 거면 `sessionCampaignName` 차원을 넣었는지

**키 파일과 `.env` 는 절대 커밋하지 않는다.** 이 키가 유출되면 GA4·GSC
데이터가 통째로 열린다. 채팅에 붙여넣지도 않는다.
