import { Routes, Route } from 'react-router-dom'
import MainPage from './pages/MainPage.jsx'
import StagePage from './pages/StagePage.jsx'
import CertificatePage from './pages/CertificatePage.jsx'

// 2단계 분기: 코딩파티(이벤트)판 내부 페이지 라우팅.
// 지금은 콘텐츠가 없어서 Normal판과 동일한 화면을 보여주는 스텁 상태.
// 코딩파티 전용 에셋/텍스트가 준비되면 MainPage.jsx / StagePage.jsx 내부만 채우면 됨.
export default function CodingPartyApp() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/stage" element={<StagePage />} />
      <Route path="/certificate/:certId" element={<CertificatePage />} />
    </Routes>
  )
}
