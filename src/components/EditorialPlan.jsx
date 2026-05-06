import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import EditorialCard from './EditorialCard'
import { Empty, Spinner, StatoBadge, fieldStyle } from './UI'

const todayStr = new Date().toISOString().slice(0,10)
const DAY_NAMES_SHORT = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab']
const DAY_NAMES_FULL  = ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato']
const MONTH_NAMES = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']
const STATI = ['pianificazione','brief','produzione','pronto','pubblicato']
const STATI_LABELS = { pianificazione:'In pianificazione', brief:'Brief pronto', produzione:'In produzione', pronto:'Pronto', pubblicato:'Pubblicato' }
const FORMAT_LABELS = { reel:'Reel', post:'Post', story:'Story', short:'Short', video:'Video', email:'Email', altro:'Altro' }

const CH_COLOR = {
  youtube: { bg:'#FF0000', light:'rgba(255,0,0,0.12)',   text:'#FF4444', border:'rgba(255,0,0,0.35)',   label:'YouTube' },
  ig:      { bg:'#1877F2', light:'rgba(24,119,242,0.12)', text:'#4A9FF5', border:'rgba(24,119,242,0.35)', label:'IG / FB' },
  tiktok:  { bg:'#00f2ea', light:'rgba(0,242,234,0.1)',   text:'#00c8c0', border:'rgba(0,242,234,0.3)',  label:'TikTok' },
  mail:    { bg:'#F59E0B', light:'rgba(245,158,11,0.12)', text:'#F59E0B', border:'rgba(245,158,11,0.35)', label:'Mail' },
}

function chPill(channel, small) {
  const c = CH_COLOR[channel] || { light:'var(--bg3)', text:'var(--text2)', border:'var(--border)', label: channel }
  return { display:'inline-block', fontSize: small?10:11, padding: small?'1px 6px':'2px 8px', borderRadius:20, fontWeight:500, fontFamily:'var(--mono)', background: c.light, color: c.text, border:`0.5px solid ${c.border}` }
}

function getMonday(date) {
  const d = new Date(date); const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff); d.setHours(0,0,0,0); return d
}
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate()+n); return d }
function toDateStr(date) { return date.toISOString().slice(0,10) }
function formatDate(ds) { const d = new Date(ds+'T00:00:00'); return d.toLocaleDateString('it-IT',{day:'numeric',month:'short'}) }

function AddEditorialForm({ onAdded, onCancel, prefillDate, prefillChannel }) {
  const { profile } = useAuth()
  const [form, setForm] = useState({ title:'', channel: prefillChannel||'ig', format:'reel', publish_date: prefillDate||'', stato:'pianificazione', brief:'', caption:'', hashtags:'', cta:'', notes:'', drive_link:'', published_link:'' })
  const [loading, setLoading] = useState(false)
  function set(k,v) { setForm(f => ({...f,[k]:v})) }

  async function submit(e) {
    e.preventDefault(); if (!form.title.trim()) return; setLoading(true)
    const { data, error } = await supabase.from('editorial_plan').insert({
      title: form.title.trim(), channel: form.channel, format: form.format,
      publish_date: form.publish_date || null, stato: form.stato,
      brief: form.brief||null, caption: form.caption||null, hashtags: form.hashtags||null,
      cta: form.cta||null, notes: form.notes||null, drive_link: form.drive_link||null,
      published_link: form.published_link||null, created_by: profile?.id||null,
    }).select().single()
    if (!error && data) onAdded(data)
    setLoading(false)
  }

  return (
    <div style={{ background:'var(--bg2)', border:'0.5px solid var(--accent)', borderRadius:'var(--radius-lg)', padding:16, marginBottom:'1.5rem' }}>
      <div style={{ fontSize:13, fontWeight:500, marginBottom:12 }}>Nuovo contenuto</div>
      <form onSubmit={submit}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
          <input style={{ ...fieldStyle, gridColumn:'1/-1' }} value={form.title} onChange={e => set('title',e.target.value)} placeholder="Titolo contenuto..." required />
          <select style={fieldStyle} value={form.channel} onChange={e => set('channel',e.target.value)}>
            <option value="ig">IG / FB</option>
            <option value="youtube">YouTube</option>
            <option value="tiktok">TikTok</option>
            <option value="mail">Mail</option>
          </select>
          <select style={fieldStyle} value={form.format} onChange={e => set('format',e.target.value)}>
            {Object.entries(FORMAT_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <input style={fieldStyle} type="date" value={form.publish_date} onChange={e => set('publish_date',e.target.value)} />
          <select style={fieldStyle} value={form.stato} onChange={e => set('stato',e.target.value)}>
            {STATI.map(s => <option key={s} value={s}>{STATI_LABELS[s]}</option>)}
          </select>
        </div>
        <textarea style={{ ...fieldStyle, width:'100%', resize:'vertical', minHeight:56, marginBottom:8, lineHeight:1.5 }} value={form.brief} onChange={e => set('brief',e.target.value)} placeholder="Brief / descrizione del contenuto..." />
        <textarea style={{ ...fieldStyle, width:'100%', resize:'vertical', minHeight:56, marginBottom:8, lineHeight:1.5 }} value={form.caption} onChange={e => set('caption',e.target.value)} placeholder="Caption / testo / corpo della mail..." />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
          <input style={fieldStyle} value={form.hashtags} onChange={e => set('hashtags',e.target.value)} placeholder="Hashtag / oggetto mail" />
          <input style={fieldStyle} value={form.cta} onChange={e => set('cta',e.target.value)} placeholder="CTA" />
          <input style={fieldStyle} value={form.drive_link} onChange={e => set('drive_link',e.target.value)} placeholder="Link Drive" />
          <input style={fieldStyle} value={form.published_link} onChange={e => set('published_link',e.target.value)} placeholder="Link pubblicato / inviato" />
        </div>
        <textarea style={{ ...fieldStyle, width:'100%', resize:'vertical', minHeight:40, marginBottom:12, lineHeight:1.5 }} value={form.notes} onChange={e => set('notes',e.target.value)} placeholder="Note interne..." />
        <div style={{ display:'flex', gap:8 }}>
          <button type="submit" disabled={loading} style={{ padding:'8px 16px', borderRadius:8, border:'none', background:'var(--accent)', color:'white', fontSize:13, fontWeight:500, cursor:'pointer' }}>{loading?'Salvataggio...':'+ Aggiungi'}</button>
          <button type="button" onClick={onCancel} style={{ padding:'8px 14px', borderRadius:8, border:'0.5px solid var(--border2)', background:'transparent', color:'var(--text2)', fontSize:13, cursor:'pointer' }}>Annulla</button>
        </div>
      </form>
    </div>
  )
}

function DetailModal({ item, onClose, onUpdate, onDelete }) {
  if (!item) return null
  const c = CH_COLOR[item.channel] || { light:'var(--bg3)', text:'var(--text2)', border:'var(--border2)' }

  async function cycleStato() {
    const idx = STATI.indexOf(item.stato)
    const next = STATI[(idx+1) % STATI.length]
    const { data } = await supabase.from('editorial_plan').update({ stato: next }).eq('id', item.id).select().single()
    if (data) onUpdate(data)
  }

  async function deleteItem() {
    if (!confirm('Eliminare questo contenuto?')) return
    await supabase.from('editorial_plan').delete().eq('id', item.id)
    onDelete(item.id); onClose()
  }

  const captionLabel = item.channel === 'mail' ? 'Corpo mail' : 'Caption'
  const hashLabel = item.channel === 'mail' ? 'Oggetto mail' : 'Hashtag'

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }} onClick={onClose}>
      <div style={{ background:'var(--bg2)', border:`1px solid ${c.border}`, borderRadius:'var(--radius-lg)', padding:'1.5rem', width:'100%', maxWidth:520, maxHeight:'85vh', overflowY:'auto', boxShadow:'0 8px 32px rgba(0,0,0,0.4)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:'1rem' }}>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
              <span style={chPill(item.channel)}>{c.label}</span>
              <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:'var(--bg3)', color:'var(--text2)', fontFamily:'var(--mono)' }}>{FORMAT_LABELS[item.format]||item.format}</span>
              <StatoBadge stato={item.stato} />
            </div>
            <div style={{ fontSize:16, fontWeight:600, color:'var(--text)', lineHeight:1.4 }}>{item.title}</div>
            {item.publish_date && <div style={{ fontSize:12, color:'var(--text3)', fontFamily:'var(--mono)', marginTop:4 }}>📅 {formatDate(item.publish_date)}</div>}
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', fontSize:20, flexShrink:0 }}>×</button>
        </div>
        {[['Brief', item.brief],[captionLabel, item.caption],[hashLabel, item.hashtags],['CTA', item.cta],['Note', item.notes]].filter(([,v])=>v).map(([label,value]) => (
          <div key={label} style={{ marginBottom:12 }}>
            <div style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--mono)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>{label}</div>
            <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.6, padding:'8px 10px', borderRadius:7, background:'var(--bg3)', whiteSpace:'pre-wrap' }}>{value}</div>
          </div>
        ))}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:'1rem', paddingTop:'1rem', borderTop:'0.5px solid var(--border)' }}>
          {item.drive_link && <a href={item.drive_link} target="_blank" rel="noreferrer" style={{ fontSize:12, color:'var(--accent2)', fontFamily:'var(--mono)' }}>↗ Drive</a>}
          {item.published_link && <a href={item.published_link} target="_blank" rel="noreferrer" style={{ fontSize:12, color:'var(--green)', fontFamily:'var(--mono)' }}>↗ Pubblicato</a>}
          {item.publish_date && <button onClick={() => { const d=item.publish_date.replace(/-/g,''); window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(item.title)}&dates=${d}/${d}&reminders=POPUP,0,POPUP,1440,POPUP,4320`,'_blank') }} style={{ fontSize:12, padding:'3px 10px', borderRadius:6, border:'0.5px solid var(--border2)', background:'transparent', color:'var(--text3)', cursor:'pointer' }}>📅 Reminder</button>}
          <button onClick={cycleStato} style={{ fontSize:12, padding:'3px 10px', borderRadius:6, border:`0.5px solid ${c.border}`, background:'transparent', color: c.text, cursor:'pointer' }}>Avanza stato →</button>
          <button onClick={deleteItem} style={{ fontSize:12, padding:'3px 10px', borderRadius:6, border:'0.5px solid rgba(244,91,91,0.3)', background:'transparent', color:'#f87171', cursor:'pointer', marginLeft:'auto' }}>Elimina</button>
        </div>
      </div>
    </div>
  )
}

function DayView({ items, date, onSelect, onAdd }) {
  const ds = toDateStr(date)
  const dayItems = items.filter(i => i.publish_date === ds)
  const d = new Date(ds+'T00:00:00')
  const isToday = ds === todayStr
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:'1.5rem' }}>
        <div style={{ fontSize:15, fontWeight:600 }}>
          {DAY_NAMES_FULL[d.getDay()]} {d.getDate()} {MONTH_NAMES[d.getMonth()]} {d.getFullYear()}
          {isToday && <span style={{ marginLeft:8, fontSize:11, background:'var(--accent)', color:'white', borderRadius:10, padding:'2px 8px', fontFamily:'var(--mono)' }}>oggi</span>}
        </div>
        <button onClick={() => onAdd(ds)} style={{ marginLeft:'auto', padding:'6px 14px', borderRadius:8, border:'none', background:'var(--accent)', color:'white', fontSize:12, cursor:'pointer' }}>+ Aggiungi</button>
      </div>
      {dayItems.length === 0
        ? <Empty text="// Nessun contenuto per questo giorno" />
        : <div style={{ display:'flex', flexDirection:'column', gap:8 }}>{dayItems.map(i => <EditorialCard key={i.id} item={i} onUpdate={u => onSelect(u)} onDelete={() => {}} />)}</div>
      }
    </div>
  )
}

function WeekView({ items, weekStart, onSelect, onAdd }) {
  const days = Array.from({ length:7 }, (_,i) => addDays(weekStart, i))
  return (
    <div style={{ overflowX:'auto' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7, minmax(110px, 1fr))', gap:6, minWidth:700 }}>
        {days.map(day => {
          const ds = toDateStr(day)
          const isToday = ds === todayStr
          const dayItems = items.filter(item => item.publish_date === ds)
          return (
            <div key={ds} style={{ background: isToday?'rgba(124,108,250,0.06)':'var(--bg2)', border:`0.5px solid ${isToday?'var(--accent)':'var(--border)'}`, borderRadius:'var(--radius-lg)', padding:'10px 8px', minHeight:120 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                <div>
                  <div style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--mono)', textTransform:'uppercase', letterSpacing:'0.04em' }}>{DAY_NAMES_SHORT[day.getDay()]}</div>
                  <div style={{ fontSize:18, fontWeight:600, color: isToday?'var(--accent)':'var(--text)', lineHeight:1 }}>{day.getDate()}</div>
                </div>
                <button onClick={() => onAdd(ds)} style={{ width:20, height:20, borderRadius:'50%', border:'0.5px solid var(--border2)', background:'transparent', color:'var(--text3)', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {dayItems.map(item => {
                  const c = CH_COLOR[item.channel] || { light:'var(--bg3)', text:'var(--text2)', border:'var(--border)' }
                  return (
                    <div key={item.id} onClick={() => onSelect(item)} style={{ background: c.light, border:`0.5px solid ${c.border}`, borderRadius:6, padding:'4px 6px', cursor:'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.opacity='0.8'} onMouseLeave={e => e.currentTarget.style.opacity='1'}>
                      <div style={{ fontSize:11, fontWeight:500, color: c.text, lineHeight:1.3, marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.title}</div>
                      <div style={{ fontSize:10, color: c.text, fontFamily:'var(--mono)', opacity:0.8 }}>{FORMAT_LABELS[item.format]||item.format}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MonthView({ items, month, onSelect, onAdd }) {
  const y = month.getFullYear(); const m = month.getMonth()
  const firstDay = new Date(y, m, 1)
  const daysInMonth = new Date(y, m+1, 0).getDate()
  const startOffset = (firstDay.getDay() + 6) % 7
  const cells = []
  for (let i=0; i<startOffset; i++) cells.push(null)
  for (let d=1; d<=daysInMonth; d++) cells.push(new Date(y,m,d))

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:4 }}>
        {['Lun','Mar','Mer','Gio','Ven','Sab','Dom'].map(d => (
          <div key={d} style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--mono)', textTransform:'uppercase', textAlign:'center', padding:'4px 0' }}>{d}</div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />
          const ds = toDateStr(day)
          const isToday = ds === todayStr
          const dayItems = items.filter(item => item.publish_date === ds)
          return (
            <div key={ds} style={{ background: isToday?'rgba(124,108,250,0.06)':'var(--bg2)', border:`0.5px solid ${isToday?'var(--accent)':'var(--border)'}`, borderRadius:'var(--radius)', padding:'6px', minHeight:80 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:12, fontWeight:600, color: isToday?'var(--accent)':'var(--text2)' }}>{day.getDate()}</span>
                <button onClick={() => onAdd(ds)} style={{ width:16, height:16, borderRadius:'50%', border:'none', background:'transparent', color:'var(--text3)', cursor:'pointer', fontSize:12 }}>+</button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                {dayItems.slice(0,3).map(item => {
                  const c = CH_COLOR[item.channel] || { light:'var(--bg3)', text:'var(--text2)' }
                  return <div key={item.id} onClick={() => onSelect(item)} style={{ background: c.light, borderRadius:3, padding:'2px 4px', cursor:'pointer', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:10, color: c.text, fontWeight:500 }}>{item.title}</div>
                })}
                {dayItems.length > 3 && <div style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--mono)' }}>+{dayItems.length-3} altri</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TimelineView({ items, weekStart, onSelect, onAdd }) {
  const days = Array.from({ length:7 }, (_,i) => addDays(weekStart, i))
  const channels = ['youtube','ig','tiktok','mail']
  const CH_LABELS_FULL = { youtube:'YouTube', ig:'Instagram / FB', tiktok:'TikTok', mail:'Mail' }

  return (
    <div style={{ overflowX:'auto' }}>
      <div style={{ minWidth:700 }}>
        <div style={{ display:'grid', gridTemplateColumns:'100px repeat(7, 1fr)', gap:4, marginBottom:4 }}>
          <div />
          {days.map(day => {
            const ds = toDateStr(day); const isToday = ds === todayStr
            return (
              <div key={ds} style={{ textAlign:'center', padding:'6px 4px', borderRadius:'var(--radius)', background: isToday?'rgba(124,108,250,0.1)':'transparent', border: isToday?'0.5px solid var(--accent)':'none' }}>
                <div style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--mono)', textTransform:'uppercase' }}>{DAY_NAMES_SHORT[day.getDay()]}</div>
                <div style={{ fontSize:15, fontWeight:600, color: isToday?'var(--accent)':'var(--text)' }}>{day.getDate()}</div>
              </div>
            )
          })}
        </div>
        {channels.map(ch => {
          const c = CH_COLOR[ch]
          return (
            <div key={ch} style={{ display:'grid', gridTemplateColumns:'100px repeat(7, 1fr)', gap:4, marginBottom:4 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'6px 4px', borderRadius:'var(--radius)', background: c.light, border:`0.5px solid ${c.border}` }}>
                <span style={{ fontSize:11, fontWeight:600, color: c.text, fontFamily:'var(--mono)', textAlign:'center', lineHeight:1.3 }}>{CH_LABELS_FULL[ch]}</span>
              </div>
              {days.map(day => {
                const ds = toDateStr(day)
                const cellItems = items.filter(i => i.publish_date === ds && i.channel === ch)
                return (
                  <div key={ds} style={{ background:'var(--bg2)', border:'0.5px solid var(--border)', borderRadius:'var(--radius)', padding:4, minHeight:60 }}>
                    <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                      {cellItems.map(item => (
                        <div key={item.id} onClick={() => onSelect(item)} style={{ background: c.light, border:`0.5px solid ${c.border}`, borderRadius:5, padding:'4px 6px', cursor:'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.opacity='0.75'} onMouseLeave={e => e.currentTarget.style.opacity='1'}>
                          <div style={{ fontSize:10, fontWeight:500, color: c.text, lineHeight:1.3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.title}</div>
                          <div style={{ fontSize:9, color: c.text, fontFamily:'var(--mono)', opacity:0.7 }}>{FORMAT_LABELS[item.format]||item.format}</div>
                        </div>
                      ))}
                      {cellItems.length === 0 && (
                        <button onClick={() => onAdd(ds, ch)} style={{ width:'100%', height:40, border:`0.5px dashed ${c.border}`, borderRadius:5, background:'transparent', color: c.text, cursor:'pointer', fontSize:16, opacity:0.3 }}
                          onMouseEnter={e => e.currentTarget.style.opacity='0.7'} onMouseLeave={e => e.currentTarget.style.opacity='0.3'}>+</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function EditorialPlan({ channelFilter }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('week')
  const [showAdd, setShowAdd] = useState(false)
  const [addPrefillDate, setAddPrefillDate] = useState('')
  const [addPrefillChannel, setAddPrefillChannel] = useState('')
  const [statoFilter, setStatoFilter] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [weekStart, setWeekStart] = useState(getMonday(new Date()))
  const [currentMonth, setCurrentMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1))

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('editorial_plan').select('*').order('publish_date', { ascending:true })
    setItems(data || []); setLoading(false)
  }

  useEffect(() => { load() }, [])

  function onAdded(item) { setItems(prev => [...prev, item]); setShowAdd(false) }
  function onUpdate(updated) { setItems(prev => prev.map(i => i.id===updated.id ? updated : i)); setSelectedItem(null) }
  function onDelete(id) { setItems(prev => prev.filter(i => i.id !== id)) }

  function handleAdd(date, ch) { setAddPrefillDate(date); setAddPrefillChannel(ch||''); setShowAdd(true) }

  const filtered = items.filter(i => {
    if (channelFilter !== 'all' && i.channel !== channelFilter) return false
    if (statoFilter && i.stato !== statoFilter) return false
    return true
  })

  function navPrev() {
    if (view==='day') setCurrentDate(d => addDays(d,-1))
    else if (view==='week'||view==='timeline') setWeekStart(d => addDays(d,-7))
    else setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth()-1, 1))
  }
  function navNext() {
    if (view==='day') setCurrentDate(d => addDays(d,1))
    else if (view==='week'||view==='timeline') setWeekStart(d => addDays(d,7))
    else setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth()+1, 1))
  }
  function goToday() {
    const now = new Date(); setCurrentDate(now); setWeekStart(getMonday(now))
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1))
  }

  function getNavLabel() {
    if (view==='day') { const d=currentDate; return `${DAY_NAMES_FULL[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}` }
    if (view==='week'||view==='timeline') { const end=addDays(weekStart,6); return `${formatDate(toDateStr(weekStart))} — ${formatDate(toDateStr(end))}` }
    return `${MONTH_NAMES[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`
  }

  const VIEWS = [{ id:'day',label:'Giorno' },{ id:'week',label:'Settimana' },{ id:'month',label:'Mese' },{ id:'timeline',label:'Timeline' }]

  return (
    <div>
      {selectedItem && <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} onUpdate={onUpdate} onDelete={onDelete} />}

      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'1.2rem', flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:2, background:'var(--bg2)', borderRadius:'var(--radius)', padding:3, border:'0.5px solid var(--border)' }}>
          {VIEWS.map(v => (
            <button key={v.id} onClick={() => setView(v.id)} style={{ padding:'5px 12px', borderRadius:7, border:'none', background: view===v.id?'var(--bg4)':'transparent', color: view===v.id?'var(--text)':'var(--text2)', fontSize:12, fontWeight: view===v.id?500:400, cursor:'pointer', fontFamily:'var(--font)', transition:'all 0.15s' }}>{v.label}</button>
          ))}
        </div>
        <button onClick={navPrev} style={{ padding:'5px 10px', borderRadius:8, border:'0.5px solid var(--border2)', background:'var(--bg2)', cursor:'pointer', fontSize:14, color:'var(--text2)' }}>←</button>
        <span style={{ fontSize:13, fontWeight:500, minWidth:160, textAlign:'center' }}>{getNavLabel()}</span>
        <button onClick={navNext} style={{ padding:'5px 10px', borderRadius:8, border:'0.5px solid var(--border2)', background:'var(--bg2)', cursor:'pointer', fontSize:14, color:'var(--text2)' }}>→</button>
        <button onClick={goToday} style={{ padding:'5px 12px', borderRadius:8, border:'0.5px solid var(--border2)', background:'transparent', color:'var(--text2)', fontSize:12, cursor:'pointer' }}>Oggi</button>
        <select style={{ ...fieldStyle, fontSize:12, padding:'5px 10px' }} value={statoFilter} onChange={e => setStatoFilter(e.target.value)}>
          <option value="">Tutti gli stati</option>
          {STATI.map(s => <option key={s} value={s}>{STATI_LABELS[s]}</option>)}
        </select>
        <div style={{ flex:1 }} />
        <button onClick={() => { setAddPrefillDate(''); setAddPrefillChannel(''); setShowAdd(s => !s) }} style={{ padding:'7px 14px', borderRadius:8, border:'none', background:'var(--accent)', color:'white', fontSize:13, fontWeight:500, cursor:'pointer' }}>
          {showAdd ? '✕ Annulla' : '+ Nuovo contenuto'}
        </button>
      </div>

      {/* Channel legend */}
      <div style={{ display:'flex', gap:12, marginBottom:'1rem', flexWrap:'wrap', alignItems:'center' }}>
        {Object.entries(CH_COLOR).map(([ch, c]) => (
          <div key={ch} style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:10, height:10, borderRadius:'50%', background: c.bg }} />
            <span style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--mono)' }}>{c.label}</span>
          </div>
        ))}
        <span style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--mono)', opacity:0.5 }}>— clicca per dettagli</span>
      </div>

      {showAdd && <AddEditorialForm onAdded={onAdded} onCancel={() => setShowAdd(false)} prefillDate={addPrefillDate} prefillChannel={addPrefillChannel} />}

      {loading ? <Spinner /> : (
        <>
          {view==='day' && <DayView items={filtered} date={currentDate} onSelect={setSelectedItem} onAdd={handleAdd} />}
          {view==='week' && <WeekView items={filtered} weekStart={weekStart} onSelect={setSelectedItem} onAdd={handleAdd} />}
          {view==='month' && <MonthView items={filtered} month={currentMonth} onSelect={setSelectedItem} onAdd={handleAdd} />}
          {view==='timeline' && <TimelineView items={filtered} weekStart={weekStart} onSelect={setSelectedItem} onAdd={handleAdd} />}
        </>
      )}
    </div>
  )
}
