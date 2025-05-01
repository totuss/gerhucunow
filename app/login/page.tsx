"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import LoginPage from "@/components/login-page"
import { getUserByCredentials } from "@/lib/auth"
import { setCookie } from "@/lib/cookies"

export default function LoginRoute() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (username: string, password: string) => {
    try {
      setIsLoading(true)
      setError("")

      const user = await getUserByCredentials(username, password)

      if (user) {
        // Store user info in cookie instead of localStorage
        setCookie("currentUser", JSON.stringify(user), 7) // 7 days expiration

        // Redirect based on user role
        if (user.isAdmin) {
          router.push("/admin")
        } else {
          if (user.daysLeft <= 0) {
            router.push("/expired")
          } else {
            router.push("/panel")
          }
        }
      } else {
        setError("Неверный логин или пароль")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("Ошибка при входе в систему")
    } finally {
      setIsLoading(false)
    }
  }

  return <LoginPage onLogin={handleLogin} initialError={error} isLoading={isLoading} />
}
