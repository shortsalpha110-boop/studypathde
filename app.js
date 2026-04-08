/* ============================================
   STUDYPATHDE — Main Application Logic

   SUPABASE TABLE STRUCTURE — run this SQL in your Supabase dashboard:
   CREATE TABLE leads (
     id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name          TEXT NOT NULL,
     email         TEXT NOT NULL,
     whatsapp      TEXT,
     country       TEXT,
     grade         TEXT,
     field         TEXT,
     degree_level  TEXT,
     german_level  TEXT,
     english_level TEXT,
     matched_unis  TEXT[],
     timestamp     TIMESTAMPTZ DEFAULT now()
   );
   ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Allow anon insert"        ON leads FOR INSERT TO anon            WITH CHECK (true);
   CREATE POLICY "Allow authenticated read" ON leads FOR SELECT TO authenticated   USING (true);
   ============================================ */

// ---- SUPABASE CONFIG ----
const SUPABASE_URL      = 'https://oohuqoznqpvrnfmauxtm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vaHVxb3pucXB2cm5mbWF1eHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMDY2MDIsImV4cCI6MjA1OTY4MjYwMn0.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vaHVxb3pucXB2cm5mbWF1eHRtIiwicm9sZSI6ImFub24ifQ';

async function saveLeadToSupabase(lead) {
  console.log('[Supabase] Attempting insert:', lead.name, lead.email);
  try {
    const res = await fetch('https://oohuqoznqpvrnfmauxtm.supabase.co/rest/v1/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vaHVxb3pucXB2cm5mbWF1eHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMDY2MDIsImV4cCI6MjA1OTY4MjYwMn0.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vaHVxb3pucXB2cm5mbWF1eHRtIiwicm9sZSI6ImFub24ifQ',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vaHVxb3pucXB2cm5mbWF1eHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMDY2MDIsImV4cCI6MjA1OTY4MjYwMn0.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vaHVxb3pucXB2cm5mbWF1eHRtIiwicm9sZSI6ImFub24ifQ',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ name: lead.name, email: lead.email }),
    });
    console.log('[Supabase] Response status:', res.status);
    if (!res.ok) {
      const errText = await res.text();
      console.error('[Supabase] Insert failed:', res.status, errText);
    } else {
      console.log('[Supabase] Insert successful');
    }
  } catch (e) {
    console.error('[Supabase] Network error:', e);
  }
}

// ---- ENGLISH LEVEL HELPERS ----
function englishToLevel(val) {
  const map = { ielts_5:'b1', ielts_6:'b2', ielts_6_5:'c1', ielts_7:'c2', toefl_79:'b1', toefl_80:'b2', toefl_96:'c1', native:'native', none:'none' };
  return map[val] || val;
}
function formatEnglishShort(val) {
  const map = { ielts_5:'IELTS 5.0-5.5', ielts_6:'IELTS 6.0', ielts_6_5:'IELTS 6.5', ielts_7:'IELTS 7.0+', toefl_79:'TOEFL under 79', toefl_80:'TOEFL 80-95', toefl_96:'TOEFL 96+', native:'Native Speaker', none:'No Certificate' };
  return map[val] || val || 'Not specified';
}
function formatEnglishFull(val) {
  const map = { ielts_5:'IELTS 5.0-5.5 (Basic)', ielts_6:'IELTS 6.0 (Good)', ielts_6_5:'IELTS 6.5 (Very Good)', ielts_7:'IELTS 7.0+ (Excellent)', toefl_79:'TOEFL 79 or below', toefl_80:'TOEFL 80-95 (Good)', toefl_96:'TOEFL 96+ (Excellent)', native:'Native English Speaker', none:'No English Certificate Yet' };
  return map[val] || val || 'Not specified';
}
function getEnglishNote(val) {
  const map = { ielts_5:'Meets minimum for some applied science programs. Options are limited.', ielts_6:'Qualifies for most English-taught programs in Germany.', ielts_6_5:'Competitive score accepted at most German universities.', ielts_7:'Excellent score. No restrictions on English-taught programs.', toefl_79:'Below most thresholds. Consider retaking to improve your options.', toefl_80:'Meets requirements for most English-taught programs.', toefl_96:'Excellent TOEFL score. Qualifies for all programs.', native:'Native speaker - no certificate needed for English programs.', none:'No certificate yet. Consider IELTS if applying to English-taught programs.' };
  return map[val] || 'Check individual university requirements.';
}
function getGermanNote(val) {
  const notes = { none:'No German yet. Focus on English-taught programs or start a language course now.', a1:'Very basic. Enrol in intensive German course. Target B2 within 12-18 months.', a2:'Elementary level. Continue studying. Most programs require B2 minimum.', b1:'Intermediate. Around 3-6 months of study to reach B2.', b2:'Good level - meets minimum for most German-taught programs.', c1:'Advanced German. Qualifies for all German-taught programs.', c2:'Mastery level. No language restrictions.' };
  return notes[val] || 'Check university language requirements.';
}

// ---- FIELD CATEGORY MAP (maps specific fields to university field categories for matching) ----
const FIELD_CATEGORY_MAP = {
  'Accounting': 'Business Administration / Economics',
  'Finance & Banking': 'Business Administration / Economics',
  'Marketing': 'Business Administration / Economics',
  'International Business': 'Business Administration / Economics',
  'Human Resource Management': 'Business Administration / Economics',
  'Supply Chain Management': 'Business Administration / Economics',
  'Tourism & Hospitality Management': 'Business Administration / Economics',
  'Economics': 'Business Administration / Economics',
  'Media & Communications': 'Media / Communication',
  'Journalism': 'Media / Communication',
  'Film & Television': 'Media / Communication',
  'Graphic Design': 'Architecture / Urban Planning',
  'Fashion Design': 'Architecture / Urban Planning',
  'Industrial Design': 'Architecture / Urban Planning',
  'Pharmacy': 'Medicine / Health Sciences',
  'Nursing': 'Medicine / Health Sciences',
  'Dentistry': 'Medicine / Health Sciences',
  'Veterinary Medicine': 'Medicine / Health Sciences',
  'Biotechnology': 'Natural Sciences (Physics / Chemistry / Biology)',
  'Biochemistry': 'Natural Sciences (Physics / Chemistry / Biology)',
  'Chemistry': 'Natural Sciences (Physics / Chemistry / Biology)',
  'Physics': 'Natural Sciences (Physics / Chemistry / Biology)',
  'Mathematics': 'Mathematics / Statistics',
  'Statistics': 'Mathematics / Statistics',
  'Political Science': 'Social Sciences / Psychology',
  'International Relations': 'Social Sciences / Psychology',
  'Sociology': 'Social Sciences / Psychology',
  'Psychology': 'Social Sciences / Psychology',
  'Education & Teaching': 'Social Sciences / Psychology',
  'Sports Science': 'Social Sciences / Psychology',
  'Philosophy': 'Humanities / Arts',
  'History': 'Humanities / Arts',
  'Linguistics': 'Humanities / Arts',
  'Translation Studies': 'Humanities / Arts',
  'Fine Arts': 'Humanities / Arts',
  'Music': 'Humanities / Arts',
  'Theatre & Performance': 'Humanities / Arts',
};
function resolveFieldCategory(field) {
  return FIELD_CATEGORY_MAP[field] || field;
}

// ---- COUNTRY DATA ----
const COUNTRY_DATA_MAP = {
  'India': { anabinStatus:'Recognised (H+)', anabinNote:'Indian degrees from recognized institutions are fully accepted. Certificates must be attested by the Ministry of Education. No APS required for Indian students.', visaEmbassy:'German Embassy New Delhi; Consulates in Mumbai, Chennai, Bangalore, Kolkata, Hyderabad', visaTimeline:'6-8 weeks', documentsNote:'Ministry of Education attestation required on mark sheets. Degree certificate must bear university seal.', additionalVisaDoc:'Ministry-attested transcripts and degree certificate' },
  'China': { anabinStatus:'Recognised - APS Certificate Required', anabinNote:'Chinese degrees are recognised but ALL Chinese applicants MUST obtain an APS (Akademische Pruefstelle) certificate before applying. This is a mandatory pre-screening process unique to China.', visaEmbassy:'German Embassy Beijing; Consulates in Shanghai, Guangzhou, Chengdu, Shenyang', visaTimeline:'4-6 weeks', documentsNote:'APS certificate is mandatory. Get it from the German Embassy in Beijing or Shanghai. Process takes 4-6 weeks.', additionalVisaDoc:'APS Certificate (mandatory for all Chinese applicants)' },
  'Pakistan': { anabinStatus:'Recognised (H+)', anabinNote:'Pakistani degrees are generally recognised. HEC-attested documents required. Some universities may request additional verification.', visaEmbassy:'German Embassy Islamabad; Consulate in Karachi', visaTimeline:'8-12 weeks', documentsNote:'HEC (Higher Education Commission) attestation required for all academic documents, then Foreign Ministry attestation.', additionalVisaDoc:'HEC-attested transcripts and degree certificate' },
  'Egypt': { anabinStatus:'Recognised (H+)', anabinNote:'Egyptian university degrees are recognised. Documents must be notarised and translated. Al-Azhar University has specific recognition procedures.', visaEmbassy:'German Embassy Cairo', visaTimeline:'6-8 weeks', documentsNote:'Notarisation by Egyptian Ministry of Foreign Affairs and Ministry of Higher Education required.', additionalVisaDoc:'Ministry-notarised and translated transcripts' },
  'Nigeria': { anabinStatus:'Recognised (H+)', anabinNote:'Nigerian degrees are recognised. NYSC discharge/exemption certificate required in addition to academic documents.', visaEmbassy:'German Embassy Abuja; Consulate General Lagos', visaTimeline:'8-12 weeks', documentsNote:'NYSC (National Youth Service Corps) discharge or exemption certificate required.', additionalVisaDoc:'NYSC Discharge/Exemption Certificate' },
  'Turkey': { anabinStatus:'Recognised (H+)', anabinNote:'Turkish degrees are well-recognised in Germany. Apostille stamp from Turkish authorities required on all documents.', visaEmbassy:'German Embassy Ankara; Consulates in Istanbul, Izmir', visaTimeline:'4-6 weeks', documentsNote:'Turkish documents require Apostille stamp from Turkish Ministry of Foreign Affairs.', additionalVisaDoc:'Apostille-stamped academic documents' },
  'Iran': { anabinStatus:'Recognised (H)', anabinNote:'Iranian university degrees are generally recognised. Check the specific institution on Anabin database. Translation into German by a sworn translator is mandatory.', visaEmbassy:'German Embassy Tehran', visaTimeline:'8-16 weeks', documentsNote:'All documents must be notarised by Iranian Ministry of Foreign Affairs and then translated by a sworn German translator.', additionalVisaDoc:'Ministry of Foreign Affairs notarised documents' },
  'Morocco': { anabinStatus:'Recognised (H+)', anabinNote:'Moroccan degrees are recognised. University transcripts must bear the original university seal and be translated into German or French.', visaEmbassy:'German Embassy Rabat; Consulate Casablanca', visaTimeline:'6-10 weeks', documentsNote:'Documents legalised by the Moroccan Ministry of Foreign Affairs required.', additionalVisaDoc:'Legalised academic transcripts' },
  'Bangladesh': { anabinStatus:'Recognised (H+)', anabinNote:'Bangladeshi degrees are recognised. Documents must be attested by the Ministry of Education and Ministry of Foreign Affairs.', visaEmbassy:'German Embassy Dhaka', visaTimeline:'8-12 weeks', documentsNote:'Attestation by Board of Education and Ministry of Foreign Affairs required.', additionalVisaDoc:'Ministry of Foreign Affairs attested transcripts' },
  'Indonesia': { anabinStatus:'Recognised (H+)', anabinNote:'Indonesian degrees from accredited universities are recognised. BAN-PT accreditation letter of your university is recommended.', visaEmbassy:'German Embassy Jakarta', visaTimeline:'6-8 weeks', documentsNote:'Documents legalised by the Indonesian Ministry of Foreign Affairs required.', additionalVisaDoc:'Legalized documents from Ministry of Foreign Affairs' },
  'Vietnam': { anabinStatus:'Recognised (H+)', anabinNote:'Vietnamese degrees are recognised. All documents must be notarised, translated, and apostilled by the Ministry of Foreign Affairs.', visaEmbassy:'German Embassy Hanoi; Consulate Ho Chi Minh City', visaTimeline:'6-8 weeks', documentsNote:'Documents require notarisation and authentication by Ministry of Foreign Affairs before translation.', additionalVisaDoc:'Apostilled and notarised documents' },
  'Ukraine': { anabinStatus:'Recognised (H+)', anabinNote:'Ukrainian degrees are generally well-recognised in Germany. Given current circumstances, simplified procedures may apply in some German states.', visaEmbassy:'German Embassy Kyiv (check current status); process may be handled via neighbouring EU consulates', visaTimeline:'4-8 weeks', documentsNote:'Documents require official Ukrainian notarisation and apostille where available.', additionalVisaDoc:'Apostilled academic documents' },
  'Brazil': { anabinStatus:'Recognised (H+)', anabinNote:'Brazilian degrees are recognised. Apostille from a Brazilian Notary (Cartorio) required.', visaEmbassy:'German Embassy Brasilia; Consulates in Sao Paulo, Rio de Janeiro, Porto Alegre, Recife', visaTimeline:'4-6 weeks', documentsNote:'Apostille (Hague Convention) from a registered Brazilian Cartorio on academic documents.', additionalVisaDoc:'Apostilled transcripts and degree' },
  'Saudi Arabia': { anabinStatus:'Recognised (H+)', anabinNote:'Saudi degrees are recognised. Ministry of Education attestation followed by Ministry of Foreign Affairs required.', visaEmbassy:'German Embassy Riyadh; Consulate in Jeddah', visaTimeline:'6-8 weeks', documentsNote:'Saudi Ministry of Education attestation, then Ministry of Foreign Affairs legalisation required.', additionalVisaDoc:'MoE and MoFA legalised documents' },
  'Jordan': { anabinStatus:'Recognised (H+)', anabinNote:'Jordanian degrees are recognised. Ministry of Higher Education and Ministry of Foreign Affairs attestation required.', visaEmbassy:'German Embassy Amman', visaTimeline:'6-8 weeks', documentsNote:'Ministry of Higher Education attestation followed by Ministry of Foreign Affairs legalisation required.', additionalVisaDoc:'MoHE and MoFA attested transcripts' },
  'Syria': { anabinStatus:'Recognised (H) - Documentation Challenges', anabinNote:'Syrian degrees are generally recognised, but obtaining certified documents may be challenging. German authorities understand this - contact the German embassy early.', visaEmbassy:'German Embassy Beirut (Lebanon) for most Syrian applicants', visaTimeline:'8-16 weeks', documentsNote:'Contact the German embassy early - special procedures exist for applicants unable to obtain standard documents.', additionalVisaDoc:'Any available academic records; sworn declaration if originals unavailable' },
  'Iraq': { anabinStatus:'Recognised (H)', anabinNote:'Iraqi degrees are generally recognised. Documents must be legalised by the Ministry of Higher Education and Ministry of Foreign Affairs.', visaEmbassy:'German Embassy Baghdad; Consulate Erbil', visaTimeline:'10-16 weeks', documentsNote:'Ministry of Higher Education and Scientific Research legalisation, then Ministry of Foreign Affairs attestation required.', additionalVisaDoc:'Ministry of Higher Education legalised documents' },
};
const DEFAULT_COUNTRY_DATA = { anabinStatus:'Generally Recognised', anabinNote:'Verify your specific institution recognition status at anabin.kmk.org. Contact your nearest German embassy for country-specific document requirements.', visaEmbassy:'Contact the nearest German Embassy or Consulate in your country', visaTimeline:'4-8 weeks', documentsNote:'Certified translations of all academic documents required. Official apostille or legalisation required from your country Ministry of Foreign Affairs.', additionalVisaDoc:'Country-specific attestation/apostille as required by German embassy' };
function getCountryData(country) { return COUNTRY_DATA_MAP[country] || DEFAULT_COUNTRY_DATA; }

// ---- GRADE CONVERSION ----
function getGradeConversion(grade) {
  const map = {
    excellent:     { german:'1.0 - 1.5', explanation:'Excellent grades convert to the top of the German 1.0-4.0 GPA scale (sehr gut = very good). German universities use an inverse scale where 1.0 is the highest. You are competitive for even the most selective programs.' },
    very_good:     { german:'1.5 - 2.0', explanation:'Very good grades convert to a strong position on the German scale (gut = good). You are competitive for most universities and selective programs.' },
    good:          { german:'2.0 - 2.5', explanation:'Good grades convert to a solid mid-range on the German scale (befriedigend = satisfactory). You qualify for most programs. Focus on universities with realistic entry requirements.' },
    average:       { german:'2.5 - 3.0', explanation:'Average grades place you in the lower-mid range on the German scale. Consider applied sciences universities (Fachhochschulen) which often have more flexible entry requirements.' },
    below_average: { german:'3.0 - 4.0', explanation:'Below average grades may require a Studienkolleg (preparatory college) in Germany. This is a 1-year course that prepares you for German university standards before direct admission.' },
  };
  return map[grade] || { german:'N/A', explanation:'Grade not specified.' };
}

// ---- DEGREE LEVEL DOCUMENT REQUIREMENTS ----
const DOC_REQUIREMENTS = {
  bachelor: [
    { id:'school_cert',  label:'School Leaving Certificate', status:'Required',    hint:'High school diploma, A-levels, or equivalent' },
    { id:'transcript',   label:'Transcript of Records',      status:'Required',    hint:'Official academic record with all grades' },
    { id:'lang_cert',    label:'Language Certificate',       status:'Required',    hint:'IELTS, TOEFL, TestDaF, or Goethe certificate' },
    { id:'cv',           label:'CV / Resume',                status:'Optional',    hint:'Recommended for competitive programs' },
  ],
  master: [
    { id:'bachelor_cert',       label:'Bachelor Degree Certificate', status:'Required',    hint:'Official degree certificate with university seal' },
    { id:'bachelor_transcript', label:'Bachelor Transcript',         status:'Required',    hint:'Full record of all modules and grades' },
    { id:'lang_cert',           label:'Language Certificate',        status:'Required',    hint:'IELTS, TOEFL, TestDaF, or Goethe certificate' },
    { id:'cv',                  label:'CV / Resume',                 status:'Recommended', hint:'Strongly recommended for Master programs' },
    { id:'research_proposal',   label:'Research Proposal',          status:'Optional',    hint:'Required for some research-oriented programs' },
  ],
  phd: [
    { id:'master_cert',       label:'Master Degree Certificate',    status:'Required',    hint:'Official master degree certificate' },
    { id:'master_transcript', label:'Master Transcript',            status:'Required',    hint:'Full record of master modules and grades' },
    { id:'research_proposal', label:'Research Proposal (Expose)',   status:'Required',    hint:'5-15 pages outlining your research plan' },
    { id:'lang_cert',         label:'Language Certificate',         status:'Required',    hint:'IELTS, TOEFL, TestDaF, or Goethe certificate' },
    { id:'cv',                label:'Academic CV',                  status:'Required',    hint:'Include publications and research experience' },
    { id:'recommendation',    label:'Recommendation Letters (2x)', status:'Recommended', hint:'From academic supervisors or professors' },
  ],
};

// ---- DEGREE LEVEL STATE & DOC CARD RENDERING ----
let currentDegreeLevel = 'bachelor';
const uploadedFiles = {};

function renderDocCards(level) {
  const grid = document.getElementById('docCardsGrid');
  const docs = DOC_REQUIREMENTS[level] || [];
  grid.innerHTML = docs.map(doc => `
    <div class="doc-card ${uploadedFiles[doc.id] ? 'doc-card-done' : ''}" id="card-${doc.id}">
      <div class="doc-card-body">
        <div class="doc-text">
          <div class="doc-name">${doc.label}</div>
          <div class="doc-hint">${doc.hint}</div>
        </div>
        <div class="doc-right">
          <span class="doc-badge badge-${doc.status.toLowerCase().replace(' ','-')}">${doc.status}</span>
          <div class="doc-action" id="action-${doc.id}">
            ${uploadedFiles[doc.id]
              ? `<div class="doc-success-state">
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="rgba(34,197,94,0.15)" stroke="#22c55e" stroke-width="1.5"/><path d="M7 12l4 4 6-7" stroke="#22c55e" stroke-width="2" stroke-linecap="round"/></svg>
                   <span class="doc-filename">${uploadedFiles[doc.id].name}</span>
                   <button class="doc-remove-btn" onclick="removeDoc('${doc.id}')">Remove</button>
                 </div>`
              : `<button class="btn-upload-doc" onclick="triggerDocUpload('${doc.id}')">
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                   Upload
                 </button>`
            }
          </div>
        </div>
      </div>
      <input type="file" id="file-${doc.id}" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" style="display:none" onchange="handleDocFile('${doc.id}', this)" />
    </div>
  `).join('');
}

function triggerDocUpload(docId) { document.getElementById(`file-${docId}`).click(); }

function handleDocFile(docId, input) {
  if (!input.files[0]) return;
  const file = input.files[0];
  if (file.size > 10 * 1024 * 1024) { showToast('File too large. Maximum 10MB.', 'error'); return; }
  uploadedFiles[docId] = file;
  renderDocCards(currentDegreeLevel);
}

window.removeDoc = function(docId) {
  delete uploadedFiles[docId];
  const inp = document.getElementById(`file-${docId}`);
  if (inp) inp.value = '';
  renderDocCards(currentDegreeLevel);
};

// Degree tab switching
document.getElementById('degreeTabs').addEventListener('click', (e) => {
  const btn = e.target.closest('.degree-tab');
  if (!btn) return;
  document.querySelectorAll('.degree-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  currentDegreeLevel = btn.dataset.level;
  Object.keys(uploadedFiles).forEach(k => delete uploadedFiles[k]);
  renderDocCards(currentDegreeLevel);
});

// Initial render
renderDocCards('bachelor');

// ---- UNIVERSITY DATABASE ----
const UNIVERSITIES = [
  {
    name: 'TU Munich', city: 'Munich, Bavaria',
    fields: ['Computer Science / IT','Engineering (Mechanical / Electrical / Civil)','Natural Sciences (Physics / Chemistry / Biology)','Mathematics / Statistics'],
    german: ['b2','c1','c2'], english: ['b2','c1','c2','native'],
    grades: ['excellent','very_good','good'],
    tags: ['Research Excellence','Top 1%','Global Ranking'],
    levels: ['bachelor','master','phd'],
    tuition: 'Free (EUR 144 semester fee)',
    minGrade: '2.5 (German scale)',
    programs: ['Informatics (B.Sc.)','Informatics (M.Sc.)','Electrical Engineering (B.Sc.)','Mechanical Engineering (B.Sc.)','Data Engineering and Analytics (M.Sc.)','Computational Science and Engineering (M.Sc.)','Finance and Information Management (M.Sc.)'],
    applyUrl: 'tum.de/en/studies/application',
    intake: 'Winter (Oct) and Summer (Apr)',
  },
  {
    name: 'LMU Munich', city: 'Munich, Bavaria',
    fields: ['Medicine / Health Sciences','Law','Social Sciences / Psychology','Natural Sciences (Physics / Chemistry / Biology)'],
    german: ['c1','c2'], english: ['b2','c1','c2','native'],
    grades: ['excellent','very_good'],
    tags: ['Nobel Laureates','Medical School','Historic'],
    levels: ['bachelor','master','phd'],
    tuition: 'Free (EUR 144 semester fee)',
    minGrade: '2.0 (German scale)',
    programs: ['Business Administration (B.Sc.)','Economics (M.Sc.)','Psychology (B.Sc.)','Law (Staatsexamen)','Medicine (Staatsexamen)','Biochemistry (B.Sc.)','Statistics and Data Science (M.Sc.)'],
    applyUrl: 'lmu.de/en/study/application',
    intake: 'Winter (Oct) and Summer (Apr)',
  },
  {
    name: 'Heidelberg University', city: 'Heidelberg, Baden-Wuerttemberg',
    fields: ['Medicine / Health Sciences','Natural Sciences (Physics / Chemistry / Biology)','Humanities / Arts'],
    german: ['b2','c1','c2'], english: ['b2','c1','c2','native'],
    grades: ['excellent','very_good','good'],
    tags: ["Germany's Oldest",'Research','Excellence'],
    levels: ['bachelor','master','phd'],
    tuition: 'Free (EUR 175 semester fee)',
    minGrade: '2.5 (German scale)',
    programs: ['Medical Biology (B.Sc.)','Medicine (Staatsexamen)','Biochemistry (B.Sc.)','Psychology (B.Sc.)','History of Arts (B.A.)','Molecular Biosciences (M.Sc.)','Applied Computer Science (M.Sc.)'],
    applyUrl: 'uni-heidelberg.de/en/study/application',
    intake: 'Winter (Oct) and Summer (Apr)',
  },
  {
    name: 'RWTH Aachen', city: 'Aachen, NRW',
    fields: ['Engineering (Mechanical / Electrical / Civil)','Computer Science / IT','Mathematics / Statistics'],
    german: ['b2','c1','c2'], english: ['b2','c1','c2','native'],
    grades: ['excellent','very_good','good'],
    tags: ['Engineering No.1','Industry Ties','Innovation'],
    levels: ['bachelor','master','phd'],
    tuition: 'Free (EUR 254 semester fee)',
    minGrade: '2.5 (German scale)',
    programs: ['Computer Science (B.Sc.)','Computer Science (M.Sc.)','Mechanical Engineering (B.Sc.)','Electrical Engineering (B.Sc.)','Industrial Engineering (M.Sc.)','Simulation Engineering (M.Sc.)','Mathematics (B.Sc.)'],
    applyUrl: 'rwth-aachen.de/go/id/einschreibung',
    intake: 'Winter (Oct) mainly',
  },
  {
    name: 'Freie Universitaet Berlin', city: 'Berlin',
    fields: ['Social Sciences / Psychology','Humanities / Arts','Law','Medicine / Health Sciences'],
    german: ['b2','c1','c2'], english: ['b1','b2','c1','c2','native'],
    grades: ['excellent','very_good','good','average'],
    tags: ['International','Research','Berlin'],
    levels: ['bachelor','master','phd'],
    tuition: 'Free (EUR 309 semester fee)',
    minGrade: '3.0 (German scale)',
    programs: ['Political Science (B.A.)','History (B.A.)','Law (Staatsexamen)','Psychology (B.Sc.)','Biochemistry (B.Sc.)','International Relations (M.A.)','North American Studies (M.A.)'],
    applyUrl: 'fu-berlin.de/en/studium/bewerbung',
    intake: 'Winter (Oct) and Summer (Apr)',
  },
  {
    name: 'Humboldt University Berlin', city: 'Berlin',
    fields: ['Natural Sciences (Physics / Chemistry / Biology)','Humanities / Arts','Social Sciences / Psychology'],
    german: ['b2','c1','c2'], english: ['b2','c1','c2','native'],
    grades: ['excellent','very_good','good'],
    tags: ['Historic','Research Excellence','Berlin'],
    levels: ['bachelor','master','phd'],
    tuition: 'Free (EUR 309 semester fee)',
    minGrade: '2.5 (German scale)',
    programs: ['Computer Science (B.Sc.)','Computer Science (M.Sc.)','Physics (B.Sc.)','Psychology (B.Sc.)','Economics (B.Sc.)','Biophysics (M.Sc.)','Statistics (M.Sc.)'],
    applyUrl: 'hu-berlin.de/en/studies/application',
    intake: 'Winter (Oct) and Summer (Apr)',
  },
  {
    name: 'University of Frankfurt', city: 'Frankfurt, Hesse',
    fields: ['Business Administration / Economics','Law','Social Sciences / Psychology'],
    german: ['b2','c1','c2'], english: ['b2','c1','c2','native'],
    grades: ['excellent','very_good','good','average'],
    tags: ['Finance Hub','Business','International'],
    levels: ['bachelor','master','phd'],
    tuition: 'Free (EUR 316 semester fee)',
    minGrade: '3.0 (German scale)',
    programs: ['Business Administration (B.Sc.)','Economics (B.Sc.)','Finance (M.Sc.)','Law (Staatsexamen)','Management (M.Sc.)','Money and Finance (M.Sc.)','Psychology (B.Sc.)'],
    applyUrl: 'uni-frankfurt.de/en/studying/application',
    intake: 'Winter (Oct) and Summer (Apr)',
  },
  {
    name: 'University of Hamburg', city: 'Hamburg',
    fields: ['Business Administration / Economics','Law','Natural Sciences (Physics / Chemistry / Biology)'],
    german: ['b2','c1','c2'], english: ['b1','b2','c1','native'],
    grades: ['excellent','very_good','good','average'],
    tags: ['Port City','International Trade','Research'],
    levels: ['bachelor','master','phd'],
    tuition: 'Free (EUR 345 semester fee)',
    minGrade: '3.0 (German scale)',
    programs: ['Business Administration (B.Sc.)','Economics (B.Sc.)','Computer Science (B.Sc.)','Law (Staatsexamen)','Biochemistry (B.Sc.)','Economics and Finance (M.Sc.)','Global Business Management (M.Sc.)'],
    applyUrl: 'uni-hamburg.de/en/studium/bewerbung',
    intake: 'Winter (Oct) and Summer (Apr)',
  },
  {
    name: 'KIT Karlsruhe', city: 'Karlsruhe, Baden-Wuerttemberg',
    fields: ['Engineering (Mechanical / Electrical / Civil)','Computer Science / IT','Architecture / Urban Planning'],
    german: ['b2','c1','c2'], english: ['b2','c1','c2','native'],
    grades: ['excellent','very_good','good'],
    tags: ['Tech Excellence','Engineering','Innovation'],
    levels: ['bachelor','master','phd'],
    tuition: 'Free (EUR 216 semester fee)',
    minGrade: '2.5 (German scale)',
    programs: ['Computer Science (B.Sc.)','Electrical Engineering (B.Sc.)','Mechanical Engineering (B.Sc.)','Architecture (B.Sc.)','Data Science and Engineering (M.Sc.)','Optics and Photonics (M.Sc.)','Industrial Engineering (M.Sc.)'],
    applyUrl: 'kit.edu/en/study/application.php',
    intake: 'Winter (Oct) mainly',
  },
  {
    name: 'TU Berlin', city: 'Berlin',
    fields: ['Computer Science / IT','Engineering (Mechanical / Electrical / Civil)','Architecture / Urban Planning','Mathematics / Statistics'],
    german: ['b2','c1','c2'], english: ['b1','b2','c1','c2','native'],
    grades: ['excellent','very_good','good','average'],
    tags: ['Tech','Berlin','International Students'],
    levels: ['bachelor','master','phd'],
    tuition: 'Free (EUR 307 semester fee)',
    minGrade: '3.0 (German scale)',
    programs: ['Computer Science (B.Sc.)','Computer Science (M.Sc.)','Business Informatics (M.Sc.)','Electrical Engineering (B.Sc.)','Urban and Regional Planning (M.Sc.)','Aerospace Engineering (M.Sc.)','Information Systems Management (M.Sc.)'],
    applyUrl: 'tu-berlin.de/studienbuero/bewerbung',
    intake: 'Winter (Oct) and Summer (Apr)',
  },
  {
    name: 'University of Cologne', city: 'Cologne, NRW',
    fields: ['Business Administration / Economics','Law','Medicine / Health Sciences','Social Sciences / Psychology'],
    german: ['b2','c1','c2'], english: ['b2','c1','c2','native'],
    grades: ['excellent','very_good','good','average'],
    tags: ['Large Campus','Business','Medicine'],
    levels: ['bachelor','master','phd'],
    tuition: 'Free (EUR 302 semester fee)',
    minGrade: '3.0 (German scale)',
    programs: ['Business Administration (B.Sc.)','Medicine (Staatsexamen)','Economics (B.Sc.)','Law (Staatsexamen)','Psychology (B.Sc.)','Social Sciences (B.A.)','Accounting and Finance (M.Sc.)'],
    applyUrl: 'uni-koeln.de/en/studying/application',
    intake: 'Winter (Oct) and Summer (Apr)',
  },
  {
    name: 'FAU Erlangen-Nuernberg', city: 'Erlangen, Bavaria',
    fields: ['Engineering (Mechanical / Electrical / Civil)','Medicine / Health Sciences','Computer Science / IT'],
    german: ['b2','c1','c2'], english: ['b2','c1','c2','native'],
    grades: ['excellent','very_good','good'],
    tags: ['Tech Industry','Siemens HQ Nearby','Engineering'],
    levels: ['bachelor','master','phd'],
    tuition: 'Free (EUR 144 semester fee)',
    minGrade: '2.5 (German scale)',
    programs: ['Computer Science (B.Sc.)','Electrical Engineering (B.Sc.)','Mechanical Engineering (B.Sc.)','Medicine (Staatsexamen)','Business and Economics (B.Sc.)','Data Science (M.Sc.)','Medical Engineering (M.Sc.)'],
    applyUrl: 'fau.de/en/education/application',
    intake: 'Winter (Oct) mainly',
  },
  {
    name: 'HTW Berlin', city: 'Berlin',
    fields: ['Engineering (Mechanical / Electrical / Civil)','Computer Science / IT','Business Administration / Economics','Architecture / Urban Planning'],
    german: ['b1','b2','c1'], english: ['b1','b2','c1','c2','native'],
    grades: ['excellent','very_good','good','average','below_average'],
    tags: ['Applied Sciences','Practical','International'],
    levels: ['bachelor','master'],
    tuition: 'Free (EUR 307 semester fee)',
    minGrade: '3.5 (German scale)',
    programs: ['Computer Science (B.Eng.)','Business Informatics (B.Sc.)','International Business (B.A.)','Engineering (B.Eng.)','Logistics (B.Eng.)','Game Design (B.A.)','Business Administration (M.A.)'],
    applyUrl: 'htw-berlin.de/studium/bewerbung',
    intake: 'Winter (Oct) and Summer (Apr)',
  },
  {
    name: 'Hochschule Muenchen (HM)', city: 'Munich, Bavaria',
    fields: ['Engineering (Mechanical / Electrical / Civil)','Computer Science / IT','Business Administration / Economics'],
    german: ['b2','c1','c2'], english: ['b1','b2','c1','c2','native'],
    grades: ['excellent','very_good','good','average'],
    tags: ['Applied Sciences','Munich','Industry Connections'],
    levels: ['bachelor','master'],
    tuition: 'Free (EUR 144 semester fee)',
    minGrade: '3.0 (German scale)',
    programs: ['Computer Science (B.Sc.)','Electrical Engineering (B.Eng.)','Mechanical Engineering (B.Eng.)','Business Administration (B.A.)','Industrial Engineering (B.Eng.)','Information Systems (M.Sc.)','International Management (M.A.)'],
    applyUrl: 'hm.edu/en/studying_and_teaching/application',
    intake: 'Winter (Oct) and Summer (Apr)',
  },
  {
    name: 'Jacobs University Bremen', city: 'Bremen (English-medium)',
    fields: ['Computer Science / IT','Engineering (Mechanical / Electrical / Civil)','Business Administration / Economics','Natural Sciences (Physics / Chemistry / Biology)'],
    german: ['none','a1','a2','b1','b2','c1','c2'], english: ['b2','c1','c2','native'],
    grades: ['excellent','very_good','good','average'],
    tags: ['100% English','International','Liberal Arts'],
    levels: ['bachelor','master'],
    tuition: 'EUR 15,000-20,000/year (scholarships available)',
    minGrade: '3.0 (German scale)',
    programs: ['Computer Science (B.Sc.)','Electrical and Computer Engineering (B.Sc.)','Business Administration (B.A.)','Biochemistry (B.Sc.)','Data Engineering (M.Sc.)','Applied Data Science (M.Sc.)','Global Economics (M.A.)'],
    applyUrl: 'constructor.university/admissions',
    intake: 'Winter (Sep) mainly',
  },
  {
    name: 'TH Wildau', city: 'Wildau, Brandenburg (near Berlin)',
    fields: ['Computer Science / IT','Engineering (Mechanical / Electrical / Civil)','Business Administration / Economics','Natural Sciences (Physics / Chemistry / Biology)'],
    german: ['b1','b2','c1'], english: ['b1','b2','c1','c2','native'],
    grades: ['excellent','very_good','good','average','below_average'],
    tags: ['Applied Sciences','Near Berlin','Practical'],
    levels: ['bachelor','master'],
    tuition: 'Free (EUR 260 semester fee)',
    minGrade: '3.5 (German scale)',
    programs: ['Computer Science (B.Sc.)','Logistics (B.Eng.)','Business Informatics (B.Sc.)','Bioinformatics (B.Sc.)','European Management (B.A.)','Industrial Engineering (B.Eng.)','AI and Data Science (M.Sc.)'],
    applyUrl: 'th-wildau.de/studium/bewerbung',
    intake: 'Winter (Oct) and Summer (Apr)',
  },
];

// ---- GRADE SCORE MAP ----
const GRADE_SCORE = { excellent:100, very_good:85, good:70, average:55, below_average:40 };

// ---- MATCH ALGORITHM ----
function matchUniversities(profile) {
  const engLevel = englishToLevel(profile.english);
  const fieldCat = resolveFieldCategory(profile.field);
  const level    = profile.degree || 'bachelor';

  return UNIVERSITIES
    .filter(uni => !uni.levels || uni.levels.includes(level))
    .map(uni => {
      let score = 0;
      if (uni.fields.includes(fieldCat) || uni.fields.includes(profile.field)) score += 40; else score += 5;
      if (uni.german.includes(profile.german)) score += 25;
      else if (profile.german === 'none' && uni.german.includes('none')) score += 25;
      else if (profile.german !== 'none') score += 10;
      if (uni.english.includes(engLevel)) score += 20;
      if (uni.grades.includes(profile.grade)) score += 15;
      return { ...uni, score: Math.min(score, 100) };
    })
    .filter(u => u.score >= 30)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

function getWhySuited(uni, profile) {
  const fieldCat = resolveFieldCategory(profile.field);
  const reasons = [];
  if (uni.fields.includes(fieldCat) || uni.fields.includes(profile.field)) reasons.push(`strong programs in ${profile.field}`);
  if (uni.grades.includes(profile.grade)) reasons.push('entry requirements match your grade');
  if (uni.german.includes(profile.german)) reasons.push(`accepts ${(profile.german||'').toUpperCase()} German level`);
  if (uni.tags.includes('100% English')) reasons.push('fully English-taught - no German required');
  if (uni.city.includes('Berlin')) reasons.push('vibrant international city with low cost of living');
  return reasons.length ? 'Suits you because it offers ' + reasons.join(', ') + '.' : 'Strong overall match for your academic profile.';
}

function getRelevantPrograms(uni, profile) {
  const field = profile.field.toLowerCase();
  const keywords = field.split(/[\s\/&,]+/).filter(w => w.length > 3);
  const relevant = (uni.programs || []).filter(p => keywords.some(kw => p.toLowerCase().includes(kw)));
  return relevant.length > 0 ? relevant.slice(0, 4) : (uni.programs || []).slice(0, 4);
}

// ---- CHECKLIST ----
function getPersonalChecklist(profile, countryData) {
  const level = profile.degree || 'bachelor';
  const items = [
    { category:'Documents', text: level === 'bachelor'
        ? `Obtain certified copies of your School Leaving Certificate and full transcript. ${countryData.documentsNote}`
        : level === 'master'
        ? `Obtain certified copies of your Bachelor Degree Certificate and transcript. ${countryData.documentsNote}`
        : `Obtain certified copies of your Master Degree Certificate, transcript, and research proposal. ${countryData.documentsNote}` },
    { category:'Translation', text:'Get all academic documents translated into German by a sworn translator (beeidigter Uebersetzer). Find one at bdue.de.' },
    { category:'Language', text: profile.german === 'none' || profile.german === 'a1'
        ? 'Enrol in a German language course immediately - you need at least B2 for German-taught programs. Try Goethe Institut or DW Learn German.'
        : `Confirm your German ${(profile.german||'').toUpperCase()} certificate is accepted. DSH or TestDaF may be required for admission.` },
    { category:'English', text: englishToLevel(profile.english) === 'none'
        ? 'Consider taking IELTS or TOEFL if applying to English-taught programs. IELTS 6.5 is the most widely accepted score.'
        : `Your ${formatEnglishShort(profile.english)} score should be sufficient. Keep the original certificate safe.` },
    { category:'Finances', text:'Open a German blocked account (Sperrkonto) with Fintiba or Expatrio. Deposit EUR 13,092. You will need the confirmation certificate for your visa.' },
    { category:'University', text:`Research your top 3-5 matched universities. Visit each university International Office page and confirm entry requirements for ${profile.field} at ${level} level.` },
    { category:'Application', text: level === 'phd'
        ? 'For PhD: Contact potential supervisors directly by email before applying. Attach your research proposal. Some universities require supervisor acceptance before formal application.'
        : 'Create an account on uni-assist.de (if applying to multiple universities). Check if your target universities use uni-assist or direct applications.' },
    { category:'Accommodation', text:'Apply for student dormitory (Studentenwohnheim) via the Studierendenwerk as soon as you receive your admission letter. Waiting lists can be very long.' },
    { category:'Health Insurance', text:'Arrange German public health insurance (gesetzliche Krankenversicherung) before arriving. TK Techniker Krankenkasse is recommended - EUR 120-130/month for students under 30.' },
    { category:'Visa', text:`Book your student visa appointment at the ${countryData.visaEmbassy} as early as possible. Expected processing time: ${countryData.visaTimeline}.` },
    { category:'Visa Docs', text:`Prepare visa documents: passport, admission letter, blocked account certificate (EUR 13,092), health insurance, photos, completed visa form, EUR 75 fee. ${countryData.additionalVisaDoc}.` },
    { category:'Arrival', text:'On arrival in Germany: register your address (Anmeldung) at the local Buergeramt within 14 days, enrol at university (Immatrikulation), activate health insurance, open a German bank account.' },
  ];
  return items;
}

function getCategoryColor(cat, C) {
  const map = { 'Documents':[99,102,241], 'Translation':[99,102,241], 'Language':[34,197,94], 'English':[34,197,94], 'Finances':[212,168,67], 'University':[212,168,67], 'Application':[240,201,102], 'Accommodation':[251,191,36], 'Health Insurance':[74,222,128], 'Visa':[239,68,68], 'Visa Docs':[239,68,68], 'Arrival':[167,139,250] };
  return map[cat] || C.muted;
}

// ---- NAVBAR SCROLL ----
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => { navbar.classList.toggle('scrolled', window.scrollY > 40); });

// ---- APP STATE ----
let currentProfile = {};
let matchedUnis = [];
let gateSubmitted = false;
let gateName = '';
let gateEmail = '';

// ---- LEAD GATE SUBMIT ----
document.getElementById('btnGateSubmit').addEventListener('click', async () => {
  const name  = document.getElementById('gateName').value.trim();
  const email = document.getElementById('gateEmail').value.trim();
  if (!name)                          { showToast('Please enter your name.', 'error'); return; }
  if (!email || !isValidEmail(email)) { showToast('Please enter a valid email.', 'error'); return; }

  gateName  = name;
  gateEmail = email;
  gateSubmitted = true;

  saveLeadToSupabase({ name, email });
  saveLead({ name, email, timestamp: new Date().toISOString() });

  document.getElementById('leadGate').style.display = 'none';
  document.getElementById('checkerContent').style.display = 'block';
  showToast('Welcome! Upload your documents and fill your details below.', 'success');
});

// ---- STEP 1: CHECK ELIGIBILITY ----
document.getElementById('btnCheck').addEventListener('click', () => {
  if (!gateSubmitted) {
    showToast('Please enter your name and email to continue.', 'error');
    document.getElementById('leadGate').scrollIntoView({ behavior: 'smooth' });
    return;
  }

  const country = document.getElementById('country').value;
  const grade   = document.getElementById('grade').value;
  const field   = document.getElementById('field').value;
  const german  = document.getElementById('german').value;
  const english = document.getElementById('english').value;

  if (!country || !grade || !field || !german || !english) {
    showToast('Please fill in all fields before continuing.', 'error'); return;
  }

  const docs = DOC_REQUIREMENTS[currentDegreeLevel] || [];
  const missing = docs.filter(d => d.status === 'Required' && !uploadedFiles[d.id]);
  if (missing.length > 0) {
    showToast('Please upload: ' + missing[0].label, 'error'); return;
  }

  currentProfile = { country, grade, field, german, english, degree: currentDegreeLevel, name: gateName, email: gateEmail };
  matchedUnis = matchUniversities(currentProfile);

  renderResults(gateName, matchedUnis);
  document.getElementById('checkerContent').style.display = 'none';
  document.getElementById('step-results').style.display = 'block';
  document.getElementById('step-results').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// ---- RENDER RESULTS ----
function renderResults(name, unis) {
  document.getElementById('resultName').textContent = name;
  document.getElementById('unisGrid').innerHTML = unis.map(u => `
    <div class="uni-card">
      <div class="uni-match-score">Match: ${u.score}%</div>
      <div class="uni-name">${u.name}</div>
      <div class="uni-city">${u.city}</div>
      <div class="uni-tags">${u.tags.map(t => `<span class="uni-tag">${t}</span>`).join('')}</div>
    </div>`).join('');
}

// ---- PDF DOWNLOAD ----
document.getElementById('btnDownloadPDF').addEventListener('click', () => generatePDF(currentProfile, matchedUnis));

// ================================================================
// PDF GENERATION - 9-PAGE PROFESSIONAL GUIDE (ASCII ONLY)
// ================================================================
function generatePDF(profile, unis) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, H = 297;

  // Color palette (RGB arrays)
  const BG    = [8,   11,  18];
  const CARD  = [14,  20,  32];
  const CARD2 = [18,  24,  38];
  const GOLD  = [212, 168, 67];
  const WHITE = [232, 234, 240];
  const MUTED = [122, 130, 153];
  const DIM   = [74,  81,  104];
  const GREEN = [34,  197, 94];
  const BLUE  = [99,  102, 241];

  const cd    = getCountryData(profile.country);
  const gc    = getGradeConversion(profile.grade);
  const check = getPersonalChecklist(profile, cd);
  const top5  = unis.slice(0, 5);
  const degreeLabel = { bachelor:"Bachelor's Degree", master:"Master's Degree", phd:"PhD / Doctorate" }[profile.degree] || "Bachelor's Degree";

  let pageNum = 0;

  // ---- HELPERS ----
  function bg() { doc.setFillColor(...BG); doc.rect(0, 0, W, H, 'F'); }

  function addPageHeader() {
    pageNum++;
    bg();
    doc.setFillColor(...CARD); doc.rect(0, 0, W, 12, 'F');
    doc.setFillColor(...GOLD); doc.rect(0, 12, W, 0.5, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...GOLD);
    doc.text('StudyPathDE', 10, 8.5);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...MUTED);
    doc.text('Personalised for ' + profile.name + ' | ' + profile.country, W / 2, 8.5, { align: 'center' });
    doc.text('Page ' + pageNum, W - 10, 8.5, { align: 'right' });
    return 22;
  }

  function newPage() { doc.addPage(); return addPageHeader(); }

  function sectionHeader(title, y) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(...GOLD);
    doc.text(title, 10, y);
    doc.setFillColor(...GOLD); doc.rect(10, y + 2.5, W - 20, 0.5, 'F');
    return y + 10;
  }

  function accentCard(x, y, w, h, accent) {
    doc.setFillColor(...CARD); doc.roundedRect(x, y, w, h, 2, 2, 'F');
    doc.setFillColor(...accent); doc.rect(x, y, 3, h, 'F');
  }

  function solidCard(x, y, w, h, borderCol) {
    doc.setFillColor(...CARD); doc.roundedRect(x, y, w, h, 2, 2, 'F');
    if (borderCol) {
      doc.setDrawColor(...borderCol); doc.setLineWidth(0.4);
      doc.roundedRect(x, y, w, h, 2, 2, 'S');
    }
  }

  function wrapText(text, x, y, maxW, size, color, bold) {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size); doc.setTextColor(...color);
    const lines = doc.splitTextToSize(String(text), maxW);
    doc.text(lines, x, y);
    return y + lines.length * (size * 0.42 + 0.5);
  }

  // ================================================================
  // PAGE 1 - COVER
  // ================================================================
  pageNum++;
  bg();
  // Gold accent top bar
  doc.setFillColor(...GOLD); doc.rect(0, 0, W, 4, 'F');
  // Left accent strip
  doc.setFillColor(...CARD); doc.rect(0, 4, 4, H - 4, 'F');

  // Brand header
  doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(...GOLD);
  doc.text('StudyPathDE', 18, 26);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...MUTED);
  doc.text('AI-Powered German University Matching', 18, 34);
  doc.setFillColor(...GOLD); doc.rect(18, 38, W - 28, 0.4, 'F');

  // Guide for label
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...MUTED);
  doc.text('PERSONALISED GUIDE FOR', 18, 54);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(28); doc.setTextColor(...WHITE);
  doc.text(profile.name, 18, 68);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(12); doc.setTextColor(...GOLD);
  doc.text(profile.field + '  |  ' + degreeLabel, 18, 78);

  // Info cards
  const cards = [
    { label:'COUNTRY', val: profile.country },
    { label:'GRADE',   val: formatGrade(profile.grade).split(' (')[0] },
    { label:'GERMAN',  val: (profile.german || 'None').toUpperCase() },
    { label:'ENGLISH', val: formatEnglishShort(profile.english) },
    { label:'DEGREE',  val: degreeLabel.split("'")[0] + 's' },
  ];
  cards.forEach((c, i) => {
    const cx = 18 + i * 37;
    solidCard(cx, 88, 33, 20, GOLD);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5); doc.setTextColor(...MUTED);
    doc.text(c.label, cx + 3, 94);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...WHITE);
    const v = c.val.length > 14 ? c.val.slice(0, 12) + '..' : c.val;
    doc.text(v, cx + 3, 102);
  });

  // Date
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...DIM);
  doc.text('Generated: ' + new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' }), 18, 120);

  // Table of contents
  solidCard(18, 128, W - 36, 78, GOLD);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...GOLD);
  doc.text('CONTENTS', 26, 137);
  const toc = [
    ['01', 'Eligibility Summary',              'Page 2'],
    ['02', 'Your Matched Universities (Top 5)','Page 3'],
    ['03', 'Step-by-Step Application Guide',   'Page 4'],
    ['04', 'Blocked Account Guide - EUR 13,092','Page 5'],
    ['05', 'Visa Application Guide',            'Page 6'],
    ['06', 'Living in Germany - 2025 Costs',    'Page 7'],
    ['07', 'Your Personal Checklist (12 items)','Page 8'],
    ['08', 'Next Steps & Admission Service',    'Page 9'],
  ];
  toc.forEach(([n, t, p], i) => {
    const ty = 145 + i * 8;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...GOLD); doc.text(n, 26, ty);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...WHITE); doc.text(t, 36, ty);
    doc.setTextColor(...MUTED); doc.text(p, W - 26, ty, { align:'right' });
    if (i < toc.length - 1) { doc.setDrawColor(...DIM); doc.setLineWidth(0.1); doc.line(26, ty + 2, W - 26, ty + 2); }
  });

  // Disclaimer
  doc.setFont('helvetica', 'italic'); doc.setFontSize(7); doc.setTextColor(...DIM);
  doc.text('This guide is personalised based on your submitted profile. Information is accurate as of the generation date.', W / 2, H - 16, { align:'center' });

  // Cover page footer
  doc.setFillColor(...CARD); doc.rect(0, H - 11, W, 11, 'F');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...MUTED);
  doc.text('StudyPathDE  |  studypathde.com', 10, H - 4.5);
  doc.text('Page 1', W - 10, H - 4.5, { align:'right' });
  doc.setTextColor(...GOLD);
  doc.text('Personalised for ' + profile.name + '  |  ' + profile.country, W / 2, H - 4.5, { align:'center' });

  // ================================================================
  // PAGE 2 - ELIGIBILITY SUMMARY
  // ================================================================
  let y = newPage();
  y = sectionHeader('Section 1: Eligibility Summary', y);

  // Anabin card
  accentCard(10, y, W - 20, 32, GREEN);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...GREEN);
  doc.text('ANABIN RECOGNITION STATUS', 17, y + 7);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...WHITE);
  doc.text(cd.anabinStatus, 17, y + 16);
  const anLines = doc.splitTextToSize(cd.anabinNote, W - 36);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUTED);
  doc.text(anLines.slice(0, 2), 17, y + 23);
  y += 38;

  // Grade conversion card
  accentCard(10, y, W - 20, 40, GOLD);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...GOLD);
  doc.text('GRADE CONVERSION TO GERMAN SCALE  (1.0 = best  |  4.0 = minimum pass)', 17, y + 7);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(...WHITE);
  doc.text(gc.german, 17, y + 20);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUTED);
  doc.text('German GPA equivalent', 52, y + 20);
  const gcLines = doc.splitTextToSize(gc.explanation, W - 36);
  doc.text(gcLines.slice(0, 2), 17, y + 28);
  y += 47;

  // Language cards
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...WHITE);
  doc.text('Language Assessment', 10, y); y += 6;
  const langCards = [
    { title:'GERMAN LEVEL', val:(profile.german||'None').toUpperCase(), note:getGermanNote(profile.german) },
    { title:'ENGLISH LEVEL', val:formatEnglishShort(profile.english),   note:getEnglishNote(profile.english) },
  ];
  langCards.forEach((lc, i) => {
    const lx = 10 + i * 98;
    solidCard(lx, y, 90, 28, null);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...MUTED);
    doc.text(lc.title, lx + 5, y + 7);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...GOLD);
    doc.text(lc.val, lx + 5, y + 16);
    const nLines = doc.splitTextToSize(lc.note, 80);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...MUTED);
    doc.text(nLines.slice(0, 2), lx + 5, y + 22);
  });
  y += 36;

  // Eligibility verdict
  const eligible = ['excellent','very_good','good'].includes(profile.grade);
  doc.setFillColor(eligible ? 10 : 20, eligible ? 26 : 18, eligible ? 18 : 10);
  doc.roundedRect(10, y, W - 20, 20, 2, 2, 'F');
  doc.setDrawColor(...(eligible ? GREEN : [251,191,36])); doc.setLineWidth(0.4);
  doc.roundedRect(10, y, W - 20, 20, 2, 2, 'S');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
  doc.setTextColor(...(eligible ? GREEN : [251,191,36]));
  doc.text(eligible ? '[OK]  You are eligible to apply to German universities' : '[!]   Additional preparation may be recommended', 17, y + 8);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUTED);
  doc.text(eligible ? 'Your academic profile meets core entry requirements at multiple German institutions.' : 'Consider a Studienkolleg (preparatory college) if direct admission is not possible.', 17, y + 15);

  // ================================================================
  // PAGE 3 - MATCHED UNIVERSITIES
  // ================================================================
  y = newPage();
  y = sectionHeader('Section 2: Your Matched Universities', y);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...MUTED);
  doc.text('Based on: ' + profile.country + ' | ' + formatGrade(profile.grade).split(' (')[0] + ' | ' + profile.field + ' | ' + degreeLabel, 10, y);
  y += 8;

  top5.forEach((uni, i) => {
    if (y > 244) { y = newPage(); }
    const programs = getRelevantPrograms(uni, profile);
    const progText = programs.join('  /  ');
    const progLines = doc.splitTextToSize(progText, W - 52);
    const cH = 44 + Math.max(0, progLines.length - 1) * 4;

    solidCard(10, y, W - 20, cH, null);

    // Score bar at bottom
    doc.setFillColor(...CARD2); doc.rect(10, y + cH - 2, W - 20, 2, 'F');
    doc.setFillColor(...GOLD);  doc.rect(10, y + cH - 2, (W - 20) * uni.score / 100, 2, 'F');

    // Rank badge
    doc.setFillColor(...GOLD); doc.circle(21, y + 16, 6, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...BG);
    doc.text(String(i + 1), 21, y + 18.5, { align:'center' });

    // Name
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(...WHITE);
    doc.text(uni.name, 31, y + 9);

    // City + match score
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUTED);
    doc.text('Location: ' + uni.city, 31, y + 16);

    // Score badge
    doc.setFillColor(...GOLD); doc.roundedRect(W - 44, y + 3, 30, 11, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...BG);
    doc.text('Score: ' + uni.score + '%', W - 29, y + 10.5, { align:'center' });

    // Why suited
    doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5); doc.setTextColor(...MUTED);
    const whyLines = doc.splitTextToSize(getWhySuited(uni, profile), W - 52);
    doc.text(whyLines.slice(0, 1), 31, y + 23);

    // Programs
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...GOLD);
    doc.text('Programs: ', 31, y + 30);
    doc.setTextColor(...DIM);
    doc.text(progLines, 50, y + 30);

    // Min grade, tuition, intake
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(...DIM);
    const details = 'Min grade: ' + uni.minGrade + '   |   Tuition: ' + uni.tuition + '   |   Intake: ' + uni.intake;
    const detLines = doc.splitTextToSize(details, W - 36);
    doc.text(detLines.slice(0, 1), 31, y + cH - 7);

    // Apply URL
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...GOLD);
    doc.text('Apply: ' + uni.applyUrl, 31, y + cH - 3);

    y += cH + 4;
  });

  // ================================================================
  // PAGE 4 - APPLICATION GUIDE
  // ================================================================
  y = newPage();
  y = sectionHeader('Section 3: Step-by-Step Application Guide', y);

  const appSteps = [
    { n:'01', title:'Prepare Your Documents', body:'For ' + profile.degree + ' applicants from ' + profile.country + ': ' + (profile.degree === 'bachelor' ? 'School Leaving Certificate, transcript, language certificate.' : profile.degree === 'master' ? 'Bachelor degree certificate, full transcript, language certificate, CV.' : 'Master degree certificate, transcript, research proposal (expose), academic CV, 2 recommendation letters.') + ' All documents must be certified. ' + cd.documentsNote },
    { n:'02', title:'Register on uni-assist.de', body:'uni-assist is the central application portal used by 190+ German universities for international applicants. Create a free account at uni-assist.de. Upload your certified documents. Processing fee: EUR 75 for the first university, EUR 30 for each additional. uni-assist verifies documents against the Anabin database.' },
    { n:'03', title:'Check Direct Applications', body:'Not all universities use uni-assist. TU Munich, LMU Munich, RWTH Aachen, and some others have their own portals. Always check the university International Admissions page directly to confirm the correct application channel before paying any fees.' },
    { n:'04', title:'Application Deadlines', body:'Winter Semester (starts October): Deadline 15 July. Summer Semester (starts April): Deadline 15 January. These are typical dates - some programs have earlier internal deadlines. Always verify directly with the university website. PhD applications may be accepted year-round.' },
    { n:'05', title:'After Application - What to Expect', body:'Processing takes 4-8 weeks. If accepted, you receive a Zulassungsbescheid (admission letter). Enrol (immatrikulieren) before the stated deadline. Pay the semester fee (typically EUR 130-310, includes public transport pass in most cities).' },
  ];
  appSteps.forEach((step) => {
    if (y > 256) { y = newPage(); }
    doc.setFillColor(...GOLD); doc.roundedRect(10, y, 13, 8, 1, 1, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...BG);
    doc.text(step.n, 16.5, y + 5.5, { align:'center' });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...WHITE);
    doc.text(step.title, 27, y + 5.5);
    y += 10;
    const bLines = doc.splitTextToSize(step.body, W - 22);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...MUTED);
    doc.text(bLines, 14, y);
    y += bLines.length * 4.3 + 6;
  });

  // ================================================================
  // PAGE 5 - BLOCKED ACCOUNT
  // ================================================================
  y = newPage();
  y = sectionHeader('Section 4: Blocked Account Guide', y);

  // Amount hero card
  solidCard(10, y, W - 20, 30, GOLD);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(30); doc.setTextColor(...GOLD);
  doc.text('EUR 13,092', W / 2, y + 14, { align:'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUTED);
  doc.text('Required for one year  |  EUR 1,091 released to you monthly after arrival  (updated 2025)', W / 2, y + 22, { align:'center' });
  y += 36;

  // What is it
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...WHITE);
  doc.text('What is a Blocked Account?', 10, y); y += 5;
  const baText = 'A Sperrkonto (blocked account) is a special German bank account required for your student visa. You deposit EUR 13,092 which is frozen until you arrive in Germany, then released to you as EUR 1,091 per month. This proves to the German embassy that you can financially support yourself for one full year of study.';
  const baLines = doc.splitTextToSize(baText, W - 20);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...MUTED);
  doc.text(baLines, 10, y); y += baLines.length * 4.3 + 8;

  // Provider comparison table
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...WHITE);
  doc.text('Provider Comparison', 10, y); y += 6;

  // Table header
  doc.setFillColor(...CARD); doc.rect(10, y, W - 20, 9, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...MUTED);
  [['PROVIDER', 14], ['SETUP FEE', 58], ['MONTHLY FEE', 100], ['PROCESSING', 136], ['RATING', W - 28]].forEach(([h, x]) => {
    doc.text(h, x, y + 6.5, h === 'RATING' ? { align:'right' } : undefined);
  });
  y += 9;

  const providers = [
    { name:'Fintiba',  fee:'EUR 89',  monthly:'EUR 4.90', time:'2-5 days',  rec:true  },
    { name:'Expatrio', fee:'EUR 69',  monthly:'EUR 4.90', time:'1-3 days',  rec:false },
    { name:'Coracle',  fee:'EUR 99',  monthly:'EUR 4.90', time:'3-7 days',  rec:false },
  ];
  providers.forEach((p) => {
    if (p.rec) { doc.setFillColor(16, 24, 36); } else { doc.setFillColor(...CARD2); }
    doc.rect(10, y, W - 20, 10, 'F');
    if (p.rec) { doc.setDrawColor(...GOLD); doc.setLineWidth(0.3); doc.rect(10, y, W - 20, 10, 'S'); }
    doc.setFont('helvetica', p.rec ? 'bold' : 'normal'); doc.setFontSize(8.5);
    doc.setTextColor(...(p.rec ? GOLD : WHITE)); doc.text(p.name, 14, y + 7);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...MUTED);
    doc.text(p.fee, 58, y + 7);
    doc.text(p.monthly, 100, y + 7);
    doc.text(p.time, 136, y + 7);
    if (p.rec) {
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...GREEN);
      doc.text('RECOMMENDED', W - 14, y + 7, { align:'right' });
    }
    y += 10;
  });
  y += 6;

  // Steps
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...WHITE);
  doc.text('How to Open Your Blocked Account (Fintiba)', 10, y); y += 6;
  const bSteps = [
    'Visit fintiba.com and click "Open Blocked Account".',
    'Complete identity verification (KYC) with your passport - takes approximately 5 minutes.',
    'Receive your IBAN and account details by email within 2-5 business days.',
    'Transfer EUR 13,092 from your home bank account to the Fintiba IBAN provided.',
    'Fintiba sends you a confirmation certificate once funds are received and verified.',
    'Include this confirmation certificate in your student visa application documents.',
    'After arriving in Germany and visa activation: EUR 1,091 is released to you each month.',
  ];
  bSteps.forEach((s, i) => {
    if (y > 272) { y = newPage(); }
    doc.setFillColor(...GOLD); doc.circle(15, y + 3, 3, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...BG);
    doc.text(String(i + 1), 15, y + 5.2, { align:'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...WHITE);
    doc.text(s, 21, y + 5);
    y += 8;
  });

  // ================================================================
  // PAGE 6 - VISA GUIDE
  // ================================================================
  y = newPage();
  y = sectionHeader('Section 5: Visa Application Guide', y);

  // Embassy card
  accentCard(10, y, W - 20, 22, BLUE);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...WHITE);
  doc.text('German Embassy / Consulate for ' + profile.country, 17, y + 8);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...MUTED);
  const emLines = doc.splitTextToSize(cd.visaEmbassy, W - 34);
  doc.text(emLines.slice(0, 1), 17, y + 16);
  y += 28;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...GOLD);
  doc.text('Visa Type Required: National Visa (Type D) - Student Visa', 10, y); y += 6;
  const visaIntro = 'You must apply for a National Visa (Nationales Visum), NOT a Schengen tourist visa. The National Visa Type D is specifically for long-term study in Germany. It allows you to stay and can be extended to a residence permit after arrival.';
  const viLines = doc.splitTextToSize(visaIntro, W - 20);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...MUTED);
  doc.text(viLines, 10, y); y += viLines.length * 4.3 + 8;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...WHITE);
  doc.text('Required Documents Checklist', 10, y); y += 6;
  const visaDocs = [
    'Valid passport (minimum 6 months validity beyond intended stay)',
    'University admission letter (Zulassungsbescheid)',
    'Blocked account certificate - Fintiba or Expatrio (EUR 13,092)',
    'Health insurance covering Germany (travel insurance until arrival is acceptable)',
    'Biometric passport photos (35mm x 45mm)',
    'Proof of accommodation in Germany (for at least first months)',
    'Language certificate (German B2/C1 or English IELTS 6.5+ for English programs)',
    'Completed visa application form (download from embassy website)',
    'Visa application fee: EUR 75',
    cd.additionalVisaDoc,
  ];
  visaDocs.forEach((d) => {
    if (y > 274) { y = newPage(); }
    doc.setFillColor(...GOLD); doc.rect(10, y + 1.5, 2.5, 2.5, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...WHITE);
    doc.text(d, 16, y + 4);
    y += 7.5;
  });
  y += 4;

  if (y > 258) { y = newPage(); }
  accentCard(10, y, W - 20, 20, [251, 191, 36]);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(251, 191, 36);
  doc.text('Expected Timeline for ' + profile.country + ': ' + cd.visaTimeline, 17, y + 8);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...MUTED);
  doc.text('Book your visa appointment as early as possible - slots fill up 4-8 weeks in advance.', 17, y + 15);

  // ================================================================
  // PAGE 7 - LIVING IN GERMANY (2025)
  // ================================================================
  y = newPage();
  y = sectionHeader('Section 6: Living in Germany - 2025 Cost Guide', y);

  doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...WHITE);
  doc.text('Monthly Cost Estimates by City (EUR) - Updated 2025', 10, y); y += 6;

  const cols    = ['City', 'Rent (EUR)', 'Food (EUR)', 'Transport', 'Misc (EUR)', 'TOTAL (EUR)'];
  const costs2025 = [
    ['Berlin',    '750-1,300', '270-380', '~29-57',  '150-200', '1,200-1,940'],
    ['Munich',    '950-1,600', '300-400', '~29-57',  '160-260', '1,440-2,320'],
    ['Hamburg',   '850-1,400', '270-370', '~29-57',  '150-210', '1,300-2,040'],
    ['Frankfurt', '850-1,400', '280-380', '~29-87',  '150-210', '1,310-2,080'],
  ];
  const cW = (W - 20) / cols.length;

  doc.setFillColor(...CARD); doc.rect(10, y, W - 20, 9, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...MUTED);
  cols.forEach((c, i) => doc.text(c, 12 + i * cW, y + 6.5));
  y += 9;

  costs2025.forEach((row, ri) => {
    if (ri % 2 === 0) { doc.setFillColor(...CARD); } else { doc.setFillColor(...CARD2); }
    doc.rect(10, y, W - 20, 10, 'F');
    row.forEach((cell, i) => {
      doc.setFont('helvetica', i === 0 ? 'bold' : 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...(i === 0 ? GOLD : (i === 5 ? WHITE : MUTED)));
      doc.text(cell, 12 + i * cW, y + 7);
    });
    y += 10;
  });
  y += 6;

  doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5); doc.setTextColor(...DIM);
  doc.text('Note: Transport costs are low due to student Deutschlandticket (EUR 29/month) available in most states from 2024-2025.', 10, y);
  y += 10;

  // Accommodation tips
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...WHITE);
  doc.text('Accommodation Tips', 10, y); y += 6;
  const accTips = [
    'Studierendenwerk dormitory - cheapest option (EUR 200-450/month). Apply immediately after getting admission letter.',
    'WG - Wohngemeinschaft shared flat - most common for students (EUR 450-750/month including utilities).',
    'Find rooms on: WG-Gesucht.de, StudiBnB, Immoscout24.de, Wunderflats.com',
    'Always confirm if utilities (Nebenkosten) are included in rent before signing any contract.',
  ];
  accTips.forEach((tip) => {
    if (y > 266) { y = newPage(); }
    const tl = doc.splitTextToSize('- ' + tip, W - 20);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...MUTED);
    doc.text(tl, 10, y); y += tl.length * 4.5 + 3;
  });
  y += 4;

  // Health insurance
  if (y > 248) { y = newPage(); }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...WHITE);
  doc.text('Health Insurance - Mandatory for All Students', 10, y); y += 4;
  accentCard(10, y, W - 20, 26, GREEN);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...GREEN);
  doc.text('Mandatory - must enrol before university registration', 17, y + 7);
  const hiText = 'Public health insurance (gesetzliche Krankenversicherung): EUR 120-130/month for students under 30 (2025 rate). TK Techniker Krankenkasse is the most popular with international students. You must show proof of German health insurance before you can enrol at university.';
  const hiLines = doc.splitTextToSize(hiText, W - 34);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUTED);
  doc.text(hiLines, 17, y + 14);

  // ================================================================
  // PAGE 8 - PERSONAL CHECKLIST
  // ================================================================
  y = newPage();
  y = sectionHeader('Section 7: Your Personal Checklist', y);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...MUTED);
  doc.text('Personalised for ' + profile.name + ' (' + profile.country + ') - ' + profile.field + ' - ' + degreeLabel, 10, y);
  y += 8;

  check.forEach((item, i) => {
    if (y > 264) { y = newPage(); }
    const iLines = doc.splitTextToSize(item.text, W - 44);
    const iH = Math.max(12, iLines.length * 4.5 + 6);
    if (i % 2 === 0) { doc.setFillColor(...CARD); } else { doc.setFillColor(...CARD2); }
    doc.roundedRect(10, y, W - 20, iH, 1.5, 1.5, 'F');
    // Checkbox
    doc.setDrawColor(...GOLD); doc.setLineWidth(0.4);
    doc.roundedRect(15, y + iH / 2 - 3.5, 7, 7, 1, 1, 'S');
    // Number
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...DIM);
    doc.text(String(i + 1).padStart(2, '0'), 25, y + 5.5);
    // Category
    const catCol = getCategoryColor(item.category, { muted: MUTED });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6); doc.setTextColor(...catCol);
    doc.text(item.category.toUpperCase(), 33, y + 5.5);
    // Text
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...WHITE);
    doc.text(iLines, 25, y + 10);
    y += iH + 2;
  });

  // ================================================================
  // PAGE 9 - NEXT STEPS & UPSELL
  // ================================================================
  y = newPage();
  y = sectionHeader('Section 8: Your Next Steps', y);

  const nextSteps = [
    { n:'01', title:'Right Now - Today', body:'Review this guide carefully. Identify your top 3 universities from Section 2. Visit each university website and confirm the exact application requirements for your specific program and degree level.' },
    { n:'02', title:'This Week', body:'Check the Anabin database (anabin.kmk.org) to confirm your specific institution is recognised. Start the document preparation process - certified translations take time to arrange.' },
    { n:'03', title:'Within 2 Weeks', body:'Open your blocked account (Fintiba or Expatrio) and begin the transfer of EUR 13,092. Start the KYC verification process immediately as it can take a few days.' },
    { n:'04', title:'Before Applying', body:'Book your visa appointment at the German embassy. Secure your language certificate if you do not already have one that meets requirements. Arrange accommodation search in Germany.' },
    { n:'05', title:'Application Season', body:'Submit applications via uni-assist.de or direct university portals before the deadlines (15 July for winter semester, 15 January for summer semester). Apply to 3-5 universities to maximise chances.' },
  ];

  nextSteps.forEach((step) => {
    if (y > 250) { y = newPage(); }
    doc.setFillColor(...GOLD); doc.roundedRect(10, y, 13, 8, 1, 1, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...BG);
    doc.text(step.n, 16.5, y + 5.5, { align:'center' });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...WHITE);
    doc.text(step.title, 27, y + 5.5);
    y += 10;
    const bLines = doc.splitTextToSize(step.body, W - 22);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...MUTED);
    doc.text(bLines, 14, y); y += bLines.length * 4.3 + 6;
  });

  // Upsell CTA
  if (y > 240) { y = newPage(); }
  y += 8;
  doc.setFillColor(16, 22, 36); doc.roundedRect(10, y, W - 20, 36, 3, 3, 'F');
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.5); doc.roundedRect(10, y, W - 20, 36, 3, 3, 'S');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...GOLD);
  doc.text('Want Expert Help With Your Application?', W / 2, y + 12, { align:'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...WHITE);
  doc.text('Upgrade to StudyPathDE Admission Service (EUR 299)', W / 2, y + 20, { align:'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUTED);
  const ctaText = 'Dedicated admission consultant | Full document review | Application submission | Motivation letter support | Interview coaching';
  const ctaLines = doc.splitTextToSize(ctaText, W - 40);
  doc.text(ctaLines, W / 2, y + 27, { align:'center' });
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...GOLD);
  doc.text('Visit: studypathde.com', W / 2, y + 34, { align:'center' });

  doc.save('StudyPathDE_Guide_' + profile.name.replace(/\s+/g, '_') + '.pdf');
  showToast('Your personalised PDF guide is downloading!', 'success');
}

// ---- FORMAT HELPERS ----
function formatGrade(g) {
  const map = { excellent:'Excellent (Top 10% / GPA 3.7+)', very_good:'Very Good (GPA 3.3-3.6)', good:'Good (GPA 2.7-3.2)', average:'Average (GPA 2.0-2.6)', below_average:'Below Average (under 2.0)' };
  return map[g] || g;
}

// ---- LEAD STORAGE ----
function saveLead(lead) {
  let leads = JSON.parse(localStorage.getItem('studypathde_leads') || '[]');
  leads.push(lead);
  localStorage.setItem('studypathde_leads', JSON.stringify(leads));
}

// ---- EMAIL VALIDATION ----
function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

// ---- TOAST ----
function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = message;
  Object.assign(t.style, {
    position:'fixed', bottom:'32px', left:'50%', transform:'translateX(-50%) translateY(10px)',
    padding:'14px 28px', borderRadius:'10px', zIndex:'9999',
    fontFamily:'Space Grotesk, Inter, sans-serif', fontWeight:'600', fontSize:'0.9rem',
    whiteSpace:'nowrap', boxShadow:'0 8px 32px rgba(0,0,0,0.4)',
    background: type==='error' ? 'rgba(239,68,68,0.95)' : type==='success' ? 'rgba(34,197,94,0.95)' : 'rgba(212,168,67,0.95)',
    color: type==='error' ? '#fff' : '#080b12',
    animation:'fadeInUp 0.3s ease forwards',
  });
  document.body.appendChild(t);
  setTimeout(() => { t.style.animation='fadeOutDown 0.3s ease forwards'; setTimeout(()=>t.remove(),300); }, 3200);
}
