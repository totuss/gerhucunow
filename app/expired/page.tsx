"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/auth"

export default function ExpiredPage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const user = getCurrentUser()

    if (!user) {
      router.push("/login")
      return
    }

    // If subscription is not expired or user is admin, redirect
    if (user.daysLeft > 0) {
      router.push("/panel")
    } else if (user.isAdmin) {
      router.push("/admin")
    }
  }, [router])

  const handleLogout = () => {
    // Use the logout function from auth.ts
    import("@/lib/auth").then(({ logout }) => {
      logout()
      router.push("/login")
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[rgb(23,23,24)] text-black dark:text-white transition-colors duration-200">
      <Card className="w-[400px] dark:bg-[rgb(32,32,35)] dark:border-[rgb(45,45,48)]">
        <CardHeader>
          <CardTitle className="text-2xl text-center">qTools</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">Ваша подписка истекла.</p>
          <p className="mb-6">
            Обновите подписку. Тг: <span className="font-medium">@zlepki</span>
          </p>
          <Button onClick={handleLogout}>Выйти</Button>
        </CardContent>
      </Card>
    </div>
  )
}
