import type { User } from "./types"
import { getUsers } from "./users"

// Function to get user by credentials
export async function getUserByCredentials(username: string, password: string): Promise<User | null> {
  try {
    const users = await getUsers()
    return users.find((user) => user.username === username && user.password === password) || null
  } catch (error) {
    console.error("Error getting user by credentials:", error)
    return null
  }
}

// Function to check if user is authenticated
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false

  return localStorage.getItem("currentUser") !== null
}

// Function to check if user is admin
export function isAdmin(): boolean {
  if (typeof window === "undefined") return false

  const userJson = localStorage.getItem("currentUser")
  if (!userJson) return false

  const user = JSON.parse(userJson) as User
  return user.isAdmin
}

// Function to get current user
export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null

  const userJson = localStorage.getItem("currentUser")
  if (!userJson) return null

  return JSON.parse(userJson) as User
}

// Function to logout
export function logout(): void {
  if (typeof window === "undefined") return

  localStorage.removeItem("currentUser")
}
