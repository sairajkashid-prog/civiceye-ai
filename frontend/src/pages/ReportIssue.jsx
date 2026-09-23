import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ReportIssue({ token }){
  const [form, setForm] = useState({ description:'', lat:'18.5168', lng:'73.8210', address:'Paud Road, Kothrud, Pune' })
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [locating, setLocating] = useState(false)
  const fileRef = useRef()

  const handleFile = (f) => {
    if(!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const getLocation = () => {
    setLocating(true)
    if(!navigator.geolocation){ setLocating(false); alert('Geolocation not supported'); return}
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm({ ...form, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) })
        setLocating(false)
      },
      err => { setLocating(false); alert('Location error: '+err.message)},
      { enableHighAccuracy:true }
    )
  }

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError(''); setResult(null)
    try{
      const fd = new FormData()
      fd.append('description', form.description)
      fd.append('lat', form.lat)
      fd.append('lng', form.lng)
      fd.append('address', form.address)
      if(file) fd.append('image', file)
      else fd.append('imageName', 'demo_pothole.jpg')

      const res = await fetch('/api/complaints', {
        method:'POST',
        headers:{ Authorization:`Bearer ${token}` },
        body: fd
      })
      const data = await res.json()
      if(!res.ok) throw new Error(data.error||'Submit failed')
      setResult(data)
    }catch(err){ setError(err.message) }
    finally{ setLoading(false)}
  }

  if(result){
    const { complaint, ai } = result
    return (
      <div style={{maxWidth:800, margin:'0 auto', padding:20}}>
        <div style={{background:'white', borderRadius:16, overflow:'hidden', border:'1px solid #e2e8f0', boxShadow:'0 10px 30px rgba(0,0,0,0.08)'}}>
          <div style={{background:'linear-gradient(135deg,#10b981,#06b6d4)', padding:20, color:'white', textAlign:'center'}}>
            <div style={{fontSize:40}}>✅</div>
            <h2 style={{fontSize:22, fontWeight:800, marginTop:8}}>Complaint Registered Successfully!</h2>
            <p style={{opacity:0.95, marginTop:4}}>{complaint.id} • Routed to <b>{complaint.department}</b></p>
          </div>
          <div style={{padding:20}}>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
              <div style={card}>
                <div style={cardTitle}>🤖 AI Classification</div>
                <div style={{fontWeight:800, fontSize:16, color:'#0f172a'}}>{ai.classification.category}</div>
                <div style={{fontSize:13, color:'#64748b'}}>Confidence: <b style={{color:'#10b981'}}>{Math.round(ai.classification.confidence*100)}%</b> • YOLOv8</div>
                <div style={{marginTop:8, background:'#f1f5f9', padding:'8px 10px', borderRadius:8, fontSize:12}}>Dept: <b>{ai.classification.department}</b></div>
              </div>
              <div style={card}>
                <div style={cardTitle}>⚡ Priority Scoring</div>
                <div style={{display:'flex', alignItems:'center', gap:10}}>
                  <div style={{width:56, height:56, borderRadius:12, background: priorityBg(complaint.priorityLevel), color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:18}}>{complaint.priorityScore}</div>
                  <div>
                    <div style={{fontWeight:800, color: priorityColor(complaint.priorityLevel)}}>{complaint.priorityLevel} Priority</div>
                    <div style={{fontSize:12, color:'#64748b'}}>Score 0-100 • Auto-calculated</div>
                  </div>
                </div>
                <div style={{marginTop:8, height:8, background:'#e2e8f0', borderRadius:20, overflow:'hidden'}}>
                  <div style={{width:`${complaint.priorityScore}%`, height:'100%', background: priorityBg(complaint.priorityLevel)}}/>
                </div>
              </div>
            </div>

            {ai.duplicates.length>0 ? (
              <div style={{marginTop:14, background:'#fef2f2', border:'1px solid #fecaca', borderRadius:12, padding:14}}>
                <div style={{fontWeight:800, color:'#dc2626'}}>⚠️ Duplicate Detected — {ai.duplicates.length} similar complaint(s) within 80m</div>
                <div style={{fontSize:13, color:'#7f1d1d', marginTop:4}}>System flagged this as a cluster. Priority automatically boosted. No new ticket needed, but we registered yours for tracking.</div>
                {ai.duplicates.map(d=>(
                  <div key={d.complaintId} style={{marginTop:8, background:'white', padding:'8px 10px', borderRadius:8, fontSize:12, display:'flex', justifyContent:'space-between'}}>
                    <span><b>{d.complaintId}</b> • {d.address}</span><span>{d.distanceMeters}m • {Math.round(d.similarity*100)}% match</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{marginTop:14, background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12, padding:14, color:'#14532d', fontSize:13}}>
                ✓ No duplicates found — this is a unique report. Great, it will be prioritized normally.
              </div>
            )}

            <div style={{marginTop:16, background:'#f8fafc', borderRadius:12, padding:14, border:'1px solid #e2e8f0'}}>
              <div style={{fontWeight:700, color:'#0f172a'}}>What happens next?</div>
              <ol style={{marginTop:8, paddingLeft:18, color:'#475569', fontSize:13, lineHeight:1.7}}>
                <li>Auto-routed to <b>{complaint.department}</b> — officer gets instant notification</li>
                <li>Live status updates: Open → Assigned → In Progress → Resolved</li>
                <li>You’ll get real-time in-app + email/SMS alerts on every status change</li>
                <li>Track progress anytime on your Citizen Dashboard</li>
              </ol>
            </div>

            <div style={{display:'flex', gap:10, marginTop:16}}>
              <button onClick={()=>window.location.href='/'} style={{flex:1, background:'#0f172a', color:'white', border:'none', padding:'12px', borderRadius:10, fontWeight:700, cursor:'pointer'}}>Go to Dashboard</button>
              <button onClick={()=>setResult(null)} style={{flex:1, background:'white', border:'1px solid #e2e8f0', padding:'12px', borderRadius:10, fontWeight:700, cursor:'pointer'}}>Report Another</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{maxWidth:900, margin:'0 auto', padding:20}}>
      <h1 style={{fontSize:24, fontWeight:800, color:'#0f172a'}}>📸 Report Civic Issue</h1>
      <p style={{color:'#64748b', fontSize:14, marginTop:4}}>Upload one image + GPS — AI classifies, checks duplicates, scores priority and routes automatically.</p>

      <form onSubmit={submit} style={{marginTop:16, display:'grid', gridTemplateColumns:'1fr 0.95fr', gap:16}}>
        {/* Left: Upload */}
        <div style={{background:'white', borderRadius:14, padding:16, border:'1px solid #e2e8f0'}}>
          <div style={{fontWeight:700, color:'#0f172a', marginBottom:10}}>1. Upload Image *</div>
          <div
            onClick={()=>fileRef.current.click()}
            onDragOver={e=>e.preventDefault()}
            onDrop={e=>{e.preventDefault(); handleFile(e.dataTransfer.files[0])}}
            style={{
              border:'2px dashed #93c5fd', background: preview?'white':'#f0f9ff', borderRadius:12, padding: preview?0:24,
              textAlign:'center', cursor:'pointer', overflow:'hidden', minHeight:220, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column'
            }}>
            {preview ? (
              <img src={preview} alt="preview" style={{width:'100%', height:260, objectFit:'cover'}} />
            ) : (
              <>
                <div style={{fontSize:36}}>🖼️</div>
                <div style={{fontWeight:700, color:'#1e40af', marginTop:8}}>Click to upload or drag & drop</div>
                <div style={{fontSize:12, color:'#64748b', marginTop:4}}>JPG/PNG • Max 8MB • Clear photo helps AI (e.g. pothole name in file helps demo)</div>
                <div style={{marginTop:10, display:'flex', gap:6, flexWrap:'wrap', justifyContent:'center'}}>
                  {['pothole.jpg','garbage.jpg','water_leak.jpg','streetlight.jpg'].map(n=>(
                    <span key={n} style={{fontSize:11, background:'white', border:'1px solid #e2e8f0', padding:'4px 8px', borderRadius:20}}>{n}</span>
                  ))}
                </div>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={e=>handleFile(e.target.files[0])} style={{display:'none'}} />
          {file && <div style={{marginTop:10, fontSize:12, color:'#334155', background:'#f1f5f9', padding:'8px 10px', borderRadius:8}}>Selected: <b>{file.name}</b> • {(file.size/1024).toFixed(0)} KB • <button type="button" onClick={()=>{setFile(null);setPreview(null)}} style={{color:'#dc2626', background:'none', border:'none', cursor:'pointer', fontWeight:700}}>Remove</button></div>}
          {!file && <div style={{marginTop:10, fontSize:12, color:'#64748b', background:'#fffbeb', border:'1px solid #fde68a', padding:'8px 10px', borderRadius:8}}>No file? Demo will use <b>auto-classification</b> with filename keyword detection — still showcases AI flow.</div>}

          <div style={{fontWeight:700, color:'#0f172a', marginTop:18, marginBottom:10}}>2. Describe Issue (optional)</div>
          <textarea value={form.description} onChange={e=>setForm({...form, description:e.target.value})} rows={3}
            placeholder="e.g. Large pothole near signal, 2 feet wide, risk for bikes..."
            style={{width:'100%', padding:'10px 12px', borderRadius:10, border:'1px solid #e2e8f0', background:'#f8fafc', fontSize:13, resize:'vertical'}} />
        </div>

        {/* Right: Location */}
        <div style={{display:'flex', flexDirection:'column', gap:16}}>
          <div style={{background:'white', borderRadius:14, padding:16, border:'1px solid #e2e8f0'}}>
            <div style={{fontWeight:700, color:'#0f172a', marginBottom:10}}>3. GPS Location *</div>
            <button type="button" onClick={getLocation} disabled={locating} style={{width:'100%', background: locating?'#94a3b8':'#0f172a', color:'white', border:'none', padding:'10px', borderRadius:8, fontWeight:700, cursor:'pointer'}}>
              {locating ? 'Locating…' : '📍 Use My Current Location'}
            </button>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:12}}>
              <div><label style={label}>Latitude</label><input value={form.lat} onChange={e=>setForm({...form, lat:e.target.value})} required style={inp} /></div>
              <div><label style={label}>Longitude</label><input value={form.lng} onChange={e=>setForm({...form, lng:e.target.value})} required style={inp} /></div>
            </div>
            <div style={{marginTop:10}}><label style={label}>Address / Landmark</label><input value={form.address} onChange={e=>setForm({...form, address:e.target.value})} style={inp} placeholder="e.g. Near MIT WPU, Kothrud" /></div>

            {/* Mini map preview */}
            <div style={{marginTop:12, borderRadius:10, overflow:'hidden', border:'1px solid #e2e8f0'}}>
              <iframe
                title="map"
                width="100%" height="160" style={{border:0}}
                loading="lazy"
                src={`https://maps.google.com/maps?q=${form.lat},${form.lng}&z=15&output=embed`}
              />
            </div>
            <div style={{fontSize:11, color:'#64748b', marginTop:6}}>Tip: Drag map not needed — just confirm lat/lng. Duplicate detection uses 80m radius.</div>
          </div>

          <div style={{background:'linear-gradient(135deg,#0f172a,#1e40af)', borderRadius:14, padding:16, color:'white'}}>
            <div style={{fontWeight:800}}>⚡ What AI will do instantly</div>
            <ul style={{marginTop:8, fontSize:13, lineHeight:1.6, opacity:0.95, paddingLeft:18}}>
              <li>Classify image (YOLOv8) → 6 categories</li>
              <li>Check duplicates (image similarity + Haversine)</li>
              <li>Compute priority score (0–100)</li>
              <li>Auto-route to correct department</li>
              <li>Trigger real-time officer alert</li>
            </ul>
          </div>

          {error && <div style={{background:'#fef2f2', color:'#dc2626', padding:'10px 12px', borderRadius:8, border:'1px solid #fecaca', fontSize:13}}>{error}</div>}

          <button disabled={loading} style={{background: loading?'#94a3b8':'linear-gradient(135deg,#3b82f6,#06b6d4)', color:'white', border:'none', padding:'14px', borderRadius:10, fontWeight:800, cursor:'pointer', fontSize:15, boxShadow:'0 6px 20px rgba(59,130,246,0.35)'}}>
            {loading ? '🤖 AI Processing...' : '🚀 Submit & Run AI Analysis'}
          </button>
          <div style={{textAlign:'center', fontSize:11, color:'#64748b'}}>By submitting you agree that image & location will be stored for municipal action.</div>
        </div>
      </form>
    </div>
  )
}

const label = { fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:0.5 }
const inp = { width:'100%', marginTop:4, padding:'10px 12px', borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', fontSize:13 }
const card = { background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:12, padding:14 }
const cardTitle = { fontSize:11, fontWeight:700, color:'#64748b', letterSpacing:0.6, textTransform:'uppercase', marginBottom:6 }
const priorityBg = (p) => ({ Critical:'linear-gradient(135deg,#dc2626,#991b1b)', High:'linear-gradient(135deg,#ea580c,#9a3412)', Medium:'linear-gradient(135deg,#ca8a04,#854d0e)', Low:'linear-gradient(135deg,#16a34a,#14532d)'}[p]||'#64748b')
const priorityColor = (p) => ({ Critical:'#dc2626', High:'#ea580c', Medium:'#ca8a04', Low:'#16a34a'}[p]||'#64748b')
