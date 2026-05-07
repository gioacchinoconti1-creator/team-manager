import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const err = await signIn(email, password)
    if (err) setError(err.message)
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', background:'var(--bg)' }}>
      <div style={{ width:'100%', maxWidth:380, background:'var(--bg2)', border:'0.5px solid var(--border2)', borderRadius:'var(--radius-lg)', padding:'2rem', boxShadow:'var(--shadow)' }}>
        <div style={{ marginBottom:'2rem', textAlign:'center' }}>
          <img src="/logo-full.jpeg" alt="Strategic Advise" style={{ width:'100%', maxWidth:280, borderRadius:8, marginBottom:16 }} />
          <div style={{ fontSize:12, color:'var(--text3)', fontFamily:'var(--mono)' }}>Accedi al tuo spazio di lavoro</div>
        </div>
        <form onSubmit={handleSubmit}>
          <label style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--mono)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6, display:'block' }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nome@email.com" required
            style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'0.5px solid var(--border2)', background:'var(--bg3)', color:'var(--text)', fontSize:14, marginBottom:'1rem' }} />
          <label style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--mono)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6, display:'block' }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
            style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'0.5px solid var(--border2)', background:'var(--bg3)', color:'var(--text)', fontSize:14, marginBottom:'1rem' }} />
          {error && <div style={{ fontSize:12, color:'var(--red)', marginBottom:'1rem', fontFamily:'var(--mono)' }}>{error}</div>}
          <button type="submit" disabled={loading}
            style={{ width:'100%', padding:'10px 16px', borderRadius:8, border:'none', background:'var(--accent)', color:'white', fontSize:14, fontWeight:500, cursor: loading?'not-allowed':'pointer', opacity: loading?0.7:1 }}>
            {loading ? 'Accesso...' : 'Accedi →'}
          </button>
        </form>
      </div>
    </div>
  )
}
