export interface User {
  user_id: string
  user_login: string
  user_password?: string // Опционально, чтобы не передавать пароль в UI
  user_dateofcreation: string
  is_admin: boolean
  days_left: number
  is_frozen?: boolean // Добавляем поле для заморозки подписки
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

  return `${wholeDays}д ${remainingHours}ч`
}

// Функция для форматирования даты в московском времени
export function formatDate(dateString: string): string {
  try {
    // Проверяем, что dateString не пустой
    if (!dateString) return "Нет данных"

    const date = new Date(dateString)

    // Проверяем, что дата валидна
    if (isNaN(date.getTime())) return "Некорректная дата"

    // Форматируем дату в московском времени (UTC+3)
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Europe/Moscow",
    }

    return new Intl.DateTimeFormat("ru-RU", options).format(date)
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Ошибка форматирования"
  }
}
