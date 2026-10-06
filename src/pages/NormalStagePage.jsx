import { useCallback, useEffect, useRef, useState } from 'react'
import { getMissionList, saveCpUserInfo } from '../api/gameApi'
import { CP_SEASON, CP_YEAR } from '../api/config'
import { getOrCreateCpId, hasCpUserCodeInCookie, markCpStarted, saveCpUserCodeToCookie } from '../utils/cpId'
import { CP_USER_CODES } from '../utils/cpUserCodes'
import { withBase } from '../utils/withBase'
import { useContainSize } from '../utils/useContainSize'

const DEFAULT_ROCKET = withBase('/images/제목 없음-3 2.png')
const CERT_POPUP_FEATURES = 'width=1050,height=700,noopener' // 일반판 가로형(1200x800) 인증서용
// 코딩파티 세로형(620x880) 인증서 + 카드 아래 저장/인쇄 버튼 줄(약 68px)까지 포함한 크기에
// 딱 맞춤(여백 최소화)
const CP_CERT_POPUP_FEATURES = 'width=624,height=952,noopener'

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
  // 빈 값("선택")으로 시작 — "선택" 상태로 그냥 제출되는 걸 막기 위해 첫 옵션을
  // 기본 선택값으로 미리 채워두지 않음(select의 required 속성이 실제로 동작하려면
  // 빈 값에서 시작해야 함)
  const [selectedCpUserCode, setSelectedCpUserCode] = useState('')
  // 로그인 사용자가 "인증서 받기"를 눌렀는데 아직 연령대를 안 골랐으면, 인증서 창을 바로
  // 열지 않고 이 값에 열려던 인증서 URL을 담아뒀다가 연령대 답변 직후에 엶
  const [pendingCertUrl, setPendingCertUrl] = useState(null)
  const selectStageRef = useRef(null)
  const { width: sceneWidth, height: sceneHeight } = useContainSize(selectStageRef, 1920 / 1080)

  const userSn = session?.userSn
  const isLoggedIn = session.status === 'SUCCESS'

  // cpId 쿠키는 일반/코딩파티 상관없이 항상 만들어야 함 — 유니티 게임이 모드와 무관하게
  // 무조건 cpEcoLoginUser/cpEcoNonLoginUser 쿠키에서 cpid를 읽으려고 시도하기 때문.
  // 연령대 선택 팝업 트리거 위치는 로그인 여부에 따라 다름:
  //   - 비로그인: 게임 접속(이 스테이지 화면 진입) 시점에 띄움 (원래 위치)
  //   - 로그인: 여기서는 안 띄우고, "인증서 받기" 버튼을 눌렀을 때 이 화면에 띄움
  //     (handleCertClick 참고)
  // 어느 쪽이든 cpid 쿠키에 cpUserCode가 이미 있으면(한 번 답하면) 다시 안 물어봄.
  useEffect(() => {
    if (session.status === 'loading') return
    const id = getOrCreateCpId(isLoggedIn)
    setCpId(id)
    // 이 스테이지 화면에 들어왔다는 것 자체를 쿠키에 남겨둠 — 랜딩 화면(NormalMainPage.jsx)이
    // 새로고침 후에도 "이미 시작한 사용자"를 바로 여기로 되돌려보내는 데 씀
    if (isCodingParty) markCpStarted(isLoggedIn)
    if (isCodingParty && !isLoggedIn && !hasCpUserCodeInCookie(false)) setShowCpUserCodePopup(true)
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
    // 로켓 위치는 "완료한 단계"가 아니라 "지금부터 진행할 다음 단계"에 표시 (기존 게임들 컨벤션)
    const highestCompleted = Math.max(...completedSteps)
    const nextStage = STAGE_DATA[highestCompleted + 1] ? highestCompleted + 1 : highestCompleted
    setCurrentStage(nextStage)
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

  async function handleSubmitCpUserCode(e) {
    e.preventDefault()
    setShowCpUserCodePopup(false)
    if (!cpId) return
    // 쿠키에 cpUserCode를 먼저 저장(서버 응답 기다리지 않고 즉시) — 이게 곧
    // "이미 답했는지" 판단 기준이라, 서버 저장이 나중에 실패해도 다시 안 물어봄
    saveCpUserCodeToCookie(isLoggedIn, selectedCpUserCode)
    // "인증서 받기" 클릭 때문에 뜬 팝업이었으면, 원래 열려던 인증서를 지금 바로 엶 —
    // await 뒤(비동기 완료 후)로 미루면 브라우저가 "사용자가 직접 눌러서 연 창"으로
    // 인정 안 하고 팝업 차단을 걸 수 있어서, 아직 동기 흐름인 여기서 먼저 처리함
    if (pendingCertUrl) {
      const { url, features } = pendingCertUrl
      setPendingCertUrl(null)
      window.open(url, '_blank', features)
    }
    try {
      await saveCpUserInfo({
        cpid: cpId,
        cpYear: CP_YEAR,
        cpSeason: CP_SEASON,
        cpUserCode: selectedCpUserCode,
        ...(userSn ? { userSn } : {}),
      })
    } catch {
      // 서버 연동 안 되는 환경(로컬 등)에서는 조용히 무시
    }
  }

  // 인증서 버튼 클릭 — 로그인 사용자가 아직 연령대를 안 골랐으면 인증서를 바로 열지 않고
  // 이 화면에 연령선택 팝업부터 띄움(답하면 그 직후 인증서가 열림). 그 외엔 바로 염.
  function handleCertClick(url, features) {
    if (isLoggedIn && !hasCpUserCodeInCookie(true)) {
      setPendingCertUrl({ url, features })
      setShowCpUserCodePopup(true)
      return
    }
    window.open(url, '_blank', features)
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
  // 인증서 주소도 코딩파티일 땐 /coding-party/certificate/... 로 열려야 함
  // (이 값이 없어서 코딩파티에서도 항상 일반판 인증서가 열리던 버그가 있었음)
  const certPathPrefix = isCodingParty ? '/coding-party' : ''
  const certPopupFeatures = isCodingParty ? CP_CERT_POPUP_FEATURES : CERT_POPUP_FEATURES

  return (
    <div className="page">
      <div className="selectStage" ref={selectStageRef}>
        <div className="selectScene" style={sceneWidth ? { width: sceneWidth, height: sceneHeight } : undefined}>
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
            href={withBase('/docs/manual.pdf')}
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
                ? handleCertClick(withBase(`${certPathPrefix}/certificate/1`), certPopupFeatures)
                : setShowCertLockedPopup(true)
            }
          />
          <img
            src={cert2Active ? withBase('/images/Group 1000014249.png') : withBase('/images/Group 1000014248.png')}
            alt="인증서 받기"
            className="certBtn cert2"
            onClick={() =>
              cert2Active
                ? handleCertClick(withBase(`${certPathPrefix}/certificate/2`), certPopupFeatures)
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
                <div className="cpUserCodeHeader">아래 정보를 입력해주세요</div>
                <form className="cpUserCodeForm" onSubmit={handleSubmitCpUserCode}>
                  <div className="cpUserCodeRow">
                    <span className="cpUserCodeLabel">연령</span>
                    <select
                      className="cpUserCodeSelect"
                      value={selectedCpUserCode}
                      required
                      onChange={(e) => setSelectedCpUserCode(e.target.value)}
                    >
                      <option value="">선택</option>
                      {CP_USER_CODES.map(({ code, label }) => (
                        <option key={code} value={code}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="cpUserCodeStartBtn">
                    시작하기
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
