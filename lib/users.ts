import { createClient } from "@/lib/supabase"

export type User = {
  user_id: number
  user_login: string
  user_password: string
  user_dateofcreation: string
  is_admin: boolean
  days_left: number
  is_frozen: boolean
}

export type UserStats = {
  totalUsers: number
  activeUsers: number
  frozenUsers: number
  newUsers: number
}

// Format the date to a readable format (DD.MM.YYYY HH:MM)
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const year = date.getFullYear()
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")

  return `${day}.${month}.${year} ${hours}:${minutes}`
}

// Format days_left to show days and hours
export function formatDaysLeft(daysLeft: number): string {
  const days = Math.floor(daysLeft)
  const hours = Math.round((daysLeft - days) * 24)

  if (days === 0) {
    return `${hours} ч.`
  } else if (hours === 0) {
    return `${days} д.`
  } else {
    return `${days} д. ${hours} ч.`
  }
}

export async function getUsers(searchTerm?: string): Promise<User[]> {
  const supabase = createClient()

  let query = supabase.from("users").select("*")

  // Add search filter if search term is provided
  if (searchTerm) {
    query = query.ilike("user_login", `%${searchTerm}%`)
  }

  const { data, error } = await query.order("user_id", { ascending: true })

  if (error) {
    console.error("Error fetching users:", error)
    return []
  }

  return data as User[]
}

export async function getUserStats(): Promise<UserStats> {
  const supabase = createClient()

  // Get total users count
  const { count: totalUsers, error: totalError } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })

  // Get active users (with positive days_left)
  const { count: activeUsers, error: activeError } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .gt("days_left", 0)
    .eq("is_frozen", false)

  // Get frozen users
  const { count: frozenUsers, error: frozenError } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("is_frozen", true)

  // Get new users in the last 24 hours
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const { count: newUsers, error: newError } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .gt("user_dateofcreation", yesterday.toISOString())

  if (totalError || activeError || frozenError || newError) {
    console.error("Error fetching user stats:", { totalError, activeError, frozenError, newError })
  }

  return {
    totalUsers: totalUsers || 0,
    activeUsers: activeUsers || 0,
    frozenUsers: frozenUsers || 0,
    newUsers: newUsers || 0,
  }
}

export async function getUserById(userId: number): Promise<User | null> {
  const supabase = createClient()

  const { data, error } = await supabase.from("users").select("*").eq("user_id", userId).single()

  if (error) {
    console.error("Error fetching user:", error)
    return null
  }

  return data as User
}

export async function createUser(user: Omit<User, "user_id" | "user_dateofcreation">): Promise<User | null> {
  const supabase = createClient()

  const { data, error } = await supabase.from("users").insert([user]).select().single()

  if (error) {
    console.error("Error creating user:", error)
    return null
  }

  return data as User
}

export async function updateUser(
  userId: number,
  updates: Partial<Omit<User, "user_id" | "user_dateofcreation">>,
): Promise<User | null> {
  const supabase = createClient()

  const { data, error } = await supabase.from("users").update(updates).eq("user_id", userId).select().single()

  if (error) {
    console.error("Error updating user:", error)
    return null
  }

  return data as User
}

export async function deleteUser(userId: number): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase.from("users").delete().eq("user_id", userId)

  if (error) {
    console.error("Error deleting user:", error)
    return false
  }

  return true
}
