export default defineEventHandler((event) => {
  const cookie = getCookie(event, "dbr_admin_auth")
  return { authenticated: cookie === "1" }
})
