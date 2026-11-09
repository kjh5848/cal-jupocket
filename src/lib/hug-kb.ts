/**
 * HUG 전세 대화(AI 상담)가 보는 자료 — 이 목록 밖의 내용은 답하지 않는다(2026-11-08).
 *
 * 뜻은 docs/research/2026-11-07-hug-jeonse.md 에서 HUG·주택도시기금·법령 원문으로 확인한 것만 옮겼고,
 * 숫자는 전부 src/rates/hug-jeonse-2026.json 에서 꺼낸다 — 여기에 손으로 숫자를 적지 않는다.
 * 서버(workers/api/src/hug-chat.ts)는 모델 답에 이 자료·질문에 없는 숫자가 있으면 답을 버린다.
 */
import r from "../rates/hug-jeonse-2026.json";

const G = r.guarantee;
const D = r.deadlines;
const S = r.sources;
const P = r.premium;
const L = r.loanGuaranteeLimit;
const B = r.beotimmok;

/** 1억 단위면 "7억원", 천만 단위면 "1억 2천만원" */
export function eok(n: number): string {
  const e = Math.floor(n / 1e8);
  const man = Math.round((n % 1e8) / 1e4);
  const manTxt = man ? (man % 1000 === 0 ? `${man / 1000}천만원` : `${man.toLocaleString("ko-KR")}만원`) : "";
  if (!e) return manTxt || "0원";
  return manTxt ? `${e}억 ${manTxt}` : `${e}억원`;
}

export interface KbItem {
  id: string;
  title: string;
  text: string;
  src: string;
  /** 출처 링크에 보일 이름 */
  srcName: string;
}

const HUG_RG = "HUG 전세반환보증 안내";
const HUG_RG_DOCS = "HUG 전세반환보증 이용절차";
const HUG_SAFE = "HUG 전세안심보증 안내";
const FUND = "주택도시기금 버팀목 안내";
const FUND_STEPS = "주택도시기금 버팀목 이용절차";
const ACC = "HUG 보증사고 이행청구 안내";
const ACC_STEPS = "HUG 보증 이행절차";
const REG = "HUG 안심전세포털";
const LAW1 = "주택임대차보호법";
const LAW2 = "부동산 거래신고 등에 관한 법률";

export const KB: KbItem[] = [
  { id: "intro", title: "처음이라면 — 전세보증보험이 뭐예요", text: `전세는 큰돈(보증금)을 집주인에게 맡기고 사는 계약이라, 계약이 끝났을 때 집주인이 돈을 돌려주지 못하면 세입자가 곤란해진다. 전세보증금반환보증(흔히 '전세보증보험')은 그때 HUG(주택도시보증공사)가 집주인 대신 보증금을 돌려주는 보증이다. 세입자가 보증료를 내고 직접 가입한다. 흐름: 계약 전에 집(등기부·집값) 확인 → 계약 → 잔금 내고 전입신고·확정일자 → 보증 가입 → 계약이 끝나면 보증금 돌려받기. 못 돌려받으면 HUG에 대신 달라고 청구한다.`, src: S.returnGuarantee, srcName: HUG_RG },
  { id: "products", title: "HUG 전세 보증 두 가지", text: `전세보증금반환보증(전세반환보증)은 계약이 끝났는데 집주인이 보증금을 못 돌려주면 HUG가 세입자에게 대신 돌려주는 보증이다. 개인·법인·외국인 세입자가 가입할 수 있다. 전세안심보증(주택도시기금 페이지 표기 "전세금안심대출보증")은 세입자에게 보증금 반환 + 은행에 전세대출 원리금 상환을 함께 보증한다. 만 19세 이상 세입자가 주채무자이고, 집주인이 법인이면 가입할 수 없다.`, src: S.returnGuarantee, srcName: HUG_RG },
  { id: "house-types", title: "가입 가능한 집", text: "단독·다가구·다중주택, 연립·다세대(빌라), 주거용 오피스텔, 아파트가 대상이다(반환보증은 분양형 노인복지주택도 포함). 근린생활시설은 안 된다. 건물과 토지가 모두 집주인 소유여야 하고, 아파트가 아니면 위반건축물이 아니어야 한다.", src: S.returnGuarantee, srcName: HUG_RG },
  { id: "deposit-cap", title: "보증금 상한", text: `보증금이 수도권 ${eok(G.depositCap.capital)}, 그 외 지역 ${eok(G.depositCap.other)} 이하여야 한다. 월세가 있으면 전월세전환율 ${G.rentConversionPct}%로 보증금에 환산한다(2026년 7월 1일 이후 신청분).`, src: S.returnGuarantee, srcName: HUG_RG },
  { id: "ltv", title: "가입 조건 — 90%·60% 기준", text: `(보증금 + 선순위채권)이 주택가격의 ${G.ltvLimitPct}% 이하여야 한다. 선순위채권은 주택가격의 ${G.seniorLimitPct}% 이하여야 한다(단독·다중·다가구는 선순위 + 나보다 앞선 다른 세입자 보증금이 ${G.seniorLimitMultiFamilyPct}% 이하). 보증한도 = 주택가격 × ${G.ltvLimitPct}% − 선순위채권. 선순위채권의 대표는 등기부 을구 근저당의 채권최고액이다.`, src: S.returnGuarantee, srcName: HUG_RG },
  { id: "house-price", title: "HUG가 보는 주택가격", text: `감정평가서(${G.appraisalValidMonths}개월 이내)가 있으면 그것이 먼저다. 그다음 아파트는 KB·부동산테크 시세, 없으면 공시가격 × ${G.publicPriceMultiplierPct}%. 오피스텔은 KB 하위평균가, 없으면 기준시가 × ${G.publicPriceMultiplierPct}%. 연립·다세대는 공동주택가격 × ${G.publicPriceMultiplierPct}%, 단독·다가구는 개별단독주택가격 × ${G.publicPriceMultiplierPct}%. 공시가격은 부동산공시가격알리미(realtyprice.kr)에서 찾는다.`, src: S.returnGuarantee, srcName: HUG_RG },
  { id: "other-conditions", title: "그 밖의 가입 조건", text: `계약기간 ${G.minTermYears}년 이상, 공인중개사가 날인한 계약서, 전입신고 + 확정일자(또는 임대차 신고)가 필요하다. 등기부 갑구에 경매신청·압류·가압류·가처분·가등기가 없어야 한다. 반환채권 양도금지 특약이 없어야 하고, 질권 설정·채권양도 통지된 전세대출이 없어야 한다(SGI 보증부 대출은 예외). 단독·다가구가 아니면 전입세대확인서에 다른 세대가 없어야 한다.`, src: S.returnGuarantee, srcName: HUG_RG },
  { id: "premium", title: "보증료 — 세입자가 내는 돈", text: `보증료는 세입자가 내고, 보증료를 내야 보증서가 나온다. 보증료 = 보증금 × 연 보증료율 × 계약일수/365. 연 보증료율은 ${G.premiumRateRangePct.min}~${G.premiumRateRangePct.max}%이고 세 가지로 정해진다: 보증금 구간(${P.rateTable.bandMaxWon.map(eok).join("·")} 기준), 아파트인지 아닌지(오피스텔·빌라·단독은 아파트가 아닌 쪽), 빚 비율(부채비율 = (집에 먼저 잡힌 빚 + 보증금) ÷ 집값의 ${G.ltvLimitPct}%, ${P.rateTable.debtRatioBandsPct.join("%·")}% 기준 — 높을수록 비싸다). 정확한 금액은 집 종류·지역·보증금·집값·근저당을 알려 주면 JU포켓 계산으로 구한다. 집에 먼저 잡힌 빚(선순위채권)이 집값 ${G.ltvLimitPct}% 선의 ${P.surchargeSeniorShareOfLtvPct}%를 넘으면 ${P.surchargePct}% 더 낸다(할증). 할인은 하나만 받는다: 연소득(배우자 포함) ${eok(P.lowIncomeMax)} 이하 ${P.discountPct.lowIncome}%, 신혼부부(혼인 ${P.newlywedMarriedYearsMax}년 이내, 합산 연소득 ${eok(P.newlywedIncomeMax)} 이하) ${P.discountPct.newlywed}%, 미성년 자녀 ${P.multiChildMin}명 이상 ${P.discountPct.multiChild}%, 만 ${P.elderlyAge}세 이상 ${P.discountPct.elderly}%, 한부모가족 ${P.discountPct.singleParent}%. 따로 전자계약으로 계약하면 ${P.discountPct.eContract}% 할인. 보증료는 연말정산 세액공제를 받을 수 있다(보증금 ${eok(P.taxCreditDepositMax)} 이내).`, src: S.returnGuarantee, srcName: HUG_RG },
  { id: "costs", title: "세입자가 부담하는 돈 정리", text: `① 전세반환보증 보증료(위 '보증료' 항목). ② 전세안심보증이면 여기에 대출보증 보증료를 더 낸다: 대출금 × 연 ${P.loanPartRatePct}% × 기간. ③ 버팀목 전세대출을 받으면 대출 이자(연 ${B.ratePctMin}~${B.ratePctMax}%, 정확한 금리는 은행이 정한다). ④ 미리 낸 계약금: 사전한도심사와 버팀목 모두 보증금의 ${B.downPaymentPct}% 이상을 계약금으로 낸 상태여야 한다. 중개보수·서류 발급 수수료·이사비는 JU포켓이 확인한 자료에 없다.`, src: S.loanGuarantee, srcName: HUG_SAFE },
  { id: "deadline-return", title: "전세반환보증 신청 기한", text: `신규 계약은 잔금일과 전입일 중 늦은 날부터 계약기간의 절반이 지나기 전까지 신청한다. 갱신 계약은 갱신 기간의 절반이 지나기 전까지. 사전한도심사는 계약일부터 계약 시작 ${D.preLimitReviewDaysBefore}일 전까지 안심전세앱에서 한다(아파트·오피스텔·연립·다세대).`, src: S.returnGuarantee, srcName: HUG_RG },
  { id: "deadline-safe", title: "전세안심보증·버팀목 신청 기한", text: `전세안심보증과 버팀목 대출은 잔금일과 전입일 중 빠른 날부터 ${D.loanGuaranteeMonths}개월 안에 신청한다. 갱신이면 갱신 계약일부터 ${D.loanGuaranteeMonths}개월.`, src: S.loanGuarantee, srcName: HUG_SAFE },
  { id: "safe-limit", title: "전세안심보증 대출보증 한도", text: `대출보증 한도는 다음 중 가장 작은 값에 보증비율을 곱한다: 보증금의 ${L.depositSharePct}%(신혼·청년 ${L.depositShareYouthNewlywedPct}%), 수도권 ${eok(L.capCapital)}·그 외 ${eok(L.capOther)}(1주택자 ${eok(L.capOneHouse)}, 신혼·청년 수도권 ${eok(L.capYouthNewlywedCapital)}·그 외 ${eok(L.capYouthNewlywedOther)}), 이자가 인정소득의 ${L.interestIncomePct}% 이하가 되는 금액. 보증비율은 수도권·규제지역 ${L.ratioCapitalRegulatedPct}%, 그 외 ${L.ratioOtherPct}%. 2주택자는 안 된다.`, src: S.loanGuarantee, srcName: HUG_SAFE },
  { id: "docs", title: "가입 서류", text: `신청일 기준 ${r.docsValidMonths}개월 이내 발급한 서류: 신분증, 확정일자 받은 계약서(또는 임대차신고필증), 보증금 지급 증빙, 등기사항전부증명서(단독·다가구는 건물·토지 둘 다), 주민등록등본, 전입세대확인서(주민센터 방문 발급), 건축물대장(아파트 제외). 단독·다가구는 다른 전월세 계약 확인서·확정일자 부여현황, 오피스텔은 중개대상물 확인·설명서가 더 필요하다.`, src: S.returnGuaranteeDocs, srcName: HUG_RG_DOCS },
  { id: "where", title: "어디서 신청하나", text: "HUG 지사, 위탁은행(신한·국민·우리·광주·하나·기업·농협·경남·수협·iM뱅크·부산), 네이버페이·카카오페이·토스, 안심전세앱에서 신청한다.", src: S.returnGuaranteeDocs, srcName: HUG_RG_DOCS },
  { id: "beotimmok-who", title: "버팀목 전세대출 — 누가 받나", text: `무주택 세대주, 보증금의 ${B.downPaymentPct}% 이상을 낸 사람. 부부합산 연소득 ${eok(B.incomeMax)} 이하(2자녀 이상 ${eok(B.incomeMaxTwoKids)}, 신혼 ${eok(B.incomeMaxNewlywed)}), 순자산 ${eok(B.netAssetMax)} 이하. 전용면적 ${B.areaMaxM2}㎡ 이하, 보증금 수도권 ${eok(B.depositMaxCapital)}·그 외 ${eok(B.depositMaxOther)} 이하(신혼·2자녀 ${eok(B.depositMaxNewlywedCapital)}/${eok(B.depositMaxNewlywedOther)}).`, src: S.beotimmok, srcName: FUND },
  { id: "beotimmok-limit", title: "버팀목 한도·금리", text: `한도는 수도권 ${eok(B.limitCapital)}·그 외 ${eok(B.limitOther)}(신혼·2자녀 ${eok(B.limitNewlywedCapital)}/${eok(B.limitNewlywedOther)}), 그리고 보증금의 ${B.limitSharePct}%(신혼·2자녀 ${B.limitShareNewlywedPct}%) 이내. 금리는 연 ${B.ratePctMin}~${B.ratePctMax}%. 정확한 금리는 소득·보증금·우대 조건으로 정해지므로 은행에서 확인한다.`, src: S.beotimmok, srcName: FUND },
  { id: "beotimmok-steps", title: "버팀목 신청 순서", text: "버팀목 대출의 담보는 HF 전세대출보증, HUG 전세금안심대출보증, 채권양도 중 고른다. 보증은 대출과 별도로 기한 안에 신청한다. 흐름: 조건 확인 → 기금e든든(enhuf.molit.go.kr) 또는 은행에 신청 → HUG 자산심사(문자 안내) → 은행 서류·심사 → 승인·실행. 취급은행은 은행에 확인한다.", src: S.beotimmokSteps, srcName: FUND_STEPS },
  { id: "registry", title: "등기부에서 볼 것", text: `표제부: 주소가 계약서와 같은지, 용도(근린생활시설인지), 면적. 갑구: 맨 아래 소유자가 계약 상대인지, 압류·가압류·경매개시·신탁·가처분·가등기가 있는지. 을구: 근저당 채권최고액(보통 빌린 돈의 ${r.registry.maxClaimTypicalPct}%로 잡는다고 HUG 안심전세포털이 안내), 임차권등기, 전세권. '말소사항 포함'으로 떼면 이력이 보인다. 미납 세금은 등기부에 안 나오므로 집주인에게 납세증명서를 요청한다(집주인은 보여 줄 의무가 있다).`, src: S.registryCheck, srcName: REG },
  { id: "rights", title: "대항력·우선변제권", text: "집에 들어가 살면서(인도) 전입신고를 하면 다음 날부터 대항력이 생긴다. 여기에 계약서 확정일자까지 받으면 우선변제권이 생긴다(경매·공매 때 뒤 순위 권리자보다 먼저 보증금을 받는다). 임대차 신고를 할 때 계약서를 함께 내면 확정일자를 받은 것으로 본다(부동산 거래신고 등에 관한 법률 제6조의5). 잔금일에 등기부를 한 번 더 떼 본다.", src: S.leaseProtectionAct, srcName: LAW1 },
  { id: "lease-report", title: "임대차 신고", text: `대통령령으로 정한 금액을 넘는 전월세 계약은 계약일부터 ${D.leaseReportDays}일 안에 집주인과 세입자가 함께 신고한다(한쪽이 거부하면 혼자 할 수 있다). 세입자가 전입신고를 하면 임대차 신고를 한 것으로 본다.`, src: S.leaseReportAct, srcName: LAW2 },
  { id: "renewal", title: "만료 전 갱신·이사 통보", text: `만료 ${D.renewalNoticeFromMonths}개월 전부터 ${D.renewalNoticeToMonths}개월 전까지 갱신을 요구하거나(세입자 1회, 2년) 갱신하지 않겠다고 알린다. 세입자가 만료 ${D.renewalNoticeToMonths}개월 전까지 아무 말도 안 하면 같은 조건으로 묵시적 갱신이 된다. 묵시적 갱신이면 2년 다시 계약한 것으로 보지만, 세입자는 언제든 해지를 알릴 수 있고 집주인이 통지를 받은 날부터 ${D.terminationEffectMonths}개월이 지나면 효력이 생긴다. 갱신요구권은 집주인(직계가족 포함)이 직접 살려는 경우 등 법에 정한 사유가 있으면 거절될 수 있다. HUG에 보증금을 청구하려면 기한 안에 갱신거절을 알렸다는 증빙이 필요하다(문자·카톡은 집주인 답장이 있어야 하고, 내용증명은 도달 증빙).`, src: S.leaseProtectionAct, srcName: LAW1 },
  { id: "accident", title: "보증금을 못 받았을 때(보증사고)", text: `보증사고는 두 가지다. ① 계약이 끝나거나 해지된 뒤 ${D.accidentAfterMonths}개월까지 정당한 사유 없이 보증금을 못 받은 경우 — 임차권등기명령을 마친 뒤 HUG에 이행청구한다(결정문으로 청구할 수 있지만 지급 전에 등기가 끝나야 한다). ② 계약 기간 중 집이 경매·공매되어 배당 후에도 보증금을 못 받은 경우 — 배당표 등 못 받은 금액을 증명하는 서류로 청구한다. HUG 담당자 확인 전에 전출하면 거절될 수 있다. 절차: 사고통지 → 이행청구 → 심사 → 이행청구일부터 1개월 이내 대위변제. 집을 비워 줘야(명도) 돈을 받는다.`, src: S.accidentClaim, srcName: ACC },
  { id: "accident-steps", title: "이행청구 서류·절차", text: "보증사고 뒤 이행청구에 필요한 서류와 절차는 HUG 보증사고 안내 페이지에 정리돼 있다. 핵심은 임차권등기, 갱신거절 통지 증빙, 전출 전에 담당자 확인이다.", src: S.accidentSteps, srcName: ACC_STEPS },
  { id: "contact-record", title: "집주인과 연락할 때 기록 남기기", text: "중요한 말(날짜·금액·갱신 여부)은 문자·카톡으로 보내고 집주인 답장을 받아 둔다(HUG는 문자·카톡 증빙에 집주인 답장이 있어야 한다고 안내). 답장이 없으면 내용증명으로 보내 도달 기록을 남긴다. 통화·만남은 녹음해도 된다: 통신비밀보호법 제3조는 '공개되지 아니한 타인 간의 대화'를 녹음하지 못하게 하고, 대법원(2006도4981)은 대화에 참여한 사람이 녹음하는 것은 이 조항 위반이 아니라고 판단했다. 내가 빠진 다른 사람들끼리의 대화를 녹음하면 안 된다. 녹음 뒤 핵심을 문자로 다시 보내 확인받는다. 계약금·잔금은 계좌이체로 보낸다(보증금 지급 증빙).", src: S.recordingPrecedent, srcName: "대법원 2006도4981 판결" },
  { id: "house-find", title: "집 찾는 법(HUG 전세사기예방센터)", text: "보러 다니기 전에 기준을 글로 써 둔다(크기·형태, 시간대별 통근 시간, 소음·밤길, 노후도, 포기할 것과 못 버릴 것의 순서). 예산은 한 달 주거비(월세·대출 이자·관리비·공과금·교통비)로 보고 상한을 정한다. 전세대출을 받을 거면 대출 상품을 먼저 알아보고 대출이 되는 집을 찾는다. 부동산 앱은 시세 확인용으로만 쓰고 실제 집은 그 매물을 맡은 중개사무소에서 확인한다. 중개사무소에 '전세보증금반환보증에 가입되는 집'을 보여 달라고 말한다. 공공임대는 마이홈(myhome.go.kr)·LH 청약(apply.lh.or.kr)에서 본다.", src: S.houseSearch, srcName: "HUG 전세사기예방센터" },
  { id: "house-visit", title: "집 보러 갈 때 확인할 것(HUG 전세사기예방센터)", text: `사진·메모 준비, 가능하면 동행(한 명은 설명 메모, 한 명은 점검), 동·호수 기록. 맑은 날 낮 채광, 수압·배수·역류, 벽·천장·장판의 누수·결로·곰팡이, 방음(벽 두드려 보기), 냉난방·이중창, 환기·배수구 냄새, 도어락·CCTV·방범창·가스 배관 방범 덮개, 콘센트·가스 호스, 소방시설, 최저주거기준(${r.houseHunting.minHousingAreaM2}㎡) 이하인지, 건축물대장(정부24)으로 위반건축물인지 확인.`, src: S.houseCheck, srcName: "HUG 전세사기예방센터" },
  { id: "house-market", title: "집 가격이 적당한지(HUG 전세사기예방센터)", text: `보증금이 매매 시세의 ${r.houseHunting.avoidDepositOverPricePct}%를 넘으면 피하는 게 좋다(깡통전세 — 집값이 내려가면 보증금을 돌려받기 어려울 수 있다). 매매 시세는 국토교통부 실거래가 공개시스템, KB시세, 부동산테크, 부동산공시가격알리미, 등기부의 매매가로 확인한다. 같은 건물·같은 동네 비슷한 집의 전월세와도 비교한다.`, src: S.housePrice, srcName: "HUG 전세사기예방센터" },
];

/** 모델에게 주는 자료 덩어리 */
export function kbPrompt(): string {
  return KB.map((k) => `[${k.id}] ${k.title}\n${k.text}`).join("\n\n");
}

/** 자료 전체에 나오는 숫자(쉼표·단위 뗀 덩어리) — 답 검사용 */
export function numbersIn(text: string): string[] {
  return (text.replace(/(\d),(?=\d{3})/g, "$1").match(/\d+(?:\.\d+)?/g) ?? []).map((n) => String(Number(n)));
}
