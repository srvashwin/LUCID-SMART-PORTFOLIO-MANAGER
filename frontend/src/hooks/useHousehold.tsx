import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import api from '../services/api'
import type { Household, HouseholdDetail } from '../types'

interface HouseholdContextValue {
  households: Household[]
  currentHousehold: HouseholdDetail | null
  activeHouseholdId: number | null
  loading: boolean
  setCurrentHouseholdId: (id: number | null) => void
  refresh: () => void
}

const HouseholdContext = createContext<HouseholdContextValue>({
  households: [],
  currentHousehold: null,
  activeHouseholdId: null,
  loading: false,
  setCurrentHouseholdId: () => {},
  refresh: () => {},
})

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const [households, setHouseholds] = useState<Household[]>([])
  const [currentHousehold, setCurrentHousehold] = useState<HouseholdDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const activeHouseholdId = currentHousehold?.household.id ?? null

  const fetchHouseholds = useCallback(async () => {
    try {
      const res = await api.get('/households')
      setHouseholds(res.data)
      return res.data as Household[]
    } catch {
      return []
    }
  }, [])

  const refresh = useCallback(() => {
    fetchHouseholds()
  }, [fetchHouseholds])

  useEffect(() => {
    setLoading(true)
    fetchHouseholds().then(list => {
      const storedId = localStorage.getItem('active_household_id')
      if (storedId && list.some((h: Household) => h.id === Number(storedId))) {
        api.get(`/households/${storedId}`).then(r => setCurrentHousehold(r.data)).catch(() => {})
      }
    }).finally(() => setLoading(false))
  }, [fetchHouseholds])

  const setCurrentHouseholdId = useCallback((id: number | null) => {
    if (id === null) {
      setCurrentHousehold(null)
      localStorage.removeItem('active_household_id')
      return
    }
    localStorage.setItem('active_household_id', String(id))
    setLoading(true)
    api.get(`/households/${id}`).then(r => {
      setCurrentHousehold(r.data)
    }).catch(() => {
      setCurrentHousehold(null)
    }).finally(() => setLoading(false))
  }, [])

  return (
    <HouseholdContext.Provider value={{ households, currentHousehold, activeHouseholdId, loading, setCurrentHouseholdId, refresh }}>
      {children}
    </HouseholdContext.Provider>
  )
}

export function useHousehold() {
  return useContext(HouseholdContext)
}
