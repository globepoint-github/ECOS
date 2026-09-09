// vite.config.js의 base 설정값(예: '/eco/')을 절대경로 앞에 붙여준다.
// 로컬 개발(base '/')에서는 그대로 두고, 배포 시(base '/eco/')에는 자동으로 접두사가 붙음.
// path는 항상 '/'로 시작한다고 가정 (예: '/images/foo.png').
const BASE = import.meta.env.BASE_URL

export function withBase(path) {
  return BASE.replace(/\/$/, '') + path
}
