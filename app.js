/* ============================================
   STUDYPATHDE — Main Application Logic

   SUPABASE TABLE STRUCTURE — run this SQL in your Supabase dashboard:
   ──────────────────────────────────────────────────────────────────
   CREATE TABLE leads (
     id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name          TEXT NOT NULL,
     email         TEXT NOT NULL,
     whatsapp      TEXT,
     country       TEXT,
     grade         TEXT,
     field         TEXT,
     german_level  TEXT,
     english_level TEXT,
     matched_unis  TEXT[],
     timestamp     TIMESTAMPTZ DEFAULT now()
   );
   ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Allow anon insert"       ON leads FOR INSERT TO anon             WITH CHECK (true);
   CREATE POLICY "Allow authenticated read" ON leads FOR SELECT TO authenticated  USING (true);
   ──────────────────────────────────────────────────────────────────
   ============================================ */

// ---- SUPABASE CONFIG (replace with your real values) ----
const SUPABASE_URL      = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

async function saveLeadToSupabase(lead) {
  if (SUPABASE_URL === 'YOUR_SUPABASE_URL') return; // skip if not configured
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        name: lead.name, email: lead.email, whatsapp: lead.whatsapp || null,
        country: lead.country, grade: lead.grade, field: lead.field,
        german_level: lead.german, english_level: lead.english,
        matched_unis: lead.unis || [], timestamp: lead.timestamp,
      }),
    });
    if (!res.ok) console.warn('Supabase save failed:', await res.text());
  } catch (e) { console.warn('Supabase error:', e); }
}

// ---- ENGLISH LEVEL HELPERS ----
function englishToLevel(val) {
  const map = {
    ielts_5: 'b1', ielts_6: 'b2', ielts_6_5: 'c1', ielts_7: 'c2',
    toefl_79: 'b1', toefl_80: 'b2', toefl_96: 'c1',
    native: 'native', none: 'none',
  };
  return map[val] || val;
}
function formatEnglishShort(val) {
  const map = {
    ielts_5: 'IELTS 5.0-5.5', ielts_6: 'IELTS 6.0', ielts_6_5: 'IELTS 6.5',
    ielts_7: 'IELTS 7.0+', toefl_79: 'TOEFL ≤79', toefl_80: 'TOEFL 80-95',
    toefl_96: 'TOEFL 96+', native: 'Native Speaker', none: 'No Certificate',
  };
  return map[val] || val || 'Not specified';
}
function formatEnglishFull(val) {
  const map = {
    ielts_5: 'IELTS 5.0–5.5 (Basic)', ielts_6: 'IELTS 6.0 (Good)',
    ielts_6_5: 'IELTS 6.5 (Very Good)', ielts_7: 'IELTS 7.0+ (Excellent)',
    toefl_79: 'TOEFL 79 or below', toefl_80: 'TOEFL 80–95 (Good)',
    toefl_96: 'TOEFL 96+ (Excellent)', native: 'Native English Speaker',
    none: 'No English Certificate Yet',
  };
  return map[val] || val || 'Not specified';
}
function getEnglishNote(val) {
  const map = {
    ielts_5: 'Meets minimum for some applied science programs. Limited options.',
    ielts_6: 'Qualifies for most English-taught programs in Germany.',
    ielts_6_5: 'Competitive score, accepted at most German universities.',
    ielts_7: 'Excellent score. No restrictions on English-taught programs.',
    toefl_79: 'Below most thresholds. Consider retaking to improve options.',
    toefl_80: 'Meets most requirements for English-taught programs.',
    toefl_96: 'Excellent TOEFL score. Qualifies for all programs.',
    native: 'Native speaker — no certificate needed for English-taught programs.',
    none: 'No certificate yet. German programs may not require English cert. Consider IELTS.',
  };
  return map[val] || 'Check individual university requirements.';
}
function getGermanNote(val) {
  const notes = {
    none: 'No German yet — focus on English-taught programs or prepare for German courses.',
    a1: 'Very basic German. Enrol in an intensive course. Target B2 within 12–18 months.',
    a2: 'Elementary level. Continue German classes — most programs require B2 minimum.',
    b1: 'Intermediate German. Around 3–6 months of study to reach B2.',
    b2: 'Good level — meets minimum requirement for most German-taught programs.',
    c1: 'Advanced German — qualifies for all German-taught programs.',
    c2: 'Mastery level — no language restrictions whatsoever.',
  };
  return notes[val] || 'Check university language requirements.';
}

// ---- COUNTRY DATA (Anabin, Visa, Documents) ----
const COUNTRY_DATA_MAP = {
  'India': {
    anabinStatus: 'Recognised (H+)', anabinNote: 'Indian degrees from recognized institutions are fully accepted. Certificates must be attested by the Ministry of Education and translated into German by a sworn translator. No APS required.',
    visaEmbassy: 'German Embassy New Delhi; Consulates in Mumbai, Chennai, Bangalore, Kolkata, Hyderabad',
    visaTimeline: '6–8 weeks', documentsNote: 'Ministry of Education attestation required on mark sheets. Degree certificate must bear university seal and principal signature.', additionalVisaDoc: 'Ministry-attested transcripts',
  },
  'China': {
    anabinStatus: 'Recognised — APS Certificate Required', anabinNote: 'Chinese degrees are recognised, but ALL Chinese applicants MUST obtain an APS (Akademische Prüfstelle) certificate before applying. This is a mandatory pre-screening process unique to China.',
    visaEmbassy: 'German Embassy Beijing; Consulates in Shanghai, Guangzhou, Chengdu, Shenyang',
    visaTimeline: '4–6 weeks', documentsNote: 'APS certificate is mandatory — get it from the German Embassy in Beijing or Shanghai. Process takes 4–6 weeks and costs approx. 200 CNY.', additionalVisaDoc: 'APS Certificate (mandatory for all Chinese applicants)',
  },
  'Pakistan': {
    anabinStatus: 'Recognised (H+)', anabinNote: 'Pakistani degrees are generally recognised. HEC-attested documents required. Some universities may request additional verification.',
    visaEmbassy: 'German Embassy Islamabad; Consulate in Karachi',
    visaTimeline: '8–12 weeks', documentsNote: 'HEC (Higher Education Commission) attestation required for all academic documents. Then get Foreign Ministry attestation.', additionalVisaDoc: 'HEC-attested transcripts and degree certificate',
  },
  'Egypt': {
    anabinStatus: 'Recognised (H+)', anabinNote: 'Egyptian university degrees are recognised. Documents must be notarised and translated. Al-Azhar University has specific recognition procedures.',
    visaEmbassy: 'German Embassy Cairo',
    visaTimeline: '6–8 weeks', documentsNote: 'Notarisation by Egyptian Ministry of Foreign Affairs and Ministry of Higher Education required on academic documents.', additionalVisaDoc: 'Ministry-notarised and translated transcripts',
  },
  'Nigeria': {
    anabinStatus: 'Recognised (H+)', anabinNote: 'Nigerian degrees are recognised. NYSC discharge/exemption certificate required in addition to academic documents.',
    visaEmbassy: 'German Embassy Abuja; Consulate General Lagos',
    visaTimeline: '8–12 weeks', documentsNote: 'NYSC (National Youth Service Corps) discharge or exemption certificate required. Documents notarised by Nigerian Ministry of Foreign Affairs.', additionalVisaDoc: 'NYSC Discharge/Exemption Certificate',
  },
  'Turkey': {
    anabinStatus: 'Recognised (H+)', anabinNote: 'Turkish degrees are well-recognised in Germany. Apostille stamp from Turkish authorities required on all documents.',
    visaEmbassy: 'German Embassy Ankara; Consulates in Istanbul, Izmir',
    visaTimeline: '4–6 weeks', documentsNote: 'Turkish documents require Apostille (Türkiye Cumhuriyeti Dışişleri Bakanlığı) stamp.', additionalVisaDoc: 'Apostille-stamped academic documents',
  },
  'Iran': {
    anabinStatus: 'Recognised (H)', anabinNote: 'Iranian university degrees are generally recognised. Check the specific institution on Anabin database. Translation into German by a sworn translator is mandatory.',
    visaEmbassy: 'German Embassy Tehran',
    visaTimeline: '8–16 weeks', documentsNote: 'All documents must be notarised by the Iranian Ministry of Foreign Affairs and then translated by a sworn German translator.', additionalVisaDoc: 'Ministry of Foreign Affairs notarised documents',
  },
  'Morocco': {
    anabinStatus: 'Recognised (H+)', anabinNote: 'Moroccan degrees are recognised. University transcripts must bear the original university seal and be translated into German or French.',
    visaEmbassy: 'German Embassy Rabat; Consulate Casablanca',
    visaTimeline: '6–10 weeks', documentsNote: 'Documents legalised by the Moroccan Ministry of Foreign Affairs required.', additionalVisaDoc: 'Legalised academic transcripts',
  },
  'Bangladesh': {
    anabinStatus: 'Recognised (H+)', anabinNote: 'Bangladeshi degrees are recognised. Documents must be attested by the Ministry of Education and Ministry of Foreign Affairs.',
    visaEmbassy: 'German Embassy Dhaka',
    visaTimeline: '8–12 weeks', documentsNote: 'Attestation by Board of Education and Ministry of Foreign Affairs required.', additionalVisaDoc: 'Ministry of Foreign Affairs attested transcripts',
  },
  'Indonesia': {
    anabinStatus: 'Recognised (H+)', anabinNote: 'Indonesian degrees from accredited universities are recognised. BAN-PT accreditation letter of your university is recommended.',
    visaEmbassy: 'German Embassy Jakarta',
    visaTimeline: '6–8 weeks', documentsNote: 'Documents legalised by the Indonesian Ministry of Foreign Affairs. BAN-PT accreditation confirmation helpful.', additionalVisaDoc: 'Legalized documents from Ministry of Foreign Affairs',
  },
  'Vietnam': {
    anabinStatus: 'Recognised (H+)', anabinNote: 'Vietnamese degrees are recognised. All documents must be notarised, translated, and apostilled by the Ministry of Foreign Affairs.',
    visaEmbassy: 'German Embassy Hanoi; Consulate Ho Chi Minh City',
    visaTimeline: '6–8 weeks', documentsNote: 'Documents require notarisation and authentication by Ministry of Foreign Affairs before translation.', additionalVisaDoc: 'Apostilled and notarised documents',
  },
  'Ukraine': {
    anabinStatus: 'Recognised (H+)', anabinNote: 'Ukrainian degrees are generally well-recognised in Germany. Given current circumstances, simplified procedures apply in some German states.',
    visaEmbassy: 'German Embassy Kyiv (check current status); process may be handled via neighbouring EU consulates',
    visaTimeline: '4–8 weeks', documentsNote: 'Documents require official Ukrainian notarisation and apostille where available.', additionalVisaDoc: 'Apostilled academic documents',
  },
  'Brazil': {
    anabinStatus: 'Recognised (H+)', anabinNote: 'Brazilian degrees are recognised. Apostille from a Brazilian Notary (Cartório) required. No separate notarisation needed with Apostille.',
    visaEmbassy: 'German Embassy Brasília; Consulates in São Paulo, Rio de Janeiro, Porto Alegre, Recife',
    visaTimeline: '4–6 weeks', documentsNote: 'Apostille (Hague Convention) from a registered Brazilian Cartório on academic documents.', additionalVisaDoc: 'Apostilled transcripts and degree',
  },
  'Colombia': {
    anabinStatus: 'Recognised (H+)', anabinNote: 'Colombian degrees are recognised. Documents must be apostilled by the Colombian Ministry of Foreign Affairs.',
    visaEmbassy: 'German Embassy Bogotá',
    visaTimeline: '4–6 weeks', documentsNote: 'Apostille from Cancillería de Colombia (Ministry of Foreign Affairs) required on all academic documents.', additionalVisaDoc: 'Apostilled academic transcripts',
  },
  'Philippines': {
    anabinStatus: 'Recognised (H+)', anabinNote: 'Filipino degrees are recognised. CHED (Commission on Higher Education) certification recommended alongside university documents.',
    visaEmbassy: 'German Embassy Manila',
    visaTimeline: '6–8 weeks', documentsNote: 'Red-ribbon (apostille) authentication by DFA (Department of Foreign Affairs) required.', additionalVisaDoc: 'DFA Red-ribbon apostilled documents and CHED certification',
  },
  'Kenya': {
    anabinStatus: 'Recognised (H+)', anabinNote: 'Kenyan degrees are generally recognised. Documents must be certified by the Kenya National Qualifications Authority (KNQA).',
    visaEmbassy: 'German Embassy Nairobi',
    visaTimeline: '8–10 weeks', documentsNote: 'Kenya National Qualifications Authority (KNQA) certification recommended. Ministry of Foreign Affairs attestation required.', additionalVisaDoc: 'KNQA-certified documents',
  },
  'Ghana': {
    anabinStatus: 'Recognised (H+)', anabinNote: 'Ghanaian degrees are recognised. Documents certified by Ghana Education Service or WAEC required.',
    visaEmbassy: 'German Embassy Accra',
    visaTimeline: '8–10 weeks', documentsNote: 'Ministry of Foreign Affairs and Regional Integration attestation required on all documents.', additionalVisaDoc: 'Ministry of Foreign Affairs attested documents',
  },
  'Saudi Arabia': {
    anabinStatus: 'Recognised (H+)', anabinNote: 'Saudi degrees are recognised. Ministry of Education attestation followed by Ministry of Foreign Affairs required.',
    visaEmbassy: 'German Embassy Riyadh; Consulates in Jeddah',
    visaTimeline: '6–8 weeks', documentsNote: 'Saudi Ministry of Education attestation, then Ministry of Foreign Affairs legalisation required.', additionalVisaDoc: 'MoE and MoFA legalised documents',
  },
  'Syria': {
    anabinStatus: 'Recognised (H) — Documentation Challenges', anabinNote: 'Syrian degrees are generally recognised, but obtaining certified documents may be challenging. German authorities understand this. Contact the German embassy early.',
    visaEmbassy: 'German Embassy Beirut (Lebanon) for most Syrian applicants',
    visaTimeline: '8–16 weeks', documentsNote: 'Contact the German embassy early — special procedures exist for applicants unable to obtain standard documents due to conflict.', additionalVisaDoc: 'Any available academic records; sworn declaration if originals unavailable',
  },
  'Jordan': {
    anabinStatus: 'Recognised (H+)', anabinNote: 'Jordanian degrees are recognised. Ministry of Higher Education and Ministry of Foreign Affairs attestation required.',
    visaEmbassy: 'German Embassy Amman',
    visaTimeline: '6–8 weeks', documentsNote: 'Ministry of Higher Education attestation followed by Ministry of Foreign Affairs legalisation required.', additionalVisaDoc: 'MoHE and MoFA attested transcripts',
  },
  'Iraq': {
    anabinStatus: 'Recognised (H)', anabinNote: 'Iraqi degrees are generally recognised. Documents must be legalised by the Ministry of Higher Education and Ministry of Foreign Affairs.',
    visaEmbassy: 'German Embassy Baghdad; Consulate Erbil',
    visaTimeline: '10–16 weeks', documentsNote: 'Ministry of Higher Education and Scientific Research legalisation, then Ministry of Foreign Affairs attestation required.', additionalVisaDoc: 'Ministry of Higher Education legalised documents',
  },
};
const DEFAULT_COUNTRY_DATA = {
  anabinStatus: 'Generally Recognised',
  anabinNote: 'Verify your specific institution\'s recognition status at anabin.kmk.org. Contact your nearest German embassy for country-specific document requirements.',
  visaEmbassy: 'Contact the nearest German Embassy or Consulate in your country',
  visaTimeline: '4–8 weeks',
  documentsNote: 'Certified translations of all academic documents required. Official apostille or legalisation required from your country\'s Ministry of Foreign Affairs.',
  additionalVisaDoc: 'Country-specific attestation/apostille as required by German embassy',
};
function getCountryData(country) {
  return COUNTRY_DATA_MAP[country] || DEFAULT_COUNTRY_DATA;
}

// ---- GRADE CONVERSION ----
function getGradeConversion(grade) {
  const map = {
    excellent:     { german: '1.0 – 1.5', explanation: 'Your excellent academic performance converts to the top tier of the German 1.0–4.0 GPA scale. German universities use an inverse scale where 1.0 is the highest (sehr gut = very good). You are competitive for even the most selective programs.' },
    very_good:     { german: '1.5 – 2.0', explanation: 'Very good grades convert to a strong position on the German scale (gut = good). You are competitive for most universities and selective programs.' },
    good:          { german: '2.0 – 2.5', explanation: 'Good grades convert to a solid mid-range on the German scale (befriedigend = satisfactory). You qualify for most programs. Focus on universities with realistic entry requirements.' },
    average:       { german: '2.5 – 3.0', explanation: 'Average grades place you in the lower-mid range on the German scale. Consider applied sciences universities (Fachhochschulen) which often have more flexible entry requirements.' },
    below_average: { german: '3.0 – 4.0', explanation: 'Below average grades may require a Studienkolleg (preparatory college) in Germany before direct admission. This is a 1-year course that prepares you for German university standards.' },
  };
  return map[grade] || { german: 'N/A', explanation: 'Grade not specified.' };
}

// ---- CHECKLIST ----
function getPersonalChecklist(profile, countryData) {
  const items = [
    { category: 'Documents', text: `Obtain certified copies of all academic transcripts and your degree certificate. ${countryData.documentsNote}` },
    { category: 'Translation', text: 'Get all academic documents translated into German by a sworn translator (beeidigter Übersetzer). Find one at bdue.de.' },
    { category: 'Language', text: profile.german === 'none' || profile.german === 'a1' || profile.german === 'a2'
        ? 'Enrol in a German language course immediately — you need at least B2 for German-taught programs. Try Goethe Institut or online at DW Learn German.'
        : `Confirm your German ${(profile.german||'').toUpperCase()} certificate is accepted by your target universities. DSH or TestDaF may be required.` },
    { category: 'English', text: englishToLevel(profile.english) === 'none'
        ? 'Consider taking IELTS or TOEFL if applying to English-taught programs. IELTS 6.5 is the most widely accepted score.'
        : `Your ${formatEnglishShort(profile.english)} score should be sufficient. Keep the original certificate safe — universities require the original.` },
    { category: 'Finances', text: 'Open a German blocked account (Sperrkonto) with Fintiba or Expatrio. Deposit €11,208. You will need the confirmation certificate for your visa.' },
    { category: 'University', text: `Research your top 3–5 matched universities. Visit each university's International Office page and confirm entry requirements for ${profile.field}.` },
    { category: 'Application', text: 'Create an account on uni-assist.de (if applying to multiple universities). Check if your target universities use uni-assist or direct applications.' },
    { category: 'Accommodation', text: 'Apply for student dormitory (Studentenwohnheim) via the Studierendenwerk as soon as you receive your admission letter. Waiting lists can be long.' },
    { category: 'Health Insurance', text: 'Arrange German public health insurance (gesetzliche Krankenversicherung) before arriving. TK (Techniker Krankenkasse) or AOK recommended — approx. €120/month.' },
    { category: 'Visa', text: `Book your student visa appointment at the ${countryData.visaEmbassy} as early as possible. Expected processing time: ${countryData.visaTimeline}.` },
    { category: 'Visa Docs', text: `Prepare visa documents: passport, admission letter, blocked account certificate, health insurance, photos, completed visa form, €75 fee. ${countryData.additionalVisaDoc}.` },
    { category: 'Arrival', text: 'On arrival in Germany: register your address (Anmeldung) at the local Bürgeramt within 14 days, enrol at university (Immatrikulation), activate health insurance, open a regular bank account.' },
  ];
  return items;
}

function getCategoryColor(cat, C) {
  const map = {
    'Documents': [99, 102, 241], 'Translation': [99, 102, 241],
    'Language': [34, 197, 94], 'English': [34, 197, 94],
    'Finances': [212, 168, 67], 'University': [212, 168, 67],
    'Application': [240, 201, 102], 'Accommodation': [251, 191, 36],
    'Health Insurance': [74, 222, 128], 'Visa': [239, 68, 68],
    'Visa Docs': [239, 68, 68], 'Arrival': [167, 139, 250],
  };
  return map[cat] || C.muted;
}

// ---- NAVBAR SCROLL ----
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
});

// ---- UPLOAD ZONE ----
const uploadZone    = document.getElementById('uploadZone');
const fileInput     = document.getElementById('fileInput');
const uploadIdle    = document.getElementById('uploadIdle');
const uploadSuccess = document.getElementById('uploadSuccess');
const successFilename = document.getElementById('successFilename');
const btnChangeFile = document.getElementById('btnChangeFile');
let uploadedFile = null;

uploadZone.addEventListener('click', (e) => {
  if (btnChangeFile.contains(e.target)) return;
  fileInput.click();
});
uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
uploadZone.addEventListener('drop', (e) => {
  e.preventDefault(); uploadZone.classList.remove('drag-over');
  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', () => { if (fileInput.files[0]) handleFile(fileInput.files[0]); });
btnChangeFile.addEventListener('click', (e) => {
  e.stopPropagation(); uploadedFile = null;
  uploadIdle.style.display = 'block'; uploadSuccess.style.display = 'none'; fileInput.value = '';
});

function handleFile(file) {
  const MAX_SIZE = 10 * 1024 * 1024;
  const ALLOWED = ['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/jpeg','image/jpg','image/png'];
  if (!ALLOWED.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|jpg|jpeg|png)$/i)) {
    showToast('Please upload a PDF, Word document, or image file.', 'error'); return;
  }
  if (file.size > MAX_SIZE) { showToast('File too large. Maximum size is 10MB.', 'error'); return; }
  uploadedFile = file;
  successFilename.textContent = `📎 ${file.name}`;
  uploadIdle.style.display = 'none'; uploadSuccess.style.display = 'block';
}

// ---- UNIVERSITY DATABASE ----
const UNIVERSITIES = [
  { name: 'TU Munich', city: 'Munich, Bavaria', fields: ['Computer Science / IT','Engineering (Mechanical / Electrical / Civil)','Natural Sciences (Physics / Chemistry / Biology)','Mathematics / Statistics'], german: ['b2','c1','c2'], english: ['b2','c1','c2','native'], grades: ['excellent','very_good','good'], tags: ['Research Excellence','Top 1%','Global Ranking'], website: 'tum.de' },
  { name: 'LMU Munich', city: 'Munich, Bavaria', fields: ['Medicine / Health Sciences','Law','Social Sciences / Psychology','Natural Sciences (Physics / Chemistry / Biology)'], german: ['c1','c2'], english: ['b2','c1','c2','native'], grades: ['excellent','very_good'], tags: ['Nobel Laureates','Medical School','Historic'], website: 'lmu.de' },
  { name: 'Heidelberg University', city: 'Heidelberg, Baden-Württemberg', fields: ['Medicine / Health Sciences','Natural Sciences (Physics / Chemistry / Biology)','Humanities / Arts'], german: ['b2','c1','c2'], english: ['b2','c1','c2','native'], grades: ['excellent','very_good','good'], tags: ["Germany's Oldest",'Research','Excellence'], website: 'uni-heidelberg.de' },
  { name: 'RWTH Aachen', city: 'Aachen, NRW', fields: ['Engineering (Mechanical / Electrical / Civil)','Computer Science / IT','Mathematics / Statistics'], german: ['b2','c1','c2'], english: ['b2','c1','c2','native'], grades: ['excellent','very_good','good'], tags: ['Engineering #1','Industry Ties','Innovation'], website: 'rwth-aachen.de' },
  { name: 'Freie Universität Berlin', city: 'Berlin', fields: ['Social Sciences / Psychology','Humanities / Arts','Law','Medicine / Health Sciences'], german: ['b2','c1','c2'], english: ['b1','b2','c1','c2','native'], grades: ['excellent','very_good','good','average'], tags: ['International','Research','Berlin'], website: 'fu-berlin.de' },
  { name: 'Humboldt University Berlin', city: 'Berlin', fields: ['Natural Sciences (Physics / Chemistry / Biology)','Humanities / Arts','Social Sciences / Psychology'], german: ['b2','c1','c2'], english: ['b2','c1','c2','native'], grades: ['excellent','very_good','good'], tags: ['Historic','Research Excellence','Berlin'], website: 'hu-berlin.de' },
  { name: 'University of Frankfurt', city: 'Frankfurt, Hesse', fields: ['Business Administration / Economics','Law','Social Sciences / Psychology'], german: ['b2','c1','c2'], english: ['b2','c1','c2','native'], grades: ['excellent','very_good','good','average'], tags: ['Finance Hub','Business','International'], website: 'uni-frankfurt.de' },
  { name: 'University of Hamburg', city: 'Hamburg', fields: ['Business Administration / Economics','Law','Natural Sciences (Physics / Chemistry / Biology)'], german: ['b2','c1','c2'], english: ['b1','b2','c1','native'], grades: ['excellent','very_good','good','average'], tags: ['Port City','International Trade','Research'], website: 'uni-hamburg.de' },
  { name: 'KIT (Karlsruhe)', city: 'Karlsruhe, Baden-Württemberg', fields: ['Engineering (Mechanical / Electrical / Civil)','Computer Science / IT','Architecture / Urban Planning'], german: ['b2','c1','c2'], english: ['b2','c1','c2','native'], grades: ['excellent','very_good','good'], tags: ['Tech Excellence','Engineering','Innovation'], website: 'kit.edu' },
  { name: 'TU Berlin', city: 'Berlin', fields: ['Computer Science / IT','Engineering (Mechanical / Electrical / Civil)','Architecture / Urban Planning','Mathematics / Statistics'], german: ['b2','c1','c2'], english: ['b1','b2','c1','c2','native'], grades: ['excellent','very_good','good','average'], tags: ['Tech','Berlin','International Students'], website: 'tu-berlin.de' },
  { name: 'University of Cologne', city: 'Cologne, NRW', fields: ['Business Administration / Economics','Law','Medicine / Health Sciences','Social Sciences / Psychology'], german: ['b2','c1','c2'], english: ['b2','c1','c2','native'], grades: ['excellent','very_good','good','average'], tags: ['Large Campus','Business','Medicine'], website: 'uni-koeln.de' },
  { name: 'FAU Erlangen-Nürnberg', city: 'Erlangen, Bavaria', fields: ['Engineering (Mechanical / Electrical / Civil)','Medicine / Health Sciences','Computer Science / IT'], german: ['b2','c1','c2'], english: ['b2','c1','c2','native'], grades: ['excellent','very_good','good'], tags: ['Tech Industry','Siemens HQ','Engineering'], website: 'fau.de' },
  { name: 'HTW Berlin', city: 'Berlin', fields: ['Engineering (Mechanical / Electrical / Civil)','Computer Science / IT','Business Administration / Economics','Architecture / Urban Planning'], german: ['b1','b2','c1'], english: ['b1','b2','c1','c2','native'], grades: ['excellent','very_good','good','average','below_average'], tags: ['Applied Sciences','Practical','International'], website: 'htw-berlin.de' },
  { name: 'Hochschule München (HM)', city: 'Munich, Bavaria', fields: ['Engineering (Mechanical / Electrical / Civil)','Computer Science / IT','Business Administration / Economics'], german: ['b2','c1','c2'], english: ['b1','b2','c1','c2','native'], grades: ['excellent','very_good','good','average'], tags: ['Applied Sciences','Munich','Industry Connections'], website: 'hm.edu' },
  { name: 'Jacobs University Bremen', city: 'Bremen (English-medium)', fields: ['Computer Science / IT','Engineering (Mechanical / Electrical / Civil)','Business Administration / Economics','Natural Sciences (Physics / Chemistry / Biology)'], german: ['none','a1','a2','b1','b2','c1','c2'], english: ['b2','c1','c2','native'], grades: ['excellent','very_good','good','average'], tags: ['100% English','International','Liberal Arts'], website: 'constructor.university' },
];

const GRADE_SCORE = { excellent: 100, very_good: 85, good: 70, average: 55, below_average: 40 };

function matchUniversities(profile) {
  const engLevel = englishToLevel(profile.english);
  return UNIVERSITIES.map(uni => {
    let score = 0;
    if (uni.fields.includes(profile.field)) score += 40; else score += 5;
    if (uni.german.includes(profile.german)) score += 25;
    else if (profile.german === 'none' && uni.german.includes('none')) score += 25;
    else if (profile.german !== 'none') score += 10;
    if (uni.english.includes(engLevel)) score += 20;
    if (uni.grades.includes(profile.grade)) score += 15;
    return { ...uni, score: Math.min(score, 100) };
  }).filter(u => u.score >= 30).sort((a, b) => b.score - a.score).slice(0, 10);
}

function getWhySuited(uni, profile) {
  const reasons = [];
  if (uni.fields.includes(profile.field)) reasons.push(`offers ${profile.field}`);
  if (uni.grades.includes(profile.grade)) reasons.push('entry requirements match your grade');
  if (uni.german.includes(profile.german)) reasons.push(`accepts ${(profile.german||'your').toUpperCase()} German level`);
  if (uni.city.includes('Berlin')) reasons.push('vibrant international city');
  if (uni.tags.includes('100% English')) reasons.push('fully English-taught');
  return reasons.length ? `Suits you because it ${reasons.join(', ')}.` : `Strong match for your academic profile.`;
}

// ---- APP STATE ----
let currentProfile = {};
let matchedUnis = [];

// ---- STEP 1: CHECK ELIGIBILITY → OPEN MODAL ----
document.getElementById('btnCheck').addEventListener('click', () => {
  const country = document.getElementById('country').value;
  const grade   = document.getElementById('grade').value;
  const field   = document.getElementById('field').value;
  const german  = document.getElementById('german').value;
  const english = document.getElementById('english').value;
  if (!country || !grade || !field || !german || !english) {
    showToast('Please fill in all fields before continuing.', 'error'); return;
  }
  currentProfile = { country, grade, field, german, english };
  matchedUnis = matchUniversities(currentProfile);
  document.getElementById('modalMatchCount').textContent = matchedUnis.length;
  document.getElementById('modalCountry').value = country;
  openModal();
});

// ---- MODAL ----
function openModal() {
  document.getElementById('leadModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  document.getElementById('leadModal').classList.remove('active');
  document.body.style.overflow = '';
}
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('leadModal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('leadModal')) closeModal();
});

document.getElementById('btnModalReveal').addEventListener('click', () => {
  const name     = document.getElementById('modalName').value.trim();
  const email    = document.getElementById('modalEmail').value.trim();
  const whatsapp = document.getElementById('modalWhatsapp').value.trim();
  if (!name)                        { showToast('Please enter your full name.', 'error'); return; }
  if (!email || !isValidEmail(email)) { showToast('Please enter a valid email address.', 'error'); return; }

  currentProfile.name     = name;
  currentProfile.email    = email;
  currentProfile.whatsapp = whatsapp;

  const lead = { ...currentProfile, timestamp: new Date().toISOString(), unis: matchedUnis.map(u => u.name) };
  saveLead(lead);
  saveLeadToSupabase(lead);

  closeModal();
  renderResults(name, matchedUnis);
  document.getElementById('step-details').style.display = 'none';
  document.getElementById('step-results').style.display = 'block';
  document.getElementById('step-results').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// ---- RENDER RESULTS ----
function renderResults(name, unis) {
  document.getElementById('resultName').textContent = name;
  document.getElementById('unisGrid').innerHTML = unis.map(u => `
    <div class="uni-card">
      <div class="uni-match-score">★ ${u.score}% Match</div>
      <div class="uni-name">${u.name}</div>
      <div class="uni-city">📍 ${u.city}</div>
      <div class="uni-tags">${u.tags.map(t => `<span class="uni-tag">${t}</span>`).join('')}</div>
    </div>`).join('');
}

// ---- PDF DOWNLOAD ----
document.getElementById('btnDownloadPDF').addEventListener('click', () => generatePDF(currentProfile, matchedUnis));

// ---- PDF GENERATION (Full 8-Page Premium Guide) ----
function generatePDF(profile, unis) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, H = 297;

  const BG     = [8,  11,  18];
  const CARD   = [14, 20,  32];
  const CARD2  = [18, 24,  38];
  const GOLD   = [212, 168, 67];
  const GOLDLT = [240, 201, 102];
  const WHITE  = [232, 234, 240];
  const MUTED  = [122, 130, 153];
  const DIM    = [74,  81, 104];
  const GREEN  = [34, 197,  94];
  const BLUE   = [99, 102, 241];
  const RED    = [239,  68,  68];

  let pageNum = 0;

  function bg() { doc.setFillColor(...BG); doc.rect(0, 0, W, H, 'F'); }

  function pageHeader(title) {
    pageNum++;
    bg();
    doc.setFillColor(...CARD);
    doc.rect(0, 0, W, 13, 'F');
    doc.setFillColor(...GOLD);
    doc.rect(0, 13, W, 0.5, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...GOLD);
    doc.text('✦ STUDYPATHDE', 10, 9);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...MUTED);
    doc.text(`Personalised for ${profile.name} · ${profile.country}`, W / 2, 9, { align: 'center' });
    doc.text(`Page ${pageNum}`, W - 10, 9, { align: 'right' });
    return 22;
  }

  function addPage(title) {
    doc.addPage();
    return pageHeader(title);
  }

  function txt(text, x, y, maxW, size, color, bold) {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size); doc.setTextColor(...color);
    const lines = doc.splitTextToSize(String(text), maxW);
    doc.text(lines, x, y);
    return y + lines.length * (size * 0.45);
  }

  function sectionTitle(title, y) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(...GOLD);
    doc.text(title, 10, y);
    doc.setFillColor(...GOLD); doc.rect(10, y + 2, 60, 0.5, 'F');
    return y + 10;
  }

  function card(x, y, w, h, borderColor) {
    doc.setFillColor(...CARD); doc.roundedRect(x, y, w, h, 2, 2, 'F');
    if (borderColor) {
      doc.setDrawColor(...borderColor); doc.setLineWidth(0.4);
      doc.roundedRect(x, y, w, h, 2, 2, 'S');
    }
  }

  function accentCard(x, y, w, h, accentColor) {
    card(x, y, w, h, null);
    doc.setFillColor(...accentColor); doc.rect(x, y, 3, h, 'F');
  }

  const cd    = getCountryData(profile.country);
  const gc    = getGradeConversion(profile.grade);
  const check = getPersonalChecklist(profile, cd);
  const top5  = unis.slice(0, 5);

  // ================================================================
  // PAGE 1: COVER
  // ================================================================
  pageNum++;
  bg();
  // Gold top bar
  doc.setFillColor(...GOLD); doc.rect(0, 0, W, 4, 'F');
  // Left side accent
  doc.setFillColor(...CARD); doc.rect(0, 4, 4, H - 4, 'F');

  // Logo
  doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(...GOLD);
  doc.text('✦ StudyPathDE', 18, 28);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...MUTED);
  doc.text('AI-Powered German University Matching', 18, 36);
  doc.setFillColor(...GOLD); doc.rect(18, 41, W - 28, 0.4, 'F');

  // Personalised for
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...MUTED);
  doc.text('PERSONALISED GUIDE FOR', 18, 58);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(30); doc.setTextColor(...WHITE);
  doc.text(profile.name, 18, 74);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(13); doc.setTextColor(...GOLD);
  doc.text(profile.field || 'General Studies', 18, 84);

  // Info cards row
  const infoCards = [
    { label: 'COUNTRY', val: profile.country },
    { label: 'GRADE',   val: formatGrade(profile.grade).split(' (')[0] },
    { label: 'GERMAN',  val: (profile.german || 'None').toUpperCase() },
    { label: 'ENGLISH', val: formatEnglishShort(profile.english) },
  ];
  infoCards.forEach((ic, i) => {
    const cx = 18 + i * 47;
    card(cx, 94, 43, 22, GOLD);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...MUTED);
    doc.text(ic.label, cx + 4, 100);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...WHITE);
    const v = ic.val.length > 17 ? ic.val.slice(0, 15) + '…' : ic.val;
    doc.text(v, cx + 4, 110);
  });

  // Date
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...DIM);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, 18, 126);

  // Table of contents
  card(18, 133, W - 36, 78, GOLD);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...GOLD);
  doc.text('CONTENTS', 26, 142);
  const toc = [
    ['01','Eligibility Summary','2'],['02','Matched Universities (Top 5)','3'],
    ['03','Step-by-Step Application Guide','4'],['04','Blocked Account Guide — €11,208','5'],
    ['05','Visa Application Guide','6'],['06','Living in Germany — Costs & Tips','7'],
    ['07','Your Personal Checklist','8'],
  ];
  toc.forEach(([n, t, p], i) => {
    const ty = 150 + i * 8.5;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...GOLD); doc.text(n, 26, ty);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...WHITE); doc.text(t, 36, ty);
    doc.setTextColor(...MUTED); doc.text(`Page ${p}`, W - 26, ty, { align: 'right' });
    if (i < toc.length - 1) {
      doc.setDrawColor(...DIM); doc.setLineWidth(0.1); doc.line(26, ty + 2.5, W - 26, ty + 2.5);
    }
  });

  // Footer
  doc.setFillColor(...CARD); doc.rect(0, H - 11, W, 11, 'F');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...MUTED);
  doc.text('StudyPathDE · studypathde.com', 10, H - 4.5);
  doc.text('Page 1', W - 10, H - 4.5, { align: 'right' });
  doc.setTextColor(...GOLD);
  doc.text(`Personalised for ${profile.name} · ${profile.country}`, W / 2, H - 4.5, { align: 'center' });

  // ================================================================
  // PAGE 2: ELIGIBILITY SUMMARY
  // ================================================================
  let y = addPage();
  y = sectionTitle('Section 1: Eligibility Summary', y);

  // Anabin card
  accentCard(10, y, W - 20, 34, GREEN);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...GREEN);
  doc.text('Anabin Recognition Status', 17, y + 8);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...WHITE);
  doc.text(cd.anabinStatus, 17, y + 17);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  const anLines = doc.splitTextToSize(cd.anabinNote, W - 38);
  doc.setTextColor(...MUTED); doc.text(anLines.slice(0, 2), 17, y + 24);
  y += 40;

  // Grade conversion card
  accentCard(10, y, W - 20, 42, GOLD);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...GOLD);
  doc.text('Grade Conversion to German Scale (1.0 best → 4.0 minimum pass)', 17, y + 8);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(...WHITE);
  doc.text(gc.german, 17, y + 22);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUTED);
  doc.text('German GPA', 46, y + 22);
  const gcLines = doc.splitTextToSize(gc.explanation, W - 38);
  doc.text(gcLines.slice(0, 2), 17, y + 30);
  y += 48;

  // Language cards
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...WHITE);
  doc.text('Language Assessment', 10, y); y += 6;
  const langCards = [
    { title: 'German Level', val: (profile.german || 'None').toUpperCase(), note: getGermanNote(profile.german) },
    { title: 'English Level', val: formatEnglishShort(profile.english), note: getEnglishNote(profile.english) },
  ];
  langCards.forEach((lc, i) => {
    const lx = 10 + i * 98;
    card(lx, y, 90, 30, null);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...MUTED);
    doc.text(lc.title.toUpperCase(), lx + 5, y + 7);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...GOLD);
    doc.text(lc.val, lx + 5, y + 16);
    const nLines = doc.splitTextToSize(lc.note, 80);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...MUTED);
    doc.text(nLines.slice(0, 2), lx + 5, y + 23);
  });
  y += 38;

  // Verdict
  const eligible = ['excellent', 'very_good', 'good'].includes(profile.grade);
  doc.setFillColor(eligible ? 10 : 18, eligible ? 26 : 18, eligible ? 18 : 10);
  doc.roundedRect(10, y, W - 20, 22, 2, 2, 'F');
  doc.setDrawColor(...(eligible ? GREEN : [251, 191, 36])); doc.setLineWidth(0.5);
  doc.roundedRect(10, y, W - 20, 22, 2, 2, 'S');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.setTextColor(...(eligible ? GREEN : [251, 191, 36]));
  doc.text(eligible ? '✓  You are eligible to apply to German universities' : '⚠  Additional preparation may be recommended', 17, y + 9);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUTED);
  doc.text(eligible
    ? 'Your academic profile meets core entry requirements for multiple German institutions.'
    : 'Consider a Studienkolleg (preparatory college) if direct admission is not possible.', 17, y + 17);

  // ================================================================
  // PAGE 3: MATCHED UNIVERSITIES
  // ================================================================
  y = addPage();
  y = sectionTitle('Section 2: Your Matched Universities', y);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...MUTED);
  const introText = `Based on your profile — ${profile.country}, ${formatGrade(profile.grade).split(' (')[0]}, ${profile.field} — here are your top ${top5.length} matches:`;
  doc.text(introText, 10, y, { maxWidth: W - 20 }); y += 9;

  top5.forEach((uni, i) => {
    if (y > 252) { y = addPage(); }
    const cH = 44;
    card(10, y, W - 20, cH, null);
    // Score progress bar (bottom of card)
    doc.setFillColor(...CARD2); doc.rect(10, y + cH - 2, W - 20, 2, 'F');
    doc.setFillColor(...GOLD);  doc.rect(10, y + cH - 2, (W - 20) * uni.score / 100, 2, 'F');
    // Rank badge
    doc.setFillColor(...GOLD); doc.circle(21, y + cH / 2, 6, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...BG);
    doc.text(String(i + 1), 21, y + cH / 2 + 3, { align: 'center' });
    // Name
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...WHITE);
    doc.text(uni.name, 31, y + 10);
    // City
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUTED);
    doc.text(`📍 ${uni.city}`, 31, y + 17);
    // Score badge
    doc.setFillColor(...GOLD); doc.roundedRect(W - 44, y + 4, 30, 11, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...BG);
    doc.text(`${uni.score}% Match`, W - 29, y + 11, { align: 'center' });
    // Why suited
    doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5); doc.setTextColor(...MUTED);
    const why = doc.splitTextToSize(getWhySuited(uni, profile), W - 55);
    doc.text(why.slice(0, 1), 31, y + 24);
    // Tags
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...DIM);
    doc.text(uni.tags.slice(0, 3).join(' · '), 31, y + 30);
    // Intake
    doc.setTextColor(...GOLD); doc.setFontSize(7);
    doc.text(`Intake: Oct (Winter) · Apr (Summer)   |   Apply: uni-assist.de or ${uni.website || 'university portal'}`, 31, y + 37);
    y += cH + 5;
  });

  if (unis.length > 5) {
    doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(...MUTED);
    doc.text(`+ ${unis.length - 5} more universities match your profile. Upgrade to Admission Service for the full list.`, 10, y);
  }

  // ================================================================
  // PAGE 4: APPLICATION GUIDE
  // ================================================================
  y = addPage();
  y = sectionTitle('Section 3: Step-by-Step Application Guide', y);

  const appSteps = [
    { n: '01', title: 'Prepare Your Documents', body: `For students from ${profile.country}: Certified copies of all academic transcripts and degree certificate. ${cd.documentsNote} Official German or English translation by a sworn German translator (beeidigter Übersetzer — find one at bdue.de). Valid passport copy. Biometric passport photos.` },
    { n: '02', title: 'Register on uni-assist.de', body: 'uni-assist is the central application portal used by 190+ German universities for international applicants. Go to uni-assist.de and create a free account. Upload your documents. Processing fee: €75 for the first university, €30 for each additional. uni-assist verifies your documents against the Anabin database.' },
    { n: '03', title: 'Apply Directly to the University (some)', body: 'Not all universities use uni-assist. TU Munich, LMU, RWTH Aachen and some others have their own portals. Always check the university\'s International Admissions page to confirm the correct application channel.' },
    { n: '04', title: 'Application Deadlines', body: 'Winter Semester (starts October): Deadline — 15 July. Summer Semester (starts April): Deadline — 15 January. These are typical dates; some programs have earlier internal deadlines. Always verify directly with the university website.' },
    { n: '05', title: 'After Your Application', body: 'Processing takes 4–8 weeks. If accepted, you receive a Zulassungsbescheid (admission letter). Enrol (immatrikulieren) before the stated deadline and pay the semester fee (typically €300–€400, includes public transport pass).' },
  ];

  appSteps.forEach((step) => {
    if (y > 256) { y = addPage(); }
    doc.setFillColor(...GOLD); doc.roundedRect(10, y, 14, 8, 1, 1, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...BG);
    doc.text(step.n, 17, y + 5.5, { align: 'center' });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...WHITE);
    doc.text(step.title, 28, y + 5.5);
    y += 10;
    const bLines = doc.splitTextToSize(step.body, W - 24);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...MUTED);
    doc.text(bLines, 14, y); y += bLines.length * 4.5 + 6;
  });

  // ================================================================
  // PAGE 5: BLOCKED ACCOUNT
  // ================================================================
  y = addPage();
  y = sectionTitle('Section 4: Blocked Account Guide', y);

  // Amount hero
  card(10, y, W - 20, 28, GOLD);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(28); doc.setTextColor(...GOLD);
  doc.text('€11,208', W / 2, y + 14, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUTED);
  doc.text('Required amount for one year · €934 released to you monthly after arrival', W / 2, y + 22, { align: 'center' });
  y += 34;

  // What is it
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...WHITE);
  doc.text('What is a Blocked Account?', 10, y); y += 5;
  const baDesc = 'A Sperrkonto (blocked account) is a special German bank account required for your student visa application. You deposit €11,208 which is frozen ("blocked") until you arrive in Germany, then released in monthly instalments of €934. This proves to the German embassy that you can financially support yourself during your studies.';
  const baLines = doc.splitTextToSize(baDesc, W - 20);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...MUTED);
  doc.text(baLines, 10, y); y += baLines.length * 4.5 + 8;

  // Provider table
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...WHITE);
  doc.text('Provider Comparison', 10, y); y += 6;
  // Table header
  doc.setFillColor(...CARD); doc.rect(10, y, W - 20, 9, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...MUTED);
  ['PROVIDER','SETUP FEE','PROCESSING','RATING'].forEach((h, i) => {
    doc.text(h, [14, 62, 108, W - 28][i], y + 6, { align: i === 3 ? 'right' : 'left' });
  });
  y += 9;
  const providers = [
    { name: 'Fintiba',   fee: '€89 + €4.90/mo', time: '2–5 days',  rec: true  },
    { name: 'Expatrio',  fee: '€69 + €4.90/mo', time: '1–3 days',  rec: false },
    { name: 'Coracle',   fee: '€99 + €4.90/mo', time: '3–7 days',  rec: false },
  ];
  providers.forEach((p) => {
    if (p.rec) { doc.setFillColor(16, 24, 36); } else { doc.setFillColor(...CARD2); }
    doc.rect(10, y, W - 20, 10, 'F');
    if (p.rec) { doc.setDrawColor(...GOLD); doc.setLineWidth(0.3); doc.rect(10, y, W - 20, 10, 'S'); }
    doc.setFont('helvetica', p.rec ? 'bold' : 'normal'); doc.setFontSize(8.5);
    doc.setTextColor(...(p.rec ? GOLD : WHITE)); doc.text(p.name, 14, y + 7);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...MUTED);
    doc.text(p.fee, 62, y + 7); doc.text(p.time, 108, y + 7);
    if (p.rec) {
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...GREEN);
      doc.text('★ Recommended', W - 14, y + 7, { align: 'right' });
    }
    y += 10;
  });
  y += 6;

  // Steps
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...WHITE);
  doc.text('How to Open (Fintiba — step by step)', 10, y); y += 6;
  const bSteps = [
    'Visit fintiba.com — click "Open Blocked Account".',
    'Complete identity verification (KYC) with your passport — takes ~5 minutes.',
    'Receive your IBAN within 2–5 business days by email.',
    'Transfer €11,208 from your home bank to the Fintiba IBAN.',
    'Fintiba sends you a confirmation certificate once funds are received.',
    'Include this certificate in your visa application.',
    'After arriving in Germany and visa activation, €934 is released to you each month.',
  ];
  bSteps.forEach((s, i) => {
    if (y > 270) { y = addPage(); }
    doc.setFillColor(...GOLD); doc.circle(15, y + 3, 3, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...BG);
    doc.text(String(i + 1), 15, y + 5.2, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...WHITE);
    doc.text(s, 21, y + 5);
    y += 8;
  });

  // ================================================================
  // PAGE 6: VISA GUIDE
  // ================================================================
  y = addPage();
  y = sectionTitle('Section 5: Visa Application Guide', y);

  // Embassy card
  accentCard(10, y, W - 20, 22, BLUE);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...WHITE);
  doc.text(`German Embassy / Consulate for ${profile.country}`, 17, y + 8);
  const emLines = doc.splitTextToSize(cd.visaEmbassy, W - 32);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...MUTED);
  doc.text(emLines.slice(0, 1), 17, y + 16);
  y += 28;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...GOLD);
  doc.text('Visa Type: National Visa (Type D) — Student Visa', 10, y); y += 6;
  const visaIntro = 'You must apply for a National Visa (Nationales Visum), NOT a Schengen tourist visa. It allows long-term stay in Germany for the purpose of study and can be extended to a residence permit once you arrive.';
  const viLines = doc.splitTextToSize(visaIntro, W - 20);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...MUTED);
  doc.text(viLines, 10, y); y += viLines.length * 4.5 + 8;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...WHITE);
  doc.text('Required Documents', 10, y); y += 6;
  const visaDocs = [
    'Valid passport (6+ months validity beyond intended stay)',
    'University admission letter (Zulassungsbescheid)',
    'Blocked account certificate — Fintiba/Expatrio (€11,208)',
    'Health insurance covering Germany (travel insurance until arrival)',
    'Biometric passport photos (35 × 45 mm)',
    'Proof of accommodation in Germany (for at least first months)',
    'Language certificate (German B2/C1 or English IELTS 6.5+)',
    'Completed visa application form (from embassy website)',
    'Visa application fee: €75',
    cd.additionalVisaDoc,
  ];
  visaDocs.forEach((d) => {
    if (y > 272) { y = addPage(); }
    doc.setFillColor(...GOLD); doc.rect(10, y + 1.5, 2.5, 2.5, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...WHITE);
    doc.text(d, 16, y + 4.5);
    y += 7.5;
  });
  y += 4;

  // Timeline
  if (y > 256) { y = addPage(); }
  accentCard(10, y, W - 20, 20, [251, 191, 36]);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(251, 191, 36);
  doc.text(`Expected Timeline for ${profile.country}: ${cd.visaTimeline}`, 17, y + 8);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...MUTED);
  doc.text('Book your appointment early — slots can fill up 4–8 weeks in advance.', 17, y + 15);

  // ================================================================
  // PAGE 7: LIVING IN GERMANY
  // ================================================================
  y = addPage();
  y = sectionTitle('Section 6: Living in Germany', y);

  doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...WHITE);
  doc.text('Monthly Cost Estimates by City (€)', 10, y); y += 6;

  const cols = ['City', 'Rent', 'Food', 'Transport', 'Misc', 'Total'];
  const costs = [
    ['Berlin',    '700–1,200', '250–350', '86',  '150–200', '1,200–1,800'],
    ['Munich',    '900–1,500', '280–380', '57',  '150–250', '1,400–2,200'],
    ['Hamburg',   '800–1,300', '260–360', '109', '150–200', '1,320–2,000'],
    ['Frankfurt', '800–1,300', '270–370', '87',  '150–200', '1,310–1,960'],
  ];
  const colW2 = (W - 20) / cols.length;
  doc.setFillColor(...CARD); doc.rect(10, y, W - 20, 9, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...MUTED);
  cols.forEach((c, i) => doc.text(c, 12 + i * colW2, y + 6.5));
  y += 9;
  costs.forEach((row, ri) => {
    if (ri % 2 === 0) { doc.setFillColor(...CARD); } else { doc.setFillColor(...CARD2); }
    doc.rect(10, y, W - 20, 10, 'F');
    row.forEach((cell, i) => {
      doc.setFont('helvetica', i === 0 ? 'bold' : 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...(i === 0 ? GOLD : (i === 5 ? WHITE : MUTED)));
      doc.text(cell, 12 + i * colW2, y + 7);
    });
    y += 10;
  });
  y += 8;

  // Accommodation tips
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...WHITE);
  doc.text('Accommodation Tips', 10, y); y += 6;
  const accTips = [
    '🏠  Studierendenwerk dormitory — cheapest option (€200–400/mo). Apply immediately after getting your admission letter.',
    '🤝  WG (Wohngemeinschaft / shared flat) — most common for students (€400–700/mo incl. utilities).',
    '🔍  Find rooms on: WG-Gesucht.de · StudiBnB · Immoscout24.de',
    '⚡  Always confirm if utilities (Nebenkosten) are included in rent before signing a contract.',
  ];
  accTips.forEach((tip) => {
    if (y > 265) { y = addPage(); }
    const tl = doc.splitTextToSize(tip, W - 20);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...MUTED);
    doc.text(tl, 10, y); y += tl.length * 4.8 + 3;
  });
  y += 4;

  // Health insurance
  if (y > 248) { y = addPage(); }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...WHITE);
  doc.text('Health Insurance (Pflichtversicherung)', 10, y); y += 4;
  accentCard(10, y, W - 20, 26, GREEN);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...GREEN);
  doc.text('Mandatory for all students in Germany', 17, y + 7);
  const hiText = 'Public health insurance (gesetzliche Krankenversicherung) costs ~€120/month for students under 30. Recommended: TK (Techniker Krankenkasse), AOK, Barmer. You must show proof of insurance before university enrolment.';
  const hiLines = doc.splitTextToSize(hiText, W - 34);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUTED);
  doc.text(hiLines, 17, y + 14);

  // ================================================================
  // PAGE 8: PERSONAL CHECKLIST
  // ================================================================
  y = addPage();
  y = sectionTitle('Section 7: Your Personal Checklist', y);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...MUTED);
  doc.text(`Personalised for ${profile.name} from ${profile.country} — ${profile.field}`, 10, y); y += 8;

  check.forEach((item, i) => {
    if (y > 264) { y = addPage(); }
    const iLines = doc.splitTextToSize(item.text, W - 46);
    const iH = Math.max(14, iLines.length * 5 + 7);
    if (i % 2 === 0) { doc.setFillColor(...CARD); } else { doc.setFillColor(...CARD2); }
    doc.roundedRect(10, y, W - 20, iH, 1.5, 1.5, 'F');
    // Checkbox
    doc.setDrawColor(...GOLD); doc.setLineWidth(0.4);
    doc.roundedRect(15, y + iH / 2 - 4, 7, 7, 1, 1, 'S');
    // Number
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...DIM);
    doc.text(String(i + 1).padStart(2, '0'), 25, y + 6);
    // Category
    const catCol = getCategoryColor(item.category, { muted: MUTED });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...catCol);
    doc.text(item.category.toUpperCase(), 33, y + 6);
    // Text
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...WHITE);
    doc.text(iLines, 25, y + 11);
    y += iH + 2;
  });

  // Final CTA
  if (y > 256) { y = addPage(); }
  y += 6;
  card(10, y, W - 20, 20, GOLD);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...GOLD);
  doc.text('Need expert help with your application?', W / 2, y + 8, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUTED);
  doc.text('Visit studypathde.com · Upgrade to Admission Service for full end-to-end support', W / 2, y + 15, { align: 'center' });

  doc.save(`StudyPathDE_Guide_${profile.name.replace(/\s+/g, '_')}.pdf`);
  showToast('Your personalised PDF guide is downloading!', 'success');
}

// ---- FORMAT HELPERS ----
function formatGrade(g) {
  const map = { excellent: 'Excellent (Top 10% / GPA 3.7+)', very_good: 'Very Good (GPA 3.3–3.6)', good: 'Good (GPA 2.7–3.2)', average: 'Average (GPA 2.0–2.6)', below_average: 'Below Average (< 2.0)' };
  return map[g] || g;
}

// ---- LEAD STORAGE (localStorage) ----
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
    position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%) translateY(10px)',
    padding: '14px 28px', borderRadius: '10px', zIndex: '9999',
    fontFamily: 'Space Grotesk, Inter, sans-serif', fontWeight: '600', fontSize: '0.9rem',
    whiteSpace: 'nowrap', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    background: type === 'error' ? 'rgba(239,68,68,0.95)' : type === 'success' ? 'rgba(34,197,94,0.95)' : 'rgba(212,168,67,0.95)',
    color: type === 'error' ? '#fff' : '#080b12',
    animation: 'fadeInUp 0.3s ease forwards',
  });
  document.body.appendChild(t);
  setTimeout(() => { t.style.animation = 'fadeOutDown 0.3s ease forwards'; setTimeout(() => t.remove(), 300); }, 3200);
}
