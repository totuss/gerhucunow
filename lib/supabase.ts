import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Используем доступные переменные окружения
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

// Проверяем, что URL и ключи доступны
if (!supabaseUrl) {
  console.error("Supabase URL не настроен в переменных окружения")
}

if (!supabaseAnonKey) {
  console.error("Supabase Anon Key не настроен в переменных окружения")
}

// Создаем клиент Supabase для использования на стороне сервера
export const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey)

// Создаем клиент Supabase для использования на стороне клиента
export const supabaseClient = createSupabaseClient(supabaseUrl, supabaseAnonKey)

// Функция для получения клиента Supabase на стороне клиента
let clientSingleton: ReturnType<typeof createSupabaseClient> | null = null

export function getSupabaseClient() {
  if (typeof window === "undefined") {
    // Серверная сторона - используем админский клиент
    return supabaseAdmin
  }

  // Клиентская сторона - используем синглтон для предотвращения множественных инстансов
  if (!clientSingleton) {
    clientSingleton = createSupabaseClient(supabaseUrl, supabaseAnonKey)
  }

  return clientSingleton
}

// Export a createClient function for compatibility with existing code
export function createClient() {
  return getSupabaseClient()
}
