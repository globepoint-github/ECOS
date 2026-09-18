import CodingPartyCertificate from '../components/CodingPartyCertificate.jsx'
import { withBase } from '../utils/withBase'
import { useUserSession } from '../hooks/useUserSession'

// 코딩파티판 인증서 페이지. 일반판(NormalCertificatePage)과 완전히 분리된 별도 구현.
// 1단계/2단계 둘 다 지금은 같은 이미지 사용 (시즌별로 내용만 바뀐 버전이 추후 따로 들어올 예정).
export default function CertificatePage() {
  const { status, userName } = useUserSession()
  const isLoggedIn = status === 'SUCCESS'

  return (
    <div className="cpCertPageOuter">
      <div className="cpCertPage">
        <CodingPartyCertificate
          imageSrc={withBase('/images/인증서/코딩파티인증서.jpg')}
          isLoggedIn={isLoggedIn}
          loginName={isLoggedIn ? userName || '' : ''}
        />
      </div>
    </div>
  )
}
