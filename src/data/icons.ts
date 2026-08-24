/**
 * 썸네일용 단순 라인 아이콘 세트 (인라인 SVG, 네트워크 요청 0).
 *
 * 각 값은 viewBox="0 0 24 24" 안에 들어갈 내부 마크업이다. stroke는
 * currentColor를 쓰므로 썸네일이 색을 주입한다(fill 없음, 라인 위주).
 * 손으로 그린 기하 도형이라 이 사이트의 각진 SVG 톤과 맞는다.
 */
export const icons: Record<string, string> = {
  calculator: `<rect x="5" y="3" width="14" height="18" rx="2"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="12" x2="8" y2="12"/><line x1="12" y1="12" x2="12" y2="12"/><line x1="16" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="12" y1="16" x2="12" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/>`,
  percent: `<line x1="7" y1="17" x2="17" y2="7"/><circle cx="8" cy="8" r="1.6"/><circle cx="16" cy="16" r="1.6"/>`,
  receipt: `<path d="M6 3h12v18l-2.4-1.6L13.2 21 10.8 19.4 8.4 21 6 19.4z"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="15" y2="12"/>`,
  coins: `<ellipse cx="9" cy="8" rx="5" ry="2.6"/><path d="M4 8v4c0 1.4 2.2 2.6 5 2.6s5-1.2 5-2.6V8"/><ellipse cx="15" cy="15" rx="5" ry="2.6"/><path d="M10 15v3c0 1.4 2.2 2.6 5 2.6s5-1.2 5-2.6v-3"/>`,
  calendar: `<rect x="4" y="5" width="16" height="16" rx="2"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/><line x1="4" y1="10" x2="20" y2="10"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="12" y1="14" x2="12" y2="14"/><line x1="16" y1="14" x2="16" y2="14"/>`,
  document: `<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/><line x1="10" y1="12" x2="16" y2="12"/><line x1="10" y1="16" x2="16" y2="16"/>`,
  checklist: `<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 12l2.2 2.2L15 9.4"/>`,
  chart: `<line x1="4" y1="20" x2="20" y2="20"/><rect x="6" y="12" width="3" height="8"/><rect x="11" y="8" width="3" height="12"/><rect x="16" y="14" width="3" height="6"/>`,
  scale: `<line x1="12" y1="4" x2="12" y2="20"/><line x1="6" y1="8" x2="18" y2="8"/><path d="M6 8l-2.5 5h5z"/><path d="M18 8l-2.5 5h5z"/><line x1="9" y1="20" x2="15" y2="20"/>`,
  umbrella: `<path d="M12 4a8 8 0 0 1 8 8H4a8 8 0 0 1 8-8z"/><line x1="12" y1="4" x2="12" y2="4"/><line x1="12" y1="12" x2="12" y2="18"/><path d="M12 18a2.5 2.5 0 0 1-5 0"/>`,
  wallet: `<rect x="4" y="6" width="16" height="13" rx="2"/><path d="M4 9h13a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H4"/><circle cx="15.5" cy="12.5" r="1"/>`,
  briefcase: `<rect x="4" y="8" width="16" height="12" rx="2"/><path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><line x1="4" y1="13" x2="20" y2="13"/>`,
  refresh: `<path d="M19 12a7 7 0 1 1-2.5-5.4"/><path d="M19 4v3.5h-3.5"/>`,
};
