import { useEffect, useRef, useState } from 'react'

// 컨테이너의 실제 가로세로 비율을 재서, 그 비율 구간에 맞는 배경 변형 이름을 돌려줌.
// "꽉 채우기(cover)"를 쓰면서도 화면이 너무 넓거나(초광각 모니터) 너무 좁을 때(세로형 창)
// 원본 16:9 이미지 하나로는 사람/로봇/건물이 심하게 잘리기 때문에, 비율 구간별로
// 그 구간에 맞게 새로 그린 배경 이미지를 통째로 바꿔 끼우기 위한 판별 훅.
// narrowMax를 1.4로 뒀더니, 실제 서비스에서 이 화면이 들어가는 iframe 박스가
// 1466x1084(비율 1.35)처럼 "세로형까진 아니고 그냥 좀 좁은 가로형"인 경우까지
// narrow(세로형 전용 이미지)로 잘못 분류되어 배경/타이틀이 어색하게 나오는 문제가 있었음.
// narrow는 진짜 세로에 가까운 비율(예: 1281x1383=0.93)에만 걸리도록 기준을 낮춤
export function useAspectVariant(ref, { narrowMax = 1.05, wideMin = 2.3 } = {}) {
  const [variant, setVariant] = useState('default')
  const rafRef = useRef(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    function measure() {
      const cw = el.clientWidth
      const ch = el.clientHeight
      if (!cw || !ch) return
      const ratio = cw / ch
      const next = ratio <= narrowMax ? 'narrow' : ratio >= wideMin ? 'wide' : 'default'
      setVariant((prev) => (prev === next ? prev : next))
    }

    function scheduleMeasure() {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(measure)
    }

    scheduleMeasure()
    const ro = new ResizeObserver(scheduleMeasure)
    ro.observe(el)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(rafRef.current)
    }
  }, [ref, narrowMax, wideMin])

  return variant
}
