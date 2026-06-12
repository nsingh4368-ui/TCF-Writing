// ── app-profile-ui.js — Mobile nav, focus modal, profile system, reset, paste, init ──
function toggleMobileSidebar(){
const s=document.querySelector('.sidebar');
const o=document.getElementById('sidebarOverlay');
const open=s.classList.toggle('mobile-open');
o.classList.toggle('mobile-open',open);
}
function closeMobileSidebar(){
document.querySelector('.sidebar').classList.remove('mobile-open');
document.getElementById('sidebarOverlay').classList.remove('mobile-open');
}
function setPresetSize(size){
document.documentElement.style.setProperty('--editor-font-size',size+'px');
document.getElementById('fontSizeSlider').value=size;
document.getElementById('fontSizeValue').textContent=size+'px';
updatePresetButtons(size);
SV('tcf_editor_font_size',size);
}
function updatePresetButtons(size){
document.querySelectorAll('.preset-btn').forEach(btn=>{
btn.classList.remove('active');
const btnSize=btn.textContent.includes('Petit')?12:btn.textContent.includes('Grand')?18:15;
if(btnSize===parseInt(size)){btn.classList.add('active');}
});
}
function initFontSizeControls(){
const slider=document.getElementById('fontSizeSlider');
if(slider){
slider.addEventListener('input',(e)=>{
const size=e.target.value;
document.documentElement.style.setProperty('--editor-font-size',size+'px');
document.getElementById('fontSizeValue').textContent=size+'px';
updatePresetButtons(parseInt(size));
});
}
const saved=LS('tcf_editor_font_size',null);
if(saved){setPresetSize(saved);}
}
function showFontSizeGroup(){
const group=document.getElementById('fontSizeGroup');
if(group){group.classList.add('active');}
}
function hideFontSizeGroup(){
const group=document.getElementById('fontSizeGroup');
if(group){group.classList.remove('active');}
}
let focusSubjects=[];
function openFocusModal(){
const modal=document.getElementById('focusModal');
if(modal){
modal.classList.add('active');
renderSubjectOptions();
}
}
function closeFocusModal(){
const modal=document.getElementById('focusModal');
if(modal){modal.classList.remove('active');}
}
function renderSubjectOptions(){
const container=document.getElementById('subjectOptions');
if(!container) return;
container.innerHTML=`
<div class="subject-option selected" onclick="selectSubjectOption(this,'mine')">
<div class="subject-option-title">📝 Mes Sujets</div>
<div class="subject-option-desc">Rédiger sur vos sujets sauvegardés</div>
</div>
<div class="subject-option" onclick="selectSubjectOption(this,'bank')">
<div class="subject-option-title">🏦 Choisir depuis la banque</div>
<div class="subject-option-desc">Sélectionner des sujets disponibles</div>
</div>
`;
}
function selectSubjectOption(el,type){
document.querySelectorAll('.subject-option').forEach(o=>o.classList.remove('selected'));
el.classList.add('selected');
const listContainer=document.getElementById('selectedSubjectsList');
if(type==='bank'){
if(listContainer) listContainer.style.display='block';
renderSubjectBank();
}else{
if(listContainer) listContainer.style.display='none';
focusSubjects=[];
}
}
function renderSubjectBank(){
const container=document.getElementById('subjectListContainer');
if(!container) return;
const bankSubjects=[
{id:1,title:'Écrire une lettre formelle'},
{id:2,title:'Rédiger un email professionnel'},
{id:3,title:'Décrire une expérience personnelle'},
{id:4,title:'Argumenter une opinion'},
{id:5,title:'Résumer un document'}
];
container.innerHTML=bankSubjects.map(s=>`
<div class="subject-item" onclick="toggleFocusSubject(${s.id},this)">
✓ ${s.title}
</div>
`).join('');
}
function toggleFocusSubject(id,el){
el.classList.toggle('selected');
if(el.classList.contains('selected')){
if(!focusSubjects.includes(id)) focusSubjects.push(id);
}else{
focusSubjects=focusSubjects.filter(s=>s!==id);
}
}
function startFocusMode(){
const selected=document.querySelector('.subject-option.selected');
if(!selected) return;
const type=selected.querySelector('.subject-option-title').textContent.includes('Mes')?'mine':'bank';
if(type==='bank'&&focusSubjects.length===0){
alert('Veuillez sélectionner au moins un sujet.');
return;
}
document.body.classList.add('focus-active');
closeFocusModal();
showFontSizeGroup();
}
function exitFocusMode(){
if(confirm('Quitter le mode concentration ?')){
document.body.classList.remove('focus-active');
hideFontSizeGroup();
}
}
rebuildCustomConnsSRS();
if(productions.length>100||history.length>200){
setTimeout(()=>{
if(!sessionStorage.getItem('backup_reminded')){
sessionStorage.setItem('backup_reminded','1');
const msg='💡 Vous avez '+productions.length+' production(s) sauvegardée(s) !\n\nPensez à télécharger votre sauvegarde complète depuis le menu latéral (💾 Sauvegarder tout mon historique) pour ne rien perdre.';
console.log(msg);
}
},3000);
}
document.addEventListener('DOMContentLoaded',()=>{
initFontSizeControls();
});
(function(){
if(!document.getElementById('fontSizeGroup')){
const html=`<div class="font-size-group" id="fontSizeGroup"><div class="font-label">Taille de police</div><div class="font-slider-row"><input type="range" class="font-slider" id="fontSizeSlider" min="12" max="24" value="15" step="1"><span class="font-value" id="fontSizeValue">15px</span></div><div class="preset-sizes"><button class="preset-btn" onclick="setPresetSize(12)">Petit</button><button class="preset-btn" onclick="setPresetSize(15)">Normal</button><button class="preset-btn" onclick="setPresetSize(18)">Grand</button></div></div><div class="focus-modal" id="focusModal"><div class="focus-modal-content"><div class="focus-modal-title">🎯 Mode Concentration</div><div class="focus-modal-desc">Choisissez vos sujets pour ce mode de rédaction sans distractions</div><div class="subject-options" id="subjectOptions"></div><div id="selectedSubjectsList" style="display:none;"><div class="font-label">Sujets sélectionnés:</div><div class="subject-list" id="subjectListContainer"></div></div><div class="focus-modal-actions"><button class="btn-ghost" onclick="closeFocusModal()">Annuler</button><button class="btn-primary" onclick="startFocusMode()">Démarrer</button></div></div></div>`;
document.body.insertAdjacentHTML('beforeend',html);
}
})();
/* ============================================================
   FEATURE PATCH v7 — Multi-Profile · Reset · SpellCheck ·
   Paste Import · TXT/PDF Profile Import
   ============================================================ */

// ── Profile system ──────────────────────────────────────────
const PROFILE_LIST_KEY = 'tcf_profile_list';
const ACTIVE_PROFILE_KEY = 'tcf_active_profile_id';

function getAllProfiles() {
  return LS(PROFILE_LIST_KEY, []);
}
function getActiveProfileId() {
  return localStorage.getItem(ACTIVE_PROFILE_KEY) || null;
}
function setActiveProfileId(id) {
  localStorage.setItem(ACTIVE_PROFILE_KEY, id);
}

// Per-profile LS key helper
function PK(key) {
  const id = getActiveProfileId();
  return id ? key + '_p' + id : key;
}

function reloadDataForProfile() {
  favorites = LS(PK('tcf_favorites'), []);
  revisits = LS(PK('tcf_revisits'), []);
  history = LS(PK('tcf_history'), []);
  productions = LS(PK('tcf_productions'), []);
  vocabList = LS(PK('tcf_vocab'), []);
  savedSentences = LS(PK('tcf_sentences'), []);
  myErrors = LS(PK('tcf_errors'), []);
  srs = LS(PK('tcf_srs'), {});
  srsV = LS(PK('tcf_srs_vocab'), {});
  streak = LS(PK('tcf_streak'), { lastDate: '', cur: 0, best: 0, days: [] });
  profile = LS(PK('tcf_profile'), {});
  doneCombos = LS(PK('tcf_done_combos'), {});
  examAnswers = LS(PK('tcf_exam_answers'), { 1: '', 2: '', 3: '' });
  presetAnswers = LS(PK('tcf_presets'), []);
  customConns = LS(PK('tcf_custom_conns'), []);
  readingDocs = LS(PK('tcf_reading_docs'), []);
  customBank = mergeBanks(DEFAULT_SUBJECT_BANK, LS(PK('tcf_custom_bank'), {}));
}

function saveSV_profile(key, val) {
  SV(PK(key), val);
}

// Override SV to be profile-aware for data keys
const DATA_KEYS = new Set([
  'tcf_favorites','tcf_revisits','tcf_history','tcf_productions',
  'tcf_vocab','tcf_sentences','tcf_errors','tcf_srs','tcf_srs_vocab',
  'tcf_streak','tcf_profile','tcf_done_combos','tcf_exam_answers',
  'tcf_presets','tcf_custom_conns','tcf_reading_docs','tcf_custom_bank'
]);
const _origSV = SV;
window.SV = function(k, v) {
  if (DATA_KEYS.has(k) && getActiveProfileId()) {
    _origSV(PK(k), v);
  } else {
    _origSV(k, v);
  }
};

function renderProfileSwitcher() {
  const profiles = getAllProfiles();
  const activeId = getActiveProfileId();
  const container = document.getElementById('profileSwitcherList');
  if (!container) return;

  if (!profiles.length) {
    container.innerHTML = '<div class="muted" style="font-size:12px;padding:6px 4px">Aucun profil. Créez-en un ci-dessous.</div>';
    return;
  }
  container.innerHTML = profiles.map(p => `
    <div class="profile-pill ${p.id === activeId ? 'active' : ''}" onclick="switchToProfile('${p.id}')">
      <div class="pp-avatar">${(p.prenom || p.nom || '?')[0].toUpperCase()}</div>
      <div class="pp-info">
        <div class="pp-name">${escHtml(((p.prenom || '') + ' ' + (p.nom || '')).trim() || 'Sans nom')}</div>
        <div class="pp-obj">${escHtml(p.objectif || 'B2')}</div>
      </div>
      ${profiles.length > 1 ? `<button class="pp-del" onclick="event.stopPropagation();deleteProfile('${p.id}')" title="Supprimer ce profil">×</button>` : ''}
    </div>
  `).join('');
}

function createProfile() {
  const prenom = (document.getElementById('newProfilePrenom')?.value || '').trim();
  const nom = (document.getElementById('newProfileNom')?.value || '').trim();
  const objectif = document.getElementById('newProfileObjectif')?.value || 'B2';
  if (!prenom && !nom) { alert('Entrez au moins un prénom ou un nom.'); return; }

  const profiles = getAllProfiles();
  const id = 'p' + Date.now();
  const newP = { id, prenom, nom, objectif, createdAt: todayStr() };
  profiles.push(newP);
  SV(PROFILE_LIST_KEY, profiles);

  // Initialize profile data key
  _origSV('tcf_profile_p' + id, newP);

  if (!getActiveProfileId()) setActiveProfileId(id);
  switchToProfile(id);

  if (document.getElementById('newProfilePrenom')) document.getElementById('newProfilePrenom').value = '';
  if (document.getElementById('newProfileNom')) document.getElementById('newProfileNom').value = '';
}

function switchToProfile(id) {
  setActiveProfileId(id);
  reloadDataForProfile();
  rebuildCustomConnsSRS();
  applyProfile();
  renderStreak();
  refreshBadges();
  renderProfileSwitcher();
  renderActivePill();
  // Refresh current view
  const activeNav = document.querySelector('.nav-item.active');
  if (activeNav) {
    const v = activeNav.id?.replace('nav-', '');
    if (v) showView(v);
  }
}

function deleteProfile(id) {
  const profiles = getAllProfiles();
  if (profiles.length <= 1) { alert('Vous ne pouvez pas supprimer le seul profil existant.'); return; }
  const p = profiles.find(x => x.id === id);
  const name = ((p?.prenom || '') + ' ' + (p?.nom || '')).trim() || 'ce profil';
  if (!confirm(`Supprimer ${name} ?\n\nToutes les données de ce profil seront perdues.`)) return;

  // Delete all profile-specific LS keys
  const keysToDelete = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.endsWith('_p' + id)) keysToDelete.push(k);
  }
  keysToDelete.forEach(k => localStorage.removeItem(k));

  const remaining = profiles.filter(x => x.id !== id);
  _origSV(PROFILE_LIST_KEY, remaining);

  if (getActiveProfileId() === id) switchToProfile(remaining[0].id);
  else renderProfileSwitcher();
}

function renderActivePill() {
  const id = getActiveProfileId();
  const profiles = getAllProfiles();
  const p = profiles.find(x => x.id === id);
  const pill = document.getElementById('activeProfilePill');
  if (!pill) return;
  if (p) {
    const name = ((p.prenom || '') + ' ' + (p.nom || '')).trim() || 'Profil';
    pill.textContent = '👤 ' + name;
    pill.style.display = 'inline-flex';
  } else {
    pill.style.display = 'none';
  }
}

// Bootstrap profiles: if no profile list yet, migrate existing data to a default profile
(function bootstrapProfiles() {
  const profiles = getAllProfiles();
  if (!profiles.length) {
    const id = 'p' + Date.now();
    const existingProfile = LS('tcf_profile', {});
    const p = { id, prenom: existingProfile.prenom || '', nom: existingProfile.nom || '', objectif: existingProfile.objectif || 'B2', createdAt: todayStr() };
    _origSV(PROFILE_LIST_KEY, [p]);
    setActiveProfileId(id);

    // Migrate all existing tcf_ keys to profile-specific keys
    const migKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('tcf_') && !k.startsWith('tcf_profile_list') && !k.startsWith('tcf_active_profile')) {
        migKeys.push(k);
      }
    }
    migKeys.forEach(k => {
      const val = localStorage.getItem(k);
      if (val !== null) localStorage.setItem(k + '_p' + id, val);
    });
  }
})();

// ── RESET everything ─────────────────────────────────────────
function openResetModal() {
  document.getElementById('resetModal').classList.add('active');
}
function closeResetModal() {
  document.getElementById('resetModal').classList.remove('active');
}

function executeReset() {
  const keepVocab = document.getElementById('resetKeepVocab')?.checked;
  const keepErrors = document.getElementById('resetKeepErrors')?.checked;
  const keepConnectors = document.getElementById('resetKeepConn')?.checked;
  const keepProductions = document.getElementById('resetKeepProd')?.checked;
  const keepAllProfiles = document.getElementById('resetKeepProfiles')?.checked;

  const id = getActiveProfileId();

  // Snapshot things to keep
  const savedVocab = keepVocab ? [...vocabList] : [];
  const savedErrors = keepErrors ? [...myErrors] : [];
  const savedConns = keepConnectors ? [...customConns] : [];
  const savedProds = keepProductions ? [...productions] : [];

  // Wipe all tcf_ keys for active profile (also drafts/timer/font which never get profile suffix)
  const keysToDelete = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    if (k.startsWith('tcf_draft_') || k === 'tcf_timer' || k === 'tcf_font') {
      keysToDelete.push(k); continue;
    }
    if (k.startsWith('tcf_') && (id ? k.includes('_p' + id) : true)) {
      keysToDelete.push(k);
    }
  }
  keysToDelete.forEach(k => localStorage.removeItem(k));

  // Wipe all profiles if not keeping
  if (!keepAllProfiles) {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && (k === PROFILE_LIST_KEY || k === ACTIVE_PROFILE_KEY || (k.startsWith('tcf_profile_p')))) {
        localStorage.removeItem(k);
      }
    }
    _origSV(PROFILE_LIST_KEY, []);
    localStorage.removeItem(ACTIVE_PROFILE_KEY);
  }

  // Restore kept data
  if (savedVocab.length) SV('tcf_vocab', savedVocab);
  if (savedErrors.length) SV('tcf_errors', savedErrors);
  if (savedConns.length) SV('tcf_custom_conns', savedConns);
  if (savedProds.length) SV('tcf_productions', savedProds);

  closeResetModal();
  alert('✅ Réinitialisation effectuée. La page va se recharger.');
  location.reload();
}

// ── SPELL CHECK → Error Recycling ───────────────────────────
// Uses browser's built-in spellcheck + a French common-error list
const COMMON_SPELLING_ERRORS = [
  ['apeller', 'appeler'], ['occassion', 'occasion'], ['adresse', null],
  ['envoyez-moi', null], ['acueillir', 'accueillir'], ['aquérir', 'acquérir'],
  ['aparaître', 'apparaître'], ['apporter', null], ['batiment', 'bâtiment'],
  ['chauffer', null], ['consielle', 'conseille'], ['developper', 'développer'],
  ['diference', 'différence'], ['ecrire', 'écrire'], ['etudier', 'étudier'],
  ['evenement', 'événement'], ['finalement', null], ['generalement', 'généralement'],
  ['importants', null], ['interet', 'intérêt'], ['langague', 'langage'],
  ['malgres', 'malgré'], ['necessaire', 'nécessaire'], ['nommbre', 'nombre'],
  ['normalement', null], ['nothingelse', null], ['ou bien', null],
  ['parmis', 'parmi'], ['particullier', 'particulier'], ['plutôt', null],
  ['probablement', null], ['proffessionnel', 'professionnel'], ['quelquechose', 'quelque chose'],
  ['recement', 'récemment'], ['resoudre', 'résoudre'], ['succeeder', 'succéder'],
  ['sujet principal', null], ['sympa', null], ['trés', 'très'],
  ['unne', 'une'], ['visiblement', null], ['vraiement', 'vraiment']
];

function runSpellCheck() {
  const t = (document.getElementById('editor')?.value || '').toLowerCase();
  if (!t.trim()) return;
  let found = 0;
  COMMON_SPELLING_ERRORS.forEach(([wrong, right]) => {
    if (right && t.includes(wrong.toLowerCase())) {
      if (!myErrors.some(e => e.wrong.toLowerCase() === wrong.toLowerCase())) {
        myErrors.push({ wrong, right, addedAt: todayStr(), auto: true, source: 'spellcheck' });
        found++;
      }
    }
  });
  if (found) {
    SV('tcf_errors', myErrors);
    buildErrorsList();
    renderErrorsPanel();
    refreshBadges();
    showSpellBanner(found);
  }
}

function showSpellBanner(n) {
  const b = document.getElementById('spellBanner');
  if (!b) return;
  b.textContent = `🔤 ${n} erreur(s) orthographique(s) recyclée(s) → ♻️ Erreurs`;
  b.style.display = 'block';
  setTimeout(() => { b.style.display = 'none'; }, 4000);
}

// Hook spell check into analysis
const _origRunAnalysis = window.runAnalysis || runAnalysis;
window.runAnalysis = function() {
  _origRunAnalysis();
  runSpellCheck();
};

// ── PASTE BOX for vocab / errors / connectors ─────────────
function parsePasteVocab(text) {
  return parseTxtVocab(text);
}
function parsePasteErrors(text) {
  return parseTxtErrors(text);
}
function parsePasteConnectors(text) {
  return parseTxtConnectors(text);
}

function applyPaste(type) {
  const box = document.getElementById('pasteBox_' + type);
  if (!box) return;
  const text = box.value.trim();
  if (!text) { alert('La zone de saisie est vide.'); return; }
  try {
    let data, count;
    if (type === 'vocab') {
      data = parsePasteVocab(text); applyImportVocab(data); count = data.length;
    } else if (type === 'errors') {
      data = parsePasteErrors(text); applyImportErrors(data); count = data.length;
    } else if (type === 'connectors') {
      data = parsePasteConnectors(text); applyImportConnectors(data); count = data.length;
    }
    box.value = '';
    showPasteFeedback(type, true, '✅ ' + count + ' entrée(s) importée(s) avec succès.');
  } catch (e) {
    showPasteFeedback(type, false, '❌ ' + e.message);
  }
}

function showPasteFeedback(type, ok, msg) {
  const fb = document.getElementById('pasteFeedback_' + type);
  if (!fb) return;
  fb.textContent = msg;
  fb.className = 'paste-feedback ' + (ok ? 'ok' : 'err');
  fb.style.display = 'block';
  setTimeout(() => { fb.style.display = 'none'; }, 4000);
}

// ── Profile export as TXT (and import) ───────────────────────
function exportProfileTXT() {
  const id = getActiveProfileId();
  const allKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && (id ? k.endsWith('_p' + id) : k.startsWith('tcf_'))) allKeys.push(k);
  }
  const backup = { version: 'v7-profile', exportedAt: new Date().toISOString(), profileId: id, data: {} };
  allKeys.forEach(k => {
    try { backup.data[k] = JSON.parse(localStorage.getItem(k)); }
    catch { backup.data[k] = localStorage.getItem(k); }
  });
  // Also export profile meta
  const profiles = getAllProfiles();
  const p = profiles.find(x => x.id === id);
  if (p) backup.profileMeta = p;

  const fname = 'TCF_profil_' + ((p?.prenom || 'export') + '_' + todayStr()).replace(/\s+/g, '_') + '.txt';
  dl(new Blob([JSON.stringify(backup, null, 2)], { type: 'text/plain;charset=utf-8' }), fname);
  saveHistory('💾 Export profil TXT');
}

function importProfileTXT() {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = '.txt,.pdf';
  inp.onchange = () => {
    const f = inp.files[0];
    if (!f) return;
    if (f.name.endsWith('.pdf')) {
      alert('⚠️ L\'import de profil PDF extrait le texte brut. Assurez-vous que c\'est un fichier exporté par TCF Studio.');
    }
    const r = new FileReader();
    r.onload = () => {
      try {
        const raw = r.result;
        // Try JSON parse (our format)
        let bk;
        try { bk = JSON.parse(raw); } catch { bk = null; }

        if (bk && bk.data) {
          // It's a proper profile backup
          let count = 0;
          Object.keys(bk.data).forEach(k => {
            const val = typeof bk.data[k] === 'string' ? bk.data[k] : JSON.stringify(bk.data[k]);
            localStorage.setItem(k, val);
            count++;
          });

          // Register profile if not already there
          if (bk.profileMeta) {
            const profiles = getAllProfiles();
            if (!profiles.find(p => p.id === bk.profileMeta.id)) {
              profiles.push(bk.profileMeta);
              _origSV(PROFILE_LIST_KEY, profiles);
            }
            setActiveProfileId(bk.profileMeta.id);
          }
          alert('✅ Profil importé ! ' + count + ' clés restaurées.\nLa page va se recharger.');
          location.reload();
        } else {
          // Plain text backup (old format without profile wrapper)
          let plain;
          try { plain = JSON.parse(raw); } catch { plain = null; }
          if (plain) {
            const data = plain.data || plain;
            let count = 0;
            Object.keys(data).forEach(k => {
              if (k.startsWith('tcf_')) {
                const val = typeof data[k] === 'string' ? data[k] : JSON.stringify(data[k]);
                localStorage.setItem(PK(k), val);
                count++;
              }
            });
            alert('✅ ' + count + ' clés importées depuis la sauvegarde.\nLa page va se recharger.');
            location.reload();
          } else {
            alert('❌ Format de fichier non reconnu. Utilisez un fichier exporté par TCF Studio.');
          }
        }
      } catch (e) {
        alert('❌ Erreur lors de l\'import : ' + e.message);
      }
    };
    r.readAsText(f, 'UTF-8');
  };
  inp.click();
}

// ── Inject new UI elements ────────────────────────────────────
function injectNewUI() {
  // 1) Profile switcher panel in sidebar (after brand)
  const brand = document.querySelector('.brand');
  if (brand && !document.getElementById('profileSwitcherBar')) {
    const bar = document.createElement('div');
    bar.id = 'profileSwitcherBar';
    bar.className = 'profile-switcher-bar';
    bar.innerHTML = `
      <div class="psb-header" onclick="toggleProfilePanel()">
        <span id="activeProfilePill" class="active-profile-pill"></span>
        <span class="psb-arrow" id="psbArrow">▾</span>
      </div>
      <div id="profilePanel" class="profile-panel" style="display:none">
        <div id="profileSwitcherList"></div>
        <div class="new-profile-form">
          <input id="newProfilePrenom" class="ipt" placeholder="Prénom" style="margin-bottom:5px">
          <input id="newProfileNom" class="ipt" placeholder="Nom" style="margin-bottom:5px">
          <select id="newProfileObjectif" class="ipt" style="margin-bottom:8px">
            <option value="B1">Objectif B1</option>
            <option value="B2" selected>Objectif B2</option>
            <option value="C1">Objectif C1</option>
          </select>
          <button class="btn btn-primary" style="margin-bottom:4px" onclick="createProfile()">➕ Nouveau profil</button>
          <div style="display:flex;gap:5px">
            <button class="btn btn-ghost btn-sm" style="flex:1" onclick="exportProfileTXT()">⬇ Exporter profil</button>
            <button class="btn btn-ghost btn-sm" style="flex:1" onclick="importProfileTXT()">⬆ Importer (.txt/.pdf)</button>
          </div>
        </div>
      </div>`;
    brand.insertAdjacentElement('afterend', bar);
  }

  // 2) Reset button in sidebar (bottom of scroll area)
  if (!document.getElementById('resetAllBtn')) {
    const scroll = document.querySelector('.sidebar-scroll');
    if (scroll) {
      const resetBtn = document.createElement('div');
      resetBtn.innerHTML = `<hr style="border:none;border-top:1px solid var(--border);margin:12px 0">
        <button class="btn" id="resetAllBtn" onclick="openResetModal()" style="background:linear-gradient(135deg,#dc2626,#b91c1c);color:#fff;border:none;margin-bottom:6px">
          🗑 Réinitialiser tout
        </button>`;
      scroll.appendChild(resetBtn);
    }
  }

  // 3) Reset modal
  if (!document.getElementById('resetModal')) {
    const m = document.createElement('div');
    m.innerHTML = `
    <div class="reset-modal-overlay" id="resetModal">
      <div class="reset-modal">
        <h2 style="font-size:18px;font-weight:800;margin-bottom:6px">🗑 Réinitialisation complète</h2>
        <p class="muted" style="margin-bottom:16px">Que souhaitez-vous <b>conserver</b> avant de tout effacer ?</p>
        <div class="reset-option"><label><input type="checkbox" id="resetKeepVocab"> Conserver mon vocabulaire (${vocabList.length} mots)</label></div>
        <div class="reset-option"><label><input type="checkbox" id="resetKeepErrors"> Conserver mes erreurs recyclées (${myErrors.length})</label></div>
        <div class="reset-option"><label><input type="checkbox" id="resetKeepConn"> Conserver mes connecteurs personnels (${customConns.length})</label></div>
        <div class="reset-option"><label><input type="checkbox" id="resetKeepProd"> Conserver mes productions (${productions.length})</label></div>
        <div class="reset-option"><label><input type="checkbox" id="resetKeepProfiles" checked> Conserver tous les profils</label></div>
        <div style="background:#fee2e2;border:1px solid #fca5a5;border-radius:10px;padding:11px 13px;margin:14px 0;font-size:12.5px;color:#991b1b">
          ⚠️ Tout ce qui n'est pas coché sera <b>définitivement supprimé</b>. Cette action est irréversible.
        </div>
        <div class="btn-row">
          <button class="btn" style="background:#dc2626;color:#fff;border:none;flex:1" onclick="executeReset()">🗑 Tout effacer</button>
          <button class="btn btn-ghost" style="flex:1" onclick="closeResetModal()">Annuler</button>
        </div>
      </div>
    </div>`;
    document.body.appendChild(m.firstElementChild);
  }

  // 4) Spell check banner (near editor)
  if (!document.getElementById('spellBanner')) {
    const editor = document.getElementById('editorCard');
    if (editor) {
      const b = document.createElement('div');
      b.id = 'spellBanner';
      b.className = 'spell-banner';
      b.style.display = 'none';
      editor.prepend(b);
    }
  }

  // 5) Paste boxes for vocab view
  injectPasteBoxes();
}

function injectPasteBoxes() {
  // Vocab paste box — inject into vocab list tab
  const vocabListTab = document.getElementById('vtab-list');
  if (vocabListTab && !document.getElementById('pasteBox_vocab')) {
    const box = document.createElement('div');
    box.className = 'card paste-import-card';
    box.style.marginBottom = '12px';
    box.innerHTML = `
      <div class="h3" style="margin-bottom:8px">📋 Coller du vocabulaire</div>
      <p class="muted" style="margin-bottom:8px">Collez plusieurs mots d'un coup — <b>un par ligne</b>. Format : <code>mot — définition [thème]</code></p>
      <textarea id="pasteBox_vocab" class="editor-area" style="min-height:90px;font-size:12px;font-family:monospace" placeholder="néanmoins — nevertheless [Connecteurs]&#10;la croissance — growth [Économie]&#10;bienveillant — kind, benevolent"></textarea>
      <div class="btn-row" style="margin-top:8px">
        <button class="btn btn-primary btn-sm" onclick="applyPaste('vocab')">✅ Importer la saisie</button>
        <label class="btn btn-ghost btn-sm" style="cursor:pointer">📁 Fichier TXT<input type="file" accept=".txt" style="display:none" onchange="importVocabTXT(this)"></label>
      </div>
      <div id="pasteFeedback_vocab" class="paste-feedback" style="display:none"></div>`;
    vocabListTab.prepend(box);
  }

  // Errors paste box — inject into errors view
  const errView = document.getElementById('view-errors');
  if (errView && !document.getElementById('pasteBox_errors')) {
    const listPane = document.getElementById('errListPane') || errView.querySelector('.card');
    const box = document.createElement('div');
    box.className = 'card paste-import-card';
    box.style.marginBottom = '12px';
    box.innerHTML = `
      <div class="h3" style="margin-bottom:8px">📋 Coller des erreurs</div>
      <p class="muted" style="margin-bottom:8px">Format : <code>erreur — correction</code> (une par ligne)</p>
      <textarea id="pasteBox_errors" class="editor-area" style="min-height:80px;font-size:12px;font-family:monospace" placeholder="trés — très&#10;parmis — parmi&#10;apeller — appeler"></textarea>
      <div class="btn-row" style="margin-top:8px">
        <button class="btn btn-primary btn-sm" onclick="applyPaste('errors')">✅ Importer la saisie</button>
        <label class="btn btn-ghost btn-sm" style="cursor:pointer">📁 Fichier TXT<input type="file" accept=".txt" style="display:none" onchange="importErrorsTXT(this)"></label>
      </div>
      <div id="pasteFeedback_errors" class="paste-feedback" style="display:none"></div>`;
    if (listPane) listPane.prepend(box);
    else errView.prepend(box);
  }

  // Connectors paste box — inject into connectors import tab
  const connImportTab = document.getElementById('ctab-import');
  if (connImportTab && !document.getElementById('pasteBox_connectors')) {
    const box = document.createElement('div');
    box.className = 'card paste-import-card';
    box.style.marginBottom = '12px';
    box.innerHTML = `
      <div class="h3" style="margin-bottom:8px">📋 Coller des connecteurs</div>
      <p class="muted" style="margin-bottom:8px">Format : <code>connecteur — sens/usage</code> (une par ligne)<br>Catégorie optionnelle : ligne <code>[Nom de catégorie]</code></p>
      <textarea id="pasteBox_connectors" class="editor-area" style="min-height:80px;font-size:12px;font-family:monospace" placeholder="[Opposition]&#10;toutefois — however&#10;néanmoins — nonetheless&#10;[Cause]&#10;puisque — since/because"></textarea>
      <div class="btn-row" style="margin-top:8px">
        <button class="btn btn-primary btn-sm" onclick="applyPaste('connectors')">✅ Importer la saisie</button>
        <label class="btn btn-ghost btn-sm" style="cursor:pointer">📁 Fichier TXT<input type="file" accept=".txt" style="display:none" onchange="importConnectorsTXT(this)"></label>
      </div>
      <div id="pasteFeedback_connectors" class="paste-feedback" style="display:none"></div>`;
    connImportTab.prepend(box);
  }
}

function toggleProfilePanel() {
  const panel = document.getElementById('profilePanel');
  const arrow = document.getElementById('psbArrow');
  if (!panel) return;
  const open = panel.style.display === 'none';
  panel.style.display = open ? 'block' : 'none';
  if (arrow) arrow.textContent = open ? '▴' : '▾';
  if (open) renderProfileSwitcher();
}

// ── Init on DOMContentLoaded ──────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  reloadDataForProfile();
  injectNewUI();
  renderActivePill();
  renderProfileSwitcher();

  // Patch SV for profile-aware writes (re-wire data LS calls)
  // Patching already done above; this just triggers initial display
  rebuildCustomConnsSRS();
  applyProfile();
  renderStreak();
  refreshBadges();
});
