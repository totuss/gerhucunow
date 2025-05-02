"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { createUser } from "@/lib/users"
import { useRouter } from "next/navigation"

export default function AddUserPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    user_login: "",
    user_password: "",
    days_left: 0,
    is_admin: false,
    is_frozen: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number.parseFloat(value) : value,
    }))
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (!formData.user_login || !formData.user_password) {
        throw new Error("Логин и пароль обязательны")
      }

      const result = await createUser({
        user_login: formData.user_login,
        user_password: formData.user_password,
        days_left: formData.days_left,
        is_admin: formData.is_admin,
        is_frozen: formData.is_frozen,
      })

      if (!result) {
        throw new Error("Не удалось создать пользователя")
      }

      router.push("/admin")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-10 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Добавить пользователя</CardTitle>
          <CardDescription>Создайте нового пользователя в системе</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}

            <div className="space-y-2">
              <Label htmlFor="user_login">Логин</Label>
              <Input id="user_login" name="user_login" value={formData.user_login} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user_password">Пароль</Label>
              <Input
                id="user_password"
                name="user_password"
                type="password"
                value={formData.user_password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="days_left">Дней подписки</Label>
              <Input
                id="days_left"
                name="days_left"
                type="number"
                min="0"
                step="0.01"
                value={formData.days_left}
                onChange={handleChange}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_admin"
                checked={formData.is_admin}
                onCheckedChange={(checked) => handleCheckboxChange("is_admin", !!checked)}
              />
              <Label htmlFor="is_admin" className="cursor-pointer">
                Администратор
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_frozen"
                checked={formData.is_frozen}
                onCheckedChange={(checked) => handleCheckboxChange("is_frozen", !!checked)}
              />
              <Label htmlFor="is_frozen" className="cursor-pointer">
                Заморозить аккаунт
              </Label>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Сохранение..." : "Сохранить"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
