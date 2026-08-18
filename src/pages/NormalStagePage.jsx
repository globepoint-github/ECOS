import { useState } from 'react'

const DEFAULT_ROCKET = '/images/제목 없음-3 2.png'

// 스테이지 1개당 필요한 에셋/위치 정보.
// lockUnlocked가 없는 스테이지(1번)는 자체 파일이 이미 "이용 가능" 색상이라 별도 상태가 없음.
const STAGE_DATA = {
  1: {
    lockDefault: '/images/잠금/Group 1000014022.png',
    lockActive: '/images/잠금해제/Group 1000014039.png',
    connKey: 'conn12',
    connDefault: '/images/기본 연결/Group 1000014010.png',
    connActive: '/images/해제 연결/Group 1000014008.png',
    rocketClass: 'rocket-at-1',
  },
  2: {
    lockDefault: '/images/잠금/Group 1000014023.png',
    lockUnlocked: '/images/잠금 해제 기본/Group 1000014012.png',
    lockActive: '/images/잠금해제/Group 1000014040.png',
    connKey: 'conn23',
    connDefault: '/images/기본 연결/Group 1000014010 (1).png',
    connActive: '/images/해제 연결/Group 1000014009.png',
    rocketClass: 'rocket-at-2',
  },
  3: {
    lockDefault: '/images/잠금/Group 1000014024.png',
    lockUnlocked: '/images/잠금 해제 기본/Group 1000014013.png',
    lockActive: '/images/잠금해제/Group 1000014041.png',
    connKey: 'conn34',
    connDefault: '/images/기본 연결/Group 1000014010 (4).png',
    connActive: '/images/해제 연결/Group 1000013987.png',
    rocketClass: 'rocket-at-3',
  },
  4: {
    lockDefault: '/images/잠금/Group 1000014025.png',
    lockUnlocked: '/images/잠금 해제 기본/Group 1000014014.png',
    lockActive: '/images/잠금해제/Group 1000014042.png',
    connKey: 'conn45',
    connDefault: '/images/기본 연결/Group 1000014010 (3).png',
    connActive: '/images/해제 연결/Group 1000013986.png',
    rocketClass: 'rocket-at-4',
  },
  5: {
    lockDefault: '/images/잠금/Group 1000014026.png',
    lockUnlocked: '/images/잠금 해제 기본/Group 1000014016.png',
    lockActive: '/images/잠금해제/Group 1000014043.png',
    connKey: 'conn56',
    connDefault: '/images/기본 연결/Group 1000014010 (5).png',
    connActive: '/images/해제 연결/Group 1000013988.png',
    rocketClass: 'rocket-at-5',
  },
  6: {
    lockDefault: '/images/잠금/Group 1000014021.png',
    lockUnlocked: '/images/잠금 해제 기본/Group 1000014020.png',
    lockActive: '/images/잠금해제/Group 1000014038.png',
    connKey: 'conn67',
    connDefault: '/images/기본 연결/Group 1000014010 (2).png',
    connActive: '/images/해제 연결/Group 1000013983.png',
    rocketClass: 'rocket-at-6',
  },
  7: {
    lockDefault: '/images/잠금/Group 1000014027.png',
    lockUnlocked: '/images/잠금 해제 기본/Group 1000014018.png',
    lockActive: '/images/잠금해제/Group 1000014044.png',
    rocketClass: 'rocket-at-7',
    rocketSrc: '/images/Group 1000014461.png',
  },
}

const STAGE_NUMBERS = [1, 2, 3, 4, 5, 6, 7]
const CONNECTOR_PAIRS = [
  ['conn-1-2', 1],
  ['conn-2-3', 2],
  ['conn-3-4', 3],
  ['conn-4-5', 4],
  ['conn-5-6', 5],
  ['conn-6-7', 6],
]

export default function NormalStagePage({ gamePath = '/game' }) {
  const [currentStage, setCurrentStage] = useState(null)
  const [unlocked, setUnlocked] = useState(() => new Set([1]))
  const [cert1Active, setCert1Active] = useState(false)
  const [cert2Active, setCert2Active] = useState(false)
  const [showLockedPopup, setShowLockedPopup] = useState(false)

  function handleStageClick(n) {
    if (!unlocked.has(n)) {
      setShowLockedPopup(true)
      return
    }
    activateStage(n)
    // 클릭 핸들러 안에서 바로 동기 호출 → 팝업 차단 안 걸림
    window.open(`${gamePath}/index.html?step=${n}`, '_blank')
  }

  function activateStage(n) {
    setCurrentStage(n)
    setUnlocked((prev) => {
      const next = new Set(prev)
      next.add(n)
      if (STAGE_DATA[n + 1]) next.add(n + 1)
      return next
    })
    if (n === 3) setCert1Active(true)
    if (n === 7) setCert2Active(true)
  }

  function lockSrcFor(n) {
    const s = STAGE_DATA[n]
    if (currentStage === n) return s.lockActive
    if (unlocked.has(n) && s.lockUnlocked) return s.lockUnlocked
    return s.lockDefault
  }

  const activeStageData = currentStage ? STAGE_DATA[currentStage] : null

  return (
    <div className="page">
      <div className="selectStage">
        <div className="selectScene">
          <img src="/images/image 2482.png" alt="" className="selectBg" />

          {CONNECTOR_PAIRS.map(([posClass, sourceStage]) => {
            const s = STAGE_DATA[sourceStage]
            const isActive = currentStage === sourceStage
            return (
              <img
                key={s.connKey}
                src={isActive ? s.connActive : s.connDefault}
                alt=""
                className={`connector ${posClass}${isActive ? ` active ${s.connKey}` : ''}`}
              />
            )
          })}

          {STAGE_NUMBERS.map((n) => (
            <img
              key={n}
              src={lockSrcFor(n)}
              alt={String(n)}
              className={`lockBubble bubble${n}${currentStage === n ? ` active lock${n}` : ''}`}
              onClick={() => handleStageClick(n)}
            />
          ))}

          {!currentStage && (
            <img src="/images/Group 1000014462.png" alt="" className="selectRocket" />
          )}

          {activeStageData && (
            <img
              src={activeStageData.rocketSrc || DEFAULT_ROCKET}
              alt=""
              className={`stageRocket active ${activeStageData.rocketClass}`}
            />
          )}

          <img src="/images/Manual download.png" alt="매뉴얼 다운로드" className="selectManualBtn" />
          <img
            src={cert1Active ? '/images/Group 1000014248 (1).png' : '/images/Group 1000014248.png'}
            alt="인증서 받기"
            className="certBtn cert1"
          />
          <img
            src={cert2Active ? '/images/Group 1000014249.png' : '/images/Group 1000014248.png'}
            alt="인증서 받기"
            className="certBtn cert2"
          />

          {showLockedPopup && (
            <div className="lockedPopupOverlay" onClick={() => setShowLockedPopup(false)}>
              <div className="lockedPopup" onClick={(e) => e.stopPropagation()}>
                <img src="/images/Group 1000014528.png" alt="이전 미션을 완료해주세요" className="lockedPopupImg" />
                <button type="button" className="lockedPopupClose" onClick={() => setShowLockedPopup(false)}>
                  <svg viewBox="0 0 24 24" width="100%" height="100%">
                    <line x1="2.5" y1="2.5" x2="21.5" y2="21.5" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
                    <line x1="21.5" y1="2.5" x2="2.5" y2="21.5" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
                  </svg>
                </button>
                <button type="button" className="lockedPopupBtn" onClick={() => setShowLockedPopup(false)}>닫기</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
