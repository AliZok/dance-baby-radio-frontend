const STORAGE_KEY = 'dbr_admin_auth'
const ADMIN_PASSWORD = 'alifreeman1988'

export const useAdminAuth = () => {
  const isAuthenticated = useState('admin-authenticated', () => false)
  const isReady = useState('admin-auth-ready', () => false)

  const init = () => {
    if (import.meta.client) {
      isAuthenticated.value = sessionStorage.getItem(STORAGE_KEY) === '1'
    }
    isReady.value = true
  }

  const login = (password) => {
    if (password === ADMIN_PASSWORD) {
      if (import.meta.client) {
        sessionStorage.setItem(STORAGE_KEY, '1')
      }
      isAuthenticated.value = true
      return true
    }
    return false
  }

  const logout = () => {
    if (import.meta.client) {
      sessionStorage.removeItem(STORAGE_KEY)
    }
    isAuthenticated.value = false
  }

  return {
    isAuthenticated,
    isReady,
    init,
    login,
    logout,
  }
}
