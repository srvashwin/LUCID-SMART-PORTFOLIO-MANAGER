export const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': '#5266eb',
  Transportation: '#f59e0b',
  Shopping: '#8d9bfa',
  'Bills & Utilities': '#06b6d4',
  Entertainment: '#aebbff',
  'Health & Fitness': '#10b981',
  Education: '#8b5cf6',
  Housing: '#ef4444',
  Travel: '#f472b6',
  Groceries: '#22c55e',
  'Personal Care': '#e879f9',
  Subscription: '#06b6d4',
  Investment: '#8b5cf6',
  Other: '#6b7280',
}

const FALLBACK_COLORS = [
  '#5266eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f472b6', '#22c55e', '#e879f9', '#aebbff',
]

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || FALLBACK_COLORS[Math.abs(hashCode(category)) % FALLBACK_COLORS.length]
}

function hashCode(s: string): number {
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i)
    hash |= 0
  }
  return hash
}
