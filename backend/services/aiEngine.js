/**
 * CivicEye AI Engine - Mock Computer Vision & Priority Scoring
 * Simulates YOLOv8 + OpenCV classification, duplicate detection & severity scoring
 * In production: Replace with actual YOLOv8 inference + CLIP embeddings
 */

const crypto = require('crypto');

// Classification categories with department mapping
const CATEGORIES = {
  pothole: { label: 'Pothole / Road Damage', department: 'Road & Infrastructure', icon: '🕳️', severityBase: 75 },
  garbage: { label: 'Garbage / Waste Accumulation', department: 'Solid Waste Management', icon: '🗑️', severityBase: 65 },
  water_leakage: { label: 'Water Leakage / Pipe Burst', department: 'Water Supply Dept.', icon: '💧', severityBase: 85 },
  streetlight: { label: 'Damaged Streetlight', department: 'Electrical Dept.', icon: '💡', severityBase: 55 },
  drainage: { label: 'Blocked Drainage / Sewage', department: 'Drainage Dept.', icon: '🚿', severityBase: 80 },
  footpath: { label: 'Footpath Encroachment / Damage', department: 'Road & Infrastructure', icon: '🚧', severityBase: 50 }
};

const CATEGORY_KEYS = Object.keys(CATEGORIES);

// Simulate image classification - in real would use YOLOv8
function classifyImage(fileName, fileBuffer) {
  // Simple heuristic: use filename + hash to deterministically classify
  // Ensures demo is consistent but appears intelligent
  const hash = crypto.createHash('md5').update(fileName + (fileBuffer ? fileBuffer.length : 0)).digest('hex');
  const hashInt = parseInt(hash.substring(0, 8), 16);
  
  // Keyword detection for better demo
  const lower = fileName.toLowerCase();
  if (lower.includes('pothole') || lower.includes('road')) return { key: 'pothole', confidence: 0.92 + Math.random()*0.06 };
  if (lower.includes('garbage') || lower.includes('waste') || lower.includes('trash')) return { key: 'garbage', confidence: 0.89 + Math.random()*0.08 };
  if (lower.includes('water') || lower.includes('leak') || lower.includes('pipe')) return { key: 'water_leakage', confidence: 0.91 + Math.random()*0.06 };
  if (lower.includes('light') || lower.includes('street')) return { key: 'streetlight', confidence: 0.87 + Math.random()*0.09 };
  if (lower.includes('drain')) return { key: 'drainage', confidence: 0.88 + Math.random()*0.08 };
  
  const idx = hashInt % CATEGORY_KEYS.length;
  const key = CATEGORY_KEYS[idx];
  const confidence = 0.82 + (hashInt % 15) / 100; // 0.82 - 0.96
  return { key, confidence: Math.min(0.97, confidence) };
}

function computePriority(categoryKey, confidence, location, duplicateScore = 0) {
  const cat = CATEGORIES[categoryKey];
  let score = cat.severityBase;
  
  // Confidence boost
  score += (confidence - 0.85) * 40;
  
  // Location density factor (simulated: central areas higher priority)
  // Pune central approx 18.52, 73.85
  if (location && location.lat && location.lng) {
    const distFromCenter = Math.sqrt(Math.pow(location.lat - 18.5204, 2) + Math.pow(location.lng - 73.8567, 2));
    if (distFromCenter < 0.05) score += 8; // High density
    else if (distFromCenter < 0.15) score += 4;
  }
  
  // Duplicate clustering increases priority (many reports = severe)
  score += duplicateScore * 10;
  
  // Random urgency variance
  score += (Math.random() * 6 - 3);
  
  score = Math.max(10, Math.min(100, Math.round(score)));
  
  let level = 'Low';
  if (score >= 80) level = 'Critical';
  else if (score >= 65) level = 'High';
  else if (score >= 45) level = 'Medium';
  
  return { score, level };
}

// Haversine distance in meters
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI/180, φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function detectDuplicates(newComplaint, existingComplaints) {
  const thresholdMeters = 80; // within 80m considered nearby
  let duplicates = [];
  
  for (const c of existingComplaints) {
    if (c.categoryKey !== newComplaint.categoryKey) continue;
    if (c.status === 'Resolved' || c.status === 'Closed') continue;
    
    const dist = haversine(
      newComplaint.location.lat, newComplaint.location.lng,
      c.location.lat, c.location.lng
    );
    
    // Image similarity simulated via perceptual hash comparison
    // Here: same category + close location = potential duplicate
    if (dist < thresholdMeters) {
      // Simulate image similarity 0-1
      const imageSimilarity = Math.max(0, 1 - dist/thresholdMeters) * 0.7 + Math.random()*0.25;
      const locationSimilarity = 1 - Math.min(1, dist/500);
      const combined = imageSimilarity * 0.6 + locationSimilarity * 0.4;
      
      if (combined > 0.65) {
        duplicates.push({
          complaintId: c.id,
          distanceMeters: Math.round(dist),
          similarity: Math.round(combined*100)/100,
          address: c.address
        });
      }
    }
  }
  
  duplicates.sort((a,b) => b.similarity - a.similarity);
  return duplicates.slice(0, 3);
}

module.exports = {
  CATEGORIES,
  classifyImage,
  computePriority,
  detectDuplicates,
  haversine
};
