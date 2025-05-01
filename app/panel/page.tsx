"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import FileCheckStatistics from "@/components/file-check-stats"
import type { User } from "@/lib/types"
import { getCurrentUser } from "@/lib/auth"

export default function PanelPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const user = getCurrentUser()

    if (!user) {
      router.push("/login")
      return
    }

    // Check if subscription is expired
    if (user.daysLeft <= 0) {
      router.push("/expired")
      return
    }

    // Check if user is admin (should be in admin panel)
    if (user.isAdmin) {
      router.push("/admin")
      return
    }

    setCurrentUser(user)
    setLoading(false)
  }, [router])

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

  return <FileCheckStatistics currentUser={currentUser} onLogout={handleLogout} />
}
