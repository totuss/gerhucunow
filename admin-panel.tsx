"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { User } from "./types"

interface AdminPanelProps {
  users: User[]
  onUpdateSubscription: (username: string, days: number) => void
  onLogout: () => void
}

export default function AdminPanel({ users, onUpdateSubscription, onLogout }: AdminPanelProps) {
  const [username, setUsername] = useState("")
  const [days, setDays] = useState("")

  const handleAddDays = () => {
    if (!username || !days) return

    const daysNum = Number.parseInt(days)
    if (isNaN(daysNum)) return

    onUpdateSubscription(username, daysNum)
    setUsername("")
    setDays("")
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[rgb(23,23,24)] text-black dark:text-white transition-colors duration-200">
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">qTools Admin</h1>
          <Button onClick={onLogout} variant="outline" className="dark:border-[rgb(45,45,48)] dark:text-gray-200">
            Выйти
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="md:col-span-2 dark:bg-[rgb(32,32,35)] dark:border-[rgb(45,45,48)]">
            <CardHeader>
              <CardTitle>Пользователи</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-[rgb(45,45,48)]">
                    <TableHead className="dark:text-gray-300">Логин</TableHead>
                    <TableHead className="dark:text-gray-300">Оставшееся время</TableHead>
                    <TableHead className="dark:text-gray-300">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.username} className="dark:border-[rgb(45,45,48)]">
                      <TableCell className="font-medium dark:text-white">{user.username}</TableCell>
                      <TableCell className="dark:text-white">
                        {user.daysLeft > 0 ? `${user.daysLeft} дней` : <span className="text-red-500">Истекла</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => onUpdateSubscription(user.username, 30)}
                            className="dark:bg-[rgb(40,40,45)] dark:hover:bg-[rgb(50,50,55)] dark:text-white"
                          >
                            +30 дней
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => onUpdateSubscription(user.username, -5)}
                            variant="outline"
                            className="dark:border-[rgb(45,45,48)] dark:text-gray-200"
                          >
                            -5 дней
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="dark:bg-[rgb(32,32,35)] dark:border-[rgb(45,45,48)]">
            <CardHeader>
              <CardTitle>Управление подпиской</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="dark:text-white">
                    Логин пользователя
                  </Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="dark:bg-[rgb(40,40,45)] dark:border-[rgb(45,45,48)] dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="days" className="dark:text-white">
                    Количество дней
                  </Label>
                  <Input
                    id="days"
                    type="number"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    className="dark:bg-[rgb(40,40,45)] dark:border-[rgb(45,45,48)] dark:text-white"
                  />
                </div>
                <Button onClick={handleAddDays} className="w-full">
                  Обновить подписку
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
