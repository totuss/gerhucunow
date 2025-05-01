"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import LoginPage from "@/components/login-page"
import { getUserByCredentials } from "@/lib/auth"

export default function LoginRoute() {
  const router = useRouter()
  const [error, setError] = useState("")

  const handleLogin = async (username: string, password: string) => {
    try {
      const user = await getUserByCredentials(username, password)

      if (user) {
        // Store user info in localStorage or sessionStorage
        localStorage.setItem("currentUser", JSON.stringify(user))

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
      setError("Ошибка при входе в систему")
      console.error("Login error:", error)
    }
  }

  return <LoginPage onLogin={handleLogin} initialError={error} />
}
