import { useEffect, useState, useCallback } from 'react'
import LogRocket from 'logrocket'
import * as authApi from '../api/auth.js'
import { AuthContext } from './auth-context.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Tie the LogRocket session to the logged-in user (once known) so replays
  // can be looked up by name/email instead of just an anonymous session id.
  useEffect(() => {
    if (user) {
      LogRocket.identify(user._id, {
        name: user.name,
        email: user.email,
      })
    }
  }, [user])

  useEffect(() => {
    let cancelled = false
    authApi.getMe()
      // `/me` returns null when the access token is missing/expired — that
      // doesn't necessarily mean the session is over, since the refresh
      // token (a separate, longer-lived cookie) may still be valid. Attempt
      // a refresh before treating the user as logged out.
      .then((me) => (me ? me : authApi.refresh().catch(() => null)))
      .then((me) => { if (!cancelled) setUser(me) })
      .catch(() => { if (!cancelled) setUser(null) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const login = useCallback(async (email, password) => {
    const me = await authApi.login({ email, password })
    setUser(me)
    return me
  }, [])

  const register = useCallback(async (name, email, password) => {
    const me = await authApi.register({ name, email, password })
    setUser(me)
    return me
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
