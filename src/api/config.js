// 이솦 게임 API 서버 주소.
// 배포 시 .env 파일에 VITE_API_BASE_URL을 넣어주면 그 값을 우선 사용하고,
// 없으면 기본값으로 테스트 서버를 사용한다. (운영 배포 시 .env에 운영 주소로 교체)
const TEST_BASE_URL = 'https://dev-www.ebssw.kr:10543'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || TEST_BASE_URL

// 에코스섬의 비밀 미션 코드
export const MISSION_CODE = 'eco'

// 코딩파티 연도/시즌 (유니티 빌드 StreamingAssets/datas/cp_info.json과 동일한 값)
export const CP_YEAR = '2026'
export const CP_SEASON = '1'
