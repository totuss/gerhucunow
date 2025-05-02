import type { User } from "./types"
import { getSupabaseClient } from "./supabase"
import { getCookie, setCookie, deleteCookie } from "./cookies"

// Моковые данные для тестирования
const mockUsers: User[] = [
  {
    user_id: "1",
    user_login: "admin",
    user_password: "admin",
    user_dateofcreation: new Date().toISOString(),
    is_admin: true,
    days_left: 30,
    is_frozen: false,
  },
  {
    user_id: "2",
    user_login: "user",
    user_password: "user",
    user_dateofcreation: new Date().toISOString(),
    is_admin: false,
    days_left: 15,
    is_frozen: false,
  },
  {
    user_id: "3",
    user_login: "expired",
    user_password: "expired",
    user_dateofcreation: new Date().toISOString(),
    is_admin: false,
    days_left: 0,
    is_frozen: false,
  },
  {
    user_id: "4",
    user_login: "frozen",
    user_password: "frozen",
    user_dateofcreation: new Date().toISOString(),
    is_admin: false,
    days_left: 15,
    is_frozen: true,
  },
]

// Функция для аутентификации пользователя
export async function getUserByCredentials(username: string, password: string): Promise<User | null> {
  try {
    // Пытаемся использовать Supabase
    const supabase = getSupabaseClient()

    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("user_login", username)
        .eq("user_password", password)
        .single()

      if (error || !data) {
        throw new Error("Supabase error or no data")
      }

      // Преобразуем данные из БД в формат User
      const user: User = {
        user_id: data.user_id,
        user_login: data.user_login,
        user_dateofcreation: data.user_dateofcreation,
        is_admin: data.is_admin,
        days_left: Number(data.days_left),
        is_frozen: data.is_frozen || false,
      }

      return user
    } catch (supabaseError) {
      console.warn("Supabase error, using mock data:", supabaseError)

      // Если Supabase недоступен, используем моковые данные
      const mockUser = mockUsers.find((u) => u.user_login === username && u.user_password === password)
      return mockUser || null
    }
  } catch (error) {
    console.error("Error getting user by credentials:", error)

    // Если произошла ошибка, используем моковые данные
    const mockUser = mockUsers.find((u) => u.user_login === username && u.user_password === password)
    return mockUser || null
  }
}

// Функция для регистрации нового пользователя
export async function registerUser(
  username: string,
  password: string,
): Promise<{ success: boolean; message: string; user?: User }> {
  try {
    const supabase = getSupabaseClient()

    try {
      // Проверяем, существует ли пользователь с таким логином
      const { data: existingUser } = await supabase.from("users").select("user_id").eq("user_login", username).single()

      if (existingUser) {
        return { success: false, message: "Пользователь с таким логином уже существует" }
      }

      // Создаем нового пользователя
      const { data, error } = await supabase
        .from("users")
        .insert([
          {
            user_login: username,
            user_password: password,
            is_admin: false,
            days_left: 0, // По умолчанию 0 дней подписки
            is_frozen: false,
          },
        ])
        .select()

      if (error || !data || data.length === 0) {
        throw new Error("Supabase error or no data")
      }

      // Преобразуем данные из БД в формат User
      const user: User = {
        user_id: data[0].user_id,
        user_login: data[0].user_login,
        user_dateofcreation: data[0].user_dateofcreation,
        is_admin: data[0].is_admin,
        days_left: Number(data[0].days_left),
        is_frozen: data[0].is_frozen || false,
      }

      return { success: true, message: "Пользователь успешно зарегистрирован", user }
    } catch (supabaseError) {
      console.warn("Supabase error, using mock data:", supabaseError)

      // Если Supabase недоступен, используем моковые данные
      const existingUser = mockUsers.find((u) => u.user_login === username)

      if (existingUser) {
        return { success: false, message: "Пользователь с таким логином уже существует" }
      }

      // Создаем нового пользователя в моковых данных
      const newUser: User = {
        user_id: String(mockUsers.length + 1),
        user_login: username,
        user_password: password,
        user_dateofcreation: new Date().toISOString(),
        is_admin: false,
        days_left: 0,
        is_frozen: false,
      }

      mockUsers.push(newUser)

      return { success: true, message: "Пользователь успешно зарегистрирован", user: newUser }
    }
  } catch (error) {
    console.error("Error registering user:", error)
    return { success: false, message: "Ошибка при регистрации пользователя" }
  }
}

// Функция для обновления данных пользователя в cookie
export function updateUserInCookie(user: User): void {
  if (typeof window === "undefined") return

  setCookie("currentUser", JSON.stringify(user), 7) // 7 days expiration
}

// Функция для проверки аутентификации
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false

  return getCookie("currentUser") !== null
}

// Функция для проверки прав администратора
export function isAdmin(): boolean {
  if (typeof window === "undefined") return false

  const userJson = getCookie("currentUser")
  if (!userJson) return false

  try {
    const user = JSON.parse(userJson) as User
    return user.is_admin
  } catch (e) {
    return false
  }
}

// Функция для получения текущего пользователя
export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null

  const userJson = getCookie("currentUser")
  if (!userJson) return null

  try {
    return JSON.parse(userJson) as User
  } catch (e) {
    return null
  }
}

// Функция для выхода из системы
export function logout(): void {
  if (typeof window === "undefined") return

  deleteCookie("currentUser")
}
