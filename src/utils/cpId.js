import { stringUtil } from './stringUtil'

// 코딩파티 사용자 식별값(cpId) 쿠키 이름.
// 로그인 여부에 따라 다른 쿠키를 사용한다.
// ※ 게임(유니티)마다 쿠키 이름이 다름 — 우리 게임(에코스섬의 비밀)은 cp_info.json에 정의된
//   cpEcoLoginUser / cpEcoNonLoginUser를 써야 유니티 쪽에서 같은 쿠키를 읽을 수 있음.
const LOGIN_COOKIE = 'cpEcoLoginUser'
const NON_LOGIN_COOKIE = 'cpEcoNonLoginUser'

// 예전엔 "유니티가 쿠키 값을 그대로 JSON.parse 하는 것 같다"는 추정으로
// encodeURIComponent 없이 순수 JSON 문자열({"cpid":"..."})을 그대로 저장했었음.
// 그런데 쿠키 값에 큰따옴표(")가 그대로 들어가는 건 쿠키 스펙(RFC 6265)상 원래
// 허용 안 되는 문자라, 플랫폼 공용 쿠키 처리 과정에서 값이 깨지는 경우가 있었고
// (다른 게임들 — cpChgNonLoginUser/cpDtiNonLoginUser 등 — 은 전부 URL 인코딩된
// 채로 정상 동작 중인 걸 보면 이 추정 자체가 틀렸던 것으로 보임), 그 결과
// "새로고침하면 첫 화면으로 이동" 버그로 이어진 것으로 확인됨.
// 다른 게임들과 동일하게 encodeURIComponent로 저장/조회하도록 변경.
function getRawCookie(name) {
  const escaped = name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1')
  const match = document.cookie.match(new RegExp('(?:^|; )' + escaped + '=([^;]*)'))
  return match ? match[1] : null
}

// CHG 등 다른 게임들과 동일한 만료 정책: 로그인 사용자는 고정 만료일(1년),
// 비로그인 사용자는 3시간 — 비로그인은 오래 붙잡아둘 이유가 없고, 다른 게임들도
// 다 이렇게 짧게 만료시키고 있어서 맞춤.
function cookieExpiresFor(isLoggedIn) {
  const ms = isLoggedIn ? 365 * 864e5 : 3 * 60 * 60 * 1000
  return new Date(Date.now() + ms).toUTCString()
}

function writeCookieObject(isLoggedIn, cookieName, obj) {
  const expires = cookieExpiresFor(isLoggedIn)
  document.cookie = `${cookieName}=${encodeURIComponent(JSON.stringify(obj))}; expires=${expires}; path=/`
}

// 쿠키 값을 객체로 파싱. 새 방식(URL 인코딩)이 기본이지만, 예전 방식(순수 JSON
// 문자열)으로 이미 저장된 쿠키가 남아있어도 계속 읽을 수 있어야 함 —
// decodeURIComponent는 % 문자가 없는 순수 문자열에는 그대로 no-op이라 두 방식 다
// 안전하게 처리됨. JSON도 아니면 그보다 더 옛날 방식(순수 문자열 cpid)일 수 있으니
// { cpid: 그 문자열 } 형태로 맞춰서 돌려줌.
function parseCookieObject(cookieName) {
  const raw = getRawCookie(cookieName)
  if (!raw) return null
  let decoded = raw
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    // 디코딩 실패(깨진 값 등)하면 원본 그대로 다음 단계에서 시도
  }
  try {
    const parsed = JSON.parse(decoded)
    if (parsed && typeof parsed === 'object') return parsed
  } catch {
    // JSON이 아니면 아래에서 순수 문자열로 처리
  }
  return decoded ? { cpid: decoded } : null
}

function readCpIdFromCookie(cookieName) {
  return parseCookieObject(cookieName)?.cpid || null
}

// 쿠키에 cpId가 이미 있으면 그 값을 재사용하고, 없으면 새로 만들어서 저장한다.
// (cpId는 소문자+숫자 조합 랜덤 40자 — stringUtil.random 사용)
export function getOrCreateCpId(isLoggedIn) {
  const cookieName = isLoggedIn ? LOGIN_COOKIE : NON_LOGIN_COOKIE
  const existing = readCpIdFromCookie(cookieName)
  if (existing) return existing

  const created = stringUtil.random()
  writeCookieObject(isLoggedIn, cookieName, { cpid: created })
  return created
}

// 연령대(cpUserCode) 선택 시, 같은 cpid 쿠키 안에 cpUserCode를 같이 저장한다.
// 다른 게임들(예: cpChgNonLoginUser)의 쿠키가 {"cpid":"...","cpUserCode":"001"}
// 형태로 cpid와 cpUserCode를 한 쿠키에 같이 담는 것과 동일하게 맞춤 — 유니티가
// 이 쿠키에서 cpUserCode까지 같이 읽으려고 할 가능성이 있어서, 기존처럼 서버
// API(userInfoSave.do)에만 보내고 쿠키엔 cpid만 남겨두던 방식에서 변경.
export function saveCpUserCodeToCookie(isLoggedIn, cpUserCode) {
  const cookieName = isLoggedIn ? LOGIN_COOKIE : NON_LOGIN_COOKIE
  const existing = parseCookieObject(cookieName) || {}
  writeCookieObject(isLoggedIn, cookieName, { ...existing, cpUserCode })
}

// 미션을 하나라도 "클리어"해야만 진행 중으로 치는 게 아니라, 스테이지 화면에
// 한 번이라도 들어간 적이 있으면(=START를 눌렀으면) 바로 인정해야 함 — 그래서
// 서버 진행도(getMissionList) 조회 없이, 스테이지 화면 진입 시 이 플래그만 쿠키에
// 남겨두고 랜딩 화면은 이 값만 동기적으로 확인해서 즉시 이동시킴.
export function markCpStarted(isLoggedIn) {
  const cookieName = isLoggedIn ? LOGIN_COOKIE : NON_LOGIN_COOKIE
  const existing = parseCookieObject(cookieName) || {}
  if (existing.started) return
  writeCookieObject(isLoggedIn, cookieName, { ...existing, started: true })
}

export function hasCpStarted(isLoggedIn) {
  const cookieName = isLoggedIn ? LOGIN_COOKIE : NON_LOGIN_COOKIE
  return !!parseCookieObject(cookieName)?.started
}
