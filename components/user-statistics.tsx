import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserStats } from "@/lib/users"

export async function UserStatistics() {
  const stats = await getUserStats()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Всего пользователей</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUsers}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Активные пользователи</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeUsers}</div>
          <p className="text-xs text-muted-foreground">С положительным балансом дней</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Замороженные аккаунты</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.frozenUsers}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Новые пользователи</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.newUsers}</div>
          <p className="text-xs text-muted-foreground">За последние 24 часа</p>
        </CardContent>
      </Card>
    </div>
  )
}
