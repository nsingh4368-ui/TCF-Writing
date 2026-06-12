// ── app-analysis.js — Vocab exercise, error quiz, text analysis, AI analysis ──────
let vocabExMode='gap';
let vocabExIdx=0;
let vocabExScore={ok:0,err:0};
let vocabExTotal=0;
let vocabQuizShuffled=[];
const GAP_FILL_TEMPLATES = [
(w,d) => `Il est important de savoir que «\u00a0___\u00a0» signifie : ${d}.`,
(w,d) => `Dans un texte argumentatif, on peut utiliser «\u00a0___\u00a0» pour exprimer : ${d}.`,
(w,d) => `Pour enrichir son vocabulaire, retenir «\u00a0___\u00a0» est essentiel — cela veut dire : ${d}.`,
(w,d) => `Le mot «\u00a0___\u00a0» peut être défini ainsi : ${d}.`,
(w,d) => `Complétez avec le bon terme : «\u00a0___\u00a0» (sens : ${d}).`,
];
function switchVocabExMode(mode){
vocabExMode = mode;
vocabExIdx = 0;
vocabExScore = {ok:0,err:0};
document.getElementById('vex-gap-tab').classList.toggle('active', mode==='gap');
document.getElementById('vex-quiz-tab').classList.toggle('active', mode==='quiz');
renderVocabExercise();
}
function initVocabExercise(){
vocabExIdx = 0;
vocabExScore = {ok:0,err:0};
const pool = vocabList.filter(v=>v.def&&v.def.trim());
vocabQuizShuffled = [...pool].sort(()=>Math.random()-.5);
vocabExTotal = pool.length;
renderVocabExercise();
}
function renderVocabExercise(){
const area = document.getElementById('vocabExArea');
if(!area) return;
const pool = vocabList.filter(v=>v.def&&v.def.trim());
if(!pool.length){
area.innerHTML='<div class="empty-state">Ajoutez des mots avec des définitions pour commencer les exercices.</div>';
return;
}
const pct = vocabExTotal>0 ? Math.round((vocabExScore.ok+vocabExScore.err)/vocabExTotal*100) : 0;
const progressHtml = `<div class="vocab-ex-progress">
<div class="ex-progress-bar"><div class="ex-progress-fill" style="width:${pct}%"></div></div>
<span class="qs-ok" style="color:var(--success)">✅ ${vocabExScore.ok}</span>
<span class="qs-err" style="color:var(--danger)">❌ ${vocabExScore.err}</span>
</div>`;
if(vocabExMode==='gap'){
const idx = vocabExIdx % pool.length;
const v = pool[idx];
const tpl = GAP_FILL_TEMPLATES[idx % GAP_FILL_TEMPLATES.length];
const sentence = tpl(v.word, v.def);
const blanked = sentence.replace('___', `<input class="vocab-gap" id="gapInput" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="?" onkeydown="if(event.key==='Enter')checkGap()">`);
area.innerHTML = progressHtml + `
<div class="vocab-ex-card">
<div class="ex-hint">📝 Remplissez la lacune avec le bon mot :</div>
<div class="vocab-ex-sentence">${blanked}</div>
<div class="btn-row">
<button class="btn btn-primary btn-sm" onclick="checkGap()">✔ Vérifier</button>
<button class="btn btn-ghost btn-sm" onclick="skipGap()">⏩ Passer</button>
<button class="btn btn-ghost btn-sm" onclick="showGapHint()" id="hintBtn">💡 Indice</button>
</div>
<div class="ex-feedback" id="gapFeedback"></div>
</div>
<div class="muted" style="font-size:11.5px;margin-top:6px">Mot ${idx+1}/${pool.length} · Thème : ${escHtml(v.theme||'Autre')}</div>`;
document.getElementById('gapInput')?.focus();
} else {
if(vocabQuizShuffled.length===0) vocabQuizShuffled=[...pool].sort(()=>Math.random()-.5);
const v = vocabQuizShuffled[vocabExIdx % vocabQuizShuffled.length];
const _qIdx = (vocabExIdx % vocabQuizShuffled.length) + 1;
area.innerHTML = progressHtml + `
<div class="vocab-quiz-card">
<div class="ex-hint">🧠 Regardez le mot — rappelez-vous sa signification — puis révélez :</div>
<div class="flashcard" onclick="this.classList.toggle('flipped')" style="cursor:pointer">
<div class="flash-inner">
<div class="flash-f">
<div style="font-size:20px;font-weight:800;color:var(--accent)">${escHtml(v.word)}</div>
<div class="muted" style="font-size:11.5px;margin-top:6px">Thème : ${escHtml(v.theme||'Autre')}</div>
<div style="font-size:11px;color:var(--sub);margin-top:10px">▾ Cliquez pour révéler</div>
</div>
<div class="flash-b">
<div style="font-size:14px;font-weight:700;margin-bottom:6px">${escHtml(v.word)}</div>
<div style="font-size:13px;line-height:1.6">${escHtml(v.def||'(pas de définition)')}</div>
</div>
</div>
</div>
<div class="muted" style="font-size:11.5px;text-align:center;margin-top:6px">Mot ${_qIdx}/${vocabQuizShuffled.length}</div>
<div style="margin-top:12px;text-align:center;font-size:12.5px;color:var(--sub)">Je connaissais ce mot ?</div>
<div class="srs-actions">
<button class="btn btn-ghost" onclick="quizSelfAssess(false)">❌ Non</button>
<button class="btn btn-primary" onclick="quizSelfAssess(true)">✅ Oui</button>
</div>
<div class="btn-row" style="margin-top:6px;justify-content:center">
<button class="btn btn-ghost btn-sm" onclick="skipQuiz()">⏩ Passer</button>
</div>
</div>`;
}
}
function checkGap(){
const pool = vocabList.filter(v=>v.def&&v.def.trim());
const idx = vocabExIdx % pool.length;
const v = pool[idx];
const inp = document.getElementById('gapInput');
const fb = document.getElementById('gapFeedback');
if(!inp||!fb) return;
const answer = inp.value.trim().toLowerCase();
const correct = v.word.toLowerCase().trim();
if(answer===correct || correct.includes(answer) && answer.length>3){
inp.classList.add('correct');
fb.className='ex-feedback ok'; fb.textContent='✅ Correct ! «\u00a0'+v.word+'\u00a0»';
vocabExScore.ok++;
setTimeout(()=>{ vocabExIdx++; renderVocabExercise(); },1200);
} else {
inp.classList.add('wrong');
fb.className='ex-feedback err'; fb.textContent='❌ Pas tout à fait — la réponse était : «\u00a0'+v.word+'\u00a0»';
vocabExScore.err++;
autoAddVocab(v.word, v.def, v.theme);
setTimeout(()=>{ vocabExIdx++; renderVocabExercise(); },2000);
}
}
function showGapHint(){
const pool = vocabList.filter(v=>v.def&&v.def.trim());
const v = pool[vocabExIdx % pool.length];
const btn=document.getElementById('hintBtn');
if(btn) btn.textContent='💡 '+v.word[0].toUpperCase()+'_'.repeat(Math.max(0,v.word.length-1));
}
function skipGap(){vocabExIdx++;renderVocabExercise();}
function quizSelfAssess(knew){
if(vocabQuizShuffled.length===0) return;
if(knew){ vocabExScore.ok++; } else { vocabExScore.err++; }
vocabExIdx++;
renderVocabExercise();
}
function skipQuiz(){vocabExIdx++;renderVocabExercise();}
let errQuizIdx=0;
let errQuizScore={ok:0,err:0};
let errQuizMode='list';
let errQuizShuffled=[];
function switchErrTab(mode){
errQuizMode=mode;
document.getElementById('etab-list').classList.toggle('active',mode==='list');
document.getElementById('etab-quiz').classList.toggle('active',mode==='quiz');
if(mode==='list') buildErrorsList();
else { errQuizIdx=0;errQuizScore={ok:0,err:0};errQuizShuffled=[...myErrors].sort(()=>Math.random()-.5);renderErrQuiz(); }
}
function renderErrQuiz(){
const area = document.getElementById('errQuizArea');
if(!area) return;
if(!myErrors.length){
area.innerHTML='<div class="empty-state">Aucune erreur enregistrée. Ajoutez des erreurs ci-dessus ou elles s\'ajoutent automatiquement après analyse.</div>';
return;
}
const pool = errQuizShuffled.filter(e=>e.right&&e.right.trim());
if(!pool.length){
area.innerHTML='<div class="empty-state">Ajoutez des corrections pour pratiquer le quiz (champ ✅ Correction).</div>';
return;
}
const idx = errQuizIdx % pool.length;
const e = pool[idx];
area.innerHTML=`
<div class="err-quiz-stats">Score : ✅ ${errQuizScore.ok} | ❌ ${errQuizScore.err} | ${idx+1}/${pool.length} erreur${pool.length>1?'s':''}</div>
<div class="err-quiz-wrap">
<div class="err-quiz-prompt">Quelle est la forme correcte de :</div>
<div class="err-wrong-display">❌ ${escHtml(e.wrong)}</div>
<input class="err-quiz-input" id="errQuizInput" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="Écrivez la correction…" onkeydown="if(event.key==='Enter')checkErrQuiz()">
<div class="btn-row">
<button class="btn btn-primary btn-sm" onclick="checkErrQuiz()">✔ Vérifier</button>
<button class="btn btn-ghost btn-sm" onclick="skipErrQuiz()">⏩ Passer</button>
<button class="btn btn-ghost btn-sm" onclick="showErrAnswer()">👁 Voir</button>
</div>
<div class="err-quiz-fb" id="errQuizFb"></div>
</div>`;
document.getElementById('errQuizInput')?.focus();
}
function checkErrQuiz(){
const pool = errQuizShuffled.filter(e=>e.right&&e.right.trim());
const e = pool[errQuizIdx % pool.length];
const inp=document.getElementById('errQuizInput');
const fb=document.getElementById('errQuizFb');
if(!inp||!fb) return;
const ans=inp.value.trim().toLowerCase();
const cor=e.right.trim().toLowerCase();
if(ans===cor){
fb.className='err-quiz-fb ok'; fb.textContent='✅ Parfait ! «\u00a0'+e.right+'\u00a0»';
errQuizScore.ok++;
setTimeout(()=>{ errQuizIdx++; renderErrQuiz(); },1200);
} else {
fb.className='err-quiz-fb err'; fb.textContent='❌ Correction : «\u00a0'+e.right+'\u00a0»';
errQuizScore.err++;
setTimeout(()=>{ errQuizIdx++; renderErrQuiz(); },2000);
}
}
function showErrAnswer(){
const pool=errQuizShuffled.filter(e=>e.right&&e.right.trim());
const e=pool[errQuizIdx%pool.length];
const fb=document.getElementById('errQuizFb');
if(fb){fb.className='err-quiz-fb err';fb.textContent='👁 Correction : «\u00a0'+e.right+'\u00a0»';}
errQuizScore.err++;
setTimeout(()=>{ errQuizIdx++; renderErrQuiz(); },2000);
}
function skipErrQuiz(){errQuizIdx++;renderErrQuiz();}
let analysisTabActive='local';
function runAnalysis(){
const t=editor.value.trim();
if(!t){alert('Rédigez d\'abord un texte à analyser.');return;}
const panel=document.getElementById('analysisPanel');
panel.classList.add('open');
const content=document.getElementById('analysisContent');
content.innerHTML=`
<div class="analysis-tabs">
<button class="analysis-tab active" id="atab-local" onclick="showAnalysisTab('local')">🔍 Analyse locale</button>
<button class="analysis-tab" id="atab-ai" onclick="showAnalysisTab('ai')">✨ Analyse IA</button>
</div>
<div id="analysis-local-pane">${buildLocalAnalysisHTML(t)}</div>
<div id="analysis-ai-pane" style="display:none">
<div class="ai-analysis-loading"><div class="ai-spinner"></div>Cliquez «\u00a0Lancer l'analyse IA\u00a0» pour une analyse approfondie par Claude.</div>
<button class="btn btn-primary" style="margin-top:10px;width:auto;padding:9px 18px" onclick="runAIAnalysis()">✨ Lancer l'analyse IA</button>
</div>`;
analysisTabActive='local';
panel.scrollIntoView({behavior:'smooth',block:'nearest'});
recycleFlags(t);
}
function showAnalysisTab(tab){
analysisTabActive=tab;
document.getElementById('atab-local').classList.toggle('active',tab==='local');
document.getElementById('atab-ai').classList.toggle('active',tab==='ai');
document.getElementById('analysis-local-pane').style.display=tab==='local'?'block':'none';
document.getElementById('analysis-ai-pane').style.display=tab==='ai'?'block':'none';
}
function buildLocalAnalysisHTML(t){
const an = analyzeTextFull(t, activeTask||1);
return renderLocalAnalysis(an);
}
function analyzeTextFull(t, taskNum){
const words=t.trim().split(/\s+/);
const wc=words.length;
const sentences=t.split(/[.!?]+/).filter(s=>s.trim().length>2);
const avgSentLen=sentences.length?Math.round(wc/sentences.length):0;
const tLow=t.toLowerCase();
const connsFound=ALL_CONN_WORDS.filter(c=>tLow.includes(c));
const nuanceFound=NUANCE.filter(c=>tLow.includes(c));
const opinionFound=OPINION_EXPR.filter(c=>tLow.includes(c));
const conseqFound=CONSEQ.filter(c=>tLow.includes(c));
const conclFound=CONCL_M.filter(c=>tLow.includes(c));
const argFound=ARG_M.filter(c=>tLow.includes(c));
const overused=OVERUSED_WORDS.filter(w=>{const re=new RegExp('\\b'+w+'\\b','gi');return(t.match(re)||[]).length>=2;});
const b2Found=B2_VOCAB.filter(([w])=>tLow.includes(w)).map(([w])=>w);
const limits=[[60,120],[120,150],[0,180]];
const [mn,mx]=limits[(taskNum||1)-1];
const wcOk = taskNum===3 ? wc<=mx : wc>=mn&&wc<=mx;
const richScore=Math.min(100,Math.round((connsFound.length/8)*60+(b2Found.length/5)*40));
const structScore=Math.min(100,Math.round((argFound.length>=1?30:0)+(conclFound.length>=1?30:0)+(nuanceFound.length>=1?20:0)+(sentences.length>=3?20:0)));
const varScore=Math.min(100,Math.round(100-overused.length*15));
const opinionScore=Math.min(100,opinionFound.length>=1?80+(nuanceFound.length>=1?20:0):0);
return {wc,wcOk,mn,mx,avgSentLen,connsFound,nuanceFound,opinionFound,conseqFound,conclFound,argFound,overused,b2Found,richScore,structScore,varScore,opinionScore,taskNum};
}
function scoreClass(s){return s>=80?'great':s>=60?'ok':s>=40?'warn':'bad';}
function renderLocalAnalysis(a){
let h='';
h+=`<div class="theme-score-grid">
<div class="theme-score-card"><div class="theme-score-val ${scoreClass(a.richScore)}">${a.richScore}</div><div class="theme-score-label">Richesse lexicale</div></div>
<div class="theme-score-card"><div class="theme-score-val ${scoreClass(a.structScore)}">${a.structScore}</div><div class="theme-score-label">Structure</div></div>
<div class="theme-score-card"><div class="theme-score-val ${scoreClass(a.varScore)}">${a.varScore}</div><div class="theme-score-label">Variété vocab.</div></div>
<div class="theme-score-card"><div class="theme-score-val ${scoreClass(a.opinionScore)}">${a.opinionScore}</div><div class="theme-score-label">Expression opinion</div></div>
</div>`;
const wcColor=a.wcOk?'var(--success)':a.wc>a.mx?'var(--danger)':'var(--warn)';
h+=`<div class="an-title">📊 Compte de mots</div>
<div class="an-item"><span class="an-badge" style="color:${wcColor}">⬤</span><div class="an-text"><strong>${a.wc} mots</strong><span>${a.wcOk?'✅ Dans les limites ('+a.mn+'-'+a.mx+')':`⚠️ Objectif : ${a.mn}–${a.mx} mots`} · ${a.avgSentLen} mots/phrase en moyenne</span></div></div>`;
h+=`<div class="an-title">🔗 Connecteurs utilisés (${a.connsFound.length})</div>`;
if(a.connsFound.length){
h+=`<div style="margin-bottom:8px">${a.connsFound.slice(0,15).map(c=>`<span class="word-chip">${escHtml(c)}</span>`).join('')}</div>`;
} else {
h+=`<div class="an-item"><span class="an-badge">⚠️</span><div class="an-text"><strong>Aucun connecteur B2 détecté</strong><span>Essayez : cependant, de plus, par conséquent, en outre…</span></div></div>`;
}
h+=`<div class="an-title">🏗️ Structure argumentative</div>`;
const structItems=[
{found:a.argFound.length>0,label:'Marqueurs d\'organisation',ex:a.argFound.join(', '),alt:'d\'abord, ensuite, enfin'},
{found:a.nuanceFound.length>0,label:'Nuance / concession',ex:a.nuanceFound.join(', '),alt:'cependant, néanmoins, bien que'},
{found:a.conseqFound.length>0,label:'Conséquence',ex:a.conseqFound.join(', '),alt:'donc, par conséquent, ainsi'},
{found:a.conclFound.length>0,label:'Conclusion',ex:a.conclFound.join(', '),alt:'en conclusion, pour conclure, bref'},
{found:a.opinionFound.length>0,label:'Expression d\'opinion',ex:a.opinionFound.join(', '),alt:'à mon avis, selon moi, il me semble que'},
];
structItems.forEach(s=>{
h+=`<div class="an-item"><span class="an-badge">${s.found?'✅':'❌'}</span><div class="an-text"><strong>${s.label}</strong><span>${s.found?s.ex:'Absent — suggestion : '+s.alt}</span></div></div>`;
});
if(a.b2Found.length){
h+=`<div class="an-title">🌟 Vocabulaire B2 détecté</div>`;
h+=`<div style="margin-bottom:8px">${a.b2Found.map(w=>`<span class="word-chip" style="background:var(--success)">${escHtml(w)}</span>`).join('')}</div>`;
}
if(a.overused.length){
h+=`<div class="an-title">🔄 Mots trop répétés</div>`;
a.overused.forEach(w=>{
h+=`<div class="an-item"><span class="an-badge">⚠️</span><div class="an-text"><strong>${escHtml(w)}</strong><span>Alternatives B2 : ${escHtml(WORD_ALTS[w]||'—')}</span></div></div>`;
});
}
if(a.opinionFound.length===0&&a.taskNum===3){
h+=`<div class="an-title">💡 Expressions d'opinion à utiliser</div>`;
h+=`<div style="margin-bottom:8px">${OPINION_ALTS.map(o=>`<span class="word-chip" style="background:#7c3aed;cursor:default">${escHtml(o)}</span>`).join('')}</div>`;
}
return h;
}
function recycleFlags(textOverride){
const t=textOverride||editor.value;
if(!t) return;
const tLow=t.toLowerCase();
OVERUSED_WORDS.forEach(w=>{
const re=new RegExp('\\b'+w+'\\b','gi');
const cnt=(t.match(re)||[]).length;
if(cnt>=3 && !myErrors.some(e=>e.wrong===w)){
myErrors.push({wrong:w,right:WORD_ALTS[w]||'',addedAt:todayStr(),auto:true});
}
});
SV('tcf_errors',myErrors);
renderErrorsPanel();
refreshBadges();
}
async function runAIAnalysis(){
const t=editor.value.trim();
if(!t){alert('Pas de texte à analyser.');return;}
const pane=document.getElementById('analysis-ai-pane');
pane.innerHTML='<div class="ai-analysis-loading"><div class="ai-spinner"></div>Analyse en cours… cela peut prendre quelques secondes.</div>';
const taskNum=activeTask||1;
const limits=['60-120 mots','120-150 mots','180 mots maximum'];
const taskLimit=limits[taskNum-1];
const combo=combos[activeCombIdx];
const consigne=combo?
(taskNum===1?combo.t1?.consigne:taskNum===2?combo.t2?.consigne:combo.t3?.titre)||'':'';
const prompt=`Tu es un correcteur expert du TCF (Test de Connaissance du Français) niveau B2. Analyse ce texte d'Expression Écrite (Tâche ${taskNum}, limite : ${taskLimit}).
${consigne?'Sujet : '+consigne+'\n\n':''}
Texte de l'étudiant :
"""
${t}
"""
Donne une analyse structurée avec ces sections exactes (utilise des émojis et sois précis) :
1. 🎯 ADÉQUATION AU SUJET — le texte répond-il bien à la consigne ?
2. 📐 STRUCTURE — introduction, développement, conclusion, paragraphes
3. 🔗 COHÉRENCE & CONNECTEURS — liens logiques, fluidité
4. 📚 RICHESSE LEXICALE — vocabulaire B2, synonymes, mots répétés
5. ✏️ GRAMMAIRE — fautes potentielles, structures complexes utilisées
6. 💡 3 CONSEILS PRIORITAIRES — les 3 points à améliorer en priorité
7. ⭐ NIVEAU ESTIMÉ — B1 / B1+ / B2 / B2+ avec justification courte
Sois bienveillant mais précis. Cite des extraits du texte quand tu suggères des améliorations.`;
try {
const res=await fetch('https://api.anthropic.com/v1/messages',{
method:'POST',
headers:{'Content-Type':'application/json'},
body:JSON.stringify({
model:'claude-sonnet-4-6',
max_tokens:1000,
messages:[{role:'user',content:prompt}]
})
});
const data=await res.json();
const text=data.content?.map(b=>b.text||'').join('\n')||'Erreur : réponse vide.';
pane.innerHTML=`<div class="ai-analysis-box">${escHtml(text)}</div>
<button class="btn btn-ghost" style="margin-top:10px;width:auto;padding:8px 14px;font-size:12px" onclick="runAIAnalysis()">🔄 Relancer</button>`;
} catch(err){
pane.innerHTML=`<div class="an-item"><span class="an-badge">⚠️</span><div class="an-text"><strong>Connexion impossible</strong><span>L'analyse IA nécessite une connexion à Claude. Erreur : ${escHtml(err.message)}</span></div></div>
<button class="btn btn-ghost" style="margin-top:10px;width:auto;padding:8px 14px;font-size:12px" onclick="runAIAnalysis()">🔄 Réessayer</button>`;
}
}
const _origShowView=showView;
window.showView=function(v){
_origShowView(v);
if(v==='vocab'){
initVocabExercise();
}
if(v==='errors'){
buildErrorsList();
}
if(v==='reading'){
renderReadingView();
}
if(v==='profile'){
loadProfileForm();buildReport();
}
};
const _origSwitchErrTab = switchErrTab;
window.switchErrTab = function(mode){
_origSwitchErrTab(mode);
const listPane = document.getElementById('errListPane');
const quizPane = document.getElementById('errQuizPane');
if(listPane) listPane.style.display = mode==='list' ? 'block' : 'none';
if(quizPane) quizPane.style.display = mode==='quiz' ? 'block' : 'none';
};
