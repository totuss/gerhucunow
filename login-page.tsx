"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface LoginPageProps {
  onLogin: (username: string, password: string) => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [showRegister, setShowRegister] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      setError("Пожалуйста, введите логин и пароль")
      return
    }

    setError("")
    onLogin(username, password)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[rgb(23,23,24)] text-black dark:text-white transition-colors duration-200">
      <Card className="w-[350px] dark:bg-[rgb(32,32,35)] dark:border-[rgb(45,45,48)]">
        <CardHeader>
          <CardTitle className="text-2xl text-center">qTools</CardTitle>
          <CardDescription className="text-center dark:text-gray-400">Войдите в свой аккаунт</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="dark:text-white">
                Логин
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="dark:bg-[rgb(40,40,45)] dark:border-[rgb(45,45,48)] dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="dark:text-white">
                Пароль
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="dark:bg-[rgb(40,40,45)] dark:border-[rgb(45,45,48)] dark:text-white"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full">
              Войти
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="flex justify-between w-full">
            <Button
              variant="link"
              onClick={() => setShowForgotPassword(true)}
              className="p-0 h-auto dark:text-gray-300"
            >
              Забыли пароль?
            </Button>
            <Button variant="link" onClick={() => setShowRegister(true)} className="p-0 h-auto dark:text-gray-300">
              Регистрация
            </Button>
          </div>
        </CardFooter>
      </Card>

      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="dark:bg-[rgb(32,32,35)] dark:border-[rgb(45,45,48)]">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Восстановление пароля</DialogTitle>
            <DialogDescription className="dark:text-gray-300">
              Для сброса пароля обратитесь в Telegram: <span className="font-medium">@zlepki</span>
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowForgotPassword(false)}>Закрыть</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={showRegister} onOpenChange={setShowRegister}>
        <DialogContent className="dark:bg-[rgb(32,32,35)] dark:border-[rgb(45,45,48)]">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Регистрация</DialogTitle>
            <DialogDescription className="dark:text-gray-300">
              Для регистрации обратитесь в Telegram: <span className="font-medium">@zlepki</span>
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowRegister(false)}>Закрыть</Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
