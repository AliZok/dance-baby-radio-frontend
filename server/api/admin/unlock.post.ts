export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<{ password?: string }>(event)

  if (!body?.password || body.password !== config.adminPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid password",
    })
  }

  setCookie(event, "dbr_admin_auth", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  })

  return { ok: true }
})
