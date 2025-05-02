"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff, Search, Info, Snowflake, Sun } from "lucide-react"
import type { User } from "@/lib/types"
import { formatTimeLeft, formatDate } from "@/lib/types"

interface AdminPanelProps {
  users: User[]
  onUpdateSubscription: (username: string, days: number) => void
  onUpdateUser: (originalUsername: string, updatedUser: Partial<User>) => void
  onDeleteUser: (username: string) => void
  onAddUser: (user: Omit<User, "user_id" | "user_dateofcreation">) => void
  onSearchUser: (query: string) => void
  onToggleFreezeAll: (freeze: boolean) => void
  onLogout: () => void
  isFreezeAllActive: boolean
}

export default function AdminPanel({
  users,
  onUpdateSubscription,
  onUpdateUser,
  onDeleteUser,
  onAddUser,
  onSearchUser,
  onToggleFreezeAll,
  onLogout,
  isFreezeAllActive,
}: AdminPanelProps) {
  const [selectedUsername, setSelectedUsername] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showPasswordField, setShowPasswordField] = useState(false)
  const [showAddUser, setShowAddUser] = useState(false)
  const [showEditUser, setShowEditUser] = useState(false)

  // New user form state
  const [newUser, setNewUser] = useState({
    user_login: "",
    user_password: "",
    days: 0,
    hours: 0,
    is_admin: false,
  })

  // Edit user form state
  const [editUser, setEditUser] = useState({
    originalUsername: "",
    user_id: "",
    user_login: "",
    user_password: "",
    user_dateofcreation: "",
    days: 0,
    hours: 0,
    is_admin: false,
    is_frozen: false,
  })

  const handleAddUser = () => {
    // Calculate total days including hours
    const totalDays = newUser.days + newUser.hours / 24

    // Create new user object
    const user = {
      user_login: newUser.user_login,
      user_password: newUser.user_password,
      is_admin: newUser.is_admin,
      days_left: totalDays,
    }

    // Add user
    onAddUser(user)
    setShowAddUser(false)

    // Reset form
    setNewUser({
      user_login: "",
      user_password: "",
      days: 0,
      hours: 0,
      is_admin: false,
    })
  }

  const handleEditUser = () => {
    // Calculate total days including hours
    const totalDays = editUser.days + editUser.hours / 24

    // Create updated user object
    const updatedUser: Partial<User> = {
      user_login: editUser.user_login,
      user_password: editUser.user_password,
      days_left: totalDays,
      is_admin: editUser.is_admin,
      is_frozen: editUser.is_frozen,
    }

    // Update user
    onUpdateUser(editUser.originalUsername, updatedUser)
    setShowEditUser(false)
  }

  const handleDeleteUser = () => {
    onDeleteUser(selectedUsername)
    setShowDeleteConfirm(false)
  }

  const handleRemoveSubscription = (username: string) => {
    const user = users.find((u) => u.user_login === username)
    if (user) {
      onUpdateSubscription(username, -user.days_left)
    }
  }

  const handleSelectUser = () => {
    const user = users.find((u) => u.user_login === selectedUsername)
    if (user) {
      openUserInfo(user)
    }
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearchUser(searchQuery.trim())
    }
  }

  const openUserInfo = (user: User) => {
    // Convert days to days and hours
    const days = Math.floor(user.days_left)
    const hours = Math.floor((user.days_left - days) * 24)

    setEditUser({
      originalUsername: user.user_login,
      user_id: user.user_id,
      user_login: user.user_login,
      user_password: user.user_password || "",
      user_dateofcreation: user.user_dateofcreation,
      days,
      hours,
      is_admin: user.is_admin,
      is_frozen: user.is_frozen || false,
    })
    setShowEditUser(true)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[rgb(23,23,24)] text-black dark:text-white transition-colors duration-200">
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-3xl font-bold">qTools Admin</h1>
          <Button onClick={onLogout} variant="outline" className="dark:border-[rgb(45,45,48)] dark:text-gray-200">
            Выйти
          </Button>
        </div>

        <Separator className="my-4 dark:bg-[rgb(45,45,48)]" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="md:col-span-2 dark:bg-[rgb(32,32,35)] dark:border-[rgb(45,45,48)]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Пользователи</CardTitle>
              <Button
                onClick={() => onToggleFreezeAll(!isFreezeAllActive)}
                variant="outline"
                className={`flex items-center gap-2 ${isFreezeAllActive ? "text-blue-500 dark:text-blue-400" : ""}`}
              >
                {isFreezeAllActive ? (
                  <>
                    <Sun className="h-4 w-4" />
                    Разморозить всех
                  </>
                ) : (
                  <>
                    <Snowflake className="h-4 w-4" />
                    Заморозить всех
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-[rgb(45,45,48)]">
                    <TableHead className="dark:text-gray-300">ID</TableHead>
                    <TableHead className="dark:text-gray-300">Логин</TableHead>
                    <TableHead className="dark:text-gray-300">Подписка</TableHead>
                    <TableHead className="dark:text-gray-300">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.user_id} className="dark:border-[rgb(45,45,48)]">
                      <TableCell className="font-medium dark:text-white">{user.user_id}</TableCell>
                      <TableCell className="font-medium dark:text-white">
                        {user.user_login}
                        {user.is_admin && <span className="ml-2 text-xs text-blue-500">(админ)</span>}
                        {user.is_frozen && <span className="ml-2 text-xs text-blue-500">(заморожен)</span>}
                      </TableCell>
                      <TableCell className="dark:text-white">
                        {user.days_left > 0 ? (
                          formatTimeLeft(user.days_left)
                        ) : (
                          <span className="text-red-500">Истекла</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            onClick={() => openUserInfo(user)}
                            className="dark:bg-[rgb(40,40,45)] dark:hover:bg-[rgb(50,50,55)] dark:text-white"
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => onUpdateSubscription(user.user_login, 7)}
                            className="dark:bg-[rgb(40,40,45)] dark:hover:bg-[rgb(50,50,55)] dark:text-white"
                          >
                            +7д
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => onUpdateSubscription(user.user_login, -1)}
                            variant="outline"
                            className="dark:border-[rgb(45,45,48)] dark:text-gray-200"
                          >
                            -1д
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedUsername(user.user_login)
                              setShowDeleteConfirm(true)
                            }}
                            variant="destructive"
                            className="dark:bg-red-700 dark:hover:bg-red-800"
                          >
                            Удалить
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Button
                onClick={() => setShowAddUser(true)}
                className="mt-4 dark:bg-[rgb(40,40,45)] dark:hover:bg-[rgb(50,50,55)] dark:text-white"
              >
                Добавить пользователя
              </Button>
            </CardContent>
          </Card>

          <Card className="dark:bg-[rgb(32,32,35)] dark:border-[rgb(45,45,48)]">
            <CardHeader>
              <CardTitle>Управление</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="search" className="dark:text-white">
                    Поиск по ID или логину
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="dark:bg-[rgb(40,40,45)] dark:border-[rgb(45,45,48)] dark:text-white"
                      placeholder="Введите ID или логин"
                    />
                    <Button onClick={handleSearch} className="px-3">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Separator className="my-4 dark:bg-[rgb(45,45,48)]" />

                <div className="space-y-2">
                  <Label htmlFor="username" className="dark:text-white">
                    Логин пользователя
                  </Label>
                  <Input
                    id="username"
                    value={selectedUsername}
                    onChange={(e) => setSelectedUsername(e.target.value)}
                    className="dark:bg-[rgb(40,40,45)] dark:border-[rgb(45,45,48)] dark:text-white"
                  />
                </div>
                <Button onClick={handleSelectUser} className="w-full">
                  Выбрать пользователя
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="dark:bg-[rgb(32,32,35)] dark:border-[rgb(45,45,48)]">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Подтверждение удаления</DialogTitle>
            <DialogDescription className="dark:text-gray-300">
              Вы уверены, что хотите удалить пользователя <span className="font-medium">{selectedUsername}</span>? Это
              действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent className="dark:bg-[rgb(32,32,35)] dark:border-[rgb(45,45,48)]">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Добавить пользователя</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-username" className="dark:text-white">
                Логин
              </Label>
              <Input
                id="new-username"
                value={newUser.user_login}
                onChange={(e) => setNewUser({ ...newUser, user_login: e.target.value })}
                className="dark:bg-[rgb(40,40,45)] dark:border-[rgb(45,45,48)] dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password" className="dark:text-white">
                Пароль
              </Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPasswordField ? "text" : "password"}
                  value={newUser.user_password}
                  onChange={(e) => setNewUser({ ...newUser, user_password: e.target.value })}
                  className="dark:bg-[rgb(40,40,45)] dark:border-[rgb(45,45,48)] dark:text-white pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPasswordField(!showPasswordField)}
                >
                  {showPasswordField ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="dark:text-white">Время подписки</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="new-days" className="text-xs dark:text-gray-300">
                    Дни
                  </Label>
                  <Input
                    id="new-days"
                    type="number"
                    min="0"
                    value={newUser.days}
                    onChange={(e) => setNewUser({ ...newUser, days: Number.parseInt(e.target.value) || 0 })}
                    className="dark:bg-[rgb(40,40,45)] dark:border-[rgb(45,45,48)] dark:text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="new-hours" className="text-xs dark:text-gray-300">
                    Часы
                  </Label>
                  <Input
                    id="new-hours"
                    type="number"
                    min="0"
                    max="23"
                    value={newUser.hours}
                    onChange={(e) => setNewUser({ ...newUser, hours: Number.parseInt(e.target.value) || 0 })}
                    className="dark:bg-[rgb(40,40,45)] dark:border-[rgb(45,45,48)] dark:text-white"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="new-is-admin"
                checked={newUser.is_admin}
                onChange={(e) => setNewUser({ ...newUser, is_admin: e.target.checked })}
                className="rounded dark:bg-[rgb(40,40,45)] dark:border-[rgb(45,45,48)]"
              />
              <Label htmlFor="new-is-admin" className="dark:text-white">
                Администратор
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddUser}>Добавить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditUser} onOpenChange={setShowEditUser}>
        <DialogContent className="dark:bg-[rgb(32,32,35)] dark:border-[rgb(45,45,48)]">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Информация о пользователе</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs dark:text-gray-400">ID пользователя</Label>
                <div className="font-medium dark:text-white">{editUser.user_id}</div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs dark:text-gray-400">Дата создания</Label>
                <div className="font-medium dark:text-white">
                  {editUser.user_dateofcreation ? formatDate(editUser.user_dateofcreation) : "Нет данных"}
                </div>
              </div>
            </div>

            <Separator className="my-2 dark:bg-[rgb(45,45,48)]" />

            <div className="space-y-2">
              <Label htmlFor="edit-username" className="dark:text-white">
                Логин
              </Label>
              <Input
                id="edit-username"
                value={editUser.user_login}
                onChange={(e) => setEditUser({ ...editUser, user_login: e.target.value })}
                className="dark:bg-[rgb(40,40,45)] dark:border-[rgb(45,45,48)] dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password" className="dark:text-white">
                Пароль
              </Label>
              <div className="relative">
                <Input
                  id="edit-password"
                  type={showPasswordField ? "text" : "password"}
                  value={editUser.user_password}
                  onChange={(e) => setEditUser({ ...editUser, user_password: e.target.value })}
                  className="dark:bg-[rgb(40,40,45)] dark:border-[rgb(45,45,48)] dark:text-white pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPasswordField(!showPasswordField)}
                >
                  {showPasswordField ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="dark:text-white">Оставшееся время</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="edit-days" className="text-xs dark:text-gray-300">
                    Дни
                  </Label>
                  <Input
                    id="edit-days"
                    type="number"
                    min="0"
                    value={editUser.days}
                    onChange={(e) => setEditUser({ ...editUser, days: Number.parseInt(e.target.value) || 0 })}
                    className="dark:bg-[rgb(40,40,45)] dark:border-[rgb(45,45,48)] dark:text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-hours" className="text-xs dark:text-gray-300">
                    Часы
                  </Label>
                  <Input
                    id="edit-hours"
                    type="number"
                    min="0"
                    max="23"
                    value={editUser.hours}
                    onChange={(e) => setEditUser({ ...editUser, hours: Number.parseInt(e.target.value) || 0 })}
                    className="dark:bg-[rgb(40,40,45)] dark:border-[rgb(45,45,48)] dark:text-white"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-is-admin"
                checked={editUser.is_admin}
                onChange={(e) => setEditUser({ ...editUser, is_admin: e.target.checked })}
                className="rounded dark:bg-[rgb(40,40,45)] dark:border-[rgb(45,45,48)]"
              />
              <Label htmlFor="edit-is-admin" className="dark:text-white">
                Администратор
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-is-frozen"
                checked={editUser.is_frozen}
                onChange={(e) => setEditUser({ ...editUser, is_frozen: e.target.checked })}
                className="rounded dark:bg-[rgb(40,40,45)] dark:border-[rgb(45,45,48)]"
              />
              <Label htmlFor="edit-is-frozen" className="dark:text-white">
                Заморозить подписку
              </Label>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 dark:border-[rgb(45,45,48)] dark:text-red-400"
                onClick={() => {
                  handleRemoveSubscription(editUser.originalUsername)
                  setShowEditUser(false)
                }}
              >
                Убрать подписку
              </Button>
              <Button
                variant="destructive"
                className="flex-1 dark:bg-red-700 dark:hover:bg-red-800"
                onClick={() => {
                  setShowEditUser(false)
                  setSelectedUsername(editUser.originalUsername)
                  setShowDeleteConfirm(true)
                }}
              >
                Удалить аккаунт
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEditUser}>Обновить данные</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
