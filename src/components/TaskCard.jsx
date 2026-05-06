import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Badge, ChBadge, PrioBadge, fieldStyle } from './UI'

const todayStr = new Date().toISOString().slice(0,10)

const TYPE_OPTIONS = {
  videomaker: [['video','Video'],['image','Immagine'],['altro','Altro']],
  copywriter:  [['copy','Copy'],['altro','Altro']],
  tecnico:     [['bug','Bug'],['ticket','Ticket'],['setup','Setup'],['altro','Altro']],
  social:      [['reel','Reel'],['post','Post'],['story','Story'],['short','Short/TikTok'],['video','Video'],['altro','Altro']],
}

export default function TaskCard({ task, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [driveVal, setDriveVal] = useState(task.drive_link || '')
  const [members, setMembers] = useState([])
  const creatorName = task.creator_name || ''
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || '',
    type: task.type,
    due_date: task.due_date || '',
    assigned_to: task.assigned_to || '',
    channel: task.channel || 'ig',
    priority: task.priority || 'media',
  })

  const late = !task.done && task.due_date && task.due_date < todayStr
  const dateLabel = task.due_date ? new Date(task.due_date + 'T00:00:00').toLocaleDateString('it-IT', { day:'numeric', month:'short' }) : null

  useEffect(() => {
    supabase.from('profiles').select('id, full_name').then(({ data }) => {
      if (data) setMembers(data)
    })
  }, [])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function openCalendar() {
    if (!task.due_date) return
    const date = task.due_date.replace(/-/g, '')
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(task.title)}&dates=${date}/${date}&details=${encodeURIComponent(task.description||'')}&reminders=POPUP,0,POPUP,1440,POPUP,4320`
    window.open(url, '_blank')
  }

  async function toggleDone() {
    const { data } = await supabase.from('tasks').update({ done: !task.done }).eq('id', task.id).select().single()
    if (data) onUpdate(data)
  }

  async function saveDrive() {
    const { data } = await supabase.from('tasks').update({ drive_link: driveVal }).eq('id', task.id).select().single()
    if (data) onUpdate(data)
  }

  async function saveEdit() {
    const { data } = await supabase.from('tasks').update({
      title: form.title.trim(),
      description: form.description.trim() || null,
      type: form.type,
      due_date: form.due_date || null,
      assigned_to: form.assigned_to || null,
      channel: task.section === 'social' ? form.channel : task.channel,
      priority: task.section === 'tecnico' ? form.priority : task.priority,
    }).eq('id', task.id).select('*, assignee:profiles!tasks_assigned_to_fkey(full_name)').single()
    if (data) {
      onUpdate({ ...data, assignee_name: data.assignee?.full_name })
      setEditing(false)
    }
  }

  async function deleteTask() {
    if (!confirm('Eliminare questo task?')) return
    await supabase.from('tasks').delete().eq('id', task.id)
    if (onDelete) onDelete(task.id)
  }

  // Edit mode
  if (editing) {
    return (
      <div style={{ background:'var(--bg2)', border:'0.5px solid var(--accent)', borderRadius:'var(--radius-lg)', padding:'14px 16px' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <input style={{ ...fieldStyle, width:'100%' }} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Titolo..." />
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <select style={fieldStyle} value={form.type} onChange={e => set('type', e.target.value)}>
              {(TYPE_OPTIONS[task.section] || []).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            {task.section === 'social' && (
              <select style={fieldStyle} value={form.channel} onChange={e => set('channel', e.target.value)}>
                <option value="ig">IG / FB</option>
                <option value="youtube">YouTube</option>
                <option value="tiktok">TikTok</option>
              </select>
            )}
            {task.section === 'tecnico' && (
              <select style={fieldStyle} value={form.priority} onChange={e => set('priority', e.target.value)}>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="bassa">Bassa</option>
              </select>
            )}
            <input style={fieldStyle} type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
            <select style={fieldStyle} value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}>
              <option value="">Assegna a...</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
          </div>
          <textarea style={{ ...fieldStyle, width:'100%', resize:'vertical', minHeight:52, lineHeight:1.5 }}
            value={form.description} onChange={e => set('description', e.target.value)} placeholder="Descrizione..." />
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={saveEdit} style={{ padding:'7px 14px', borderRadius:8, border:'none', background:'var(--accent)', color:'white', fontSize:13, fontWeight:500, cursor:'pointer' }}>Salva</button>
            <button onClick={() => setEditing(false)} style={{ padding:'7px 14px', borderRadius:8, border:'0.5px solid var(--border2)', background:'transparent', color:'var(--text2)', fontSize:13, cursor:'pointer' }}>Annulla</button>
            <button onClick={deleteTask} style={{ padding:'7px 14px', borderRadius:8, border:'0.5px solid rgba(244,91,91,0.3)', background:'transparent', color:'#f87171', fontSize:13, cursor:'pointer', marginLeft:'auto' }}>Elimina</button>
          </div>
        </div>
      </div>
    )
  }

  // Normal mode
  return (
    <div style={{
      background:'var(--bg2)',
      border:`0.5px solid ${late ? 'rgba(244,91,91,0.35)' : 'var(--border)'}`,
      borderRadius:'var(--radius-lg)', padding:'14px 16px',
      opacity: task.done ? 0.45 : 1, transition:'all 0.15s'
    }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
        <div onClick={toggleDone} style={{
          width:18, height:18, borderRadius:5, flexShrink:0, marginTop:2,
          border: task.done ? 'none' : '1.5px solid var(--border2)',
          background: task.done ? 'var(--green)' : 'transparent',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:10, color:'white', cursor:'pointer'
        }}>{task.done && '✓'}</div>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:6 }}>
            <div style={{ fontSize:14, fontWeight:500, flex:1, lineHeight:1.4, textDecoration: task.done?'line-through':'none', color: task.done?'var(--text3)':'var(--text)' }}>
              {task.title}
            </div>
            <div style={{ display:'flex', gap:4, flexShrink:0 }}>
              {task.description && (
                <button onClick={() => setExpanded(e => !e)} style={{ fontSize:11, color:'var(--text3)', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--mono)' }}>
                  {expanded ? '▲' : '▼'}
                </button>
              )}
              <button onClick={() => setEditing(true)} style={{ fontSize:11, color:'var(--text3)', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--mono)' }}>✏️</button>
            </div>
          </div>

          {expanded && task.description && (
            <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.6, marginBottom:8, padding:'10px 12px', borderRadius:8, background:'var(--bg3)', border:'0.5px solid var(--border)', whiteSpace:'pre-wrap' }}>
              {task.description}
            </div>
          )}

          <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
            <Badge type={task.type} />
            {task.channel && <ChBadge channel={task.channel} />}
            {task.priority && <PrioBadge priority={task.priority} />}
            {dateLabel && (
              <span style={{ fontSize:11, fontFamily:'var(--mono)', color: late?'var(--red)':'var(--text2)' }}>
                {late ? '⚠ ' : ''}{dateLabel}
              </span>
            )}
            {task.assignee_name && (
              <span style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--mono)' }}>@{task.assignee_name}</span>
            )}
            {creatorName && (
  <span style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--mono)', opacity:0.7 }}>✍️ {creatorName}</span>
)}
            {task.due_date && (
              <button onClick={openCalendar} style={{ fontSize:11, padding:'2px 8px', borderRadius:6, border:'0.5px solid var(--border2)', background:'transparent', color:'var(--text3)', cursor:'pointer', fontFamily:'var(--mono)' }}>
                📅 Reminder
              </button>
            )}
            {task.done && (
              task.drive_link
                ? <a href={task.drive_link} target="_blank" rel="noreferrer" style={{ fontSize:11, color:'var(--accent2)', fontFamily:'var(--mono)' }}>↗ Drive</a>
                : <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                    <input value={driveVal} onChange={e => setDriveVal(e.target.value)} placeholder="Incolla link Drive..."
                      style={{ fontSize:12, padding:'3px 8px', borderRadius:6, border:'0.5px solid var(--border2)', background:'var(--bg3)', color:'var(--text)', fontFamily:'var(--mono)', width:180 }} />
                    <button onClick={saveDrive} style={{ fontSize:11, padding:'3px 8px', borderRadius:6, border:'0.5px solid var(--border2)', background:'transparent', color:'var(--accent2)', cursor:'pointer' }}>Salva</button>
                  </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
