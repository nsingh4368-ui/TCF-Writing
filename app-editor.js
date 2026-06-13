// ── app-editor.js — Editor, drafts, word counter, accents, timer, exam mode, PDF ──
const editor=document.getElementById('editor');
function draftKey(n){
if(combos.length&&activeMonthSlug){const c=combos[activeCombIdx];return 'tcf_draft_'+activeMonthSlug+'_c'+(c.num||activeCombIdx)+'_t'+n;}
return 'tcf_draft_t'+n;}
function saveDraft(){localStorage.setItem(draftKey(activeTask),editor.value);}
function loadDraft(){editor.value=localStorage.getItem(draftKey(activeTask))||'';updateWordCounter();}
function onEditorInput(){saveDraft();updateWordCounter();}
function switchTask(n){saveDraft();activeTask=n;document.getElementById('taskActive').value=String(n);if(combos.length)renderSujet();loadDraft();updateFocusBar();}
function focusSwitchTask(n){
saveDraft();
activeTask=n;
document.getElementById('taskActive').value=String(n);
loadDraft();
document.getElementById('editorTaskLabel').textContent='(Tâche '+n+')';
const dm=document.getElementById('editorFooterDoneMsg');if(dm&&!isFocusDone(n))dm.style.display='none';
if(dm&&isFocusDone(n)){dm.textContent='✅ Tâche '+n+' déjà soumise — vous pouvez continuer à écrire ou passer à la suivante.';dm.style.display='block';}
updateWordCounter();
updateFocusBar();
editor.focus();
}
const savedFont=parseInt(localStorage.getItem('tcf_font')||'15');
if(editor)editor.style.fontSize=savedFont+'px';const _fs=document.getElementById('fontSlider');if(_fs)_fs.value=savedFont;const _fv=document.getElementById('fontVal');if(_fv)_fv.textContent=savedFont+'px';
function onFontSlider(){const v=document.getElementById('fontSlider').value;document.getElementById('fontVal').textContent=v+'px';editor.style.fontSize=v+'px';const ex=document.getElementById('examEditor');if(ex)ex.style.fontSize=v+'px';localStorage.setItem('tcf_font',v);}
function wordCount(){return wcOf(editor.value);}
function updateWordCounter(){const w=wordCount();const el=document.getElementById('wordCounter');const L=[[60,120],[120,150],[0,180]];const[mn,mx]=L[(activeTask||1)-1];let c='';if(w>=mn&&w<=mx)c='ok';else if(w>mx)c='over';else if(w>=mn-20)c='warn';el.textContent=w+' mots'+(w>=mn&&w<=mx?' ✓':'');el.className='word-counter '+c;const f=document.getElementById('focusWC');if(f)f.textContent=w+' mots';}
setInterval(()=>{saveDraft();const n=new Date();const l=document.getElementById('autosaveLabel');if(l)l.textContent='Sauvegardé à '+String(n.getHours()).padStart(2,'0')+':'+String(n.getMinutes()).padStart(2,'0');if(wordCount()>=50)bumpStreak();},30000);
const accents=['é','è','ê','ë','à','â','ä','ç','ù','û','ü','î','ï','ô','œ','æ','É','È','Ê','Ë','À','Â','Ç','Ù','Û','Î','Ï','Ô','Œ','Æ','«','»','—','’'];
let accentPage=0,PAGE=12;
function renderAccentPage(){document.getElementById('accentBar').innerHTML=accents.slice(accentPage*PAGE,accentPage*PAGE+PAGE).map(a=>`<button onclick="insertAccent('${a==='\u2019'?'\\u2019':a}')">${a}</button>`).join('');}
function updateAccentDockVisibility(){const toggleBtn=document.getElementById('accentToggleBtn');if(toggleBtn)toggleBtn.style.display='flex';}
function toggleAccentDock(){const dock=document.querySelector('.accent-dock');const btn=document.getElementById('accentToggleBtn');if(!dock||!btn)return;dock.classList.toggle('open');btn.classList.toggle('active');}
function nextAccentPage(){accentPage=(accentPage+1)%Math.ceil(accents.length/PAGE);renderAccentPage();}
function prevAccentPage(){accentPage=(accentPage-1+Math.ceil(accents.length/PAGE))%Math.ceil(accents.length/PAGE);renderAccentPage();}
function insertAccent(ch){if(ch==='\\u2019')ch='’';const t=document.getElementById('examOverlay').classList.contains('active')?document.getElementById('examEditor'):editor;const s=t.selectionStart,e=t.selectionEnd;t.value=t.value.slice(0,s)+ch+t.value.slice(e);t.selectionStart=t.selectionEnd=s+ch.length;t.focus();if(t===editor)onEditorInput();else onExamInput();}
renderAccentPage();
let timerRemain=parseInt(localStorage.getItem('tcf_timer')||'3600'),timerTotal=timerRemain,timerInterval=null;
function onSlider(){document.getElementById('sliderVal').textContent=document.getElementById('timerSlider').value+' min';}
function startTimer(){timerTotal=parseInt(document.getElementById('timerSlider').value)*60;timerRemain=timerTotal;clearInterval(timerInterval);unfreezeSession();runTimer();}
function runTimer(){clearInterval(timerInterval);timerInterval=setInterval(()=>{if(timerRemain>0){timerRemain--;drawTimer();}else{clearInterval(timerInterval);freezeSession();}},1000);}
function pauseTimer(){clearInterval(timerInterval);document.getElementById('timerSub').textContent='En pause';}
function resumeTimer(){if(timerRemain>0)runTimer();}
function resetTimer(){clearInterval(timerInterval);timerRemain=timerTotal;drawTimer();}
function drawTimer(){const m=Math.floor(timerRemain/60),s=timerRemain%60;const str=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');const d=document.getElementById('timerDisplay');d.textContent=str;const f=document.getElementById('focusTimer');if(f)f.textContent=str;const p=timerTotal>0?timerRemain/timerTotal:1;const b=document.getElementById('timerBar');b.style.width=(p*100)+'%';d.className='timer-display';b.style.background='var(--accent2)';if(p<.25){d.classList.add('danger');b.style.background='#dc2626';}else if(p<.5){d.classList.add('warning');b.style.background='#d97706';}document.getElementById('timerSub').textContent=p>0?Math.round(p*100)+'% restant':'⏰ Temps écoulé !';localStorage.setItem('tcf_timer',timerRemain);}
function freezeSession(){document.getElementById('freezeOverlay').style.display='flex';editor.readOnly=true;saveHistory('Temps écoulé · '+wordCount()+' mots');}
function unfreezeSession(){document.getElementById('freezeOverlay').style.display='none';editor.readOnly=false;}
function copyCurrentWork(){navigator.clipboard.writeText('SUJET\n'+getCurrentSujet()+'\n\nRÉPONSE\n'+editor.value).then(()=>unfreezeSession()).catch(()=>alert('Copie impossible.'));}
drawTimer();
function getAllTaskTexts(){
if(!combos.length)return{t1:'',t2:'',t3:''};
const c=combos[activeCombIdx];
const mk=n=>'tcf_draft_'+activeMonthSlug+'_c'+(c.num||activeCombIdx)+'_t'+n;
localStorage.setItem(mk(activeTask),editor.value);
return{t1:localStorage.getItem(mk(1))||'',t2:localStorage.getItem(mk(2))||'',t3:localStorage.getItem(mk(3))||''};
}
function saveAsTXT(){
const c=combos[activeCombIdx];
if(!combos.length){dl(new Blob([editor.value],{type:'text/plain;charset=utf-8'}),'TCF_EE.txt');return;}
const tx=getAllTaskTexts();
const combo=c;
let out='TCF EE — '+getMonth(activeMonthSlug).label+' · Combinaison '+combo.num+'\n';
out+='Généré le '+new Date().toLocaleString('fr-FR')+'\n\n';
if(combo.t1&&combo.t1.consigne){out+='=== TÂCHE 1 (60-120 mots) ===\n'+combo.t1.consigne+'\n\nRÉPONSE :\n'+(tx.t1||'(vide)')+'\n\n';}
if(combo.t2&&combo.t2.consigne){out+='=== TÂCHE 2 (120-150 mots) ===\n'+combo.t2.consigne+'\n\nRÉPONSE :\n'+(tx.t2||'(vide)')+'\n\n';}
if(combo.t3){out+='=== TÂCHE 3 (180 mots max.) — '+( combo.t3.titre||'')+'\n';if(combo.t3.doc1)out+='[Doc 1] '+combo.t3.doc1+'\n';if(combo.t3.doc2)out+='[Doc 2] '+combo.t3.doc2+'\n';out+='\nRÉPONSE :\n'+(tx.t3||'(vide)')+'\n';}
dl(new Blob([out],{type:'text/plain;charset=utf-8'}),'TCF_EE.txt');
}
function makeDocxParagraphs(label,consigne,reponse,limite){
const{Paragraph,TextRun,HeadingLevel,AlignmentType}=docx;
const paras=[];
paras.push(new Paragraph({heading:HeadingLevel.HEADING_1,children:[new TextRun(label)]}));
if(limite)paras.push(new Paragraph({children:[new TextRun({text:limite,italics:true,color:'1d4ed8',size:20})]}));
if(consigne){paras.push(new Paragraph({children:[new TextRun({text:'Sujet :',bold:true,size:22})]}));
consigne.split('\n').forEach(l=>paras.push(new Paragraph({children:[new TextRun({text:l,size:22})],spacing:{after:60}})));}
paras.push(new Paragraph({children:[new TextRun({text:'Réponse :',bold:true,size:22})],spacing:{before:200}}));
if(reponse&&reponse.trim()){reponse.split('\n').forEach(l=>paras.push(new Paragraph({children:[new TextRun({text:l,size:22})],spacing:{after:80}})));}
else paras.push(new Paragraph({children:[new TextRun({text:'(vide)',color:'94a3b8',italics:true,size:22})]}));
paras.push(new Paragraph({children:[new TextRun('')],border:{bottom:{style:'single',size:4,color:'e2e8f0',space:1}},spacing:{before:200,after:200}}));
return paras;
}
function saveAsDOC(){
if(!window.docx){alert('Chargement docx en cours, réessayez.');return;}
if(!combos.length){alert('Chargez un sujet d\'abord.');return;}
const tx=getAllTaskTexts();
const combo=combos[activeCombIdx];
const month=getMonth(activeMonthSlug).label;
const{Document,Packer,Paragraph,TextRun,HeadingLevel}=docx;
const children=[];
children.push(new Paragraph({heading:HeadingLevel.HEADING_1,children:[new TextRun('TCF Expression Écrite')]}));
children.push(new Paragraph({children:[new TextRun({text:month+' · Combinaison '+combo.num+' · '+new Date().toLocaleDateString('fr-FR'),color:'64748b',size:20})],spacing:{after:300}}));
if(combo.t1&&combo.t1.consigne)children.push(...makeDocxParagraphs('Tâche 1',combo.t1.consigne,tx.t1,'60 mots min. / 120 mots max.'));
if(combo.t2&&combo.t2.consigne)children.push(...makeDocxParagraphs('Tâche 2',combo.t2.consigne,tx.t2,'120 mots min. / 150 mots max.'));
if(combo.t3){
let consigne3='';
if(combo.t3.doc1)consigne3+='Document 1 :\n'+combo.t3.doc1;
if(combo.t3.doc2)consigne3+=(consigne3?'\n\n':'')+'Document 2 :\n'+combo.t3.doc2;
children.push(...makeDocxParagraphs('Tâche 3 — '+(combo.t3.titre||''),consigne3,tx.t3,'180 mots maximum'));
}
const doc=new Document({styles:{default:{document:{run:{font:'Arial',size:22}}}},sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:1134,right:1134,bottom:1134,left:1134}}},children}]});
Packer.toBlob(doc).then(blob=>dl(blob,'TCF_EE_C'+combo.num+'.docx'));
}
function exportJSON(){
const sujet=getCurrentSujet();
const reponse=editor.value;
const date=new Date().toLocaleString('fr-FR');
let out='TCF EE — Export\n';
out+='Date : '+date+'\n\n';
if(sujet){out+='=== SUJET ===\n'+sujet+'\n\n';}
out+='=== RÉPONSE ===\n'+reponse+'\n';
dl(new Blob([out],{type:'text/plain;charset=utf-8'}),'TCF_EE.txt');
}
function setFocus(on){focusMode=!!on&&!!combos.length;document.body.classList.toggle('focus-mode',focusMode);updateFocusBar();updateAccentDockVisibility();}
function toggleFocusMode(){if(!focusMode){if(!combos.length){loadSujets();if(!combos.length){alert('Chargez un sujet d\'abord.');return;}}const studioView=document.getElementById('view-studio');if(!studioView||studioView.style.display==='none'){showView('studio');setTimeout(()=>setFocus(true),300);return;}setFocus(true);editor.focus();}else{setFocus(false);}}
function getFocusTopicLabel(){if(!combos.length)return'Mode focus';const c=combos[activeCombIdx];const month=getMonth(activeMonthSlug||document.getElementById('monthSel').value).label;return month+' · C'+c.num+' · Tâche '+activeTask;}
function getFocusDoneKey(task){if(!combos.length||!activeMonthSlug)return null;const c=combos[activeCombIdx];return 'tcf_focus_done_'+activeMonthSlug+'_c'+(c.num||activeCombIdx)+'_t'+task;}
function markFocusDone(task){const k=getFocusDoneKey(task);if(k)localStorage.setItem(k,'1');}
function isFocusDone(task){const k=getFocusDoneKey(task);return k?!!localStorage.getItem(k):false;}
function updateFocusBar(){
const b=document.getElementById('focusToggle');if(b)b.classList.toggle('ready',!!combos.length);
const i=document.getElementById('focusInfo');if(i)i.textContent=getFocusTopicLabel();
const tabs=document.getElementById('focusTaskTabs');
if(tabs&&combos.length){
const av=availableTasks(combos[activeCombIdx]);
tabs.innerHTML=[1,2,3].filter(n=>av.includes(n)).map(n=>`<button class="focus-task-tab${activeTask===n?' active':''}${isFocusDone(n)?' done-tab':''}" onclick="focusSwitchTask(${n})">${isFocusDone(n)?'✓ ':''}Tâche ${n}</button>`).join('');
}else if(tabs)tabs.innerHTML='';
const tp=document.getElementById('focusTopics');
if(tp&&combos.length){
const c=combos[activeCombIdx];
let html='';
if(activeTask===1){
html=c.t1&&c.t1.consigne
?'<div class="focus-task-block" style="grid-column:1/-1"><span class="ftb-label">Tâche 1 — 60-120 mots</span>'+escHtml(c.t1.consigne)+'</div>'
:'<div class="focus-task-block" style="grid-column:1/-1"><span class="ftb-label">Tâche 1</span><span style="color:var(--sub)">Non disponible</span></div>';
}else if(activeTask===2){
html=c.t2&&c.t2.consigne
?'<div class="focus-task-block" style="grid-column:1/-1"><span class="ftb-label">Tâche 2 — 120-150 mots</span>'+escHtml(c.t2.consigne)+'</div>'
:'<div class="focus-task-block" style="grid-column:1/-1"><span class="ftb-label">Tâche 2</span><span style="color:var(--sub)">Non disponible</span></div>';
}else{
let t3html='<div class="focus-task-block" style="grid-column:1/-1"><span class="ftb-label">Tâche 3 — 180 mots max.'+(c.t3&&c.t3.titre?' — '+escHtml(c.t3.titre):'')+'</span>';
if(c.t3&&(c.t3.doc1||c.t3.doc2)){
if(c.t3.doc1)t3html+='<div style="margin-bottom:6px"><span style="font-size:10px;font-weight:800;color:var(--sub)">Document 1</span><br>'+escHtml(c.t3.doc1)+'</div>';
if(c.t3.doc2)t3html+='<div><span style="font-size:10px;font-weight:800;color:var(--sub)">Document 2</span><br>'+escHtml(c.t3.doc2)+'</div>';
}else t3html+='<span style="color:var(--sub)">Non disponible</span>';
t3html+='</div>';
html=t3html;
}
tp.innerHTML=html;
}else if(tp)tp.innerHTML='';
}
function finishProduction(){const t=editor.value.trim();
if(wcOf(t)<10){alert('Production trop courte.');return;}
pendingProduction={date:todayStr(),time:new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}),topic:getCurrentTopic(),task:activeTask,month:activeMonthSlug,text:t,words:wcOf(t),confidence:null};
document.getElementById('confOverlay').style.display='flex';}
function setConfidence(c){
if(pendingProduction){
pendingProduction.confidence=c;
productions.unshift(pendingProduction);
if(productions.length>500)productions.pop();
SV('tcf_productions',productions);
saveHistory('Production : '+pendingProduction.topic+' ('+pendingProduction.words+' mots) '+c);
bumpStreak();
markFocusDone(pendingProduction.task);
localStorage.removeItem(draftKey(pendingProduction.task));
const footer=document.getElementById('editorFooterDoneMsg');
if(footer){footer.textContent='✅ Tâche '+pendingProduction.task+' soumise ('+pendingProduction.words+' mots) '+c;footer.style.display='block';}
pendingProduction=null;
refreshBadges();
updateFocusBar();
if(focusMode&&combos.length){
const av=availableTasks(combos[activeCombIdx]);
const next=av.find(n=>n!==activeTask&&!isFocusDone(n));
if(next){setTimeout(()=>focusSwitchTask(next),600);}
}
}
document.getElementById('confOverlay').style.display='none';}
function buildProductions(){const q=(document.getElementById('prodSearch').value||'').toLowerCase();
const list=productions.filter(p=>!q||p.text.toLowerCase().includes(q)||p.topic.toLowerCase().includes(q));
const topics={};productions.forEach(p=>topics[p.topic]=(topics[p.topic]||0)+1);
const mx=Math.max(1,...Object.values(topics));
document.getElementById('topicBalance').innerHTML=Object.keys(topics).length?Object.entries(topics).sort((a,b)=>b[1]-a[1]).map(([t,n])=>`<div class="bar-row"><span class="lbl">${escHtml(t)}</span><div class="bar-wrap"><div class="bar-fill" style="width:${Math.round(n/mx*100)}%"></div></div><b>${n}</b></div>`).join(''):'<div class="empty-state">Aucune production.</div>';
document.getElementById('confTable').innerHTML=productions.length?'<table style="width:100%;font-size:12px;border-collapse:collapse">'+productions.slice(0,30).map(p=>`<tr style="border-bottom:1px dashed var(--border)"><td style="padding:5px 4px;color:var(--sub)">${p.date}</td><td style="padding:5px 4px;font-weight:600">${escHtml(p.topic)}</td><td style="padding:5px 4px;font-size:18px;text-align:right">${p.confidence||'—'}</td></tr>`).join('')+'</table>'+confInsight():'<div class="empty-state">Évaluez votre confiance après chaque production.</div>';
document.getElementById('prodList').innerHTML=list.length?list.map(p=>`<div class="prod-card"><div class="prod-head"><span class="prod-topic">${p.confidence||''} ${escHtml(p.topic)}</span><span class="muted">${p.date} ${p.time||''} · ${p.words} mots <b class="del-x" onclick="delProd(${productions.indexOf(p)})">×</b></span></div><div class="prod-text" onclick="this.classList.toggle('open')">${escHtml(p.text)}</div></div>`).join(''):'<div class="empty-state">'+(q?'Aucun résultat.':'Aucune production.')+'</div>';}
function confInsight(){const w={},s={};productions.forEach(p=>{if(p.confidence==='😬')w[p.topic]=(w[p.topic]||0)+1;if(p.confidence==='😎')s[p.topic]=(s[p.topic]||0)+1;});
const W=Object.entries(w).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([t])=>t),S=Object.entries(s).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([t])=>t);
if(!W.length&&!S.length)return'';
return `<p class="muted" style="margin-top:8px">${S.length?'😎 Points forts : <b>'+S.join(', ')+'</b>. ':''}${W.length?'😬 Zones de panique : <b>'+W.join(', ')+'</b> — pratiquez-les en priorité.':''}</p>`;}
function delProd(i){if(confirm('Supprimer ?')){productions.splice(i,1);SV('tcf_productions',productions);buildProductions();refreshBadges();}}
const SRS_INTERVALS=[0,1,3,7,14,30];
let srsQueue=[],srsCur=null;
function buildConnList(){document.getElementById('connListArea').innerHTML=CONNECTORS.map(([c,l])=>`<div class="conn-cat">${c}</div>`+l.map(([w,g])=>`<div class="conn-row"><b>${escHtml(w)}</b><span class="muted">${escHtml(g)}</span></div>`).join('')).join('');}
function buildSRS(){const t=todayStr();srsQueue=ALL_CONN.map((c,i)=>({...c,i})).filter(c=>{const e=srs[c.i];return!e||e.due<=t;});
const a=document.getElementById('srsArea');
if(!srsQueue.length){a.innerHTML='<div class="empty-state">🎉 Connecteurs à jour ! '+Object.values(srs).filter(e=>e.box>=4).length+'/100 maîtrisés. Revenez demain.</div>';return;}srsNext();}
function srsNext(){const a=document.getElementById('srsArea');if(!srsQueue.length){buildSRS();return;}srsCur=srsQueue.shift();
a.innerHTML=`<div class="muted">${srsQueue.length+1} carte(s) · ${escHtml(srsCur.cat)}</div><div class="flashcard" onclick="this.classList.toggle('flipped')"><div class="flash-inner"><div class="flash-f">${escHtml(srsCur.w)}</div><div class="flash-b"><b>${escHtml(srsCur.g)}</b></div></div></div><div class="srs-actions"><button class="btn btn-ghost" onclick="srsAns(false)">❌ À revoir</button><button class="btn btn-primary" onclick="srsAns(true)">✅ Je connais</button></div>`;}
function srsAns(k){const e=srs[srsCur.i]||{box:0};e.box=k?Math.min(e.box+1,5):0;const d=new Date();d.setDate(d.getDate()+SRS_INTERVALS[e.box]);e.due=d.toISOString().slice(0,10);srs[srsCur.i]=e;SV('tcf_srs',srs);srsNext();}
let srsVQueue=[],srsVCur=null;
function buildSRSV(){const t=todayStr();srsVQueue=B2_VOCAB.map((v,i)=>({w:v[0],g:v[1],i})).filter(v=>{const e=srsV[v.i];return!e||e.due<=t;});
const a=document.getElementById('srsVArea');
if(!srsVQueue.length){a.innerHTML='<div class="empty-state">🎉 Vocab B2 à jour ! '+Object.values(srsV).filter(e=>e.box>=4).length+'/'+B2_VOCAB.length+' maîtrisés.</div>';return;}srsVNext();}
function srsVNext(){const a=document.getElementById('srsVArea');if(!srsVQueue.length){buildSRSV();return;}srsVCur=srsVQueue.shift();
a.innerHTML=`<div class="muted">${srsVQueue.length+1} carte(s)</div><div class="flashcard" onclick="this.classList.toggle('flipped')"><div class="flash-inner"><div class="flash-f">${escHtml(srsVCur.w)}</div><div class="flash-b">${escHtml(srsVCur.g)}</div></div></div><div class="srs-actions"><button class="btn btn-ghost" onclick="srsVAns(false)">❌ À revoir</button><button class="btn btn-primary" onclick="srsVAns(true)">✅ Je connais</button></div>`;}
function srsVAns(k){const e=srsV[srsVCur.i]||{box:0};e.box=k?Math.min(e.box+1,5):0;const d=new Date();d.setDate(d.getDate()+SRS_INTERVALS[e.box]);e.due=d.toISOString().slice(0,10);srsV[srsVCur.i]=e;SV('tcf_srs_vocab',srsV);srsVNext();}
function addVocabWord(){const w=document.getElementById('vocabWord').value.trim(),d=document.getElementById('vocabDef').value.trim();
const th=document.getElementById('vocabTheme').value||'Autre';if(!w)return;
vocabList.push({word:w,def:d,theme:th,addedAt:todayStr()});SV('tcf_vocab',vocabList);
document.getElementById('vocabWord').value='';document.getElementById('vocabDef').value='';
renderVocabList();renderSentenceChips();renderThemeBalance();refreshBadges();}
function autoAddVocab(word,def,theme){if(word&&!vocabList.some(v=>v.word===word)){vocabList.push({word,def,theme:theme||'Autre',auto:true,addedAt:todayStr()});SV('tcf_vocab',vocabList);refreshBadges();}}
function renderVocabList(){const el=document.getElementById('vocabList');
el.innerHTML=vocabList.length?[...vocabList].reverse().map((v,ri)=>{const i=vocabList.length-1-ri;
return`<div class="list-item"><div class="list-item-text"><b style="color:var(--accent)">${escHtml(v.word)}</b>${v.def?' — <span class="muted">'+escHtml(v.def)+'</span>':''} <span class="muted">[${escHtml(v.theme||'Autre')}${v.auto?' · auto':''}]</span></div><span class="del-x" onclick="delVocab(${i})">×</span></div>`;}).join(''):'<div class="empty-state">Aucun mot.</div>';}
function delVocab(i){vocabList.splice(i,1);SV('tcf_vocab',vocabList);renderVocabList();renderSentenceChips();renderThemeBalance();refreshBadges();}
function exportVocabTXT(){dl(new Blob([vocabList.map(v=>v.word+(v.def?' — '+v.def:'')+' ['+(v.theme||'Autre')+']').join('\n')],{type:'text/plain;charset=utf-8'}),'TCF_vocabulaire.txt');}
function renderThemeBalance(){const el=document.getElementById('vocabThemeBalance');if(!el)return;
const c={};TCF_THEMES.forEach(t=>c[t]=0);vocabList.forEach(v=>c[v.theme||'Autre']=(c[v.theme||'Autre']||0)+1);
const mx=Math.max(1,...Object.values(c));const mn=Math.min(...Object.values(c));
el.innerHTML='<div class="an-title">Vocabulaire par thème TCF</div>'+TCF_THEMES.map(t=>`<div class="bar-row"><span class="lbl">${t}</span><div class="bar-wrap"><div class="bar-fill" style="width:${Math.round(c[t]/mx*100)}%"></div></div><b>${c[t]}</b></div>`).join('')+`<p class="muted">💡 Thèmes faibles : <b>${TCF_THEMES.filter(t=>c[t]===mn).slice(0,3).join(', ')}</b> — enrichissez-les en priorité.</p>`;}
let flashIdx=0;
function renderFlashcards(){const el=document.getElementById('flashArea');
if(!vocabList.length){el.innerHTML='<div class="empty-state">Ajoutez des mots d\'abord.</div>';return;}
flashIdx=flashIdx%vocabList.length;const v=vocabList[flashIdx];
el.innerHTML=`<div class="muted">${flashIdx+1}/${vocabList.length}</div><div class="flashcard" onclick="this.classList.toggle('flipped')"><div class="flash-inner"><div class="flash-f">${escHtml(v.word)}</div><div class="flash-b">${escHtml(v.def||'(pas de définition)')}</div></div></div><div class="btn-row"><button class="btn btn-ghost btn-sm" onclick="flashIdx=(flashIdx-1+vocabList.length)%vocabList.length;renderFlashcards()">‹ Précédent</button><button class="btn btn-primary btn-sm" onclick="flashIdx=(flashIdx+1)%vocabList.length;renderFlashcards()">Suivant ›</button></div>`;}
function renderSentenceChips(){const el=document.getElementById('sentenceChips');if(el)el.innerHTML=vocabList.length?vocabList.map(v=>`<span class="word-chip" onclick="insertWordInSentence(this.textContent)">${escHtml(v.word)}</span>`).join(''):'<span class="muted">Ajoutez des mots d\'abord.</span>';}
function insertWordInSentence(w){const sa=document.getElementById('sentenceArea');sa.value+=(sa.value&&!sa.value.endsWith(' ')?' ':'')+w+' ';sa.focus();}
function saveSentencePractice(){const t=document.getElementById('sentenceArea').value.trim();if(!t)return;savedSentences.unshift({text:t,date:new Date().toLocaleDateString('fr-FR')});if(savedSentences.length>50)savedSentences.pop();SV('tcf_sentences',savedSentences);document.getElementById('sentenceArea').value='';renderSavedSentences();}
function renderSavedSentences(){const el=document.getElementById('savedSentences');if(el)el.innerHTML=savedSentences.slice(0,10).map((s,i)=>`<div class="list-item"><div class="list-item-text"><span class="muted">${s.date}</span> — ${escHtml(s.text)}</div><span class="del-x" onclick="savedSentences.splice(${i},1);SV('tcf_sentences',savedSentences);renderSavedSentences()">×</span></div>`).join('');}
function addError(){const w=document.getElementById('errWrong').value.trim(),r=document.getElementById('errRight').value.trim();if(!w)return;
myErrors.push({wrong:w,right:r,addedAt:todayStr()});SV('tcf_errors',myErrors);
document.getElementById('errWrong').value='';document.getElementById('errRight').value='';
buildErrorsList();renderErrorsPanel();refreshBadges();}
function buildErrorsList(){const el=document.getElementById('errorsList');
el.innerHTML=myErrors.length?myErrors.map((e,i)=>`<div class="list-item"><div class="list-item-text">❌ <b style="color:var(--danger)">${escHtml(e.wrong)}</b>${e.right?' → ✅ <b style="color:var(--success)">'+escHtml(e.right)+'</b>':''}</div><span class="del-x" onclick="delError(${i})">×</span></div>`).join(''):'<div class="empty-state">Aucune erreur notée.</div>';}
function delError(i){myErrors.splice(i,1);SV('tcf_errors',myErrors);buildErrorsList();renderErrorsPanel();refreshBadges();}
function renderErrorsPanel(){const p=document.getElementById('errorsPanel');
if(!myErrors.length){p.style.display='none';return;}p.style.display='block';
document.getElementById('errorsPanelChips').innerHTML=myErrors.slice(-8).map(e=>`<span class="err-chip">❌ ${escHtml(e.wrong)}${e.right?' → ✅ '+escHtml(e.right):''}</span>`).join('');}
function addFav(){const s=getCurrentSujet();if(!s){alert('Chargez un sujet d\'abord.');return;}if(!favorites.includes(s)){favorites.push(s);SV('tcf_favorites',favorites);refreshBadges();}}
function addRevisit(){const s=getCurrentSujet();if(!s){alert('Chargez un sujet d\'abord.');return;}if(!revisits.includes(s)){revisits.push(s);SV('tcf_revisits',revisits);refreshBadges();}}
function buildFavList(){const el=document.getElementById('favList');el.innerHTML=favorites.length?favorites.map((f,i)=>`<div class="list-item"><div class="list-item-text">${escHtml(f)}</div><span class="del-x" onclick="favorites.splice(${i},1);SV('tcf_favorites',favorites);refreshBadges();buildFavList()">×</span></div>`).join(''):'<div class="empty-state">Aucun favori.</div>';}
function buildRevList(){const el=document.getElementById('revList');el.innerHTML=revisits.length?revisits.map((r,i)=>`<div class="list-item"><div class="list-item-text">${escHtml(r)}</div><span class="del-x" onclick="revisits.splice(${i},1);SV('tcf_revisits',revisits);refreshBadges();buildRevList()">×</span></div>`).join(''):'<div class="empty-state">Rien à réviser.</div>';}
function saveHistory(t){history.push({time:new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}),date:todayStr(),text:t});if(history.length>300)history=history.slice(-300);SV('tcf_history',history);refreshBadges();}
function buildHistList(){const el=document.getElementById('histList');
if(!history.length){el.innerHTML='<div class="empty-state">Aucun historique.</div>';return;}
const g={};[...history].reverse().forEach(h=>{(g[h.date||'—']=g[h.date||'—']||[]).push(h);});
el.innerHTML=Object.entries(g).map(([d,es])=>`<div class="hist-date-group">${d}</div>`+es.map(h=>`<div class="hist-item"><span class="hist-time">${h.time}</span><span>${escHtml(h.text)}</span></div>`).join('')).join('');}
function buildStats(){document.getElementById('statProd').textContent=productions.length;
document.getElementById('statWords').textContent=productions.reduce((a,p)=>a+p.words,0)+wordCount();
document.getElementById('statStreak').textContent=streak.cur;document.getElementById('statBest').textContent=streak.best;
document.getElementById('statVocab').textContent=vocabList.length;
document.getElementById('statConn').textContent=Object.values(srs).filter(e=>e.box>=4).length;
document.getElementById('statFav').textContent=favorites.length;document.getElementById('statHist').textContent=history.length;}
function refreshBadges(){const set=(i,n)=>{const e=document.getElementById(i);if(e)e.textContent=n;};
set('fav-badge',favorites.length);set('rev-badge',revisits.length);set('hist-badge',history.length);
set('prod-badge',productions.length);set('vocab-badge',vocabList.length);set('err-badge',myErrors.length);
set('read-badge',readingDocs.length);}
function bumpStreak(){const t=todayStr();if(streak.lastDate===t)return;
const y=new Date(Date.now()-864e5).toISOString().slice(0,10);
streak.cur=(streak.lastDate===y)?streak.cur+1:1;streak.best=Math.max(streak.best,streak.cur);
streak.lastDate=t;streak.days=streak.days||[];if(!streak.days.includes(t))streak.days.push(t);
SV('tcf_streak',streak);renderStreak();}
function renderStreak(){document.getElementById('streakStrip').textContent='🔥 Série : '+streak.cur+' jour'+(streak.cur>1?'s':'')+(streak.best>1?' · Record : '+streak.best:'');}
function saveProfile(){profile={prenom:document.getElementById('profPrenom').value.trim(),nom:document.getElementById('profNom').value.trim(),objectif:document.getElementById('profObjectif').value,dateExamen:document.getElementById('profDate').value};
SV('tcf_profile',profile);applyProfile();buildReport();alert('Profil enregistré, '+(profile.prenom||'étudiant')+' ! (conservé même PC éteint)');}
function loadProfileForm(){if(profile.prenom)document.getElementById('profPrenom').value=profile.prenom;if(profile.nom)document.getElementById('profNom').value=profile.nom;if(profile.objectif)document.getElementById('profObjectif').value=profile.objectif;if(profile.dateExamen)document.getElementById('profDate').value=profile.dateExamen;}
function applyProfile(){const full=((profile.prenom||'')+' '+(profile.nom||'')).trim();const bn=document.getElementById('brandName');
if(full){bn.textContent=full;bn.style.display='block';
document.getElementById('profileBanner').style.display='flex';
document.getElementById('profileAvatar').textContent=(profile.prenom||'?')[0].toUpperCase();
document.getElementById('pbName').textContent=full;
document.getElementById('pbSub').textContent='Objectif '+(profile.objectif||'B2')+(profile.dateExamen?' · Examen le '+profile.dateExamen:'');
document.getElementById('studioGreeting').innerHTML='<p class="muted" style="margin-bottom:12px">Bonjour <b style="color:var(--accent)">'+escHtml(profile.prenom||full)+'</b> 👋 — objectif <b>'+(profile.objectif||'B2')+'</b>'+(daysLeft()!==null?' · <b>'+daysLeft()+' jours</b> avant l\'examen':'')+'</p>';
}else{bn.style.display='none';document.getElementById('profileBanner').style.display='none';document.getElementById('studioGreeting').innerHTML='';}}
function daysLeft(){if(!profile.dateExamen)return null;return Math.max(0,Math.ceil((new Date(profile.dateExamen)-new Date())/864e5));}
function buildReport(){const tot=productions.reduce((a,p)=>a+p.words,0);
const byTask=[1,2,3].map(n=>productions.filter(p=>p.task===n).length);const mT=Math.max(1,...byTask);
document.getElementById('reportContent').innerHTML=
`<div class="bar-row"><span class="lbl">📄 Productions</span><b>${productions.length}</b></div>
<div class="bar-row"><span class="lbl">📝 Mots rédigés</span><b>${tot}</b></div>
<div class="bar-row"><span class="lbl">🔥 Série / Record</span><b>${streak.cur} / ${streak.best}</b></div>
<div class="bar-row"><span class="lbl">📆 Jours actifs</span><b>${(streak.days||[]).length}</b></div>
<div class="bar-row"><span class="lbl">📖 Vocabulaire</span><b>${vocabList.length} mots</b></div>
<div class="bar-row"><span class="lbl">🔗 Connecteurs maîtrisés</span><b>${Object.values(srs).filter(e=>e.box>=4).length}/100</b></div>
<div class="bar-row"><span class="lbl">🧠 Vocab B2 maîtrisé</span><b>${Object.values(srsV).filter(e=>e.box>=4).length}/${B2_VOCAB.length}</b></div>
<div class="bar-row"><span class="lbl">♻️ Erreurs suivies</span><b>${myErrors.length}</b></div>
<div class="an-title">Pratique par tâche</div>
${[1,2,3].map(n=>`<div class="bar-row"><span class="lbl">Tâche ${n}</span><div class="bar-wrap"><div class="bar-fill" style="width:${Math.round(byTask[n-1]/mT*100)}%"></div></div><b>${byTask[n-1]}</b></div>`).join('')}${confInsight()}`;}
function exportReport(){const full=((profile.prenom||'')+' '+(profile.nom||'')).trim()||'Étudiant';
dl(new Blob(['RAPPORT TCF EE STUDIO X\nÉtudiant : '+full+'\nObjectif : '+(profile.objectif||'B2')+'\nDate examen : '+(profile.dateExamen||'—')+'\nProductions : '+productions.length+'\nMots rédigés : '+productions.reduce((a,p)=>a+p.words,0)+'\nSérie : '+streak.cur+' (record '+streak.best+')\nVocabulaire : '+vocabList.length+' mots\nConnecteurs maîtrisés : '+Object.values(srs).filter(e=>e.box>=4).length+'/100\nErreurs suivies : '+myErrors.length+'\nGénéré le : '+new Date().toLocaleString('fr-FR')],{type:'text/plain;charset=utf-8'}),'TCF_rapport.txt');}
let examRemain=3600,examInterval=null,examCombo=null,examTask=1;
function launchExamDay(){if(!combos.length)loadSujets();
if(!combos.length){const s=Object.keys(customBank).filter(k=>(customBank[k]||[]).length);if(!s.length){alert('Aucun sujet.');return;}activeMonthSlug=s[0];combos=customBank[activeMonthSlug].map((c,i)=>({...c,num:c.num||i+1}));}
document.getElementById('examOverlay').classList.add('active');
document.getElementById('examLaunch').style.display='block';document.getElementById('examShell').style.display='none';}
function closeExamLaunch(){document.getElementById('examOverlay').classList.remove('active');}
function startExamDay(){examCombo=combos[Math.floor(Math.random()*combos.length)];
examTask=availableTasks(examCombo)[0]||1;examRemain=3600;
examAnswers={1:'',2:'',3:''};SV('tcf_exam_answers',examAnswers);
document.body.classList.add('exam-active');
document.getElementById('examLaunch').style.display='none';document.getElementById('examShell').style.display='block';
document.getElementById('examComboLabel').textContent=getMonth(activeMonthSlug).label+' · Combinaison '+examCombo.num;
document.getElementById('examEditor').value='';
document.getElementById('examEditor').style.fontSize=(localStorage.getItem('tcf_font')||'15')+'px';
renderExamTask();clearInterval(examInterval);
examInterval=setInterval(()=>{if(examRemain>0){examRemain--;drawExamTimer();}else{clearInterval(examInterval);alert('⏰ Temps écoulé !');endExam();}},1000);
drawExamTimer();saveHistory('🎓 Examen démarré · C'+examCombo.num);updateAccentDockVisibility();}
function drawExamTimer(){const m=Math.floor(examRemain/60),s=examRemain%60;const e=document.getElementById('examTimer');e.textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');e.style.color=examRemain<600?'#fecaca':'#fff';}
function renderExamTask(){const av=availableTasks(examCombo);
document.getElementById('examTaskTabs').innerHTML=[1,2,3].map(n=>`<div class="task-tab ${examTask===n?'active':''} ${av.includes(n)?'':'missing'}" onclick="switchExamTask(${n})">Tâche ${n}${(examAnswers[n]||'').trim()?' ✍':''}</div>`).join('');
renderTaskContent(examCombo,document.getElementById('examTaskContent'),examTask);
document.getElementById('examTaskName').textContent='Tâche '+examTask;}
function switchExamTask(n){examAnswers[examTask]=document.getElementById('examEditor').value;SV('tcf_exam_answers',examAnswers);
examTask=n;renderExamTask();document.getElementById('examEditor').value=examAnswers[n]||'';onExamInput();}
function onExamInput(){examAnswers[examTask]=document.getElementById('examEditor').value;SV('tcf_exam_answers',examAnswers);
const w=wcOf(document.getElementById('examEditor').value);const L=[[60,120],[120,150],[0,180]];const[mn,mx]=L[examTask-1];
const el=document.getElementById('examWC');el.textContent=w+' mots'+(w>=mn&&w<=mx?' ✓':'');el.className='word-counter '+(w>=mn&&w<=mx?'ok':(w>mx?'over':''));}
function endExam(){examAnswers[examTask]=document.getElementById('examEditor').value;SV('tcf_exam_answers',examAnswers);
clearInterval(examInterval);
[1,2,3].forEach(n=>{const t=(examAnswers[n]||'').trim();if(wcOf(t)>=10){productions.unshift({date:todayStr(),time:new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}),topic:'Examen T'+n+' · C'+examCombo.num,task:n,month:activeMonthSlug,text:t,words:wcOf(t),confidence:null,exam:true});}});
SV('tcf_productions',productions);bumpStreak();refreshBadges();
let html='<h3 class="h3">🏁 Analyse complète de l\'examen</h3>';
[1,2,3].forEach(n=>{const t=(examAnswers[n]||'').trim();if(t){html+='<div class="an-title" style="font-size:15px">Tâche '+n+' — '+wcOf(t)+' mots</div>'+renderLocalAnalysis(analyzeTextFull(t,n));recycleFlags();}});
html+='<div class="btn-row" style="margin-top:12px"><button class="btn btn-ghost btn-sm" onclick="saveExamTXT()">💾 Tout en TXT</button><button class="btn btn-ghost btn-sm" onclick="saveExamDOC()">📄 Tout en DOC</button><button class="btn btn-primary btn-sm" onclick="confirmLeaveExam(true)">Fermer</button></div>';
document.getElementById('examTaskContent').innerHTML=html;
document.getElementById('examEditorCard').style.display='none';
saveHistory('🏁 Examen terminé · '+[1,2,3].map(n=>'T'+n+':'+wcOf(examAnswers[n]||'')).join(' '));}
function allExamText(){return [1,2,3].map(n=>'=== TÂCHE '+n+' ===\n'+(examAnswers[n]||'(vide)')).join('\n\n');}
function saveExamTXT(){
examAnswers[examTask]=document.getElementById('examEditor').value;
let out='TCF EE — MODE EXAMEN\n';
out+=getMonth(activeMonthSlug).label+' · Combinaison '+examCombo.num+'\n';
out+='Généré le '+new Date().toLocaleString('fr-FR')+'\n\n';
[1,2,3].forEach(n=>{
const t=(examAnswers[n]||'').trim();
const lbl=['60-120 mots','120-150 mots','180 mots max.'][n-1];
out+='=== TÂCHE '+n+' ('+lbl+') ===\n'+(t||'(vide)')+'\n\n';
});
dl(new Blob([out],{type:'text/plain;charset=utf-8'}),'TCF_examen.txt');
}
function saveExamDOC(){
if(!window.docx){alert('Chargement docx en cours, réessayez.');return;}
examAnswers[examTask]=document.getElementById('examEditor').value;
const{Document,Packer,Paragraph,TextRun,HeadingLevel}=docx;
const month=getMonth(activeMonthSlug).label;
const children=[];
children.push(new Paragraph({heading:HeadingLevel.HEADING_1,children:[new TextRun('TCF EE — Mode Examen')]}));
children.push(new Paragraph({children:[new TextRun({text:month+' · Combinaison '+examCombo.num+' · '+new Date().toLocaleDateString('fr-FR'),color:'64748b',size:20})],spacing:{after:300}}));
const limites=['60 mots min. / 120 mots max.','120 mots min. / 150 mots max.','180 mots maximum'];
[1,2,3].forEach(n=>{
const t=(examAnswers[n]||'').trim();
let consigne='';
if(n===1&&examCombo.t1)consigne=examCombo.t1.consigne||'';
if(n===2&&examCombo.t2)consigne=examCombo.t2.consigne||'';
if(n===3&&examCombo.t3){if(examCombo.t3.doc1)consigne+='Document 1 :\n'+examCombo.t3.doc1;if(examCombo.t3.doc2)consigne+=(consigne?'\n\n':'')+'Document 2 :\n'+examCombo.t3.doc2;}
children.push(...makeDocxParagraphs('Tâche '+n,consigne,t,limites[n-1]));
});
const doc=new Document({styles:{default:{document:{run:{font:'Arial',size:22}}}},sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:1134,right:1134,bottom:1134,left:1134}}},children}]});
Packer.toBlob(doc).then(blob=>dl(blob,'TCF_examen_C'+examCombo.num+'.docx'));
}
function confirmLeaveExam(skip){
if(!skip){if(!confirm('⚠️ Vous êtes en MODE EXAMEN. Voulez-vous vraiment quitter ?'))return;
if(!confirm('🛑 Confirmation finale : quitter maintenant ?'))return;
examAnswers[examTask]=document.getElementById('examEditor').value;SV('tcf_exam_answers',examAnswers);}
clearInterval(examInterval);
document.getElementById('examOverlay').classList.remove('active');
document.getElementById('examEditorCard').style.display='block';
document.body.classList.remove('exam-active');updateAccentDockVisibility();}
function toggleTheme(){document.body.classList.toggle('dark');localStorage.setItem('tcf_theme',document.body.classList.contains('dark')?'dark':'light');}
if(localStorage.getItem('tcf_theme')==='dark')document.body.classList.add('dark');
document.getElementById('vocabTheme').innerHTML=TCF_THEMES.map(t=>`<option value="${t}">Thème : ${t}</option>`).join('');
populateMonthSelect();onMonthChange();refreshBadges();renderStreak();applyProfile();renderErrorsPanel();loadDraft();
// Accent dock is shown/hidden by showView() — do not force it open on load
function openPDFModal(){
document.getElementById('pdfModal').classList.add('active');
}
function closePDFModal(){
document.getElementById('pdfModal').classList.remove('active');
}
function exportPDF(mode){
closePDFModal();
const combo = combos[activeCombIdx];
if(!combo && mode!=='current'){alert('Chargez un sujet d\'abord.');return;}
if(combo){
const mk=n=>'tcf_draft_'+activeMonthSlug+'_c'+(combo.num||activeCombIdx)+'_t'+n;
localStorage.setItem(mk(activeTask), editor.value);
}
const monthLabel = activeMonthSlug ? getMonth(activeMonthSlug).label : 'TCF EE';
if(mode==='current'){
const txt = editor.value;
const taskNum = activeTask;
generatePDFFromContent([{title:'Tâche '+taskNum, text:txt, task:taskNum, combo:combo, monthLabel}], 'TCF_T'+taskNum+'.pdf');
} else if(mode==='all_combined'){
const tx = getAllTaskTexts();
const items = [];
if(combo.t1&&combo.t1.consigne) items.push({title:'Tâche 1 — 60-120 mots', consigne:combo.t1.consigne, text:tx.t1, task:1, combo, monthLabel});
if(combo.t2&&combo.t2.consigne) items.push({title:'Tâche 2 — 120-150 mots', consigne:combo.t2.consigne, text:tx.t2, task:2, combo, monthLabel});
if(combo.t3) items.push({title:'Tâche 3 — '+(combo.t3.titre||''), consigne:(combo.t3.doc1?'Doc 1: '+combo.t3.doc1:'')+(combo.t3.doc2?'\nDoc 2: '+combo.t3.doc2:''), text:tx.t3, task:3, combo, monthLabel});
generatePDFFromContent(items, 'TCF_EE_C'+combo.num+'_complet.pdf');
} else if(mode==='all_separate'){
const tx = getAllTaskTexts();
const tasks = [];
if(combo.t1&&combo.t1.consigne) tasks.push({title:'Tâche 1 — 60-120 mots', consigne:combo.t1.consigne, text:tx.t1, task:1, combo, monthLabel});
if(combo.t2&&combo.t2.consigne) tasks.push({title:'Tâche 2 — 120-150 mots', consigne:combo.t2.consigne, text:tx.t2, task:2, combo, monthLabel});
if(combo.t3) tasks.push({title:'Tâche 3 — '+(combo.t3.titre||''), consigne:(combo.t3.doc1?'Doc 1: '+combo.t3.doc1:'')+(combo.t3.doc2?'\nDoc 2: '+combo.t3.doc2:''), text:tx.t3, task:3, combo, monthLabel});
tasks.forEach((t,i)=>{
setTimeout(()=>generatePDFFromContent([t],'TCF_T'+t.task+'_C'+combo.num+'.pdf'),i*400);
});
}
}
function generatePDFFromContent(items, filename){
const isDark = document.body.classList.contains('dark');
let body = `
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:13px;line-height:1.7;color:#0f172a;background:#fff;padding:0}
.page{max-width:720px;margin:0 auto;padding:36px 48px}
.header{border-bottom:3px solid #1d4ed8;padding-bottom:14px;margin-bottom:24px}
.header h1{font-size:22px;font-weight:800;color:#1d4ed8}
.header .sub{font-size:12px;color:#64748b;margin-top:4px}
.task-block{margin-bottom:32px;page-break-inside:avoid}
.task-title{font-size:15px;font-weight:800;color:#1d4ed8;border-left:4px solid #1d4ed8;padding-left:10px;margin-bottom:10px}
.consigne-box{background:#f6f8fc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;font-size:12px;color:#334155;margin-bottom:12px;white-space:pre-wrap;line-height:1.65}
.consigne-label{font-size:10px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px}
.response-label{font-size:10px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px}
.response-text{font-size:14px;line-height:1.85;white-space:pre-wrap;color:#0f172a;min-height:80px}
.word-count{font-size:11px;color:#94a3b8;margin-top:8px;font-style:italic}
.footer{margin-top:32px;padding-top:14px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;display:flex;justify-content:space-between}
@media print{.no-print{display:none}.page{padding:20px 30px}}
</style>
<div class="page">
<div class="header">
<h1>TCF EE Studio X — Expression Écrite</h1>
<div class="sub">${items[0]?.monthLabel||'TCF EE'} ${items[0]?.combo?'· Combinaison '+items[0].combo.num:''} · Généré le ${new Date().toLocaleDateString('fr-FR')}</div>
</div>`;
items.forEach(item=>{
const wc = item.text ? (item.text.trim() ? item.text.trim().split(/\s+/).length : 0) : 0;
body += `<div class="task-block">
<div class="task-title">${item.title}</div>
${item.consigne?`<div class="consigne-label">Sujet</div><div class="consigne-box">${item.consigne.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>`:''}
<div class="response-label">Réponse</div>
<div class="response-text">${(item.text||'(vide)').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
<div class="word-count">${wc} mot${wc!==1?'s':''}</div>
</div>`;
});
body += `<div class="footer"><span>TCF EE Studio X</span><span>Export PDF — ${filename}</span></div></div>`;
const w = window.open('','_blank','width=800,height=900');
w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>'+filename+'</title></head><body>'+body+`
<div class="no-print" style="position:fixed;top:12px;right:12px;display:flex;gap:8px">
<button onclick="window.print()" style="background:#1d4ed8;color:#fff;border:none;border-radius:9px;padding:9px 18px;font-size:13px;font-weight:700;cursor:pointer">🖨 Imprimer / Enregistrer PDF</button>
<button onclick="window.close()" style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:9px;padding:9px 14px;font-size:13px;font-weight:700;cursor:pointer">✕ Fermer</button>
</div>
</body></html>`);
w.document.close();
}

/* ── Mobile Accent Dock Drawer Handler ── */
document.addEventListener('DOMContentLoaded',()=>{const dock=document.querySelector('.accent-dock');if(!dock)return;dock.addEventListener('touchstart',e=>{if(e.target.closest('.accent-nav')||e.target.closest('.accent-page button'))return;const touch=e.touches[0];const startY=touch.clientY;let isDragging=false;const handleMove=(moveEvent)=>{const moveTouch=moveEvent.touches[0];const diff=moveTouch.clientY-startY;if(Math.abs(diff)>5)isDragging=true;if(isDragging){dock.style.transition='none';const newBottom=Math.min(0,Math.max(-120,-(120-diff)));dock.style.bottom=newBottom+'px';}};const handleEnd=()=>{dock.style.transition='bottom .25s ease';const isOpen=dock.classList.contains('open');const bottom=parseInt(dock.style.bottom||'0');const shouldOpen=bottom>-60;if(isOpen&&!shouldOpen){dock.classList.remove('open');dock.style.bottom='-120px';}else if(!isOpen&&shouldOpen){dock.classList.add('open');dock.style.bottom='0';}else if(isOpen){dock.style.bottom='0';}else{dock.style.bottom='-120px';}document.removeEventListener('touchmove',handleMove);document.removeEventListener('touchend',handleEnd);isDragging=false;};document.addEventListener('touchmove',handleMove,{passive:true});document.addEventListener('touchend',handleEnd);});dock.addEventListener('click',()=>{if(window.innerWidth<=768){dock.classList.toggle('open');if(dock.classList.contains('open')){dock.style.bottom='0';}else{dock.style.bottom='-120px';}}});});

