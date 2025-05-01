import type { User } from "./types"
import { getSupabaseClient } from "./supabase"

// Функция для получения всех пользователей
export async function getUsers(): Promise<User[]> {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase.from("users").select("*")

    if (error) {
      console.error("Error getting users:", error)
      return []
    }

    // Преобразуем данные из БД в формат User[]
    return data.map((user) => ({
      user_id: user.user_id,
      user_login: user.user_login,
      user_password: user.user_password,
      user_dateofcreation: user.user_dateofcreation,
      is_admin: user.is_admin,
      days_left: Number(user.days_left),
    }))
  } catch (error) {
    console.error("Error getting users:", error)
    return []
  }
}

// Функция для получения пользователя по логину
export async function getUserByUsername(username: string): Promise<User | null> {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase.from("users").select("*").eq("user_login", username).single()

    if (error || !data) {
      console.error("Error getting user by username:", error)
      return null
    }

    // Преобразуем данные из БД в формат User
    return {
      user_id: data.user_id,
      user_login: data.user_login,
      user_password: data.user_password,
      user_dateofcreation: data.user_dateofcreation,
      is_admin: data.is_admin,
      days_left: Number(data.days_left),
    }
  } catch (error) {
    console.error("Error getting user by username:", error)
    return null
  }
}

// Функция для получения всех пользователей
export async function getAllUsers(): Promise<User[]> {
  return getUsers()
}

// Функция для добавления нового пользователя
export async function addUser(user: Omit<User, "user_id" | "user_dateofcreation">): Promise<User | null> {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          user_login: user.user_login,
          user_password: user.user_password,
          is_admin: user.is_admin,
          days_left: user.days_left,
        },
      ])
      .select()

    if (error || !data || data.length === 0) {
      console.error("Error adding user:", error)
      return null
    }

    // Преобразуем данные из БД в формат User
    return {
      user_id: data[0].user_id,
      user_login: data[0].user_login,
      user_password: data[0].user_password,
      user_dateofcreation: data[0].user_dateofcreation,
      is_admin: data[0].is_admin,
      days_left: Number(data[0].days_left),
    }
  } catch (error) {
    console.error("Error adding user:", error)
    return null
  }
}

// Функция для обновления пользователя
export async function updateUser(username: string, updatedFields: Partial<User>): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()

    // Подготавливаем объект с обновляемыми полями
    const updateData: any = {}

    if (updatedFields.user_login) updateData.user_login = updatedFields.user_login
    if (updatedFields.user_password) updateData.user_password = updatedFields.user_password
    if (updatedFields.is_admin !== undefined) updateData.is_admin = updatedFields.is_admin
    if (updatedFields.days_left !== undefined) updateData.days_left = updatedFields.days_left

    const { error } = await supabase.from("users").update(updateData).eq("user_login", username)

    if (error) {
      console.error("Error updating user:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error updating user:", error)
    return false
  }
}

// Функция для удаления пользователя
export async function deleteUser(username: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()

    const { error } = await supabase.from("users").delete().eq("user_login", username)

    if (error) {
      console.error("Error deleting user:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error deleting user:", error)
    return false
  }
}
