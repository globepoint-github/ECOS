import { useEffect, useState } from 'react'
import { withBase } from '../utils/withBase'

// 코딩파티 인증서 전용 컴포넌트 (일반판 Certificate.jsx와 완전히 분리 — 일반판에 영향 없음)
// 세로형(620x880) 이미지 기준. 기관/이름 입력칸은 좌표 미정이라 추후 추가 예정.
const CANVAS_W = 620
const CANVAS_H = 880

// ※ 정확한 좌표 아직 안 받아서 이미지 보고 대략 잡은 위치 — 실제로 보고 조정 필요
const DATE_POS = { x: CANVAS_W / 2, y: 704 } // 80% of 880
const DATE_FONT_SIZE = 15

// 소속기관/이름 입력칸 — 타이틀과 본문 사이 빈 줄 위치, 마찬가지로 좌표 미정이라 추후 조정 필요
const INFO_Y = 428 // ~48.6% of 880
const INSTITUTION_CENTER_X = 203 // 소속기관 입력칸 중앙 정렬: (9.7% + 46%/2) of 620
const NAME_X = 400 // ~64.5% of 620
const INFO_FONT_SIZE = 16

function todayKorean() {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}년 ${mm}월 ${dd}일`
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function renderCertificateDataUrl(imageSrc, { institution, name }) {
  const bg = await loadImage(imageSrc)
  try {
    await document.fonts.load(`800 ${DATE_FONT_SIZE}px Oagothic`)
    await document.fonts.load(`800 ${INFO_FONT_SIZE}px Oagothic`)
  } catch {
    // 폰트 로드 실패해도 폴백 폰트로 계속 진행
  }

  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_W
  canvas.height = CANVAS_H
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bg, 0, 0, CANVAS_W, CANVAS_H)

  ctx.fillStyle = '#000000'
  ctx.font = `800 ${DATE_FONT_SIZE}px Oagothic, "Noto Sans KR", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(todayKorean(), DATE_POS.x, DATE_POS.y)

  ctx.font = `800 ${INFO_FONT_SIZE}px Oagothic, "Noto Sans KR", sans-serif`
  ctx.textBaseline = 'middle'
  if (institution) {
    ctx.textAlign = 'center'
    ctx.fillText(institution, INSTITUTION_CENTER_X, INFO_Y)
  }
  if (name) {
    ctx.textAlign = 'left'
    ctx.fillText(name, NAME_X, INFO_Y)
  }

  return canvas.toDataURL('image/png')
}

export default function CodingPartyCertificate({
  imageSrc,
  isLoggedIn = false,
  loginName = '',
  saveBtnSrc = withBase('/images/인증서/저장하기버튼.png'),
  printBtnSrc = withBase('/images/인증서/인쇄하기버튼.png'),
}) {
  // 소속기관: 로그인 여부 상관없이 항상 직접 입력
  // 이름: 로그인 상태면 로그인 계정 이름을 그대로 사용(수정 불가), 비로그인 상태면 직접 입력
  const [institution, setInstitution] = useState('')
  const [name, setName] = useState(loginName)

  useEffect(() => {
    if (isLoggedIn) setName(loginName)
  }, [isLoggedIn, loginName])

  // 저장/인쇄 버튼 클릭 시 "발급 후 바로 파기됩니다" 안내 팝업을 먼저 띄우고,
  // 확인을 눌러야 실제 저장/인쇄가 진행되도록 함
  const [pendingAction, setPendingAction] = useState(null) // 'save' | 'print' | null

  async function doSave() {
    const dataUrl = await renderCertificateDataUrl(imageSrc, { institution, name })
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = '인증서_ecos.png'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  async function doPrint() {
    const dataUrl = await renderCertificateDataUrl(imageSrc, { institution, name })
    const returnUrl = window.location.href // 인쇄 창에서 취소/인쇄 후 다시 이 인증서 페이지로 돌아오기 위함
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <html>
        <head>
          <title>인증서 인쇄</title>
          <style>
            @page { size: portrait; margin: 0; }
            html, body { height: 100%; margin: 0; }
            body { display: flex; align-items: center; justify-content: center; }
            img { max-width: 100%; max-height: 100vh; width: auto; height: auto; display: block; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" onload="window.print()" />
          <script>
            // 인쇄창에서 취소를 누르든 인쇄를 누르든(=인쇄 대화상자가 닫히면) afterprint가 발생함 →
            // 그 시점에 원래 인증서 페이지로 돌아가게 함
            window.addEventListener('afterprint', function () {
              window.location.href = ${JSON.stringify(returnUrl)}
            })
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  async function handleConfirm() {
    const action = pendingAction
    setPendingAction(null)
    if (action === 'save') await doSave()
    if (action === 'print') await doPrint()
  }

  return (
    <div className="cpCertCard">
      <img src={imageSrc} alt="인증서" className="cpCertCardImg" />
      <span className="cpCertDate">{todayKorean()}</span>
      <input
        type="text"
        className="cpCertInstitutionInput"
        placeholder="소속기관(OO초등학교, OO기관)"
        value={institution}
        onChange={(e) => setInstitution(e.target.value)}
      />
      <input
        type="text"
        className="cpCertNameInput"
        placeholder="이름"
        value={name}
        readOnly={isLoggedIn}
        onChange={(e) => !isLoggedIn && setName(e.target.value)}
      />
      <img src={saveBtnSrc} alt="저장하기" className="cpCertSaveBtn" onClick={() => setPendingAction('save')} />
      <img src={printBtnSrc} alt="인쇄하기" className="cpCertPrintBtn" onClick={() => setPendingAction('print')} />

      {pendingAction && (
        <div className="cpCertNoticeOverlay" onClick={() => setPendingAction(null)}>
          <div className="cpCertNoticePopup" onClick={(e) => e.stopPropagation()}>
            <p className="cpCertNoticeText">
              입력 정보는 인증서 발급을 위한 정보로<br />
              저장되지 않으며 인증서 발급 후<br />
              바로 파기됩니다.
            </p>
            <button type="button" className="cpCertNoticeConfirmBtn" onClick={handleConfirm}>확인</button>
          </div>
        </div>
      )}
    </div>
  )
}
