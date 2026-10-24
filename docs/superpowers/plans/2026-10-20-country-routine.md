# 나라판 루틴 — 조사표 그 나라 칸 → 원문 확인 → 그 나라 판 페이지

> **For agentic workers:** 한 번 돌 때(1회차) 할 일을 적은 반복 절차다. **나라 코드(`<code>`) 하나를 받아** 그 나라만 처리한다. 회차마다 처음부터 읽고, 먼저 `docs/countries/<code>.md` 머리의 **설정**(판·접두어·허용 출처·자동완성 언어)을 읽는다. 일본어판 루틴(`2026-10-19-ja-routine.md`)을 모든 나라로 넓힌 것이고, 일본도 이제 이 문서를 따른다.

**Goal:** 한국 도구 루틴이 조사표(`docs/country-matrix.md`)에 쌓은 나라별 판정을 하나씩 그 나라 판 페이지로 바꾼다. 산술 도구는 바로, 제도 도구는 그 나라 원문으로 숫자를 다 확인한 뒤.

## 왜 나라마다 작업 폴더를 따로 쓰나

루틴 여러 개가 한 폴더(`cal`)와 잠금 하나를 같이 쓰면 한 시간에 하나만 돈다. 그래서 나라 루틴은 **자기 git worktree** `../cal-wt/<code>`(= `C:\Users\kjh58\Desktop\김주혁\workspace\cal-wt\<code>`)에서 일하고, 끝에 `origin/main` 위로 올려 push 한다. 한국 도구 루틴은 지금처럼 `cal` 에서 돈다.

동시에 돌아도 충돌하지 않도록 **나라 루틴이 고칠 수 있는 파일을 정해 둔다**(아래 '내 파일').

**올리기는 한 줄로 선다(2026-10-20).** 13개가 각자 rebase·테스트·push 하다가 같은 공유 파일에서 충돌했고(독일·프랑스·스페인·인도네시아), 홍콩 회차는 커밋을 올리지도 기록하지도 못하고 끝났다. 그래서 모든 루틴은 `node scripts/country/ship.mjs <code>` 로만 올린다 — 공용 잠금 `main`(`cal-wt/.locks/main`)을 잡고 rebase → 내 파일 검사 → 전체 빌드·테스트 → push 를 한 번에 하고 잠금을 푼다. 공유 산술 스크립트는 **고치기 전에** 같은 잠금을 잡는다. 멈춘 회차가 남긴 것은 `node scripts/country/audit.mjs --fix` 가 `wip/<code>-<시각>` 브랜치로 보관한다(**git stash 는 쓰지 않는다** — 모든 작업 폴더가 stash 하나를 같이 써서 남의 것을 꺼낼 수 있다). 조사표는 **읽기만** 한다 — 같은 줄의 다른 칸을 여러 나라가 고치면 반드시 충돌한다. 조사표는 한국 루틴이 쓴다.

## 나라판 기초 (이미 있음 — 회차에서 고치지 않는다)

- 판 목록·주소 접두어·`<html lang>`·hreflang·통화: `src/i18n/locales.ts`. 틀의 말(메뉴·버튼·면책·홈 머리말): `src/i18n/ui.ts`.
- 판의 도구 목록: `src/data/<판>/tools.ts` 의 `tools` 배열(형식 `src/i18n/registry.ts` 의 `LocaleTool`). **계산이 같은 한국어판이 있으면 `ko: "<한국어판 주소>"`** → hreflang·언어 메뉴가 모든 판에 자동으로 생긴다. 제도 도구(`basis: "law"`)는 `ko` 를 적지 않는다.
- 판의 홈: `src/pages/<판>/index.astro` 는 `<LocaleHome locale="<판>" />` 한 줄. **그 판의 첫 도구를 낼 때 같이 만든다**(도구 없는 빈 홈 금지 — 테스트가 막는다).
- 계산기 틀(`src/scripts/calc-ui.ts`)은 페이지 언어로 버튼·안내를 바꾼다. 공유 산술 스크립트의 문구는 `pickLang({ ko: KO, ja: JA, en: EN, … })`(`src/i18n/ui.ts`)로 고른다 — 영어 다섯 나라는 `en` 하나를 같이 쓴다.
- 테스트 `src/lib/__tests__/i18n.test.ts`: 판 페이지는 그 판 `<html lang>`, 본문에 한글 없음, 짝 양방향, 도구 주소가 실제 페이지, 빈 홈 없음.

## 내 파일 — 이 밖의 파일이 바뀌어 있으면 커밋하지 않는다

`<판>` = 설정의 판(예 `en-us`), `<code>` = 나라 코드(예 `us`).

- `src/pages/<판>/**` · `src/data/<판>/**` · `src/rates/<code>/**` · `src/lib/<code>/**` · `src/lib/__tests__/<code>-*.test.ts`
- `docs/countries/<code>.md` · `keywords/<code>-*` (일본은 예전 이름 `keywords/ja-*` 도)
- **공유 산술 도구에 내 언어 문구를 넣을 때만**: 그 도구의 `src/scripts/<tool>.ts`(사전 하나 더하기·`pickLang` 으로 바꾸기)와 그 lib·테스트. **고치기 전에** `node scripts/country/lock.mjs acquire main <code>` 로 잠금을 잡고 → `git fetch origin && git rebase origin/main` → 고치고 커밋 → `ship <code> --shared`(같은 주인의 잠금을 이어 쓰고 끝나면 푼다). 잠금을 40분 안에 못 잡으면 공유 파일이 필요 없는 다른 도구로 넘어가거나 `보류(잠금 대기)`.
- 이 목록은 `scripts/country/paths.mjs` 가 기계로 검사한다(ship 이 막는다).
- 그 밖(`src/i18n/**`·`src/components/**`·`src/styles/**`·한국어판 페이지·한국 rates·링크허브·조사표)은 고치지 않는다. 기초가 모자라면 `docs/countries/<code>.md` 에 `기초 필요: <무엇>` 으로 남기고 끝낸다 — 사람이 기초를 고친다.

## 지켜야 할 것 (매 회차)

- **번역하지 않는다.** 한국어 글을 옮기지 않고, 그 나라 구글 자동완성으로 소제목을 정해 그 나라 말로 새로 쓴다.
- **숫자는 그 나라 공식 원문만**(설정의 허용 출처). 뉴스·블로그·계산 사이트 숫자는 쓰지 않는다. 기준일·과세연도와 확인일을 rates 에. 이전 연도 값을 추론하지 않는다. 개정 예정이 원문에 있으면 rates `note` 에 남기고 그 날짜 전에 다시 확인한다.
- **rates 초안을 페이지에서 쓰려면** `draft` 를 지우고 남은 미확인이 없어야 한다. 하나라도 남으면 이번 회차에 페이지를 만들지 않는다.
- **개별 세무·법률 상담처럼 쓰지 않는다**("in your case…" 판단 금지). 계산식과 원문 안내까지.
- **조사표 판정을 뒤집을 근거를 찾으면** 조사표를 고치지 말고 `docs/countries/<code>.md` 에 `조사표 정정 제안:` 으로 남긴다.
- 테스트·빌드 통과 전에는 커밋하지 않는다. `git add` 는 파일을 명시. 커밋 끝줄 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- 사람에게 묻지 않는다 — 막히면 기록하고 끝낸다.

## 한 회차 (도구 1개)

### 0. 작업 폴더 · 잠금
- [ ] `W=C:/Users/kjh58/Desktop/김주혁/workspace/cal-wt/<code>`. 없으면 만든다: `git -C C:/Users/kjh58/Desktop/김주혁/workspace/cal fetch origin` → `git -C …/cal worktree add --detach "$W" origin/main` → `cd "$W" && npm ci`. (`node_modules` 를 다른 폴더와 공유하지 않는다 — 동시에 빌드하면 캐시가 섞인다.)
- [ ] `$W/.routine-lock` 이 있으면 "잠금 중: <첫 줄>" 만 남기고 끝낸다. 수정 시각이 90분보다 오래됐으면 멈춘 회차로 보고 지운다.
- [ ] `$W` 에 변경·안 올린 커밋이 남아 있으면(지난 회차가 멈춘 것) `node scripts/country/audit.mjs --fix` — `wip/<code>-<시각>` 브랜치로 보관하고 폴더를 origin/main 으로 되돌린다. **git stash 금지.**
- [ ] 내 보관 브랜치(`git branch --list 'wip/<code>-*'`)가 있으면 **이번 회차는 그것부터**: 새 origin/main 위에 `git cherry-pick <커밋들>` → 기록 행 갱신 → 5단계로 올린다. 올라가면 `git branch -D <브랜치>`. cherry-pick 충돌이면 `git cherry-pick --abort` 하고 그 커밋의 의도대로 새 main 위에서 다시 만든다(공유 파일이면 잠금부터).
- [ ] `.routine-lock` 을 만들고(`<code> 루틴 <시각>`), 끝날 때 성공·실패와 관계없이 지운다.
- [ ] `git fetch origin && git checkout --detach origin/main`. `node_modules` 가 `package-lock.json` 보다 오래됐으면 `npm ci`.

### 1. 고르기 — 조사표 그 나라 칸 (읽기만)
- [ ] **먼저 `node scripts/country/brief.mjs <code>` 한 번**(2026-10-24 토큰 다이어트). 설정·한 일·순위별 후보·보관 브랜치·'▶ 다음'이 한 화면에 나온다. 조사표(4만 토큰)·기록 파일을 cat 하지 않는다 — 행 근거는 `sed -n '<줄>p'` 로 그 줄만.
- [ ] 후보를 건너뛰면(짝 없음·원문 막힘) **반드시 `보류(이유)` 행을 남긴다** — brief 는 발행·판정·보류 행으로 끝난 도구를 뺀다. 행 없이 메모에만 적으면 다음 회차가 같은 후보를 또 고른다.
- [ ] `docs/countries/<code>.md` 에 `진행 중` 이 있으면 그것부터. 없으면 조사표에서 설정의 **칸 이름** 열을 이 순서로 하나(같은 순위면 표 위쪽부터). 이미 `docs/countries/<code>.md` 에 `발행`·`판정` 으로 적힌 도구는 건너뛴다.

| 순위 | 그 나라 칸 | 이번 회차 | 기록 상태 |
|---|---|---|---|
| 1 | **같음·단위** | `/<판>/tools/<slug>/` — 한국어판 lib·script 공유, 문구는 `pickLang`, 통화·단위·날짜 표기는 그 나라 것. `tools.ts` 에 `ko` 짝 | 발행 |
| 2 | **제도**, `src/rates/<code>/` 초안 숫자가 전부 검증됨 | `src/lib/<code>/<주제>.ts` + 테스트(원문 예시 손계산 고정), `/<판>/<slug>/`, `basis: "law"`, 짝 없음 | 발행 |
| 3 | **제도**, 초안에 미확인이 남음 또는 초안 없음 | 허용 출처로 초안을 만들거나 빈 숫자를 채움(페이지 없음) | 보강 |
| 4 | **미확인** | 허용 출처로 같음·단위·제도·없음 판정 + 근거 주소 | 판정 |
| — | **없음** | 건너뜀 | — |

- [ ] 고른 것을 `docs/countries/<code>.md` 표에 `진행 중` 행으로.

### 2. 원문 확인
- [ ] 허용 출처만 연다. 숫자마다 출처 주소·기준일(과세연도)·확인일을 rates 에. 표를 끝까지 읽지 못했으면 그 표는 `notVerified` 에 남기고 3순위로 처리를 바꾼다.
- [ ] 원문을 못 열면(응답 없음·403·글자 깨짐) 추측하지 않고 `미확인 — <이유>` 로 남기고 끝낸다.

### 3. 키워드
- [ ] `python C:/Users/kjh58/.claude/skills/keyword-tools/scripts/discover_keywords.py --seeds "<그 나라 말 시드>" --depth 1 --engine google --hl <설정 hl> --gl <설정 gl> --out keywords/<code>-<slug>-<날짜>.csv`. 자동완성 축으로 제목·소제목. 한국어 제목을 번역하지 않는다.
- [ ] 그 나라 고유 표기·관습(통화 기호 위치, 소수점·천 단위 구분, 날짜 순서, 단위계)은 원문·관습으로 확인된 것만.

### 4. 만들기
- [ ] 페이지는 `<html lang="<설정 htmlLang>">`, BaseHead·SiteHeader·SiteFooter 그대로(언어는 주소로 자동). 계산기 마크업은 data-* 계약(`2026-10-16-jupocket-rebrand.md` Task 7).
- [ ] 판의 첫 도구면 `src/pages/<판>/index.astro`(`<LocaleHome locale="<판>" />`)도 만든다.
- [ ] 금액은 계산 함수로. 본문 끝에 원문 출처 링크.
- [ ] **title·description 은 사이트 전체에서 유일해야 한다**(`seo.test.ts`). 같은 언어를 쓰는 다른 판(en-us·en-gb·en-ca·en-au·en-sg, zh-tw·zh-hk)에 같은 도구가 이미 있으면 제목·설명에 나라 이름이나 그 나라 표현(UK·VAT·GST·HMRC…)을 넣어 갈라 쓴다.

### 5. 검사 → 커밋 → 올리기
- [ ] `git status --short` 의 모든 파일이 '내 파일' 안인지 확인. 아니면 그 파일을 되돌리고(`git checkout -- <파일>`) 기록.
- [ ] 내 테스트만 먼저: `set -o pipefail; npx vitest run src/lib/__tests__/i18n.test.ts src/lib/__tests__/<code>-* > out.txt; echo $?`(전체 빌드·테스트는 ship 이 잠금 안에서 한 번 돈다 — 13개가 동시에 전체를 돌리면 PC 가 멈춘다).
- [ ] 6단계 기록 행까지 써서 커밋한다(`<code>: <도구> <판> 페이지` · `docs: <code> <주제> 판정`). 커밋 안 한 변경이 남으면 ship 이 거부한다.
- [ ] 올리기: `node scripts/country/ship.mjs <code> --live <새 페이지 주소…>`(공유 파일을 고쳤으면 `--shared`). 종료 코드:
  - `0` 올라감 — `--live` 주소가 200 이 되면 IndexNow 까지 알렸다(로그 `out-ship.txt`)
  - `2` rebase 충돌 · `5` 잠금을 40분 못 잡음 · `6` push 실패 → 커밋을 `git branch wip/<code>-<시각>` 로 보관하고 끝(다음 회차가 0단계에서 집는다)
  - `3` 빌드·테스트 실패 → `out-ship.txt` 를 보고 고쳐 다시(두 번까지), 안 되면 커밋을 되돌리고 `보류(테스트)`
  - `4` 내 파일 밖을 고침 → 그 파일을 되돌리고 다시 · `7` 커밋 안 한 변경 → 커밋하고 다시
- [ ] 라이브 주소가 200 이 안 됐으면(배포 지연) 다음 회차가 확인한다 — 기록 행 메모에 '라이브 확인 전'.

### 6. 기록
- [ ] `docs/countries/<code>.md` 행 상태(발행·보강·판정·보류(이유)) + 근거 주소·자동완성 CSV·확인일. **메모는 200자 이내**(테스트가 300자에서 막는다 — 긴 설명은 커밋 메시지로, 예전 긴 메모는 `docs/countries/archive/`). **ship 전에** 커밋해 같은 push 에 묶는다(5단계).
- [ ] 회차 요약 3줄.

## 배차 루틴 (2026-10-20, 2026-10-24 개정 — 나라별 예약 12개를 대신한다)

앱의 예약 실행은 동시에 몇 개만 돌고 나머지 시각을 건너뛴다. 그래서 예약은 **배차 루틴 하나**(`jupocket-country-dispatch`, 2시간마다)만 두고, 그 회차가 나라 4개를 하위 에이전트로 동시에 돌린다 — 세 조가 차례로(0조 jp·us·gb·ca → 1조 au·sg·de·fr → 2조 es·tw·hk·id, 순번 `cal-wt/.dispatch-group`). 12개를 한꺼번에 돌리면 요금제 5시간·주간 한도를 빨리 써서 2026-10-21 에 4개로 줄였다.

**토큰 다이어트(2026-10-24 측정 뒤):** 나라 에이전트 1회 중앙값 47.5만(가중) 중 약 70% 가 일 시작 전 문맥(7.9만 — 쓰지 않는 도구 정의)을 턴마다 다시 읽은 몫이었다.
- 에이전트는 **`country-runner` 유형**(`.claude/agents/country-runner.md`)으로 띄운다 — 도구를 Bash·Read·Write·Edit·Grep·Glob·WebFetch·WebSearch·브라우저 읽기 둘로 줄였고, 회차 지시도 그 파일에 있다.
- **모델은 할 일에 따라**: 배차가 먼저 `node scripts/country/brief.mjs <code> --next` 로 종류를 보고 — `law`(그 나라 제도를 적용하는 페이지)·`resume`(보관 브랜치 이어 올리기)은 Opus, `page`(산술 도구 페이지)·`draft`(초안 보강)·`judge`(판정)는 Sonnet.
- 회차 안에서는 brief 한 번으로 상황을 보고, 큰 파일을 통째로 읽지 않는다.

1. 배차 잠금 `cal-wt/.dispatch-lock`(150분 넘으면 지움) — 배차 회차끼리 겹치지 않게.
2. 배차 전용 작업 폴더 `cal-wt/_dispatch` 를 origin/main 으로 맞추고 `node scripts/country/audit.mjs --fix`, 이번 조 4개국마다 `brief.mjs <code> --next`.
3. 4개 에이전트(`country-runner`, 모델은 2의 결과)를 한 메시지에 동시에 띄우고 끝날 때까지 기다린다.
4. 다시 `audit.mjs --fix` → 나라별 한 줄을 `cal-wt/dispatch-log.md` 에 덧붙이고 다음 조 번호를 쓴다.
5. 잠금을 풀고 끝.
