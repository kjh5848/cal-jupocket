# 주포켓 리브랜딩 (기반) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** jupocket.com 을 '도구를 다 담는 주머니'로 바꾸는 기반 — 3D 로고·메뉴, 다크 토큰과 전환 버튼, 도구 레지스트리, 검색 히어로와 도구 도감, 초성 검색, 수집(게임화), 공통 계산기 틀과 기존 계산기 35개 이전.

**Architecture:** Astro 정적 사이트. 도구 목록은 `src/data/tools.ts` 한 곳(링크허브·클러스터에서 생성)에서 나오고, 홈·검색·담긴 수가 전부 그걸 읽는다. 계산기 틀은 마크업의 `data-*` 표시를 읽는 하나의 클라이언트 스크립트(`src/scripts/calc-ui.ts`)가 입력·결과 표시를 맡고, 계산은 지금처럼 `src/lib/*.ts` 와 계산기별 스크립트가 한다. 서버·외부 라이브러리 없음.

**Tech Stack:** Astro, TypeScript, vitest(`npm test`), 순수 CSS(`src/styles/global.css`), Playwright(이미 설치 — 캡처 검증용).

**Spec:** `docs/superpowers/specs/2026-10-16-jupocket-pocket-rebrand-design.md` (UX 시안 https://claude.ai/artifact/Wc5xNCfuokdaS7MPLw4Ec5)

**이 계획 밖(별도 계획):** 8절 5단계 이후의 도구 묶음 제작(퇴직금 → 대출 …, 범용 `/tools/`), 일본 `/ja/`. 이 계획이 끝나면 레지스트리에 `status: "live"` 로 올리기만 하면 되는 상태가 된다.

## Global Constraints

- 링크허브 번호는 재사용·재정렬 금지. 도감 번호 = 링크허브 번호(`src/data/linkhub.ts`), 새 도구는 `nextNo()`.
- 기존 주소는 그대로. 새 범용 도구 주소는 `/tools/<slug>/`.
- 상단 메뉴: **도구 · 읽을거리 · 카드뉴스**. 홈 `<title>`: **주포켓 — 세금·급여부터 날짜·사진까지, 필요한 도구 모음**. h1: `주포켓`(윗줄) + **뭐가 필요하세요?**
- 분류 12개와 색(바꾸지 않음): 세금 #0f6e56 · 급여·근로 #a8325c · 연금·보험 #534ab7 · 집·차 #6e7438 · 상속·증여 #a85820 · 돈·금융 #0b5cad · 날짜·시간 #2e7d9a · 사진·문서 #b07a12 · 텍스트·개발 #3d4a5c · 단위·변환 #1f9c8e · 건강·운동 #d0563b · 생활·재미 #8a6fd1
- 클러스터 → 분류: income·vat → 세금, labor → 급여·근로, retirement → 연금·보험, localtax → 집·차, inheritance → 상속·증여.
- 다크 토큰: --bg #0d1220 · --surface #161d2e · --surface-2/--accent-bg #222b40 · --rule #2f3a52 · --text #e7ebf3 · --muted #a9b3c7 · --link/--brand #8fb8ff · --brand-wash #1b2a47.
- 결과 카드 배경: 라이트 `linear-gradient(135deg,#1a73d6,#0b4f9e)`, 다크 `linear-gradient(135deg,#2357a8,#173b78)`.
- localStorage 는 전부 try/catch — 막혀 있어도 화면은 정상, 테마는 기기 설정을 따른다.
- 외부 스크립트·폰트·라이브러리 추가 금지(기존 원칙: 네트워크 요청 0).
- 애니메이션은 `prefers-reduced-motion: reduce` 에서 끈다. `transition: all` 금지.
- roberin·utilo 의 코드·문구·화면을 복사하지 않는다. 포켓몬 시각 요소 금지.
- 커밋: 파일을 명시해 `git add`, `social/*.json`·`.claude/launch.json` 은 절대 넣지 않는다. 테스트는 `set -o pipefail; npm test > out.txt` 로 실패를 가리지 않는다. 커밋 끝줄 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **localStorage 가 예외를 던지는 브라우저(사파리 사생활 보호·차단)** — 테마 전환·수집 표시가 오류 없이 기본값으로 동작해야 한다 → Task 2·6 테스트.
2. **검색에 공백·대소문자·자모 섞인 입력**(`ㅅㅅ 령`, ` 3.3 `, `PDF`) — 결과가 비거나 깨지지 않고 합리적으로 매칭 → Task 5 표 테스트.
3. **계산기 입력을 지운 상태(빈 값)·0** — 금액 읽어 주기가 빈칸, 비율 막대가 0 나눗셈 없이 비어 있음 → Task 8 테스트.
4. **JS 가 꺼졌거나 늦게 뜰 때** — 계산기 틀 이전 전에도 원래 입력(드롭다운·숫자칸)이 그대로 쓸 수 있어야 한다(점진적 향상) → Task 8 빌드 HTML 테스트.
5. **첫 그림 깜빡임** — 다크를 고른 사람이 새로고침할 때 라이트가 먼저 번쩍이지 않아야 한다 → Task 2 head 인라인 스크립트 테스트.

---

### Task 1: ✅ 완료(2026-10-17) 3D 로고·메뉴·홈 제목

**Files:**
- Create: `src/components/BrandPocket.astro`, `public/favicon.svg`(교체), `public/favicon-32.png`, `public/apple-touch-icon.png`, `public/icon-512.png`
- Modify: `src/components/SiteHeader.astro`, `src/pages/index.astro`(title·h1·description), OG 생성기 로고(`scripts/` 의 `npm run og` 원본 — `grep -rn BrandCoin scripts src` 로 찾는다)
- Test: `src/lib/__tests__/brand.test.ts`

**Interfaces:**
- Produces: `<BrandPocket size={number} />` — 로고 SVG 원본은 scratchpad `logo-3d.svg`(설계 확정본)를 그대로 옮긴다. gradient id 는 `bp-` 접두로 바꿔 한 페이지에 여러 번 써도 충돌하지 않게.

- [x] **Step 1: 실패하는 테스트** — `brand.test.ts`: `SiteHeader.astro` 소스에 `label: "도구"` 가 있고 `label: "계산기"` 가 없다; `index.astro` 의 title 이 `"주포켓 — 세금·급여부터 날짜·사진까지, 필요한 도구 모음"`; `public/favicon.svg` 에 `bp-` 그라데이션 id 가 있다.
- [x] **Step 2:** `npx vitest run src/lib/__tests__/brand.test.ts` → FAIL
- [x] **Step 3:** BrandPocket 작성, 헤더의 BrandCoin 교체(aria-label `주포켓 홈`), 메뉴 라벨 '도구', 홈 title·h1(`<span class="hero-brand">주포켓</span> 뭐가 필요하세요?`). PNG 는 Playwright 로 SVG 를 16·32·180·512 로 렌더해 저장하는 일회성 스크립트(scratchpad, 커밋 안 함).
- [x] **Step 4:** `npm test` 전체 PASS, `npm run build`, `npm run og` 후 OG 한 장을 열어 로고 확인.
- [x] **Step 5:** 커밋 `brand: 3D 주머니 로고 · 메뉴 '도구' · 홈 제목`

### Task 2: ✅ 완료(2026-10-17) 다크 토큰 + 테마 전환 버튼

**Files:**
- Create: `src/lib/theme.ts`, `src/components/ThemeToggle.astro`, `src/scripts/theme-toggle.ts`
- Modify: `src/styles/global.css`(모든 `@media (prefers-color-scheme: dark)` 블록 4곳 + `.bg-texture`·`.result-hero`·`.qa-lead`·`.tool-icon`), `src/components/BaseHead.astro`(인라인 스크립트), `src/components/SiteHeader.astro`(토글 배치)
- Test: `src/lib/__tests__/theme.test.ts`, `src/lib/__tests__/contrast.test.ts`

**Interfaces:**
- Produces: `type ThemeChoice = "light" | "dark" | "system"`; `readTheme(store?: Storage | null): ThemeChoice`(예외·이상값이면 `"system"`); `writeTheme(c: ThemeChoice, store?: Storage | null): boolean`(실패 false); `applyTheme(c: ThemeChoice, root = document.documentElement)` — `system` 이면 `data-theme` 속성 제거. localStorage 키 `jp-theme`.

- [x] **Step 1: 실패하는 테스트**
  - `theme.test.ts`: getItem 이 throw 하는 가짜 Storage → `readTheme` 가 `"system"`; `"blue"` 저장값 → `"system"`; setItem throw → `writeTheme` false; `BaseHead.astro` 소스에 `jp-theme` 를 읽어 `data-theme` 를 세우는 인라인 `<script is:inline>` 이 `<link rel="stylesheet"` 보다 앞에 있다.
  - `contrast.test.ts`: global.css 에서 다크 토큰을 읽어 WCAG 대비 계산 — `--text`/`--surface` ≥ 7, `--muted`/`--surface` ≥ 4.5, `--link`/`--surface` ≥ 4.5; 라이트도 같은 기준. `[data-theme="dark"]` 블록과 `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` 블록의 토큰 값이 같다.
- [x] **Step 2:** 두 테스트 FAIL 확인
- [x] **Step 3:** global.css 다크 블록을 `@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){…}}` + `:root[data-theme="dark"]{…}` 쌍으로 바꾸고 Global Constraints 의 다크 토큰 적용. 컴포넌트별 다크 규칙(`.calc-card`, `.tool-card`, `.callout.warn` 등)도 같은 쌍 선택자로. `.qa-lead{font-weight:500;line-height:1.8}`, `.result-hero` 그라데이션, 다크 `.bg-texture` 알갱이 제거(위쪽 `radial-gradient(120% 60% at 50% -10%, #17264a 0%, var(--bg) 70%)`, `background-size:100% 100%`, no-repeat), 다크 `.tool-icon{background:color-mix(in srgb,var(--cm) 22%,var(--surface))}`. 토글은 해·달·화면 아이콘 버튼 하나를 눌러 light → dark → system 순환, `aria-label` 에 현재 상태.
- [x] **Step 4:** `npm test` PASS. Playwright 로 홈·실수령액 계산기를 다크 저장 상태에서 새로고침 캡처 — 라이트가 먼저 보이지 않음(첫 프레임 배경 #0d1220).
- [x] **Step 5:** 커밋 `design: 다크 남색 토큰 + 라이트·다크·기기 설정 전환`

### Task 3: ✅ 완료(2026-10-17) 도구 레지스트리

**Files:**
- Create: `src/data/tools.ts`, `src/data/tool-types.ts`, `src/data/tool-backlog-count.ts`
- Uses: `docs/tool-backlog.md`(이미 있음 — `scripts/build_tool_backlog.py` 가 roberin 432개로 생성, 루틴이 상태 관리. utilo 151개는 이 Task 에서 같은 표에 추가하고 중복은 메모 '중복: roberin #N')
- Test: `src/lib/__tests__/tools.test.ts`

**Interfaces:**
- Produces:
  - `tool-types.ts`: `export const TOOL_TYPES = [{ key: "tax", label: "세금", color: "#0f6e56" }, …12개] as const`; `type ToolType = typeof TOOL_TYPES[number]["key"]`(키: tax·labor·pension·home·inherit·money·date·media·text·unit·health·life); `typeOfCluster(id: string): ToolType`.
  - `tools.ts`: `interface Tool { no: number | null; href: string; name: string; blurb: string; type: ToolType; keywords: string[]; status: "live" | "next"; verified?: "law" }`; `export const tools: Tool[]`(clusters 의 `kind: "calc"` 링크 22개를 linkhub 번호와 합쳐 생성 + 손으로 적는 `next` 목록 4~8개); `liveTools`, `nextTools`, `toolCount(): { live: number; total: number }` — total 은 backlog 표에서 중복·제외를 뺀 행 수(빌드 때 `docs/tool-backlog.md` 를 읽지 않고, `src/data/tool-backlog-count.ts` 에 숫자 하나로 두고 테스트가 문서 행 수와 대조).
- [x] **Step 1: 실패하는 테스트** — live 도구의 `no` 가 linkhub `entryByNo(no).href` 와 같다; `no` 중복 없음; `next` 는 `no: null`; 모든 `type` 이 TOOL_TYPES 안; clusters 의 calc 링크가 전부 tools 에 있다; `toolCount().total` = backlog 표 행 수; keywords 에 이름 자체 포함.
- [x] **Step 2:** FAIL 확인
- [x] **Step 3:** 구현. 동의어(keywords)는 도구마다 자동완성 기록(`keywords/*.csv`)에서 2~5개.
- [x] **Step 4:** PASS
- [x] **Step 5:** 커밋 `data: 도구 레지스트리 · 분류 12개 · 담길 목록`

### Task 4: ✅ 완료(2026-10-17) 홈 — 검색 히어로 + 도구 도감

**Files:**
- Modify: `src/pages/index.astro`(히어로·`#tools` 구획), `src/styles/global.css`(`.home-hero` 재작성, `.hero-find`·`.hero-search`·`.search-pop`·`.hero-quick`·`.dex-*` 추가)
- Create: `src/components/ToolCard.astro`
- Test: `src/lib/__tests__/home.test.ts`(빌드된 `dist/index.html` 대상, 기존 dist 테스트와 같은 방식)

**Interfaces:**
- Consumes: Task 3 `tools`, `TOOL_TYPES`, `toolCount()`
- Produces: 마크업 계약(Task 5 스크립트가 씀) — `<input id="tool-q" type="search">`, `<div id="tool-pop" role="listbox" hidden>`, 분류 버튼 `button[data-type]`, 카드 `a.tool-card[data-type][data-no]`. `<ToolCard tool={Tool} />`.

- [x] **Step 1: 실패하는 테스트** — dist 홈에: `.home-hero` 에 `background-image`/사진 없음(`hero.webp` 문자열 없음); `#tool-q` 존재, placeholder `실수령액, 퇴직금, 3.3%…`; `.hero-quick a` 5개; `도구 {live}개 담김 · {total}개 채우는 중` 문자열이 `toolCount()` 와 일치; `#tools h2` = `도구 도감`; 카드 수 = live + next; 각 live 카드에 `No.` + 3자리 번호; next 카드는 `dex-unseen` 클래스.
- [x] **Step 2:** `npm run build && npx vitest run src/lib/__tests__/home.test.ts` → FAIL
- [x] **Step 3:** 시안 03(검색) CSS 를 global.css 로 옮긴다(사진 히어로·스크림 규칙 삭제, 가운데 620px, 검색창 60px, 결과 창 absolute). 자주 찾는 말 5개: 실수령액 · 3.3% 원천징수 · 부가세 · 상속세 · 노령연금. 모바일: 분류 뱃지 가로 스크롤 한 줄, `kbd` 숨김.
- [x] **Step 4:** PASS + Playwright 캡처(1100·390 폭, 라이트·다크)를 시안과 나란히 보고 어긋남 없음.
- [x] **Step 5:** 커밋 `home: 검색 히어로 + 도구 도감`

### Task 5: ✅ 완료(2026-10-17) 초성·동의어 검색

**Files:**
- Create: `src/lib/search.ts`, `src/scripts/tool-search.ts`, `src/pages/tools.json.ts`(레지스트리를 빌드 때 JSON 으로)
- Test: `src/lib/__tests__/search.test.ts`

**Interfaces:**
- Consumes: Task 3 `Tool`, Task 4 마크업 계약
- Produces: `toChoseong(s: string): string`; `normalize(s: string): string`(공백 제거·소문자·전각→반각); `searchTools(list: Tool[], q: string, limit = 8): { tool: Tool; ranges: [number, number][] }[]` — 순위: 이름 앞부분 일치 > 이름 포함 > 초성 일치 > keywords 일치; live 먼저, next 는 뒤에 '곧 담길 도구'.
- [x] **Step 1: 실패하는 표 테스트** — `ㅅㅅㄹㅇ` → 첫 결과 href `/guide/take-home-calculator/`; `3.3` → `/freelancer-33/` 이 1위; ` 부가세 ` → `/vat/`; `월급 얼마` → 실수령액 계열(동의어); `ㅅㅅ 령` 같은 자모+완성형 섞인 입력도 결과 1개 이상; `PDF` → next 의 PDF 도구(있으면) 또는 빈 배열이지만 예외 없음; 빈 문자열 → 빈 배열; ranges 는 이름 안 일치 구간(칠하기용). 동의어 사례 30개를 표로 고정(설계 8절 기준).
- [x] **Step 2:** FAIL
- [x] **Step 3:** 구현. 스크립트: 입력마다 `searchTools` → `#tool-pop` 렌더(색 점·이름·`<small>분류 · 설명</small>`·`No.`), ↑↓·Enter·Esc, 데스크톱 `/` 로 포커스, 바깥 클릭 닫기, 결과 0개면 "아직 없는 도구예요" 한 줄.
- [x] **Step 4:** PASS + 홈에서 손으로 `ㅅㅅㄹㅇ` → Enter 로 계산기 이동 확인.
- [x] **Step 5:** 커밋 `search: 초성·동의어 도구 검색`

### Task 6: ✅ 완료(2026-10-17) 수집(내가 써 본 도구) + 분류 3D 아이콘 + 모션

**Files:**
- Create: `src/lib/collect.ts`, `src/components/TypeIcon.astro`, `src/scripts/dex.ts`
- Modify: `src/lib/track.ts`(`trackCalculatorUse` 가 처음 사용 때 `markUsed(href)` 호출), `src/pages/index.astro`, `src/layouts/GuideLayout.astro`(계산기 페이지에 '주머니에 담겼어요' 알림 자리)
- Test: `src/lib/__tests__/collect.test.ts`

**Interfaces:**
- Produces: `markUsed(href: string, store?: Storage | null): boolean`(처음이면 true); `usedSet(store?: Storage | null): Set<string>`(예외면 빈 Set); 키 `jp-used`(JSON 배열). `<TypeIcon type={ToolType} size={number} />` — 로고와 같은 질감 SVG.
- [x] **Step 1: 실패하는 테스트** — throw 하는 Storage 에서 markUsed false·usedSet 빈 Set; 같은 href 두 번 → 두 번째 false; 깨진 JSON 저장값 → 빈 Set.
- [x] **Step 2:** FAIL
- [x] **Step 3:** 구현. 홈 `dex.ts`: 진행 바 `내가 써 본 도구 n / live`(모바일 `써 본 도구 n/live`), 써 본 카드에 '써봄' 도장, 분류 버튼으로 걸러 보기 + 분류별 수집률. 계산기에서 첫 사용 때 알림 한 번(도장 0.5초, reduced-motion 이면 정지 표시). 결과 금액 카운트업 0.4초 이하.
- [x] **Step 4:** PASS + localStorage 막은 Playwright 컨텍스트에서 홈 렌더 정상.
- [x] **Step 5:** 커밋 `dex: 써 본 도구 수집 · 분류 3D 아이콘 · 작은 모션`

### Task 7: ✅ 완료(2026-10-17) 계산기 틀(공통 부품) — 실수령액 계산기로 먼저

**Files:**
- Create: `src/lib/calc-ui.ts`(순수 함수), `src/scripts/calc-ui.ts`(DOM 향상), `src/data/calc-presets.ts`
- Modify: `src/styles/global.css`(계산기 블록: `.calc-input-wrap`·`.ux-field`·`.ux-seg`·`.ux-step`·`.ux-presets`·`.won-read`·`.ux-bar`·`.ux-legend`·`.stat-row[data-receipt]`·`.ux-sub`·`.ux-actions`·`.ux-dock`·두 칸 배치), `src/pages/guide/take-home-calculator/index.astro`, `src/layouts/GuideLayout.astro`(calc-ui 스크립트 한 번 포함)
- Test: `src/lib/__tests__/calc-ui.test.ts`

**Interfaces:**
- Produces:
  - `readWon(n: number): string` — 0·NaN → `""`; 36000000 → `"3,600만원"`; 120000000 → `"1억 2,000만원"`; 4166666 → `"416만 6,666원"`; 9500 → `"9,500원"`.
  - `shares(parts: number[]): number[]` — 합이 0 이면 전부 0, 아니면 반올림 백분율.
  - `calcPresets: Record<string, { amounts: number[]; source: string }>` — 키는 페이지 경로, `source` 는 그 금액이 나온 자동완성 CSV 경로(지어내지 않음).
  - 마크업 계약(모든 계산기 공통): 금액 칸 `input[data-won]` → 아래 `.won-read`; `select[data-seg]` → 세그먼트 버튼(원래 select 는 숨기고 값 동기화, change/input 이벤트 발생); `input[type=number][data-step]` → −/+; `[data-presets-for="<input id>"]` → 프리셋 버튼; `.stat-row[data-receipt]` 안 `[data-group="이름"]` 첫 칩 앞에 소계 줄; `.result-hero[data-bar="id1,id2|id3,id4|id5"]` → 비율 막대(무리는 `|`, 무리 안 합산); `.result-hero[data-dock="<값 요소 id>"]` → 폰 고정 띠; `.calc-card[data-two]` → 900px 이상 두 칸. 스크립트가 없으면 원래 입력이 그대로 동작해야 한다.
- [x] **Step 1: 실패하는 테스트** — `readWon`·`shares`(빈 값·0 포함) 표; `calcPresets` 의 모든 금액이 `source` CSV 의 키워드 문자열에 만원·억 표기로 등장; dist `take-home-calculator` HTML 에 원래 `<select id="th-mode">` 와 `<input type="number" id="th-family">` 가 그대로 있다(점진적 향상), `data-seg`·`data-step`·`data-receipt`·`data-bar`·`data-dock`·`data-two` 가 붙어 있다.
- [x] **Step 2:** FAIL
- [x] **Step 3:** 구현 — 시안 `ux-calc.css`·`ux-calc.js`(scratchpad)의 동작을 마크업 계약 기반 일반 스크립트로. 입력칸 높이 약 58px(글자 20px), 결과 복사(기존 복사 기능 재사용)·처음 값으로. 결과 값이 바뀌면 MutationObserver 로 소계·막대·고정 띠 갱신.
- [x] **Step 4:** PASS + Playwright: 390×844 에서 계산기 카드 맨 위로 스크롤했을 때 결과 카드가 화면 안; 페이지 맨 위에서 고정 띠 표시; 5,000만 프리셋 → 가족 + → 월급 전환 후 결과·소계·띠가 같은 값.
- [x] **Step 5:** 커밋 `calc: 공통 계산기 틀 — 실수령액 계산기부터`

### Task 8: 나머지 계산기 34개 이전 + roberin 대조표

**Files:**
- Modify: `calc-card` 를 쓰는 나머지 페이지(`grep -rln "calc-card" src/pages` — 지금 35개 중 Task 7 제외 34개)와 각 계산기 스크립트(결과 요소 id 만 맞춤)
- Create: `docs/calc-benchmark.md`
- Test: `src/lib/__tests__/calc-frame.test.ts`

**Interfaces:**
- Consumes: Task 7 마크업 계약·`calcPresets`
- [ ] **Step 1: 실패하는 테스트** — `calc-card` 가 있는 모든 dist 페이지에: 금액 입력마다 `data-won`, 선택지 2~3개 select 는 `data-seg`, 사람 수·개수 number 칸은 `data-step`, 세부 결과가 3개 이상이면 `data-receipt`, `data-dock` 하나; `docs/calc-benchmark.md` 에 페이지마다 한 행(우리 주소 · roberin 대응 도구 주소 또는 '없음' · 입력 순서 비교 · 결과 항목 비교 · 더한 것).
- [ ] **Step 2:** FAIL
- [ ] **Step 3:** 페이지마다 roberin 의 같은 도구를 열어 대조표 행을 채우고(문구·디자인은 보지 않고 항목·순서만), 우리에게 없는 유용한 결과 항목은 **법 원문으로 확인되는 것만** 더한다(rates 에 없으면 대조표에 '보류 — 원문 미확인'). 프리셋은 `calcPresets` 에 출처와 함께.
- [ ] **Step 4:** `npm test`·`npm run build` PASS, 계산기 5개(3.3%·부가세·국민연금 보험료·휴업급여·차용증 이자율)를 390 폭 라이트·다크로 캡처해 확인.
- [ ] **Step 5:** 묶음별로 나눠 커밋(세금 · 급여·근로 · 연금·보험 · 집·차 · 상속·증여) `calc: <분류> 계산기 새 틀로 + roberin 대조`


**2026-10-17 진행:** 기본 틀은 계산기 35개 전부에 자동 적용됨(`calc-ui.ts` autoTag — 원 단위 금액 읽어 주기·사람 수/기간 −/+·짧은 선택지 버튼·영수증 목록·폰 결과 고정 띠). 아래는 **계산기마다 하나씩**(루틴 한 회차 = 한 줄): roberin 같은 도구 대조 → `data-two` · `data-bar` · `data-group` 소계 · `calcPresets`(자동완성 출처) · 결과 복사/처음 값으로 → `docs/calc-benchmark.md` 한 행.

- [x] /guide/take-home-calculator/ (Task 7)
- [x] /freelancer-33/ (2026-10-17 — 소득세·지방소득세 나눠 보기·소계·막대·두 칸·자동완성 프리셋, roberin 7개 일치)
- [x] /withholding/ (2026-10-17 — 기타소득 과세최저한 fix·역산 추가, 소득세·지방소득세 나눠 보기·소계·막대·두 칸, roberin 대조)
- [x] /vat/ (2026-10-17 — 계산 방식 선택 상자·영수증 3줄·막대·두 칸·자동완성 프리셋, roberin 대조: 역산 1원 단수 차이만)
- [x] /income-tax-refund/ (2026-10-17 — 지방소득세 이중계산 fix(제76조 ③4호), 소득세·지방소득세 따로 정산 영수증·소계·막대·두 칸·자동완성 프리셋, roberin 4개 일치)
- [x] /penalty/ (2026-10-17 — 감면 구간 달력 개월(민법 제160조)·납부지연 일수 납부일 전날까지(제47조의4 ①1) fix, 날짜 입력·감면 마지막 날 버튼·소계 2개·막대·두 칸, roberin 종소세 계산기 하위 기능과 국세분 대조. 프리셋 없음 — 자동완성에 금액 없음)
- [x] /national-pension-premium/ (2026-10-17 — 보험료 뺀 월소득·소계·막대·두 칸, 상·하한 문구 rates 에서, roberin 4대보험 국민연금 줄과 대조: 천원 미만 절사(시행령 제5조①)로 우리 맞음. 프리셋 없음 — 자동완성에 금액 없음)
- [x] /guide/four-insurance-calculator/ (2026-10-17 — 근로자·사업주 소계·막대·두 칸·자동완성 프리셋 200만·300만, roberin 대조: 기준소득월액 천원 절사·장기요양 반올림 시점은 우리 맞음, 국민연금 몫 10원 절사·건강보험 원 단위는 보류. 틀 막대 범례 합 101% → 100% 고침)
- [x] /guide/weekly-holiday-pay-calculator/ (2026-10-17 — 개근 체크·근무 임금·1주/한 달 소계·막대·−/+·두 칸, roberin 대조: 주휴수당 1원까지 같음, 45h 근로급여는 우리 40h 자름(제50조), 주 6일 사업장 ÷6 은 단수 원문 미확인 보류. 프리셋 없음 — 자동완성에 시급 금액 없음)
- [x] /guide/minimum-wage-calculator/ (2026-10-17 — 최저 주급(시행령 제5조 ①2) 추가·최저 월급 소계(받는 임금 + 모자라는 금액)·막대·−/+·연도·수습 버튼·두 칸, roberin 시급계산기 대조: 주 40h 는 고시 209시간인 우리가 고시 금액과 같음(roberin 208.57h), 20h 같음. 프리셋 없음 — 자동완성에 금액 없음)
- [x] /guide/annual-leave-calculator/ (2026-10-17 — 상시 근로자 수 버튼(4명 이하 제60조 미적용, 시행령 별표 1)·다음 연차 생기는 날·그날 생기는 일수·수당 산식 표기·−/+·두 칸·고정 띠, roberin 연차일수 계산기 대조: 일수 경계 8개 같음, 1일 통상임금 단수 차이(하루 최대 7원)는 원문에 단수 규정 없어 보류. 프리셋 없음 — 자동완성에 금액 없음)
- [x] /guide/unemployment-benefit-calculator/ (2026-10-17 — 말일 이직 3개월 일수 fix(민법 제160조 ③, 2/31 → 3/3 넘침), 하루 구직급여 소계(60% + 하한까지 보탠 금액)·막대·산정일수·1일 소정근로시간 표시·나이 버튼·−/+·두 칸·고정 띠, roberin 대조: 7개 같음, 2027 이직 하한은 우리 맞음(roberin 2026 최저임금), 340만 1원 단수는 보류. 프리셋 없음 — 자동완성에 금액 없음)
- [x] /guide/parental-leave-pay-calculator/ (2026-10-17 — 한 달 평균·1~3/4~6/7개월째부터 소계(bandTotals)·세 구간 막대·유형별 상한 표기·자동완성 프리셋 150만·250만·−/+·유형 버튼·두 칸·고정 띠, roberin 대조: 같은 개월 수 입력 6개 모두 같음, 6+6 부모 개월 수가 다를 때는 제95조의3 각 목이 '각각 N개월'만 정해 보류)
- [x] /guide/severance-tax-calculator/ (2026-10-17 — 남은 개월 칸(lib yearsFrom)·근속연수공제·환산급여·환산급여공제 칩·세금 합계 소계·세후/세금 막대·산식 한 줄·−/+·두 칸·고정 띠, roberin 퇴직소득세 계산기 대조: 소득세 7개 같음(손계산 테스트 고정), 지방소득세 10원 단수 차이는 원문 미확인 보류. 프리셋 없음 — 자동완성 금액 줄기 1억 하나(기본값))
- [x] /guide/year-end-calculator/ (2026-10-17 — lib credits(제61조 한도 뒤 실제 공제)·공제 단계 칩·이미 뗀 세금·산출세액 소계(결정세액 + 실제 공제)·막대·제61조 안내·−/+·자동완성 프리셋 3,000만·4,000만·두 칸·고정 띠 제목 갱신. roberin 에 같은 도구 없음 → 대조표 '없음', 조문 손계산 3개로 대조(모두 같음))
- [x] /guide/irp-tax-credit-calculator/ (2026-10-17 — lib roomToCap(한도 넘긴 돈·900만원까지 남은 금액·채우면 더 줄어드는 세금, 제61조 한도 반영)·산출세액 한도 때 소득세·지방소득세 칩 어긋남 고침·공제율 구간 버튼·줄어드는 세금 소계·막대·자동완성 프리셋 연금저축 300만·600만/IRP 300만·900만·두 칸·고정 띠, roberin 대조: 6개 1원까지 같음. 소득 입력 자동 판정은 보류 — 총급여 5,500만 rates 숫자 필드 없음)
- [x] /guide/medical-credit-limit/ (2026-10-17 — lib base·absorbed·over·toThreshold(3%로 빠진 돈·700만원 한도로 빠진 돈·3%까지 남은 의료비)·미숙아·난임 칩·공제 대상 소계(정수 합)·공제 대상/3%/한도 막대·두 칸·고정 띠. roberin 에 같은 도구 없음 → 대조표 '없음', 제59조의4 ② 손계산 4개로 대조(모두 같음). 프리셋 없음 — 자동완성에 금액 없음)
- [x] /guide/earned-incentive-amount/ (2026-10-17 — lib assetsCut·lateCut·reduced·minAdj·belowMax·bandInfo, 소득 구간·최대 금액 구간·법 식 금액·최대보다 적은 돈·최소 금액 조정 칩·줄어든 돈 소계(재산 50%·기한 후 5%)·막대·1만원당 감소액 산식·가구 버튼·두 칸·고정 띠. roberin 에 같은 도구 없음 → 대조표 '없음', 손계산 8개 같음·무작위 2만 건 항등식. 감액 → 최소 금액 순서는 제100조의7 ③ 원문으로 확인. 프리셋 없음 — 자동완성에 금액 없음)
- [x] /guide/child-incentive-amount/ (2026-10-17 — lib band·assetsCut·lateCut·floorAdj·belowMax·bandInfo, 소득 구간·1명당 100만원 받는 총급여액 등·법 식 금액·최대보다 적은 돈·3만원 하한으로 더한 돈 칩·줄어든 돈 소계(재산 50%·기한 후 5%·자녀세액공제)·막대·자녀 1명당 1만원당 감소액 산식·가구 버튼·자녀 수 −/+·두 칸·고정 띠. roberin 에 같은 도구 없음 → 대조표 '없음', 손계산 6개 같음·무작위 2만 건 항등식. 3만원 하한은 세 감액 뒤 적용(제100조의31 ② 원문), 감액 순서·1만5천원 단서는 보류. 프리셋 없음 — 자동완성에 금액 없음)
- [x] /guide/basic-pension-calculator/ (2026-10-17 — lib baseTotal·coupleCut·reversalCut·room·propertySteps, 선정기준액·남은/넘은 금액·기준연금액 칩·소득인정액 소계(근로 평가액·그 밖의 소득·재산 환산액)·줄어든 돈 소계(부부 20%·선정기준액 감액)·막대·재산 환산 산식·가구/사는 곳 버튼·자동완성 프리셋 예금 1억·2억·두 칸·고정 띠. roberin 에 같은 도구 없음 → 대조표 '없음', 손계산 6개 같음·무작위 2만 건 항등식. 국민연금 연계 감액·이자소득 칸은 넣지 않음)
- [ ] /guide/old-age-pension-age/
- [ ] /guide/industrial-accident-leave-pay/
- [ ] /guide/industrial-accident-disability/
- [ ] /inheritance/
- [ ] /guide/gift-tax-calculator/
- [ ] /guide/family-loan-interest/
- [ ] /guide/capital-gains-calculator/
- [ ] /acquisition-tax/
- [ ] /guide/divorce-acquisition-tax/
- [ ] /property-tax/
- [ ] /guide/jongbu-calculator/
- [ ] /vehicle-tax/
- [ ] /guide/electric-car-tax-calculator/
- [ ] /guide/crypto-tax-calculator/
- [ ] /guide/lotto-tax-calculator/

### Task 9: 마무리 — 브랜드 자산·구조화 데이터·라이브 확인

**Files:**
- Modify: 홈 구조화 데이터(`logo`·`description`), 카드뉴스 표지·CTA 로고(`src/components/CardArtboard.astro`), `docs/keyword-research.md`(새 절 append)
- Test: 기존 SEO·스니펫·카드 테스트

- [ ] **Step 1:** 구조화 데이터 `logo` 를 새 PNG 512 로, description 을 도구 모음 문구로 — 기존 SEO 테스트 기대값을 같이 갱신(실패 → 수정 → 통과).
- [ ] **Step 2:** `npm run cards -- --set` 은 **사용자에게 묻고** 실행(발행본 재생성).
- [ ] **Step 3:** 푸시 후 라이브: 홈·실수령액·3.3%·favicon·OG 200, 다크 저장 후 새로고침 깜빡임 없음.
- [ ] **Step 4:** 사용자에게 GSC 홈 재색인 요청 안내, 인스타·스레드 프로필 이미지 파일(`public/icon-512.png`) 전달.
- [ ] **Step 5:** 커밋 `brand: 구조화 데이터 · 카드 로고 · 마무리`
