import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API = '/api'

// Demo-only seed accounts (created in backend/server.js). Not real credentials —
// every deployment must replace the seed users and set JWT_SECRET via environment.
export default function Login({ onLogin }){
  const [isRegister, setIsRegister] = useState(false)
  const [form, setForm] = useState({ name:'', email:'citizen@test.com', password:'citizen123', ward:'Kothrud' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try{
      const url = isRegister ? `${API}/auth/register` : `${API}/auth/login`
      const res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form)})
      const data = await res.json()
      if(!res.ok) throw new Error(data.error||'Failed')
      onLogin(data.user, data.token)
      navigate('/')
    }catch(e){ setError(e.message)} finally{ setLoading(false)}
  }

  const fillDemo = (role) => {
    if(role==='citizen') setForm({ ...form, email:'citizen@test.com', password:'citizen123'})
    if(role==='officer') setForm({ ...form, email:'officer@test.com', password:'officer123'})
    if(role==='admin') setForm({ ...form, email:'admin@test.com', password:'admin123'})
    setIsRegister(false)
  }

  return (
    <div style={{minHeight:'80vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24, background:'linear-gradient(135deg,#f1f5f9 0%,#e0f2fe 50%,#f0f9ff 100%)'}}>
      <div style={{display:'grid', gridTemplateColumns:'1.1fr 0.9fr', gap:24, maxWidth:1000, width:'100%'}}>
        {/* Left hero */}
        <div style={{background:'linear-gradient(135deg,#0f172a 0%,#1e40af 60%,#06b6d4 100%)', borderRadius:20, padding:36, color:'white', display:'flex', flexDirection:'column', justifyContent:'center'}}>
          <div style={{fontSize:42, marginBottom:12}}>🏙️</div>
          <h1 style={{fontFamily:'Space Grotesk', fontSize:32, lineHeight:1.1, marginBottom:12}}>One photo.<br/>AI does the rest.</h1>
          <p style={{opacity:0.9, lineHeight:1.6, fontSize:15}}>CivicEye AI auto-classifies civic issues, detects duplicates via image + GPS, scores priority and routes to the right department — in seconds.</p>
          <div style={{marginTop:24, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
            {[
              {k:'98%', v:'Classification Accuracy*'},
              {k:'80%', v:'Duplicate Reduction'},
              {k:'< 3s', v:'Avg. AI Inference'},
              {k:'24/7', v:'Live Tracking'}
            ].map(x=>(
              <div key={x.v} style={{background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.18)', borderRadius:12, padding:'12px'}}>
                <div style={{fontWeight:800, fontSize:18}}>{x.k}</div><div style={{fontSize:11, opacity:0.85}}>{x.v}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:18, fontSize:11, opacity:0.7}}>* Simulated with YOLOv8 on demo dataset. Production model fine-tuned on municipal data.</div>
        </div>

        {/* Right form */}
        <div style={{background:'white', borderRadius:20, padding:28, boxShadow:'0 20px 60px rgba(0,0,0,0.12)', border:'1px solid #e2e8f0'}}>
          <h2 style={{fontSize:22, fontWeight:800, color:'#0f172a'}}>{isRegister?'Create Citizen Account':'Welcome back'}</h2>
          <p style={{color:'#64748b', fontSize:13, marginTop:4}}>{isRegister?'Join 10,000+ citizens making Pune smarter':'Sign in to track and manage civic issues'}</p>

          <div style={{display:'flex', gap:8, marginTop:16}}>
            {[
              {role:'citizen', label:'Citizen', color:'#3b82f6'},
              {role:'officer', label:'Officer', color:'#10b981'},
              {role:'admin', label:'Admin', color:'#f59e0b'},
            ].map(b=>(
              <button key={b.role} onClick={()=>fillDemo(b.role)} style={{flex:1, padding:'8px', borderRadius:8, border:`1px solid ${b.color}`, background:'white', color:b.color, fontWeight:700, fontSize:12, cursor:'pointer'}}>Try {b.label}</button>
            ))}
          </div>

          <form onSubmit={submit} style={{marginTop:18, display:'flex', flexDirection:'column', gap:12}}>
            {isRegister && (
              <input placeholder="Full Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required
                style={inputStyle} />
            )}
            <input placeholder="Email" type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required style={inputStyle} />
            <input placeholder="Password" type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required style={inputStyle} />
            {isRegister && (
              <input placeholder="Ward / Area (e.g. Kothrud)" value={form.ward} onChange={e=>setForm({...form, ward:e.target.value})} style={inputStyle} />
            )}
            {error && <div style={{background:'#fef2f2', color:'#dc2626', padding:'10px 12px', borderRadius:8, fontSize:13, border:'1px solid #fecaca'}}>{error}</div>}
            <button disabled={loading} style={{background:'linear-gradient(135deg,#3b82f6,#06b6d4)', color:'white', border:'none', padding:'12px', borderRadius:10, fontWeight:700, cursor:'pointer', fontSize:15}}>
              {loading?'Please wait...': isRegister?'Create Account →':'Sign In →'}
            </button>
          </form>

          <div style={{textAlign:'center', marginTop:14, fontSize:13}}>
            <span style={{color:'#64748b'}}>{isRegister?'Already have an account?':'New citizen?'}</span>{' '}
            <button onClick={()=>setIsRegister(!isRegister)} style={{background:'none', border:'none', color:'#3b82f6', fontWeight:700, cursor:'pointer'}}>
              {isRegister?'Sign In':'Create account'}
            </button>
          </div>

          <div style={{marginTop:18, background:'#f8fafc', border:'1px dashed #cbd5e1', borderRadius:10, padding:12, fontSize:12, color:'#475569'}}>
            <div style={{fontWeight:700, marginBottom:6}}>🔑 Demo Credentials</div>
            <div><b>Citizen:</b> citizen@test.com / citizen123</div>
            <div><b>Officer:</b> officer@test.com / officer123</div>
            <div><b>Admin:</b> admin@test.com / admin123</div>
          </div>
        </div>
      </div>
    </div>
  )
}
const inputStyle = { padding:'12px 14px', borderRadius:10, border:'1px solid #e2e8f0', fontSize:14, outline:'none', background:'#f8fafc' }
