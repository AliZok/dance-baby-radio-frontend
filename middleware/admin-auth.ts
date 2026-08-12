export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.client) {
    const unlocked = sessionStorage.getItem("dbr_admin_auth") === "1"
    if (unlocked) return
  }

  try {
    const status = await $fetch<{ authenticated: boolean }>("/api/admin/status")
    if (status.authenticated) {
      if (import.meta.client) {
        sessionStorage.setItem("dbr_admin_auth", "1")
      }
      return
    }
  } catch {
    // API unavailable (e.g. static host) — fall through to page gate
  }
})
