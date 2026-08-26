// 인증서 배경(1200x800) 안의 날짜 위치 (픽셀 기준, %로 환산해서 CSS에도 동일하게 사용)
const CANVAS_W = 1200
const CANVAS_H = 800

const DATE_POS = { x: 543, y: 515 + 16 / 2 } // Figma: X543 Y515, H16 Hug → 세로 중앙 기준으로 보정
const DATE_FONT_SIZE = 12.34

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

// 이름 입력 기능은 추후 입력 항목이 정해지면 다시 추가 예정. 지금은 날짜만 그림.
async function renderCertificateDataUrl(imageSrc) {
  const bg = await loadImage(imageSrc)
  try {
    await document.fonts.load(`500 ${DATE_FONT_SIZE}px Oagothic`)
  } catch {
    // 폰트 로드 실패해도 폴백 폰트로 계속 진행
  }

  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_W
  canvas.height = CANVAS_H
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bg, 0, 0, CANVAS_W, CANVAS_H)

  // 오늘 날짜 (항상 실시간 현재 날짜)
  ctx.fillStyle = '#000000'
  ctx.font = `500 ${DATE_FONT_SIZE}px Oagothic, "Noto Sans KR", sans-serif`
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(todayKorean(), DATE_POS.x, DATE_POS.y)

  return canvas.toDataURL('image/png')
}

export default function Certificate({
  imageSrc,
  saveBtnSrc = '/images/인증서/저장하기버튼.png',
  printBtnSrc = '/images/인증서/인쇄하기버튼.png',
}) {
  async function handleSave() {
    const dataUrl = await renderCertificateDataUrl(imageSrc)
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = '인증서_ecos.png'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  async function handlePrint() {
    const dataUrl = await renderCertificateDataUrl(imageSrc)
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <html>
        <head><title>인증서 인쇄</title></head>
        <body style="margin:0;display:flex;align-items:flex-start;justify-content:center;">
          <img src="${dataUrl}" style="width:100%;max-width:${CANVAS_W}px;height:auto;display:block;" onload="window.print()" />
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="certCard">
      <img src={imageSrc} alt="인증서" className="certCardImg" />
      <span className="certDate">{todayKorean()}</span>
      <img src={saveBtnSrc} alt="저장하기" className="certSaveBtn" onClick={handleSave} />
      <img src={printBtnSrc} alt="인쇄하기" className="certPrintBtn" onClick={handlePrint} />
    </div>
  )
}
