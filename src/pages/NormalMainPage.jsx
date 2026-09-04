import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export default function NormalMainPage() {
  const navigate = useNavigate()
  const manualRef = useRef(null)
  const startRef = useRef(null)

  useEffect(() => {
    function syncStartButtonWidth() {
      if (manualRef.current && startRef.current) {
        startRef.current.style.width = manualRef.current.offsetWidth + 'px'
      }
    }
    syncStartButtonWidth()
    window.addEventListener('resize', syncStartButtonWidth)
    return () => window.removeEventListener('resize', syncStartButtonWidth)
  }, [])

  return (
    <div className="page">
      <div className="banner">
        <div className="bgPicture">
          <div className="scene">
            <img src="/images/메인화면 복사 1.png" alt="" className="bgImage" />
            <img src="/images/메인화면_1 1.png" alt="" className="planetLeft" />
            <img src="/images/메인화면_2 2.png" alt="" className="planetRight" />
            <img src="/images/Group (4).png" alt="에코스 섬의 비밀" className="titleImage" />
          </div>
        </div>

        <footer className="footer">
          <img src="/images/이솜로고.png" alt="이솜 EBS 소프트웨어 x VRWARE" className="logo" />
          <div className="buttons">
            <a
              href="/docs/%5B사용자 매뉴얼%5D 에코스 섬의 비밀.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="btnManual"
              ref={manualRef}
            >매뉴얼 다운로드</a>
            <button type="button" className="btnStart" ref={startRef} onClick={() => navigate('/stage')}>START</button>
          </div>
        </footer>
      </div>
    </div>
  )
}
