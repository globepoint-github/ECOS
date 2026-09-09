import { Routes, Route } from 'react-router-dom'
import NormalMainPage from './pages/NormalMainPage.jsx'
import NormalStagePage from './pages/NormalStagePage.jsx'
import NormalCertificatePage from './pages/NormalCertificatePage.jsx'
import { useUserSession } from './hooks/useUserSession.js'

// 2단계 분기: 일반판 내부 페이지 라우팅.
// 로그인 유저 정보(userSn 등)는 이 판 루트에서 한 번만 확인해서 필요한 페이지로 내려준다.
export default function NormalApp() {
  const session = useUserSession()

  return (
    <Routes>
      <Route path="/" element={<NormalMainPage />} />
      <Route path="/stage" element={<NormalStagePage session={session} />} />
      <Route path="/certificate/:certId" element={<NormalCertificatePage />} />
    </Routes>
  )
}
