import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import TaskCard from './TaskCard'
import AddTask from './AddTask'
import { SectionLabel, Empty, Spinner, Select } from './UI'

const todayStr = new Date().toISOString().slice(0,10)
const tomorrowStr = (() => { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().slice(0,10) })()
const weekEndStr = (() => { const d = new Date(); d.setDate(d.getDate()+7); return d.toISOString().slice(0,10) })()
const monthEndStr = (() => { const d = new Date(); d.setMonth(d.getMonth()+1); return d.toISOString().slice(0,10) })()

const MONTH_NAMES = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']

const TYPE_LABELS = {
  videomaker: [['video','Video'],['image','Immagine'],['altro','Altro']],
  copywriter:  [['copy','Copy'],['altro','Altro']],
  tecnico:     [['bug','Bug'],['ticket','Ticket'],['setup','Setup'],['altro','Altro']],
  social:      [['reel','Reel'],['post','Post'],['story','Story'],['short','Short/TikTok'],['video','Video'],['altro','Altro']],
}

const QUICK_FILTERS = [
  { id:'all',     label:'Tutte' },
  { id:'late',    label:'Scadute' },
  { id:'today',   label:'Oggi' },
  { id:'tomorrow',label:'Domani' },
  { id:'week',    label:'Settimana' },
  { id:'month',   label:'Mese' },
  { id:'range',   label:'Intervallo' },
]

function groupByMonth(tasks) {
  const groups = {}
  const noDate = []
  tasks.forEach(t => {
    if (!t.due_date) { noDate.push(t); return }
    const [y, m] = t.due_date.split('-')
    const key = `${y}-${m}`
    if (!groups[key]) groups[key] = []
    groups[key].push(t)
  })
  const sorted = Object.keys(groups).sort()
  return { sorted, groups, noDate }
}

function monthLabel(key) {
  const [y, m] = key.split('-')
  return `${MONTH_NAMES[parseInt(m)-1]} ${y}`
}

export default function TaskSection({ section }) {
  const [tasks, setTasks] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [quickFilter, setQuickFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [rangeFrom, setRangeFrom] = useState('')
  const [rangeTo, setRangeTo] = useState('')
  const [showRange, setShowRange] = useState(false)
  const fromRef = useRef(null)
  const toRef = useRef(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('tasks')
      .select('*, assignee:profiles!tasks_assigned_to_fkey(full_name), creator:profiles!tasks_created_by_fkey(full_name)')
      .eq('section', section)
      .order('due_date', { ascending: true })
    setTasks((data || []).map(t => ({ ...t, assignee_name: t.assignee?.full_name, creator_name: t.creator?.full_name })))
    setLoading(false)
  }

  useEffect(() => { load() }, [section])

  useEffect(() => {
    supabase.from('profiles').select('id, full_name').then(({ data }) => {
      if (data) setMembers(data)
    })
  }, [])

  useEffect(() => {
    if (quickFilter === 'range') setShowRange(true)
    else { setShowRange(false); setRangeFrom(''); setRangeTo('') }
  }, [quickFilter])

  function onAdded(task) { setTasks(prev => [task, ...prev]) }
  function onUpdate(updated) { setTasks(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t)) }
  function onDelete(id) { setTasks(prev => prev.filter(t => t.id !== id)) }

  // Stats sempre su tutte le task
  const lateCount = tasks.filter(t => !t.done && t.due_date && t.due_date < todayStr).length
  const doneCount = tasks.filter(t => t.done).length
  const todoCount = tasks.filter(t => !t.done).length

  // Filtro per data (quick filter)
  function matchesDateFilter(t) {
    const d = t.due_date
    switch (quickFilter) {
      case 'all': return true
      case 'late': return !t.done && d && d < todayStr
      case 'today': return d === todayStr
      case 'tomorrow': return d === tomorrowStr
      case 'week': return d && d >= todayStr && d <= weekEndStr
      case 'month': return d && d >= todayStr && d <= monthEndStr
      case 'range':
        if (!rangeFrom && !rangeTo) return true
        if (rangeFrom && rangeTo) return d && d >= rangeFrom && d <= rangeTo
        if (rangeFrom) return d && d >= rangeFrom
        if (rangeTo) return d && d <= rangeTo
        return true
      default: return true
    }
  }

  const filtered = tasks.filter(t => {
    if (!matchesDateFilter(t)) return false
    if (statusFilter === 'todo' && t.done) return false
    if (statusFilter === 'done' && !t.done) return false
    if (assigneeFilter && t.assigned_to !== assigneeFilter) return false
    if (typeFilter && t.type !== typeFilter) return false
    return true
  })

  const { sorted: monthKeys, groups, noDate } = groupByMonth(filtered)

  const btnStyle = (active) => ({
    padding:'4px 12px', borderRadius:20, fontSize:11, cursor:'pointer',
    fontFamily:'var(--font)', border:`0.5px solid ${active ? 'var(--accent)' : 'var(--border2)'}`,
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? 'white' : 'var(--text2)',
    fontWeight: active ? 500 : 400, transition:'all 0.15s',
    whiteSpace:'nowrap',
  })

  return (
    <div>
      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:'1.5rem' }}>
        {[
          { label:'Da fare', value: todoCount },
          { label:'Completati', value: doneCount, color: doneCount>0?'var(--green)':undefined },
          { label:'In ritardo', value: lateCount, color: lateCount>0?'var(--red)':undefined },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background:'var(--bg2)', borderRadius:'var(--radius)', padding:'14px 16px', border:'0.5px solid var(--border)' }}>
            <div style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--mono)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>{label}</div>
            <div style={{ fontSize:22, fontWeight:600, color: color || 'var(--text)' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filtri */}
      <div style={{ background:'var(--bg2)', borderRadius:'var(--radius)', border:'0.5px solid var(--border)', padding:'12px 14px', marginBottom:'1.2rem', display:'flex', flexDirection:'column', gap:10 }}>

        {/* Quick date filters */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
          <span style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--mono)', textTransform:'uppercase', marginRight:2 }}>Periodo</span>
          {QUICK_FILTERS.map(f => (
            <button key={f.id} onClick={() => setQuickFilter(f.id)} style={btnStyle(quickFilter === f.id)}>{f.label}</button>
          ))}
        </div>

        {/* Range picker */}
        {showRange && (
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <span style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--mono)' }}>Dal</span>
            <div style={{ position:'relative' }}>
              <button
                onClick={() => fromRef.current?.showPicker?.() || fromRef.current?.focus()}
                style={{ padding:'4px 10px', borderRadius:7, border:'0.5px solid var(--border2)', background:'var(--bg3)', color: rangeFrom ? 'var(--text)' : 'var(--text3)', fontSize:11, cursor:'pointer', fontFamily:'var(--mono)' }}
              >{rangeFrom || '📅 Seleziona'}</button>
              <input ref={fromRef} type="date" value={rangeFrom} onChange={e => setRangeFrom(e.target.value)}
                style={{ position:'absolute', opacity:0, pointerEvents:'none', width:1, height:1, top:0, left:0 }} />
            </div>
            <span style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--mono)' }}>Al</span>
            <div style={{ position:'relative' }}>
              <button
                onClick={() => toRef.current?.showPicker?.() || toRef.current?.focus()}
                style={{ padding:'4px 10px', borderRadius:7, border:'0.5px solid var(--border2)', background:'var(--bg3)', color: rangeTo ? 'var(--text)' : 'var(--text3)', fontSize:11, cursor:'pointer', fontFamily:'var(--mono)' }}
              >{rangeTo || '📅 Seleziona'}</button>
              <input ref={toRef} type="date" value={rangeTo} onChange={e => setRangeTo(e.target.value)}
                style={{ position:'absolute', opacity:0, pointerEvents:'none', width:1, height:1, top:0, left:0 }} />
            </div>
            {(rangeFrom || rangeTo) && (
              <button onClick={() => { setRangeFrom(''); setRangeTo('') }}
                style={{ padding:'4px 8px', borderRadius:7, border:'0.5px solid var(--border2)', background:'transparent', color:'var(--text3)', fontSize:11, cursor:'pointer' }}>× Reset</button>
            )}
          </div>
        )}

        {/* Altri filtri */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <span style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--mono)', textTransform:'uppercase', marginRight:2 }}>Stato</span>
          <Select value={statusFilter} onChange={setStatusFilter}>
            <option value="">Tutti</option>
            <option value="todo">Da fare</option>
            <option value="done">Completati</option>
          </Select>

          <span style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--mono)', textTransform:'uppercase', marginRight:2 }}>Assegnatario</span>
          <Select value={assigneeFilter} onChange={setAssigneeFilter}>
            <option value="">Tutti</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
          </Select>

          <span style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--mono)', textTransform:'uppercase', marginRight:2 }}>Tipo</span>
          <Select value={typeFilter} onChange={setTypeFilter}>
            <option value="">Tutti</option>
            {(TYPE_LABELS[section] || []).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </Select>

          {(statusFilter || assigneeFilter || typeFilter || quickFilter !== 'all') && (
            <button onClick={() => { setStatusFilter(''); setAssigneeFilter(''); setTypeFilter(''); setQuickFilter('all') }}
              style={{ padding:'4px 10px', borderRadius:7, border:'0.5px solid var(--border2)', background:'transparent', color:'var(--text3)', fontSize:11, cursor:'pointer', fontFamily:'var(--mono)' }}>
              × Reset filtri
            </button>
          )}
        </div>
      </div>

      <AddTask section={section} onAdded={onAdded} />

      {loading ? <Spinner /> : filtered.length === 0 ? <Empty /> : (
        <>
          {/* Gruppi mensili */}
          {monthKeys.map(key => {
            const monthTasks = groups[key]
            const todo = monthTasks.filter(t => !t.done)
            const done = monthTasks.filter(t => t.done)
            return (
              <div key={key} style={{ marginBottom:'1.5rem' }}>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--text2)', fontFamily:'var(--mono)', padding:'6px 0', borderBottom:'0.5px solid var(--border)', marginBottom:10, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span>📅 {monthLabel(key)}</span>
                  <span style={{ fontSize:10, color:'var(--text3)', fontWeight:400 }}>{monthTasks.length} task</span>
                </div>
                {todo.length > 0 && (
                  <>
                    <SectionLabel>Da fare</SectionLabel>
                    <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:8 }}>
                      {todo.map(t => <TaskCard key={t.id} task={t} onUpdate={onUpdate} onDelete={onDelete} />)}
                    </div>
                  </>
                )}
                {done.length > 0 && (
                  <>
                    <SectionLabel>Completati</SectionLabel>
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      {done.map(t => <TaskCard key={t.id} task={t} onUpdate={onUpdate} onDelete={onDelete} />)}
                    </div>
                  </>
                )}
              </div>
            )
          })}

          {/* Task senza data */}
          {noDate.length > 0 && (
            <div style={{ marginBottom:'1.5rem' }}>
              <div style={{ fontSize:12, fontWeight:600, color:'var(--text2)', fontFamily:'var(--mono)', padding:'6px 0', borderBottom:'0.5px solid var(--border)', marginBottom:10, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span>📌 Senza data</span>
                <span style={{ fontSize:10, color:'var(--text3)', fontWeight:400 }}>{noDate.length} task</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {noDate.map(t => <TaskCard key={t.id} task={t} onUpdate={onUpdate} onDelete={onDelete} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
