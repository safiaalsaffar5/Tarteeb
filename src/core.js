/* ---------- pay cycles ----------
   A month key "YYYY-MM" names the cycle that starts on payday of that calendar month.
   With payday 1 a cycle is the calendar month. */
const keyOf=(y,m)=>y+'-'+pad(m);
const parseKey=k=>{const a=k.split('-').map(Number);return{y:a[0],m:a[1]}};
const shiftKey=(k,d)=>{const p=parseKey(k);const t=p.y*12+(p.m-1)+d;return keyOf(Math.floor(t/12),t%12+1)};
const monthName=k=>MONTHS[parseKey(k).m-1];
const monthLong=k=>monthName(k)+' '+parseKey(k).y;
const isoOf=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const todayStr=()=>isoOf(new Date());
const DAY=86400000;
function payday(){return Math.min(28,Math.max(1,(S&&S.payday)||1))}
function cycleStart(k){const p=parseKey(k);return new Date(p.y,p.m-1,payday())}
function cycleEnd(k){const d=cycleStart(shiftKey(k,1));d.setDate(d.getDate()-1);return d}
function cycleKeyOf(y,m,d){return d>=payday()?keyOf(y,m):shiftKey(keyOf(y,m),-1)}
function cycleKeyOfIso(s){const a=s.split('-').map(Number);return cycleKeyOf(a[0],a[1],a[2])}
function nowKey(){const d=new Date();return cycleKeyOf(d.getFullYear(),d.getMonth()+1,d.getDate())}
function daysIn(k){return Math.round((cycleEnd(k)-cycleStart(k))/DAY)+1}
function dayIndex(k){const t=new Date();t.setHours(12);const s=cycleStart(k);s.setHours(0);return Math.max(1,Math.min(daysIn(k),Math.floor((t-s)/DAY)+1))}
function cycleRange(k){const a=cycleStart(k),b=cycleEnd(k);return `${a.getDate()} ${MONTHS[a.getMonth()]} – ${b.getDate()} ${MONTHS[b.getMonth()]}`}
function cycleDate(k,day){ // the date inside cycle k that falls on day-of-month `day`
  const p=parseKey(k),P=payday();let y=p.y,m=p.m;if(day<P){m++;if(m>12){m=1;y++}}
  const last=new Date(y,m,0).getDate();return y+'-'+pad(m)+'-'+pad(Math.min(day,last));
}
function cyclesBetween(a,b){const A=parseKey(a),B=parseKey(b);return (B.y-A.y)*12+(B.m-A.m)}
const fmtDate=iso=>{const a=iso.split('-').map(Number);return a[2]+' '+MONTHS[a[1]-1]};

/* ---------- state ---------- */
const STORE='tarteeb.v1';
let S=null;
const UI={view:'home',month:null,openSec:null,edit:false,confirm:null,logFilter:'all',logQ:'',imp:null,animate:true,extra:0,enter:true,review:null,loanOpen:null};
const lastVals={};

function defaultSections(){return[
 {id:'bills',name:'الفواتير والسكن',color:PALETTE[1],icon:'home',kind:'spend'},
 {id:'living',name:'المعيشة اليومية',color:PALETTE[2],icon:'basket',kind:'spend'},
 {id:'fun',name:'الترفيه والكماليات',color:PALETTE[3],icon:'game',kind:'spend'},
 {id:'save',name:'المدخرات',color:PALETTE[0],icon:'coins',kind:'save'},
 {id:'emerg',name:'صندوق الطوارئ',color:PALETTE[4],icon:'shield',kind:'save'}
];}
function blank(){return{v:2,demo:false,name:'',currency:'sar',opening:0,payday:1,goals:[{id:'g1',name:'هدفي الأول',target:20000,icon:'target'}],sections:defaultSections(),months:{},recurring:[],unlocked:[],rules:{},updated:0}}
const fresh=blank;
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function demo(){
  const st=blank();st.demo=true;st.opening=3000;st.payday=1;
  st.goals=[{id:'g1',name:'صندوق طوارئ',target:15000,icon:'shield'},{id:'g2',name:'سيارة جديدة',target:45000,icon:'car'}];
  const prevS=S;S=st;
  const cur=nowKey(),r=rng(2026),today=todayStr();
  const living=['بقالة الأسبوع','بنزين','مطعم الغداء','صيدلية','مواصلات','سوبرماركت','خضار وفواكه','غسيل سيارة'];
  const fun=['كافيه','سينما','طلب توصيل','تسوق ملابس','هدية','ألعاب','طلعة مع الأصدقاء'];
  const ratios=[[1.0,1.12],[.93,.78],[.88,.7],[.95,.86],[.9,.74],[.86,.8]];
  st.recurring=[{id:'r1',sec:'fun',title:'اشتراك نتفلكس',amount:56,day:9,since:shiftKey(cur,-5)}];
  for(let i=5;i>=0;i--){
    const key=shiftKey(cur,-i),salary=i>=2?12000:12500,base=salary-1800;
    const m={salary,fixed:[{id:uid(),lid:'L1',name:'قسط السيارة',amount:1800,loan:{balance:64800+1800*5,since:shiftKey(cur,-5),total:86400}}],extras:[],alloc:{bills:Math.round(base*.4),living:Math.round(base*.2),fun:Math.round(base*.15),save:Math.round(base*.2),emerg:Math.round(base*.05)},carry:{},entries:[],reviewed:true,closeChoice:'save'};
    if(i===2)m.extras.push({id:uid(),title:'مكافأة أداء',amount:1500,dest:'save'});
    const push=(sec,title,amount,day)=>{const d=cycleDate(key,day);if(d>today)return;m.entries.push({id:uid(),sec,title,amount:Math.round(amount),date:d})};
    const bills=m.alloc.bills;
    push('bills','إيجار الشقة',Math.round(bills*.72/50)*50,1);push('bills','فاتورة الكهرباء',250+Math.round(r()*160),9);
    push('bills','إنترنت المنزل',199,5);push('bills','باقة الجوال',150,6);push('bills','فاتورة المياه',90+Math.round(r()*40),3);
    [['living',living,m.alloc.living*ratios[5-i][0]],['fun',fun,(m.alloc.fun-56)*ratios[5-i][1]]].forEach(([sec,pool,total])=>{
      const n=sec==='living'?7:5,w=Array.from({length:n},()=>.4+r()),ws=w.reduce((a,b)=>a+b,0);
      w.forEach((x,j)=>push(sec,pool[(j+Math.floor(r()*3))%pool.length],total*x/ws,2+Math.floor(r()*26)));
    });
    m.entries.push({id:uid(),sec:'fun',title:'اشتراك نتفلكس',amount:56,date:cycleDate(key,9),rec:'r1'});
    if(i===1)push('save','إيداع إضافي',500,18);
    st.months[key]=m;
  }
  S=prevS;return st;
}
function migrate(o){
  if(!o||!o.sections||!o.months)return null;
  if(o.v===1){
    o.v=2;o.payday=1;o.recurring=o.recurring||[];
    o.goals=o.goal?[{id:'g1',name:o.goal.name,target:o.goal.target,icon:'target'}]:[{id:'g1',name:'هدفي الأول',target:20000,icon:'target'}];delete o.goal;
    Object.values(o.months).forEach(m=>{m.fixed=m.fixed||[];m.fixed.forEach(f=>f.lid=f.lid||f.id);m.extras=m.extras||[];m.carry=m.carry||{};m.reviewed=true});
  }
  o.updated=o.updated||0;return o;
}
function loadLocal(){try{const t=localStorage.getItem(STORE);if(t)return migrate(JSON.parse(t))}catch(e){}return null}
function saveLocal(){try{localStorage.setItem(STORE,JSON.stringify(S))}catch(e){}}
function save(){S.updated=Date.now();saveLocal();cloudQueue()}

/* ---------- months ---------- */
function loanLeft(f,k){if(!f.loan)return null;return Math.max(0,f.loan.balance-f.amount*cyclesBetween(f.loan.since,k))}
function ensureMonth(key){
  if(S.months[key])return S.months[key];
  const keys=Object.keys(S.months).sort();let ref=null;
  for(const k of keys){if(k<key)ref=k}
  if(!ref&&keys.length)ref=keys[0];
  const alloc={};if(ref)calc(ref).secs.forEach(x=>alloc[x.sec.id]=Math.round(x.alloc0));
  const fixed=ref?(S.months[ref].fixed||[]).filter(f=>!f.loan||loanLeft(f,ref)>0||ref>key).map(f=>({id:uid(),lid:f.lid||f.id,name:f.name,amount:f.amount,loan:f.loan?{...f.loan}:null})):[];
  const m={salary:ref?S.months[ref].salary:0,fixed,extras:[],alloc,carry:{},entries:[]};
  S.months[key]=m;applyRecurring(key,m);return m;
}
function applyRecurring(key,m){
  (S.recurring||[]).forEach(r=>{
    if(r.since>key||m.entries.some(e=>e.rec===r.id))return;
    if(!S.sections.some(s=>s.id===r.sec))return;
    m.entries.push({id:uid(),sec:r.sec,title:r.title,amount:r.amount,date:cycleDate(key,r.day),rec:r.id});
  });
}
/* cycles skipped while the app was closed: create them and assume spending followed the plan */
function fillGaps(){
  const keys=Object.keys(S.months).sort(),now=nowKey();if(!keys.length)return[];
  const last=keys.filter(k=>k<now).pop();if(!last)return[];
  const gaps=[];for(let k=shiftKey(last,1);k<now;k=shiftKey(k,1)){if(!S.months[k]){const m=ensureMonth(k);m.assumed=true;gaps.push(k)}}
  return gaps;
}
function moveEntriesToCycles(){ // after payday changes
  const all=[];Object.keys(S.months).forEach(k=>{S.months[k].entries.forEach(e=>all.push(e));S.months[k].entries=[]});
  all.forEach(e=>{const k=cycleKeyOfIso(e.date);ensureMonth(k);S.months[k].entries.push(e)});
}

/* ---------- calculations ---------- */
function calc(key){
  const m=S.months[key];if(!m)return null;
  const fixed=m.fixed||[],fixedTotal=fixed.reduce((a,f)=>a+(+f.amount||0),0),extras=m.extras||[];
  const exBase=extras.filter(x=>x.dest!=='save').reduce((a,x)=>a+(+x.amount||0),0),exSave=extras.filter(x=>x.dest==='save').reduce((a,x)=>a+(+x.amount||0),0);
  const base=Math.max(0,m.salary-fixedTotal+exBase);
  const spendEntries=m.entries.filter(e=>{const s=S.sections.find(x=>x.id===e.sec);return s&&s.kind!=='save'}).length;
  const assumed=!!m.assumed&&!spendEntries;
  const secs=S.sections.map(sec=>{
    const alloc0=m.alloc?(+m.alloc[sec.id]||0):base*(m.pcts&&m.pcts[sec.id]!=null?m.pcts[sec.id]:(sec.pct||0))/100;
    const carry=+((m.carry||{})[sec.id])||0,alloc=alloc0+carry,pct=base?alloc0/base*100:0;
    const entries=m.entries.filter(e=>e.sec===sec.id),sum=entries.reduce((a,e)=>a+e.amount,0);
    if(sec.kind==='save')return{sec,pct,alloc0,carry,alloc,entries,deposit:sum,saved:alloc+sum,spent:0,remaining:0};
    const spent=assumed?alloc:sum;
    return{sec,pct,alloc0,carry,alloc,entries,deposit:0,saved:0,spent,remaining:alloc-spent};
  });
  const spend=secs.filter(s=>s.sec.kind!=='save'),spendAlloc=spend.reduce((a,s)=>a+s.alloc,0),spent=spend.reduce((a,s)=>a+s.spent,0);
  const saveSum=secs.reduce((a,s)=>a+s.saved,0)+exSave,left=spendAlloc-spent,closed=key<nowKey();
  const counted=closed?(m.closeChoice==='carry'?saveSum+Math.min(0,left):saveSum+left):saveSum+Math.min(0,left);
  const projected=closed?0:Math.max(0,left);
  const allocTotal=secs.reduce((a,s)=>a+s.alloc0,0),income=m.salary+exBase+exSave;
  return{key,m,salary:m.salary,fixed,fixedTotal,extras,exBase,exSave,base,secs,spendAlloc,spent,saveSum,left,closed,counted,projected,assumed,
    rate:income?(counted+projected)/income:0,within:spent<=spendAlloc+0.5,allWithin:spend.every(s=>s.remaining>=-0.5),
    pctTotal:secs.reduce((a,s)=>a+s.pct,0),allocTotal,unalloc:base-allocTotal,income};
}
function timeline(){
  const keys=Object.keys(S.months).sort();let run=S.opening||0;
  return keys.map(k=>{const c=calc(k);run+=c.counted;return{key:k,net:c.counted,total:run,c}});
}
function avgNet(T){
  const closed=T.filter(p=>p.c.closed&&p.c.salary>0).slice(-3);
  if(closed.length)return closed.reduce((a,p)=>a+p.net,0)/closed.length;
  const last=T[T.length-1];return last?(last.c.counted+last.c.projected):0;
}
function avgSpendTotal(){const ks=Object.keys(S.months).filter(k=>k<nowKey()).sort().slice(-3);if(!ks.length)return 0;return ks.reduce((a,k)=>{const c=calc(k);return a+c.spent+c.fixedTotal},0)/ks.length}
function avgSpend(secId,key){
  const ks=Object.keys(S.months).filter(k=>k<key).sort().slice(-3);
  const vals=ks.map(k=>{const c=calc(k);if(c.assumed)return null;const s=c.secs.find(x=>x.sec.id===secId);return s?(s.sec.kind==='save'?s.deposit:s.spent):null}).filter(v=>v!=null);
  return vals.length?{v:vals.reduce((a,b)=>a+b,0)/vals.length,n:vals.length}:null;
}
function streak(T){let n=0;for(let i=T.length-1;i>=0;i--){const c=T[i].c;if(c.salary>0&&c.within)n++;else break}return n}
function totalSaved(T){return T.length?T[T.length-1].total:(S.opening||0)}
/* goals fill in priority order (a waterfall) */
function goalsState(T,extra){
  const total=Math.max(0,totalSaved(T)),monthly=avgNet(T)+(extra||0),last=T.length?T[T.length-1].key:nowKey();
  let before=0;
  return S.goals.map(g=>{
    const have=Math.max(0,Math.min(g.target,total-before)),cum=before+g.target;before=cum;
    const need=cum-total;let eta=null;
    if(need<=0)eta={done:true};else if(monthly>0){const n=Math.ceil(need/monthly);eta={n,key:shiftKey(last,n)}}
    return{g,have,p:g.target?have/g.target:0,eta,monthly};
  });
}
function loans(key){const m=S.months[key];if(!m)return[];return(m.fixed||[]).filter(f=>f.loan).map(f=>{const left=loanLeft(f,key),n=Math.ceil(left/(f.amount||1)),tot=f.loan.total||f.loan.balance;return{f,left,n,end:shiftKey(key,n),total:tot,p:tot?Math.min(1,(tot-left)/tot):0}})}
function frequent(){
  const ks=Object.keys(S.months).sort().slice(-3),map={};
  ks.forEach(k=>S.months[k].entries.forEach(e=>{if(e.rec)return;const sec=S.sections.find(s=>s.id===e.sec);if(!sec||sec.kind==='save')return;const rk=ruleKey(e.title)+'|'+e.sec;(map[rk]=map[rk]||{title:e.title,sec:e.sec,n:0,amounts:[]});map[rk].n++;map[rk].amounts.push(e.amount)}));
  return Object.values(map).filter(x=>x.n>=2).sort((a,b)=>b.n-a.n).slice(0,6).map(x=>({...x,amount:Math.round(x.amounts.slice(-3).reduce((a,b)=>a+b,0)/Math.min(3,x.amounts.length))}));
}
function badges(T){
  const total=totalSaved(T),st=streak(T),G=goalsState(T,0);
  const bestRate=Math.max(0,...T.filter(p=>p.c.closed).map(p=>p.c.income?p.c.counted/p.c.income:0));
  const emerg=T.reduce((a,p)=>{const s=p.c.secs.find(x=>x.sec.id==='emerg');return a+(s?s.saved:0)},0);
  const lastSal=T.length?T[T.length-1].c.salary:0,perfect=T.some(p=>p.c.salary>0&&p.c.allWithin&&p.c.closed&&!p.c.assumed);
  const B=(id,icon,title,desc,prog)=>({id,icon,title,desc,progress:Math.max(0,Math.min(1,prog)),unlocked:prog>=1});
  return[
    B('k5','coins','أول 5,000','أول 5,000 في مدخراتك',total/5000),
    B('k10','chart','عشرة آلاف','وصلت 10,000 مدخرات',total/10000),
    B('k25','trophy','نادي الـ 25 ألف','25,000 مدخرات كاملة',total/25000),
    B('st3','flame','3 أشهر منضبطة','3 أشهر متتالية داخل الميزانية',st/3),
    B('st6','flame','نصف سنة انضباط','6 أشهر متتالية داخل الميزانية',st/6),
    B('r25','star','ادخار 25%+','شهر ادخرت فيه ربع دخلك أو أكثر',bestRate/.25),
    B('em','shield','درع الطوارئ','جمعت راتب شهر كامل في الطوارئ',lastSal?emerg/lastSal:0),
    B('perfect','check','شهر مثالي','شهر كامل بدون تجاوز أي قسم',perfect?1:0),
    B('goal1','target','أول هدف','حققت هدفك الأول',G[0]?G[0].p:0)
  ];
}
function checkBadges(silent){
  const T=timeline(),bs=badges(T),have=new Set(S.unlocked||[]),nw=bs.filter(b=>b.unlocked&&!have.has(b.id));
  if(!nw.length)return;
  S.unlocked=[...have,...nw.map(b=>b.id)];saveLocal();cloudQueue();
  if(silent||S.demo)return;
  nw.forEach((b,i)=>setTimeout(()=>toast('إنجاز جديد: '+b.title,'gold',4200),500+i*700));
  setTimeout(()=>celebrate(1.2),400);
}
/* the latest closed cycle that still needs its end-of-month review */
function pendingReview(){
  const now=nowKey();const ks=Object.keys(S.months).filter(k=>k<now).sort();
  for(let i=ks.length-1;i>=0;i--){const m=S.months[ks[i]];if(m.reviewed)return null;if(m.salary>0&&!m.assumed&&m.entries.length)return ks[i]}
  return null;
}
function closeMonth(key,choice){
  const m=S.months[key],c=calc(key);m.reviewed=true;m.closeChoice=choice;
  if(choice==='carry'){const nk=shiftKey(key,1),n=ensureMonth(nk);n.carry={};c.secs.forEach(s=>{if(s.sec.kind!=='save'&&s.remaining>0)n.carry[s.sec.id]=Math.round(s.remaining)})}
}

/* ---------- cloud sync (signed-in viewers keep a private copy on their account) ---------- */
const IN_CLAUDE=!!(window.claude&&window.claude.use);
const CLOUD={db:null,uid:null,on:false,status:'local',sent:{},busy:false,again:false,timer:null};
function cloudSetStatus(s){CLOUD.status=s;const el=document.getElementById('sync');if(el)el.outerHTML=syncPill()}
function splitState(){
  const profile={...S};delete profile.months;const out={profile};
  Object.keys(S.months).forEach(k=>out['m-'+k]=S.months[k]);return out;
}
function cloudQueue(){if(!CLOUD.on||S.demo)return;clearTimeout(CLOUD.timer);cloudSetStatus('saving');CLOUD.timer=setTimeout(cloudFlush,900)}
async function cloudFlush(){
  if(CLOUD.busy){CLOUD.again=true;return}
  CLOUD.busy=true;
  try{
    const docs=splitState(),col='data/users/'+CLOUD.uid;
    for(const id of Object.keys(docs)){const j=JSON.stringify(docs[id]);if(CLOUD.sent[id]===j)continue;await CLOUD.db.doc(col+'/'+id).set(JSON.parse(j));CLOUD.sent[id]=j}
    for(const id of Object.keys(CLOUD.sent)){if(!docs[id]){await CLOUD.db.doc(col+'/'+id).delete();delete CLOUD.sent[id]}}
    cloudSetStatus('synced');
  }catch(e){
    if(e&&e.code==='invalid_argument'){CLOUD.on=false;cloudSetStatus('readonly')}
    else if(e&&e.code==='quota_exceeded'){cloudSetStatus('error');toast('مساحة الحفظ السحابي ممتلئة. بياناتك محفوظة على هذا الجهاز.','bad',5000)}
    else cloudSetStatus('error');
  }
  CLOUD.busy=false;if(CLOUD.again){CLOUD.again=false;cloudFlush()}
}
async function cloudFetch(){
  const snap=await CLOUD.db.collection('data/users/'+CLOUD.uid).get(),docs={};
  snap.docs.forEach(d=>{if(d.exists)docs[d.id]=d.data()});return docs;
}
function fromDocs(docs){
  const st=JSON.parse(JSON.stringify(docs.profile));st.months={};
  Object.keys(docs).forEach(id=>{if(id.startsWith('m-'))st.months[id.slice(2)]=JSON.parse(JSON.stringify(docs[id]))});
  return migrate(st);
}
function hasRealData(){return !S.demo&&Object.values(S.months).some(m=>m.salary>0||m.entries.length)}
async function cloudInit(){
  if(!window.claude||!window.claude.use)return;
  let db,user;try{[db,user]=await Promise.all([window.claude.use('db'),window.claude.use('user')])}catch(e){return}
  if(!db||!user)return;
  const id=await user.id();if(!id)return;
  CLOUD.db=db;CLOUD.uid=id;cloudSetStatus('loading');
  const t=setTimeout(()=>{if(CLOUD.status==='loading')cloudSetStatus('offline')},10000);
  try{
    const docs=await cloudFetch();clearTimeout(t);
    Object.keys(docs).forEach(k=>CLOUD.sent[k]=JSON.stringify(docs[k]));
    CLOUD.on=true;
    if(docs.profile&&(docs.profile.updated||0)>=(S.updated||0)){S=fromDocs(docs);afterLoad();saveLocal();cloudSetStatus('synced');render();toast('تم تحميل بياناتك من حسابك','good')}
    else if(hasRealData()){cloudQueue()}
    else cloudSetStatus('synced');
  }catch(e){clearTimeout(t);cloudSetStatus(e&&e.code==='invalid_argument'?'readonly':'error')}
}
async function cloudRefresh(){
  if(!CLOUD.on||CLOUD.busy||CLOUD.status==='saving')return;
  try{const docs=await cloudFetch();if(docs.profile&&(docs.profile.updated||0)>(S.updated||0)){Object.keys(docs).forEach(k=>CLOUD.sent[k]=JSON.stringify(docs[k]));S=fromDocs(docs);afterLoad();saveLocal();render();toast('تم تحديث بياناتك من جهاز آخر')}}catch(e){}
}
function syncPill(){
  const st=CLOUD.status,map={
    local:['device','محفوظ على هذا الجهاز',IN_CLAUDE?'بياناتك محفوظة في هذا المتصفح فقط. سجّل دخولك بحساب Claude عشان تتزامن بين أجهزتك.':'بياناتك محفوظة في هذا المتصفح فقط، وما تنرفع لأي مكان. خذ نسخة احتياطية من الإعدادات بين فترة وفترة.'],
    loading:['cloud','جارِ التحميل…','جارِ تحميل بياناتك من حسابك'],
    saving:['cloud','جارِ الحفظ…','جارِ حفظ آخر التعديلات في حسابك'],
    synced:['cloud','محفوظ في حسابك','بياناتك محفوظة في حسابك وتتزامن بين أجهزتك. ما أحد غيرك يشوفها.'],
    offline:['cloudoff','بدون اتصال','ما قدرنا نوصل للحفظ السحابي. بياناتك محفوظة على هذا الجهاز.'],
    error:['cloudoff','تعذّر الحفظ السحابي','بياناتك محفوظة على هذا الجهاز، وبنحاول مرة ثانية مع التعديل الجاي.'],
    readonly:['device','محفوظ على هذا الجهاز','صلاحيتك على الرابط لا تسمح بالحفظ السحابي، فبياناتك محفوظة في هذا المتصفح.']
  }[st]||['device','',''];
  if(S&&S.demo)return `<span id="sync" class="sync demo" title="البيانات التجريبية لا تُحفظ">${ic('spark')}<span>عرض تجريبي</span></span>`;
  return `<span id="sync" class="sync ${st}" title="${map[2]}" tabindex="0">${ic(map[0])}<span>${map[1]}</span></span>`;
}
function afterLoad(){
  ensureMonth(nowKey());
  const gaps=fillGaps();if(gaps.length)UI.gaps=gaps;
  if(!UI.month||!S.months[UI.month])UI.month=nowKey();
}
