"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AdminPanel from "@/components/admin-panel"
import type { User } from "@/lib/types"
import { getAllUsers, updateUser, deleteUser, addUser } from "@/lib/users"

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in and is admin
    const userJson = localStorage.getItem("currentUser")

    if (!userJson) {
      router.push("/login")
      return
    }

    const user = JSON.parse(userJson) as User

    if (!user.isAdmin) {
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
      const user = users.find((u) => u.username === username)
      if (user) {
        const updatedDaysLeft = Math.max(0, user.daysLeft + days)
        await updateUser(username, { daysLeft: updatedDaysLeft })

        // Update local state
        setUsers(users.map((u) => (u.username === username ? { ...u, daysLeft: updatedDaysLeft } : u)))
      }
    } catch (error) {
      console.error("Error updating subscription:", error)
    }
  }

  const handleUpdateUser = async (originalUsername: string, updatedUser: Partial<User>) => {
    try {
      await updateUser(originalUsername, updatedUser)
      await loadUsers() // Reload all users to get fresh data
    } catch (error) {
      console.error("Error updating user:", error)
    }
  }

  const handleDeleteUser = async (username: string) => {
    try {
      await deleteUser(username)
      // Update local state
      setUsers(users.filter((u) => u.username !== username))
    } catch (error) {
      console.error("Error deleting user:", error)
    }
  }

  const handleAddUser = async (newUser: User) => {
    try {
      await addUser(newUser)
      // Reload users to get the new user
      await loadUsers()
    } catch (error) {
      console.error("Error adding user:", error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    router.push("/login")
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
