import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/main.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* basename은 끝에 슬래시가 없어야 함 — "/eco/"로 두면 슬래시 없는 "/eco"로 들어왔을 때
        경로가 정확히 안 맞아서 라우터가 아무 페이지도 못 그리고 조용히 빈 화면만 나옴 (실제 확인됨) */}
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/+$/, '')}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
