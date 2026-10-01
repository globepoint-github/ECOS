import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import CodingPartyCertificate from '../components/CodingPartyCertificate.jsx'
import { withBase } from '../utils/withBase'
import { useUserSession } from '../hooks/useUserSession'
import { saveCpUserInfo } from '../api/gameApi'
import { CP_SEASON, CP_YEAR } from '../api/config'
import { getOrCreateCpId, saveCpUserCodeToCookie } from '../utils/cpId'
import { hasSavedCpUserCode, markCpUserCodeSaved } from '../utils/cpUserCode'
import { CP_USER_CODES } from '../utils/cpUserCodes'

// 인증서 id(1|2)별 이미지 + 단계 이름(다운로드 파일명에 사용) — 2026 클릭온AI 시즌2 정식 이미지로 교체
const CERT_DATA = {
  1: {
    imageSrc: withBase('/images/인증서/2026_클릭온AI시즌2_에코스섬의비밀_기초.jpg'),
    stageLabel: '기초',
  },
  2: {
    imageSrc: withBase('/images/인증서/2026_클릭온AI시즌2_에코스섬의비밀_완성.jpg'),
    stageLabel: '완성',
  },
}

// 코딩파티판 인증서 페이지. 일반판(NormalCertificatePage)과 완전히 분리된 별도 구현.
//
// 연령대(cpUserCode) 선택 팝업은 예전엔 게임 접속(스테이지 화면 진입) 시점에 떴었는데,
// 요청에 따라 인증서 발급 시점으로 옮김(NormalStagePage.jsx에서 이 파일로 이동).
// 인증서가 1번/2번 두 개지만, cpid 기준으로 "이미 답했는지"를 저장해두기 때문에
// 어느 쪽을 먼저 열어서 한 번 답하면 다른 인증서를 열 때는 다시 안 뜸.
export default function CertificatePage() {
  const { certId } = useParams()
  const { status, userSn, userName } = useUserSession()
  const isLoggedIn = status === 'SUCCESS'
  const cert = CERT_DATA[certId] || CERT_DATA[1]

  const [cpId, setCpId] = useState(null)
  const [showCpUserCodePopup, setShowCpUserCodePopup] = useState(false)
  // 빈 값("선택")으로 시작 — select의 required가 실제로 동작하려면 빈 값에서 시작해야 함
  const [selectedCpUserCode, setSelectedCpUserCode] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    const id = getOrCreateCpId(isLoggedIn)
    setCpId(id)
    if (!hasSavedCpUserCode(id)) setShowCpUserCodePopup(true)
  }, [status, isLoggedIn])

  async function handleSubmitCpUserCode(e) {
    e.preventDefault()
    setShowCpUserCodePopup(false)
    if (!cpId) return
    // 쿠키에 cpUserCode를 같이 저장 — 다른 게임들처럼 cpid 쿠키 안에 cpUserCode까지
    // 들어있어야 유니티가 정상적으로 읽는 것으로 보여서(서버 API 저장과는 별개로) 추가
    saveCpUserCodeToCookie(isLoggedIn, selectedCpUserCode)
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

  return (
    <div className="cpCertPageOuter">
      <div className="cpCertPage">
        <CodingPartyCertificate
          imageSrc={cert.imageSrc}
          isLoggedIn={isLoggedIn}
          loginName={isLoggedIn ? userName || '' : ''}
          stageLabel={cert.stageLabel}
        />
      </div>

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
  )
}
