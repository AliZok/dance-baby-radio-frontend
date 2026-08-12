export default defineEventHandler((event) => {
  deleteCookie(event, "dbr_admin_auth", { path: "/" })
  return { ok: true }
})
