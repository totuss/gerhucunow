import { Suspense } from "react"
import { UserStatistics } from "@/components/user-statistics"
import { UserSearch } from "@/components/user-search"
import { DataTable } from "@/components/data-table"
import { getUsers, formatDate, formatDaysLeft } from "@/lib/users"
import { Button } from "@/components/ui/button"
import { Plus, Download } from "lucide-react"
import Link from "next/link"

interface AdminPageProps {
  searchParams: { search?: string }
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const users = await getUsers(searchParams.search)

  // Define the columns for the user table
  const columns = [
    {
      accessorKey: "user_id",
      header: "ID",
    },
    {
      accessorKey: "user_login",
      header: "Логин",
    },
    {
      accessorKey: "user_dateofcreation",
      header: "Дата создания",
      cell: ({ row }: any) => formatDate(row.original.user_dateofcreation),
    },
    {
      accessorKey: "days_left",
      header: "Подписка",
      cell: ({ row }: any) => formatDaysLeft(row.original.days_left),
    },
    {
      accessorKey: "is_admin",
      header: "Админ",
      cell: ({ row }: any) => (row.original.is_admin ? "Да" : "Нет"),
    },
    {
      accessorKey: "is_frozen",
      header: "Заморожен",
      cell: ({ row }: any) => (row.original.is_frozen ? "Да" : "Нет"),
    },
    {
      id: "actions",
      header: "Действия",
      cell: ({ row }: any) => (
        <div className="flex space-x-2">
          <Link href={`/admin/edit/${row.original.user_id}`}>
            <Button variant="outline" size="sm">
              Изменить
            </Button>
          </Link>
        </div>
      ),
    },
  ]

  return (
    <div className="container mx-auto py-10 space-y-8">
      <h1 className="text-3xl font-bold">Администрирование пользователей</h1>

      <Suspense fallback={<div>Загрузка статистики...</div>}>
        <UserStatistics />
      </Suspense>

      <div className="flex justify-between items-center">
        <UserSearch />
        <div className="flex space-x-2">
          <Link href="/admin/add">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Добавить пользователя
            </Button>
          </Link>
          <Link href="/admin/export">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Экспорт
            </Button>
          </Link>
        </div>
      </div>

      <DataTable columns={columns} data={users} />
    </div>
  )
}
