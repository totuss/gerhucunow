// Helper functions for working with cookies

// Set a cookie with a specified expiration time in days
export function setCookie(name: string, value: string, days: number): void {
  if (typeof window === "undefined") return

  const date = new Date()
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
  const expires = `expires=${date.toUTCString()}`
  document.cookie = `${name}=${value};${expires};path=/;SameSite=Strict`
}

// Get a cookie by name
export function getCookie(name: string): string | null {
  if (typeof window === "undefined") return null

  const nameEQ = `${name}=`
  const ca = document.cookie.split(";")
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === " ") c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}

// Delete a cookie by name
export function deleteCookie(name: string): void {
  if (typeof window === "undefined") return

  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Strict`
}
