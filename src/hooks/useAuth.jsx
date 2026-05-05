import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [theme, setThemeState] = useState('dark')

  async function loadProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
    if (data?.theme) {
      setThemeState(data.theme)
      document.documentElement.setAttribute('data-theme', data.theme)
    } else {
      document.documentElement.setAttribute('data-theme', 'dark')
    }
    setLoading(false)
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark')
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setThemeState(next)
    document.documentElement.setAttribute('data-theme', next)
    if (profile?.id) {
      await supabase.from('profiles').update({ theme: next }).eq('id', profile.id)
    }
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, theme, toggleTheme, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
