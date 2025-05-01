import { createClient } from "@supabase/supabase-js"

// Создаем клиент Supabase для использования на стороне сервера
export const supabaseAdmin = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")

// Создаем клиент Supabase для использования на стороне клиента
export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
)

// Функция для получения клиента Supabase на стороне клиента
let clientSingleton: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (typeof window === "undefined") {
    // Серверная сторона - используем админский клиент
    return supabaseAdmin
  }

  // Клиентская сторона - используем синглтон для предотвращения множественных инстансов
  if (!clientSingleton) {
    clientSingleton = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    )
  }

  return clientSingleton
}
