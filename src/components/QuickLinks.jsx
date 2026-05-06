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
      title: newTitle.trim(),
      url,
      created_by: profile?.id || null,
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
    width: '100%', padding: '7px 10px', borderRadius: 7,
    border: '0.5px solid var(--border2)', background: 'var(--bg3)',
    color: 'var(--text)', fontSize: 12, fontFamily: 'var(--font)',
    marginBottom: 6,
  }

  return (
    <div style={{
      width: 240, flexShrink: 0,
      background: 'var(--bg2)',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      display: 'flex', flexDirection: 'column',
      maxHeight: 'calc(100vh - 4rem)',
      position: 'sticky', top: '1rem',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '0.5px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 14 }}>🔗</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Link utili</span>
          </div>
          <button
            onClick={() => { setAdding(a => !a); setEditingId(null) }}
            title="Aggiungi link"
            style={{
              width: 24, height: 24, borderRadius: '50%', border: '0.5px solid var(--border2)',
              background: adding ? 'var(--accent)' : 'transparent',
              color: adding ? 'white' : 'var(--text3)',
              cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              lineHeight: 1, transition: 'all 0.15s',
            }}
          >{adding ? '×' : '+'}</button>
        </div>
      </div>

      {/* Add form */}
      {adding && (
        <div style={{ padding: '10px 14px', borderBottom: '0.5px solid var(--border)', flexShrink: 0 }}>
          <input
            style={inputStyle} value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Titolo (es. Copy Workshop)"
            autoFocus
          />
          <input
            style={{ ...inputStyle, marginBottom: 8 }} value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            placeholder="https://..."
            onKeyDown={e => e.key === 'Enter' && addLink()}
          />
          <button
            onClick={addLink} disabled={saving}
            style={{ width: '100%', padding: '6px', borderRadius: 7, border: 'none', background: 'var(--accent)', color: 'white', fontSize: 12, fontWeight: 500, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}
          >{saving ? 'Salvataggio...' : '+ Aggiungi'}</button>
        </div>
      )}

      {/* Links list */}
      <div style={{ overflowY: 'auto', padding: '8px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {loading ? (
          <div style={{ color: 'var(--text3)', fontSize: 11, fontFamily: 'var(--mono)', textAlign: 'center', padding: '1rem' }}>// caricamento...</div>
        ) : links.length === 0 ? (
          <div style={{ color: 'var(--text3)', fontSize: 11, fontFamily: 'var(--mono)', textAlign: 'center', padding: '1.5rem 0.5rem', lineHeight: 1.6 }}>
            // Nessun link ancora.<br />Clicca + per aggiungerne uno.
          </div>
        ) : links.map(link => (
          editingId === link.id ? (
            // Edit mode
            <div key={link.id} style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px', border: '0.5px solid var(--accent)' }}>
              <input style={inputStyle} value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Titolo" autoFocus />
              <input style={{ ...inputStyle, marginBottom: 8 }} value={editUrl} onChange={e => setEditUrl(e.target.value)} placeholder="https://..." />
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => saveEdit(link.id)} disabled={saving} style={{ flex: 1, padding: '5px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: 'white', fontSize: 11, cursor: 'pointer' }}>Salva</button>
                <button onClick={() => setEditingId(null)} style={{ flex: 1, padding: '5px', borderRadius: 6, border: '0.5px solid var(--border2)', background: 'transparent', color: 'var(--text2)', fontSize: 11, cursor: 'pointer' }}>Annulla</button>
              </div>
            </div>
          ) : (
            // Normal mode
            <div
              key={link.id}
              style={{
                background: 'var(--bg3)', borderRadius: 8, padding: '9px 10px',
                border: '0.5px solid var(--border)', transition: 'border-color 0.15s',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              {/* Favicon */}
              <div style={{ width: 20, height: 20, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {getfavicon(link.url)
                  ? <img src={getfavicon(link.url)} width={16} height={16} style={{ borderRadius: 3 }} onError={e => e.target.style.display='none'} />
                  : <span style={{ fontSize: 12 }}>🔗</span>
                }
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <a
                  href={link.url} target="_blank" rel="noreferrer"
                  style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  onMouseEnter={e => e.target.style.color = 'var(--accent2)'}
                  onMouseLeave={e => e.target.style.color = 'var(--text)'}
                >{link.title}</a>
                <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {getDomainLabel(link.url)}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 2, flexShrink: 0, opacity: 0, transition: 'opacity 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                ref={el => {
                  if (el) {
                    el.parentElement.onmouseenter = () => el.style.opacity = '1'
                    el.parentElement.onmouseleave = () => el.style.opacity = '0'
                  }
                }}
              >
                <button onClick={() => startEdit(link)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 11, padding: '2px 4px' }}>✏️</button>
                <button onClick={() => deleteLink(link.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', fontSize: 11, padding: '2px 4px' }}>×</button>
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  )
}
