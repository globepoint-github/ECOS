# 이솦 AI 전환 — 에코스섬의 비밀

이솦(EBS) 게임 API 서버가 기존 `ebssw.kr` 도메인에서 "AI 이솦" 서버(`ebsai.co.kr` 도메인)로 이전되면서, 사이트 자체(프론트엔드)도 통째로 새 도메인으로 이사. 그에 따른 우리 쪽(React) 코드 반영 내용 정리.

## 변경 전 / 후

| 구분 | 변경 전 (ebssw.kr) | 변경 후 (ebsai.co.kr) |
|---|---|---|
| 개발 서버 | `https://dev-www.ebssw.kr:10543` | `https://dev-www.ebsai.co.kr:30180` |
| 운영 서버 | `https://www.ebssw.kr` (포트 없음) | `https://www.ebsai.co.kr` (포트 없음) |
| 개발/운영 분기 기준 | `window.location.hostname === 'dev-www.ebssw.kr'` | `window.location.hostname === 'dev-www.ebsai.co.kr'` |

사이트 자체가 이사하는 거라 분기 기준 호스트명도 같이 바뀜 (API 서버 주소만 바뀌는 거였다면 분기 기준은 그대로 두고 BASE_URL 값만 바꿨어야 함 — 혼동 주의).

## 수정한 파일

- `src/api/config.js`: `DEV_BASE_URL`, `PROD_BASE_URL`, 호스트명 분기 조건 3곳
- `src/api/gameApi.js`: JSESSIONID 분기용 `isDev` 체크(51번째 줄) 1곳

## 수정 안 한 곳 (확인했지만 손댈 필요 없었음)

- **쿠키(`src/utils/cpId.js`, `src/utils/cookie.js`)**: 쿠키 저장 시 `domain=` 속성을 아예 지정하지 않고 `path=/`만 사용 중이라, 도메인이 하드코딩된 부분이 없음. 사이트가 새 도메인으로 이사해도 쿠키는 항상 "현재 떠 있는 페이지의 호스트" 기준으로 자동 적용되므로 코드 수정 불필요.

## 남은 확인 사항 (유니티 쪽)

- 유니티 빌드(StreamingAssets 등)에도 API 서버 주소가 들어있어서 별도 수정 필요 — 유니티 쪽 작업 진행 중
- 운영기 JSESSIONID 쿠키 뒤에 톰캣 클러스터 접미사(예: 기존 `ebssw21` 같은 `.jvmRoute`)가 붙어서 `.split('.')[0]`로 잘라 쓰는 로직이 있는데(`gameApi.js:51~53`), 새 서버(ebsai.co.kr)도 동일한 접미사 구조인지는 실제 운영 배포 후 쿠키 값을 확인해봐야 함 — 구조가 다르면 이 분기 로직도 재검토 필요
- 유니티 빌드 교체 끝나면 전체 플로우(로그인 확인 / 미션 조회 / 코딩파티 연령 저장) 재테스트 필요
