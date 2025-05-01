export interface User {
  username: string
  password: string
  daysLeft: number
  isAdmin: boolean
}

export interface LogEntry {
  text: string
  timestamp: Date
}

export interface Account {
  username: string
  donate: number
  balance: number
  pending: number
  rap: number
  billing: number
  premium: boolean
  card: boolean
  badge: number
  gamepass: number
  cookie: string
}

export function formatTimeLeft(days: number): string {
  const wholeDays = Math.floor(days)
  const remainingHours = Math.floor((days - wholeDays) * 24)
  const remainingMinutes = Math.floor(((days - wholeDays) * 24 - remainingHours) * 60)

  return `${wholeDays}д ${remainingHours}ч ${remainingMinutes}м`
}
