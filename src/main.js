/* ---------- render ---------- */
function render(){
  const v=UI.view,el=$('#view');
  el.innerHTML=v==='home'?viewHome():v==='budget'?viewBudget():v==='log'?viewLog():v==='reports'?viewReports():viewImport();
  el.classList.toggle('enter',!!UI.enter);UI.enter=false;
  renderChrome();post();
}
function post(){
  const rm=matchMedia('(prefers-reduced-motion: reduce)').matches;
  $$('[data-count]').forEach(el=>{
    const to=+el.dataset.count,k=el.dataset.ck,from=lastVals[k]!=null?lastVals[k]:0;lastVals[k]=to;
    if(from===to||rm)return;const t0=performance.now(),dur=1100;
    (function step(t){const p=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-p,4);el.textContent=fmt(from+(to-from)*e);if(p<1)requestAnimationFrame(step)})(t0);
  });
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    $$('.bar i[data-w]').forEach(i=>i.style.width=Math.max(0,Math.min(100,i.dataset.w))+'%');
    $$('.rtrack i[data-h]').forEach(i=>i.style.height=i.dataset.h+'%');
  }));
  bindChart();UI.animate=false;
}
function setView(v){UI.view=v;UI.animate=v==='home';UI.enter=true;UI.confirm=null;history.replaceState(null,'','#'+v);render();window.scrollTo({top:0})}
function commit(msg,cls){save();checkBadges(false);render();if(msg)toast(msg,cls||'good')}

/* ---------- backup ---------- */
async function exportBackup(){
  if(typeof XLSX==='undefined'){toast('مكتبة Excel ما تحمّلت. تأكد من الاتصال.','bad');return}
  const wb=XLSX.utils.book_new(),T=timeline();
  const ent=[['التاريخ','البيان','القسم','المبلغ','الشهر']];
  Object.keys(S.months).sort().forEach(k=>S.months[k].entries.slice().sort((a,b)=>a.date.localeCompare(b.date)).forEach(e=>{const s=secOf(e.sec);ent.push([e.date,e.title,s?s.name:'',e.amount,monthLong(k)])}));
  const mon=[['الشهر','الراتب','الالتزامات','دخل إضافي','المصروف','المجنّب','مدخرات الشهر','إجمالي المدخرات']];
  T.forEach(p=>mon.push([monthLong(p.key),p.c.salary,p.c.fixedTotal,p.c.exBase+p.c.exSave,Math.round(p.c.spent),Math.round(p.c.saveSum),Math.round(p.net),Math.round(p.total)]));
  const j=JSON.stringify(S),chunks=[['tarteeb backup v2 — لا تعدّل هذي الورقة']];for(let i=0;i<j.length;i+=30000)chunks.push([j.slice(i,i+30000)]);
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(ent),'العمليات');
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(mon),'الأشهر');
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(chunks),'tarteeb_backup');
  const data=new Uint8Array(XLSX.write(wb,{type:'array',bookType:'xlsx'})),name='ترتيب-نسخة-'+todayStr()+'.xlsx';
  let dl=null;try{dl=window.claude&&window.claude.use?await window.claude.use('downloads'):null}catch(e){}
  if(dl){try{await dl.save({filename:name,data});toast('تم حفظ النسخة','good')}catch(e){if(e&&e.code!=='declined')toast('ما قدرنا نحفظ الملف هنا','bad')}return}
  try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));a.download=name;document.body.appendChild(a);a.click();a.remove();toast('تم تنزيل النسخة','good')}catch(e){toast('التنزيل غير متاح هنا','bad')}
}
function readBackup(wb){
  try{const rows=XLSX.utils.sheet_to_json(wb.Sheets['tarteeb_backup'],{header:1});const j=rows.slice(1).map(r=>r[0]||'').join('');return migrate(JSON.parse(j))}catch(e){return null}
}

/* ---------- events ---------- */
function monthNav(d){const all=months(),i=all.indexOf(UI.month)+d;if(all[i]){UI.month=all[i];UI.animate=true;UI.enter=true;ensureMonth(UI.month);render()}}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b)return;
  const a=b.dataset.act,id=b.dataset.id;
  switch(a){
    case'nav':setView(b.dataset.v);break;
    case'month-prev':monthNav(-1);break;
    case'month-next':monthNav(1);break;
    case'goto-month':UI.month=b.dataset.k;UI.gaps=null;setView('home');break;
    case'dismiss-gaps':UI.gaps=null;renderChrome();break;
    case'theme':{const d=isDark()?'light':'dark';document.documentElement.setAttribute('data-theme',d);try{localStorage.setItem('tarteeb.theme',d)}catch(_){}render();break}
    case'settings':UI.confirm=null;openSettings();break;
    case'goals':openGoals();break;
    case'ov-close':if(e.target===b||b.tagName==='BUTTON')closeModal();break;
    case'add':openAdd(id);break;
    case'edit-entry':openAdd(null,id);break;
    case'quick':{const f=frequent()[+b.dataset.i];if(!f)return;const m=ensureMonth(nowKey()),en={id:uid(),sec:f.sec,title:f.title,amount:f.amount,date:todayStr()};m.entries.push(en);save();render();
      toast(`أضفت ${f.title} ${mtxt(f.amount)}`,'good',4500,{label:'تراجع',fn:()=>{m.entries=m.entries.filter(x=>x.id!==en.id);save();render()}});break}
    case'qfill':{const f=frequent()[+b.dataset.i];if(!f)return;$('#aAmt').value=f.amount;$('#aTitle').value=f.title;const r=$(`input[name=aSec][value="${f.sec}"]`);if(r)r.checked=true;updHint();break}
    case'open-sec':UI.openSec=id;setView('budget');break;
    case'toggle-ents':UI.openSec=UI.openSec===id?null:id;render();break;
    case'del-entry':{const f=findEntry(id);if(!f)return;const m=S.months[f.k];m.entries=m.entries.filter(x=>x.id!==id);closeModal();save();render();
      toast('تم حذف العملية','',4500,{label:'تراجع',fn:()=>{m.entries.push(f.e);save();render()}});break}
    case'edit-secs':UI.edit=!UI.edit;UI.confirm=null;render();break;
    case'sec-color':secOf(id).color=b.dataset.c;save();render();break;
    case'sec-icon':secOf(id).icon=b.dataset.i;save();render();break;
    case'del-sec':
      if(UI.confirm!==id){UI.confirm=id;render();break}
      S.sections=S.sections.filter(s=>s.id!==id);Object.values(S.months).forEach(m=>{m.entries=m.entries.filter(x=>x.sec!==id);if(m.alloc)delete m.alloc[id];if(m.carry)delete m.carry[id]});
      S.recurring=(S.recurring||[]).filter(r=>r.sec!==id);UI.confirm=null;commit('تم حذف القسم','');break;
    case'del-fixed':{const m=ensureMonth(UI.month);m.fixed=(m.fixed||[]).filter(f=>f.id!==id);commit('تم حذف الالتزام','');break}
    case'loan-toggle':UI.loanOpen=UI.loanOpen===id?null:id;render();break;
    case'loan-off':{const m=ensureMonth(UI.month),f=m.fixed.find(x=>x.id===id);if(f){Object.keys(S.months).filter(k=>k>=UI.month).forEach(k=>(S.months[k].fixed||[]).forEach(x=>{if((x.lid||x.id)===(f.lid||f.id))x.loan=null}))}UI.loanOpen=null;commit();break}
    case'del-extra':{const m=ensureMonth(UI.month);m.extras=(m.extras||[]).filter(x=>x.id!==id);commit();break}
    case'del-rec':{S.recurring=S.recurring.filter(r=>r.id!==id);const m=S.months[nowKey()];if(m)m.entries=m.entries.filter(x=>!(x.rec===id&&x.date>todayStr()));commit('تم إيقاف المصروف المتكرر','');break}
    case'filter':UI.logFilter=id;render();break;
    case'pick-file':$('#fileIn').click();break;
    case'restore':closeModal();$('#fileIn').click();break;
    case'restore-go':
      if(UI.confirm!=='restore'){UI.confirm='restore';render();break}
      S=UI.imp.restore;afterLoad();UI.imp=null;UI.confirm=null;save();setView('home');toast('تم استرجاع النسخة','good');break;
    case'export':exportBackup();break;
    case'imp-cancel':UI.imp=null;WB=null;UI.confirm=null;render();break;
    case'imp-commit':commitImport();break;
    case'review':openReview(b.dataset.k);break;
    case'close-month':{const k=b.dataset.k,ch=b.dataset.c;closeMonth(k,ch);closeModal();commit(ch==='carry'?`رحّلنا الباقي لأقسام ${monthName(shiftKey(k,1))}`:'انضاف الباقي لمدخراتك');break}
    case'goal-up':{const i=S.goals.findIndex(g=>g.id===id);if(i>0){[S.goals[i-1],S.goals[i]]=[S.goals[i],S.goals[i-1]];save();openGoals();render()}break}
    case'goal-del':S.goals=S.goals.filter(g=>g.id!==id);save();openGoals();render();break;
    case'goal-emerg':S.goals.unshift({id:'g'+uid(),name:'صندوق الطوارئ',target:+b.dataset.v,icon:'shield'});save();openGoals();render();break;
    case'start-fresh':S=blank();try{localStorage.removeItem(STORE)}catch(_){}afterLoad();UI.month=nowKey();UI.gaps=null;save();setView('home');break;
    case'load-demo':S=demo();afterLoad();UI.month=nowKey();UI.gaps=null;closeModal();checkBadges(true);setView('home');toast('هذا مثال تجريبي ولا يُحفظ');break;
    case'reset-all':
      if(UI.confirm!=='reset'){UI.confirm='reset';openSettings();break}
      S=blank();afterLoad();UI.month=nowKey();UI.confirm=null;UI.gaps=null;save();closeModal();setView('home');toast('تم مسح البيانات.','');break;
  }
});
document.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&e.target.matches('[data-act=edit-entry]')){e.target.click();return}
  if(e.key==='Escape'){closeModal();return}
  if((e.key==='n'||e.key==='N'||e.key==='ى')&&!e.target.closest('input,select,textarea')&&!$('#modal-root').innerHTML&&!e.metaKey&&!e.ctrlKey){e.preventDefault();openAdd()}
});
document.addEventListener('submit',e=>{
  e.preventDefault();const f=e.target;
  if(f.id==='addForm'){
    const sec=secOf(selSec()),amount=parseFloat($('#aAmt').value),title=$('#aTitle').value.trim(),date=$('#aDate').value;
    if(!sec||!(amount>0)||!title||!date){(!(amount>0)?$('#aAmt'):$('#aTitle')).focus();return}
    const k=cycleKeyOfIso(date),m=ensureMonth(k);if(m.assumed&&sec.kind!=='save')m.assumed=false;
    if(UI.editing){const o=UI.editing;S.months[o.k].entries=S.months[o.k].entries.filter(x=>x.id!==o.e.id);m.entries.push({...o.e,sec:sec.id,amount,title,date});closeModal();commit('تم حفظ التعديل');return}
    m.entries.push({id:uid(),sec:sec.id,title,amount,date});closeModal();
    if(k!==UI.month)UI.month=k;save();checkBadges(false);render();
    const c=calc(k),s=c.secs.find(x=>x.sec.id===sec.id);
    if(sec.kind==='save'){toast(`ممتاز! أضفت ${mtxt(amount)} لمدخراتك`,'good');celebrate(.6)}
    else if(s.remaining<0)toast(`تجاوزت ميزانية ${sec.name} بـ ${mtxt(-s.remaining)}`,'bad',4200);
    else if(s.alloc&&s.spent/s.alloc>=.85)toast(`انتبه، باقي ${mtxt(s.remaining)} فقط في ${sec.name}`,'warn');
    else toast(`تم. باقي لك ${mtxt(s.remaining)} في ${sec.name}`,'good');
  }else if(f.id==='setForm'){
    const np=+$('#sPay').value,changed=np!==payday();
    S.name=$('#sName').value.trim();S.currency=$('#sCur').value;S.opening=Math.max(0,parseFloat($('#sOpen').value)||0);
    if(changed){S.payday=np;moveEntriesToCycles();afterLoad();UI.month=nowKey()}
    closeModal();commit(changed?`صار الشهر يبدأ يوم ${np}`:'تم الحفظ');
  }else if(f.id==='fixForm'){
    const name=$('#fxName').value.trim()||'التزام',amount=Math.max(0,parseFloat($('#fxAmt').value)||0);if(!amount){$('#fxAmt').focus();return}
    const m=ensureMonth(UI.month),nid=uid();(m.fixed=m.fixed||[]).push({id:nid,lid:nid,name,amount,loan:null});save();render();
    toast(`تم خصم ${name}. الباقي ${mtxt(calc(UI.month).base)}`,'good',4200);
    if(/قرض|قسط|تمويل|loan/i.test(name)){UI.loanOpen=nid;render()}
    setTimeout(()=>{const i=$('#fxName');if(i&&matchMedia('(pointer:fine)').matches)i.focus()},50);
  }else if(f.id==='exForm'){
    const title=$('#exName').value.trim()||'دخل إضافي',amount=Math.max(0,parseFloat($('#exAmt').value)||0);if(!amount){$('#exAmt').focus();return}
    const m=ensureMonth(UI.month);(m.extras=m.extras||[]).push({id:uid(),title,amount,dest:$('#exDest').value});commit($('#exDest').value==='save'?`انضاف ${mtxt(amount)} لمدخراتك`:`زاد الباقي للتوزيع ${mtxt(amount)}`);
  }else if(f.id==='recForm'){
    const title=$('#rcName').value.trim(),amount=Math.max(0,parseFloat($('#rcAmt').value)||0);if(!title||!amount){(!title?$('#rcName'):$('#rcAmt')).focus();return}
    const r={id:'r'+uid(),sec:$('#rcSec').value,title,amount,day:+$('#rcDay').value,since:nowKey()};(S.recurring=S.recurring||[]).push(r);applyRecurring(nowKey(),ensureMonth(nowKey()));
    commit(`${title} بينضاف لحاله كل شهر يوم ${r.day}`);
  }else if(f.id==='addSecForm'){
    const name=$('#nsName').value.trim();if(!name)return;const kind=$('#nsKind').value;
    S.sections.push({id:'s'+uid(),name,color:PALETTE[S.sections.length%PALETTE.length],icon:kind==='save'?'coins':'bolt',kind});commit('تمت إضافة القسم. اكتب له مبلغ.');
  }else if(f.id==='goalForm'){
    const name=$('#gName').value.trim(),target=parseFloat($('#gTarget').value)||0;if(!name||!target){(!name?$('#gName'):$('#gTarget')).focus();return}
    S.goals.push({id:'g'+uid(),name,target,icon:'target'});save();openGoals();render();
  }else if(f.id==='actualForm'){
    const total=Math.max(0,parseFloat($('#actualAmt').value)||0),c=calc(UI.month),m=c.m;if(!total)return;
    const sp=c.secs.filter(s=>s.sec.kind!=='save'&&s.alloc>0),sum=sp.reduce((a,s)=>a+s.alloc,0)||1;
    sp.forEach(s=>m.entries.push({id:uid(),sec:s.sec.id,title:'مصروف مُقدّر',amount:Math.round(total*s.alloc/sum),date:isoOf(cycleEnd(UI.month))}));
    m.assumed=false;commit('تم تسجيل صرفك الفعلي');
  }
});
let liveT=null;
document.addEventListener('input',e=>{
  const t=e.target;
  if(t.dataset.amt){const m=ensureMonth(UI.month);if(!m.alloc)m.alloc={};m.alloc[t.dataset.amt]=Math.max(0,parseFloat(t.value)||0);liveSplit()}
  else if(t.id==='aAmt'||t.name==='aSec'||t.id==='aDate')updHint();
  else if(t.id==='simR'){UI.extra=+t.value;$('#simV').textContent='+'+fmt(UI.extra);const G=goalsState(timeline(),UI.extra),et=x=>x.eta?(x.eta.done?'<b class="pos">تحقق!</b>':`توصله في <b>${monthLong(x.eta.key)}</b>`):'ابدأ بالادخار عشان نحسب الموعد';
    if(G[0]){$('#eta0').innerHTML=et(G[0]);$('#simTxt').innerHTML=`بوتيرة <b>${fmt(G[0].monthly)} ${cur()}</b> شهرياً`}G.slice(1).forEach((x,i)=>{const el=$(`[data-eta="${i+1}"]`);if(el)el.innerHTML=et(x)})}
  else if(t.id==='logQ'){UI.logQ=t.value;clearTimeout(liveT);liveT=setTimeout(()=>{const p=t.selectionStart;render();const n=$('#logQ');if(n){n.focus();n.setSelectionRange(p,p)}},200)}
});
document.addEventListener('change',e=>{
  const t=e.target,m=()=>ensureMonth(UI.month),val=()=>Math.max(0,parseFloat(t.value)||0);
  const fx=id=>(m().fixed||[]).find(x=>x.id===id),ex=id=>(m().extras||[]).find(x=>x.id===id),rc=id=>(S.recurring||[]).find(x=>x.id===id);
  if(t.dataset.amt){save();checkBadges(false);render()}
  else if(t.id==='salaryInp'){m().salary=val();save();render();const c=calc(UI.month);if(c.salary)toast(c.fixedTotal?`الباقي بعد الالتزامات ${mtxt(c.base)}`:'أضف التزاماتك الثابتة إن وجدت، ثم وزّع الباقي على أقسامك','good',4000)}
  else if(t.dataset.fxamt){const f=fx(t.dataset.fxamt);if(f)f.amount=val();commit()}
  else if(t.dataset.fxname){const f=fx(t.dataset.fxname);if(f)f.name=t.value.trim()||f.name;commit()}
  else if(t.dataset.loanbal||t.dataset.loantot){
    const f=fx(t.dataset.loanbal||t.dataset.loantot);if(!f)return;
    if(t.dataset.loanbal){const bal=val();f.loan={...(f.loan||{}),balance:bal,since:UI.month,total:(f.loan&&f.loan.total)||bal+f.amount}}else if(f.loan)f.loan.total=val();else return;
    Object.keys(S.months).filter(k=>k>UI.month).forEach(k=>(S.months[k].fixed||[]).forEach(x=>{if((x.lid||x.id)===(f.lid||f.id))x.loan={...f.loan}}));commit();
  }
  else if(t.dataset.exname){const x=ex(t.dataset.exname);if(x)x.title=t.value.trim()||x.title;commit()}
  else if(t.dataset.examt){const x=ex(t.dataset.examt);if(x)x.amount=val();commit()}
  else if(t.dataset.exdest){const x=ex(t.dataset.exdest);if(x)x.dest=t.value;commit()}
  else if(t.dataset.recname||t.dataset.recamt||t.dataset.recsec||t.dataset.recday){
    const r=rc(t.dataset.recname||t.dataset.recamt||t.dataset.recsec||t.dataset.recday);if(!r)return;
    if(t.dataset.recname)r.title=t.value.trim()||r.title;if(t.dataset.recamt)r.amount=val();if(t.dataset.recsec)r.sec=t.value;if(t.dataset.recday)r.day=+t.value;
    const cm=S.months[nowKey()];if(cm)cm.entries.forEach(x=>{if(x.rec===r.id&&x.date>=todayStr()){x.title=r.title;x.amount=r.amount;x.sec=r.sec;x.date=cycleDate(nowKey(),r.day)}});commit();
  }
  else if(t.dataset.secname){const s=secOf(t.dataset.secname);s.name=t.value.trim()||s.name;commit()}
  else if(t.dataset.seckind){secOf(t.dataset.seckind).kind=t.value;commit()}
  else if(t.dataset.gname){const g=S.goals.find(x=>x.id===t.dataset.gname);if(g)g.name=t.value.trim()||g.name;save();render()}
  else if(t.dataset.gtarget){const g=S.goals.find(x=>x.id===t.dataset.gtarget);if(g)g.target=Math.max(1,val());save();render()}
  else if(t.id==='fileIn'){if(t.files[0])readFile(t.files[0]);t.value=''}
  else if(t.dataset.imp){
    const I=UI.imp;
    if(t.dataset.imp==='sheet'){analyzeSheet(+t.value);render()}
    else if(t.dataset.imp==='map'){I.map[t.dataset.role]=+t.value;remap()}
    else if(t.dataset.imp==='wipe')I.wipe=t.checked;
    else{const r=I.rows.find(x=>x.id===t.dataset.id);if(!r)return;
      if(t.dataset.imp==='inc')r.include=t.checked;
      if(t.dataset.imp==='act'){r.act=t.value;r.include=true}
      if(t.dataset.imp==='sec'){r.sec=t.value;r.conf='rule';r.manual=true;r.include=true}
      render()}
  }
});
document.addEventListener('dragover',e=>{const d=$('#drop');if(d){e.preventDefault();d.classList.add('over')}});
document.addEventListener('dragleave',e=>{const d=$('#drop');if(d&&!e.relatedTarget)d.classList.remove('over')});
document.addEventListener('drop',e=>{const d=$('#drop');if(!d)return;e.preventDefault();d.classList.remove('over');const f=e.dataTransfer.files[0];if(f)readFile(f)});
window.addEventListener('hashchange',()=>{const v=location.hash.slice(1);if(NAV.some(n=>n[0]===v)&&v!==UI.view){UI.view=v;UI.enter=true;UI.animate=v==='home';render()}});
let rsT=null;window.addEventListener('resize',()=>{clearTimeout(rsT);rsT=setTimeout(()=>{if(UI.view==='home'&&$('#flow')){$('#flow').innerHTML=flowSVG(calc(UI.month))}},200)});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){const nk=nowKey();if(!S.months[nk]){afterLoad();render()}cloudRefresh()}});

/* ---------- boot ---------- */
try{const th=localStorage.getItem('tarteeb.theme');if(th)document.documentElement.setAttribute('data-theme',th)}catch(e){}
S=loadLocal()||blank();
if(S.demo){S=demo()}
afterLoad();
const h0=location.hash.slice(1);if(NAV.some(n=>n[0]===h0))UI.view=h0;
render();
{const r=pendingReview();if(r&&!S.demo&&UI.view==='home')setTimeout(()=>openReview(r),600)}
cloudInit();
