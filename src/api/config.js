// 이솦 게임 API 서버 주소.
// 예전엔 .env(VITE_API_BASE_URL)로 빌드 시점에 주소를 고정하는 방식이었는데,
// 운영 배포 빌드에 .env가 개발 주소로 된 채 그대로 올라가서 운영기에서 API가
// 개발 서버로 요청되는 사고가 있었음. DTI 등 다른 게임들처럼 빌드 시점이 아니라
// "지금 접속한 호스트명"을 보고 런타임에 자동으로 개발/운영 서버를 고르는 방식으로 변경 —
// 어떤 빌드를 어디에 올리든 항상 그 환경에 맞는 주소를 쓰게 되어 이런 사고 자체가 안 남.
const DEV_BASE_URL = 'https://dev-www.ebssw.kr:10543'
const PROD_BASE_URL = 'https://www.ebssw.kr'

export const API_BASE_URL = window.location.hostname === 'dev-www.ebssw.kr' ? DEV_BASE_URL : PROD_BASE_URL

// 에코스섬의 비밀 미션 코드
export const MISSION_CODE = 'eco'

// 코딩파티 연도/시즌 (유니티 빌드 StreamingAssets/datas/cp_info.json과 동일한 값)
export const CP_YEAR = '2026'
export const CP_SEASON = '2'
