// ── app-data.js — Backup, import/export modals, reading, presets, custom connectors ──
function downloadFullBackup(){
const allKeys=[
'tcf_productions','tcf_vocab','tcf_errors','tcf_favorites','tcf_revisits',
'tcf_history','tcf_streak','tcf_srs','tcf_srs_vocab','tcf_profile',
'tcf_custom_bank','tcf_exam_answers','tcf_sentences','tcf_presets',
'tcf_reading_docs','tcf_custom_conns'
];
const backup={version:'v6',exportedAt:new Date().toISOString(),data:{}};
for(let i=0;i<localStorage.length;i++){
const k=localStorage.key(i);
if(k&&k.startsWith('tcf_')){
try{backup.data[k]=JSON.parse(localStorage.getItem(k));}
catch{backup.data[k]=localStorage.getItem(k);}
}
}
const fname='TCF_backup_'+new Date().toISOString().slice(0,10)+'.txt';
dl(new Blob([JSON.stringify(backup,null,2)],{type:'text/plain;charset=utf-8'}),fname);
saveHistory('💾 Sauvegarde complète téléchargée');
alert('✅ Sauvegarde téléchargée !\nFichier : '+fname+'\n\nGardez ce fichier précieusement — il contient toutes vos données.');
}
function restoreFromBackup(){
const inp=document.createElement('input');
inp.type='file';inp.accept='.txt';
inp.onchange=()=>{
const f=inp.files[0];if(!f)return;
const r=new FileReader();
r.onload=()=>{
try{
const bk=JSON.parse(r.result);
const data=bk.data||bk;
let count=0;
Object.keys(data).forEach(k=>{
if(k.startsWith('tcf_')){
const val=typeof data[k]==='string'?data[k]:JSON.stringify(data[k]);
localStorage.setItem(k,val);
count++;
}
});
alert('✅ Restauration réussie !\n'+count+' clés restaurées.\n\nLa page va se recharger.');
location.reload();
}catch(e){alert('❌ Fichier invalide. Assurez-vous d\'utiliser un fichier de sauvegarde TCF Studio.');} };
r.readAsText(f);
};
inp.click();
}
let importModalType='';
let importParsedData=null;
const IMPORT_CONFIGS={
vocab:{
title:'📥 Importer vocabulaire TXT',
desc:'Importez une liste de mots depuis un fichier texte. Chaque ligne = un mot.',
format:`Format accepté (une ligne par mot) :
mot — définition [thème]
apprendre — to learn [Éducation]
néanmoins — nevertheless [Connecteurs]
la croissance — growth [Économie]
— Séparateur : « — » ou « : » ou tabulation
— Le thème entre [ ] est optionnel
— Les lignes vides et commentaires (#) sont ignorées`,
parse: parseTxtVocab,
apply: applyImportVocab
},
errors:{
title:'📥 Importer erreurs recyclées TXT',
desc:'Importez une liste d\'erreurs et corrections.',
format:`Format accepté :
erreur — correction
apprendre français — apprendre le français
j'ai été — j'étais (imparfait)
très beaucoup — beaucoup / énormément
— Séparateur : « — » ou « → » ou « : »
— La correction après le séparateur
— Lignes vides et # ignorées`,
parse: parseTxtErrors,
apply: applyImportErrors
},
connectors:{
title:'📥 Importer connecteurs personnels TXT',
desc:'Ajoutez vos propres connecteurs à réviser en SRS.',
format:`Format accepté :
connecteur — sens/usage
toutefois — however / cependant
à condition que — provided that
il convient de — it is appropriate to
— Séparateur : « — » ou « : »
— Ces connecteurs s'ajoutent à la liste SRS
— Lignes vides et # ignorées`,
parse: parseTxtConnectors,
apply: applyImportConnectors
},
answers:{
title:'📥 Importer réponses modèles TXT',
desc:'Importez des réponses modèles B2 pour vous inspirer et comparer.',
format:`Format accepté :
### TÂCHE 1
[titre/consigne facultative]
Texte de la réponse modèle ici...
### TÂCHE 2
[consigne]
Texte de la réponse modèle...
### TÂCHE 3
[consigne/titre]
Texte...
— Chaque bloc commence par ### TÂCHE N
— La ligne suivante peut être une consigne entre []
— Plusieurs réponses par fichier acceptées`,
parse: parseTxtAnswers,
apply: applyImportAnswers
},
comprehension:{
title:'📥 Importer texte lecture/écoute TXT',
desc:'Importez un texte avec ses questions et réponses pour s\'entraîner à la compréhension TCF.',
format:`Format accepté :
### TITRE DU TEXTE
[LECTURE] ou [ÉCOUTE]
TEXTE:
Collez ici le texte de l'article ou le transcript d'écoute...
QUESTIONS:
Q1: Quelle est l'idée principale du texte ?
A) ... B) ... C) ... D) ...
RÉPONSE: B
Q2: Selon le texte, ...
A) ... B) ... C) ... D) ...
RÉPONSE: A
— Plusieurs textes par fichier (séparés par ### TITRE)
— Type [LECTURE] ou [ÉCOUTE] optionnel`,
parse: parseTxtComprehension,
apply: applyImportComprehension
}
};
function openImportModal(type){
importModalType=type;
importParsedData=null;
const cfg=IMPORT_CONFIGS[type];
document.getElementById('importModalTitle').textContent=cfg.title;
document.getElementById('importModalDesc').textContent=cfg.desc;
document.getElementById('importFormatBox').textContent=cfg.format;
document.getElementById('importPreview').style.display='none';
document.getElementById('importPreview').textContent='';
document.getElementById('importResult').style.display='none';
document.getElementById('importConfirmBtn').style.display='none';
document.getElementById('importModal').classList.add('active');
}
function closeImportModal(){
document.getElementById('importModal').classList.remove('active');
importParsedData=null;
importModalType='';
}
function handleImportDrop(e){
e.preventDefault();
document.getElementById('importDropZone').classList.remove('drag-over');
const f=e.dataTransfer.files[0];
if(f)handleImportFile(f);
}
function handleImportFile(file){
if(!file)return;
const r=new FileReader();
r.onload=()=>{
const text=r.result;
const cfg=IMPORT_CONFIGS[importModalType];
try{
importParsedData=cfg.parse(text);
const prev=document.getElementById('importPreview');
prev.style.display='block';
prev.textContent=getImportPreviewText(importModalType,importParsedData);
const res=document.getElementById('importResult');
res.className='import-result ok';
res.style.display='block';
res.textContent='✅ '+getImportSummary(importModalType,importParsedData)+' trouvé(s) — cliquez Importer pour confirmer.';
document.getElementById('importConfirmBtn').style.display='flex';
}catch(err){
const res=document.getElementById('importResult');
res.className='import-result err';
res.style.display='block';
res.textContent='❌ Erreur de format : '+err.message;
document.getElementById('importConfirmBtn').style.display='none';
}
};
r.readAsText(file,'UTF-8');
}
function getImportPreviewText(type,data){
if(type==='vocab') return data.slice(0,5).map(v=>v.word+(v.def?' — '+v.def:'')+' ['+v.theme+']').join('\n')+(data.length>5?'\n… et '+(data.length-5)+' autres':'');
if(type==='errors') return data.slice(0,5).map(e=>e.wrong+' → '+e.right).join('\n')+(data.length>5?'\n… et '+(data.length-5)+' autres':'');
if(type==='connectors') return data.slice(0,5).map(c=>c.w+' — '+c.g).join('\n')+(data.length>5?'\n… et '+(data.length-5)+' autres':'');
if(type==='answers') return data.slice(0,2).map(a=>'[Tâche '+a.task+'] '+(a.title||'')+':\n'+a.text.slice(0,120)+'…').join('\n\n')+(data.length>2?'\n… et '+(data.length-2)+' autres':'');
if(type==='comprehension') return data.slice(0,1).map(t=>t.title+' ('+t.type+')\n'+t.text.slice(0,200)+'…\n'+t.questions.length+' question(s)').join('\n');
return JSON.stringify(data).slice(0,300);
}
function getImportSummary(type,data){
const n=data.length;
if(type==='vocab') return n+' mot'+(n>1?'s':'');
if(type==='errors') return n+' erreur'+(n>1?'s':'');
if(type==='connectors') return n+' connecteur'+(n>1?'s':'');
if(type==='answers') return n+' réponse'+(n>1?'s':'')+' modèle'+(n>1?'s':'');
if(type==='comprehension') return n+' texte'+(n>1?'s':'');
return n;
}
function confirmImport(){
if(!importParsedData)return;
IMPORT_CONFIGS[importModalType].apply(importParsedData);
closeImportModal();
}
function parseTxtVocab(text){
const lines=text.split('\n').map(l=>l.trim()).filter(l=>l&&!l.startsWith('#'));
const results=[];
lines.forEach(l=>{
let theme='Autre';
const themeMatch=l.match(/\[([^\]]+)\]$/);
if(themeMatch){theme=themeMatch[1].trim();l=l.replace(/\[[^\]]+\]$/,'').trim();}
const parts=l.split(/\s*[—\-:]\s*|\t/).map(p=>p.trim()).filter(Boolean);
if(parts[0])results.push({word:parts[0],def:parts.slice(1).join(' — ')||'',theme});
});
if(!results.length)throw new Error('Aucun mot trouvé. Vérifiez le format.');
return results;
}
function parseTxtErrors(text){
const lines=text.split('\n').map(l=>l.trim()).filter(l=>l&&!l.startsWith('#'));
const results=[];
lines.forEach(l=>{
const parts=l.split(/\s*[—→\-:]\s*/).map(p=>p.trim()).filter(Boolean);
if(parts.length>=2)results.push({wrong:parts[0],right:parts.slice(1).join(' ')});
else if(parts.length===1)results.push({wrong:parts[0],right:''});
});
if(!results.length)throw new Error('Aucune erreur trouvée. Vérifiez le format.');
return results;
}
function parseTxtConnectors(text){
const lines=text.split('\n').map(l=>l.trim()).filter(l=>l&&!l.startsWith('#'));
const results=[];
let currentCat='Personnels';
lines.forEach(l=>{
if(l.startsWith('[') && l.endsWith(']')){currentCat=l.slice(1,-1).trim();return;}
const parts=l.split(/\s*[—\-:]\s*|\t/).map(p=>p.trim()).filter(Boolean);
if(parts.length>=2)results.push({w:parts[0],g:parts.slice(1).join(' — '),cat:currentCat});
else if(parts.length===1)results.push({w:parts[0],g:'',cat:currentCat});
});
if(!results.length)throw new Error('Aucun connecteur trouvé.');
return results;
}
function parseTxtAnswers(text){
const blocks=text.split(/^###\s*/m).filter(b=>b.trim());
const results=[];
blocks.forEach(block=>{
const lines=block.split('\n');
const header=lines[0].trim();
const taskMatch=header.match(/TÂCHE\s*(\d)/i);
const task=taskMatch?parseInt(taskMatch[1]):1;
let title=header.replace(/TÂCHE\s*\d/i,'').trim()||'';
let consigne='';
let textLines=[];
let i=1;
if(lines[i]&&lines[i].trim().startsWith('[')){
consigne=lines[i].trim().replace(/^\[|\]$/g,'');
i++;
}
for(;i<lines.length;i++) textLines.push(lines[i]);
const bodyText=textLines.join('\n').trim();
if(bodyText)results.push({task,title:title||'Tâche '+task,consigne,text:bodyText,addedAt:todayStr()});
});
if(!results.length)throw new Error('Aucune réponse modèle trouvée. Utilisez ### TÂCHE N pour délimiter chaque réponse.');
return results;
}
function parseTxtComprehension(text){
const blocks=text.split(/^###\s*/m).filter(b=>b.trim());
const results=[];
blocks.forEach(block=>{
const lines=block.split('\n');
const titleLine=lines[0].trim();
let type='LECTURE';
const typeMatch=titleLine.match(/\[(LECTURE|ÉCOUTE|ECOUTE)\]/i);
if(typeMatch)type=typeMatch[1].toUpperCase();
const title=titleLine.replace(/\[(LECTURE|ÉCOUTE|ECOUTE)\]/gi,'').trim()||'Texte sans titre';
const fullText=lines.slice(1).join('\n');
const textMatch=fullText.match(/TEXTE\s*:\s*\n([\s\S]*?)(?=QUESTIONS\s*:|$)/i);
const qMatch=fullText.match(/QUESTIONS\s*:\s*\n([\s\S]*)/i);
const bodyText=(textMatch?textMatch[1]:fullText.split(/QUESTIONS\s*:/i)[0]).trim();
const qBlock=qMatch?qMatch[1]:'';
const questions=[];
const qParts=qBlock.split(/\n(?=Q\d+\s*:)/i).filter(q=>q.trim());
qParts.forEach(qp=>{
const qLines=qp.split('\n').map(l=>l.trim()).filter(Boolean);
if(!qLines.length)return;
const qText=qLines[0].replace(/^Q\d+\s*:\s*/i,'').trim();
const options=[];
let answer='';
qLines.slice(1).forEach(l=>{
const optMatch=l.match(/^([A-D])\)\s*(.*)/);
if(optMatch)options.push({key:optMatch[1],text:optMatch[2]});
const ansMatch=l.match(/^RÉPONSE\s*:\s*([A-D])/i);
if(ansMatch)answer=ansMatch[1];
});
if(qText)questions.push({question:qText,options,answer});
});
if(bodyText)results.push({title,type,text:bodyText,questions,addedAt:todayStr()});
});
if(!results.length)throw new Error('Aucun texte trouvé. Utilisez ### TITRE pour délimiter chaque texte, avec TEXTE: et QUESTIONS:');
return results;
}
function applyImportVocab(data){
let added=0;
data.forEach(v=>{
if(!vocabList.some(e=>e.word.toLowerCase()===v.word.toLowerCase())){
vocabList.push({...v,auto:false,addedAt:todayStr()});
added++;
}
});
SV('tcf_vocab',vocabList);
renderVocabList();renderSentenceChips();renderThemeBalance();refreshBadges();
alert('✅ '+added+' mot(s) importé(s) ('+( data.length-added)+' déjà présents).');
saveHistory('📥 Import vocab : '+added+' mots ajoutés');
}
function applyImportErrors(data){
let added=0;
data.forEach(e=>{
if(!myErrors.some(x=>x.wrong.toLowerCase()===e.wrong.toLowerCase())){
myErrors.push({...e,addedAt:todayStr()});
added++;
}
});
SV('tcf_errors',myErrors);
buildErrorsList();renderErrorsPanel();refreshBadges();
alert('✅ '+added+' erreur(s) importée(s).');
saveHistory('📥 Import erreurs : '+added+' entrées');
}
function applyImportConnectors(data){
customConns=[...(customConns||[]),...data];
SV('tcf_custom_conns',customConns);
rebuildCustomConnsSRS();
alert('✅ '+data.length+' connecteur(s) importé(s). Ils apparaîtront dans votre révision SRS.');
saveHistory('📥 Import connecteurs : '+data.length+' ajoutés');
}
function rebuildCustomConnsSRS(){
if(!customConns||!customConns.length)return;
const startIdx=ALL_CONN.length;
customConns.forEach((c,i)=>{
const existing=ALL_CONN.find(x=>x.w===c.w);
if(!existing)ALL_CONN.push({...c,customIdx:startIdx+i});
});
}
function applyImportAnswers(data){
presetAnswers=[...(presetAnswers||[]),...data];
SV('tcf_presets',presetAnswers);
renderPresetAnswers();
alert('✅ '+data.length+' réponse(s) modèle(s) importée(s). Retrouvez-les dans «\u00a0Productions\u00a0».');
saveHistory('📥 Import réponses modèles : '+data.length);
}
function applyImportComprehension(data){
readingDocs=[...(readingDocs||[]),...data];
SV('tcf_reading_docs',readingDocs);
renderComprehensionLibrary();
refreshBadges();
alert('✅ '+data.length+' texte(s) importé(s). Retrouvez-les dans «\u00a0Compréhension\u00a0».');
saveHistory('📥 Import textes compréhension : '+data.length);
}
function exportErrorsTXT(){
if(!myErrors.length){alert('Aucune erreur à exporter.');return;}
const txt=myErrors.map(e=>e.wrong+(e.right?' — '+e.right:'')).join('\n');
dl(new Blob([txt],{type:'text/plain;charset=utf-8'}),'TCF_erreurs.txt');
}
function renderPresetAnswers(){ renderPresetsList(); }
function practicePresetAnswer(idx){
const a=presetAnswers[idx];
if(!a)return;
activeTask=a.task;
document.getElementById('taskActive').value=String(a.task);
showView('studio');
if(confirm('Charger la RÉPONSE MODÈLE dans l\'éditeur pour étude ?\n\n(Cela remplacera votre brouillon actuel)')){
editor.value=a.text;
onEditorInput();
}
}
function deletePresetAnswer(idx){
if(!confirm('Supprimer cette réponse modèle ?'))return;
presetAnswers.splice(idx,1);
SV('tcf_presets',presetAnswers);
renderPresetAnswers();
}
let currentRdgText=null;
let rdgAnswers={};
let rdgSubmitted=false;
function renderComprehensionLibrary(){ renderReadingView(); }
function clearAllReadingTexts(){ clearReadingDocs(); }
function deleteReadingText(idx){
if(!confirm('Supprimer ce texte ?'))return;
readingDocs.splice(idx,1);
if(activeReadingDoc>=readingDocs.length) activeReadingDoc=Math.max(0,readingDocs.length-1);
SV('tcf_reading_docs',readingDocs);
renderReadingView();
refreshBadges();
}
function startRdgPractice(idx){
currentRdgText=readingDocs[idx];
rdgAnswers={};
rdgSubmitted=false;
document.getElementById('rdgModalTitle').textContent=(currentRdgText.type==='ÉCOUTE'||currentRdgText.type==='ECOUTE'?'🎙 ':'📄 ')+escHtml(currentRdgText.title);
renderRdgModal();
document.getElementById('rdgModal').classList.add('active');
}
function closeRdgModal(){
document.getElementById('rdgModal').classList.remove('active');
currentRdgText=null;
}
function renderRdgModal(){
const area=document.getElementById('rdgModalContent');
if(!currentRdgText)return;
const t=currentRdgText;
const hasQ=t.questions&&t.questions.length>0;
let score=0,total=0;
if(rdgSubmitted&&hasQ){
t.questions.forEach((q,i)=>{
if(q.answer&&rdgAnswers[i]){
total++;
if(rdgAnswers[i]===q.answer)score++;
}
});
}
let html=`<div class="rdg-text-box">${escHtml(t.text)}</div>`;
if(rdgSubmitted&&hasQ){
const pct=total>0?Math.round(score/total*100):0;
html+=`<div class="rdg-score-bar"><b>${score}/${total}</b><div class="rdg-score-fill"><div class="rdg-score-inner" style="width:${pct}%;background:${pct>=70?'var(--success)':pct>=40?'var(--warn)':'var(--danger)'}"></div></div><b>${pct}%</b></div>`;
}
if(hasQ){
t.questions.forEach((q,i)=>{
html+=`<div class="rdg-qblock"><div class="rdg-question">${i+1}. ${escHtml(q.question)}</div><div class="rdg-options">`;
if(q.options&&q.options.length){
q.options.forEach(opt=>{
let cls='rdg-option';
if(rdgSubmitted){
if(opt.key===q.answer)cls+=' reveal-correct';
if(opt.key===rdgAnswers[i]&&opt.key!==q.answer)cls+=' wrong';
if(opt.key===rdgAnswers[i]&&opt.key===q.answer)cls+=' correct';
} else if(rdgAnswers[i]===opt.key){
cls+=' active';
}
const disabled=rdgSubmitted?'':'';
html+=`<div class="${cls}" onclick="${rdgSubmitted?'':('selectRdgOption('+i+',"'+opt.key+'")')}">${opt.key}) ${escHtml(opt.text)}</div>`;
});
} else {
const val=rdgAnswers[i]||'';
html+=`<input class="ipt" ${rdgSubmitted?'disabled':''} value="${escHtml(val)}" placeholder="Votre réponse…" oninput="rdgAnswers[${i}]=this.value" style="margin-top:4px">`;
if(rdgSubmitted&&q.answer)html+=`<div class="muted" style="margin-top:5px;font-size:12px">✅ Réponse attendue : ${escHtml(q.answer)}</div>`;
}
html+='</div></div>';
});
if(!rdgSubmitted){
html+=`<div class="rdg-nav-row"><button class="btn btn-primary btn-sm" onclick="submitRdgAnswers()">✅ Soumettre mes réponses</button></div>`;
} else {
html+=`<div class="rdg-nav-row"><button class="btn btn-ghost btn-sm" onclick="rdgAnswers={};rdgSubmitted=false;renderRdgModal()">🔄 Recommencer</button><button class="btn btn-ghost btn-sm" onclick="closeRdgModal()">Fermer</button></div>`;
saveHistory('📖 Compréhension : «'+currentRdgText.title+'» — '+score+'/'+total);
}
} else {
html+=`<div class="muted" style="text-align:center;padding:12px">Aucune question dans ce texte. Utilisez le format Q1:/A)/RÉPONSE: pour ajouter des Q&A.</div><div class="rdg-nav-row"><button class="btn btn-ghost btn-sm" onclick="closeRdgModal()">Fermer</button></div>`;
}
area.innerHTML=html;
}
function selectRdgOption(qIdx,key){
rdgAnswers[qIdx]=key;
renderRdgModal();
}
function submitRdgAnswers(){
rdgSubmitted=true;
renderRdgModal();
}
// renderReadingView is already called by the showView patch above
function _readTxtFile(file, onText){
if(!file) return;
const r = new FileReader();
r.onload = () => onText(r.result);
r.onerror = () => alert('Erreur de lecture du fichier.');
r.readAsText(file, 'UTF-8');
}
function _showImportResult(elId, ok, msg){
const el = document.getElementById(elId);
if(!el) return;
el.className = 'import-result' + (ok ? '' : ' err');
el.textContent = msg;
el.style.display = 'block';
setTimeout(() => { el.style.display = 'none'; }, 5000);
}
function importVocabTXT(input){
_readTxtFile(input.files[0], text => {
try {
const data = parseTxtVocab(text);
applyImportVocab(data);
_showImportResult('vocabImportResult', true, '✅ ' + data.length + ' mot(s) importé(s) avec succès.');
} catch(e) {
_showImportResult('vocabImportResult', false, '❌ ' + e.message);
}
input.value = '';
});
}
function importErrorsTXT(input){
_readTxtFile(input.files[0], text => {
try {
const data = parseTxtErrors(text);
applyImportErrors(data);
_showImportResult('errImportResult', true, '✅ ' + data.length + ' erreur(s) importée(s).');
} catch(e) {
_showImportResult('errImportResult', false, '❌ ' + e.message);
}
input.value = '';
});
}
function importConnectorsTXT(input){
_readTxtFile(input.files[0], text => {
try {
const data = parseTxtConnectors(text);
applyImportConnectors(data);
_showImportResult('connImportResult', true, '✅ ' + data.length + ' connecteur(s) importé(s).');
renderCustomConnList();
} catch(e) {
_showImportResult('connImportResult', false, '❌ ' + e.message);
}
input.value = '';
});
}
function importPresetAnswers(input){
_readTxtFile(input.files[0], text => {
try {
const data = parseTxtAnswers(text);
applyImportAnswers(data);
_showImportResult('presetImportResult', true, '✅ ' + data.length + ' réponse(s) modèle(s) importée(s).');
renderPresetsList();
} catch(e) {
_showImportResult('presetImportResult', false, '❌ ' + e.message);
}
input.value = '';
});
}
function importReadingTXT(input){
_readTxtFile(input.files[0], text => {
try {
const data = parseTxtComprehension(text);
applyImportComprehension(data);
_showImportResult('readImportResult', true, '✅ ' + data.length + ' texte(s) importé(s).');
renderReadingView();
} catch(e) {
_showImportResult('readImportResult', false, '❌ Format non reconnu — ' + e.message + '. Utilisez ### TITRE + TEXTE: + QUESTIONS:');
}
input.value = '';
});
}
function renderPresetsList(){
const el = document.getElementById('presetsList');
if(!el) return;
if(!presetAnswers.length){
el.innerHTML = '<div class="card"><div class="empty-state">📂 Importez un fichier TXT de réponses modèles ci-dessus. Chaque bloc commence par <b>### TÂCHE 1</b>, <b>### TÂCHE 2</b>, ou <b>### TÂCHE 3</b>.</div></div>';
return;
}
el.innerHTML = presetAnswers.map((a,i) => `
<div class="preset-answer-card">
<div class="preset-answer-head">
<span class="preset-answer-label">Tâche ${a.task}${a.title && a.title !== 'Tâche '+a.task ? ' — ' + escHtml(a.title) : ''}</span>
<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
<span class="muted">${a.addedAt||''} · ${wcOf(a.text)} mots</span>
<button class="btn btn-primary btn-sm" style="padding:4px 9px;font-size:11px" onclick="practicePresetAnswer(${i})">🚀 Étudier</button>
<span class="del-x" onclick="deletePresetAnswer(${i})">×</span>
</div>
</div>
${a.consigne ? `<div class="muted" style="margin-bottom:5px;font-style:italic;font-size:11.5px">📋 ${escHtml(a.consigne)}</div>` : ''}
<div class="preset-answer-text" onclick="this.classList.toggle('open')">${escHtml(a.text)}</div>
</div>`).join('');
}
function exportPresetsTXT(){
if(!presetAnswers.length){ alert('Aucune réponse modèle à exporter.'); return; }
const txt = presetAnswers.map(a => '### TÂCHE ' + a.task + (a.title && a.title !== 'Tâche '+a.task ? ' — ' + a.title : '') + '\n' + (a.consigne ? '[' + a.consigne + ']\n' : '') + a.text).join('\n\n');
dl(new Blob([txt], {type:'text/plain;charset=utf-8'}), 'TCF_reponses_modeles.txt');
}
function clearPresets(){
if(!confirm('Effacer toutes les réponses modèles ?')) return;
presetAnswers = [];
SV('tcf_presets', presetAnswers);
renderPresetsList();
}
function renderCustomConnList(){
const el = document.getElementById('customConnList');
if(!el) return;
if(!customConns.length){
el.innerHTML = '<div class="card"><div class="empty-state">Aucun connecteur personnalisé importé.</div></div>';
return;
}
const byCategory = {};
customConns.forEach(c => { (byCategory[c.cat||'Personnels'] = byCategory[c.cat||'Personnels']||[]).push(c); });
el.innerHTML = Object.entries(byCategory).map(([cat, items]) =>
`<div class="card">
<div class="conn-cat">${escHtml(cat)} <span class="muted">(${items.length})</span></div>
${items.map((c,i) => `<div class="custom-conn-item">
<span class="custom-conn-word">${escHtml(c.w)}</span>
<span class="custom-conn-guide">${escHtml(c.g||'—')}</span>
<span class="del-x" style="font-size:14px" onclick="deleteCustomConn(${customConns.indexOf(c)})">×</span>
</div>`).join('')}
</div>`
).join('');
}
function deleteCustomConn(idx){
customConns.splice(idx, 1);
SV('tcf_custom_conns', customConns);
rebuildCustomConnsSRS();
renderCustomConnList();
}
function exportCustomConnsTXT(){
if(!customConns.length){ alert('Aucun connecteur personnalisé.'); return; }
const cats = {};
customConns.forEach(c => { (cats[c.cat||'Personnels'] = cats[c.cat||'Personnels']||[]).push(c); });
const txt = Object.entries(cats).map(([cat, items]) => '[' + cat + ']\n' + items.map(c => c.w + (c.g ? ' — ' + c.g : '')).join('\n')).join('\n\n');
dl(new Blob([txt], {type:'text/plain;charset=utf-8'}), 'TCF_connecteurs_perso.txt');
}
function clearCustomConns(){
if(!confirm('Effacer tous les connecteurs importés ?')) return;
customConns = [];
SV('tcf_custom_conns', customConns);
renderCustomConnList();
}
function renderReadingView(){
const panel = document.getElementById('readingDocsPanel');
const empty = document.getElementById('readingEmptyState');
const badge = document.getElementById('read-badge');
if(badge) badge.textContent = readingDocs.length;
if(!readingDocs.length){
if(panel) panel.style.display = 'none';
if(empty) empty.style.display = 'block';
return;
}
if(empty) empty.style.display = 'none';
if(panel) panel.style.display = 'block';
const tabs = document.getElementById('readingDocTabs');
if(tabs){
tabs.innerHTML = readingDocs.map((d,i) =>
`<div class="comp-tab${i===activeReadingDoc?' active':''}" onclick="selectReadingDoc(${i})">${d.type==='ÉCOUTE'||d.type==='ECOUTE'?'🎙':'📄'} ${escHtml(d.title.slice(0,22))}${d.title.length>22?'…':''}</div>`
).join('') + `<div class="comp-tab" onclick="clearReadingDocs()" style="color:var(--danger);background:none;border-style:dashed">🗑</div>`;
}
renderActiveReadingDoc();
}
function selectReadingDoc(idx){
activeReadingDoc = idx;
renderReadingView();
}
function renderActiveReadingDoc(){
const el = document.getElementById('readingActiveDoc');
if(!el || !readingDocs.length) return;
const doc = readingDocs[activeReadingDoc] || readingDocs[0];
if(!doc){ el.innerHTML = ''; return; }
el.innerHTML = `
<div class="card">
<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:12px">
<div>
<div style="font-size:16px;font-weight:800">${doc.type==='ÉCOUTE'||doc.type==='ECOUTE'?'🎙':'📄'} ${escHtml(doc.title)}</div>
<div class="muted">${doc.type} · ${doc.questions.length} question(s) · ${wcOf(doc.text)} mots</div>
</div>
<div style="display:flex;gap:6px">
<button class="btn btn-primary btn-sm" onclick="startRdgPractice(${activeReadingDoc})">🚀 Pratiquer</button>
<span class="del-x" style="font-size:18px;margin-top:2px" onclick="deleteReadingText(${activeReadingDoc})">×</span>
</div>
</div>
<div style="font-size:11px;font-weight:800;color:var(--sub);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Extrait du texte</div>
<div class="comp-text">${escHtml(doc.text)}</div>
${doc.questions.length ? `<div style="font-size:11px;font-weight:800;color:var(--sub);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">${doc.questions.length} question(s)</div>
${doc.questions.slice(0,3).map((q,i) => `<div style="font-size:12.5px;padding:6px 0;border-bottom:1px dashed var(--border)"><b>Q${i+1}.</b> ${escHtml(q.question)}</div>`).join('')}
${doc.questions.length>3 ? `<div class="muted" style="margin-top:6px;font-size:12px">… et ${doc.questions.length-3} autre(s)</div>` : ''}` : '<div class="muted">Aucune question dans ce texte.</div>'}
</div>`;
}
function exportReadingTXT(){
if(!readingDocs.length){ alert('Aucun texte de lecture/écoute.'); return; }
const txt = readingDocs.map(d =>
'### ' + d.title + ' [' + d.type + ']\n\nTEXTE:\n' + d.text +
(d.questions.length ? '\n\nQUESTIONS:\n' + d.questions.map((q,i) =>
'Q' + (i+1) + ': ' + q.question + '\n' +
(q.options.length ? q.options.map(o => o.key + ') ' + o.text).join('\n') + '\n' : '') +
(q.answer ? 'RÉPONSE: ' + q.answer : '')
).join('\n\n') : '')
).join('\n\n---\n\n');
dl(new Blob([txt], {type:'text/plain;charset=utf-8'}), 'TCF_lecture_ecoute.txt');
}
function clearReadingDocs(){
if(!confirm('Effacer tous les textes de lecture/écoute ?')) return;
readingDocs = [];
activeReadingDoc = 0;
SV('tcf_reading_docs', readingDocs);
renderReadingView();
refreshBadges();
}
