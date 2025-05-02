"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminPanel } from "@/components/admin-panel"
import { getUsers, updateUser, deleteUser, createUser, searchUsers } from "@/lib/users"
import { logout } from "@/lib/auth"
import type { User } from "@/lib/types"

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isFreezeAllActive, setIsFreezeAllActive] = useState(false)

  // Load users on component mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const fetchedUsers = await getUsers()
        setUsers(fetchedUsers)

        // Check if global freeze is active
        const anyFrozen = fetchedUsers.some((user) => !user.is_admin && user.is_frozen)
        setIsFreezeAllActive(anyFrozen)
      } catch (error) {
        console.error("Error loading users:", error)
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [])

  const handleUpdateSubscription = async (username: string, days: number) => {
    try {
      const user = users.find((u) => u.user_login === username)
      if (!user) return

      const newDaysLeft = Math.max(0, Number(user.days_left) + days)

      const updatedUser = await updateUser(user.user_id, { days_left: newDaysLeft })

      if (updatedUser) {
        setUsers((prevUsers) => prevUsers.map((u) => (u.user_id === updatedUser.user_id ? updatedUser : u)))
      }
    } catch (error) {
      console.error("Error updating subscription:", error)
    }
  }

  const handleUpdateUser = async (originalUsername: string, updatedFields: Partial<User>) => {
    try {
      const user = users.find((u) => u.user_login === originalUsername)
      if (!user) return

      const updatedUser = await updateUser(user.user_id, updatedFields)

      if (updatedUser) {
        setUsers((prevUsers) => prevUsers.map((u) => (u.user_id === updatedUser.user_id ? updatedUser : u)))
      }
    } catch (error) {
      console.error("Error updating user:", error)
    }
  }

  const handleDeleteUser = async (username: string) => {
    try {
      const user = users.find((u) => u.user_login === username)
      if (!user) return

      const success = await deleteUser(user.user_id)

      if (success) {
        setUsers((prevUsers) => prevUsers.filter((u) => u.user_id !== user.user_id))
      }
    } catch (error) {
      console.error("Error deleting user:", error)
    }
  }

  const handleAddUser = async (newUser: Omit<User, "user_id" | "user_dateofcreation">) => {
    try {
      const createdUser = await createUser(newUser)

      if (createdUser) {
        setUsers((prevUsers) => [...prevUsers, createdUser])
      }
    } catch (error) {
      console.error("Error adding user:", error)
    }
  }

  const handleSearchUser = async (query: string, type: "id" | "login") => {
    try {
      setLoading(true)
      const searchResults = await searchUsers(query, type)
      setUsers(searchResults)
    } catch (error) {
      console.error("Error searching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleFreezeAll = async (freeze: boolean) => {
    try {
      setLoading(true)

      // Update all non-admin users
      const updatedUsers = []
      for (const user of users) {
        if (!user.is_admin) {
          const updatedUser = await updateUser(user.user_id, { is_frozen: freeze })
          if (updatedUser) {
            updatedUsers.push(updatedUser)
          }
        } else {
          updatedUsers.push(user)
        }
      }

      setUsers(updatedUsers)
      setIsFreezeAllActive(freeze)
    } catch (error) {
      console.error("Error toggling freeze all:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
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
      onSearchUser={handleSearchUser}
      onToggleFreezeAll={handleToggleFreezeAll}
      onLogout={handleLogout}
      isFreezeAllActive={isFreezeAllActive}
    />
  )
}
