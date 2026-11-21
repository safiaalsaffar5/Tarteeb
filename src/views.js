/* ---------- money ---------- */
const cur=()=>CURR[S.currency]||'ر.س';
const money=(n,o={})=>{const neg=n<0&&Math.round(n)!==0;return `<span class="mny"><span class="num">${neg?'−':(o.plus&&n>0.5?'+':'')}${fmt(Math.abs(n))}</span><span class="cur">${cur()}</span></span>`};
const fmtP=p=>{const r=Math.round(p*10)/10;return (Number.isInteger(r)?r:r.toFixed(1))+'%'};
const mtxt=n=>(n<0&&Math.round(n)!==0?'−':'')+fmt(Math.abs(n))+' '+cur();
const plural=(n,one,few,many)=>n===1?one:(n>=3&&n<=10?few:many);
const isDark=()=>{const t=document.documentElement.getAttribute('data-theme');if(t)return t==='dark';return matchMedia('(prefers-color-scheme: dark)').matches};
const months=()=>[...new Set([...Object.keys(S.months),nowKey()])].sort();
const secOf=id=>S.sections.find(s=>s.id===id);

/* ---------- chrome ---------- */
const NAV=[['home','نظرة عامة','chart'],['budget','الميزانية','wallet'],['log','العمليات','list'],['reports','التقارير','bars'],['import','استيراد','upload']];
function renderChrome(){
  const btns=NAV.map(n=>`<button data-act="nav" data-v="${n[0]}" ${UI.view===n[0]?'aria-current="page"':''}>${ic(n[2])}<span>${n[1]}</span></button>`).join('');
  $('#nav').innerHTML=btns;$('#tabbar').innerHTML=btns;
  const all=months(),i=all.indexOf(UI.month);
  $('#mLabel').textContent=monthLong(UI.month);$('#mLabel').title=cycleRange(UI.month);
  $('#mPrev').innerHTML=ic('right');$('#mPrev').disabled=i<=0;
  $('#mNext').innerHTML=ic('left');$('#mNext').disabled=i<0||i>=all.length-1;
  $('#themeBtn').innerHTML=ic(isDark()?'sun':'moon');$('#setBtn').innerHTML=ic('gear');
  $('.fab').innerHTML=ic('plus');
  const sp=$('#sync');if(sp)sp.outerHTML=syncPill();else $('#syncSlot').innerHTML=syncPill();
  $('#banner').innerHTML=S.demo?`<div class="banner"><span class="tag">عرض تجريبي</span><span class="grow">الأرقام المعروضة أمثلة توضيحية ولا تُحفظ.</span><button class="btn sm" data-act="start-fresh">ابدأ ببياناتي</button></div>`:
    (UI.gaps&&UI.gaps.length?`<div class="banner"><span class="tag warn">فاتك تسجيل</span><span class="grow">ما فتحت التطبيق في ${UI.gaps.map(monthName).join('، ')}. افترضنا إنك صرفت حسب خطتك، وتقدر تعدّلها.</span><button class="btn sm" data-act="goto-month" data-k="${UI.gaps[0]}">سجّل مصاريفها</button><button class="ibtn" data-act="dismiss-gaps" aria-label="إخفاء">${ic('x')}</button></div>`:'');
}

/* ---------- status ---------- */
function usage(s){return s.alloc?s.spent/s.alloc:0}
function statusOf(s){
  if(s.sec.kind==='save')return{cls:'good',txt:'مجنّب'};
  if(!s.alloc)return{cls:'',txt:'—'};
  const r=usage(s);return r>1?{cls:'bad',txt:'تجاوز'}:r>=.85?{cls:'warn',txt:'قارب الحد'}:{cls:'good',txt:'ضمن الخطة'};
}
function barCls(s){if(s.sec.kind==='save'||!s.alloc)return'';const r=usage(s);return r>1?'bad':r>=.85?'warn':''}
function statusLine(c){
  if(!c.salary)return{cls:'neutral',text:'أدخل راتبك من صفحة الميزانية لبدء التوزيع.'};
  if(c.base>0&&c.allocTotal<1)return{cls:'neutral',text:`باقي من راتبك ${mtxt(c.base)}. وزّعه على أقسامك من صفحة الميزانية.`};
  if(c.assumed)return{cls:'warn',text:'ما سجلت مصاريف لهذا الشهر، فافترضنا إنك صرفت حسب خطتك.'};
  if(c.closed){const r=Math.round(c.rate*100);return c.left<0?{cls:'bad',text:`تجاوزت ميزانية الصرف في ${monthName(c.key)} بمقدار ${mtxt(-c.left)}.`}:{cls:r>=20?'good':'warn',text:`أُغلق شهر ${monthName(c.key)} بمعدل ادخار ${r}%.`}}
  const tf=dayIndex(c.key)/daysIn(c.key),sf=c.spendAlloc?c.spent/c.spendAlloc:0,P=x=>Math.round(x*100);
  if(c.left<0)return{cls:'bad',text:`تجاوزت ميزانية الصرف بمقدار ${mtxt(-c.left)}، والفرق يُخصم من مدخراتك.`};
  if(c.spent===0)return{cls:'neutral',text:'لا توجد مصروفات مسجّلة هذا الشهر بعد.'};
  if(sf<=tf)return{cls:'good',text:`صرفك ضمن الخطة: ${P(sf)}% من الميزانية مع مرور ${P(tf)}% من الشهر.`};
  if(sf<=tf+.1)return{cls:'warn',text:`صرفك قريب من الحد: ${P(sf)}% من الميزانية مع مرور ${P(tf)}% من الشهر.`};
  return{cls:'bad',text:`صرفك أسرع من المخطط: ${P(sf)}% من الميزانية مع مرور ${P(tf)}% فقط من الشهر.`};
}
function greet(){const h=new Date().getHours(),g=h<12?'صباح الخير':'مساء الخير';return S.name?`${g}، ${esc(S.name)}`:g}

/* ---------- welcome ---------- */
function welcome(){
  return `<section class="welcome">
    <div class="w-art" aria-hidden="true">${flowDemoArt()}</div>
    <div class="w-top"><span class="eyebrow">مرحباً بك في ترتيب</span><h1>اعرف وين يروح راتبك، وشوف مدخراتك تكبر كل شهر</h1>
      <p class="muted">${IN_CLAUDE?'بياناتك خاصة فيك. إذا كنت مسجّل دخول تنحفظ في حسابك وتوصلها من أي جهاز، وإلا تنحفظ في هذا المتصفح. ما أحد غيرك يشوفها.':'بياناتك خاصة فيك وتنحفظ في متصفحك بس، ما تنرفع لأي مكان وما أحد غيرك يشوفها.'}</p></div>
    <ol class="w-steps">
      <li><span class="step">1</span><div><b>اكتب راتبك والتزاماتك</b><small>مثل القرض أو القسط، وتعرف كم يبقى لك.</small></div></li>
      <li><span class="step">2</span><div><b>وزّع الباقي بنفسك</b><small>حط المبلغ اللي تبيه لكل قسم: مصاريف، ترفيه، مدخرات.</small></div></li>
      <li><span class="step">3</span><div><b>سجّل مصاريفك</b><small>يدوياً أو من ملف Excel، وتشوف مدخراتك تكبر كل شهر.</small></div></li>
    </ol>
    <div class="w-acts"><button class="btn" data-act="nav" data-v="budget">${ic('wallet')}ابدأ بإدخال راتبك</button><button class="btn ghost" data-act="nav" data-v="import">${ic('upload')}استيراد ملف Excel</button><button class="btn ghost" data-act="load-demo">شوف مثال تجريبي</button></div>
  </section>`;
}
function flowDemoArt(){
  const cols=[PALETTE[1],PALETTE[2],PALETTE[3],PALETTE[0],PALETTE[4]],h=[44,26,18,26,10];let y=8,out='';
  h.forEach((v,i)=>{const ys=8+h.slice(0,i).reduce((a,b)=>a+b,0)*1,yt=y;out+=`<path d="M300 ${ys} C220 ${ys},160 ${yt},90 ${yt} L90 ${yt+v} C160 ${yt+v},220 ${ys+v},300 ${ys+v}Z" fill="${cols[i]}" opacity=".28" style="animation-delay:${i*90}ms"/><rect x="78" y="${yt}" width="12" height="${v}" rx="3" fill="${cols[i]}"/>`;y+=v+10});
  return `<svg viewBox="0 0 320 180"><rect x="300" y="8" width="12" height="124" rx="3" fill="var(--brand)"/>${out}</svg>`;
}

/* ---------- home ---------- */
function secRow(s){
  const isSave=s.sec.kind==='save',w=isSave?100:Math.min(100,usage(s)*100);
  return `<button class="srow" style="--c:${s.sec.color}" data-act="open-sec" data-id="${s.sec.id}">
   <span class="sname"><span class="dotic">${ic(s.sec.icon)}</span><span style="min-width:0"><b>${esc(s.sec.name)}</b><small>${s.carry?`<span class="pos">+${fmt(s.carry)} مرحّل</span> · `:''}<span dir="ltr">${fmtP(s.pct)}</span> من الباقي</small></span></span>
   <span class="barcell"><span class="bar ${barCls(s)}"><i data-w="${w}"></i></span><small>${isSave?'محوّل للادخار':(s.alloc?Math.round(usage(s)*100)+'% مستخدم':'بدون ميزانية')}</small></span>
   <span class="tnum c-sp">${isSave?money(s.deposit)+'<small>إيداع إضافي</small>':money(s.spent)+`<small>من ${fmt(s.alloc)}</small>`}</span>
   <span class="tnum c-rem ${!isSave&&s.remaining<0?'neg':''}">${isSave?money(s.saved)+'<small>مجنّب</small>':money(Math.abs(s.remaining))+`<small>${s.remaining<0?'تجاوز':'متبقٍ'}</small>`}</span>
  </button>`;
}
function quickRow(){
  if(UI.month!==nowKey())return'';const F=frequent();if(!F.length)return'';
  return `<div class="quick"><span class="label">${ic('bolt')}إضافة سريعة</span>${F.map((f,i)=>{const s=secOf(f.sec);return `<button class="qchip" style="--c:${s?s.color:'var(--brand)'}" data-act="quick" data-i="${i}" title="${esc(s?s.name:'')}"><i></i>${esc(f.title)} <b class="num">${fmt(f.amount)}</b></button>`}).join('')}</div>`;
}
function assumedCard(c){
  if(!c.assumed)return'';
  return `<section class="card notice" style="margin-bottom:16px"><div class="notice-i">${ic('calendar')}</div><div style="flex:1;min-width:220px"><b>ما سجلت مصاريف ${monthLong(c.key)}</b><p class="small">افترضنا إنك صرفت كامل ميزانية الأقسام، عشان ما تنحسب مدخرات ما صارت. اكتب كم صرفت فعلياً أو استورد كشف الحساب.</p></div>
   <form class="inline-form" id="actualForm"><input class="inp num" id="actualAmt" type="number" inputmode="decimal" min="0" placeholder="إجمالي صرفك" aria-label="إجمالي صرفك الفعلي"><button class="btn sm" type="submit">احفظ</button></form><button class="btn ghost sm" data-act="nav" data-v="import">${ic('upload')}استيراد</button></section>`;
}
function viewHome(){
  const key=UI.month,c=calc(key);
  if(!c)return `<div class="card empty" style="margin-top:28px"><h3>لا توجد بيانات لهذا الشهر</h3></div>`;
  if(!S.demo&&!c.salary&&!c.secs.some(x=>x.entries.length)&&Object.keys(S.months).length<=1)return welcome();
  const T=timeline(),idx=T.findIndex(p=>p.key===key),pt=T[idx]||{total:S.opening||0,net:c.counted},isLatest=idx===T.length-1;
  const st=statusLine(c),series=T.slice(-12),proj=isLatest?avgNet(T):null;
  const tf=c.closed?1:dayIndex(key)/daysIn(key),sf=c.spendAlloc?c.spent/c.spendAlloc:0;
  const G=goalsState(T,UI.extra),stk=streak(T),bs=badges(T),un=bs.filter(b=>b.unlocked).length,L=loans(key);
  const inc=c.income||1,W=x=>Math.max(0,x/inc*100);
  return `
  <div class="page-h"><div><span class="eyebrow">${monthLong(key)}${payday()!==1?' · '+cycleRange(key):''}</span><h1>${greet()}</h1><p class="status ${st.cls}"><i></i>${st.text}</p></div>
    <button class="btn hide-m" data-act="add">${ic('plus')}عملية جديدة<kbd>N</kbd></button></div>
  ${quickRow()}${assumedCard(c)}
  <div class="grid-a">
    <section class="card hero" aria-label="المدخرات">
      <div class="hero-head">
        <div><span class="label">إجمالي مدخراتك حتى نهاية ${monthName(key)}</span>
          <div class="big"><span class="num" data-count="${Math.round(pt.total)}" data-ck="hero">${fmt(pt.total)}</span><span class="cur">${cur()}</span></div>
          <div class="deltas"><span class="delta ${pt.net<0?'down':''}">${ic(pt.net<0?'arrowdown':'arrowup')}<span class="num">${fmt(Math.abs(pt.net))}</span></span><span>هذا الشهر</span>${c.projected>0?`<span class="muted">· و<span class="num">+${fmt(c.projected)}</span> متوقعة لو التزمت بالخطة</span>`:''}</div></div>
        <div class="legend small"><span><i class="lg-line"></i>المدخرات</span>${proj?`<span><i class="lg-dash"></i>متوقع</span>`:''}</div>
      </div>
      <div class="chartwrap" id="chart">${chartSVG(series,series.findIndex(p=>p.key===key),proj!=null&&proj>0&&series.length?series[series.length-1].total+proj:null)}<div class="ch-tip" id="tip"></div></div>
    </section>
    <section class="card" aria-label="ملخص الشهر">
      <div class="card-h"><h2>ملخص ${monthName(key)}</h2>${c.salary?`<span class="pill ${c.rate>=.2?'good':c.rate>0?'warn':'bad'}">ادخار <span dir="ltr">${Math.round(c.rate*100)}%</span></span>`:''}</div>
      <div class="stackbar">${c.income?`<i style="width:${Math.min(100,W(c.fixedTotal))}%;background:var(--ink-3)"></i><i style="width:${Math.min(100,W(c.spent))}%;background:${c.left<0?'var(--bad)':'var(--ink-2)'}"></i><i style="width:${W(Math.max(0,c.left))}%;background:var(--brand-mid)"></i><i style="width:${W(c.saveSum)}%;background:var(--brand)"></i>`:''}</div>
      <dl class="rows">
        <div><dt>الراتب${c.exBase+c.exSave?' والدخل الإضافي':''}</dt><dd>${money(c.income)}</dd></div>
        ${c.fixedTotal?`<div><dt style="--c:var(--ink-3)"><i></i>التزامات ثابتة</dt><dd>${money(-c.fixedTotal)}</dd></div>`:''}
        <div><dt style="--c:${c.left<0?'var(--bad)':'var(--ink-2)'}"><i></i>المصروف${c.assumed?' (مُفترض)':''}</dt><dd>${money(c.spent)}</dd></div>
        <div><dt style="--c:var(--brand-mid)"><i></i>${c.left<0?'تجاوز الميزانية':'متبقٍ للصرف'}</dt><dd class="${c.left<0?'neg':''}">${money(Math.abs(c.left))}</dd></div>
        <div><dt style="--c:var(--brand)"><i></i>مجنّب للادخار</dt><dd class="total">${money(c.saveSum)}</dd></div>
      </dl>
      <div class="pacebox"><div class="row-sb"><span class="label">وتيرة الصرف</span><span class="small"><span dir="ltr">${Math.round(sf*100)}%</span> من ميزانية الصرف</span></div>
        <div class="pace"><i class="${sf>tf+.1||sf>1?'bad':''}" style="width:${Math.min(100,sf*100)}%"></i>${c.closed?'':`<u style="inset-inline-start:${Math.min(100,tf*100)}%"><em>اليوم ${dayIndex(key)}</em></u>`}</div>
        <span class="small">${c.closed?'الشهر مكتمل':`باقي ${daysIn(key)-dayIndex(key)} ${plural(daysIn(key)-dayIndex(key),'يوم','أيام','يوم')} على الراتب الجاي`}</span></div>
      ${c.closed&&!S.demo?`<button class="btn ghost sm" style="margin-top:14px" data-act="review" data-k="${key}">${ic('chart')}ملخص إقفال الشهر</button>`:''}
    </section>
  </div>
  ${c.income?`<section class="card" style="margin-bottom:16px" aria-label="وين يروح راتبك">
    <div class="card-h"><div><h2>وين يروح راتبك</h2><p class="small">مرّر على أي قسم عشان تشوف تفاصيله. الجزء الغامق داخل كل قسم هو اللي صرفته.</p></div><button class="btn ghost sm" data-act="nav" data-v="budget">تعديل التوزيع</button></div>
    <div class="flowwrap" id="flow">${flowSVG(c)}</div></section>`:''}
  <div class="grid-a">
    <section class="card" aria-label="الأقسام">
      <div class="card-h"><h2>الأقسام</h2><span class="small">اضغط على أي قسم للتفاصيل</span></div>
      <div class="sthead"><span>القسم</span><span>الاستهلاك</span><span>المصروف</span><span>المتبقي</span></div>
      ${c.secs.map(secRow).join('')}
    </section>
    <div class="stack">
      <section class="card" aria-label="الأهداف">${goalsCard(G)}</section>
      ${L.length?`<section class="card" aria-label="القروض"><div class="card-h"><h2>القروض</h2></div>${L.map(loanRow).join('')}</section>`:''}
    </div>
  </div>
  <section class="card" aria-label="الإنجازات">
    <div class="card-h"><h2>الإنجازات</h2><div class="row-c"><span class="streak-chip">${ic('flame')}<b class="num">${stk}</b> ${plural(stk,'شهر','أشهر','شهر')} منضبطة</span><span class="small"><span dir="ltr">${un}/${bs.length}</span> مكتملة</span></div></div>
    <div class="ach">${bs.map(b=>`<div class="bd ${b.unlocked?'':'lock'}"><span class="em">${ic(b.icon)}</span><div style="min-width:0;flex:1"><b>${b.title}</b><small>${b.desc}</small>${b.unlocked?'':`<div class="mini"><i style="width:${Math.round(b.progress*100)}%"></i></div>`}</div></div>`).join('')}</div>
  </section>`;
}
function goalsCard(G){
  if(!G.length)return `<div class="card-h"><h2>الأهداف</h2><button class="btn ghost sm" data-act="goals">إضافة هدف</button></div>`;
  const g0=G[0],etaTxt=x=>x.eta?(x.eta.done?'<b class="pos">تحقق!</b>':`توصله في <b>${monthLong(x.eta.key)}</b>`):'ابدأ بالادخار عشان نحسب الموعد';
  return `<div class="card-h"><h2>الأهداف</h2><button class="btn ghost sm" data-act="goals">${ic('edit')}إدارة</button></div>
   <div class="goal-top">${jarSVG(g0.p)}<div style="min-width:0"><span class="eyebrow">الأولوية الأولى</span><b class="gname">${esc(g0.g.name)}</b><div class="small">${money(g0.have)} من ${money(g0.g.target)}</div><div class="small" id="eta0">${etaTxt(g0)}</div></div></div>
   ${G.slice(1).map((x,i)=>`<div class="goal-row"><div class="row-sb"><span><span class="gi">${i+2}</span>${esc(x.g.name)}</span><span class="small" dir="ltr">${Math.round(x.p*100)}%</span></div><span class="bar" style="--c:var(--gold)"><i data-w="${x.p*100}" style="background:var(--gold)"></i></span><div class="small">${money(x.have)} من ${money(x.g.target)} · <span data-eta="${i+1}">${etaTxt(x)}</span></div></div>`).join('')}
   <div class="sim"><label for="simR"><span>لو زدت ادخارك الشهري</span><span class="num" id="simV">+${fmt(UI.extra)}</span></label><input id="simR" type="range" min="0" max="3000" step="100" value="${UI.extra}"><p class="small" id="simTxt">بوتيرة <b>${fmt(g0.monthly)} ${cur()}</b> شهرياً</p></div>`;
}
function jarSVG(p){
  const lvl=8+104*(1-Math.min(1,p));
  return `<div class="jar" aria-label="نسبة التقدم ${Math.round(p*100)}%"><svg viewBox="0 0 120 120"><defs><clipPath id="jc"><circle cx="60" cy="60" r="52"/></clipPath></defs>
   <circle cx="60" cy="60" r="56" fill="none" stroke="var(--line)" stroke-width="2"/><circle cx="60" cy="60" r="52" fill="var(--surface-2)"/>
   <g clip-path="url(#jc)"><g class="jl" style="--lvl:${lvl}px"><path class="w1" d="M-120 0 Q-90 -7 -60 0 T0 0 T60 0 T120 0 T180 0 T240 0 V140 H-120Z" fill="var(--brand)" opacity=".35"/><path class="w2" d="M-120 4 Q-90 -3 -60 4 T0 4 T60 4 T120 4 T180 4 T240 4 V140 H-120Z" fill="var(--brand)"/></g></g></svg>
   <span class="jt" dir="ltr">${Math.round(p*100)}%</span></div>`;
}
function loanRow(L){
  return `<div class="loan"><div class="row-sb"><span class="row-c"><span class="dotic" style="--c:var(--ink-2)">${ic('bank')}</span><b>${esc(L.f.name)}</b></span><span class="small">${L.n} ${plural(L.n,'قسط','أقساط','قسط')} باقية</span></div>
   <span class="bar" style="margin:10px 0 6px"><i data-w="${L.p*100}" style="background:var(--ink-2)"></i></span>
   <div class="row-sb small"><span>المتبقي ${money(L.left)}</span><span>${L.left>0?`تخلص في <b>${monthLong(L.end)}</b>`:'<b class="pos">خلص القرض</b>'}</span></div></div>`;
}

/* ---------- flow (salary → commitments and sections) ---------- */
let flowData=null;
function flowSVG(c){
  const items=[];
  c.fixed.forEach(f=>items.push({name:f.name,v:+f.amount||0,color:'var(--ink-3)',kind:'fixed'}));
  c.secs.forEach(s=>{if(s.alloc0>0)items.push({name:s.sec.name,v:s.alloc0,color:s.sec.color,kind:s.sec.kind,used:s.sec.kind==='save'?1:Math.min(1,s.alloc?s.spent/s.alloc:0),id:s.sec.id})});
  if(c.exSave)items.push({name:'دخل إضافي للمدخرات',v:c.exSave,color:'var(--brand)',kind:'save',used:1});
  if(c.unalloc>1)items.push({name:'غير موزّع',v:c.unalloc,color:'var(--line)',kind:'un'});
  if(!items.length)return'';
  const wrapW=Math.max(320,Math.min(1100,(($('#view')||{}).clientWidth||900)-42)),W=wrapW,narrow=W<560;
  const total=Math.max(c.income,items.reduce((a,x)=>a+x.v,0)),BAR=narrow?200:250,k=BAR/total;
  let y=0;const lay=items.map(it=>{const h=Math.max(4,it.v*k),slot=Math.max(h+10,narrow?40:44),o={...it,h,y:y+(slot-h)/2};y+=slot;return o});
  const H=Math.max(y,BAR+30),sx=W-18,tx=narrow?Math.round(W*.46):Math.max(190,Math.round(W*.22)),sy0=(H-c.income*k)/2;
  let sy=sy0,svg='';
  lay.forEach((it,i)=>{
    const sh=it.v*k,ys0=sy,s1=sy+sh,xm=(sx+tx+14)/2;sy+=sh;
    const yt0=it.y,yt1=it.y+it.h;
    svg+=`<g class="fl" data-i="${i}" style="--d:${i*70}ms"><path class="rb" d="M${sx} ${ys0} C${xm} ${ys0},${xm} ${yt0},${tx+14} ${yt0} L${tx+14} ${yt1} C${xm} ${yt1},${xm} ${s1},${sx} ${s1}Z" fill="${it.color}"/>
      <rect x="${tx}" y="${yt0}" width="14" height="${it.h}" rx="3" fill="${it.color}" opacity="${it.kind==='un'?1:.4}"/>
      ${it.used!=null&&it.kind!=='un'?`<rect x="${tx}" y="${yt1-it.h*it.used}" width="14" height="${it.h*it.used}" rx="3" fill="${it.color}"/>`:''}
      <text class="fl-n" x="${tx-10}" y="${(yt0+yt1)/2-2}" text-anchor="end">${esc(it.name)}</text>
      <text class="fl-v" x="${tx-10}" y="${(yt0+yt1)/2+14}" text-anchor="end">${fmt(it.v)} · ${Math.round(it.v/c.income*100)}%</text></g>`;
  });
  flowData={lay,c};
  return `<svg viewBox="0 0 ${W} ${H+28}" width="${W}" height="${H+28}" role="img" aria-label="توزيع الراتب"><g transform="translate(0,22)">
    <rect x="${sx}" y="${sy0}" width="18" height="${c.income*k}" rx="4" fill="var(--brand)"/>
    <text class="fl-n" x="${sx+18}" y="${sy0-10}" text-anchor="end">الدخل ${fmt(c.income)}</text>${svg}</g></svg>`;
}

/* ---------- savings chart ---------- */
function niceMax(m){const p=Math.pow(10,Math.floor(Math.log10(m))),r=m/p;for(const s of [1,1.5,2,2.5,3,4,5,6,8,10])if(s>=r*1.04)return s*p;return 10*p}
const kfmt=n=>n>=1000?(n/1000).toFixed(n%1000?1:0).replace(/\.0$/,'')+'k':String(Math.round(n));
function smooth(pts){
  if(pts.length<2)return'';let d=`M${pts[0][0]},${pts[0][1]}`;
  for(let i=0;i<pts.length-1;i++){const p0=pts[i-1]||pts[i],p1=pts[i],p2=pts[i+1],p3=pts[i+2]||p2,t=.18;d+=` C${p1[0]+(p2[0]-p0[0])*t},${p1[1]+(p2[1]-p0[1])*t} ${p2[0]-(p3[0]-p1[0])*t},${p2[1]-(p3[1]-p1[1])*t} ${p2[0]},${p2[1]}`}
  return d;
}
let chartData=null;
function chartSVG(series,sel,projTotal){
  const W=720,H=230,L=40,R=16,Tp=12,B=28,vals=series.map(p=>p.total),n=series.length+(projTotal!=null?1:0);
  if(!series.length)return'';
  const max=niceMax(Math.max(...vals,projTotal||0,1));
  const x=i=>n===1?(L+(W-L-R)/2):L+(W-L-R)*i/(n-1),y=v=>Tp+(H-Tp-B)*(1-Math.max(0,v)/max);
  const pts=series.map((p,i)=>[x(i),y(p.total)]),line=smooth(pts),area=pts.length>1?line+` L${pts[pts.length-1][0]},${H-B} L${pts[0][0]},${H-B} Z`:'';
  let grid='';for(let k=0;k<=4;k++){const v=max*k/4,yy=y(v);grid+=`<line class="ch-grid" x1="${L}" x2="${W-R}" y1="${yy}" y2="${yy}"/><text class="ch-txt" x="${L-8}" y="${yy+4}" text-anchor="end">${kfmt(v)}</text>`}
  const xl=series.map((p,i)=>`<text class="ch-txt" x="${x(i)}" y="${H-6}" text-anchor="middle" ${i===sel?'style="fill:var(--ink);font-weight:600"':''}>${monthName(p.key)}</text>`).join('');
  const dr=UI.animate?' draw':'';let projEl='';
  if(projTotal!=null){const last=pts[pts.length-1],px=x(n-1),py=y(projTotal);projEl=`<path class="ch-proj" d="M${last[0]},${last[1]} L${px},${py}"/><circle cx="${px}" cy="${py}" r="4" fill="var(--surface)" stroke="var(--ink-3)" stroke-width="2"/><text class="ch-txt" x="${px}" y="${H-6}" text-anchor="middle">متوقع</text>`}
  const dots=pts.map((p,i)=>`<circle class="ch-dot ${i===sel?'sel':''}" cx="${p[0]}" cy="${p[1]}" r="${i===sel?5.5:3.5}"/>`).join('');
  chartData={pts,series,W,H};
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="نمو المدخرات شهرياً"><defs><linearGradient id="ga" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--brand)" stop-opacity=".22"/><stop offset="1" stop-color="var(--brand)" stop-opacity="0"/></linearGradient></defs>
   ${grid}${xl}<path class="ch-area${dr}" d="${area}" fill="url(#ga)"/><path class="ch-line${dr}" pathLength="1" d="${line}"/>${projEl}<line class="ch-cross" id="cross" x1="0" x2="0" y1="${Tp}" y2="${H-B}"/>${dots}<rect class="ch-hit" x="0" y="0" width="${W}" height="${H}"/></svg>`;
}
function bindChart(){
  const wrap=$('#chart');if(!wrap||!chartData)return;
  const svg=$('svg',wrap),tip=$('#tip'),cd=chartData,cross=$('#cross');
  const move=e=>{
    const r=svg.getBoundingClientRect(),sx=(e.clientX-r.left)/r.width*cd.W;
    let bi=0,bd=1e9;cd.pts.forEach((p,i)=>{const d=Math.abs(p[0]-sx);if(d<bd){bd=d;bi=i}});
    const p=cd.series[bi],pt=cd.pts[bi];
    tip.innerHTML=`<b>${monthLong(p.key)}</b><br>المدخرات: <span class="num">${fmt(p.total)}</span> ${cur()}<br><span class="muted">صافي الشهر: <span class="num">${p.net>=0?'+':'−'}${fmt(Math.abs(p.net))}</span></span>`;
    tip.style.left=(pt[0]/cd.W*r.width)+'px';tip.style.top=(pt[1]/cd.H*r.height)+'px';tip.classList.add('on');
    cross.setAttribute('x1',pt[0]);cross.setAttribute('x2',pt[0]);cross.classList.add('on');
  };
  svg.addEventListener('pointermove',move);svg.addEventListener('pointerdown',move);
  svg.addEventListener('pointerleave',()=>{tip.classList.remove('on');cross.classList.remove('on')});
}

/* ---------- budget ---------- */
function unallocBox(c){
  const u=Math.round(c.unalloc);
  if(!c.base)return `<span class="pill">أدخل راتبك أولاً</span>`;
  if(Math.abs(u)<1)return `<div class="ua good"><span class="label">الباقي للتوزيع</span><b>${money(0)}</b><small>وزّعت كل الباقي</small></div>`;
  return u>0?`<div class="ua warn"><span class="label">باقي لك توزيع</span><b>${money(u)}</b><small>من ${mtxt(c.base)}</small></div>`:`<div class="ua bad"><span class="label">وزّعت أكثر من الباقي بـ</span><b>${money(-u)}</b><small>قلّل من أحد الأقسام</small></div>`;
}
function splitBar(c){return c.secs.map(s=>`<i data-seg="${s.sec.id}" style="width:${Math.min(100,s.pct)}%;background:${s.sec.color}" title="${esc(s.sec.name)}"></i>`).join('')}
function fixedRow(f,key){
  const open=UI.loanOpen===(f.lid||f.id),L=f.loan?loans(key).find(x=>x.f===f):null;
  return `<div class="fixblock"><div class="fixrow">
    <input class="inp" data-fxname="${f.id}" value="${esc(f.name)}" maxlength="30" aria-label="اسم الالتزام">
    <input class="inp num" type="number" inputmode="decimal" min="0" data-fxamt="${f.id}" value="${f.amount}" aria-label="المبلغ">
    <button class="ibtn ${f.loan?'on':''}" data-act="loan-toggle" data-id="${f.lid||f.id}" aria-label="تفاصيل القرض" title="تتبّع القرض">${ic('bank')}</button>
    <button class="ibtn" data-act="del-fixed" data-id="${f.id}" aria-label="حذف">${ic('trash')}</button></div>
    ${L&&!open?`<div class="loanmini small">${ic('bank')}باقي ${money(L.left)} · ${L.n} ${plural(L.n,'قسط','أقساط','قسط')} · تخلص في ${monthLong(L.end)}</div>`:''}
    ${open?`<div class="loanbox"><div class="row2">
      <div class="field"><span>كم باقي عليك بعد قسط هذا الشهر؟</span><input class="inp num" type="number" inputmode="decimal" min="0" data-loanbal="${f.id}" value="${f.loan?Math.round(loanLeft(f,key)):''}" placeholder="مثال: 120000"></div>
      <div class="field"><span>أصل القرض (اختياري)</span><input class="inp num" type="number" inputmode="decimal" min="0" data-loantot="${f.id}" value="${f.loan&&f.loan.total?f.loan.total:''}" placeholder="عشان نوريك نسبة السداد"></div></div>
      ${L?`<p class="small">باقي <b>${L.n}</b> ${plural(L.n,'قسط','أقساط','قسط')}، وآخر قسط في <b>${monthLong(L.end)}</b>.</p>`:'<p class="small">اكتب المبلغ المتبقي ونحسب لك متى تخلص.</p>'}
      ${f.loan?`<button class="btn ghost sm" data-act="loan-off" data-id="${f.id}">إيقاف تتبّع القرض</button>`:''}</div>`:''}</div>`;
}
function viewBudget(){
  const key=UI.month,m=ensureMonth(key),c=calc(key),fr=c.income?c.fixedTotal/c.income:0,prev=Object.keys(S.months).some(k=>k<key);
  return `
  <div class="page-h"><div><span class="eyebrow">${monthLong(key)}${payday()!==1?' · '+cycleRange(key):''}</span><h1>الميزانية</h1><p class="status neutral"><i></i>اكتب دخلك والتزاماتك، ثم وزّع الباقي على أقسامك بالمبالغ اللي تناسبك.</p></div>
   <div class="row-c"><button class="btn ghost" data-act="edit-secs" aria-pressed="${UI.edit}">${ic('gear')}${UI.edit?'إنهاء التعديل':'تعديل الأقسام'}</button><button class="btn hide-m" data-act="add">${ic('plus')}عملية جديدة</button></div></div>

  <section class="card" style="margin-bottom:16px">
    <div class="card-h"><h2><span class="step">1</span>الدخل والالتزامات الثابتة</h2></div>
    <div class="income">
      <div class="field"><label for="salaryInp"><span>الراتب الشهري (${cur()})</span></label><input class="inp num lg" id="salaryInp" type="number" inputmode="decimal" min="0" value="${m.salary||''}" placeholder="مثال: 8185"></div>
      <div class="field"><span>التزامات تُخصم أول الشهر (قرض، قسط، إيجار ثابت…)</span>
        <div class="fixlist">${(m.fixed||[]).map(f=>fixedRow(f,key)).join('')}
        <form class="fixrow" id="fixForm"><input class="inp" id="fxName" placeholder="مثال: القرض" maxlength="30" aria-label="اسم الالتزام الجديد"><input class="inp num" id="fxAmt" type="number" inputmode="decimal" min="0" placeholder="المبلغ" aria-label="مبلغ الالتزام الجديد"><span></span><button class="ibtn solid" type="submit" aria-label="إضافة التزام">${ic('plus')}</button></form></div>
      </div>
    </div>
    <details class="extras" ${(m.extras||[]).length?'open':''}><summary>${ic('plusc')}دخل إضافي هذا الشهر (مكافأة، عمل جانبي…)</summary>
      <div class="fixlist">${(m.extras||[]).map(x=>`<div class="exrow"><input class="inp" data-exname="${x.id}" value="${esc(x.title)}" maxlength="30" aria-label="الوصف"><input class="inp num" type="number" min="0" data-examt="${x.id}" value="${x.amount}" aria-label="المبلغ"><select class="inp" data-exdest="${x.id}" aria-label="وين يروح"><option value="base" ${x.dest!=='save'?'selected':''}>يضاف للتوزيع</option><option value="save" ${x.dest==='save'?'selected':''}>للمدخرات مباشرة</option></select><button class="ibtn" data-act="del-extra" data-id="${x.id}" aria-label="حذف">${ic('trash')}</button></div>`).join('')}
      <form class="exrow" id="exForm"><input class="inp" id="exName" placeholder="مثال: مكافأة" maxlength="30" aria-label="وصف الدخل"><input class="inp num" id="exAmt" type="number" min="0" placeholder="المبلغ" aria-label="المبلغ"><select class="inp" id="exDest" aria-label="وين يروح"><option value="base">يضاف للتوزيع</option><option value="save">للمدخرات مباشرة</option></select><button class="ibtn solid" type="submit" aria-label="إضافة">${ic('plus')}</button></form></div></details>
    <div class="remain">
      <div><span class="label">الباقي للتوزيع بعد الالتزامات</span>
        <div class="big" style="font-size:clamp(28px,4vw,38px)">${money(c.base)}</div>
        <span class="small">${fmt(c.salary)}${c.exBase?' + '+fmt(c.exBase):''} − ${fmt(c.fixedTotal)} = ${fmt(c.base)} ${cur()}</span></div>
      ${c.income?`<div><div class="split" style="height:10px"><i style="width:${Math.min(100,fr*100)}%;background:var(--ink-3)"></i><i style="width:${Math.max(0,100-fr*100)}%;background:var(--brand)"></i></div>
        <div class="split-legend"><span style="--c:var(--ink-3)"><em></em>التزامات <b dir="ltr">${Math.round(fr*100)}%</b></span><span style="--c:var(--brand)"><em></em>للتوزيع <b dir="ltr">${Math.round((1-fr)*100)}%</b></span>${fr>.4?'<span class="pill warn">التزاماتك أعلى من 40% من دخلك</span>':''}</div></div>`:''}
    </div>
  </section>

  <section class="card" style="margin-bottom:16px">
    <div class="card-h" style="align-items:flex-start"><div><h2><span class="step">2</span>وزّع ${mtxt(c.base)} على أقسامك</h2><p class="small" style="margin-top:4px">${prev?'بدأ هذا الشهر بنفس توزيعك للشهر الماضي. عدّل أي مبلغ متى ما تبي.':'اكتب كم تبي تحط في كل قسم. التوزيع ينتقل معك للشهر الجاي.'}</p></div><div id="ua">${unallocBox(c)}</div></div>
    <div class="split" id="splitBar" style="margin-bottom:6px">${splitBar(c)}</div>
    <div class="bhead"><span>القسم</span><span>المبلغ</span><span>من الباقي</span><span>متوسط صرفك</span><span>هذا الشهر</span><span>المتبقي</span><span></span></div>
    ${c.secs.map(s=>budgetRow(s,c)).join('')}
  </section>
  ${UI.edit?`<section class="card" style="margin-bottom:16px"><div class="card-h"><h2>إضافة قسم</h2></div><form class="addsec" id="addSecForm"><div class="field"><span>اسم القسم</span><input class="inp" id="nsName" placeholder="مثال: سفر، تعليم" required maxlength="30"></div><div class="field" style="max-width:200px"><span>النوع</span><select class="inp" id="nsKind"><option value="spend">صرف</option><option value="save">ادخار</option></select></div><button class="btn" type="submit">${ic('plus')}إضافة</button></form></section>`:''}

  <section class="card">
    <div class="card-h"><div><h2><span class="step">3</span>مصاريف متكررة</h2><p class="small" style="margin-top:4px">اشتراكات وفواتير تنضاف لوحدها كل شهر في يومها.</p></div></div>
    <div class="fixlist">${(S.recurring||[]).map(r=>`<div class="recrow"><input class="inp" data-recname="${r.id}" value="${esc(r.title)}" maxlength="40" aria-label="الوصف"><input class="inp num" type="number" min="0" data-recamt="${r.id}" value="${r.amount}" aria-label="المبلغ"><select class="inp" data-recsec="${r.id}" aria-label="القسم">${S.sections.filter(s=>s.kind!=='save').map(s=>`<option value="${s.id}" ${s.id===r.sec?'selected':''}>${esc(s.name)}</option>`).join('')}</select><select class="inp" data-recday="${r.id}" aria-label="اليوم">${dayOpts(r.day)}</select><button class="ibtn" data-act="del-rec" data-id="${r.id}" aria-label="حذف">${ic('trash')}</button></div>`).join('')||'<p class="small">ما عندك مصاريف متكررة بعد.</p>'}
    <form class="recrow" id="recForm"><input class="inp" id="rcName" placeholder="مثال: اشتراك نتفلكس" maxlength="40" aria-label="الوصف"><input class="inp num" id="rcAmt" type="number" min="0" placeholder="المبلغ" aria-label="المبلغ"><select class="inp" id="rcSec" aria-label="القسم">${S.sections.filter(s=>s.kind!=='save').map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select><select class="inp" id="rcDay" aria-label="اليوم">${dayOpts(new Date().getDate())}</select><button class="ibtn solid" type="submit" aria-label="إضافة">${ic('plus')}</button></form></div>
  </section>`;
}
const dayOpts=sel=>Array.from({length:31},(_,i)=>`<option value="${i+1}" ${i+1===sel?'selected':''}>يوم ${i+1}</option>`).join('');
function budgetRow(s,c){
  const id=s.sec.id,open=UI.openSec===id,isSave=s.sec.kind==='save',av=avgSpend(id,c.key);
  const edit=UI.edit?`<div class="editbox">
    <div class="row2"><div class="field"><span>الاسم</span><input class="inp" data-secname="${id}" value="${esc(s.sec.name)}" maxlength="30"></div>
    <div class="field"><span>النوع</span><select class="inp" data-seckind="${id}"><option value="spend" ${!isSave?'selected':''}>صرف</option><option value="save" ${isSave?'selected':''}>ادخار</option></select></div></div>
    <div class="field"><span>اللون</span><div class="swatches">${PALETTE.map(p=>`<button class="sw" style="--c:${p}" data-act="sec-color" data-id="${id}" data-c="${p}" aria-pressed="${p===s.sec.color}" aria-label="لون"></button>`).join('')}</div></div>
    <div class="field"><span>الأيقونة</span><div class="swatches">${ICON_CHOICES.map(n=>`<button class="ibtn" data-act="sec-icon" data-id="${id}" data-i="${n}" aria-pressed="${n===s.sec.icon}" aria-label="أيقونة">${ic(n)}</button>`).join('')}</div></div>
    <div><button class="btn sm ${UI.confirm===id?'danger':'ghost'}" data-act="del-sec" data-id="${id}">${ic('trash')}${UI.confirm===id?'تأكيد حذف القسم وعملياته':'حذف القسم'}</button></div></div>`:'';
  const avTxt=av?(isSave?`${fmt(av.v)}<small>إيداع إضافي</small>`:`${fmt(av.v)}${s.alloc&&av.v>s.alloc*1.05?'<small class="neg">أعلى من مبلغك</small>':`<small>آخر ${av.n} ${plural(av.n,'شهر','أشهر','شهر')}</small>`}`):'<span class="small">—</span>';
  return `<div class="brow" style="--c:${s.sec.color}">
   <div class="brow-main">
    <div class="sname bname"><span class="dotic">${ic(s.sec.icon)}</span><span style="min-width:0"><b>${esc(s.sec.name)}</b><small>${isSave?'ادخار':'صرف'} · ${s.entries.length} عملية${s.carry?` · <span class="pos">+${fmt(s.carry)} مرحّل</span>`:''}</small></span></div>
    <div class="bamt"><span class="ml">المبلغ اللي تحطه</span><input class="inp num amt" type="number" inputmode="decimal" min="0" data-amt="${id}" value="${s.alloc0?Math.round(s.alloc0):''}" placeholder="0" aria-label="مبلغ ${esc(s.sec.name)}"></div>
    <div class="bn bnp"><span class="ml">من الباقي</span><span class="num" data-pv="${id}">${fmtP(s.pct)}</span></div>
    <div class="bn bn1"><span class="ml">متوسط صرفك</span><span class="num">${avTxt}</span></div>
    <div class="bn bn2"><span class="ml">${isSave?'إيداع هذا الشهر':'صرفت هذا الشهر'}</span><span class="num">${fmt(isSave?s.deposit:s.spent)}</span></div>
    <div class="bn bn3"><span class="ml">${isSave?'المجنّب':(s.remaining<0?'تجاوز':'المتبقي')}</span><span class="num ${isSave?'pos':(s.remaining<0?'neg':'')}">${fmt(isSave?s.saved:Math.abs(s.remaining))}</span></div>
    <div class="bact"><button class="ibtn" data-act="add" data-id="${id}" aria-label="${isSave?'إيداع':'إضافة مصروف'}" title="${isSave?'إيداع':'إضافة مصروف'}">${ic('plus')}</button><button class="ibtn" data-act="toggle-ents" data-id="${id}" aria-expanded="${open}" aria-label="العمليات" title="العمليات">${ic(open?'up':'down')}</button></div>
   </div>
   ${isSave?'':`<span class="bar ${barCls(s)}" style="margin-top:10px"><i data-w="${s.alloc?Math.min(100,usage(s)*100):0}"></i></span>`}
   ${edit}
   ${open?`<div class="ents">${s.entries.length?[...s.entries].sort((a,b)=>b.date.localeCompare(a.date)).map(e=>entRow(e,s.sec)).join(''):'<p class="small" style="padding:10px 0">لا توجد عمليات في هذا القسم.</p>'}</div>`:''}
  </div>`;
}
function entRow(e,sec){
  const planned=e.date>todayStr();
  return `<div class="ent" data-act="edit-entry" data-id="${e.id}" role="button" tabindex="0"><div class="t">${esc(e.title)}<div class="d">${fmtDate(e.date)}${e.rec?` · ${ic('repeat')}متكرر`:''}${planned?' · <span class="pill">مجدولة</span>':''}</div></div><span class="${sec.kind==='save'?'plus':''}">${money(e.amount,{plus:sec.kind==='save'})}</span><span class="ibtn" aria-hidden="true">${ic('edit')}</span></div>`;
}
function liveSplit(){
  const c=calc(UI.month);
  c.secs.forEach(s=>{const pv=$(`[data-pv="${s.sec.id}"]`),seg=$(`[data-seg="${s.sec.id}"]`);if(pv)pv.textContent=fmtP(s.pct);if(seg)seg.style.width=Math.min(100,s.pct)+'%'});
  $('#ua').innerHTML=unallocBox(c);
}

/* ---------- log ---------- */
function viewLog(){
  const key=UI.month,m=S.months[key];
  if(!m)return `<div class="card empty"><h3>ما فيه عمليات</h3></div>`;
  const q=nz(UI.logQ);
  let rows=m.entries.map(e=>({e,s:secOf(e.sec)})).filter(r=>r.s);
  if(UI.logFilter!=='all')rows=rows.filter(r=>r.s.id===UI.logFilter);
  if(q)rows=rows.filter(r=>nz(r.e.title).includes(q));
  rows.sort((a,b)=>b.e.date.localeCompare(a.e.date));
  const tot=rows.reduce((a,r)=>a+(r.s.kind==='save'?0:r.e.amount),0),groups={};
  rows.forEach(r=>(groups[r.e.date]=groups[r.e.date]||[]).push(r));
  return `<div class="page-h"><div><span class="eyebrow">${monthLong(key)}</span><h1>العمليات</h1><p class="status neutral"><i></i>اضغط على أي عملية لتعديلها.</p></div><button class="btn hide-m" data-act="add">${ic('plus')}عملية جديدة</button></div>
  <div class="filters"><button class="fchip" data-act="filter" data-id="all" aria-pressed="${UI.logFilter==='all'}">الكل (${m.entries.length})</button>${S.sections.map(s=>`<button class="fchip" style="--c:${s.color}" data-act="filter" data-id="${s.id}" aria-pressed="${UI.logFilter===s.id}"><i></i>${esc(s.name)}</button>`).join('')}</div>
  <div class="field" style="margin-bottom:12px"><input class="inp" id="logQ" type="search" placeholder="ابحث في العمليات…" value="${esc(UI.logQ)}" aria-label="بحث"></div>
  <section class="card">${rows.length?Object.keys(groups).map(d=>`<div class="lgroup"><div class="lday"><span>${fmtDate(d)}</span>${d>todayStr()?'<span class="pill">مجدولة</span>':''}<span class="small">${money(groups[d].reduce((a,r)=>a+(r.s.kind==='save'?0:r.e.amount),0))}</span></div>${groups[d].map(r=>`<div class="logrow" style="--c:${r.s.color}" data-act="edit-entry" data-id="${r.e.id}" role="button" tabindex="0"><span class="chip-ic">${ic(r.s.icon)}</span><div class="mid"><b>${esc(r.e.title)}</b><small>${esc(r.s.name)}${r.e.rec?' · متكرر':''}</small></div><span class="${r.s.kind==='save'?'plus':''}">${money(r.e.amount,{plus:r.s.kind==='save'})}</span><span class="ibtn" aria-hidden="true">${ic('edit')}</span></div>`).join('')}</div>`).join(''):`<div class="empty"><h3>ما لقيت عمليات</h3><p>غيّر الفلتر أو أضف عملية جديدة.</p></div>`}</section>
  ${rows.length?`<p class="muted" style="margin-top:10px;font-size:13.5px">مجموع الصرف المعروض: ${money(tot)}</p>`:''}`;
}

/* ---------- reports ---------- */
function viewReports(){
  const ks=Object.keys(S.months).sort().filter(k=>k<=UI.month).slice(-6),C=ks.map(calc);
  if(!C.some(c=>c.spent||c.salary))return `<div class="page-h"><div><h1>التقارير</h1></div></div><div class="card empty"><h3>ما فيه بيانات كافية</h3><p>سجّل راتبك ومصاريفك وتطلع لك التقارير هنا.</p></div>`;
  const spends=S.sections.filter(s=>s.kind!=='save');
  const real=C.filter(c=>!c.assumed),avgSp=real.length?real.reduce((a,c)=>a+c.spent+c.fixedTotal,0)/real.length:0;
  const closed=C.filter(c=>c.closed&&c.income),avgRate=closed.length?closed.reduce((a,c)=>a+c.counted/c.income,0)/closed.length:0;
  const best=closed.slice().sort((a,b)=>b.counted-a.counted)[0];
  // stacked spend bars
  const W=720,H=240,L=44,B=28,Tp=10,bw=Math.min(64,(W-L-20)/ks.length*.55);
  const tots=C.map(c=>c.fixedTotal+spends.reduce((a,s)=>a+(c.secs.find(x=>x.sec.id===s.id)||{spent:0}).spent,0));
  const max=niceMax(Math.max(...tots,...C.map(c=>c.income),1)),y=v=>Tp+(H-Tp-B)*(1-v/max),xc=i=>L+(W-L-20)*(i+.5)/ks.length;
  let bars='',grid='';for(let k=0;k<=4;k++){const v=max*k/4;grid+=`<line class="ch-grid" x1="${L}" x2="${W-10}" y1="${y(v)}" y2="${y(v)}"/><text class="ch-txt" x="${L-8}" y="${y(v)+4}" text-anchor="end">${kfmt(v)}</text>`}
  C.forEach((c,i)=>{let acc=0;const seg=(v,col,name)=>{if(v<=0)return'';const y0=y(acc+v),h=y(acc)-y0;acc+=v;return `<rect x="${xc(i)-bw/2}" y="${y0}" width="${bw}" height="${Math.max(0,h-1)}" fill="${col}" rx="2"><title>${esc(name)}: ${fmt(v)}</title></rect>`};
    bars+=`<g class="rbar" style="--d:${i*80}ms">${seg(c.fixedTotal,'var(--ink-3)','التزامات')}${spends.map(s=>{const x=c.secs.find(q=>q.sec.id===s.id);return seg(x?x.spent:0,s.color,s.name)}).join('')}</g>`;
    bars+=`<line x1="${xc(i)-bw/2-6}" x2="${xc(i)+bw/2+6}" y1="${y(c.income)}" y2="${y(c.income)}" stroke="var(--ink-2)" stroke-width="1.5" stroke-dasharray="4 4"><title>الدخل ${fmt(c.income)}</title></line>`;
    bars+=`<text class="ch-txt" x="${xc(i)}" y="${H-8}" text-anchor="middle" ${c.key===UI.month?'style="fill:var(--ink);font-weight:600"':''}>${monthName(c.key)}${c.assumed?'*':''}</text>`});
  // this month vs average
  const cm=calc(UI.month),cmp=spends.map(s=>{const a=avgSpend(s.id,UI.month),x=cm.secs.find(q=>q.sec.id===s.id);return{s,now:x?x.spent:0,avg:a?a.v:null}});
  // top places
  const pl={};ks.forEach(k=>S.months[k].entries.forEach(e=>{const s=secOf(e.sec);if(!s||s.kind==='save')return;const rk=ruleKey(e.title)||e.title;(pl[rk]=pl[rk]||{t:e.title,v:0,n:0,c:s.color});pl[rk].v+=e.amount;pl[rk].n++}));
  const top=Object.values(pl).sort((a,b)=>b.v-a.v).slice(0,8),tmax=top.length?top[0].v:1;
  // savings rate bars
  const rates=C.map(c=>({k:c.key,r:c.income?(c.counted+c.projected)/c.income:0,closed:c.closed}));
  return `<div class="page-h"><div><span class="eyebrow">آخر ${ks.length} ${plural(ks.length,'شهر','أشهر','شهر')}</span><h1>التقارير</h1><p class="status neutral"><i></i>صورة واضحة لصرفك وادخارك عبر الأشهر.</p></div><button class="btn ghost" data-act="export">${ic('download')}تصدير Excel</button></div>
  <div class="kpis">
    <div class="card kpi"><span class="label">متوسط صرفك الشهري</span><b>${money(avgSp)}</b><small class="small">مع الالتزامات</small></div>
    <div class="card kpi"><span class="label">متوسط معدل الادخار</span><b><span class="num">${Math.round(avgRate*100)}%</span></b><small class="small">للأشهر المكتملة</small></div>
    <div class="card kpi"><span class="label">أفضل شهر</span><b>${best?monthName(best.key):'—'}</b><small class="small">${best?'ادخرت '+mtxt(best.counted):''}</small></div>
    <div class="card kpi"><span class="label">إجمالي المدخرات</span><b>${money(totalSaved(timeline()))}</b><small class="small">حتى الآن</small></div>
  </div>
  <section class="card" style="margin-bottom:16px"><div class="card-h"><div><h2>الصرف الشهري حسب القسم</h2><p class="small">الخط المتقطع هو دخل الشهر.${C.some(c=>c.assumed)?' * شهر مُفترض.':''}</p></div><div class="legend small">${spends.map(s=>`<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}<span><i style="background:var(--ink-3)"></i>التزامات</span></div></div>
    <div class="chartwrap"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="الصرف الشهري">${grid}${bars}</svg></div></section>
  <div class="grid-b">
    <section class="card"><div class="card-h"><h2>${monthName(UI.month)} مقابل متوسطك</h2></div>
      <div class="cmp">${cmp.map(x=>{const d=x.avg?((x.now-x.avg)/x.avg):null;return `<div class="cmprow" style="--c:${x.s.color}"><span class="sname"><span class="dotic">${ic(x.s.icon)}</span><b>${esc(x.s.name)}</b></span><span class="num">${fmt(x.now)}</span><span class="small">متوسط ${x.avg!=null?fmt(x.avg):'—'}</span>${d==null?'<span class="pill">جديد</span>':`<span class="pill ${d>.1?'bad':d<-.1?'good':''}">${ic(d>0?'arrowup':'arrowdown')}<span dir="ltr">${Math.abs(Math.round(d*100))}%</span></span>`}</div>`}).join('')}</div></section>
    <section class="card"><div class="card-h"><h2>أكثر الأماكن صرفاً</h2><span class="small">آخر ${ks.length} ${plural(ks.length,'شهر','أشهر','شهر')}</span></div>
      ${top.length?top.map(t=>`<div class="place"><div class="row-sb"><span>${esc(t.t)} <span class="small">· ${t.n} ${plural(t.n,'مرة','مرات','مرة')}</span></span>${money(t.v)}</div><span class="bar"><i data-w="${t.v/tmax*100}" style="background:${t.c}"></i></span></div>`).join(''):'<p class="small">ما فيه عمليات بعد.</p>'}</section>
  </div>
  <section class="card" style="margin-top:16px"><div class="card-h"><div><h2>معدل الادخار</h2><p class="small">الخط المتقطع يمثل هدف 20% من الدخل.</p></div></div>
    <div class="rates">${rates.map(r=>`<div class="rate"><div class="rtrack"><span class="rgoal"></span><i data-h="${Math.max(0,Math.min(100,r.r*200))}" class="${r.r>=.2?'ok':r.r>0?'mid':'low'}"></i></div><b class="num">${Math.round(r.r*100)}%</b><span class="small">${monthName(r.k)}${r.closed?'':' (جارٍ)'}</span></div>`).join('')}</div></section>`;
}

/* ---------- modals ---------- */
function openModal(html,cls=''){
  const root=$('#modal-root');root.innerHTML=`<div class="ov" data-act="ov-close"><div class="modal ${cls}" role="dialog" aria-modal="true">${html}</div></div>`;
  const f=$('input:not([type=hidden]),select',root);if(f&&matchMedia('(pointer:fine)').matches)setTimeout(()=>f.focus(),30);
}
function closeModal(){$('#modal-root').innerHTML='';UI.editing=null}
function findEntry(id){for(const k of Object.keys(S.months)){const e=S.months[k].entries.find(x=>x.id===id);if(e)return{k,e}}return null}
function defDate(key){const t=todayStr(),a=isoOf(cycleStart(key)),b=isoOf(cycleEnd(key));return t>=a&&t<=b?t:b}
function openAdd(secId,entryId){
  const key=UI.month;ensureMonth(key);
  const found=entryId?findEntry(entryId):null,e=found?found.e:null;UI.editing=found;
  const first=e?e.sec:(secId||(S.sections.find(s=>s.kind!=='save')||S.sections[0]).id);
  const F=!e&&key===nowKey()?frequent():[];
  openModal(`<div class="mh"><h2>${e?'تعديل العملية':'عملية جديدة'}</h2><button class="ibtn" data-act="ov-close" aria-label="إغلاق">${ic('x')}</button></div>
   ${F.length?`<div class="quick in-modal">${F.map((f,i)=>{const s=secOf(f.sec);return `<button type="button" class="qchip" style="--c:${s?s.color:'var(--brand)'}" data-act="qfill" data-i="${i}"><i></i>${esc(f.title)} <b class="num">${fmt(f.amount)}</b></button>`}).join('')}</div>`:''}
   <form id="addForm">
    <div class="amtbig"><input class="inp num" id="aAmt" type="number" inputmode="decimal" min="0" step="any" required placeholder="0" value="${e?e.amount:''}" aria-label="المبلغ"><span class="cur">${cur()}</span></div>
    <div class="field"><span>القسم</span><div class="secpick" role="radiogroup">${S.sections.map(s=>`<label style="--c:${s.color}"><input type="radio" name="aSec" value="${s.id}" ${s.id===first?'checked':''}><span>${ic(s.icon)}${esc(s.name)}</span></label>`).join('')}</div></div>
    <div class="row2"><div class="field"><label for="aTitle"><span>وش هي؟</span></label><input class="inp" id="aTitle" required maxlength="60" placeholder="مثال: غداء، بنزين" value="${e?esc(e.title):''}"></div>
    <div class="field"><label for="aDate"><span>التاريخ</span></label><input class="inp" id="aDate" type="date" required value="${e?e.date:defDate(key)}"></div></div>
    <div class="hint" id="aHint"></div>
    <div class="acts">${e?`<button type="button" class="btn ghost danger-t" data-act="del-entry" data-id="${e.id}">${ic('trash')}حذف</button><span style="flex:1"></span>`:''}<button type="button" class="btn ghost" data-act="ov-close">إلغاء</button><button class="btn" type="submit">${ic('check')}${e?'حفظ التعديل':'أضف'}</button></div></form>`,'sheet');
  updHint();
}
function selSec(){const r=$('input[name=aSec]:checked');return r?r.value:null}
function updHint(){
  const h=$('#aHint');if(!h)return;
  const k=$('#aDate')&&$('#aDate').value?cycleKeyOfIso($('#aDate').value):UI.month,c=S.months[k]?calc(k):null,s=c?c.secs.find(x=>x.sec.id===selSec()):null,a=parseFloat($('#aAmt').value)||0;
  if(!s){h.textContent='';return}
  const prevAmt=UI.editing&&UI.editing.e.sec===s.sec.id?UI.editing.e.amount:0;
  if(s.sec.kind==='save'){h.innerHTML=`مجنّب في ${esc(s.sec.name)}: <b>${mtxt(s.saved-prevAmt)}</b>${a?` ← <b class="pos">${mtxt(s.saved-prevAmt+a)}</b>`:''}`;return}
  const rem=s.remaining+prevAmt,after=rem-a;
  h.innerHTML=`المتبقي في ${esc(s.sec.name)}: <b>${mtxt(rem)}</b>${a?` ← بعد العملية <b class="${after<0?'neg':'pos'}">${mtxt(after)}</b>`:''}`;
}
function openSettings(){
  openModal(`<div class="mh"><h2>الإعدادات</h2><button class="ibtn" data-act="ov-close" aria-label="إغلاق">${ic('x')}</button></div><form id="setForm">
   <div class="row2"><div class="field"><label for="sName"><span>اسمك (اختياري)</span></label><input class="inp" id="sName" maxlength="20" value="${esc(S.name)}"></div>
   <div class="field"><label for="sCur"><span>العملة</span></label><select class="inp" id="sCur">${Object.keys(CURR).map(k=>`<option value="${k}" ${S.currency===k?'selected':''}>${CURR[k]}</option>`).join('')}</select></div></div>
   <div class="row2"><div class="field"><label for="sPay"><span>يوم نزول الراتب</span></label><select class="inp" id="sPay">${Array.from({length:28},(_,i)=>`<option value="${i+1}" ${payday()===i+1?'selected':''}>${i===0?'أول الشهر (1)':'يوم '+(i+1)}</option>`).join('')}</select></div>
   <div class="field"><label for="sOpen"><span>مدخرات قبل استخدام التطبيق</span></label><input class="inp num" id="sOpen" type="number" inputmode="decimal" min="0" value="${S.opening||0}"></div></div>
   <p class="small">الشهر يبدأ من يوم الراتب وينتهي قبل الراتب الجاي. مثلاً إذا راتبك يوم 27، فشهر نوفمبر يبدأ 27 نوفمبر.</p>
   <div class="setsec"><b>النسخ الاحتياطي</b><p class="small">${syncPill()} </p><div class="row-c"><button type="button" class="btn ghost sm" data-act="export">${ic('download')}تصدير نسخة Excel</button><button type="button" class="btn ghost sm" data-act="restore">${ic('upload')}استرجاع نسخة</button></div></div>
   <div class="acts"><button type="button" class="btn ghost sm ${UI.confirm==='reset'?'danger':''}" data-act="reset-all">${ic('trash')}${UI.confirm==='reset'?'تأكيد المسح الكامل':'مسح كل البيانات'}</button><button type="button" class="btn ghost sm" data-act="load-demo">مثال تجريبي</button><span style="flex:1"></span><button class="btn" type="submit">حفظ</button></div></form>`);
}
function openGoals(){
  const avg=avgSpendTotal();
  openModal(`<div class="mh"><h2>الأهداف</h2><button class="ibtn" data-act="ov-close" aria-label="إغلاق">${ic('x')}</button></div>
   <p class="small" style="margin-bottom:12px">مدخراتك تملأ الأهداف بالترتيب: الأول يكتمل، بعدين اللي بعده.</p>
   <div class="glist">${S.goals.map((g,i)=>`<div class="grow-e"><span class="gi">${i+1}</span><input class="inp" data-gname="${g.id}" value="${esc(g.name)}" maxlength="30" aria-label="اسم الهدف"><input class="inp num" type="number" min="1" data-gtarget="${g.id}" value="${g.target}" aria-label="المبلغ"><button class="ibtn" data-act="goal-up" data-id="${g.id}" ${i===0?'disabled':''} aria-label="رفع الأولوية">${ic('arrowup')}</button><button class="ibtn" data-act="goal-del" data-id="${g.id}" aria-label="حذف">${ic('trash')}</button></div>`).join('')}</div>
   <form class="grow-e" id="goalForm"><span class="gi">+</span><input class="inp" id="gName" placeholder="مثال: سفرة الصيف" maxlength="30" aria-label="اسم هدف جديد"><input class="inp num" id="gTarget" type="number" min="1" placeholder="المبلغ" aria-label="المبلغ"><button class="ibtn solid" type="submit" aria-label="إضافة">${ic('plus')}</button><span></span></form>
   ${avg?`<div class="hint" style="margin-top:14px">${ic('shield')} صندوق الطوارئ المقترح: 3 أشهر من مصاريفك = <b>${mtxt(Math.round(avg*3/100)*100)}</b> <button class="btn ghost sm" data-act="goal-emerg" data-v="${Math.round(avg*3/100)*100}">أضفه كأولوية أولى</button></div>`:''}
   <div class="acts"><button class="btn" data-act="ov-close">تم</button></div>`);
}
function openReview(key){
  const c=calc(key),prev=S.months[shiftKey(key,-1)]?calc(shiftKey(key,-1)):null;
  const over=c.secs.filter(s=>s.sec.kind!=='save'&&s.remaining<-1).sort((a,b)=>a.remaining-b.remaining);
  const under=c.secs.filter(s=>s.sec.kind!=='save'&&s.remaining>1);
  const leftPos=under.reduce((a,s)=>a+s.remaining,0);
  const savedIf=c.saveSum+c.left;
  openModal(`<div class="review"><span class="eyebrow">إقفال ${monthLong(key)}</span><h2>${savedIf>0?'شهر حلو!':'شهر صعب، والجاي أفضل'}</h2>
   <div class="rv-big"><span class="label">ادخرت هذا الشهر</span><b>${money(savedIf)}</b>${prev?`<span class="pill ${savedIf>=prev.counted?'good':'warn'}">${ic(savedIf>=prev.counted?'arrowup':'arrowdown')}${mtxt(Math.abs(savedIf-prev.counted))} عن ${monthName(prev.key)}</span>`:''}</div>
   <dl class="rows">
    <div><dt>المجنّب من البداية</dt><dd>${money(c.saveSum)}</dd></div>
    <div><dt>${c.left>=0?'اللي ما صرفته':'تجاوز الميزانية'}</dt><dd class="${c.left<0?'neg':'pos'}">${money(c.left)}</dd></div>
    ${over.length?`<div><dt>أكثر قسم تجاوزت فيه</dt><dd>${esc(over[0].sec.name)} · <span class="neg">${mtxt(-over[0].remaining)}</span></dd></div>`:'<div><dt>الأقسام</dt><dd class="pos">ما تجاوزت أي قسم</dd></div>'}
   </dl>
   ${leftPos>1?`<p class="label" style="margin:16px 0 8px">باقي ${mtxt(leftPos)} ما صرفتها. وين تبيها تروح؟</p>
   <div class="choice"><button class="ch-opt" data-act="close-month" data-k="${key}" data-c="save">${ic('coins')}<b>للمدخرات</b><small>تنضاف لإجمالي مدخراتك وأهدافك</small></button>
   <button class="ch-opt" data-act="close-month" data-k="${key}" data-c="carry">${ic('repeat')}<b>ترحيل للشهر الجاي</b><small>كل قسم ياخذ باقيه فوق ميزانيته في ${monthName(shiftKey(key,1))}</small></button></div>`:
   `<div class="acts"><button class="btn" data-act="close-month" data-k="${key}" data-c="save">تمام</button></div>`}</div>`,'review-m');
  if(savedIf>0)setTimeout(()=>celebrate(.7),250);
}

/* ---------- toast & confetti ---------- */
function toast(msg,cls='',ms=3200,action){
  const t=document.createElement('div');t.className='toast '+cls;t.innerHTML=`<span>${esc(msg)}</span>`;
  if(action){const b=document.createElement('button');b.className='tbtn';b.textContent=action.label;b.onclick=()=>{action.fn();t.remove()};t.appendChild(b)}
  $('#toasts').appendChild(t);
  setTimeout(()=>{t.classList.add('out');setTimeout(()=>t.remove(),320)},ms);
}
function celebrate(power){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const cv=$('#fx'),dpr=Math.min(2,devicePixelRatio||1),W=cv.width=innerWidth*dpr,H=cv.height=innerHeight*dpr,ctx=cv.getContext('2d');
  const cols=['#2A9D7C','#E3BC5A','#4C78C8','#C45A6C','#7A66C2','#9BCDBE'],P=[],N=Math.round(110*(power||1));
  for(let i=0;i<N;i++){const a=-Math.PI/2+(Math.random()-.5)*1.7,v=(9+Math.random()*10)*dpr;P.push({x:W/2,y:H*.62,vx:Math.cos(a)*v,vy:Math.sin(a)*v,w:(6+Math.random()*6)*dpr,h:(3+Math.random()*5)*dpr,r:Math.random()*6,vr:(Math.random()-.5)*.4,c:cols[i%cols.length],l:1})}
  let f=0;(function tick(){ctx.clearRect(0,0,W,H);let alive=0;
    P.forEach(p=>{p.vy+=.35*dpr;p.vx*=.992;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;if(f>70)p.l-=.02;if(p.l>0&&p.y<H+40){alive++;ctx.save();ctx.globalAlpha=Math.max(0,p.l);ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.fillStyle=p.c;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore()}});
    f++;if(alive&&f<260)requestAnimationFrame(tick);else ctx.clearRect(0,0,W,H)})();
}
