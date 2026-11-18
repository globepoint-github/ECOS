import { useParams } from 'react-router-dom'
import Certificate from '../components/Certificate.jsx'
import { withBase } from '../utils/withBase'
import { useUserSession } from '../hooks/useUserSession.js'

// 인증서 id(1|2)별 이미지 매핑
const CERT_DATA = {
  1: { imageSrc: withBase('/images/인증서/첫번째인증서.png') },
  2: { imageSrc: withBase('/images/인증서/두번째인증서.png') },
}

// 인증서는 새 탭(window.open)으로 열려서 React 상태를 그대로 못 받고 이 페이지가
// 새로 마운트됨 — 그래서 로그인 사용자 이름도 여기서 다시 getUserSession.do로 조회함.
// (이 페이지에 도달한다는 것 자체가 로그인판 플로우를 거쳐왔다는 뜻이라 항상 로그인 상태)
export default function NormalCertificatePage() {
  const { certId } = useParams()
  const cert = CERT_DATA[certId] || CERT_DATA['1']
  const session = useUserSession()

  if (session.status === 'loading') {
    return <div className="certPage" />
  }

  return (
    <div className="certPage">
      <Certificate imageSrc={cert.imageSrc} name={session.userName || ''} />
    </div>
  )
}
