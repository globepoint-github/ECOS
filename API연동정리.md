# API 연동 정리 — 에코스섬의 비밀

이솦(EBS) 게임 API 연동 내용 정리. 원본 API 문서: `이솦_신규게임_API_20260902 (1).docx`

## 서버 주소 / 식별값
- 테스트 서버: `https://dev-www.ebssw.kr:10543`
- 미션코드: `eco` (소문자 — 대문자로 하면 서버가 못 받음, 실측 확인)
- 코딩파티 연도/시즌: `2026` / `1`
- 배포 URL 접두사: `/eco` (proxy pass)
- 관련 코드: `src/api/config.js`, `src/api/gameApi.js`

## 연동된 API

### 1. 로그인 확인 — `GET /site/user/getUserSession.do`
- 앱 진입 시(`useUserSession` 훅) 자동 호출해서 로그인 여부/`userSn` 확인
- JSESSIONID를 쿠키로 자동 전송하는 것만으로는 서버가 로그인 상태를 못 알아봐서, 쿠키 값을 직접 읽어 `?JSESSIONID=값` 쿼리 파라미터로 명시적으로 붙여서 요청 (이거 없으면 로그인해도 계속 비로그인 처리됨)
- 응답 `result`가 `SUCCESS`일 때만 로그인 상태로 판단

### 2. 미션 수행 정보 조회 — `GET /api/jb/getMissionList.do`
- 스테이지 화면 진입 시 + 게임 탭 닫고 돌아왔을 때(`focus` 이벤트) 호출해서 서버에 저장된 클리어 기록을 받아옴
- 파라미터: `missionCode`, `userSn`(일반판) 또는 `cpid` + `cpYear` + `cpSeason`(+ 로그인 시 `userSn`도 같이, 코딩파티판)
- 응답의 `resultData[].missionNumber` 값을 스테이지 번호(1~7)로 사용해서 잠금 해제 상태 갱신
  - ⚠️ `missionStepNumber`가 스테이지 번호인 줄 알았으나, 실측 결과 미션 안의 세부 단계 값이라 항상 1로 고정되어 있었음 → `missionNumber`로 수정함
- 파라미터 이름은 반드시 소문자 `cpid`로 보내야 함 (`cpId`로 보내면 서버가 "필수값 누락"으로 거부함, 실측 확인)

### 3. 미션 수행 정보 전송 — `POST /api/jb/jbMissionCompleteInfoSave.do`
- 스테이지(미션) 클리어 시 완료 기록을 저장하는 API
- **이건 유니티가 직접 호출** — 저희 React 쪽에는 이 API를 호출하는 코드가 없음
- 가끔 이 저장 요청 자체가 안 나가서 클리어해도 다음 단계가 안 풀리는 문제가 있었음 (유니티 쪽 확인 필요한 부분)

### 4. 코딩파티 사용자 정보 저장 — `POST /api/jb/userInfoSave.do`
- 코딩파티판 진입 시 연령대(001 유아 ~ 007 기타) 선택 팝업에서 선택하면 호출
- 파라미터: `cpid`, `cpYear`, `cpSeason`, `cpUserCode` (+ 로그인 시 `userSn`)

## 코딩파티 cpid(식별값) 처리
- 로그인 여부에 따라 쿠키 이름이 다름: `cpEcoLoginUser`(로그인) / `cpEcoNonLoginUser`(비로그인)
  - ⚠️ 처음엔 다른 게임 이름을 그대로 써서 `cpDtiLoginUser`로 잘못 되어 있었음 → `cpEco...`로 수정
- 쿠키 값은 순수 문자열이 아니라 `{"cpid":"랜덤값"}` 형태의 JSON 문자열로 저장 (유니티가 JSON으로 파싱해서 읽음), 인코딩 없이 그대로 저장
- cpid는 소문자+숫자 조합 랜덤 40자, 없으면 새로 생성해서 쿠키에 저장, 있으면 재사용
- 일반판/코딩파티판 상관없이 페이지 진입 시 항상 생성 (유니티가 모드 무관하게 무조건 이 쿠키를 찾으려고 시도하기 때문)
- 관련 코드: `src/utils/cpId.js`

## 알아두면 좋은 것
- 로컬(`localhost`)에서는 실제 API 서버랑 도메인이 달라서 CORS로 막힘 → 로그인/진행상황 조회가 실패하고, 그럴 때는 예전 방식(클릭하면 바로 다음 단계 풀림)으로 자동 대체됨. 그래서 API 연동 테스트는 실제 서버(`/eco`)에 올려서만 정확히 확인 가능
- 로켓 위치, 잠금 원 활성화 표시 등 화면 로직은 API 응답을 받은 *이후*에 계산되는 부분이라, 이 부분을 수정해도 API 호출/저장 자체에는 영향 없음
