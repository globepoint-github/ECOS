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
// 연령대(cpUserCode) 선택 팝업은 여기서 띄우지 않음:
//   - 비로그인: 스테이지 화면(게임 접속 시점)에서 띄움
//   - 로그인: 스테이지 화면에서 "인증서 받기" 버튼 클릭 시 그 화면에서 띄우고,
//     답변 직후에 이 인증서 창이 열림 (NormalStagePage.jsx의 handleCertClick 참고)
// 즉 이 페이지가 열렸다는 것 자체가 이미 연령대 선택이 끝났다는 뜻이라, 그냥 발급만 하면 됨.
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
