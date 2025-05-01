"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AdminPanel from "@/components/admin-panel"
import type { User } from "@/lib/types"
import { getAllUsers, updateUser, deleteUser, addUser } from "@/lib/users"
import { getCurrentUser } from "@/lib/auth"

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in and is admin
    const user = getCurrentUser()

    if (!user) {
      router.push("/login")
      return
    }

    if (!user.is_admin) {
      router.push("/panel")
      return
    }

    // Load all users
    loadUsers()
  }, [router])

  const loadUsers = async () => {
    try {
      const allUsers = await getAllUsers()
      setUsers(allUsers)
      setLoading(false)
    } catch (error) {
      console.error("Error loading users:", error)
    }
  }

  const handleUpdateSubscription = async (username: string, days: number) => {
    try {
      const user = users.find((u) => u.user_login === username)
      if (user) {
        const updatedDaysLeft = Math.max(0, user.days_left + days)
        const success = await updateUser(username, { days_left: updatedDaysLeft })

        if (success) {
          // Update local state
          setUsers(users.map((u) => (u.user_login === username ? { ...u, days_left: updatedDaysLeft } : u)))
        }
      }
    } catch (error) {
      console.error("Error updating subscription:", error)
    }
  }

  const handleUpdateUser = async (originalUsername: string, updatedUser: Partial<User>) => {
    try {
      const success = await updateUser(originalUsername, updatedUser)
      if (success) {
        await loadUsers() // Reload all users to get fresh data
      }
    } catch (error) {
      console.error("Error updating user:", error)
    }
  }

  const handleDeleteUser = async (username: string) => {
    try {
      const success = await deleteUser(username)
      if (success) {
        // Update local state
        setUsers(users.filter((u) => u.user_login !== username))
      }
    } catch (error) {
      console.error("Error deleting user:", error)
    }
  }

  const handleAddUser = async (newUser: Omit<User, "user_id" | "user_dateofcreation">) => {
    try {
      const user = await addUser(newUser)
      if (user) {
        // Reload users to get the new user
        await loadUsers()
      }
    } catch (error) {
      console.error("Error adding user:", error)
    }
  }

  const handleLogout = () => {
    // Use the logout function from auth.ts
    import("@/lib/auth").then(({ logout }) => {
      logout()
      router.push("/login")
    })
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>
  }

  return (
    <AdminPanel
      users={users}
      onUpdateSubscription={handleUpdateSubscription}
      onUpdateUser={handleUpdateUser}
      onDeleteUser={handleDeleteUser}
      onAddUser={handleAddUser}
      onLogout={handleLogout}
    />
  )
}
