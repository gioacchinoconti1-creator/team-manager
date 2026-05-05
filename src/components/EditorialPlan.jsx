import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import EditorialCard from './EditorialCard'
import { Empty, Spinner, StatoBadge, fieldStyle } from './UI'

const todayStr = new Date().toISOString().slice(0,10)
const DAY_NAMES = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab']
const MONTH_NAMES = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']
const STATI = ['pianificazione','brief','produzione','pronto','pubblicato']
const STATI_LABELS = { pianificazione:'In pianificazione', brief:'Brief pronto', produzione:'In produzione', pronto:'Pronto', pubblicato:'Pubblicato' }
const FORMAT_LABELS = { reel:'Reel', post:'Post', story:'Story', short:'Short', video:'Video', altro:'Altro' }

function getWeekMonday(ds) {
  const d = new Date(ds + 'T00:00:00')
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff)).toISOString().slice(0,10)
}

function AddEditorialForm({ onAdded, onCancel }) {
  const { profile } = useAuth()
  const [form, setForm] = useState({ title:'', channel:'ig', format:'reel', publish_date:'', stato:'pianificazione', brief:'', caption:'', hashtags:'', cta:'', notes:'', drive_link:'', published_link:'' })
  const [loading, setLoading] = useState(false)
  function set(k,v) { setForm(f => ({...f,[k]:v})) }

  async function submit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    setLoading(true)
    const { data, error } = await supabase.from('editorial_plan').insert({
      title: form.title.trim(), channel: form.channel, format: form.format,
      publish_date: form.publish_date || null, stato: form.stato,
      brief: form.brief || null, caption: form.caption || null,
      hashtags: form.hashtags || null, cta: form.cta || null,
      notes: form.notes || null, drive_link: form.drive_link || null,
      published_link: form.published_link || null,
      created_by: profile?.id || null,
    }).select().single()
    if (!error && data) { onAdded(data) }
    setLoading(false)
  }

  return (
    <div style={{ background:'var(--bg2)', border:'0.5px solid var(--accent)', borderRadius:'var(--radius-lg)', padding:16, marginBottom:'1.5rem' }}>
      <div style={{ fontSize:13, fontWeight:500, marginBottom:12, color:'var(--text)' }}>Nuovo contenuto</div>
      <form onSubmit={submit}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
          <input style={{ ...fieldStyle, gridColumn:'1/-1' }} value={form.title} onChange={e => set('title',e.target.value)} placeholder="Titolo contenuto..." required />
          <select style={fieldStyle} value={form.channel} onChange={e => set('channel',e.target.value)}>
            <option value="ig">IG / FB</option>
            <option value="youtube">YouTube</option>
            <option value="tiktok">TikTok</option>
          </select>
          <select style={fieldStyle} value={form.format} onChange={e => set('format',e.target.value)}>
            {Object.entries(FORMAT_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <input style={fieldStyle} type="date" value={form.publish_date} onChange={e => set('publish_date',e.target.value)} />
          <select style={fieldStyle} value={form.stato} onChange={e => set('stato',e.target.value)}>
            {STATI.map(s => <option key={s} value={s}>{STATI_LABELS[s]}</option>)}
          </select>
        </div>
        <textarea style={{ ...fieldStyle, width:'100%', resize:'vertical', minHeight:60, marginBottom:8, lineHeight:1.5 }} value={form.brief} onChange={e => set('brief',e.target.value)} placeholder="Brief / descrizione del video..." />
        <textarea style={{ ...fieldStyle, width:'100%', resize:'vertical', minHeight:60, marginBottom:8, lineHeight:1.5 }} value={form.caption} onChange={e => set('caption',e.target.value)} placeholder="Caption / testo del post..." />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
          <input style={fieldStyle} value={form.hashtags} onChange={e => set('hashtags',e.target.value)} placeholder="Hashtag" />
          <input style={fieldStyle} value={form.cta} onChange={e => set('cta',e.target.value)} placeholder="CTA" />
          <input style={fieldStyle} value={form.drive_link} onChange={e => set('drive_link',e.target.value)} placeholder="Link Drive (materiale grezzo)" />
          <input style={fieldStyle} value={form.published_link} onChange={e => set('published_link',e.target.value)} placeholder="Link contenuto pubblicato" />
        </div>
        <textarea style={{ ...fieldStyle, width:'100%', resize:'vertical', minHeight:40, marginBottom:12, lineHeight:1.5 }} value={form.notes} onChange={e => set('notes',e.target.value)} placeholder="Note interne..." />
        <div style={{ display:'flex', gap:8 }}>
          <button type="submit" disabled={loading} style={{ padding:'8px 16px', borderRadius:8, border:'none', background:'var(--accent)', color:'white', fontSize:13, fontWeight:500, cursor: loading?'not-allowed':'pointer' }}>
            {loading ? 'Salvataggio...' : '+ Aggiungi'}
          </button>
          <button type="button" onClick={onCancel} style={{ padding:'8px 14px', borderRadius:8, border:'0.5px solid var(--border2)', background:'transparent', color:'var(--text2)', fontSize:13, cursor:'pointer' }}>Annulla</button>
        </div>
      </form>
    </div>
  )
}

export default function EditorialPlan({ channelFilter }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list')
  const [showAdd, setShowAdd] = useState(false)
  const [statoFilter, setStatoFilter] = useState('')
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('editorial_plan').select('*').order('publish_date', { ascending: true })
    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function onAdded(item) { setItems(prev => [...prev, item]); setShowAdd(false) }
  function onUpdate(updated) { setItems(prev => prev.map(i => i.id === updated.id ? updated : i)) }
  function onDelete(id) { setItems(prev => prev.filter(i => i.id !== id)) }

  const filtered = items.filter(i => {
    if (channelFilter !== 'all' && i.channel !== channelFilter) return false
    if (statoFilter && i.stato !== statoFilter) return false
    return true
  })

  // Calendar logic
  const y = calMonth.getFullYear()
  const m = calMonth.getMonth()
  const daysInMonth = new Date(y, m+1, 0).getDate()
  const calFiltered = items.filter(i => {
    if (!i.publish_date) return false
    const d = new Date(i.publish_date + 'T00:00:00')
    if (d.getFullYear() !== y || d.getMonth() !== m) return false
    if (channelFilter !== 'all' && i.channel !== channelFilter) return false
    return true
  })
  const byDay = {}
  calFiltered.forEach(i => { if (!byDay[i.publish_date]) byDay[i.publish_date] = []; byDay[i.publish_date].push(i) })
  const byWeek = {}
  for (let day = 1; day <= daysInMonth; day++) {
    const ds = `${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    const wk = getWeekMonday(ds)
    if (!byWeek[wk]) byWeek[wk] = []
    byWeek[wk].push(ds)
  }
  const weekKeys = Object.keys(byWeek).sort()

  const CH_STYLE = {
    youtube: { background:'rgba(244,91,91,0.15)', color:'#f87171' },
    ig:      { background:'rgba(124,108,250,0.15)', color:'var(--accent2)' },
    tiktok:  { background:'rgba(62,207,142,0.12)', color:'var(--green)' },
  }
  const CH_LABELS = { youtube:'YouTube', ig:'IG/FB', tiktok:'TikTok' }
  const badgeBase = { fontSize:10, padding:'1px 6px', borderRadius:10, fontWeight:500, fontFamily:'var(--mono)' }

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'1.2rem', flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:4 }}>
          {['list','calendar'].map((v,i) => (
            <button key={v} onClick={() => setView(v)} style={{ padding:'5px 14px', borderRadius:20, border:'0.5px solid var(--border2)', background: view===v?'var(--accent)':'transparent', color: view===v?'white':'var(--text2)', fontSize:12, fontWeight: view===v?500:400, cursor:'pointer', fontFamily:'var(--font)' }}>
              {['Lista','Calendario'][i]}
            </button>
          ))}
        </div>
        <select style={{ ...fieldStyle, fontSize:12, padding:'5px 10px' }} value={statoFilter} onChange={e => setStatoFilter(e.target.value)}>
          <option value="">Tutti gli stati</option>
          {STATI.map(s => <option key={s} value={s}>{STATI_LABELS[s]}</option>)}
        </select>
        <div style={{ flex:1 }} />
        <button onClick={() => setShowAdd(s => !s)} style={{ padding:'7px 14px', borderRadius:8, border:'none', background:'var(--accent)', color:'white', fontSize:13, fontWeight:500, cursor:'pointer' }}>
          {showAdd ? 'Annulla' : '+ Nuovo contenuto'}
        </button>
      </div>

      {showAdd && <AddEditorialForm onAdded={onAdded} onCancel={() => setShowAdd(false)} />}

      {loading ? <Spinner /> : view === 'list' ? (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {filtered.length === 0 ? <Empty text="// nessun contenuto pianificato" /> : filtered.map(i => (
            <EditorialCard key={i.id} item={i} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
        </div>
      ) : (
        <div>
          {/* Calendar nav */}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:'1.4rem' }}>
            <button onClick={() => setCalMonth(new Date(y,m-1,1))} style={{ padding:'6px 14px', borderRadius:8, border:'0.5px solid var(--border2)', background:'var(--bg2)', cursor:'pointer', fontSize:14, color:'var(--text2)', fontFamily:'var(--font)' }}>←</button>
            <div style={{ fontSize:15, fontWeight:600, flex:1 }}>{MONTH_NAMES[m]} {y}</div>
            <button onClick={() => setCalMonth(new Date(y,m+1,1))} style={{ padding:'6px 14px', borderRadius:8, border:'0.5px solid var(--border2)', background:'var(--bg2)', cursor:'pointer', fontSize:14, color:'var(--text2)', fontFamily:'var(--font)' }}>→</button>
          </div>

          {weekKeys.map((wk, wi) => {
            const days = byWeek[wk]
            const fmt = ds => new Date(ds+'T00:00:00').toLocaleDateString('it-IT',{day:'numeric',month:'short'})
            return (
              <div key={wk} style={{ marginBottom:'1.4rem' }}>
                <div style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--mono)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10, paddingBottom:6, borderBottom:'0.5px solid var(--border)' }}>
                  W{wi+1} — {fmt(days[0])} › {fmt(days[days.length-1])}
                </div>
                {days.map(ds => {
                  const d = new Date(ds+'T00:00:00')
                  const isToday = ds === todayStr
                  const dayItems = byDay[ds] || []
                  return (
                    <div key={ds} style={{ marginBottom:2 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                        <div style={{ fontSize:12, fontWeight:600, background: isToday?'var(--accent)':'var(--bg3)', color: isToday?'white':'var(--text2)', borderRadius:'50%', width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--mono)', boxShadow: isToday?'0 0 10px rgba(124,108,250,0.4)':'none', flexShrink:0 }}>{d.getDate()}</div>
                        <span style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--mono)' }}>{DAY_NAMES[d.getDay()]}</span>
                      </div>
                      {dayItems.length > 0 ? (
                        <div style={{ display:'flex', flexDirection:'column', gap:4, marginLeft:34, marginBottom:10 }}>
                          {dayItems.map(item => (
                            <div key={item.id} style={{ background:'var(--bg2)', border:'0.5px solid var(--border)', borderRadius:8, padding:'8px 12px', cursor:'pointer' }}
                              onClick={() => { /* could expand */ }}>
                              <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                                <span style={{ ...badgeBase, ...(CH_STYLE[item.channel]||{}) }}>{CH_LABELS[item.channel]||item.channel}</span>
                                <span style={{ ...badgeBase, background:'var(--bg3)', color:'var(--text3)' }}>{FORMAT_LABELS[item.format]||item.format}</span>
                                <StatoBadge stato={item.stato} />
                                <span style={{ fontSize:13, color:'var(--text)', flex:1 }}>{item.title}</span>
                              </div>
                              {item.brief && <div style={{ fontSize:12, color:'var(--text3)', marginTop:4, fontFamily:'var(--mono)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.brief}</div>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize:11, color:'var(--text3)', marginLeft:34, marginBottom:10, fontFamily:'var(--mono)' }}>— nessun contenuto</div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
