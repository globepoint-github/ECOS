import { API_BASE_URL, MISSION_CODE } from './config'
import { getCookie } from '../utils/cookie'

function toQueryString(params) {
  const usp = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) usp.append(key, value)
  })
  return usp.toString()
}

// 서버가 POST 본문을 JSON으로 파싱하는 게 아니라 일반 폼 파라미터(request.getParameter)로
// 읽는 것으로 보임 — application/json으로 그냥 보내면 응답의 "requestParam"이 {}로 와서
// 서버가 파라미터를 하나도 못 받은 것으로 확인됨(userInfoSave.do 저장 실패의 실제 원인).
// ※ "requestParam"은 클라이언트가 보내야 하는 필드명이 아니라, 서버가 실제로 파싱해낸
//   파라미터를 그대로 돌려주는 응답 전용(echo) 필드 — CHG/DTI 등 정상 동작하는 다른
//   게임들도 전부 FormData(multipart/form-data)에 cpid/cpYear 등을 개별 필드로 append해서
//   보내고 있는 것으로 확인되어 동일한 방식으로 맞춤. (Content-Type은 브라우저가 FormData의
//   multipart boundary를 자동으로 채워야 하므로 직접 지정하지 않음)
async function postJson(url, body) {
  const form = new FormData()
  Object.entries(body).forEach(([key, value]) => {
    if (value !== undefined && value !== null) form.append(key, value)
  })
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include', // JSESSIONID 쿠키 자동 전송
    body: form,
  })
  return res.json()
}

async function getJson(url) {
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  })
  return res.json()
}

// 1. 사용자 로그인 확인 (JSESSIONID 방식)
// 쿠키로 자동 전송되는 것과 별개로, 유니티 쪽 구현(및 API 문서의 Request Parameters)을 보면
// JSESSIONID 값을 쿼리 파라미터로도 명시적으로 붙여서 요청함 — 안 붙이면 로그인 상태여도
// 서버가 비로그인(REQUIRED 등)으로 처리하는 것으로 확인됨.
// 운영기 쿠키 값은 뒤에 "ebssw21" 같은 톰캣 클러스터 접미사(.jvmRoute)가 붙어서 나오는데,
// 이걸 그대로 보내면 서버가 세션을 못 찾아 FAIL 처리함 → 운영기에서만 "."로 잘라 앞부분만 사용.
// ※ 개발기 JSESSIONID(예: "...S-ESW-ESW-O-01")에도 "."이 있어서 무조건 split하면 안전할 것
//   같지만, DTI가 굳이 호스트명으로 조건을 나눠둔 걸 보면 개발기는 그 뒷부분까지 포함된
//   전체 값을 그대로 보내야 서버가 세션을 찾는 것으로 보임 — DTI와 동일하게 운영기에서만 자름.
export function getUserSession() {
  const isDev = window.location.hostname === 'dev-www.ebssw.kr'
  const rawJsessionId = getCookie('JSESSIONID')
  const jsessionId = isDev ? rawJsessionId : rawJsessionId?.split('.')[0]
  const query = jsessionId ? `?${toQueryString({ JSESSIONID: jsessionId })}` : ''
  return getJson(`${API_BASE_URL}/site/user/getUserSession.do${query}`)
}

// 2. 사용자 미션 수행 정보 전송
// params: { userSn, missionNumber, missionStepNumber, missionQuesNumber, completionTime,
//           elapsedTime, duplicateMission, misnFailrCo, misnContData, cpid?, cpYear?, cpSeason? }
export function saveMissionComplete(params) {
  return postJson(`${API_BASE_URL}/api/jb/jbMissionCompleteInfoSave.do`, {
    missionCode: MISSION_CODE,
    ...params,
  })
}

// 3. 사용자 미션 수행 정보 조회 (리스트)
// params: { userSn?, cpid?, cpYear?, cpSeason? }
export function getMissionList(params) {
  const query = toQueryString({ missionCode: MISSION_CODE, ...params })
  return getJson(`${API_BASE_URL}/api/jb/getMissionList.do?${query}`)
}

// 4. 코딩파티 사용자 정보 저장 (코딩파티 경우에만 사용)
// params: { userSn?, cpid, cpYear, cpSeason, cpUserCode }
export function saveCpUserInfo(params) {
  return postJson(`${API_BASE_URL}/api/jb/userInfoSave.do`, {
    missionCode: MISSION_CODE,
    ...params,
  })
}
