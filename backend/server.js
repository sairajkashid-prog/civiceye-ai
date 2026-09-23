const express = require('express');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');

const { CATEGORIES, classifyImage, computePriority, detectDuplicates } = require('./services/aiEngine');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'civiceye_jwt_secret_2025_level2';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads dir
if (!fs.existsSync(path.join(__dirname, 'uploads'))) fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } });

// In-memory stores (Persist to JSON for demo; in production -> PostgreSQL + Redis)
let users = [
  { id: 'u1', name: 'Sairaj S Kashid', email: 'citizen@test.com', password: bcrypt.hashSync('citizen123', 10), role: 'citizen', ward: 'Kothrud' },
  { id: 'u2', name: 'Officer R. Sharma', email: 'officer@test.com', password: bcrypt.hashSync('officer123', 10), role: 'officer', department: 'Road & Infrastructure' },
  { id: 'u3', name: 'Admin', email: 'admin@test.com', password: bcrypt.hashSync('admin123', 10), role: 'admin', department: 'All' }
];

let complaints = [
  {
    id: 'CMP-2025-001',
    citizenId: 'u1',
    citizenName: 'Aarav Deshmukh',
    categoryKey: 'pothole',
    category: CATEGORIES.pothole.label,
    department: CATEGORIES.pothole.department,
    confidence: 0.94,
    priorityScore: 88,
    priorityLevel: 'Critical',
    description: 'Large pothole near MIT WPU main gate, causing traffic jam and risk for two-wheelers.',
    location: { lat: 18.5168, lng: 73.8210 },
    address: 'Paud Road, Kothrud, Pune - 411038',
    imageUrl: null,
    status: 'In Progress',
    remarks: [{ by: 'Officer R. Sharma', text: 'Team dispatched, repair scheduled tomorrow', at: new Date(Date.now()-86400000).toISOString() }],
    duplicates: [],
    createdAt: new Date(Date.now() - 2*86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'CMP-2025-002',
    citizenId: 'u1',
    citizenName: 'Sneha Patil',
    categoryKey: 'garbage',
    category: CATEGORIES.garbage.label,
    department: CATEGORIES.garbage.department,
    confidence: 0.91,
    priorityScore: 72,
    priorityLevel: 'High',
    description: 'Garbage not collected for 4 days, foul smell, near market area.',
    location: { lat: 18.5204, lng: 73.8567 },
    address: 'Laxmi Road, Pune - 411030',
    imageUrl: null,
    status: 'Assigned',
    remarks: [],
    duplicates: [],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'CMP-2025-003',
    citizenId: 'u1',
    citizenName: 'Vikram Kulkarni',
    categoryKey: 'water_leakage',
    category: CATEGORIES.water_leakage.label,
    department: CATEGORIES.water_leakage.department,
    confidence: 0.96,
    priorityScore: 92,
    priorityLevel: 'Critical',
    description: 'Major water pipeline burst, water logging on road, wastage huge.',
    location: { lat: 18.5314, lng: 73.8446 },
    address: 'Aundh Road, Pune - 411007',
    imageUrl: null,
    status: 'Open',
    remarks: [],
    duplicates: [],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'CMP-2025-004',
    citizenId: 'u1',
    citizenName: 'Priya Joshi',
    categoryKey: 'streetlight',
    category: CATEGORIES.streetlight.label,
    department: CATEGORIES.streetlight.department,
    confidence: 0.89,
    priorityScore: 48,
    priorityLevel: 'Medium',
    description: 'Streetlight not working for 1 week, dark street unsafe at night.',
    location: { lat: 18.5074, lng: 73.8077 },
    address: 'Warje, Pune - 411058',
    imageUrl: null,
    status: 'Resolved',
    remarks: [{ by: 'Electrical Dept.', text: 'Replaced LED fixture, tested OK', at: new Date().toISOString() }],
    duplicates: [],
    createdAt: new Date(Date.now() - 5*86400000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Auth middleware
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token' });
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) { return res.status(401).json({ error: 'Invalid token' }); }
}

// ========== AUTH ROUTES ==========
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, ward } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  if (users.find(u => u.email === email)) return res.status(400).json({ error: 'Email already exists' });
  const hashed = await bcrypt.hash(password, 10);
  const user = { id: uuidv4(), name, email, password: hashed, role: 'citizen', ward: ward || 'Pune' };
  users.push(user);
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name, department: user.department }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department } });
});

app.get('/api/auth/me', auth, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, department: user.department });
});

// ========== COMPLAINT ROUTES ==========

// Get all complaints (with role filtering)
app.get('/api/complaints', auth, (req, res) => {
  let result = [...complaints];
  const { status, department, mine } = req.query;
  if (mine === 'true') result = result.filter(c => c.citizenId === req.user.id);
  if (status) result = result.filter(c => c.status === status);
  if (department) result = result.filter(c => c.department === department);
  // Officer sees only their dept
  if (req.user.role === 'officer' && req.user.department) {
    result = result.filter(c => c.department === req.user.department);
  }
  result.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(result);
});

app.get('/api/complaints/:id', auth, (req, res) => {
  const c = complaints.find(x => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'Not found' });
  res.json(c);
});

// Create complaint with AI processing
app.post('/api/complaints', auth, upload.single('image'), (req, res) => {
  try {
    const { description, lat, lng, address } = req.body;
    if (!lat || !lng) return res.status(400).json({ error: 'Location required (lat/lng)' });
    
    const location = { lat: parseFloat(lat), lng: parseFloat(lng) };
    const fileName = req.file ? req.file.originalname : (req.body.imageName || 'unknown.jpg');
    const fileBuffer = req.file ? fs.readFileSync(req.file.path) : null;
    
    // AI Classification
    const { key: categoryKey, confidence } = classifyImage(fileName, fileBuffer);
    const category = CATEGORIES[categoryKey];
    
    // Duplicate detection
    const tempComplaint = { categoryKey, location };
    const duplicates = detectDuplicates(tempComplaint, complaints);
    const duplicateScore = duplicates.length > 0 ? duplicates[0].similarity : 0;
    
    // Priority scoring
    const { score: priorityScore, level: priorityLevel } = computePriority(categoryKey, confidence, location, duplicates.length);
    
    const newComplaint = {
      id: 'CMP-' + new Date().getFullYear() + '-' + String(complaints.length + 1).padStart(3, '0') + '-' + Math.random().toString(36).substr(2,3).toUpperCase(),
      citizenId: req.user.id,
      citizenName: req.user.name,
      categoryKey,
      category: category.label,
      department: category.department,
      confidence: Math.round(confidence*100)/100,
      priorityScore,
      priorityLevel,
      description: description || `Auto-detected: ${category.label}`,
      location,
      address: address || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
      imageName: fileName,
      status: 'Open',
      remarks: [],
      duplicates,
      isDuplicate: duplicates.length > 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    complaints.unshift(newComplaint);
    
    // Real-time emit
    io.emit('new_complaint', newComplaint);
    if (duplicates.length > 0) io.emit('duplicate_alert', { newId: newComplaint.id, duplicates });
    
    res.json({
      complaint: newComplaint,
      ai: {
        classification: { category: category.label, confidence, department: category.department },
        priority: { score: priorityScore, level: priorityLevel },
        duplicates
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'AI processing failed', details: e.message });
  }
});

// Update status (officer/admin)
app.patch('/api/complaints/:id/status', auth, (req, res) => {
  if (!['officer','admin'].includes(req.user.role)) return res.status(403).json({ error: 'Only officer/admin' });
  const c = complaints.find(x => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'Not found' });
  const { status, remark } = req.body;
  const allowed = ['Open','Assigned','In Progress','Resolved','Closed','Rejected'];
  if (status && !allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  if (status) c.status = status;
  if (remark) c.remarks.push({ by: req.user.name, text: remark, at: new Date().toISOString() });
  c.updatedAt = new Date().toISOString();
  
  io.emit('status_update', { id: c.id, status: c.status, remark });
  // Mock notification
  io.emit('notification', { to: c.citizenId, message: `Your complaint ${c.id} is now ${c.status}`, complaintId: c.id });
  
  res.json(c);
});

// Analytics
app.get('/api/analytics/summary', auth, (req, res) => {
  const total = complaints.length;
  const byStatus = {};
  const byCategory = {};
  const byDept = {};
  const byPriority = { Critical:0, High:0, Medium:0, Low:0 };
  
  complaints.forEach(c => {
    byStatus[c.status] = (byStatus[c.status]||0)+1;
    byCategory[c.category] = (byCategory[c.category]||0)+1;
    byDept[c.department] = (byDept[c.department]||0)+1;
    byPriority[c.priorityLevel] = (byPriority[c.priorityLevel]||0)+1;
  });
  
  // Avg resolution time (for Resolved)
  const resolved = complaints.filter(c => c.status==='Resolved' || c.status==='Closed');
  let avgResolutionHours = 0;
  if (resolved.length) {
    const totalMs = resolved.reduce((acc,c) => acc + (new Date(c.updatedAt)-new Date(c.createdAt)), 0);
    avgResolutionHours = Math.round(totalMs / resolved.length / 3600000 *10)/10;
  }
  
  // Trend last 7 days
  const trend = [];
  for(let i=6;i>=0;i--){
    const d = new Date(); d.setDate(d.getDate()-i);
    const key = d.toISOString().slice(0,10);
    const count = complaints.filter(c => c.createdAt.slice(0,10)===key).length;
    trend.push({ date: key.slice(5), count });
  }
  
  res.json({
    total, byStatus, byCategory, byDept, byPriority,
    avgResolutionHours,
    trend,
    duplicateRate: Math.round(complaints.filter(c=>c.duplicates && c.duplicates.length>0).length/total*100) || 0,
    openCritical: complaints.filter(c=>c.priorityLevel==='Critical' && c.status!=='Resolved' && c.status!=='Closed').length
  });
});

app.get('/api/categories', (req,res) => {
  res.json(Object.entries(CATEGORIES).map(([key, v]) => ({ key, ...v })));
});

// Health
app.get('/api/health', (req,res) => res.json({ status: 'ok', uptime: process.uptime(), complaints: complaints.length, version: '2.0.0' }));

// Serve frontend in production
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req,res) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/socket.io')) return res.status(404).json({error:'Not found'});
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Socket auth (simple)
io.on('connection', socket => {
  console.log('Socket connected', socket.id);
  socket.on('join', room => socket.join(room));
  socket.on('disconnect', () => console.log('Socket disconnected', socket.id));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ CivicEye Backend running on http://0.0.0.0:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
});
