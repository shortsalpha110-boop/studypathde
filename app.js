/* ============================================
   STUDYPATHDE — Main Application Logic
   ============================================ */

// ---- NAVBAR SCROLL EFFECT ----
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
});

// ---- UPLOAD ZONE ----
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const uploadIdle = document.getElementById('uploadIdle');
const uploadSuccess = document.getElementById('uploadSuccess');
const successFilename = document.getElementById('successFilename');
const btnChangeFile = document.getElementById('btnChangeFile');

let uploadedFile = null;

uploadZone.addEventListener('click', (e) => {
  if (e.target === btnChangeFile || btnChangeFile.contains(e.target)) return;
  fileInput.click();
});

uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.classList.add('drag-over');
});

uploadZone.addEventListener('dragleave', () => {
  uploadZone.classList.remove('drag-over');
});

uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) handleFile(fileInput.files[0]);
});

btnChangeFile.addEventListener('click', (e) => {
  e.stopPropagation();
  uploadedFile = null;
  uploadIdle.style.display = 'block';
  uploadSuccess.style.display = 'none';
  fileInput.value = '';
});

function handleFile(file) {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED = ['application/pdf','application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg','image/jpg','image/png'];

  if (!ALLOWED.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|jpg|jpeg|png)$/i)) {
    showToast('Please upload a PDF, Word document, or image file.', 'error');
    return;
  }
  if (file.size > MAX_SIZE) {
    showToast('File too large. Maximum size is 10MB.', 'error');
    return;
  }

  uploadedFile = file;
  successFilename.textContent = `📎 ${file.name}`;
  uploadIdle.style.display = 'none';
  uploadSuccess.style.display = 'block';
}

// ---- UNIVERSITY DATABASE ----
const UNIVERSITIES = [
  {
    name: 'TU Munich', city: 'Munich, Bavaria',
    fields: ['Computer Science / IT', 'Engineering (Mechanical / Electrical / Civil)', 'Natural Sciences (Physics / Chemistry / Biology)', 'Mathematics / Statistics'],
    german: ['b2','c1','c2'], english: ['b2','c1','c2','native'],
    grades: ['excellent','very_good','good'],
    tags: ['Research Excellence', 'Top 1%', 'Global Ranking']
  },
  {
    name: 'LMU Munich', city: 'Munich, Bavaria',
    fields: ['Medicine / Health Sciences', 'Law', 'Social Sciences / Psychology', 'Natural Sciences (Physics / Chemistry / Biology)'],
    german: ['c1','c2'], english: ['b2','c1','c2','native'],
    grades: ['excellent','very_good'],
    tags: ['Nobel Laureates', 'Medical School', 'Historic']
  },
  {
    name: 'Heidelberg University', city: 'Heidelberg, Baden-Württemberg',
    fields: ['Medicine / Health Sciences', 'Natural Sciences (Physics / Chemistry / Biology)', 'Humanities / Arts'],
    german: ['b2','c1','c2'], english: ['b2','c1','c2','native'],
    grades: ['excellent','very_good','good'],
    tags: ["Germany's Oldest", 'Research', 'Excellence']
  },
  {
    name: 'RWTH Aachen', city: 'Aachen, NRW',
    fields: ['Engineering (Mechanical / Electrical / Civil)', 'Computer Science / IT', 'Mathematics / Statistics'],
    german: ['b2','c1','c2'], english: ['b2','c1','c2','native'],
    grades: ['excellent','very_good','good'],
    tags: ['Engineering #1', 'Industry Ties', 'Innovation']
  },
  {
    name: 'Freie Universität Berlin', city: 'Berlin',
    fields: ['Social Sciences / Psychology', 'Humanities / Arts', 'Law', 'Medicine / Health Sciences'],
    german: ['b2','c1','c2'], english: ['b1','b2','c1','c2','native'],
    grades: ['excellent','very_good','good','average'],
    tags: ['International', 'Research', 'Berlin']
  },
  {
    name: 'Humboldt University Berlin', city: 'Berlin',
    fields: ['Natural Sciences (Physics / Chemistry / Biology)', 'Humanities / Arts', 'Social Sciences / Psychology'],
    german: ['b2','c1','c2'], english: ['b2','c1','c2','native'],
    grades: ['excellent','very_good','good'],
    tags: ['Historic', 'Research Excellence', 'Berlin']
  },
  {
    name: 'University of Frankfurt', city: 'Frankfurt, Hesse',
    fields: ['Business Administration / Economics', 'Law', 'Social Sciences / Psychology'],
    german: ['b2','c1','c2'], english: ['b2','c1','c2','native'],
    grades: ['excellent','very_good','good','average'],
    tags: ['Finance Hub', 'Business', 'International']
  },
  {
    name: 'University of Hamburg', city: 'Hamburg',
    fields: ['Business Administration / Economics', 'Law', 'Natural Sciences (Physics / Chemistry / Biology)'],
    german: ['b2','c1','c2'], english: ['b1','b2','c1','native'],
    grades: ['excellent','very_good','good','average'],
    tags: ['Port City', 'International Trade', 'Research']
  },
  {
    name: 'KIT (Karlsruhe)', city: 'Karlsruhe, Baden-Württemberg',
    fields: ['Engineering (Mechanical / Electrical / Civil)', 'Computer Science / IT', 'Architecture / Urban Planning'],
    german: ['b2','c1','c2'], english: ['b2','c1','c2','native'],
    grades: ['excellent','very_good','good'],
    tags: ['Tech Excellence', 'Engineering', 'Innovation']
  },
  {
    name: 'TU Berlin', city: 'Berlin',
    fields: ['Computer Science / IT', 'Engineering (Mechanical / Electrical / Civil)', 'Architecture / Urban Planning', 'Mathematics / Statistics'],
    german: ['b2','c1','c2'], english: ['b1','b2','c1','c2','native'],
    grades: ['excellent','very_good','good','average'],
    tags: ['Tech', 'Berlin', 'International Students']
  },
  {
    name: 'University of Cologne', city: 'Cologne, NRW',
    fields: ['Business Administration / Economics', 'Law', 'Medicine / Health Sciences', 'Social Sciences / Psychology'],
    german: ['b2','c1','c2'], english: ['b2','c1','c2','native'],
    grades: ['excellent','very_good','good','average'],
    tags: ['Large Campus', 'Business', 'Medicine']
  },
  {
    name: 'FAU Erlangen-Nürnberg', city: 'Erlangen, Bavaria',
    fields: ['Engineering (Mechanical / Electrical / Civil)', 'Medicine / Health Sciences', 'Computer Science / IT'],
    german: ['b2','c1','c2'], english: ['b2','c1','c2','native'],
    grades: ['excellent','very_good','good'],
    tags: ['Tech Industry', 'Siemens HQ', 'Engineering']
  },
  {
    name: 'HTW Berlin', city: 'Berlin',
    fields: ['Engineering (Mechanical / Electrical / Civil)', 'Computer Science / IT', 'Business Administration / Economics', 'Architecture / Urban Planning'],
    german: ['b1','b2','c1'], english: ['b1','b2','c1','c2','native'],
    grades: ['excellent','very_good','good','average','below_average'],
    tags: ['Applied Sciences', 'Practical', 'International']
  },
  {
    name: 'Hochschule München (HM)', city: 'Munich, Bavaria',
    fields: ['Engineering (Mechanical / Electrical / Civil)', 'Computer Science / IT', 'Business Administration / Economics'],
    german: ['b2','c1','c2'], english: ['b1','b2','c1','c2','native'],
    grades: ['excellent','very_good','good','average'],
    tags: ['Applied Sciences', 'Munich', 'Industry Connections']
  },
  {
    name: 'Jacobs University Bremen', city: 'Bremen (English-medium)',
    fields: ['Computer Science / IT', 'Engineering (Mechanical / Electrical / Civil)', 'Business Administration / Economics', 'Natural Sciences (Physics / Chemistry / Biology)'],
    german: ['none','a1','a2','b1','b2','c1','c2'], english: ['b2','c1','c2','native'],
    grades: ['excellent','very_good','good','average'],
    tags: ['100% English', 'International', 'Liberal Arts']
  },
];

// ---- GRADE SCORE MAP ----
const GRADE_SCORE = {
  excellent: 100, very_good: 85, good: 70, average: 55, below_average: 40
};

// ---- MATCH ALGORITHM ----
function matchUniversities(profile) {
  return UNIVERSITIES.map(uni => {
    let score = 0;
    // Field match
    if (uni.fields.includes(profile.field)) score += 40;
    else score += 5;
    // German match
    if (uni.german.includes(profile.german)) score += 25;
    else if (profile.german === 'none' && uni.german.includes('none')) score += 25;
    else if (profile.german !== 'none') score += 10;
    // English match
    if (uni.english.includes(profile.english)) score += 20;
    // Grade match
    if (uni.grades.includes(profile.grade)) score += 15;
    return { ...uni, score: Math.min(score, 100) };
  })
  .filter(u => u.score >= 30)
  .sort((a, b) => b.score - a.score)
  .slice(0, 10);
}

// ---- APPLICATION STATE ----
let currentProfile = {};
let matchedUnis = [];

// ---- STEP 1 → STEP 2 (Lead Capture) ----
document.getElementById('btnCheck').addEventListener('click', () => {
  const country = document.getElementById('country').value;
  const grade = document.getElementById('grade').value;
  const field = document.getElementById('field').value;
  const german = document.getElementById('german').value;
  const english = document.getElementById('english').value;

  if (!country || !grade || !field || !german || !english) {
    showToast('Please fill in all fields before continuing.', 'error');
    return;
  }

  currentProfile = { country, grade, field, german, english };
  matchedUnis = matchUniversities(currentProfile);

  document.getElementById('matchCount').textContent = matchedUnis.length;

  // Show lead capture step
  document.getElementById('step-details').style.display = 'none';
  document.getElementById('step-lead').style.display = 'block';
  document.getElementById('step-lead').scrollIntoView({ behavior: 'smooth', block: 'center' });
});

// ---- STEP 2 → STEP 3 (Results) ----
document.getElementById('btnReveal').addEventListener('click', () => {
  const name = document.getElementById('leadName').value.trim();
  const email = document.getElementById('leadEmail').value.trim();

  if (!name) { showToast('Please enter your full name.', 'error'); return; }
  if (!email || !isValidEmail(email)) { showToast('Please enter a valid email address.', 'error'); return; }

  currentProfile.name = name;
  currentProfile.email = email;

  // Save lead to localStorage
  saveLead({ ...currentProfile, timestamp: new Date().toISOString(), unis: matchedUnis.map(u => u.name) });

  // Render results
  renderResults(name, matchedUnis);

  document.getElementById('step-lead').style.display = 'none';
  document.getElementById('step-results').style.display = 'block';
  document.getElementById('step-results').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// ---- RENDER RESULTS ----
function renderResults(name, unis) {
  document.getElementById('resultName').textContent = name;
  const grid = document.getElementById('unisGrid');
  grid.innerHTML = unis.map(u => `
    <div class="uni-card">
      <div class="uni-match-score">★ ${u.score}% Match</div>
      <div class="uni-name">${u.name}</div>
      <div class="uni-city">📍 ${u.city}</div>
      <div class="uni-tags">
        ${u.tags.map(t => `<span class="uni-tag">${t}</span>`).join('')}
      </div>
    </div>
  `).join('');
}

// ---- PDF DOWNLOAD ----
document.getElementById('btnDownloadPDF').addEventListener('click', () => {
  generatePDF(currentProfile, matchedUnis);
});

function generatePDF(profile, unis) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const W = 210;
  const gold = [212, 168, 67];
  const dark = [8, 11, 18];
  const white = [232, 234, 240];
  const muted = [122, 130, 153];
  const green = [34, 197, 94];

  // BACKGROUND
  doc.setFillColor(...dark);
  doc.rect(0, 0, W, 297, 'F');

  // HEADER BAND
  doc.setFillColor(14, 20, 32);
  doc.rect(0, 0, W, 60, 'F');

  // GOLD ACCENT LINE
  doc.setFillColor(...gold);
  doc.rect(0, 58, W, 2, 'F');

  // LOGO / TITLE
  doc.setTextColor(...gold);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('✦ StudyPathDE', 20, 28);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...muted);
  doc.text('Personalized University Admission Guide', 20, 38);

  // Date
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, 20, 48);

  // STUDENT PROFILE SECTION
  let y = 76;

  doc.setFillColor(18, 24, 38);
  doc.roundedRect(15, y - 6, W - 30, 58, 4, 4, 'F');
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.5);
  doc.roundedRect(15, y - 6, W - 30, 58, 4, 4, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...gold);
  doc.text(`Student Profile: ${profile.name}`, 22, y + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...white);

  const profileLines = [
    [`Country of Origin:`, profile.country],
    [`Field of Study:`, profile.field],
    [`Academic Grade:`, formatGrade(profile.grade)],
    [`German Level:`, profile.german ? profile.german.toUpperCase() : 'Not specified'],
    [`English Level:`, profile.english ? profile.english.toUpperCase() : 'Not specified'],
  ];

  profileLines.forEach(([label, val], i) => {
    const col = i < 3 ? 22 : 115;
    const row = i < 3 ? y + 14 + (i * 12) : y + 14 + ((i - 3) * 12);
    doc.setTextColor(...muted);
    doc.text(label, col, row);
    doc.setTextColor(...white);
    doc.text(val, col + 42, row);
  });

  // SECTION TITLE: UNIVERSITIES
  y += 72;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...gold);
  doc.text('Your Matched Universities', 20, y);

  doc.setFillColor(...gold);
  doc.rect(20, y + 3, 80, 0.8, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text(`Based on your profile, ${profile.name}, here are your ${unis.length} best matches in Germany:`, 20, y + 12);

  y += 20;

  // UNIVERSITY CARDS
  unis.forEach((uni, i) => {
    if (y > 255) {
      doc.addPage();
      doc.setFillColor(...dark);
      doc.rect(0, 0, W, 297, 'F');
      y = 20;
    }

    const cardH = 32;
    doc.setFillColor(18, 24, 38);
    doc.roundedRect(15, y, W - 30, cardH, 3, 3, 'F');

    // Match score bar
    const barW = (W - 30 - 10) * (uni.score / 100);
    doc.setFillColor(...gold);
    doc.setGState && doc.setGState(doc.GState ? new doc.GState({ opacity: 0.15 }) : undefined);
    doc.rect(15, y, W - 30, 2, 'F');
    doc.setFillColor(...gold);
    doc.rect(15, y, barW, 2, 'F');

    // Number circle
    doc.setFillColor(...gold);
    doc.circle(28, y + 16, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...dark);
    doc.text(String(i + 1), 28, y + 18.5, { align: 'center' });

    // University info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...white);
    doc.text(uni.name, 38, y + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...muted);
    doc.text(`📍 ${uni.city}`, 38, y + 21);

    // Score badge
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...gold);
    doc.text(`${uni.score}% Match`, W - 40, y + 16, { align: 'right' });

    // Tags
    const tagStr = uni.tags.join(' · ');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 110, 130);
    doc.text(tagStr, W - 40, y + 23, { align: 'right' });

    y += cardH + 6;
  });

  // NEXT STEPS SECTION
  if (y > 230) {
    doc.addPage();
    doc.setFillColor(...dark);
    doc.rect(0, 0, W, 297, 'F');
    y = 20;
  }

  y += 10;
  doc.setFillColor(14, 20, 32);
  doc.roundedRect(15, y, W - 30, 70, 4, 4, 'F');
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.5);
  doc.roundedRect(15, y, W - 30, 70, 4, 4, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...gold);
  doc.text(`Next Steps, ${profile.name}`, 22, y + 12);

  const steps = [
    ['1.', 'Research each matched university — check their official website for the latest requirements.'],
    ['2.', 'Prepare your documents: certified transcripts, language certificates, motivation letter.'],
    ['3.', 'Apply via uni-assist.de for international applicants or directly to the university portal.'],
    ['4.', 'Watch deadlines — summer semester: Jan 15, winter semester: Jul 15 (typical).'],
    ['5.', 'Upgrade to our Admission Service for expert guidance through the entire process.'],
  ];

  doc.setFontSize(9);
  steps.forEach(([num, text], i) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...gold);
    doc.text(num, 22, y + 24 + i * 10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...white);
    doc.text(text, 28, y + 24 + i * 10, { maxWidth: W - 50 });
  });

  // FOOTER
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFillColor(14, 20, 32);
    doc.rect(0, 285, W, 12, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    doc.text('StudyPathDE — studypathde.com', 20, 292);
    doc.text(`Page ${p} of ${pageCount}`, W - 20, 292, { align: 'right' });
    doc.setTextColor(...gold);
    doc.text(`Personalized for ${profile.name} | ${profile.country}`, W / 2, 292, { align: 'center' });
  }

  doc.save(`StudyPathDE_Guide_${profile.name.replace(/\s+/g,'_')}.pdf`);
  showToast('Your personalized PDF guide is downloading!', 'success');
}

function formatGrade(g) {
  const map = {
    excellent: 'Excellent (Top 10% / GPA 3.7+)',
    very_good: 'Very Good (GPA 3.3 – 3.6)',
    good: 'Good (GPA 2.7 – 3.2)',
    average: 'Average (GPA 2.0 – 2.6)',
    below_average: 'Below Average (< 2.0)'
  };
  return map[g] || g;
}

// ---- LEAD STORAGE ----
function saveLead(lead) {
  let leads = JSON.parse(localStorage.getItem('studypathde_leads') || '[]');
  leads.push(lead);
  localStorage.setItem('studypathde_leads', JSON.stringify(leads));
}

// ---- EMAIL VALIDATION ----
function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

// ---- TOAST ----
function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = message;
  Object.assign(t.style, {
    position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
    padding: '14px 28px', borderRadius: '10px', zIndex: '9999',
    fontFamily: 'Space Grotesk, Inter, sans-serif', fontWeight: '600',
    fontSize: '0.9rem', whiteSpace: 'nowrap',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    background: type === 'error' ? 'rgba(239,68,68,0.9)' : type === 'success' ? 'rgba(34,197,94,0.9)' : 'rgba(212,168,67,0.9)',
    color: type === 'error' ? '#fff' : '#080b12',
    animation: 'fadeInUp 0.3s ease'
  });
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}
