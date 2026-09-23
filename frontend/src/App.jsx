import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom'
import CitizenDashboard from './pages/CitizenDashboard.jsx'
import ReportIssue from './pages/ReportIssue.jsx'
import OfficerDashboard from './pages/OfficerDashboard.jsx'
import AdminAnalytics from './pages/AdminAnalytics.jsx'
import Login from './pages/Login.jsx'

const styles = {
  nav: { background: 'linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)', padding: '14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100, boxShadow:'0 4px 20px rgba(0,0,0,0.15)' },
  logo: { display:'flex', alignItems:'center', gap:'12px', textDecoration:'none' },
  logoIcon: { width:42, height:42, background:'linear-gradient(135deg,#3b82f6,#06b6d4)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 },
  logoText: { color:'white' },
  navLinks: { display:'flex', gap:8, alignItems:'center' },
  navLink: (active) => ({ padding:'8px 16px', borderRadius:8, color: active?'#0f172a':'rgba(255,255,255,0.9)', background: active?'white':'transparent', textDecoration:'none', fontWeight:600, fontSize:14, border: active?'none':'1px solid rgba(255,255,255,0.2)', transition:'all 0.2s' }),
  badge: { background:'#ef4444', color:'white', padding:'2px 8px', borderRadius:20, fontSize:12, fontWeight:700 }
}

function Navbar({ user, onLogout }){
  const path = window.location.pathname;
  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.logo}>
        <div style={styles.logoIcon}>👁️</div>
        <div style={styles.logoText}>
          <div style={{fontFamily:'Space Grotesk', fontWeight:700, fontSize:20, lineHeight:1}}>CivicEye AI</div>
          <div style={{fontSize:11, opacity:0.8, letterSpacing:'1.5px'}}>SMART CIVIC OS</div>
        </div>
      </Link>
      <div style={styles.navLinks}>
        {!user ? <>
          <Link to="/login" style={styles.navLink(path==='/login')}>Login</Link>
          <Link to="/report" style={{...styles.navLink(false), background:'#3b82f6', border:'none', color:'white'}}>Report Issue</Link>
        </> : <>
          <Link to="/" style={styles.navLink(path==='/')}>Citizen</Link>
          <Link to="/report" style={styles.navLink(path==='/report')}>+ Report</Link>
          {(user.role==='officer' || user.role==='admin') && <Link to="/officer" style={styles.navLink(path==='/officer')}>Officer</Link>}
          {user.role==='admin' && <Link to="/admin" style={styles.navLink(path==='/admin')}>Analytics</Link>}
          <span style={{color:'white', fontSize:13, marginLeft:8, background:'rgba(255,255,255,0.15)', padding:'6px 12px', borderRadius:20}}>
            {user.name} • {user.role}
          </span>
          <button onClick={onLogout} style={{background:'rgba(239,68,68,0.9)', color:'white', border:'none', padding:'8px 14px', borderRadius:8, cursor:'pointer', fontWeight:600}}>Logout</button>
        </>}
      </div>
    </nav>
  )
}

export default function App(){
  const [user, setUser] = useState(()=> {
    const t = localStorage.getItem('civiceye_user');
    return t ? JSON.parse(t) : null;
  });
  const [token, setToken] = useState(()=> localStorage.getItem('civiceye_token'));

  const handleLogin = (u, t) => {
    setUser(u); setToken(t);
    localStorage.setItem('civiceye_user', JSON.stringify(u));
    localStorage.setItem('civiceye_token', t);
  };
  const handleLogout = () => {
    setUser(null); setToken(null);
    localStorage.removeItem('civiceye_user'); localStorage.removeItem('civiceye_token');
    window.location.href='/login';
  };

  return (
    <BrowserRouter>
      <Navbar user={user} onLogout={handleLogout} />
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/" element={user ? <CitizenDashboard token={token} user={user} /> : <Navigate to="/login"/>} />
        <Route path="/report" element={user ? <ReportIssue token={token} user={user}/> : <Navigate to="/login"/>} />
        <Route path="/officer" element={user && (user.role==='officer'||user.role==='admin') ? <OfficerDashboard token={token} user={user}/> : <Navigate to="/"/> } />
        <Route path="/admin" element={user && user.role==='admin' ? <AdminAnalytics token={token}/> : <Navigate to="/"/> } />
      </Routes>
      <footer style={{textAlign:'center', padding:'24px', color:'#64748b', fontSize:13, borderTop:'1px solid #e2e8f0', marginTop:40}}>
        <div style={{fontWeight:700, color:'#0f172a'}}>CivicEye AI v2.0 — B.Tech CSE Capstone Project Level-2 • MIT WPU • Sairaj S Kashid</div>
        <div style={{marginTop:4}}>Sairaj S Kashid • AI / Computer Vision • Smart City</div>
      </footer>
    </BrowserRouter>
  )
}
