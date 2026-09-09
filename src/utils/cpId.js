import { stringUtil } from './stringUtil'

// 코딩파티 사용자 식별값(cpId) 쿠키 이름.
// 로그인 여부에 따라 다른 쿠키를 사용한다.
// ※ 게임(유니티)마다 쿠키 이름이 다름 — 우리 게임(에코스섬의 비밀)은 cp_info.json에 정의된
//   cpEcoLoginUser / cpEcoNonLoginUser를 써야 유니티 쪽에서 같은 쿠키를 읽을 수 있음.
const LOGIN_COOKIE = 'cpEcoLoginUser'
const NON_LOGIN_COOKIE = 'cpEcoNonLoginUser'

// 유니티가 쿠키 값을 그대로 JSON.parse 하는 것으로 보여서, 이 쿠키는
// encodeURIComponent 없이 순수 JSON 문자열 그대로 저장/조회한다.
// (인코딩되면 유니티 쪽에서 "%7B..." 형태를 JSON으로 못 읽을 수 있음)
function getRawCookie(name) {
  const escaped = name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1')
  const match = document.cookie.match(new RegExp('(?:^|; )' + escaped + '=([^;]*)'))
  return match ? match[1] : null
}

function setRawCookie(name, value, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${value}; expires=${expires}; path=/`
}

function readCpIdFromCookie(cookieName) {
  const raw = getRawCookie(cookieName)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return parsed?.cpid || null
  } catch {
    // 예전 방식(순수 문자열)으로 저장된 값이 남아있을 수 있으니 그대로 반환
    return raw
  }
}

// 쿠키에 cpId가 이미 있으면 그 값을 재사용하고, 없으면 새로 만들어서 저장한다.
// (cpId는 소문자+숫자 조합 랜덤 40자 — stringUtil.random 사용)
export function getOrCreateCpId(isLoggedIn) {
  const cookieName = isLoggedIn ? LOGIN_COOKIE : NON_LOGIN_COOKIE
  const existing = readCpIdFromCookie(cookieName)
  if (existing) return existing

  const created = stringUtil.random()
  setRawCookie(cookieName, JSON.stringify({ cpid: created }))
  return created
}
