"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase"
import { Download } from "lucide-react"
import { formatDate, formatDaysLeft } from "@/lib/users"

export default function ExportPage() {
  const [includePasswords, setIncludePasswords] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("users").select("*")

      if (error) throw error

      // Format the data for export
      const formattedData = data.map((user) => ({
        ID: user.user_id,
        Логин: user.user_login,
        Пароль: includePasswords ? user.user_password : "*******",
        "Дата создания": formatDate(user.user_dateofcreation),
        Подписка: formatDaysLeft(user.days_left),
        Админ: user.is_admin ? "Да" : "Нет",
        Заморожен: user.is_frozen ? "Да" : "Нет",
      }))

      // Convert to CSV
      const headers = Object.keys(formattedData[0]).join(",")
      const rows = formattedData.map((row) =>
        Object.values(row)
          .map((value) => (typeof value === "string" && value.includes(",") ? `"${value}"` : value))
          .join(","),
      )
      const csv = [headers, ...rows].join("\n")

      // Create and download file
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `users_export_${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Export error:", error)
      alert("Ошибка при экспорте пользователей. Проверьте консоль для деталей.")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="container mx-auto py-10 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Экспорт пользователей</CardTitle>
          <CardDescription>Экспортируйте список пользователей в CSV файл</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includePasswords"
              checked={includePasswords}
              onCheckedChange={(checked) => setIncludePasswords(checked as boolean)}
            />
            <label
              htmlFor="includePasswords"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Включить пароли в экспорт
            </label>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleExport} disabled={exporting} className="w-full">
            {exporting ? (
              <span>Экспортирую...</span>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Экспортировать
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
