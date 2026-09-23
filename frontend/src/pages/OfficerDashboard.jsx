import React, { useEffect, useState } from 'react'

export default function OfficerDashboard({ token, user }){
  const [complaints, setComplaints] = useState([])
  const [selected, setSelected] = useState(null)
  const [filterDept, setFilterDept] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [remark, setRemark] = useState('')
  const [newStatus, setNewStatus] = useState('In Progress')

  const fetchData = async () => {
    const res = await fetch('/api/complaints', { headers:{ Authorization:`Bearer ${token}` }})
    const data = await res.json()
    setComplaints(Array.isArray(data)?data:[])
    if(data.length && !selected) setSelected(data[0])
  }
  useEffect(()=>{ fetchData(); const id=setInterval(fetchData, 4000); return ()=>clearInterval(id)}, [])

  const updateStatus = async () => {
    if(!selected) return
    const res = await fetch(`/api/complaints/${selected.id}/status`, {
      method:'PATCH',
      headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}`},
      body: JSON.stringify({ status: newStatus, remark })
    })
    const data = await res.json()
    if(res.ok){ setSelected(data); setRemark(''); fetchData(); alert('Status updated & citizen notified ✓') }
    else alert(data.error||'Failed')
  }

  const depts = ['All', ...Array.from(new Set(complaints.map(c=>c.department)))]
  let filtered = complaints
  if(filterDept!=='All') filtered = filtered.filter(c=>c.department===filterDept)
  if(statusFilter!=='All') filtered = filtered.filter(c=>c.status===statusFilter)

  const statusColor = (s) => ({ Open:'#f59e0b', Assigned:'#3b82f6', 'In Progress':'#8b5cf6', Resolved:'#10b981', Closed:'#64748b'}[s]||'#64748b')

  return (
    <div style={{maxWidth:1300, margin:'0 auto', padding:20}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12}}>
        <div>
          <h1 style={{fontSize:22, fontWeight:800, color:'#0f172a'}}>👮 Officer Command Center</h1>
          <p style={{color:'#64748b', fontSize:13, marginTop:2}}>Dept: <b>{user.department||'All'}</b> • Auto-assigned by AI Routing Service • Real-time via WebSockets</p>
        </div>
        <div style={{display:'flex', gap:8}}>
          <select value={filterDept} onChange={e=>setFilterDept(e.target.value)} style={sel}>
            {depts.map(d=> <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={sel}>
            {['All','Open','Assigned','In Progress','Resolved'].map(s=> <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* KPI bar */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginTop:14}}>
        {[
          {l:'Total Queue', v: filtered.length},
          {l:'Critical', v: filtered.filter(c=>c.priorityLevel==='Critical').length, c:'#dc2626'},
          {l:'Open', v: filtered.filter(c=>c.status==='Open').length, c:'#f59e0b'},
          {l:'In Progress', v: filtered.filter(c=>c.status==='In Progress').length, c:'#8b5cf6'},
          {l:'Resolved Today', v: filtered.filter(c=>c.status==='Resolved' && c.updatedAt.slice(0,10)===new Date().toISOString().slice(0,10)).length, c:'#10b981'},
        ].map(k=>(
          <div key={k.l} style={{background:'white', border:'1px solid #e2e8f0', borderRadius:10, padding:12, textAlign:'center'}}>
            <div style={{fontSize:11, color:'#64748b', fontWeight:700, textTransform:'uppercase'}}>{k.l}</div>
            <div style={{fontSize:20, fontWeight:800, color: k.c||'#0f172a'}}>{k.v}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid', gridTemplateColumns:'380px 1fr', gap:14, marginTop:14}}>
        {/* List */}
        <div style={{background:'white', borderRadius:12, border:'1px solid #e2e8f0', overflow:'hidden', maxHeight:'72vh', display:'flex', flexDirection:'column'}}>
          <div style={{padding:'12px 14px', borderBottom:'1px solid #e2e8f0', background:'#f8fafc', fontWeight:700, fontSize:13, display:'flex', justifyContent:'space-between'}}>
            <span>Assigned Complaints ({filtered.length})</span><span style={{color:'#3b82f6'}}>Live</span>
          </div>
          <div style={{overflowY:'auto'}}>
            {filtered.map(c=>(
              <div key={c.id} onClick={()=>setSelected(c)} style={{
                padding:12, borderBottom:'1px solid #f1f5f9', cursor:'pointer',
                background: selected?.id===c.id?'#eff6ff':'white', borderLeft: selected?.id===c.id?'3px solid #3b82f6':'3px solid transparent'
              }}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <span style={{fontSize:11, fontWeight:800, color:'#3b82f6'}}>{c.id}</span>
                  <span style={{fontSize:11, background: statusColor(c.status), color:'white', padding:'3px 8px', borderRadius:20, fontWeight:700}}>{c.status}</span>
                </div>
                <div style={{fontWeight:700, fontSize:13, color:'#0f172a', marginTop:4}}>{c.category}</div>
                <div style={{fontSize:12, color:'#475569', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{c.description}</div>
                <div style={{display:'flex', gap:6, marginTop:6}}>
                  <span style={{fontSize:11, background: c.priorityLevel==='Critical'?'#fef2f2':'#f1f5f9', color: c.priorityLevel==='Critical'?'#dc2626':'#334155', padding:'2px 6px', borderRadius:6, border: c.priorityLevel==='Critical'?'1px solid #fecaca':'1px solid #e2e8f0'}}>{c.priorityLevel} {c.priorityScore}</span>
                  <span style={{fontSize:11, color:'#64748b'}}>{new Date(c.createdAt).toLocaleDateString()}</span>
                  {c.duplicates?.length>0 && <span style={{fontSize:11, color:'#dc2626', fontWeight:700}}>⚠️ dup</span>}
                </div>
              </div>
            ))}
            {filtered.length===0 && <div style={{padding:20, textAlign:'center', color:'#94a3b8'}}>No complaints for this filter</div>}
          </div>
        </div>

        {/* Detail */}
        {selected ? (
          <div style={{background:'white', borderRadius:12, border:'1px solid #e2e8f0', overflow:'hidden'}}>
            <div style={{height:220, background: selected.imageUrl ? `url(${selected.imageUrl}) center/cover` : 'linear-gradient(135deg,#e0f2fe,#f0f9ff)', position:'relative', display:'flex', alignItems:'center', justifyContent:'center'}}>
              {!selected.imageUrl && <span style={{fontSize:56}}>{selected.categoryKey==='pothole'?'🕳️':selected.categoryKey==='garbage'?'🗑️':selected.categoryKey==='water_leakage'?'💧':selected.categoryKey==='streetlight'?'💡':'🚧'}</span>}
              <div style={{position:'absolute', top:10, left:10, background:'rgba(15,23,42,0.9)', color:'white', padding:'6px 10px', borderRadius:8, fontSize:12, fontWeight:700}}>{selected.id} • {selected.department}</div>
              <div style={{position:'absolute', top:10, right:10, display:'flex', gap:6}}>
                <span style={{background: statusColor(selected.status), color:'white', padding:'6px 10px', borderRadius:20, fontSize:12, fontWeight:800}}>{selected.status}</span>
              </div>
              <div style={{position:'absolute', bottom:10, left:10, right:10, display:'flex', justifyContent:'space-between', alignItems:'end'}}>
                <span style={{background:'white', padding:'6px 10px', borderRadius:8, fontSize:12, fontWeight:700, boxShadow:'0 2px 8px rgba(0,0,0,0.15)'}}>📍 {selected.address}</span>
                <span style={{background:'white', padding:'6px 10px', borderRadius:8, fontSize:12, fontWeight:700}}>AI {Math.round(selected.confidence*100)}% • Score {selected.priorityScore}</span>
              </div>
            </div>

            <div style={{padding:16}}>
              <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                <span style={{background:'#f1f5f9', padding:'6px 10px', borderRadius:8, fontSize:12, fontWeight:600}}>👤 {selected.citizenName}</span>
                <span style={{background:'#f1f5f9', padding:'6px 10px', borderRadius:8, fontSize:12}}>{selected.category}</span>
                <span style={{background: selected.priorityLevel==='Critical'?'#fef2f2':'#f0fdf4', border:'1px solid #e2e8f0', padding:'6px 10px', borderRadius:8, fontSize:12, fontWeight:700, color: selected.priorityLevel==='Critical'?'#dc2626':'#16a34a'}}>{selected.priorityLevel} Priority • {selected.priorityScore}/100</span>
              </div>
              <p style={{marginTop:10, color:'#334155', fontSize:14, lineHeight:1.6, background:'#f8fafc', padding:12, borderRadius:8, border:'1px solid #e2e8f0'}}>{selected.description}</p>

              {selected.duplicates?.length>0 && (
                <div style={{marginTop:10, background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:10}}>
                  <div style={{fontWeight:700, fontSize:12, color:'#92400e'}}>🔗 Cluster — {selected.duplicates.length} nearby duplicates</div>
                  {selected.duplicates.map(d=>(
                    <div key={d.complaintId} style={{fontSize:12, color:'#78350f', marginTop:4}}>{d.complaintId} • {d.distanceMeters}m • {Math.round(d.similarity*100)}% similarity • {d.address}</div>
                  ))}
                </div>
              )}

              <div style={{marginTop:14, display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                <iframe title="loc" width="100%" height="140" style={{border:'1px solid #e2e8f0', borderRadius:8}} loading="lazy" src={`https://maps.google.com/maps?q=${selected.location.lat},${selected.location.lng}&z=16&output=embed`} />
                <div style={{background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, padding:12}}>
                  <div style={{fontWeight:700, fontSize:12, color:'#334155'}}>Timeline</div>
                  <div style={{marginTop:8, display:'flex', flexDirection:'column', gap:6}}>
                    {[
                      {s:'Open', done:true},
                      {s:'Assigned', done: ['Assigned','In Progress','Resolved','Closed'].includes(selected.status)},
                      {s:'In Progress', done: ['In Progress','Resolved','Closed'].includes(selected.status)},
                      {s:'Resolved', done: ['Resolved','Closed'].includes(selected.status)},
                    ].map(t=>(
                      <div key={t.s} style={{display:'flex', alignItems:'center', gap:8, fontSize:12}}>
                        <span style={{width:18, height:18, borderRadius:'50%', background: t.done?'#10b981':'#e2e8f0', color: t.done?'white':'#94a3b8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10}}>{t.done?'✓':'○'}</span>
                        <span style={{fontWeight: t.done?700:400, color: t.done?'#0f172a':'#94a3b8'}}>{t.s}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{marginTop:10, fontSize:11, color:'#64748b'}}>Created: {new Date(selected.createdAt).toLocaleString()}<br/>Updated: {new Date(selected.updatedAt).toLocaleString()}</div>
                </div>
              </div>

              {/* Remarks */}
              <div style={{marginTop:14}}>
                <div style={{fontWeight:700, fontSize:13, color:'#0f172a'}}>Remarks & History ({selected.remarks?.length||0})</div>
                <div style={{maxHeight:100, overflowY:'auto', marginTop:8, display:'flex', flexDirection:'column', gap:6}}>
                  {(selected.remarks||[]).length===0 && <div style={{color:'#94a3b8', fontSize:12}}>No remarks yet — add first update.</div>}
                  {(selected.remarks||[]).map((r,i)=>(
                    <div key={i} style={{background:'#f1f5f9', padding:'8px 10px', borderRadius:8, fontSize:12}}>
                      <div style={{color:'#334155'}}>{r.text}</div><div style={{color:'#94a3b8', fontSize:11}}>{r.by} • {new Date(r.at).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action */}
              <div style={{marginTop:14, background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, padding:12}}>
                <div style={{fontWeight:700, fontSize:13}}>Update Status & Notify Citizen</div>
                <div style={{display:'flex', gap:8, marginTop:8}}>
                  <select value={newStatus} onChange={e=>setNewStatus(e.target.value)} style={{flex:1, padding:'10px', borderRadius:8, border:'1px solid #e2e8f0', fontWeight:600}}>
                    {['Assigned','In Progress','Resolved','Closed','Rejected'].map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={updateStatus} style={{background:'#0f172a', color:'white', border:'none', padding:'10px 18px', borderRadius:8, fontWeight:700, cursor:'pointer'}}>Update & Notify</button>
                </div>
                <textarea value={remark} onChange={e=>setRemark(e.target.value)} placeholder="Add remark for citizen (e.g. Team dispatched, ETA 24h)..." rows={2} style={{width:'100%', marginTop:8, padding:'10px', borderRadius:8, border:'1px solid #e2e8f0', fontSize:13}} />
                <div style={{fontSize:11, color:'#64748b', marginTop:6}}>Triggers real-time WebSocket + email/SMS notification to citizen.</div>
              </div>
            </div>
          </div>
        ) : <div style={{background:'white', borderRadius:12, border:'1px dashed #cbd5e1', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8'}}>Select a complaint</div>}
      </div>
    </div>
  )
}
const sel = { padding:'8px 12px', borderRadius:8, border:'1px solid #e2e8f0', background:'white', fontWeight:600, fontSize:13 }
