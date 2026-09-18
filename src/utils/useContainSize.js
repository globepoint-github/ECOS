import { useEffect, useRef, useState } from 'react'

// 부모 요소의 실제 렌더링 크기 안에, 주어진 가로세로 비율을 유지한 채 최대한 크게
// 들어가는 박스 크기(px)를 계산해서 돌려줌 — object-fit:contain과 같은 동작을,
// 자식 요소들이 %로 위치를 잡을 수 있는 실제 박스(px 크기)로 얻기 위한 용도.
//
// CSS만으로(container query 등) 처리하지 않고 ResizeObserver로 직접 측정하는 이유:
// 이 프로젝트가 쓰는 Chrome 빌드에서 `container-type:size` + cqw/cqh 조합이 간헐적으로
// 잘못된 크기를 계산하는 버그가 확인됨(같은 페이지를 새로고침해도 될 때/안 될 때가 섞임).
// ResizeObserver + 인라인 style 방식은 그런 재현성 문제 없이 항상 정확함.
export function useContainSize(ref, aspectRatio) {
  const [size, setSize] = useState({ width: 0, height: 0 })
  const rafRef = useRef(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    function measure() {
      const cw = el.clientWidth
      const ch = el.clientHeight
      if (!cw || !ch) return
      let width = cw
      let height = cw / aspectRatio
      if (height > ch) {
        height = ch
        width = ch * aspectRatio
      }
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }))
    }

    // ResizeObserver 콜백 안에서 바로 setState하면 브라우저에 따라
    // "ResizeObserver loop" 경고/타이밍 문제가 생길 수 있어 rAF로 한 프레임 늦춤
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
  }, [ref, aspectRatio])

  return size
}
