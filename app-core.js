// ── app-core.js — State, utils, view routing, studio / combo / bank logic ──────
function mergeBanks(b,s){const m={};Object.keys(b||{}).forEach(k=>m[k]=(b[k]||[]).map(c=>({...c})));Object.keys(s||{}).forEach(k=>{m[k]=m[k]||[];(s[k]||[]).forEach(i=>{const x=m[k].findIndex(c=>String(c.num)===String(i.num));if(x>=0)m[k][x]=i;else m[k].push(i);});m[k].sort((a,b)=>(a.num||0)-(b.num||0));});return m;}
let customBank=mergeBanks(DEFAULT_SUBJECT_BANK,LS('tcf_custom_bank',{}));
let favorites=LS('tcf_favorites',[]),revisits=LS('tcf_revisits',[]),history=LS('tcf_history',[]);
let productions=LS('tcf_productions',[]);
let vocabList=LS('tcf_vocab',[]),savedSentences=LS('tcf_sentences',[]);
let myErrors=LS('tcf_errors',[]);
let srs=LS('tcf_srs',{}),srsV=LS('tcf_srs_vocab',{});
let streak=LS('tcf_streak',{lastDate:'',cur:0,best:0,days:[]});
let profile=LS('tcf_profile',{});
let doneCombos=LS('tcf_done_combos',{});
let examAnswers=LS('tcf_exam_answers',{1:'',2:'',3:''});
let presetAnswers=LS('tcf_presets',[]);
let customConns=LS('tcf_custom_conns',[]);
let readingDocs=LS('tcf_reading_docs',[]);
let activeReadingDoc=0;
let combos=[],activeCombIdx=0,activeTask=1,activeMonthSlug='',focusMode=false,pendingProduction=null;
const views=['studio','browse','productions','connectors','vocab','errors','reading','listening','reading_mock','conjugation','favorites','revisit','history','stats','profile'];
function showView(v){closeMobileSidebar();views.forEach(x=>{const e=document.getElementById('view-'+x);if(e)e.style.display=(x===v?'':'none');const n=document.getElementById('nav-'+x);if(n)n.classList.toggle('active',x===v);});
const dock=document.querySelector('.accent-dock');if(dock&&!document.body.classList.contains('exam-active')){dock.style.display=(v==='studio'||v==='browse'||v==='vocab'||v==='errors'||v==='connectors')?'flex':'none';}
if(v==='browse')buildMonthGrid();if(v==='productions')buildProductions();
if(v==='connectors'){buildSRS();buildConnList();}
if(v==='vocab'){renderVocabList();renderSentenceChips();renderSavedSentences();renderThemeBalance();}
if(v==='errors')buildErrorsList();if(v==='favorites')buildFavList();if(v==='revisit')buildRevList();
if(v==='history')buildHistList();if(v==='stats')buildStats();if(v==='profile'){loadProfileForm();buildReport();}}
function switchVocabTab(t){['list','flash','sent','b2','exercise','presets'].forEach(x=>{const el=document.getElementById('vtab-'+x),tab=document.getElementById('vtab-b-'+x);if(el)el.classList.toggle('active',x===t);if(tab)tab.classList.toggle('active',x===t);});if(t==='flash')renderFlashcards();if(t==='b2')buildSRSV();if(t==='presets')renderPresetsList();}
function switchConnTab(t){['review','list','import'].forEach(x=>{const b=document.getElementById('ctab-b-'+x);const p=document.getElementById('ctab-'+x);if(b)b.classList.toggle('active',x===t);if(p)p.classList.toggle('active',x===t);});if(t==='review')buildSRS();if(t==='list')buildConnList();if(t==='import')renderCustomConnList();}
function populateMonthSelect(){document.getElementById('monthSel').innerHTML=allMonths.map(m=>`<option value="${m.slug}">${m.label}</option>`).join('');document.getElementById('bankMonth').innerHTML=allMonths.map(m=>`<option value="${m.slug}">${m.label}</option>`).join('');}
function getMonth(s){return allMonths.find(m=>m.slug===s)||allMonths[0];}
function availableTasks(c){return [c.t1&&c.t1.consigne?1:0,c.t2&&c.t2.consigne?2:0,(c.t3&&(c.t3.doc1||c.t3.doc2))?3:0].filter(Boolean);}
function loadSujets(){const s=document.getElementById('monthSel').value;activeMonthSlug=s;
combos=(customBank[s]||[]).map((c,i)=>({...c,num:c.num||i+1}));
if(!combos.length){document.getElementById('sujetContent').style.display='none';document.getElementById('sujetEmpty').style.display='block';document.getElementById('comboBadge').textContent='—';document.getElementById('sujetEmpty').innerHTML=`Aucun sujet pour <strong>${escHtml(getMonth(s).label)}</strong>.`;setFocus(false);return;}
document.getElementById('sujetEmpty').style.display='none';document.getElementById('sujetContent').style.display='block';
activeCombIdx=0;const av=availableTasks(combos[0]);
activeTask=av.includes(parseInt(document.getElementById('taskActive').value))?parseInt(document.getElementById('taskActive').value):(av[0]||1);
renderSujet();loadDraft();updateFocusBar();saveHistory('Sujets chargés : '+getMonth(s).label+' ('+combos.length+')');}
function onMonthChange(){setFocus(false);combos=[];document.getElementById('sujetContent').style.display='none';document.getElementById('sujetEmpty').style.display='block';document.getElementById('comboBadge').textContent='—';document.getElementById('sujetEmpty').innerHTML='Cliquez <strong>Charger dans le studio</strong> pour '+escHtml(getMonth(document.getElementById('monthSel').value).label)+'.';}
function renderSujet(){if(!combos.length)return;const c=combos[activeCombIdx];const av=availableTasks(c);
if(!av.includes(activeTask))activeTask=av[0]||1;
document.getElementById('comboBadge').textContent='Combinaison '+c.num;
document.getElementById('comboList').innerHTML=combos.map((cc,i)=>`<button class="combo-pill ${i===activeCombIdx?'active':''} ${doneCombos[activeMonthSlug+':'+cc.num]?'done':''}" onclick="selectCombo(${i})">${doneCombos[activeMonthSlug+':'+cc.num]?'✓':'○'} Combinaison ${cc.num}</button>`).join('');
document.getElementById('taskTabs').innerHTML=[1,2,3].map(n=>`<div class="task-tab ${activeTask===n?'active':''}" onclick="switchTask(${n})">Tâche ${n}</div>`).join('')
+`<div style="margin-left:auto;display:flex;gap:6px;align-items:center"><button class="combo-pill" onclick="prevCombo()">‹</button><span class="muted">${activeCombIdx+1}/${combos.length}</span><button class="combo-pill" onclick="nextCombo()">›</button><button class="btn btn-primary btn-sm" style="background:linear-gradient(135deg,#16a34a,#15803d);padding:8px 16px;font-size:13px" onclick="startSujet()">🚀 Commencer</button></div>`;
renderTaskContent(c,document.getElementById('taskContent'),activeTask);
document.getElementById('doneToggle').checked=!!doneCombos[activeMonthSlug+':'+c.num];
document.getElementById('editorTaskLabel').textContent='(Tâche '+activeTask+')';
updateFocusBar();updateWordCounter();}
function renderTaskContent(c,el,task){
if(task===1&&c.t1)el.innerHTML=`<div class="task-label">Tâche 1</div><div class="task-text">${escHtml(c.t1.consigne)}</div><div class="task-limit">60 mots min. / 120 mots max.</div>`;
else if(task===2&&c.t2)el.innerHTML=`<div class="task-label">Tâche 2</div><div class="task-text">${escHtml(c.t2.consigne)}</div><div class="task-limit">120 mots min. / 150 mots max.</div>`;
else if(c.t3)el.innerHTML=`<div class="task-label">Tâche 3 — ${escHtml(c.t3.titre||'')}</div><div class="doc-block"><div class="doc-title">Document 1</div><div class="task-text">${escHtml(c.t3.doc1||'')}</div></div><div class="doc-block"><div class="doc-title">Document 2</div><div class="task-text">${escHtml(c.t3.doc2||'')}</div></div><div class="task-limit">180 mots maximum</div>`;
else el.innerHTML='<div class="muted">Tâche non disponible.</div>';}
function selectCombo(i){activeCombIdx=i;activeTask=1;document.getElementById('taskActive').value='1';renderSujet();loadDraft();unfreezeSession();saveHistory('👁 Combo '+combos[i].num+' prévisualisé');}
function prevCombo(){activeCombIdx=Math.max(0,activeCombIdx-1);renderSujet();}
function nextCombo(){activeCombIdx=Math.min(combos.length-1,activeCombIdx+1);renderSujet();}
function randomCombo(){if(!combos.length){loadSujets();return;}activeCombIdx=Math.floor(Math.random()*combos.length);const av=availableTasks(combos[activeCombIdx]);activeTask=av[Math.floor(Math.random()*av.length)]||1;document.getElementById('taskActive').value=String(activeTask);renderSujet();loadDraft();}
function toggleDone(ck){if(!combos.length)return;const k=activeMonthSlug+':'+combos[activeCombIdx].num;if(ck){doneCombos[k]={date:new Date().toISOString()};SV('tcf_done_combos',doneCombos);clearInterval(timerInterval);setFocus(false);const next=combos.findIndex((c,i)=>i>activeCombIdx&&!doneCombos[activeMonthSlug+':'+c.num]);if(next>=0){setTimeout(()=>selectCombo(next),400);}else{renderSujet();}}else{delete doneCombos[k];SV('tcf_done_combos',doneCombos);renderSujet();}}
function getCurrentSujet(){if(!combos.length)return'';const c=combos[activeCombIdx];if(activeTask===1&&c.t1)return'[T1 — C'+c.num+'] '+c.t1.consigne;if(activeTask===2&&c.t2)return'[T2 — C'+c.num+'] '+c.t2.consigne;if(c.t3)return'[T3 — C'+c.num+'] '+c.t3.titre+'\nDoc 1: '+c.t3.doc1+'\nDoc 2: '+c.t3.doc2;return'';}
function getCurrentTopic(){if(!combos.length)return'Libre';const c=combos[activeCombIdx];return activeTask===3?(c.t3?.titre||'T3'):'Tâche '+activeTask+' · C'+c.num;}
function startSujet(){const v=parseInt(document.getElementById('timerSlider').value)||60;
timerTotal=v*60;timerRemain=timerTotal;clearInterval(timerInterval);unfreezeSession();runTimer();
setFocus(true);editor.focus();saveHistory('▶ Sujet démarré : '+getCurrentTopic()+' · '+v+' min');}
function buildMonthGrid(){document.getElementById('monthGrid').innerHTML=allMonths.map(m=>{const n=(customBank[m.slug]||[]).length;return`<div class="month-card" onclick="loadFromBrowse('${m.slug}')"><div style="font-size:10px;color:var(--sub)">${m.label.split(' ')[1]}</div><div style="font-weight:800">${m.label.split(' ')[0]}</div><div style="font-size:10px;font-weight:700;margin-top:4px">${n} sujet${n>1?'s':''}</div></div>`;}).join('');updateBankCount();}
function loadFromBrowse(s){document.getElementById('monthSel').value=s;showView('studio');loadSujets();}
function saveCustomSujet(){const s=document.getElementById('bankMonth').value;
const t1=document.getElementById('bankT1').value.trim(),t2=document.getElementById('bankT2').value.trim(),d1=document.getElementById('bankDoc1').value.trim(),d2=document.getElementById('bankDoc2').value.trim();
if(!t1&&!t2&&!d1&&!d2){alert('Remplissez au moins une tâche.');return;}
const c={num:parseInt(document.getElementById('bankNum').value||'0')||((customBank[s]||[]).length+1),
t1:t1?{consigne:t1}:null,t2:t2?{consigne:t2}:null,
t3:(d1||d2)?{titre:document.getElementById('bankTitle').value.trim()||'Sujet',doc1:d1,doc2:d2}:null};
customBank[s]=customBank[s]||[];const x=customBank[s].findIndex(q=>String(q.num)===String(c.num));
if(x>=0)customBank[s][x]=c;else customBank[s].push(c);
customBank[s].sort((a,b)=>(a.num||0)-(b.num||0));SV('tcf_custom_bank',customBank);
['bankNum','bankTitle','bankT1','bankT2','bankDoc1','bankDoc2'].forEach(i=>document.getElementById(i).value='');
buildMonthGrid();saveHistory('Sujet ajouté : '+getMonth(s).label);}
function updateBankCount(){const n=Object.values(customBank).reduce((a,l)=>a+l.length,0);const e=document.getElementById('bankCount');if(e)e.textContent=n+' sujet'+(n>1?'s':'');}
function practiceCustomDirect(){
const t1=document.getElementById('bankT1').value.trim(),t2=document.getElementById('bankT2').value.trim(),d1=document.getElementById('bankDoc1').value.trim(),d2=document.getElementById('bankDoc2').value.trim();
if(!t1&&!t2&&!d1&&!d2){alert('Remplissez au moins une tâche pour pratiquer.');return;}
const tempCombo={num:'perso',
t1:t1?{consigne:t1}:null,t2:t2?{consigne:t2}:null,
t3:(d1||d2)?{titre:document.getElementById('bankTitle').value.trim()||'Sujet personnalisé',doc1:d1,doc2:d2}:null};
activeMonthSlug='custom-direct';
combos=[tempCombo];activeCombIdx=0;
const av=availableTasks(tempCombo);activeTask=av[0]||1;
document.getElementById('monthSel').value=allMonths[0].slug;
document.getElementById('sujetEmpty').style.display='none';
document.getElementById('sujetContent').style.display='block';
document.getElementById('comboBadge').textContent='Sujet personnalisé';
renderSujet();loadDraft();updateFocusBar();
showView('studio');
saveHistory('▶ Sujet perso démarré directement');
}
function exportBank(){
let lines=[];
Object.entries(customBank).forEach(([month,combos])=>{
combos.forEach(c=>{
lines.push('MOIS: '+month);
lines.push('COMBO: '+(c.num||1));
if(c.t1&&c.t1.consigne)lines.push('T1: '+c.t1.consigne);
if(c.t2&&c.t2.consigne)lines.push('T2: '+c.t2.consigne);
if(c.t3&&c.t3.titre)lines.push('TITRE: '+c.t3.titre);
if(c.t3&&c.t3.doc1)lines.push('DOC1: '+c.t3.doc1);
if(c.t3&&c.t3.doc2)lines.push('DOC2: '+c.t3.doc2);
lines.push('---');
});
});
dl(new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'}),'TCF_banque.txt');
}
function importBankTXT(){const i=document.createElement('input');i.type='file';i.accept='.txt';i.onchange=()=>{const f=i.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{parseBankTXT(r.result);}catch(e){alert('Erreur de lecture TXT : '+e.message);}};r.readAsText(f);};i.click();}
function parseBankTXT(raw){
let currentMonth='';let currentCombo={};let added=0;
const lines=raw.split(/\r?\n/);
const flush=()=>{if(currentMonth&&currentCombo.num){customBank[currentMonth]=customBank[currentMonth]||[];customBank[currentMonth].push(currentCombo);added++;}currentCombo={};};
for(let l of lines){
const trimmed=l.trim();
if(!trimmed){continue;}
if(trimmed==='---'){flush();continue;}
if(/^MOIS\s*:/i.test(trimmed)){flush();currentMonth=trimmed.replace(/^MOIS\s*:\s*/i,'').trim().toLowerCase();continue;}
if(/^COMBO\s*:/i.test(trimmed)){flush();currentCombo={num:parseInt(trimmed.replace(/^COMBO\s*:\s*/i,''))||1,t1:{},t2:{},t3:{}};continue;}
if(/^T1\s*:/i.test(trimmed)){if(!currentCombo.t1)currentCombo.t1={};currentCombo.t1.consigne=trimmed.replace(/^T1\s*:\s*/i,'');continue;}
if(/^T2\s*:/i.test(trimmed)){if(!currentCombo.t2)currentCombo.t2={};currentCombo.t2.consigne=trimmed.replace(/^T2\s*:\s*/i,'');continue;}
if(/^TITRE\s*:/i.test(trimmed)){if(!currentCombo.t3)currentCombo.t3={};currentCombo.t3.titre=trimmed.replace(/^TITRE\s*:\s*/i,'');continue;}
if(/^DOC1\s*:/i.test(trimmed)){if(!currentCombo.t3)currentCombo.t3={};currentCombo.t3.doc1=trimmed.replace(/^DOC1\s*:\s*/i,'');continue;}
if(/^DOC2\s*:/i.test(trimmed)){if(!currentCombo.t3)currentCombo.t3={};currentCombo.t3.doc2=trimmed.replace(/^DOC2\s*:\s*/i,'');continue;}
}
flush();
SV('tcf_custom_bank',customBank);buildMonthGrid();
alert(added+' combinaison(s) importée(s) avec succès !');
}
