import { Routes, Route } from 'react-router-dom'
import NormalApp from './NormalApp.jsx'
import CodingPartyApp from './CodingPartyApp.jsx'

// 1단계 분기: URL 경로만으로 "판"을 완전히 분리한다.
// 로그인 상태나 API 응답이 아니라 순수 경로 기준.
export default function App() {
  return (
    <Routes>
      <Route path="/coding-party/*" element={<CodingPartyApp />} />
      <Route path="/*" element={<NormalApp />} />
    </Routes>
  )
}
