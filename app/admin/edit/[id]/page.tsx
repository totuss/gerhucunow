"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { getUserById, updateUser, deleteUser } from "@/lib/users"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface EditUserPageProps {
  params: {
    id: string
  }
}

export default function EditUserPage({ params }: EditUserPageProps) {
  const userId = Number.parseInt(params.id)
  const router = useRouter()

  const [formData, setFormData] = useState({
    user_login: "",
    user_password: "",
    days_left: 0,
    is_admin: false,
    is_frozen: false,
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await getUserById(userId)
        if (!user) {
          throw new Error("Пользователь не найден")
        }

        setFormData({
          user_login: user.user_login,
          user_password: "", // Don't load the password for security
          days_left: user.days_left,
          is_admin: user.is_admin,
          is_frozen: user.is_frozen,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Неизвестная ошибка")
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [userId])

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
      if (!formData.user_login) {
        throw new Error("Логин обязателен")
      }

      // Only include password in updates if it was changed
      const updates: any = {
        user_login: formData.user_login,
        days_left: formData.days_left,
        is_admin: formData.is_admin,
        is_frozen: formData.is_frozen,
      }

      if (formData.user_password) {
        updates.user_password = formData.user_password
      }

      const result = await updateUser(userId, updates)

      if (!result) {
        throw new Error("Не удалось обновить пользователя")
      }

      router.push("/admin")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    try {
      const success = await deleteUser(userId)

      if (!success) {
        throw new Error("Не удалось удалить пользователя")
      }

      router.push("/admin")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка")
    }
  }

  if (isLoading) {
    return <div className="container mx-auto py-10 flex justify-center">Загрузка...</div>
  }

  return (
    <div className="container mx-auto py-10 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Редактировать пользователя</CardTitle>
          <CardDescription>Измените данные пользователя</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}

            <div className="space-y-2">
              <Label htmlFor="user_login">Логин</Label>
              <Input id="user_login" name="user_login" value={formData.user_login} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user_password">Пароль (оставьте пустым, чтобы не менять)</Label>
              <Input
                id="user_password"
                name="user_password"
                type="password"
                value={formData.user_password}
                onChange={handleChange}
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
          <CardFooter className="flex justify-between">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" type="button">
                  Удалить
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Это действие нельзя отменить. Пользователь будет безвозвратно удален.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Удалить</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Сохранение..." : "Сохранить"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
