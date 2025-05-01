import type { User } from "./types"
import { getSupabaseClient } from "./supabase"
import { getCookie, deleteCookie } from "./cookies"

// Функция для аутентификации пользователя
export async function getUserByCredentials(username: string, password: string): Promise<User | null> {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("user_login", username)
      .eq("user_password", password)
      .single()

    if (error || !data) {
      console.error("Error getting user by credentials:", error)
      return null
    }

    // Преобразуем данные из БД в формат User
    const user: User = {
      user_id: data.user_id,
      user_login: data.user_login,
      user_dateofcreation: data.user_dateofcreation,
      is_admin: data.is_admin,
      days_left: Number(data.days_left),
    }

    return user
  } catch (error) {
    console.error("Error getting user by credentials:", error)
    return null
  }
}

// Функция для регистрации нового пользователя
export async function registerUser(
  username: string,
  password: string,
): Promise<{ success: boolean; message: string; user?: User }> {
  try {
    const supabase = getSupabaseClient()

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
        },
      ])
      .select()

    if (error || !data || data.length === 0) {
      console.error("Error registering user:", error)
      return { success: false, message: "Ошибка при регистрации пользователя" }
    }

    // Преобразуем данные из БД в формат User
    const user: User = {
      user_id: data[0].user_id,
      user_login: data[0].user_login,
      user_dateofcreation: data[0].user_dateofcreation,
      is_admin: data[0].is_admin,
      days_left: Number(data[0].days_left),
    }

    return { success: true, message: "Пользователь успешно зарегистрирован", user }
  } catch (error) {
    console.error("Error registering user:", error)
    return { success: false, message: "Ошибка при регистрации пользователя" }
  }
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

  const user = JSON.parse(userJson) as User
  return user.is_admin
}

// Функция для получения текущего пользователя
export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null

  const userJson = getCookie("currentUser")
  if (!userJson) return null

  return JSON.parse(userJson) as User
}

// Функция для выхода из системы
export function logout(): void {
  if (typeof window === "undefined") return

  deleteCookie("currentUser")
}
