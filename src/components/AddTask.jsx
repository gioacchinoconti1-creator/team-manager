import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { fieldStyle } from './UI'

const TYPE_OPTIONS = {
  videomaker: [['video','Video'],['image','Immagine'],['altro','Altro']],
  copywriter:  [['copy','Copy'],['altro','Altro']],
  tecnico:     [['bug','Bug'],['ticket','Ticket'],['setup','Setup'],['altro','Altro']],
  social:      [['reel','Reel'],['post','Post'],['story','Story'],['short','Short/TikTok'],['video','Video'],['altro','Altro']],
}

export default function AddTask({ section, onAdded }) {
  const { profile } = useAuth()
  const [members, setMembers] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState(TYPE_OPTIONS[section]?.[0]?.[0] || 'altro')
  const [dueDate, setDueDate] = useState('')
  const [channel, setChannel] = useState('ig')
  const [priority, setPriority] = useState('media')
  const [assignedTo, setAssignedTo] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
 supabase.from('profiles').select('id, full_name').then(({ data }) => {
  if (data) setMembers(data.filter(m => m.full_name))
})
  }, [])

  async function submit(e) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      type, section,
      due_date: dueDate || null,
      assigned_to: assignedTo || null,
      created_by: profile?.id || null,
      done: false,
    }
    if (section === 'social') payload.channel = channel
    if (section === 'tecnico') payload.priority = priority

    const { data, error } = await supabase
      .from('tasks')
      .insert(payload)
      .select('*, assignee:profiles!tasks_assigned_to_fkey(full_name)')
      .single()

    if (!error && data) {
      onAdded({ ...data, assignee_name: data.assignee?.full_name })
      setTitle(''); setDescription(''); setDueDate(''); setAssignedTo('')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={submit} style={{ background:'var(--bg2)', borderRadius:'var(--radius-lg)', border:'0.5px solid var(--border2)', padding:16, marginBottom:'1.5rem', display:'flex', flexDirection:'column', gap:8 }}>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        <input style={{ ...fieldStyle, flex:1, minWidth:140 }} value={title} onChange={e => setTitle(e.target.value)} placeholder="Titolo del task..." required />
        <select style={fieldStyle} value={type} onChange={e => setType(e.target.value)}>
          {(TYPE_OPTIONS[section] || []).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        {section === 'social' && (
          <select style={fieldStyle} value={channel} onChange={e => setChannel(e.target.value)}>
            <option value="ig">IG / FB</option>
            <option value="youtube">YouTube</option>
            <option value="tiktok">TikTok</option>
          </select>
        )}
        {section === 'tecnico' && (
          <select style={fieldStyle} value={priority} onChange={e => setPriority(e.target.value)}>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="bassa">Bassa</option>
          </select>
        )}
        <input style={fieldStyle} type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        <select style={fieldStyle} value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
          <option value="">Assegna a...</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
        </select>
      </div>
      <textarea style={{ ...fieldStyle, width:'100%', resize:'vertical', minHeight:52, lineHeight:1.5 }}
        value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrizione — brief, istruzioni, note..." />
      <div>
        <button type="submit" disabled={loading} style={{ padding:'8px 16px', borderRadius:8, border:'none', background:'var(--accent)', color:'white', fontSize:13, fontWeight:500, cursor: loading?'not-allowed':'pointer', opacity: loading?0.6:1 }}>
          {loading ? 'Salvataggio...' : '+ Aggiungi task'}
        </button>
      </div>
    </form>
  )
}
