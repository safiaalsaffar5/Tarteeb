/* ---------- Excel import ---------- */
let WB=null;
function nz(s){
  return String(s==null?'':s).toLowerCase().replace(/[ً-ٰٟـ]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه')
   .replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/٫/g,'.').replace(/٬/g,',').replace(/\s+/g,' ').trim();
}
const HW={
 date:['التاريخ','تاريخ','date','اليوم','day'],
 debit:['مدين','سحب','debit','withdrawal','withdrawals','المسحوبات','مصروف','مصروفات','صرف','paid out','expense','expenses'],
 credit:['دائن','ايداع','credit','deposit','deposits','الايداعات','دخل','الدخل','income','paid in','ايراد','ايرادات'],
 amount:['المبلغ','مبلغ','amount','القيمه','قيمه','value','السعر','price','الاجمالي','total','cost','التكلفه'],
 category:['الفئه','التصنيف','تصنيف','category','القسم','الخانه','نوع الصرف','فئه'],
 type:['نوع العمليه','نوع','العمليه','type','transaction type','حركه','الحركه'],
 desc:['البيان','الوصف','وصف','التفاصيل','تفاصيل','description','details','merchant','المتجر','الجهه','البند','بند','item','ملاحظات','note','notes','name','الاسم','memo','المستفيد','narration','reference'],
 balance:['الرصيد','رصيد','balance']
};
const KW={
 bills:['ايجار','rent','كهرباء','فاتوره','فواتير','electric','stc','mobily','zain','موبايلي','زين','انترنت','internet','قسط','اقساط','تامين','insurance','مياه','water','جمعيه','تمويل','loan','سداد','حكومي','رسوم','بلديه','اتصالات','fiber','فايبر','باقه'],
 living:['بقاله','سوبرماركت','supermarket','panda','بنده','tamimi','التميمي','carrefour','كارفور','lulu','لولو','danube','الدانوب','othaim','العثيم','بنزين','petrol','fuel','aldrees','الدريس','وقود','صيدليه','pharmacy','نهدي','nahdi','الدواء','مواصلات','uber','careem','اوبر','كريم','مدرسه','تعليم','مستشفي','عياده','خضار','فواكه','غسيل سياره','مخبز','لحم','دجاج','سوق','تموينات','طبي','حفاضات','groceries','grocery'],
 fun:['مطعم','restaurant','كافيه','cafe','قهوه','coffee','starbucks','ستاربكس','dunkin','نتفلكس','netflix','spotify','سبوتيفاي','سينما','cinema','vox','العاب','game','playstation','هديه','gift','سفر','فندق','hotel','booking','mcdonald','ماكدونالدز','kfc','البيك','albaik','هنقرستيشن','hungerstation','jahez','جاهز','mrsool','مرسول','talabat','طلبات','noon','نون','amazon','امازون','shein','شي ان','تسوق','ملابس','اشتراك','subscription','توصيل','طلعه','ترفيه','youtube','apple','اب ستور','حلويات','ايسكريم','بوليفارد','ملاهي','رحله','كوفي','برجر','بيتزا','شاورما']
};
const SALARY_W=['راتب','salary','payroll','wage','اجر','مكافاه','bonus'];
const INCOME_W=['دخل','ايداع','income','credit','deposit','راتب','وارد','ايراد','salary','قبض','تحويل وارد','paid in'];
const EXPENSE_W=['صرف','مصروف','سحب','debit','expense','withdraw','مدين','شراء','purchase','pos','دفع','payment'];
function hasW(t,list){return list.some(w=>t.includes(nz(w)))}
function isDateFmt(z){try{return XLSX.SSF.is_date(z)}catch(e){return /[dmy]/i.test(String(z).replace(/\[.*?\]|"[^"]*"/g,''))}}
function sheetMatrix(ws){
  const ref=ws['!ref'];if(!ref)return[];
  const rg=XLSX.utils.decode_range(ref),rows=[];
  for(let r=rg.s.r;r<=rg.e.r;r++){
    const row=[];
    for(let cc=rg.s.c;cc<=rg.e.c;cc++){
      const cell=ws[XLSX.utils.encode_cell({r,c:cc})];let v=null,date=null;
      if(cell){
        v=cell.v;
        if(cell.t==='d'&&v instanceof Date){date={y:v.getFullYear(),m:v.getMonth()+1,d:v.getDate()}}
        else if(cell.t==='n'&&cell.z&&isDateFmt(cell.z)){try{const p=XLSX.SSF.parse_date_code(cell.v);if(p&&p.y>1990)date={y:p.y,m:p.m,d:p.d}}catch(e){}}
      }
      row.push({v,date});
    }
    if(row.some(x=>x.v!=null&&String(x.v).trim()!==''))rows.push(row);
  }
  return rows;
}
function strDate(v){
  if(v==null)return null;
  const s=nz(String(v));let m=s.match(/(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);
  if(m)return{y:+m[1],m:+m[2],d:+m[3]};
  m=s.match(/(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})/);
  if(m){let a=+m[1],b=+m[2],y=+m[3];if(y<100)y+=2000;let d=a,mo=b;if(b>12&&a<=12){d=b;mo=a}if(mo<1||mo>12||d<1||d>31)return null;return{y,m:mo,d}}
  return null;
}
function toNum(v){
  if(typeof v==='number')return isFinite(v)?v:null;
  if(v==null)return null;
  let s=nz(String(v));if(!s)return null;
  const neg=/^\(.*\)$/.test(s)||/^-/.test(s)||/\d-$/.test(s);
  const mm=s.match(/\d[\d,]*(?:\.\d+)?/);if(!mm)return null;
  let t=mm[0];if(/,\d{1,2}$/.test(t)&&t.indexOf('.')<0)t=t.replace(',','.');else t=t.replace(/,/g,'');
  const n=parseFloat(t);return isNaN(n)?null:(neg?-n:n);
}
function isNumLike(v){return typeof v==='number'||(typeof v==='string'&&/^[-+(]?\s*\d[\d.,]*\s*\)?\s*[a-z.؀-ۿ]{0,5}$/.test(nz(v)))}
function findHeader(M){
  let best=-1,bs=0;
  for(let r=0;r<Math.min(10,M.length);r++){
    let sc=0,strs=0;
    M[r].forEach(c=>{if(typeof c.v==='string'&&c.v.trim()){strs++;const t=nz(c.v);if(Object.values(HW).some(l=>l.some(w=>t===nz(w)||t.includes(nz(w)))))sc++}});
    if(strs>=2&&sc>bs){bs=sc;best=r}
  }
  if(best<0&&M.length>1){const a=M[0].filter(c=>typeof c.v==='string'&&c.v.trim()&&!isNumLike(c.v)).length,b=M[1].some(c=>c.date||typeof c.v==='number');if(a>=2&&b)best=0}
  return best;
}
function detectMapping(M,hr){
  const ncol=Math.max(...M.map(r=>r.length)),names=[];
  for(let i=0;i<ncol;i++){const h=hr>=0&&M[hr][i]?M[hr][i].v:null;names.push(h!=null&&String(h).trim()?String(h).trim():'عمود '+String.fromCharCode(65+i))}
  const map={date:-1,desc:-1,amount:-1,debit:-1,credit:-1,category:-1,type:-1},used=new Set();
  if(hr>=0){
    ['date','debit','credit','amount','category','type','desc'].forEach(role=>{
      for(const pass of [0,1]){
        if(map[role]>=0)break;
        for(let i=0;i<ncol;i++){
          if(used.has(i))continue;const t=nz(names[i]);
          if(hasW(t,HW.balance)&&role!=='balance')continue;
          const ok=pass===0?HW[role].some(w=>t===nz(w)):HW[role].some(w=>t.includes(nz(w)));
          if(ok){map[role]=i;used.add(i);break}
        }
      }
    });
  }
  const data=M.slice(hr+1).slice(0,60);
  const frac=(i,f)=>{const v=data.map(r=>r[i]).filter(c=>c&&c.v!=null&&String(c.v).trim()!=='');return v.length?v.filter(f).length/v.length:0};
  const balCols=new Set(names.map((n,i)=>hasW(nz(n),HW.balance)?i:-1).filter(i=>i>=0));
  if(map.date<0){for(let i=0;i<ncol;i++){if(used.has(i))continue;if(frac(i,c=>c.date||strDate(c.v))>=.7){map.date=i;used.add(i);break}}}
  if(map.amount<0&&map.debit<0&&map.credit<0){for(let i=0;i<ncol;i++){if(used.has(i)||balCols.has(i))continue;if(frac(i,c=>!c.date&&isNumLike(c.v))>=.7){map.amount=i;used.add(i);break}}}
  if(map.desc<0){let bi=-1,bl=0;for(let i=0;i<ncol;i++){if(used.has(i))continue;const txt=data.map(r=>r[i]).filter(c=>c&&typeof c.v==='string'&&!c.date&&!isNumLike(c.v));if(txt.length<data.length*.5)continue;const l=txt.reduce((a,c)=>a+c.v.length,0)/txt.length;if(l>bl){bl=l;bi=i}}if(bi>=0){map.desc=bi;used.add(bi)}}
  return{names,map};
}
function secKeywords(sec){
  const base=KW[sec.id]||[];
  const own=nz(sec.name).split(' ').map(w=>w.replace(/^ال/,'')).filter(w=>w.length>=3);
  return[...base,...own];
}
function ruleKey(t){return nz(t).replace(/[\d.,#*\/\-_]+/g,' ').replace(/\s+/g,' ').trim()}
function categorize(title,catText){
  const spend=S.sections.filter(s=>s.kind!=='save');
  const rk=ruleKey(title);
  if(rk){for(const k in S.rules){if(k===rk||(k.length>=4&&rk.includes(k))){const s=spend.find(x=>x.id===S.rules[k]);if(s)return{sec:s.id,conf:'rule'}}}}
  const ct=nz(catText);
  if(ct){const s=spend.find(x=>nz(x.name)===ct||nz(x.name).includes(ct)||ct.includes(nz(x.name)));if(s)return{sec:s.id,conf:'high'}}
  const txt=nz(title+' '+catText);
  let best=null,bl=0;
  spend.forEach(s=>{secKeywords(s).forEach(w=>{const k=nz(w);if(k&&txt.includes(k)&&k.length>bl){bl=k.length;best=s.id}})});
  if(best)return{sec:best,conf:'high'};
  const fb=spend.find(x=>x.id==='living')||spend[0];
  return{sec:fb?fb.id:null,conf:'none'};
}
function buildRows(M,hr,map,defKey){
  const data=M.slice(hr+1),rows=[];
  const hasNeg=map.amount>=0&&data.some(r=>{const n=toNum(r[map.amount]&&r[map.amount].v);return n!=null&&n<0});
  const hasPos=map.amount>=0&&data.some(r=>{const n=toNum(r[map.amount]&&r[map.amount].v);return n!=null&&n>0});
  const signed=hasNeg&&hasPos;
  data.forEach((r,idx)=>{
    const g=i=>(i>=0&&r[i])?r[i]:{v:null,date:null};
    const dcell=g(map.date);let date=dcell.date||strDate(dcell.v);
    const title=map.desc>=0&&g(map.desc).v!=null?String(g(map.desc).v).trim():'';
    const cat=map.category>=0&&g(map.category).v!=null?String(g(map.category).v).trim():'';
    const typ=map.type>=0?nz(g(map.type).v):'';
    const nt=nz(title);
    if(!date&&/^(الاجمالي|المجموع|total|الرصيد|balance)/.test(nt))return;
    let amt=null,kind='expense';
    if(map.debit>=0||map.credit>=0){
      const d=toNum(g(map.debit).v),c2=toNum(g(map.credit).v);
      if(d&&Math.abs(d)>0){amt=Math.abs(d);kind='expense'}else if(c2&&Math.abs(c2)>0){amt=Math.abs(c2);kind='income'}
    }else if(map.amount>=0){
      const n=toNum(g(map.amount).v);if(n==null||n===0)return;
      amt=Math.abs(n);
      if(typ&&hasW(typ,INCOME_W)&&!hasW(typ,EXPENSE_W))kind='income';
      else if(typ&&hasW(typ,EXPENSE_W))kind='expense';
      else if(signed)kind=n>0?'income':'expense';
      else if(hasW(nt,SALARY_W)&&!hasW(nt,['خصم','سلفه']))kind='income';
    }
    if(!amt)return;
    if(!date&&!title&&!amt)return;
    const row={id:uid(),include:true,date,title:title||cat||'بدون وصف',amount:amt,kind,sec:null,conf:'none',act:'ignore',dup:false,manual:false};
    if(kind==='expense'){const cz=categorize(row.title,cat);row.sec=cz.sec;row.conf=cz.conf}
    rows.push(row);
  });
  // incomes: mark salary candidates
  const byM={};
  rows.filter(x=>x.kind==='income').forEach(x=>{const k=x.date?cycleKeyOf(x.date.y,x.date.m,x.date.d):defKey;(byM[k]=byM[k]||[]).push(x)});
  Object.values(byM).forEach(list=>{
    const sal=list.filter(x=>hasW(nz(x.title),SALARY_W));
    const pick=sal.length?sal:[list.slice().sort((a,b)=>b.amount-a.amount)[0]];
    pick.forEach(x=>x.act='salary');
    list.forEach(x=>{if(x.act!=='salary'){x.act='extra';x.include=false}});
  });
  // rows that match a fixed commitment (already deducted)
  rows.forEach(x=>{
    if(x.kind!=='expense')return;
    const k=x.date?cycleKeyOf(x.date.y,x.date.m,x.date.d):defKey,m=S.months[k]||S.months[nowKey()],fx=(m&&m.fixed)||[];
    if(fx.some(f=>Math.abs(f.amount-x.amount)<=1)){x.fixed=true;x.include=false}
  });
  // duplicates vs existing
  rows.forEach(x=>{
    if(x.kind!=='expense'||x.fixed)return;
    const k=x.date?cycleKeyOf(x.date.y,x.date.m,x.date.d):defKey,m=S.months[k];if(!m)return;
    const ds=x.date?x.date.y+'-'+pad(x.date.m)+'-'+pad(x.date.d):null;
    if(m.entries.some(e=>e.amount===Math.round(x.amount)&&nz(e.title)===nz(x.title)&&(!ds||e.date===ds))){x.dup=true;x.include=false}
  });
  return rows;
}
function rowKey(x){return x.date?cycleKeyOf(x.date.y,x.date.m,x.date.d):UI.month}
function analyzeSheet(idx){
  const name=WB.SheetNames[idx],M=sheetMatrix(WB.Sheets[name]);
  if(!M.length){UI.imp={file:UI.imp.file,sheets:WB.SheetNames,sheet:idx,empty:true};return}
  const hr=findHeader(M),{names,map}=detectMapping(M,hr);
  UI.imp={file:UI.imp.file,sheets:WB.SheetNames,sheet:idx,M,hr,names,map,wipe:S.demo,rows:buildRows(M,hr,map,UI.month)};
}
function remap(){const I=UI.imp;I.rows=buildRows(I.M,I.hr,I.map,UI.month);render()}
function impSummary(I){
  const R=I.rows,ex=R.filter(r=>r.kind==='expense'),inc=R.filter(r=>r.kind==='income');
  const months=[...new Set(R.map(rowKey))].sort(),inc2=ex.filter(r=>r.include);
  const bySec={};inc2.forEach(r=>bySec[r.sec]=(bySec[r.sec]||0)+r.amount);
  let top=null,tv=0;for(const k in bySec)if(bySec[k]>tv){tv=bySec[k];top=k}
  return{n:R.length,ex:ex.length,inc:inc.length,total:inc2.reduce((a,r)=>a+r.amount,0),months,uncertain:inc2.filter(r=>r.conf==='none').length,dups:R.filter(r=>r.dup).length,top:top?S.sections.find(s=>s.id===top):null,topV:tv,add:inc2.length};
}
const ROLE_LBL={date:'التاريخ',desc:'البيان / الوصف',amount:'المبلغ',debit:'مدين (صرف)',credit:'دائن (دخل)',category:'الفئة',type:'نوع العملية'};
function viewImport(){
  const I=UI.imp;
  if(!I)return `<div class="page-h"><div><span class="eyebrow">ملفات xlsx و xls و csv</span><h1>استيراد من Excel</h1></div></div>
   <div class="drop" id="drop"><div class="ic">${ic('upload')}</div><h2>اسحب الملف إلى هنا</h2><p class="muted" style="margin-bottom:18px">كشف حساب بنكي أو جدول مصروفات، بالعربية أو الإنجليزية.</p><button class="btn" data-act="pick-file">${ic('file')}اختر ملف</button></div>
   <div class="how"><div><b>التعرّف على الأعمدة</b>يحدد التاريخ والمبلغ والوصف تلقائياً، ويميّز الدخل من المصروف.</div><div><b>التصنيف التلقائي</b>يوزّع كل عملية على القسم المناسب، ويتعلّم من تصحيحاتك.</div><div><b>مراجعة قبل الحفظ</b>تراجع كل سطر وتعدّله قبل الاعتماد، ويُستبعد المكرر.</div></div>`;
  if(I.restore){const st=I.restore,n=Object.keys(st.months).length,e=Object.values(st.months).reduce((a,m)=>a+m.entries.length,0);
    return `<div class="page-h"><div><span class="eyebrow">${esc(I.file)}</span><h1>استرجاع نسخة احتياطية</h1></div></div>
    <section class="card notice"><div class="notice-i">${ic('download')}</div><div style="flex:1"><b>هذا الملف نسخة احتياطية من ترتيب</b><p class="small">فيه ${n} ${plural(n,'شهر','أشهر','شهر')} و${e} عملية. الاسترجاع يستبدل بياناتك الحالية بالكامل.</p></div>
    <button class="btn ${UI.confirm==='restore'?'danger':''}" data-act="restore-go">${UI.confirm==='restore'?'تأكيد الاستبدال':'استرجاع'}</button><button class="btn ghost" data-act="imp-cancel">إلغاء</button></section>`}
  if(I.empty)return `<div class="card empty"><h3>الورقة فاضية</h3><p>ما لقيت بيانات في هذي الورقة.</p><p style="margin-top:12px"><button class="btn" data-act="imp-cancel">رجوع</button></p></div>`;
  const sm=impSummary(I),spend=S.sections.filter(s=>s.kind!=='save');
  const colOpts=sel=>`<option value="-1">— غير موجود —</option>`+I.names.map((n,i)=>`<option value="${i}" ${sel===i?'selected':''}>${esc(n)}</option>`).join('');
  return `<div class="page-h"><div><span class="eyebrow">${esc(I.file)}</span><h1>مراجعة الاستيراد</h1></div><button class="btn ghost sm" data-act="imp-cancel">ملف ثاني</button></div>
  <section class="sum">
    <div class="card"><span class="eyebrow">صفوف مقروءة</span><span class="num">${sm.n}</span></div>
    <div class="card"><span class="eyebrow">مصروفات</span><span class="num">${sm.ex}</span></div>
    <div class="card"><span class="eyebrow">مبالغ دخل</span><span class="num">${sm.inc}</span></div>
    <div class="card"><span class="eyebrow">الأشهر</span><span class="num" style="font-size:16px;line-height:2">${sm.months.map(monthName).join('، ')||'—'}</span></div>
    <div class="card"><span class="eyebrow">إجمالي المصروف المحدد</span><span class="num">${money(sm.total)}</span></div>
    ${sm.top?`<div class="card"><span class="eyebrow">أكثر قسم صرفاً</span><b style="color:${sm.top.color}">${esc(sm.top.name)}</b></div>`:''}
  </section>
  ${I.sheets.length>1?`<div class="field" style="max-width:260px;margin-top:14px"><span>الورقة</span><select class="inp" data-imp="sheet">${I.sheets.map((s,i)=>`<option value="${i}" ${i===I.sheet?'selected':''}>${esc(s)}</option>`).join('')}</select></div>`:''}
  <div class="sec-title"><h2>الأعمدة المكتشفة</h2><span class="small">يمكنك تصحيح أي عمود</span></div>
  <div class="map">${Object.keys(ROLE_LBL).map(r=>`<div class="field"><span>${ROLE_LBL[r]}</span><select class="inp" data-imp="map" data-role="${r}">${colOpts(I.map[r])}</select></div>`).join('')}</div>
  <div class="sec-title"><h2>المعاينة</h2><span class="pill ${sm.uncertain?'warn':'good'}">${sm.uncertain?sm.uncertain+' تحتاج مراجعة':'كل التصنيفات واضحة'}</span></div>
  <div class="tblwrap"><table><thead><tr><th style="width:40px"></th><th>التاريخ</th><th>البيان</th><th>المبلغ</th><th>القسم</th><th>الثقة</th></tr></thead><tbody>
   ${I.rows.slice(0,500).map(r=>importRow(r,spend)).join('')}</tbody></table></div>
  ${I.rows.length>500?`<p class="muted" style="margin-top:8px;font-size:13px">عرضت أول 500 سطر من ${I.rows.length}.</p>`:''}
  <div class="importbar"><div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
    <span><b class="num">${sm.add}</b> عملية جاهزة للإضافة${sm.dups?` · ${sm.dups} مكررة تم استبعادها`:''}</span>
    ${S.demo?`<label style="display:flex;gap:8px;align-items:center;font-size:13.5px"><input type="checkbox" data-imp="wipe" ${I.wipe?'checked':''}>امسح البيانات التجريبية</label>`:''}</div>
    <button class="btn" data-act="imp-commit" ${sm.add||I.rows.some(r=>r.kind==='income'&&r.include)?'':'disabled'}>${ic('check')}اعتماد وإضافة</button></div>`;
}
function importRow(r,spend){
  const ds=r.date?`${r.date.d} ${MONTHS[r.date.m-1]}${r.date.y!==parseKey(UI.month).y?' '+r.date.y:''}`:'—';
  if(r.kind==='income'){
    return `<tr class="${r.include?'':'off'}"><td><input type="checkbox" data-imp="inc" data-id="${r.id}" ${r.include?'checked':''} aria-label="تضمين"></td><td>${ds}</td><td><div class="t">${esc(r.title)}</div></td><td class="plus">${money(r.amount,{plus:true})}</td>
    <td><select class="inp" data-imp="act" data-id="${r.id}" aria-label="نوع الدخل"><option value="salary" ${r.act==='salary'?'selected':''}>راتب ${monthName(rowKey(r))}</option><option value="extra" ${r.act==='extra'?'selected':''}>دخل إضافي (للمدخرات)</option></select></td><td><span class="pill good">دخل</span></td></tr>`;
  }
  const cf=r.fixed?['التزام ثابت (مخصوم)','']:r.dup?['مكرر','']:r.conf==='rule'?['من تعديلك','good']:r.conf==='high'?['واضح','good']:['راجعه','warn'];
  return `<tr class="${r.include?'':'off'}"><td><input type="checkbox" data-imp="inc" data-id="${r.id}" ${r.include?'checked':''} aria-label="تضمين"></td><td>${ds}</td><td><div class="t">${esc(r.title)}</div></td><td>${money(r.amount)}</td>
   <td><select class="inp" data-imp="sec" data-id="${r.id}" aria-label="القسم">${spend.map(s=>`<option value="${s.id}" ${r.sec===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select></td><td><span class="pill ${cf[1]}">${cf[0]}</span></td></tr>`;
}
function readFile(file){
  const rd=new FileReader();
  rd.onerror=()=>toast('ما قدرت أقرأ الملف','bad');
  rd.onload=()=>{
    if(typeof XLSX==='undefined'){toast('مكتبة Excel ما تحمّلت. تأكد من الاتصال وجرب مرة ثانية.','bad',4500);return}
    try{
      WB=XLSX.read(new Uint8Array(rd.result),{type:'array',cellNF:true});
      if(WB.SheetNames.includes('tarteeb_backup')){const st=readBackup(WB);if(st){UI.imp={file:file.name,restore:st};UI.view='import';history.replaceState(null,'','#import');render();return}}
      UI.imp={file:file.name};analyzeSheet(0);
      UI.view='import';history.replaceState(null,'','#import');render();window.scrollTo({top:0});
      if(!UI.imp.empty)toast(`قرأت ${UI.imp.rows.length} صف وصنّفتها. راجع المعاينة.`,'good');
    }catch(e){console.error(e);toast('الملف غير مدعوم أو تالف','bad')}
  };
  rd.readAsArrayBuffer(file);
}
function commitImport(){
  const I=UI.imp;if(!I)return;
  if(S.demo&&I.wipe){S=blank()}else if(S.demo){S.demo=false}
  const touched=new Set();let added=0;
  const sal={};
  I.rows.forEach(r=>{if(r.kind==='income'&&r.include&&r.act==='salary'){const k=rowKey(r);sal[k]=(sal[k]||0)+r.amount}});
  Object.keys(sal).forEach(k=>{ensureMonth(k).salary=Math.round(sal[k]);touched.add(k)});
  I.rows.forEach(r=>{if(r.kind==='income'&&r.include&&r.act==='extra'){const k=rowKey(r),m=ensureMonth(k);(m.extras=m.extras||[]).push({id:uid(),title:r.title.slice(0,40),amount:Math.round(r.amount),dest:'save'});touched.add(k)}});
  I.rows.forEach(r=>{
    if(r.kind!=='expense'||!r.include||!r.sec)return;
    const k=rowKey(r),m=ensureMonth(k),d=r.date?r.date.y+'-'+pad(r.date.m)+'-'+pad(r.date.d):isoOf(cycleStart(k));
    m.entries.push({id:uid(),sec:r.sec,title:r.title.slice(0,80),amount:Math.round(r.amount*100)/100,date:d});added++;touched.add(k);if(m.assumed)m.assumed=false;
    if(r.manual){const rk=ruleKey(r.title);if(rk.length>=3)S.rules[rk]=r.sec}
  });
  const ks=[...touched].sort();
  if(ks.length)UI.month=ks[ks.length-1];
  afterLoad();UI.gaps=null;
  ks.forEach(k=>{if(k<nowKey()&&S.months[k])S.months[k].reviewed=true});
  UI.imp=null;WB=null;UI.view='home';UI.animate=true;history.replaceState(null,'','#home');
  save();checkBadges(true);render();celebrate(.8);
  toast(`تمت إضافة ${added} عملية${ks.length?' على '+ks.length+' '+(ks.length>2?'أشهر':'شهر'):''}`,'good',4200);
}

