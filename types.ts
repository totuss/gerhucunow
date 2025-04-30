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
