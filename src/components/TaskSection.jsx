import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import TaskCard from './TaskCard'
import AddTask from './AddTask'
import { SectionLabel, Empty, Spinner, Select } from './UI'

const todayStr = new Date().toISOString().slice(0,10)

function buildMonthOptions() {
  const opts = [{ val:'', label:'Tutti i mesi' }]
  const now = new Date()
  for (let i = -2; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const val = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    const label = d.toLocaleDateString('it-IT', { month:'long', year:'numeric' })
    opts.push({ val, label })
  }
  return opts
}

const thisMonth = (() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
})()

export default function TaskSection({ section }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [prioFilter, setPrioFilter] = useState('')
  const monthOptions = buildMonthOptions()

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

  function onAdded(task) { setTasks(prev => [task, ...prev]) }
  function onUpdate(updated) { setTasks(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t)) }
  function onDelete(id) { setTasks(prev => prev.filter(t => t.id !== id)) }

  const monthTasks = month
    ? tasks.filter(t => t.due_date?.startsWith(month))
    : tasks
  const doneCount = monthTasks.filter(t => t.done).length
  const total = monthTasks.length
  const lateCount = tasks.filter(t => !t.done && t.due_date && t.due_date < todayStr).length

  let filtered = tasks.filter(t => {
    if (month && !t.due_date?.startsWith(month)) return false
    if (statusFilter === 'todo' && t.done) return false
    if (statusFilter === 'done' && !t.done) return false
    if (prioFilter && t.priority !== prioFilter) return false
    return true
  })

  const todo = filtered.filter(t => !t.done)
  const done = filtered.filter(t => t.done)

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:'1.5rem' }}>
        {[
          { label:'completati / mese', value:`${doneCount} / ${total}`, color: doneCount===total&&total>0?'var(--green)':undefined },
          { label:'in sospeso', value: total - doneCount },
          { label:'in ritardo', value: lateCount, color: lateCount>0?'var(--red)':undefined },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background:'var(--bg2)', borderRadius:'var(--radius)', padding:'14px 16px', border:'0.5px solid var(--border)' }}>
            <div style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--mono)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>{label}</div>
            <div style={{ fontSize:22, fontWeight:600, color: color || 'var(--text)' }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', background:'var(--bg2)', borderRadius:'var(--radius)', border:'0.5px solid var(--border)', padding:'10px 14px', marginBottom:'1.2rem' }}>
        <span style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--mono)', textTransform:'uppercase' }}>Mese</span>
        <Select value={month} onChange={setMonth}>
          {monthOptions.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
        </Select>
        <span style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--mono)', textTransform:'uppercase' }}>Stato</span>
        <Select value={statusFilter} onChange={setStatusFilter}>
          <option value="">Tutti</option>
          <option value="todo">Da fare</option>
          <option value="done">Completati</option>
        </Select>
        {section === 'tecnico' && <>
          <span style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--mono)', textTransform:'uppercase' }}>Priorità</span>
          <Select value={prioFilter} onChange={setPrioFilter}>
            <option value="">Tutte</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="bassa">Bassa</option>
          </Select>
        </>}
      </div>

      <AddTask section={section} onAdded={onAdded} />

      {loading ? <Spinner /> : (
        <>
          {todo.length > 0 && (
            <>
              <SectionLabel>Da fare</SectionLabel>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
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
          {filtered.length === 0 && <Empty />}
        </>
      )}
    </div>
  )
}
