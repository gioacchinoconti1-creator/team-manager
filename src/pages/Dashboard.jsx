import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import TaskSection from '../components/TaskSection'
import EditorialPlan from '../components/EditorialPlan'
import Sidebar from '../components/Sidebar'

const todayStr = new Date().toISOString().slice(0,10)

const SECTIONS = [
  { id:'overview',   label:'Overview',    icon:'◎' },
  { id:'videomaker', label:'Video Maker', icon:'🎬' },
  { id:'copywriter', label:'Copywriter',  icon:'✍️' },
  { id:'tecnico',    label:'Tecnico',     icon:'⚙️' },
  { id:'social',     label:'Social',      icon:'📱' },
]

function Overview() {
  const [stats, setStats] = useState(null)
  useEffect(() => {
    async function load() {
      const { data: tasks } = await supabase.from('tasks').select('section, done, due_date')
      const { data: editorial } = await supabase.from('editorial_plan').select('stato')
      if (!tasks) return
      const sections = ['videomaker','copywriter','tecnico','social']
      const sectionStats = sections.map(s => {
        const t = tasks.filter(x => x.section === s)
        const late = t.filter(x => !x.done && x.due_date && x.due_date < todayStr).length
        const done = t.filter(x => x.done).length
        return { section: s, total: t.length, done, late }
      })
      setStats({
        sectionStats,
        editorialReady: (editorial||[]).filter(e => e.stato==='pronto').length,
        editorialPublished: (editorial||[]).filter(e => e.stato==='pubblicato').length,
        editorialTotal: (editorial||[]).length,
      })
    }
    load()
  }, [])

  if (!stats) return <div style={{ color:'var(--text3)', fontSize:13, fontFamily:'var(--mono)', padding:'2rem', textAlign:'center' }}>// caricamento...</div>
  const SECTION_LABELS = { videomaker:'Video Maker', copywriter:'Copywriter', tecnico:'Tecnico', social:'Social' }
  return (
    <div>
      <div style={{ fontSize:12, color:'var(--text3)', fontFamily:'var(--mono)', marginBottom:'1.5rem' }}>Panoramica attività — aggiornata ora</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:'1.5rem' }}>
        {stats.sectionStats.map(s => (
          <div key={s.section} style={{ background:'var(--bg2)', borderRadius:'var(--radius-lg)', border:`0.5px solid ${s.late>0?'rgba(244,91,91,0.3)':'var(--border)'}`, padding:'16px' }}>
            <div style={{ fontSize:12, fontWeight:500, color:'var(--text)', marginBottom:10 }}>{SECTION_LABELS[s.section]}</div>
            <div style={{ display:'flex', gap:16 }}>
              <div><div style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--mono)', textTransform:'uppercase', marginBottom:2 }}>Completati</div><div style={{ fontSize:20, fontWeight:600, color: s.done===s.total&&s.total>0?'var(--green)':'var(--text)' }}>{s.done}/{s.total}</div></div>
              <div><div style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--mono)', textTransform:'uppercase', marginBottom:2 }}>In ritardo</div><div style={{ fontSize:20, fontWeight:600, color: s.late>0?'var(--red)':'var(--text3)' }}>{s.late}</div></div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background:'var(--bg2)', borderRadius:'var(--radius-lg)', border:'0.5px solid var(--border)', padding:'16px' }}>
        <div style={{ fontSize:12, fontWeight:500, color:'var(--text)', marginBottom:10 }}>Piano Editoriale</div>
        <div style={{ display:'flex', gap:20 }}>
          <div><div style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--mono)', textTransform:'uppercase', marginBottom:2 }}>Totale</div><div style={{ fontSize:20, fontWeight:600 }}>{stats.editorialTotal}</div></div>
          <div><div style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--mono)', textTransform:'uppercase', marginBottom:2 }}>Pronti</div><div style={{ fontSize:20, fontWeight:600, color:'var(--green)' }}>{stats.editorialReady}</div></div>
          <div><div style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--mono)', textTransform:'uppercase', marginBottom:2 }}>Pubblicati</div><div style={{ fontSize:20, fontWeight:600, color:'var(--accent2)' }}>{stats.editorialPublished}</div></div>
        </div>
      </div>
    </div>
  )
}

function ProfileSettings({ onClose }) {
  const { profile, theme, toggleTheme } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function saveName() {
    if (!fullName.trim()) return
    setSaving(true)
    await supabase.from('profiles').update({ full_name: fullName.trim() }).eq('id', profile.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => { setSaved(false); window.location.reload() }, 1200)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'var(--bg2)', border:'0.5px solid var(--border2)', borderRadius:'var(--radius-lg)', padding:'1.5rem', width:'100%', maxWidth:400, boxShadow:'var(--shadow)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem' }}>
          <span style={{ fontSize:15, fontWeight:600 }}>Impostazioni profilo</span>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', fontSize:18 }}>×</button>
        </div>
        <div style={{ marginBottom:'1.2rem' }}>
          <label style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--mono)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6, display:'block' }}>Nome</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)}
            style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'0.5px solid var(--border2)', background:'var(--bg3)', color:'var(--text)', fontSize:13 }} />
        </div>
        <div style={{ marginBottom:'1.5rem' }}>
          <label style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--mono)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:10, display:'block' }}>Tema</label>
          <div style={{ display:'flex', gap:8 }}>
            {['dark','light'].map(t => (
              <button key={t} onClick={() => { if (theme !== t) toggleTheme() }} style={{
                flex:1, padding:'10px', borderRadius:8,
                border: `0.5px solid ${theme===t?'var(--accent)':'var(--border2)'}`,
                background: theme===t?'var(--accent)':'var(--bg3)',
                color: theme===t?'white':'var(--text2)',
                fontSize:13, fontWeight: theme===t?500:400, cursor:'pointer', fontFamily:'var(--font)'
              }}>{t==='dark' ? '🌙 Scuro' : '☀️ Chiaro'}</button>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={saveName} disabled={saving} style={{ flex:1, padding:'9px', borderRadius:8, border:'none', background:'var(--accent)', color:'white', fontSize:13, fontWeight:500, cursor: saving?'not-allowed':'pointer', opacity: saving?0.7:1 }}>
            {saved ? '✓ Salvato' : saving ? 'Salvataggio...' : 'Salva'}
          </button>
          <button onClick={onClose} style={{ padding:'9px 16px', borderRadius:8, border:'0.5px solid var(--border2)', background:'transparent', color:'var(--text2)', fontSize:13, cursor:'pointer' }}>Chiudi</button>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { profile, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [socialSubView, setSocialSubView] = useState('tasks')
  const [channelFilter, setChannelFilter] = useState('all')
  const [showProfile, setShowProfile] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [lateCounts, setLateCounts] = useState({})

  useEffect(() => {
    async function loadLate() {
      const { data } = await supabase.from('tasks').select('section, done, due_date')
      if (!data) return
      const counts = {}
      ;['videomaker','copywriter','tecnico','social'].forEach(s => {
        counts[s] = data.filter(t => t.section===s && !t.done && t.due_date && t.due_date < todayStr).length
      })
      setLateCounts(counts)
    }
    loadLate()
  }, [])

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      {showProfile && <ProfileSettings onClose={() => setShowProfile(false)} />}

      {/* Top bar */}
      <div style={{ background:'var(--bg2)', borderBottom:'0.5px solid var(--border)', padding:'0 1.5rem', display:'flex', alignItems:'center', height:52, gap:12, position:'sticky', top:0, zIndex:10 }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--accent)', boxShadow:'0 0 10px var(--accent)', flexShrink:0 }} />
        <span style={{ fontSize:14, fontWeight:600 }}>Team Manager</span>
        <div style={{ flex:1 }} />
        <button
          onClick={() => setShowSidebar(s => !s)}
          title="Pannello team"
          style={{ fontSize:11, padding:'4px 10px', borderRadius:7, border:'0.5px solid var(--border2)', background: showSidebar?'var(--accent)':'transparent', color: showSidebar?'white':'var(--text2)', cursor:'pointer', fontFamily:'var(--font)' }}
        >👥 Team</button>
        <button onClick={() => setShowProfile(true)} style={{ fontSize:11, padding:'4px 10px', borderRadius:7, border:'0.5px solid var(--border2)', background:'transparent', color:'var(--text2)', cursor:'pointer', fontFamily:'var(--font)' }}>
          {profile?.full_name || 'Profilo'} ⚙️
        </button>
        <button onClick={signOut} style={{ fontSize:11, padding:'4px 10px', borderRadius:7, border:'0.5px solid var(--border2)', background:'transparent', color:'var(--text3)', cursor:'pointer', fontFamily:'var(--font)' }}>Esci</button>
      </div>

      {/* Main layout */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'2rem 1rem', display:'flex', gap:'1.5rem', alignItems:'flex-start' }}>

        {/* Content */}
        <div style={{ flex:1, minWidth:0 }}>
          {/* Tabs */}
          <div style={{ display:'flex', gap:2, marginBottom:'1.5rem', background:'var(--bg2)', borderRadius:'var(--radius)', padding:4, border:'0.5px solid var(--border)', overflowX:'auto' }}>
            {SECTIONS.map(sec => (
              <button key={sec.id} onClick={() => { setActiveTab(sec.id); setSocialSubView('tasks'); setChannelFilter('all') }} style={{
                flex:1, padding:'8px 10px', borderRadius:7, border:'none', whiteSpace:'nowrap',
                background: activeTab===sec.id?'var(--bg4)':'transparent',
                color: activeTab===sec.id?'var(--text)':'var(--text2)',
                fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'var(--font)',
                boxShadow: activeTab===sec.id?'0 1px 4px rgba(0,0,0,0.3)':'none',
                transition:'all 0.15s',
              }}>
                <span style={{ marginRight:5, fontSize:12 }}>{sec.icon}</span>{sec.label}
                {['videomaker','copywriter','tecnico','social'].includes(sec.id) && lateCounts[sec.id] > 0 && (
                  <span style={{ marginLeft:5, fontSize:10, background:'var(--red)', color:'white', borderRadius:10, padding:'1px 5px', fontFamily:'var(--mono)' }}>{lateCounts[sec.id]}</span>
                )}
              </button>
            ))}
          </div>

          {/* Social sub-tabs */}
          {activeTab === 'social' && (
            <>
              <div style={{ display:'flex', gap:6, marginBottom:'1rem' }}>
                {[['tasks','Task'],['editorial','Piano Editoriale']].map(([v,l]) => (
                  <button key={v} onClick={() => setSocialSubView(v)} style={{ padding:'5px 16px', borderRadius:20, border:'0.5px solid var(--border2)', background: socialSubView===v?'var(--accent)':'transparent', color: socialSubView===v?'white':'var(--text2)', borderColor: socialSubView===v?'var(--accent)':'var(--border2)', fontSize:12, fontWeight: socialSubView===v?500:400, cursor:'pointer', fontFamily:'var(--font)' }}>{l}</button>
                ))}
              </div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:'1rem' }}>
                {[['all','Tutti'],['youtube','YouTube'],['ig','IG / FB'],['tiktok','TikTok'],['mail','Mail']].map(([ch,label]) => {
                  const styles = {
                    all:     { background:'var(--bg3)', color:'var(--text)', borderColor:'var(--border2)' },
                    youtube: { background:'rgba(244,91,91,0.15)', color:'#f87171', borderColor:'rgba(244,91,91,0.5)' },
                    ig:      { background:'rgba(24,119,242,0.15)', color:'#4A9FF5', borderColor:'rgba(24,119,242,0.5)' },
                    tiktok:  { background:'rgba(0,242,234,0.1)', color:'#00c8c0', borderColor:'rgba(0,242,234,0.5)' },
                    mail:    { background:'rgba(245,158,11,0.15)', color:'#F59E0B', borderColor:'rgba(245,158,11,0.5)' },
                  }
                  const inactiveColors = { all:'var(--text2)', youtube:'#f87171', ig:'#4A9FF5', tiktok:'#00c8c0', mail:'#F59E0B' }
                  const isActive = channelFilter === ch
                  return (
                    <button key={ch} onClick={() => setChannelFilter(ch)} style={{
                      fontSize:12, padding:'5px 14px', borderRadius:20,
                      border: `0.5px solid ${isActive ? styles[ch].borderColor : 'var(--border2)'}`,
                      cursor:'pointer', fontFamily:'var(--font)',
                      background: isActive ? styles[ch].background : 'transparent',
                      color: isActive ? styles[ch].color : inactiveColors[ch]||'var(--text2)',
                      fontWeight: isActive ? 500 : 400, transition:'all 0.15s'
                    }}>{label}</button>
                  )
                })}
              </div>
            </>
          )}

          {activeTab === 'overview' && <Overview />}
          {activeTab === 'social' && socialSubView === 'tasks' && <TaskSection section="social" />}
          {activeTab === 'social' && socialSubView === 'editorial' && <EditorialPlan channelFilter={channelFilter} />}
          {['videomaker','copywriter','tecnico'].includes(activeTab) && <TaskSection section={activeTab} />}
        </div>

        {/* Sidebar */}
        <Sidebar visible={showSidebar} onClose={() => setShowSidebar(false)} />
      </div>
    </div>
  )
}
