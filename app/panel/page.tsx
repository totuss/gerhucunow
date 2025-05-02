"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import FileCheckStatistics from "@/components/file-check-stats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { User } from "@/lib/types"
import { getCurrentUser, logout } from "@/lib/auth"

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

    // Check if user is admin (should be in admin panel)
    if (user.is_admin) {
      router.push("/admin")
      return
    }

    // Check if account is frozen
    if (user.is_frozen) {
      // Stay on this page but show frozen message
      setCurrentUser(user)
      setLoading(false)
      return
    }

    // Check if subscription is expired
    if (user.days_left <= 0) {
      router.push("/expired")
      return
    }

    setCurrentUser(user)
    setLoading(false)
  }, [router])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>
  }

  // If account is frozen, show frozen message
  if (currentUser?.is_frozen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[rgb(23,23,24)] text-black dark:text-white transition-colors duration-200">
        <Card className="w-[400px] dark:bg-[rgb(32,32,35)] dark:border-[rgb(45,45,48)]">
          <CardHeader>
            <CardTitle className="text-2xl text-center">qTools</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">Ваш аккаунт заморожен.</p>
            <p className="mb-6">
              Для разблокировки обратитесь в Telegram: <span className="font-medium">@zlepki</span>
            </p>
            <Button onClick={handleLogout}>Выйти</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <FileCheckStatistics currentUser={currentUser} onLogout={handleLogout} />
}
