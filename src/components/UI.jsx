export const BADGE_MAP = {
  video:'badge-video', image:'badge-image', copy:'badge-copy',
  reel:'badge-reel', post:'badge-post', story:'badge-story', short:'badge-short',
  ticket:'badge-ticket', bug:'badge-bug', setup:'badge-setup', altro:'badge-altro'
}
export const TYPE_LABELS = {
  video:'Video', image:'Immagine', copy:'Copy', reel:'Reel', post:'Post',
  story:'Story', short:'Short', ticket:'Ticket', bug:'Bug', setup:'Setup', altro:'Altro'
}
export const CH_LABELS = { youtube:'YouTube', ig:'IG / FB', tiktok:'TikTok', altro:'Altro' }
export const CH_CLASS  = { youtube:'ch-yt', ig:'ch-ig', tiktok:'ch-tt', altro:'ch-altro' }

const badgeBase = { fontSize:10, padding:'2px 8px', borderRadius:20, fontWeight:500, fontFamily:'var(--mono)', display:'inline-block' }
const badgeColors = {
  'badge-video':  { background:'rgba(124,108,250,0.18)', color:'var(--accent2)' },
  'badge-image':  { background:'rgba(62,207,142,0.15)',  color:'#5eead4' },
  'badge-copy':   { background:'rgba(245,158,11,0.15)',  color:'#fbbf24' },
  'badge-reel':   { background:'rgba(244,91,91,0.15)',   color:'#f87171' },
  'badge-post':   { background:'rgba(62,207,142,0.12)',  color:'var(--green)' },
  'badge-story':  { background:'rgba(124,108,250,0.15)', color:'var(--accent2)' },
  'badge-short':  { background:'rgba(62,207,142,0.12)',  color:'#34d399' },
  'badge-ticket': { background:'rgba(245,158,11,0.15)',  color:'#fbbf24' },
  'badge-bug':    { background:'rgba(244,91,91,0.15)',   color:'#f87171' },
  'badge-setup':  { background:'rgba(124,108,250,0.15)', color:'var(--accent2)' },
  'badge-altro':  { background:'var(--bg3)',             color:'var(--text2)' },
  'ch-yt':        { background:'rgba(244,91,91,0.15)',   color:'#f87171' },
  'ch-ig':        { background:'rgba(124,108,250,0.15)', color:'var(--accent2)' },
  'ch-tt':        { background:'rgba(62,207,142,0.12)',  color:'var(--green)' },
  'ch-altro':     { background:'var(--bg3)',             color:'var(--text2)' },
  'prio-alta':    { background:'rgba(244,91,91,0.15)',   color:'#f87171' },
  'prio-media':   { background:'rgba(245,158,11,0.12)',  color:'#fbbf24' },
  'prio-bassa':   { background:'var(--bg3)',             color:'var(--text3)' },
  'stato-pianificazione': { background:'var(--bg3)', color:'var(--text3)' },
  'stato-brief':  { background:'rgba(245,158,11,0.12)', color:'#fbbf24' },
  'stato-produzione': { background:'rgba(124,108,250,0.15)', color:'var(--accent2)' },
  'stato-pronto': { background:'rgba(62,207,142,0.12)', color:'var(--green)' },
  'stato-pubblicato': { background:'rgba(62,207,142,0.25)', color:'var(--green)', fontWeight:600 },
}

export function Badge({ type, children }) {
  const cls = BADGE_MAP[type] || 'badge-altro'
  return <span style={{ ...badgeBase, ...(badgeColors[cls]||{}) }}>{children || TYPE_LABELS[type] || type}</span>
}

export function ChBadge({ channel }) {
  const cls = CH_CLASS[channel] || 'ch-altro'
  return <span style={{ ...badgeBase, ...(badgeColors[cls]||{}) }}>{CH_LABELS[channel] || channel}</span>
}

export function PrioBadge({ priority }) {
  return <span style={{ ...badgeBase, ...(badgeColors[`prio-${priority}`]||{}) }}>{priority}</span>
}

export function StatoBadge({ stato }) {
  const labels = { pianificazione:'In pianificazione', brief:'Brief pronto', produzione:'In produzione', pronto:'Pronto', pubblicato:'Pubblicato' }
  return <span style={{ ...badgeBase, ...(badgeColors[`stato-${stato}`]||{}) }}>{labels[stato] || stato}</span>
}

export function Btn({ onClick, children, primary, danger, small, disabled, style, type='button' }) {
  return (
    <button type={type} style={{
      padding: small ? '5px 12px' : '8px 16px', borderRadius:8,
      border: `0.5px solid ${primary ? 'var(--accent)' : danger ? 'rgba(244,91,91,0.3)' : 'var(--border2)'}`,
      background: primary ? 'var(--accent)' : danger ? 'rgba(244,91,91,0.12)' : 'transparent',
      color: primary ? 'white' : danger ? '#f87171' : 'var(--text2)',
      fontSize: small ? 12 : 13, fontWeight:500, cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1, fontFamily:'var(--font)', ...style
    }} onClick={onClick} disabled={disabled}>{children}</button>
  )
}

export function Input({ value, onChange, placeholder, type='text', style }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ padding:'8px 12px', borderRadius:8, border:'0.5px solid var(--border2)', background:'var(--bg3)', color:'var(--text)', fontSize:13, fontFamily:'var(--font)', ...style }} />
  )
}

export function Select({ value, onChange, children, style }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ padding:'7px 10px', borderRadius:8, border:'0.5px solid var(--border2)', background:'var(--bg3)', color:'var(--text)', fontSize:12, fontFamily:'var(--font)', cursor:'pointer', ...style }}>
      {children}
    </select>
  )
}

export function SectionLabel({ children }) {
  return (
    <div style={{ fontSize:10, color:'var(--text3)', fontWeight:500, letterSpacing:'0.08em', textTransform:'uppercase', fontFamily:'var(--mono)', marginBottom:8, marginTop:'1.4rem', display:'flex', alignItems:'center', gap:8 }}>
      {children}
      <div style={{ flex:1, height:'0.5px', background:'var(--border)' }} />
    </div>
  )
}

export function Spinner() {
  return <div style={{ color:'var(--text3)', fontSize:13, fontFamily:'var(--mono)', padding:'2rem', textAlign:'center' }}>// caricamento...</div>
}

export function Empty({ text='// nessun elemento trovato' }) {
  return <div style={{ color:'var(--text3)', fontSize:13, fontFamily:'var(--mono)', padding:'2rem', textAlign:'center' }}>{text}</div>
}

export const fieldStyle = {
  fontSize:13, padding:'8px 12px', borderRadius:8,
  border:'0.5px solid var(--border2)', background:'var(--bg3)',
  color:'var(--text)', fontFamily:'var(--font)'
}
