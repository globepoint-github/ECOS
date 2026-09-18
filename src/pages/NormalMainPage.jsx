import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { hasCpStarted } from '../utils/cpId'
import { withBase } from '../utils/withBase'
import { useAspectVariant } from '../utils/useAspectVariant'

// 화면 비율 구간별 배경 이미지. 각 이미지는 그 비율에 맞게 새로 그려진 것이라
// object-fit:cover로 꽉 채워도 인물/건물이 심하게 잘리지 않음.
const BG_BY_VARIANT = {
  narrow: withBase('/images/메인화면_narrow.png'),
  default: withBase('/images/메인화면 복사 1.png'),
  wide: withBase('/images/메인화면_wide.png'),
}

const NO_SESSION = { status: 'loading', userSn: null }

// isCodingParty/session은 코딩파티판(MainPage.jsx)에서만 넘어옴 — 일반판은 이 자동 이동
// 대상이 아니므로 기본값(undefined session)이면 아래 체크 로직이 그냥 조용히 스킵됨.
export default function NormalMainPage({ isCodingParty = false, session = NO_SESSION }) {
  const navigate = useNavigate()
  const manualRef = useRef(null)
  const startRef = useRef(null)
  const bgPictureRef = useRef(null)
  const variant = useAspectVariant(bgPictureRef)

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

  // 이솝 쪽 새로고침이 항상 이 랜딩 주소(/coding-party)로 떨어지는 구조라 —
  // 스테이지 화면에 있던 사용자가 새로고침하면 "스테이지에 있었다"는 걸 서버/URL로
  // 전달할 방법이 없어 인트로로 보이는 문제가 있었음.
  // 미션을 하나라도 "클리어"해야 진행 중으로 치는 게 아니라 START를 눌러 스테이지에
  // 한 번이라도 들어간 적이 있으면 바로 인정해야 하므로, 서버 진행도 조회 없이
  // 쿠키에 남겨둔 시작 플래그(markCpStarted, NormalStagePage.jsx)만 동기적으로 확인함.
  useEffect(() => {
    if (!isCodingParty) return
    if (session.status === 'loading') return

    if (hasCpStarted(session.status === 'SUCCESS')) {
      navigate('stage', { replace: true })
    }
  }, [isCodingParty, session.status, navigate])

  return (
    <div className="page">
      <div className="banner">
        <div className="bgPicture" ref={bgPictureRef}>
          <div className={`scene scene-${variant}`}>
            <img src={BG_BY_VARIANT[variant]} alt="" className="bgImage" />
            <img src={withBase('/images/메인화면_1 1.png')} alt="" className="planetLeft" />
            <img src={withBase('/images/메인화면_2 2.png')} alt="" className="planetRight" />
            <img src={withBase('/images/Group (4).png')} alt="에코스 섬의 비밀" className="titleImage" />
          </div>
        </div>

        <footer className="footer">
          <img src={withBase('/images/이솜로고.png')} alt="이솜 EBS 소프트웨어 x VRWARE" className="logo" />
          <div className="buttons">
            <a
              href={withBase('/docs/manual.pdf')}
              target="_blank"
              rel="noopener noreferrer"
              className="btnManual"
              ref={manualRef}
            >매뉴얼 다운로드</a>
            <button type="button" className="btnStart" ref={startRef} onClick={() => navigate('stage')}>START</button>
          </div>
        </footer>
      </div>
    </div>
  )
}
