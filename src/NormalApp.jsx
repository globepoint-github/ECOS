import { Routes, Route } from 'react-router-dom'
import NormalMainPage from './pages/NormalMainPage.jsx'
import NormalStagePage from './pages/NormalStagePage.jsx'
import NormalCertificatePage from './pages/NormalCertificatePage.jsx'

// 2단계 분기: 일반판 내부 페이지 라우팅.
// 로그인 유저/진행도 등의 상태를 이 판 루트가 소유하게 될 자리 (지금은 비어있음, 나중에 채움).
export default function NormalApp() {
  return (
    <Routes>
      <Route path="/" element={<NormalMainPage />} />
      <Route path="/stage" element={<NormalStagePage />} />
      <Route path="/certificate/:certId" element={<NormalCertificatePage />} />
    </Routes>
  )
}
