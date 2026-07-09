const CURRENCY_MAP: Record<string, { symbol: string; code: string; name: string }> = {
  USD: { symbol: '$', code: 'USD', name: 'US Dollar' },
  EUR: { symbol: '\u20AC', code: 'EUR', name: 'Euro' },
  GBP: { symbol: '\u00A3', code: 'GBP', name: 'British Pound' },
  JPY: { symbol: '\u00A5', code: 'JPY', name: 'Japanese Yen' },
  INR: { symbol: '\u20B9', code: 'INR', name: 'Indian Rupee' },
  CAD: { symbol: 'C$', code: 'CAD', name: 'Canadian Dollar' },
  AUD: { symbol: 'A$', code: 'AUD', name: 'Australian Dollar' },
  CHF: { symbol: 'Fr', code: 'CHF', name: 'Swiss Franc' },
  CNY: { symbol: 'CN\u00A5', code: 'CNY', name: 'Chinese Yuan' },
  KRW: { symbol: '\u20A9', code: 'KRW', name: 'South Korean Won' },
  BRL: { symbol: 'R$', code: 'BRL', name: 'Brazilian Real' },
  MXN: { symbol: 'Mex$', code: 'MXN', name: 'Mexican Peso' },
  SGD: { symbol: 'S$', code: 'SGD', name: 'Singapore Dollar' },
  HKD: { symbol: 'HK$', code: 'HKD', name: 'Hong Kong Dollar' },
  NZD: { symbol: 'NZ$', code: 'NZD', name: 'New Zealand Dollar' },
  SEK: { symbol: 'kr', code: 'SEK', name: 'Swedish Krona' },
  NOK: { symbol: 'kr', code: 'NOK', name: 'Norwegian Krone' },
  DKK: { symbol: 'kr', code: 'DKK', name: 'Danish Krone' },
  PLN: { symbol: 'z\u0142', code: 'PLN', name: 'Polish Zloty' },
  TRY: { symbol: '\u20BA', code: 'TRY', name: 'Turkish Lira' },
}

export function formatAmount(amount: number, currencyCode = 'USD'): string {
  const info = CURRENCY_MAP[currencyCode] || { symbol: currencyCode + ' ', code: currencyCode }
  return `${info.symbol}${amount.toFixed(2)}`
}

export function getCurrencySymbol(currencyCode = 'USD'): string {
  return CURRENCY_MAP[currencyCode]?.symbol || currencyCode
}

export function getAllCurrencies() {
  return Object.values(CURRENCY_MAP)
}
