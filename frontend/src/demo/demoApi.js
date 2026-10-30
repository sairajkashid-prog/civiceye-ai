// Demo API shim — makes CivicEye AI fully functional as a static demo
// (no backend needed). Intercepts fetch() and serves realistic in-memory data.

const DB_KEY = 'civiceye_demo_db_v1'

const DEPT_BY_CAT = {
  Pothole: 'Roads & Infrastructure',
  'Garbage': 'Sanitation',
  'Streetlight': 'Electrical',
  'Water Leakage': 'Water Supply',
  'Drainage': 'Sanitation',
  'Illegal Parking': 'Traffic Police',
  'Stray Animal': 'Animal Control',
  'Tree Fallen': 'Parks & Gardens',
  'Graffiti': 'Encroachment',
  'Noise': 'Pollution Control',
}

const now = Date.now()
const h = (n) => new Date(now - n * 3600 * 1000).toISOString()

const SEED = [
  { id:'CV-2026-1042', description:'Large pothole near Kothrud depot, water collects during rain and two-wheelers skid.', category:'Pothole', categoryKey:'pothole', confidence:0.96, department:'Roads & Infrastructure', address:'Kothrud Depot Road, Kothrud, Pune', lat:18.5074, lng:73.8077, priorityScore:88, priorityLevel:'Critical', status:'In Progress', createdAt:h(6), updatedAt:h(1), highlights:[{x:0.42,y:0.55,w:0.2,h:0.16}], remarks:[{status:'Assigned',remark:'Inspection scheduled',at:h(4)}] },
  { id:'CV-2026-1041', description:'Garbage not collected for 4 days behind Dahanukar Colony society gate.', category:'Garbage', categoryKey:'garbage', confidence:0.93, department:'Sanitation', address:'Dahanukar Colony, Kothrud, Pune', lat:18.5022, lng:73.8192, priorityScore:71, priorityLevel:'High', status:'Assigned', createdAt:h(11), updatedAt:h(3), highlights:[], remarks:[] },
  { id:'CV-2026-1040', description:'Streetlight pole dark for entire stretch, unsafe for women walking at night.', category:'Streetlight', categoryKey:'streetlight', confidence:0.91, department:'Electrical', address:'Paud Road, Kothrud, Pune', lat:18.5009, lng:73.8014, priorityScore:84, priorityLevel:'Critical', status:'Open', createdAt:h(18), updatedAt:h(18), highlights:[], remarks:[] },
  { id:'CV-2026-1039', description:'Water pipeline leaking continuously on footpath, wasting drinking water.', category:'Water Leakage', categoryKey:'water', confidence:0.89, department:'Water Supply', address:'Karve Road, Erandwane, Pune', lat:18.5041, lng:73.8261, priorityScore:76, priorityLevel:'High', status:'Resolved', createdAt:h(30), updatedAt:h(9), highlights:[], remarks:[{status:'Resolved',remark:'Valve replaced by ward team',at:h(9)}] },
  { id:'CV-2026-1038', description:'Open drain covering broken near school gate, risk for children.', category:'Drainage', categoryKey:'drainage', confidence:0.94, department:'Sanitation', address:'Shivaji Housing Society, Kothrud, Pune', lat:18.4991, lng:73.8139, priorityScore:92, priorityLevel:'Critical', status:'In Progress', createdAt:h(34), updatedAt:h(5), highlights:[], remarks:[] },
  { id:'CV-2026-1037', description:'Illegal parking blocking ambulance lane outside clinic.', category:'Illegal Parking', categoryKey:'parking', confidence:0.87, department:'Traffic Police', address:'Vanasthal Road, Kothrud, Pune', lat:18.5056, lng:73.8042, priorityScore:58, priorityLevel:'Medium', status:'Resolved', createdAt:h(52), updatedAt:h(20), highlights:[], remarks:[] },
  { id:'CV-2026-1036', description:'Fallen tree branch on cycle track after last night wind.', category:'Tree Fallen', categoryKey:'tree', confidence:0.9, department:'Parks & Gardens', address:'Kothrud Flyover, Pune', lat:18.5083, lng:73.8155, priorityScore:64, priorityLevel:'High', status:'Closed', createdAt:h(70), updatedAt:h(40), highlights:[], remarks:[] },
  { id:'CV-2026-1035', description:'Stray dog pack near bus stop, children scared.', category:'Stray Animal', categoryKey:'animal', confidence:0.85, department:'Animal Control', address:'Dhakde Colony, Kothrud, Pune', lat:18.5033, lng:73.8088, priorityScore:42, priorityLevel:'Low', status:'Assigned', createdAt:h(88), updatedAt:h(60), highlights:[], remarks:[] },
]

const USERS = {
  'citizen@test.com': { id:'u1', name:'Citizen Demo', email:'citizen@test.com', role:'citizen', ward:'Kothrud', password:'citizen123' },
  'officer@test.com': { id:'u2', name:'Officer Patil', email:'officer@test.com', role:'officer', department:'Roads & Infrastructure', ward:'Kothrud', password:'officer123' },
  'admin@test.com':   { id:'u3', name:'Admin Deshmukh', email:'admin@test.com', role:'admin', department:'All', ward:'All', password:'admin123' },
}

function load() {
  try { const r = localStorage.getItem(DB_KEY); if (r) return JSON.parse(r) } catch (e) {}
  return { complaints: SEED, seq: 1043 }
}
function save(db) { try { localStorage.setItem(DB_KEY, JSON.stringify(db)) } catch (e) {} }

function classify(text) {
  const t = (text || '').toLowerCase()
  const map = [
    [/pothole|road|gaddha|crack/, 'Pothole'],
    [/garbage|kachra|trash|waste/, 'Garbage'],
    [/light|lamp|dark|street ?light/, 'Streetlight'],
    [/leak|water|pipe/, 'Water Leakage'],
    [/drain|sewer|nalla/, 'Drainage'],
    [/park|vehicle|car|bike/, 'Illegal Parking'],
    [/dog|stray|animal|cat/, 'Stray Animal'],
    [/tree|branch|gir/, 'Tree Fallen'],
  ]
  for (const [re, cat] of map) if (re.test(t)) return cat
  return 'Garbage'
}

function analytics(complaints) {
  const byStatus = {}, byDept = {}, byCategory = {}, byPriority = {}
  for (const c of complaints) {
    byStatus[c.status] = (byStatus[c.status] || 0) + 1
    byDept[c.department] = (byDept[c.department] || 0) + 1
    byCategory[c.category] = (byCategory[c.category] || 0) + 1
    byPriority[c.priorityLevel] = (byPriority[c.priorityLevel] || 0) + 1
  }
  const resolved = complaints.filter(c => ['Resolved','Closed'].includes(c.status))
  const avg = resolved.length
    ? resolved.reduce((s,c) => s + (new Date(c.updatedAt) - new Date(c.createdAt)) / 3600000, 0) / resolved.length
    : 0
  return {
    total: complaints.length,
    byStatus, byDept, byCategory, byPriority,
    avgResolutionHours: Math.round(avg * 10) / 10,
    duplicateRate: 12.4,
    openCritical: complaints.filter(c => c.priorityLevel === 'Critical' && c.status !== 'Closed').length,
    trend: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d,i) => ({ day:d, reported: 12 + ((i*7)%11), resolved: 9 + ((i*5)%9) })),
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

function makeToken(user) { return 'demo.' + btoa(unescape(encodeURIComponent(JSON.stringify({ id:user.id, role:user.role, name:user.name })))) + '.token' }

export function installDemoApi() {
  if (window.__civiceyeDemo) return
  window.__civiceyeDemo = true
  const realFetch = window.fetch.bind(window)

  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : (input && input.url) || ''
    if (!url.startsWith('/api') && !url.includes('/api/')) return realFetch(input, init)

    const u = new URL(url, location.origin)
    const p = u.pathname.replace(/^\/api/, '')
    const method = (init.method || 'GET').toUpperCase()
    const db = load()

    // AUTH
    if (p === '/auth/login' && method === 'POST') {
      const body = JSON.parse(init.body || '{}')
      const usr = USERS[(body.email || '').toLowerCase()]
      if (!usr || usr.password !== body.password) return json({ error: 'Invalid email or password' }, 401)
      const { password, ...safe } = usr
      return json({ user: safe, token: makeToken(safe) })
    }
    if (p === '/auth/register' && method === 'POST') {
      const body = JSON.parse(init.body || '{}')
      const safe = { id:'u'+Date.now(), name:body.name || 'New Citizen', email:body.email, role:'citizen', ward:body.ward || 'Kothrud' }
      USERS[(body.email||'').toLowerCase()] = { ...safe, password: body.password || 'demo' }
      return json({ user: safe, token: makeToken(safe) })
    }
    if (p === '/auth/me') {
      return json({ user: { id:'u1', name:'Citizen Demo', role:'citizen', ward:'Kothrud' } })
    }

    // COMPLAINTS
    if (p === '/complaints' && method === 'GET') {
      const mine = u.searchParams.get('mine') === 'true'
      return json(mine ? db.complaints.slice(0, 5) : db.complaints)
    }
    if (p === '/complaints' && method === 'POST') {
      const fd = init.body
      const get = (k) => (fd && typeof fd.get === 'function') ? fd.get(k) : ''
      const description = get('description') || 'Civic issue reported via CivicEye AI'
      const category = classify(description)
      const pri = /school|children|ambulance|unsafe|accident|critical|danger/i.test(description)
        ? { score: 91, level: 'Critical' } : { score: 63, level: 'High' }
      const c = {
        id: 'CV-2026-' + db.seq,
        description,
        category,
        categoryKey: category.toLowerCase().replace(/\s+/g, ''),
        confidence: 0.9 + Math.round(Math.random() * 8) / 100,
        department: DEPT_BY_CAT[category] || 'Sanitation',
        address: get('address') || 'Kothrud, Pune',
        lat: parseFloat(get('lat')) || 18.5074,
        lng: parseFloat(get('lng')) || 73.8077,
        priorityScore: pri.score,
        priorityLevel: pri.level,
        status: 'Open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        imageUrl: null,
        highlights: [{ x: 0.35, y: 0.4, w: 0.28, h: 0.22 }],
        duplicates: [],
        remarks: [],
      }
      db.complaints = [c, ...db.complaints]
      db.seq += 1
      save(db)
      return json({
        complaint: c,
        ai: {
          classification: { category, department: c.department, confidence: c.confidence },
          priority: { score: c.priorityScore, level: c.priorityLevel },
          duplicates: [],
        },
      }, 201)
    }
    const mStatus = p.match(/^\/complaints\/([^/]+)\/status$/)
    if (mStatus && method === 'PATCH') {
      const body = JSON.parse(init.body || '{}')
      const idx = db.complaints.findIndex(c => c.id === decodeURIComponent(mStatus[1]))
      if (idx < 0) return json({ error: 'Complaint not found' }, 404)
      const c = { ...db.complaints[idx], status: body.status || db.complaints[idx].status, updatedAt: new Date().toISOString() }
      c.remarks = [...(c.remarks || []), { status: body.status, remark: body.remark || '', at: new Date().toISOString() }]
      db.complaints[idx] = c
      save(db)
      return json(c)
    }
    const mOne = p.match(/^\/complaints\/([^/]+)$/)
    if (mOne && method === 'GET') {
      const c = db.complaints.find(x => x.id === decodeURIComponent(mOne[1]))
      return c ? json(c) : json({ error: 'Not found' }, 404)
    }

    if (p === '/analytics/summary') return json(analytics(db.complaints))
    return json({ ok: true, demo: true })
  }
}

export function resetDemoData() {
  try { localStorage.removeItem(DB_KEY) } catch (e) {}
}
