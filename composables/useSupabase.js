// composables/useSupabase.js

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://fdveybzxmfvhbznemfpr.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkdmV5Ynp4bWZ2aGJ6bmVtZnByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyNDMzNTAsImV4cCI6MjA1MDgxOTM1MH0.7_RT9A9CeU42u_96c73ADg1KkpQFmGWkQPP1i48V2x4'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Shared across all useSupabase() calls
const currentUser = ref(null)
const authReady = ref(false)
let authListenerBound = false

function translateAuthError(message = '') {
  const msg = message.toLowerCase()

  if (msg.includes('invalid login credentials')) {
    return 'Invalid email or password.'
  }
  if (msg.includes('user already registered') || msg.includes('already been registered')) {
    return 'This email is already registered.'
  }
  if (msg.includes('password should be at least')) {
    return 'Password must be at least 6 characters.'
  }
  if (msg.includes('unable to validate email') || msg.includes('invalid email')) {
    return 'Please enter a valid email address.'
  }
  if (msg.includes('email not confirmed')) {
    return 'Your signup is not complete yet. Please check your email and confirm your account. The confirmation email is sent by Supabase.'
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Too many requests. Please try again in a moment.'
  }

  return message || 'Something went wrong. Please try again.'
}

function setCurrentUser(user) {
  if (!user) {
    currentUser.value = null
    if (import.meta.client) {
      localStorage.removeItem('authToken')
      localStorage.removeItem('userData')
    }
    return
  }

  currentUser.value = {
    id: user.id,
    email: user.email,
  }

  if (import.meta.client) {
    localStorage.setItem('userData', JSON.stringify(currentUser.value))
  }
}

export function useSupabase() {
  const loading = ref(false)
  const authError = ref('')
  const isLoggedIn = computed(() => !!currentUser.value)

  const clearAuthError = () => {
    authError.value = ''
  }

  const saveSession = (session, user) => {
    if (import.meta.client && session?.access_token) {
      localStorage.setItem('authToken', session.access_token)
    }
    setCurrentUser(user)
  }

  const initAuth = async () => {
    if (!import.meta.client) return

    try {
      const { data } = await supabase.auth.getSession()
      if (data.session?.user) {
        saveSession(data.session, data.session.user)
      } else {
        setCurrentUser(null)
      }
    } catch (err) {
      console.error('initAuth failed:', err)
      setCurrentUser(null)
    } finally {
      authReady.value = true
    }

    if (!authListenerBound) {
      authListenerBound = true
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          saveSession(session, session.user)
        } else {
          setCurrentUser(null)
        }
      })
    }
  }

  const signUp = async ({ email, password }) => {
    loading.value = true
    authError.value = ''

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })

      if (error) {
        authError.value = translateAuthError(error.message)
        return { data: null, error: authError.value }
      }

      if (data.session) {
        saveSession(data.session, data.user)
      }

      return { data, error: null }
    } catch (err) {
      authError.value = translateAuthError(err.message)
      return { data: null, error: authError.value }
    } finally {
      loading.value = false
    }
  }

  const signIn = async ({ email, password }) => {
    loading.value = true
    authError.value = ''

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        authError.value = translateAuthError(error.message)
        return { data: null, error: authError.value }
      }

      if (data.user && !data.user.email_confirmed_at && !data.user.confirmed_at) {
        await supabase.auth.signOut()
        authError.value = 'Your signup is not complete yet. Please check your email and confirm your account. The confirmation email is sent by Supabase.'
        return { data: null, error: authError.value }
      }

      saveSession(data.session, data.user)
      return { data, error: null }
    } catch (err) {
      authError.value = translateAuthError(err.message)
      return { data: null, error: authError.value }
    } finally {
      loading.value = false
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setCurrentUser(null)
  }

  return {
    supabase,
    loading,
    authError,
    authReady,
    currentUser,
    isLoggedIn,
    clearAuthError,
    initAuth,
    signUp,
    signIn,
    signOut,
  }
}
