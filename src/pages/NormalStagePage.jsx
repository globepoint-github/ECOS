import { useCallback, useEffect, useState } from 'react'
import { getMissionList, saveCpUserInfo } from '../api/gameApi'
import { CP_SEASON, CP_YEAR } from '../api/config'
import { getOrCreateCpId } from '../utils/cpId'
import { hasSavedCpUserCode, markCpUserCodeSaved } from '../utils/cpUserCode'
import { withBase } from '../utils/withBase'

const DEFAULT_ROCKET = withBase('/images/제목 없음-3 2.png')
const CERT_POPUP_FEATURES = 'width=1050,height=700,noopener'

// 코딩파티 사용자 코드 (게임 시작 시 1회 선택)
const CP_USER_CODES = [
  { code: '001', label: '유아' },
  { code: '002', label: '초등 저학년(1~3학년)' },
  { code: '003', label: '초등 고학년(4~6학년)' },
  { code: '004', label: '중등' },
  { code: '005', label: '고등' },
  { code: '006', label: '성인' },
  { code: '007', label: '기타' },
]

// 스테이지 1개당 필요한 에셋/위치 정보.
// lockUnlocked가 없는 스테이지(1번)는 자체 파일이 이미 "이용 가능" 색상이라 별도 상태가 없음.
const STAGE_DATA = {
  1: {
    lockDefault: withBase('/images/잠금/Group 1000014022.png'),
    lockActive: withBase('/images/잠금해제/Group 1000014039.png'),
    connKey: 'conn12',
    connDefault: withBase('/images/기본 연결/Group 1000014010.png'),
    connActive: withBase('/images/해제 연결/Group 1000014008.png'),
    rocketClass: 'rocket-at-1',
  },
  2: {
    lockDefault: withBase('/images/잠금/Group 1000014023.png'),
    lockUnlocked: withBase('/images/잠금 해제 기본/Group 1000014012.png'),
    lockActive: withBase('/images/잠금해제/Group 1000014040.png'),
    connKey: 'conn23',
    connDefault: withBase('/images/기본 연결/Group 1000014010 (1).png'),
    connActive: withBase('/images/해제 연결/Group 1000014009.png'),
    rocketClass: 'rocket-at-2',
  },
  3: {
    lockDefault: withBase('/images/잠금/Group 1000014024.png'),
    lockUnlocked: withBase('/images/잠금 해제 기본/Group 1000014013.png'),
    lockActive: withBase('/images/잠금해제/Group 1000014041.png'),
    connKey: 'conn34',
    connDefault: withBase('/images/기본 연결/Group 1000014010 (4).png'),
    connActive: withBase('/images/해제 연결/Group 1000013987.png'),
    rocketClass: 'rocket-at-3',
  },
  4: {
    lockDefault: withBase('/images/잠금/Group 1000014025.png'),
    lockUnlocked: withBase('/images/잠금 해제 기본/Group 1000014014.png'),
    lockActive: withBase('/images/잠금해제/Group 1000014042.png'),
    connKey: 'conn45',
    connDefault: withBase('/images/기본 연결/Group 1000014010 (3).png'),
    connActive: withBase('/images/해제 연결/Group 1000013986.png'),
    rocketClass: 'rocket-at-4',
  },
  5: {
    lockDefault: withBase('/images/잠금/Group 1000014026.png'),
    lockUnlocked: withBase('/images/잠금 해제 기본/Group 1000014016.png'),
    lockActive: withBase('/images/잠금해제/Group 1000014043.png'),
    connKey: 'conn56',
    connDefault: withBase('/images/기본 연결/Group 1000014010 (5).png'),
    connActive: withBase('/images/해제 연결/Group 1000013988.png'),
    rocketClass: 'rocket-at-5',
  },
  6: {
    lockDefault: withBase('/images/잠금/수정 6 잠금.png'),
    lockUnlocked: withBase('/images/잠금 해제 기본/수정 6 잠금해제.png'),
    lockActive: withBase('/images/잠금해제/수정 6 선택.png'),
    connKey: 'conn67',
    connDefault: withBase('/images/기본 연결/Group 1000014010 (2).png'),
    connActive: withBase('/images/해제 연결/Group 1000013983.png'),
    rocketClass: 'rocket-at-6',
  },
  7: {
    lockDefault: withBase('/images/잠금/Group 1000014027.png'),
    lockUnlocked: withBase('/images/잠금 해제 기본/Group 1000014018.png'),
    lockActive: withBase('/images/잠금해제/Group 1000014044.png'),
    rocketClass: 'rocket-at-7',
    rocketSrc: withBase('/images/Group 1000014461.png'),
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

const NO_SESSION = { status: 'loading', userSn: null }

export default function NormalStagePage({ gamePath = withBase('/game'), session = NO_SESSION, isCodingParty = false }) {
  const [currentStage, setCurrentStage] = useState(null)
  const [unlocked, setUnlocked] = useState(() => new Set([1]))
  const [cert1Active, setCert1Active] = useState(false)
  const [cert2Active, setCert2Active] = useState(false)
  const [showLockedPopup, setShowLockedPopup] = useState(false)
  const [showCertLockedPopup, setShowCertLockedPopup] = useState(false)
  const [cpId, setCpId] = useState(null)
  const [showCpUserCodePopup, setShowCpUserCodePopup] = useState(false)
  const [selectedCpUserCode, setSelectedCpUserCode] = useState(CP_USER_CODES[0].code)

  const userSn = session?.userSn

  // cpId 쿠키는 일반/코딩파티 상관없이 항상 만들어야 함 — 유니티 게임이 모드와 무관하게
  // 무조건 cpEcoLoginUser/cpEcoNonLoginUser 쿠키에서 cpid를 읽으려고 시도하기 때문.
  // (사용자 코드 선택 팝업/저장은 코딩파티일 때만 진행)
  useEffect(() => {
    if (session.status === 'loading') return
    const id = getOrCreateCpId(session.status === 'SUCCESS')
    setCpId(id)
    if (isCodingParty && !hasSavedCpUserCode(id)) setShowCpUserCodePopup(true)
  }, [isCodingParty, session.status])

  // API에 보낼 사용자 식별 파라미터. 코딩파티는 cpId 기준(로그인 시 userSn도 같이),
  // 일반판은 userSn 필수. 필요한 값이 없으면 null → 서버 호출 대신 로컬 임시 진행으로 대체.
  // ※ 서버가 실제로 인식하는 파라미터 이름은 소문자 "cpid" — camelCase "cpId"로 보내면
  //   "요청 필수값이 누락되었습니다" 에러가 나는 것으로 확인됨
  function buildIdentityParams() {
    if (isCodingParty) {
      if (!cpId) return null
      return { cpid: cpId, cpYear: CP_YEAR, cpSeason: CP_SEASON, ...(userSn ? { userSn } : {}) }
    }
    return userSn ? { userSn } : null
  }

  // 서버에 저장된 미션 완료 목록(resultData)을 우리 화면 상태(잠금 해제/인증서 활성화)로 반영.
  // missionNumber = 우리 스테이지 번호(1~7). (missionStepNumber는 미션 안의 세부 단계라 항상 1로 찍힘 — 실측으로 확인됨)
  const applyMissionList = useCallback((resultData) => {
    const completedSteps = new Set((resultData || []).map((r) => r.missionNumber))
    if (!completedSteps.size) return

    setUnlocked((prev) => {
      const next = new Set(prev)
      completedSteps.forEach((step) => {
        next.add(step)
        if (STAGE_DATA[step + 1]) next.add(step + 1)
      })
      return next
    })
    setCurrentStage(Math.max(...completedSteps))
    if (completedSteps.has(3)) setCert1Active(true)
    if (completedSteps.has(7)) setCert2Active(true)
  }, [])

  const refreshProgress = useCallback(() => {
    const identity = buildIdentityParams()
    if (!identity) return
    getMissionList(identity)
      .then((data) => {
        if (data?.result) applyMissionList(data.resultData)
      })
      .catch(() => {
        // 서버 연동 안 되는 환경(로컬 등)에서는 조용히 무시하고 클라이언트 임시 진행 상태를 그대로 둠
      })
  }, [isCodingParty, userSn, cpId, applyMissionList])

  // 페이지 진입 시 한 번 서버 진행 상태를 불러옴
  useEffect(() => {
    refreshProgress()
  }, [refreshProgress])

  // 게임 새 탭을 닫고 이 창으로 다시 돌아왔을 때(focus) 최신 진행 상태를 다시 불러옴
  useEffect(() => {
    if (!buildIdentityParams()) return
    window.addEventListener('focus', refreshProgress)
    return () => window.removeEventListener('focus', refreshProgress)
  }, [isCodingParty, userSn, cpId, refreshProgress])

  async function handleSubmitCpUserCode() {
    setShowCpUserCodePopup(false)
    if (!cpId) return
    try {
      await saveCpUserInfo({
        cpid: cpId,
        cpYear: CP_YEAR,
        cpSeason: CP_SEASON,
        cpUserCode: selectedCpUserCode,
        ...(userSn ? { userSn } : {}),
      })
      markCpUserCodeSaved(cpId)
    } catch {
      // 서버 연동 안 되는 환경(로컬 등)에서는 조용히 무시
    }
  }

  function handleStageClick(n) {
    if (!unlocked.has(n)) {
      setShowLockedPopup(true)
      return
    }
    setCurrentStage(n)
    if (!buildIdentityParams()) {
      // 서버로 진행 상태를 주고받을 수 없는 상태(로그인 전, cpId 없음, 로컬 테스트 등)에서는
      // 예전처럼 클릭 즉시 다음 단계를 풀어줌. 그 외에는 게임 탭에서 돌아왔을 때 서버 조회로 갱신됨.
      activateStageLocally(n)
    }
    // 클릭 핸들러 안에서 바로 동기 호출 → 팝업 차단 안 걸림
    window.open(`${gamePath}/index.html?step=${n}`, '_blank')
  }

  function activateStageLocally(n) {
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
          <img src={withBase('/images/image 2482.png')} alt="" className="selectBg" />

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
            <img src={withBase('/images/Group 1000014462.png')} alt="" className="selectRocket" />
          )}

          {activeStageData && (
            <img
              src={activeStageData.rocketSrc || DEFAULT_ROCKET}
              alt=""
              className={`stageRocket active ${activeStageData.rocketClass}`}
            />
          )}

          <a
            href={withBase('/docs/%5B사용자 매뉴얼%5D 에코스 섬의 비밀.pdf')}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={withBase('/images/Manual download.png')} alt="매뉴얼 다운로드" className="selectManualBtn" />
          </a>
          <img
            src={cert1Active ? withBase('/images/Group 1000014248 (1).png') : withBase('/images/Group 1000014248.png')}
            alt="인증서 받기"
            className="certBtn cert1"
            onClick={() =>
              cert1Active
                ? window.open(withBase('/certificate/1'), '_blank', CERT_POPUP_FEATURES)
                : setShowCertLockedPopup(true)
            }
          />
          <img
            src={cert2Active ? withBase('/images/Group 1000014249.png') : withBase('/images/Group 1000014248.png')}
            alt="인증서 받기"
            className="certBtn cert2"
            onClick={() =>
              cert2Active
                ? window.open(withBase('/certificate/2'), '_blank', CERT_POPUP_FEATURES)
                : setShowCertLockedPopup(true)
            }
          />

          {showLockedPopup && (
            <div className="lockedPopupOverlay" onClick={() => setShowLockedPopup(false)}>
              <div className="lockedPopup" onClick={(e) => e.stopPropagation()}>
                <img src={withBase('/images/Group 1000014528.png')} alt="이전 미션을 완료해주세요" className="lockedPopupImg" />
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

          {showCertLockedPopup && (
            <div className="lockedPopupOverlay" onClick={() => setShowCertLockedPopup(false)}>
              <div className="lockedPopup certLockedPopup" onClick={(e) => e.stopPropagation()}>
                <img src={withBase('/images/인증서/인증서 팝업.png')} alt="인증서 받기 조건 안내" className="lockedPopupImg" />
                <button type="button" className="lockedPopupClose" onClick={() => setShowCertLockedPopup(false)}>
                  <svg viewBox="0 0 24 24" width="100%" height="100%">
                    <line x1="2.5" y1="2.5" x2="21.5" y2="21.5" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
                    <line x1="21.5" y1="2.5" x2="2.5" y2="21.5" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
                  </svg>
                </button>
                <button type="button" className="lockedPopupBtn" onClick={() => setShowCertLockedPopup(false)}>닫기</button>
              </div>
            </div>
          )}

          {showCpUserCodePopup && (
            <div className="cpUserCodeOverlay">
              <div className="cpUserCodePopup">
                <div className="cpUserCodeHeader">코딩파티 사용자 정보</div>
                <div className="cpUserCodeForm">
                  <div className="cpUserCodeRow">
                    <span className="cpUserCodeLabel">연령</span>
                    <select
                      className="cpUserCodeSelect"
                      value={selectedCpUserCode}
                      onChange={(e) => setSelectedCpUserCode(e.target.value)}
                    >
                      {CP_USER_CODES.map(({ code, label }) => (
                        <option key={code} value={code}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <button type="button" className="cpUserCodeStartBtn" onClick={handleSubmitCpUserCode}>
                    시작하기
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
