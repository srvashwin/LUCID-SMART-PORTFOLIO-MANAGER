import { useState, useCallback } from 'react'

interface PaginationState {
  offset: number
  limit: number
  total: number
}

export function usePagination(limit = 20) {
  const [state, setState] = useState<PaginationState>({ offset: 0, limit, total: 0 })

  const setTotal = useCallback((total: number) => {
    setState(prev => ({ ...prev, total }))
  }, [])

  const nextPage = useCallback(() => {
    setState(prev => {
      const next = prev.offset + prev.limit
      if (next >= prev.total) return prev
      return { ...prev, offset: next }
    })
  }, [])

  const prevPage = useCallback(() => {
    setState(prev => ({
      ...prev,
      offset: Math.max(0, prev.offset - prev.limit),
    }))
  }, [])

  const goToPage = useCallback((page: number) => {
    setState(prev => ({
      ...prev,
      offset: page * prev.limit,
    }))
  }, [])

  const page = Math.floor(state.offset / state.limit)
  const totalPages = Math.ceil(state.total / state.limit)
  const hasNext = state.offset + state.limit < state.total
  const hasPrev = state.offset > 0

  return { ...state, page, totalPages, hasNext, hasPrev, setTotal, nextPage, prevPage, goToPage }
}
