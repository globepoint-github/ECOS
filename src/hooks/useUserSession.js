import { useEffect, useState } from 'react'
import { getUserSession } from '../api/gameApi'

// status: 'loading' | 'SUCCESS' | 'FAIL' | 'NO_SESSION' | 'REQUIRED' | 'ERROR'
const INITIAL_STATE = { status: 'loading', userSn: null, userId: null, userName: null }

// 페이지(NormalApp/CodingPartyApp) 마운트 시 자동으로 로그인 여부/사용자 정보를 확인한다.
// JSESSIONID는 브라우저 쿠키로 자동 전송되므로 별도 파라미터 없이 호출.
export function useUserSession() {
  const [session, setSession] = useState(INITIAL_STATE)

  useEffect(() => {
    let cancelled = false

    getUserSession()
      .then((data) => {
        if (cancelled) return
        if (data?.result === 'SUCCESS') {
          setSession({
            status: 'SUCCESS',
            userSn: data.USER_SN ?? null,
            userId: data.USER_ID ?? null,
            userName: data.USER_NM ?? null,
          })
        } else {
          setSession({ ...INITIAL_STATE, status: data?.result || 'FAIL' })
        }
      })
      .catch(() => {
        if (!cancelled) setSession({ ...INITIAL_STATE, status: 'ERROR' })
      })

    return () => {
      cancelled = true
    }
  }, [])

  return session
}
