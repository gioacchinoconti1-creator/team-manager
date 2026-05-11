import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

function getfavicon(url) {
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  } catch { return null }
}

function getDomainLabel(url) {
  try { return new URL(url).hostname.replace('www.', '') }
  catch { return '' }
}

const SOCIAL_PLATFORMS = [
  { key:'youtube',   label:'YouTube',   icon:'▶', color:'#FF4444', bg:'rgba(255,68,68,0.12)',   border:'rgba(255,68,68,0.3)',   placeholder:'https://youtube.com/@canale' },
  { key:'instagram', label:'Instagram', icon:'📷', color:'#C13584', bg:'rgba(193,53,132,0.12)',  border:'rgba(193,53,132,0.3)',  placeholder:'https://instagram.com/profilo' },
  { key:'facebook',  label:'Facebook',  icon:'f',  color:'#4A9FF5', bg:'rgba(24,119,242,0.12)',  border:'rgba(24,119,242,0.3)',  placeholder:'https://facebook.com/pagina' },
  { key:'tiktok',    label:'TikTok',    icon:'♪',  color:'#00c8c0', bg:'rgba(0,242,234,0.1)',    border:'rgba(0,242,234,0.3)',   placeholder:'https://tiktok.com/@profilo' },
]

function SocialSection() {
  const [socialLinks, setSocialLinks] = useState({})
  const [editingPlatform, setEditingPlatform] = useState(null)
  const [editUrl, setEditUrl] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('social_links').select('*').then(({ data }) => {
      if (data) {
        const map = {}
        data.forEach(r => { map[r.platform] = r })
        setSocialLinks(map)
      }
    })
  }, [])

  function startEdit(platform) {
    setEditingPlatform(platform.key)
    setEditUrl(socialLinks[platform.key]?.url || '')
  }

  async function saveUrl(platformKey) {
    setSaving(true)
    let url = editUrl.trim()
    if (url && !url.startsWith('http')) url = 'https://' + url

    const existing = socialLinks[platformKey]
    let data
    if (existing) {
      const res = await supabase.from('social_links').update({ url: url || null }).eq('id', existing.id).select().single()
      data = res.data
    } else {
      const res = await supabase.from('social_links').insert({ platform: platformKey, url: url || null }).select().single()
      data = res.data
    }
    if (data) {
      setSocialLinks(prev => ({ ...prev, [platformKey]: data }))
    }
    setEditingPlatform(null)
    setSaving(false)
  }

  return (
    <div style={{ padding:'10px 12px', borderBottom:'0.5px solid var(--border)', flexShrink:0 }}>
      <div style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--mono)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Canali Social</div>
      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
        {SOCIAL_PLATFORMS.map(platform => {
          const record = socialLinks[platform.key]
          const hasUrl = record?.url
          const isEditing = editingPlatform === platform.key

          if (isEditing) {
            return (
              <div key={platform.key} style={{ background:'var(--bg3)', borderRadius:8, padding:'8px 10px', border:`0.5px solid ${platform.border}` }}>
                <div style={{ fontSize:11, fontWeight:600, color:platform.color, marginBottom:6 }}>{platform.label}</div>
                <input
                  autoFocus
                  value={editUrl}
                  onChange={e => setEditUrl(e.target.value)}
                  placeholder={platform.placeholder}
                  onKeyDown={e => { if (e.key === 'Enter') saveUrl(platform.key); if (e.key === 'Escape') setEditingPlatform(null) }}
                  style={{ width:'100%', padding:'5px 8px', borderRadius:6, border:`0.5px solid ${platform.border}`, background:'var(--bg2)', color:'var(--text)', fontSize:11, fontFamily:'var(--font)', marginBottom:6 }}
                />
                <div style={{ display:'flex', gap:4 }}>
                  <button onClick={() => saveUrl(platform.key)} disabled={saving} style={{ flex:1, padding:'4px', borderRadius:6, border:'none', background:'var(--accent)', color:'white', fontSize:11, cursor:'pointer' }}>
                    {saving ? '...' : 'Salva'}
                  </button>
                  <button onClick={() => setEditingPlatform(null)} style={{ flex:1, padding:'4px', borderRadius:6, border:'0.5px solid var(--border2)', background:'transparent', color:'var(--text2)', fontSize:11, cursor:'pointer' }}>Annulla</button>
                </div>
              </div>
            )
          }

          return (
            <div
              key={platform.key}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', borderRadius:8, background: hasUrl ? platform.bg : 'transparent', border:`0.5px solid ${hasUrl ? platform.border : 'var(--border)'}`, transition:'all 0.15s' }}
            >
              {/* Icona */}
              <div style={{ width:22, height:22, borderRadius:6, background: hasUrl ? platform.bg : 'var(--bg3)', border:`0.5px solid ${platform.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontSize:11, fontWeight:700, color:platform.color, fontFamily:'var(--mono)' }}>{platform.icon}</span>
              </div>

              {/* Label / Link */}
              <div style={{ flex:1, minWidth:0 }}>
                {hasUrl ? (
                  <a href={record.url} target="_blank" rel="noreferrer"
                    style={{ fontSize:12, fontWeight:500, color:platform.color, textDecoration:'none', display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}
                    onMouseEnter={e => e.target.style.textDecoration='underline'}
                    onMouseLeave={e => e.target.style.textDecoration='none'}
                  >{platform.label}</a>
                ) : (
                  <span style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--mono)' }}>{platform.label}</span>
                )}
              </div>

              {/* Edit button */}
              <button
                onClick={() => startEdit(platform)}
                title="Modifica URL"
                style={{ background:'none', border:'none', cursor:'pointer', color: hasUrl ? platform.color : 'var(--text3)', fontSize:11, padding:'2px 4px', opacity:0.7, flexShrink:0 }}
                onMouseEnter={e => e.currentTarget.style.opacity='1'}
                onMouseLeave={e => e.currentTarget.style.opacity='0.7'}
              >✏️</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function QuickLinks() {
  const { profile } = useAuth()
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [newTitle, setNewTitle] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editUrl, setEditUrl] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('quick_links').select('*').order('created_at', { ascending: true })
    setLinks(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addLink() {
    if (!newTitle.trim() || !newUrl.trim()) return
    setSaving(true)
    let url = newUrl.trim()
    if (!url.startsWith('http')) url = 'https://' + url
    const { data } = await supabase.from('quick_links').insert({
      title: newTitle.trim(), url, created_by: profile?.id || null,
    }).select().single()
    if (data) {
      setLinks(prev => [...prev, data])
      setNewTitle(''); setNewUrl(''); setAdding(false)
    }
    setSaving(false)
  }

  async function saveEdit(id) {
    if (!editTitle.trim() || !editUrl.trim()) return
    setSaving(true)
    let url = editUrl.trim()
    if (!url.startsWith('http')) url = 'https://' + url
    const { data } = await supabase.from('quick_links').update({ title: editTitle.trim(), url }).eq('id', id).select().single()
    if (data) {
      setLinks(prev => prev.map(l => l.id === id ? data : l))
      setEditingId(null)
    }
    setSaving(false)
  }

  async function deleteLink(id) {
    if (!confirm('Rimuovere questo link?')) return
    await supabase.from('quick_links').delete().eq('id', id)
    setLinks(prev => prev.filter(l => l.id !== id))
  }

  function startEdit(link) {
    setEditingId(link.id)
    setEditTitle(link.title)
    setEditUrl(link.url)
  }

  const inputStyle = {
    width:'100%', padding:'7px 10px', borderRadius:7,
    border:'0.5px solid var(--border2)', background:'var(--bg3)',
    color:'var(--text)', fontSize:12, fontFamily:'var(--font)', marginBottom:6,
  }

  return (
    <div style={{
      width:240, flexShrink:0,
      background:'var(--bg2)', border:'0.5px solid var(--border)',
      borderRadius:'var(--radius-lg)', display:'flex', flexDirection:'column',
      maxHeight:'calc(100vh - 4rem)', position:'sticky', top:'1rem', overflow:'hidden',
    }}>
      {/* Header */}
      <div style={{ padding:'14px 16px', borderBottom:'0.5px solid var(--border)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <span style={{ fontSize:14 }}>🔗</span>
            <span style={{ fontSize:13, fontWeight:600 }}>Link utili</span>
          </div>
          <button
            onClick={() => { setAdding(a => !a); setEditingId(null) }}
            title="Aggiungi link"
            style={{
              width:24, height:24, borderRadius:'50%', border:'0.5px solid var(--border2)',
              background: adding ? 'var(--accent)' : 'transparent',
              color: adding ? 'white' : 'var(--text3)',
              cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center',
              lineHeight:1, transition:'all 0.15s',
            }}
          >{adding ? '×' : '+'}</button>
        </div>
      </div>

      {/* Sezione canali social */}
      <SocialSection />

      {/* Add form */}
      {adding && (
        <div style={{ padding:'10px 14px', borderBottom:'0.5px solid var(--border)', flexShrink:0 }}>
          <input style={inputStyle} value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Titolo (es. Copy Workshop)" autoFocus />
          <input style={{ ...inputStyle, marginBottom:8 }} value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://..." onKeyDown={e => e.key === 'Enter' && addLink()} />
          <button onClick={addLink} disabled={saving} style={{ width:'100%', padding:'6px', borderRadius:7, border:'none', background:'var(--accent)', color:'white', fontSize:12, fontWeight:500, cursor:'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Salvataggio...' : '+ Aggiungi'}
          </button>
        </div>
      )}

      {/* Links list */}
      <div style={{ overflowY:'auto', padding:'8px', flex:1, display:'flex', flexDirection:'column', gap:4 }}>
        {loading ? (
          <div style={{ color:'var(--text3)', fontSize:11, fontFamily:'var(--mono)', textAlign:'center', padding:'1rem' }}>// caricamento...</div>
        ) : links.length === 0 ? (
          <div style={{ color:'var(--text3)', fontSize:11, fontFamily:'var(--mono)', textAlign:'center', padding:'1.5rem 0.5rem', lineHeight:1.6 }}>
            // Nessun link ancora.<br />Clicca + per aggiungerne uno.
          </div>
        ) : links.map(link => (
          editingId === link.id ? (
            <div key={link.id} style={{ background:'var(--bg3)', borderRadius:8, padding:'10px', border:'0.5px solid var(--accent)' }}>
              <input style={inputStyle} value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Titolo" autoFocus />
              <input style={{ ...inputStyle, marginBottom:8 }} value={editUrl} onChange={e => setEditUrl(e.target.value)} placeholder="https://..." />
              <div style={{ display:'flex', gap:4 }}>
                <button onClick={() => saveEdit(link.id)} disabled={saving} style={{ flex:1, padding:'5px', borderRadius:6, border:'none', background:'var(--accent)', color:'white', fontSize:11, cursor:'pointer' }}>Salva</button>
                <button onClick={() => setEditingId(null)} style={{ flex:1, padding:'5px', borderRadius:6, border:'0.5px solid var(--border2)', background:'transparent', color:'var(--text2)', fontSize:11, cursor:'pointer' }}>Annulla</button>
              </div>
            </div>
          ) : (
            <div
              key={link.id}
              style={{ background:'var(--bg3)', borderRadius:8, padding:'9px 10px', border:'0.5px solid var(--border)', transition:'border-color 0.15s', display:'flex', alignItems:'center', gap:8 }}
              onMouseEnter={e => e.currentTarget.style.borderColor='var(--border2)'}
              onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}
            >
              <div style={{ width:20, height:20, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {getfavicon(link.url)
                  ? <img src={getfavicon(link.url)} width={16} height={16} style={{ borderRadius:3 }} onError={e => e.target.style.display='none'} />
                  : <span style={{ fontSize:12 }}>🔗</span>
                }
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <a href={link.url} target="_blank" rel="noreferrer"
                  style={{ fontSize:12, fontWeight:500, color:'var(--text)', textDecoration:'none', display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}
                  onMouseEnter={e => e.target.style.color='var(--accent2)'}
                  onMouseLeave={e => e.target.style.color='var(--text)'}
                >{link.title}</a>
                <div style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--mono)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {getDomainLabel(link.url)}
                </div>
              </div>
              <div style={{ display:'flex', gap:2, flexShrink:0 }}
                ref={el => {
                  if (el) {
                    el.style.opacity = '0'
                    el.parentElement.onmouseenter = () => el.style.opacity = '1'
                    el.parentElement.onmouseleave = () => el.style.opacity = '0'
                  }
                }}
              >
                <button onClick={() => startEdit(link)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', fontSize:11, padding:'2px 4px' }}>✏️</button>
                <button onClick={() => deleteLink(link.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#f87171', fontSize:11, padding:'2px 4px' }}>×</button>
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  )
}
