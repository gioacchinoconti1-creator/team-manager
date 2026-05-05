import { AuthProvider, useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import './index.css'

function AppRouter() {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
      <div style={{ color:'var(--text3)', fontSize:13, fontFamily:'var(--mono)' }}>// caricamento...</div>
    </div>
  )
  return user ? <Dashboard /> : <LoginPage />
}

export default function App() {
  return <AuthProvider><AppRouter /></AuthProvider>
}
