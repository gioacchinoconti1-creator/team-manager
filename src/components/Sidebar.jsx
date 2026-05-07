import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Badge, ChBadge, PrioBadge } from './UI'

const todayStr = new Date().toISOString().slice(0,10)
const SECTION_LABELS = { videomaker:'Video Maker', copywriter:'Copywriter', tecnico:'Tecnico', social:'Social' }
const SECTION_ICONS  = { videomaker:'🎬', copywriter:'✍️', tecnico:'⚙️', social:'📱' }

function TaskMini({ task, onUpdate }) {
  const late = !task.done && task.due_date && task.due_date < todayStr
  const dateLabel = task.due_date
    ? new Date(task.due_date + 'T00:00:00').toLocaleDateString('it-IT', { day:'numeric', month:'short' })
    : null

  async function toggleDone() {
    const { data } = await supabase.from('tasks').update({ done: !task.done }).eq('id', task.id).select().single()
    if (data) onUpdate(data)
  }

  return (
    <div style={{
      background: 'var(--bg2)',
      border: `0.5px solid ${late ? 'rgba(244,91,91,0.3)' : 'var(--border)'}`,
      borderRadius: 8, padding: '10px 12px',
      opacity: task.done ? 0.45 : 1, transition: 'opacity 0.15s',
    }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
        <div onClick={toggleDone} style={{
          width:15, height:15, borderRadius:4, flexShrink:0, marginTop:1,
          border: task.done ? 'none' : '1.5px solid var(--border2)',
          background: task.done ? 'var(--green)' : 'transparent',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:9, color:'white', cursor:'pointer',
        }}>{task.done && '✓'}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{
            fontSize:12, fontWeight:500, lineHeight:1.4, marginBottom:4,
            textDecoration: task.done ? 'line-through' : 'none',
            color: task.done ? 'var(--text3)' : 'var(--text)',
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
          }}>{task.title}</div>
          <div style={{ display:'flex', gap:4, flexWrap:'wrap', alignItems:'center' }}>
            <span style={{ fontSize:9, padding:'1px 5px', borderRadius:10, background:'var(--bg3)', color:'var(--text3)', fontFamily:'var(--mono)' }}>
              {SECTION_ICONS[task.section]} {SECTION_LABELS[task.section]}
            </span>
            <Badge type={task.type} />
            {task.priority && <PrioBadge priority={task.priority} />}
            {dateLabel && (
              <span style={{ fontSize:10, fontFamily:'var(--mono)', color: late ? 'var(--red)' : 'var(--text3)' }}>
                {late ? '⚠ ' : ''}{dateLabel}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Sidebar({ visible, onClose }) {
  const { profile } = useAuth()
  const [members, setMembers] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('todo')

  useEffect(() => {
    supabase.from('profiles').select('id, full_name').then(({ data }) => {
      if (data) {
        setMembers(data)
        if (profile?.id) setSelectedId(profile.id)
      }
    })
  }, [profile])

  useEffect(() => {
    if (!selectedId) return
    loadTasks()
  }, [selectedId])

  async function loadTasks() {
    setLoading(true)

    const { data: directTasks } = await supabase
      .from('tasks')
      .select('*, assignee:profiles!tasks_assigned_to_fkey(full_name), creator:profiles!tasks_created_by_fkey(full_name)')
      .eq('assigned_to', selectedId)

    const { data: multiAssignRows } = await supabase
      .from('task_assignees')
      .select('task_id')
      .eq('profile_id', selectedId)

    let multiTasks = []
    if (multiAssignRows && multiAssignRows.length > 0) {
      const ids = multiAssignRows.map(r => r.task_id)
      const { data } = await supabase
        .from('tasks')
        .select('*, assignee:profiles!tasks_assigned_to_fkey(full_name), creator:profiles!tasks_created_by_fkey(full_name)')
        .in('id', ids)
      multiTasks = data || []
    }

    const all = [...(directTasks || []), ...multiTasks]
    const seen = new Set()
    const merged = all.filter(t => {
      if (seen.has(t.id)) return false
      seen.add(t.id); return true
    }).map(t => ({ ...t, assignee_name: t.assignee?.full_name, creator_name: t.creator?.full_name }))

    setTasks(merged)
    setLoading(false)
  }

  function onUpdate(updated) {
    setTasks(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t))
  }

  const filtered = tasks.filter(t => {
    if (statusFilter === 'todo' && t.done) return false
    if (statusFilter === 'done' && !t.done) return false
    return true
  })

  const lateCount = tasks.filter(t => !t.done && t.due_date && t.due_date < todayStr).length
  const todoCount = tasks.filter(t => !t.done).length
  const doneCount = tasks.filter(t => t.done).length

  if (!visible) return null

  return (
    // Nessun position:sticky — sta nel flow normale del flex layout di Dashboard
    <div style={{
      width: 280,
      flexShrink: 0,
      background: 'var(--bg2)',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      display: 'flex',
      flexDirection: 'column',
      maxHeight: 'calc(100vh - 6rem)',
      overflow: 'hidden',
      // Sticky rispetto allo scroll ma senza uscire dal flow
      position: 'sticky',
      top: '5rem',
      alignSelf: 'flex-start',
    }}>
      {/* Header */}
      <div style={{ padding:'14px 16px', borderBottom:'0.5px solid var(--border)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
          <span style={{ fontSize:13, fontWeight:600, flex:1 }}>Task per membro</span>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', fontSize:16 }}>×</button>
        </div>

        <select
          value={selectedId || ''}
          onChange={e => setSelectedId(e.target.value)}
          style={{ width:'100%', padding:'7px 10px', borderRadius:8, border:'0.5px solid var(--border2)', background:'var(--bg3)', color:'var(--text)', fontSize:12, fontFamily:'var(--font)', cursor:'pointer', marginBottom:8 }}
        >
          {members.map(m => (
            <option key={m.id} value={m.id}>
              {m.full_name}{m.id === profile?.id ? ' (tu)' : ''}
            </option>
          ))}
        </select>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
          {[
            { label:'Da fare', value: todoCount },
            { label:'Fatti', value: doneCount, color:'var(--green)' },
            { label:'Ritardo', value: lateCount, color: lateCount>0?'var(--red)':undefined },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background:'var(--bg3)', borderRadius:7, padding:'6px 8px', textAlign:'center' }}>
              <div style={{ fontSize:9, color:'var(--text3)', fontFamily:'var(--mono)', textTransform:'uppercase', marginBottom:2 }}>{label}</div>
              <div style={{ fontSize:16, fontWeight:600, color: color||'var(--text)' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter */}
      <div style={{ padding:'8px 16px', borderBottom:'0.5px solid var(--border)', flexShrink:0, display:'flex', gap:4 }}>
        {[['todo','Da fare'],['done','Completati'],['','Tutti']].map(([val,label]) => (
          <button key={val} onClick={() => setStatusFilter(val)} style={{
            flex:1, padding:'4px 8px', borderRadius:20, border:'0.5px solid var(--border2)',
            background: statusFilter===val ? 'var(--accent)' : 'transparent',
            color: statusFilter===val ? 'white' : 'var(--text2)',
            fontSize:11, cursor:'pointer', fontFamily:'var(--font)',
            borderColor: statusFilter===val ? 'var(--accent)' : 'var(--border2)',
          }}>{label}</button>
        ))}
      </div>

      {/* Task list */}
      <div style={{ overflowY:'auto', padding:'10px 12px', display:'flex', flexDirection:'column', gap:6, flex:1 }}>
        {loading
          ? <div style={{ color:'var(--text3)', fontSize:12, fontFamily:'var(--mono)', textAlign:'center', padding:'1rem' }}>// caricamento...</div>
          : filtered.length === 0
            ? <div style={{ color:'var(--text3)', fontSize:12, fontFamily:'var(--mono)', textAlign:'center', padding:'1rem' }}>// nessun task</div>
            : filtered
                .sort((a,b) => {
                  if (!a.due_date) return 1
                  if (!b.due_date) return -1
                  return a.due_date.localeCompare(b.due_date)
                })
                .map(t => <TaskMini key={t.id} task={t} onUpdate={onUpdate} />)
        }
      </div>
    </div>
  )
}
