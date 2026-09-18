import NormalMainPage from './NormalMainPage.jsx'

// 코딩파티판 메인 페이지 스텁. 전용 콘텐츠가 준비되면 이 안을 채우세요.
// session은 CodingPartyApp에서 내려받아, 이미 진행 중인 사용자를 자동으로
// 스테이지 화면으로 넘겨주는 데 씀(NormalMainPage.jsx의 isCodingParty 분기 참고).
export default function MainPage({ session }) {
  return <NormalMainPage isCodingParty session={session} />
}
