// 코딩파티 사용자 코드(cpUserCode)를 이미 저장했는지 브라우저에 기억해서
// 같은 cpId로 다시 들어왔을 때 팝업을 또 띄우지 않게 함.
const SAVED_KEY_PREFIX = 'cpUserCodeSaved:'

export function hasSavedCpUserCode(cpId) {
  try {
    return localStorage.getItem(SAVED_KEY_PREFIX + cpId) === '1'
  } catch {
    return false
  }
}

export function markCpUserCodeSaved(cpId) {
  try {
    localStorage.setItem(SAVED_KEY_PREFIX + cpId, '1')
  } catch {
    // localStorage 사용 불가 환경이면 무시 (그냥 다음에 다시 물어보게 됨)
  }
}
