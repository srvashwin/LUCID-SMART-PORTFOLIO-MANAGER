import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import api from '../services/api'
import type { User } from '../types'

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, name: string, password: string, currency?: string) => Promise<void>
  googleLogin: (idToken: string) => Promise<void>
  verifyEmail: (token: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      api.get('/auth/me')
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('token')
          setToken(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  const storeToken = (newToken: string) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
  }

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password })
    storeToken(res.data.access_token)
    const me = await api.get('/auth/me')
    setUser(me.data)
  }

  const signup = async (email: string, name: string, password: string, currency = 'USD') => {
    await api.post('/auth/signup', { email, name, password, currency })
  }

  const googleLogin = async (idToken: string) => {
    const res = await api.post('/auth/google', { id_token: idToken })
    storeToken(res.data.access_token)
    const me = await api.get('/auth/me')
    setUser(me.data)
  }

  const verifyEmail = async (token: string) => {
    const res = await api.post('/auth/verify-email', { token })
    storeToken(res.data.access_token)
    const me = await api.get('/auth/me')
    setUser(me.data)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me')
      setUser(res.data)
    } catch {
      // silently fail
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, googleLogin, verifyEmail, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
