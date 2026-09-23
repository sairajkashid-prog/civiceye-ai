import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export default function CitizenDashboard({ token, user }){
  const [complaints, setComplaints] = useState([])
  const [filter, setFilter] = useState('All')
  const [stats, setStats] = useState(null)

  const fetchData = async () => {
    const res = await fetch('/api/complaints?mine=true', { headers:{ Authorization:`Bearer ${token}` }})
    const data = await res.json()
    setComplaints(Array.isArray(data)?data:[])
    const sRes = await fetch('/api/analytics/summary', { headers:{ Authorization:`Bearer ${token}`}})
    if(sRes.ok) setStats(await sRes.json())
  }
  useEffect(()=>{ fetchData(); const id=setInterval(fetchData, 4000); return ()=>clearInterval(id)}, [])

  const filtered = filter==='All' ? complaints : complaints.filter(c=>c.status===filter)
  const statusColor = (s) => ({ Open:'#f59e0b', Assigned:'#3b82f6', 'In Progress':'#8b5cf6', Resolved:'#10b981', Closed:'#64748b', Rejected:'#ef4444'}[s]||'#64748b')
  const priorityColor = (p) => ({ Critical:'#dc2626', High:'#ea580c', Medium:'#ca8a04', Low:'#16a34a'}[p]||'#64748b')

  return (
    <div style={{maxWidth:1200, margin:'0 auto', padding:'20px'}}>
      {/* Header stats */}
      <div style={{background:'linear-gradient(135deg,#0f172a,#1e3a8a)', borderRadius:16, padding:20, color:'white', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16}}>
        <div>
          <h1 style={{fontSize:24, fontWeight:800}}>Hello, {user.name} 👋</h1>
          <p style={{opacity:0.85, fontSize:14, marginTop:4}}>Track your civic complaints in real-time. AI handles classification & routing.</p>
        </div>
        <Link to="/report" style={{background:'white', color:'#0f172a', padding:'12px 20px', borderRadius:10, textDecoration:'none', fontWeight:800}}>📸 Report New Issue</Link>
      </div>

      {/* KPI */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginTop:16}}>
        {[
          {label:'Total Reports', value: complaints.length, sub:'All time', color:'#3b82f6'},
          {label:'Pending', value: complaints.filter(c=>['Open','Assigned','In Progress'].includes(c.status)).length, sub:'Needs action', color:'#f59e0b'},
          {label:'Resolved', value: complaints.filter(c=>c.status==='Resolved'||c.status==='Closed').length, sub:'Successfully closed', color:'#10b981'},
          {label:'Critical', value: complaints.filter(c=>c.priorityLevel==='Critical').length, sub:'High priority', color:'#ef4444'},
        ].map(k=>(
          <div key={k.label} style={{background:'white', borderRadius:14, padding:16, border:'1px solid #e2e8f0', borderLeft:`4px solid ${k.color}`}}>
            <div style={{fontSize:12, color:'#64748b', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5}}>{k.label}</div>
            <div style={{fontSize:26, fontWeight:800, color:'#0f172a', marginTop:4}}>{k.value}</div>
            <div style={{fontSize:12, color:'#94a3b8'}}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{display:'flex', gap:8, marginTop:18, flexWrap:'wrap', alignItems:'center'}}>
        <span style={{fontWeight:700, color:'#334155', fontSize:14}}>Filter:</span>
        {['All','Open','Assigned','In Progress','Resolved'].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{
            padding:'7px 14px', borderRadius:20, border: filter===f?'1px solid #0f172a':'1px solid #e2e8f0',
            background: filter===f?'#0f172a':'white', color: filter===f?'white':'#334155', fontWeight:600, cursor:'pointer', fontSize:13
          }}>{f}</button>
        ))}
        <span style={{marginLeft:'auto', fontSize:13, color:'#64748b'}}>{filtered.length} complaints • Auto-refresh every 4s</span>
      </div>

      {/* Complaint cards */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:14, marginTop:16}}>
        {filtered.map(c=>(
          <div key={c.id} style={{background:'white', borderRadius:14, overflow:'hidden', border:'1px solid #e2e8f0', boxShadow:'0 2px 10px rgba(0,0,0,0.04)'}}>
            <div style={{height:160, background: c.imageUrl ? `url(${c.imageUrl}) center/cover` : 'linear-gradient(135deg,#e0f2fe,#f0f9ff)', display:'flex', alignItems:'center', justifyContent:'center', position:'relative'}}>
              {!c.imageUrl && <span style={{fontSize:48}}>{c.categoryKey==='pothole'?'🕳️':c.categoryKey==='garbage'?'🗑️':c.categoryKey==='water_leakage'?'💧':c.categoryKey==='streetlight'?'💡':'🚧'}</span>}
              <div style={{position:'absolute', top:10, left:10, display:'flex', gap:6}}>
                <span style={{background: statusColor(c.status), color:'white', padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:800}}>{c.status}</span>
                <span style={{background: priorityColor(c.priorityLevel), color:'white', padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:800}}>{c.priorityLevel} • {c.priorityScore}</span>
              </div>
              <div style={{position:'absolute', top:10, right:10, background:'rgba(15,23,42,0.85)', color:'white', padding:'4px 8px', borderRadius:8, fontSize:11, fontWeight:600}}>
                AI {Math.round(c.confidence*100)}%
              </div>
              {c.duplicates?.length>0 && (
                <div style={{position:'absolute', bottom:10, left:10, background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', padding:'4px 8px', borderRadius:8, fontSize:11, fontWeight:700}}>
                  ⚠️ {c.duplicates.length} duplicate(s) nearby
                </div>
              )}
            </div>
            <div style={{padding:14}}>
              <div style={{fontSize:12, color:'#3b82f6', fontWeight:700, letterSpacing:0.5}}>{c.id} • {c.department}</div>
              <div style={{fontWeight:700, color:'#0f172a', marginTop:4, fontSize:15}}>{c.category}</div>
              <div style={{color:'#475569', fontSize:13, marginTop:6, lineHeight:1.5, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'}}>{c.description}</div>
              <div style={{display:'flex', gap:6, marginTop:10, flexWrap:'wrap'}}>
                <span style={{background:'#f1f5f9', padding:'4px 8px', borderRadius:6, fontSize:11, color:'#334155'}}>📍 {c.address}</span>
                <span style={{background:'#f1f5f9', padding:'4px 8px', borderRadius:6, fontSize:11, color:'#334155'}}>🕒 {new Date(c.createdAt).toLocaleDateString()}</span>
              </div>
              {c.remarks?.length>0 && (
                <div style={{marginTop:10, background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, padding:10}}>
                  <div style={{fontSize:11, fontWeight:700, color:'#334155'}}>Officer Update:</div>
                  <div style={{fontSize:13, color:'#475569', marginTop:2}}>{c.remarks[c.remarks.length-1].text}</div>
                  <div style={{fontSize:11, color:'#94a3b8'}}>{c.remarks[c.remarks.length-1].by} • {new Date(c.remarks[c.remarks.length-1].at).toLocaleString()}</div>
                </div>
              )}
              {/* Timeline */}
              <div style={{display:'flex', gap:4, marginTop:12}}>
                {['Open','Assigned','In Progress','Resolved'].map((s,i)=>{
                  const idx = ['Open','Assigned','In Progress','Resolved'].indexOf(c.status);
                  const cur = ['Open','Assigned','In Progress','Resolved'].indexOf(s);
                  const done = cur <= idx;
                  return <div key={s} style={{flex:1, height:6, borderRadius:3, background: done? statusColor(c.status):'#e2e8f0'}} title={s}/>
                })}
              </div>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:10, color:'#94a3b8', marginTop:4}}>
                <span>Open</span><span>Resolved</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {filtered.length===0 && (
        <div style={{textAlign:'center', padding:40, background:'white', borderRadius:14, border:'1px dashed #cbd5e1', marginTop:16}}>
          <div style={{fontSize:42}}>📭</div>
          <div style={{fontWeight:700, color:'#334155', marginTop:8}}>No complaints in this filter</div>
          <p style={{color:'#64748b', fontSize:13, marginTop:4}}>Report your first issue and see AI classification in action.</p>
          <Link to="/report" style={{display:'inline-block', marginTop:12, background:'#0f172a', color:'white', padding:'10px 18px', borderRadius:8, textDecoration:'none', fontWeight:700}}>Report Now</Link>
        </div>
      )}
    </div>
  )
}
