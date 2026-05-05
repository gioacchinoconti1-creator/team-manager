import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { ChBadge, StatoBadge, Badge, fieldStyle } from './UI'

const STATI = ['pianificazione','brief','produzione','pronto','pubblicato']
const STATI_LABELS = { pianificazione:'In pianificazione', brief:'Brief pronto', produzione:'In produzione', pronto:'Pronto', pubblicato:'Pubblicato' }

export default function EditorialCard({ item, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ ...item })

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function save() {
    const { data } = await supabase.from('editorial_plan').update({
      title: form.title,
      channel: form.channel,
      format: form.format,
      publish_date: form.publish_date,
      stato: form.stato,
      brief: form.brief,
      caption: form.caption,
      hashtags: form.hashtags,
      cta: form.cta,
      notes: form.notes,
      drive_link: form.drive_link,
      published_link: form.published_link,
    }).eq('id', item.id).select().single()
    if (data) { onUpdate(data); setEditing(false) }
  }

  async function deleteItem() {
    if (!confirm('Eliminare questo contenuto?')) return
    await supabase.from('editorial_plan').delete().eq('id', item.id)
    onDelete(item.id)
  }

  function openCalendar() {
    if (!item.publish_date) return
    const date = item.publish_date.replace(/-/g, '')
    const title = encodeURIComponent(item.title)
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${date}/${date}&reminders=POPUP,0,POPUP,1440,POPUP,4320`
    window.open(url, '_blank')
  }

  const dateLabel = item.publish_date ? new Date(item.publish_date + 'T00:00:00').toLocaleDateString('it-IT', { day:'numeric', month:'short' }) : null
  const FORMAT_LABELS = { reel:'Reel', post:'Post', story:'Story', short:'Short', video:'Video', altro:'Altro' }

  if (editing) {
    return (
      <div style={{ background:'var(--bg2)', border:'0.5px solid var(--accent)', borderRadius:'var(--radius-lg)', padding:16 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
          <input style={{ ...fieldStyle, gridColumn:'1/-1' }} value={form.title} onChange={e => set('title',e.target.value)} placeholder="Titolo contenuto..." />
          <select style={fieldStyle} value={form.channel} onChange={e => set('channel',e.target.value)}>
            <option value="ig">IG / FB</option>
            <option value="youtube">YouTube</option>
            <option value="tiktok">TikTok</option>
          </select>
          <select style={fieldStyle} value={form.format} onChange={e => set('format',e.target.value)}>
            {Object.entries(FORMAT_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <input style={fieldStyle} type="date" value={form.publish_date||''} onChange={e => set('publish_date',e.target.value)} />
          <select style={fieldStyle} value={form.stato} onChange={e => set('stato',e.target.value)}>
            {STATI.map(s => <option key={s} value={s}>{STATI_LABELS[s]}</option>)}
          </select>
        </div>
        {[
          ['brief','Brief / descrizione del video','textarea'],
          ['caption','Caption / testo del post','textarea'],
          ['hashtags','Hashtag','input'],
          ['cta','CTA (call to action)','input'],
          ['notes','Note interne','textarea'],
          ['drive_link','Link Drive (materiale grezzo)','input'],
          ['published_link','Link contenuto pubblicato','input'],
        ].map(([key, placeholder, tag]) => (
          tag === 'textarea'
            ? <textarea key={key} style={{ ...fieldStyle, width:'100%', resize:'vertical', minHeight:60, marginBottom:8, lineHeight:1.5 }} value={form[key]||''} onChange={e => set(key,e.target.value)} placeholder={placeholder} />
            : <input key={key} style={{ ...fieldStyle, width:'100%', marginBottom:8 }} value={form[key]||''} onChange={e => set(key,e.target.value)} placeholder={placeholder} />
        ))}
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={save} style={{ padding:'7px 14px', borderRadius:8, border:'none', background:'var(--accent)', color:'white', fontSize:13, fontWeight:500, cursor:'pointer' }}>Salva</button>
          <button onClick={() => setEditing(false)} style={{ padding:'7px 14px', borderRadius:8, border:'0.5px solid var(--border2)', background:'transparent', color:'var(--text2)', fontSize:13, cursor:'pointer' }}>Annulla</button>
          <button onClick={deleteItem} style={{ padding:'7px 14px', borderRadius:8, border:'0.5px solid rgba(244,91,91,0.3)', background:'transparent', color:'#f87171', fontSize:13, cursor:'pointer', marginLeft:'auto' }}>Elimina</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background:'var(--bg2)', border:'0.5px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'14px 16px', transition:'border-color 0.15s' }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
            <span style={{ fontSize:14, fontWeight:500, color:'var(--text)', flex:1 }}>{item.title}</span>
            <button onClick={() => setEditing(true)} style={{ fontSize:11, padding:'2px 8px', borderRadius:6, border:'0.5px solid var(--border2)', background:'transparent', color:'var(--text3)', cursor:'pointer', fontFamily:'var(--mono)' }}>✏️ Modifica</button>
            {item.publish_date && <button onClick={openCalendar} style={{ fontSize:11, padding:'2px 8px', borderRadius:6, border:'0.5px solid var(--border2)', background:'transparent', color:'var(--text3)', cursor:'pointer', fontFamily:'var(--mono)' }}>📅 Reminder</button>}
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center', marginBottom: expanded ? 10 : 0 }}>
            {item.channel && <ChBadge channel={item.channel} />}
            {item.format && <Badge type={item.format}>{FORMAT_LABELS[item.format]||item.format}</Badge>}
            <StatoBadge stato={item.stato} />
            {dateLabel && <span style={{ fontSize:11, fontFamily:'var(--mono)', color:'var(--text2)' }}>📅 {dateLabel}</span>}
            {(item.brief||item.caption||item.hashtags||item.cta||item.notes) && (
              <button onClick={() => setExpanded(e => !e)} style={{ fontSize:11, color:'var(--text3)', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--mono)' }}>
                {expanded ? '▲ chiudi' : '▼ dettagli'}
              </button>
            )}
          </div>

          {expanded && (
            <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:8 }}>
              {[
                ['Brief', item.brief],
                ['Caption', item.caption],
                ['Hashtag', item.hashtags],
                ['CTA', item.cta],
                ['Note', item.notes],
              ].filter(([,v]) => v).map(([label, value]) => (
                <div key={label}>
                  <div style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--mono)', textTransform:'uppercase', marginBottom:3 }}>{label}</div>
                  <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.6, padding:'8px 10px', borderRadius:7, background:'var(--bg3)', whiteSpace:'pre-wrap' }}>{value}</div>
                </div>
              ))}
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {item.drive_link && <a href={item.drive_link} target="_blank" rel="noreferrer" style={{ fontSize:11, color:'var(--accent2)', fontFamily:'var(--mono)' }}>↗ Materiale Drive</a>}
                {item.published_link && <a href={item.published_link} target="_blank" rel="noreferrer" style={{ fontSize:11, color:'var(--green)', fontFamily:'var(--mono)' }}>↗ Contenuto pubblicato</a>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
