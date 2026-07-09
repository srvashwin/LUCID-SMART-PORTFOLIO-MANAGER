import { useAuth } from './useAuth'
import { getCurrencySymbol } from '../utils/format'

export function useCurrency() {
  const { user } = useAuth()
  const currency = user?.currency || 'USD'
  const symbol = getCurrencySymbol(currency)
  return { currency, symbol }
}
