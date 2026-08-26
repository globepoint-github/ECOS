import { useParams } from 'react-router-dom'
import Certificate from '../components/Certificate.jsx'

// 인증서 id(1|2)별 이미지/이름칸 색상 매핑
const CERT_DATA = {
  1: { imageSrc: '/images/인증서/첫번째인증서.png', nameBgColor: '#d3ff82' },
  2: { imageSrc: '/images/인증서/두번째인증서.png', nameBgColor: '#d5c9ff' },
}

export default function NormalCertificatePage() {
  const { certId } = useParams()
  const cert = CERT_DATA[certId] || CERT_DATA['1']

  return (
    <div className="certPage">
      <Certificate imageSrc={cert.imageSrc} nameBgColor={cert.nameBgColor} />
    </div>
  )
}
