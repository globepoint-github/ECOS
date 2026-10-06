import { useParams } from 'react-router-dom'
import CodingPartyCertificate from '../components/CodingPartyCertificate.jsx'
import { withBase } from '../utils/withBase'
import { useUserSession } from '../hooks/useUserSession'

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
// 연령대(cpUserCode) 선택 팝업은 여기서 띄우지 않음 — 원래대로 게임 접속(스테이지 화면,
// NormalStagePage.jsx) 시점에 1회만 묻고, 인증서 발급 시에는 이미 저장된 값을 그대로 씀.
export default function CertificatePage() {
  const { certId } = useParams()
  const { status, userName } = useUserSession()
  const isLoggedIn = status === 'SUCCESS'
  const cert = CERT_DATA[certId] || CERT_DATA[1]

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
    </div>
  )
}
