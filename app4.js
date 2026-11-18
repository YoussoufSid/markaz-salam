/* ===== app4: centre data import, timetable, weekly follow-up form, student status actions ===== */
let SEED=null;
const TT_DEF={"days": ["الإثنين", "الثلاثاء"], "slots": ["18h40 à 19h20", "19h20 à 20h00", "20h00 à 20h40", "20h40 à 21h30"], "levels": [{"n": "المستوى (1)", "c": [["التربية الإسلامية: التوحيد والفقه / Éducation islamique", "القراءة والكتابة / Lecture - Écriture"], ["القراءة والكتابة / Lecture - Écriture", "المحادثة / Conversation"], ["الحساب / Maths", "الحساب / Maths"], ["المحادثة / Conversation", "التربية الإسلامية / Éducation islamique"]]}, {"n": "المستوى (2)", "c": [["القراءة والكتابة / Lecture - Écriture", "التربية الإسلامية 1: التوحيد والفقه / Éducation islamique"], ["المحادثة / Conversation", "القراءة والكتابة / Lecture - Écriture"], ["التربية الإسلامية 2: الحديث والسيرة / Éducation islamique", "الحساب / Maths"], ["", "المحادثة / Conversation"]]}, {"n": "المستوى (3)", "c": [["القراءة والكتابة / Lecture - Écriture", "التوحيد"], ["التربية الإسلامية 1: التوحيد والفقه / Éducation islamique", "التربية الإسلامية 2: الحديث والسيرة / Éducation islamique"], ["الحساب / Maths", "الفقه"], ["المحادثة / Conversation", "القراءة والكتابة / Lecture - Écriture"]]}, {"n": "المستوى (4)", "c": [["القراءة والكتابة / Lecture - Écriture", "المحادثة / Conversation"], ["التربية الإسلامية: التوحيد والفقه / Éducation islamique", "التربية الإسلامية: الحديث والسيرة / Éducation islamique"], ["الحساب / Maths", "القواعد (النحو والصرف) / Grammaire - Morphologie"], ["المحادثة / Conversation | التجويد", "القراءة والكتابة / Lecture - Écriture"]]}, {"n": "المستوى (5)", "c": [["القراءة والكتابة / Lecture - Écriture", "المحادثة / Conversation"], ["التربية الإسلامية: التوحيد والفقه / Éducation islamique", "التربية الإسلامية: الحديث والسيرة / Éducation islamique"], ["الحساب / Maths", "القواعد (النحو والصرف) / Grammaire - Morphologie"], ["المحادثة / Conversation | التجويد", "القراءة والكتابة / Lecture - Écriture"]]}, {"n": "المستوى (6)", "c": [["القراءة والكتابة / Lecture - Écriture", "المحادثة / Conversation"], ["التربية الإسلامية: التوحيد والفقه / Éducation islamique", "التربية الإسلامية: الحديث والسيرة / Éducation islamique"], ["الحساب / Maths", "القواعد (النحو والصرف) / Grammaire - Morphologie"], ["الإنشاء | التجويد", "القراءة والكتابة / Lecture - Écriture"]]}]};

const qT=(s,f,e,t)=>{if(!s)return "";if(/^الجزء/.test(s))return s;const a=s+(f?" "+f:"");if(e&&e!==s)return a+" – "+e+(t?" "+t:"");return a+(t&&t!==f?"–"+t:"")};
/* ---------- one-time import of the centre's existing lists (boys section) ---------- */
async function loadXLSX(){if(window.XLSX)return;await new Promise((ok,no)=>{const s=document.createElement("script");s.src="xlsx.mini.min.js";s.onload=ok;s.onerror=no;document.head.appendChild(s)})}
const nzA=x=>String(x||"").replace(/[ً-ْـ]/g,"").replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").replace(/ى/g,"ي").replace(/ئ/g,"ي").replace(/ؤ/g,"و").replace(/\s+/g,"").replace(/^ال/,"");
const SFIX={"الحافة":"الحاقة","الجمن":"الجن","عم":"النبأ","ملك":"الملك","الغافر":"غافر","الإنشقاق":"الانشقاق"};
function surNorm(v){v=String(v==null?"":v).trim();if(!v)return "";v=SFIX[v]||v;const k=nzA(v),s=SURAH.find(x=>nzA(x.n)===k);return s?s.n:v}
const numS=v=>v==null||v===""?"":String(typeof v==="number"&&Number.isInteger(v)?v:v).trim();
const grS=v=>{v=String(v==null?"":v).trim();return v==="جيد جدا"?"جيد جدًا":v};
function parseSheetRows(rows){
  const H=[],subj=[];let cur=null,insub=false,sec="";
  for(const r of rows){const c=r.map(x=>x==null?"":String(x).trim()),j=c.join(" ");
    if(/قسم البنات|Les filles/i.test(j))sec="g";else if(!sec&&/قسم البنين|Les garçons/i.test(j))sec="b";
    const hc=c.find(x=>x.includes("حلقة"));
    if(hc){const tc=c.find(x=>x.includes("الشيخ"))||"";cur={name:hc.replace("حلقة","").replace(/\s+/g," ").trim(),teacher:(tc.split("/").pop()||"").trim(),st:[]};H.push(cur);insub=false;continue}
    if(j.includes("المواد المدروسة")){insub=true;continue}
    if(insub){const v=c.find(x=>x&&x!=="العربية والفرنسية");if(v)subj.push(v);continue}
    if(cur&&typeof r[0]==="number"&&c[1]){const s={n:c[1].replace(/\s+/g," "),amt:numS(r[2]),hs:surNorm(r[3]),hf:numS(r[4]),he:surNorm(r[5]),ht:numS(r[6]),hg:grS(r[7]),rs:surNorm(r[8]),rf:numS(r[9]),re:surNorm(r[10]),rt:numS(r[11]),rg:grS(r[12]),note:c[13]||""};
      Object.keys(s).forEach(k=>{if(!s[k])delete s[k]});cur.st.push(s)}}
  return {type:"markaz-salam-seed",h:H.filter(h=>h.st.length),subj,sec:sec||"b"};
}
async function seedLoad(){const f=$("#sdF")&&$("#sdF").files[0];if(!f){toast("اختر الملف أولًا");return}
  try{let o;
    if(/\.json$/i.test(f.name)||f.type.includes("json")){o=JSON.parse(await f.text());if(o.type==="markaz-salam-fr"&&Array.isArray(o.st)){SEED=o;closeModal();frOffer();return}if(o.type!=="markaz-salam-seed"||!Array.isArray(o.h))throw 0}
    else{toast("جارٍ قراءة ملف Excel…");await loadXLSX();const wb=XLSX.read(await f.arrayBuffer(),{type:"array"});const rows=[];wb.SheetNames.forEach(n=>rows.push(...XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,defval:null,raw:true})));o=parseSheetRows(rows);if(!o.h.length)throw 0}
    SEED=o;closeModal();seedOffer()}catch(e){toast("لم أتعرّف على الملف: اختر استمارة المتابعة (Excel) أو ملف البيانات")}}
function frOffer(){if(!can.write())return;const by={};SEED.st.forEach(r=>by[r.c]=(by[r.c]||0)+1);
  modal("📥 توزيع صفوف الفرنسية",`<p>وُجد <b>${SEED.st.length}</b> طالبًا موزَّعين على الصفوف:</p><ul style="line-height:2">${Object.entries(by).map(([c,n])=>`<li>${esc(c)}: <b>${n}</b></li>`).join("")}</ul><div class="fld"><label>القسم</label><select id="sdSec"><option value="b" ${SEED.sec==="b"?"selected":""}>قسم البنين</option><option value="g" ${SEED.sec!=="b"?"selected":""}>قسم البنات</option></select></div><p class="note">من كان مسجَّلًا (بالعربية أو بالفرنسية) يُحدَّث صفُّه في الفرنسية ويُكتب اسمه الفرنسي، ومن لم يوجد يُضاف طالبًا جديدًا.</p>`,
   `<button class="btn p" onclick="frRun()">اعتماد التوزيع</button><button class="btn o" onclick="closeModal()">إلغاء</button>`)}
async function frRun(){const SX=($("#sdSec")&&$("#sdSec").value)||"g";closeModal();const oldSec=SEC;SEC=SX;document.body.dataset.sec=SX;window.__bulk=1;let nS=0,nU=0;const used=new Set();
  try{const k=x=>normName(x||"").toLowerCase();
    for(const r of SEED.st){const cand=[...(r.ar||[]),r.n].map(k);
      let s=null;for(const c of cand){s=RAW.people.find(p=>p.cat==="students"&&secOf(p,"people")===SX&&!used.has(p.id)&&(k(p.name)===c||k(p.nameFr)===c));if(s)break}
      if(s){used.add(s.id);const ar0=(r.ar||[])[0],lat=ar0&&k(s.name)===k(r.n);await put("people",{...s,...(lat?{name:ar0}:{}),frClass:r.c,nameFr:s.nameFr||r.n});nU++}
      else{const n={id:uid("p"),cat:"students",name:r.n,nameFr:r.n,gender:SX==="g"?"أنثى":"ذكر",status:"نشط",frClass:r.c,regNo:nextReg("students"),start:today(),sec:SX};used.add(n.id);await put("people",n);nS++}}
    toast(`✓ تم: ${nU} طالبًا حُدِّث صفُّه في الفرنسية، ${nS} طالبًا جديدًا`);SEED=null}catch(e){saveErr(e)}finally{window.__bulk=0;SEC=oldSec;document.body.dataset.sec=SEC;render()}}
/* ---------- توزيع الصفوف (قابل للإضافة والتعديل والحذف) ---------- */
const clsKey=()=>(view.cd||"fr")==="ar"?"arClass":"frClass";
function vClasses(){const key=clsKey(),w=can.write(),st=activeStudents().sort(byName),dn=(view.cd||"fr")==="ar"?"العربية والتربية الإسلامية":"الفرنسية والمواد العصرية";
  const grp=(c,t)=>{const l=st.filter(s=>(s[key]||"")===c);
    return `<div class="panel" style="margin:0"><h3 style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span>${esc(t)} <small style="color:var(--m)">(${l.length})</small></span>${w&&c?`<button class="btn p s" onclick="clsAdd('${c}')">＋ إضافة</button>`:""}</h3>
    ${l.length?l.map((s,i)=>`<div class="row" style="gap:6px"><span style="width:22px;color:var(--m)">${i+1}</span><div class="grow" onclick="openDetail('${s.id}')" style="cursor:pointer">${pn(s)}</div>${w?`<select style="max-width:96px" onchange="clsMove('${s.id}',this.value)"><option value="">نقل…</option>${CLASSES.filter(x=>x!==c).map(x=>`<option value="${x}">${esc(x.replace("الصف ","").replace(" الابتدائي"," ابتدائي").replace(" الإعدادي"," إعدادي"))}</option>`).join("")}</select><button class="btn o s" title="تعديل" onclick="openForm('students','${s.id}')">✏️</button><button class="btn o s" title="إخراج من الصف" onclick="clsMove('${s.id}','')">✕</button>`:""}</div>`).join(""):`<div class="note">لا يوجد طلاب</div>`}</div>`};
  const none=st.filter(s=>!s[key]);
  return `<div class="sec-title"><h2>👥 توزيع الصفوف — ${dn}</h2></div>
  <div class="subtabs"><button class="${(view.cd||"fr")==="fr"?"on":""}" onclick="view.cd='fr';render()">الفرنسية والمواد العصرية</button><button class="${view.cd==="ar"?"on":""}" onclick="view.cd='ar';render()">العربية والتربية الإسلامية</button></div>
  <p class="note">إجمالي الطلاب: <b>${st.length}</b> — الموزَّعون: <b>${st.length-none.length}</b> — بلا صف: <b>${none.length}</b>. اضغط على الاسم لفتح الملف. ولكل طالب: نقل إلى صف آخر، تعديل (الاسم بالعربية والفرنسية)، أو إخراج من الصف.</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:10px">${CLASSES.map(c=>grp(c,c)).join("")}</div>
  ${none.length?`<div style="margin-top:10px">${grp("","بلا صف")}</div>`:""}`}
async function clsMove(id,c){const s=byName_(id);if(!s)return;try{await put("people",{...s,[clsKey()]:c});toast(c?"✓ تم النقل":"✓ أُخرج من الصف");render()}catch(e){saveErr(e)}}
const byName_=id=>RAW.people.find(p=>p.id===id);
function clsAdd(c){const key=clsKey(),cand=activeStudents().filter(s=>(s[key]||"")!==c).sort(byName);
  modal("＋ إضافة إلى "+c,`<div class="fld"><label>طالب مسجَّل</label><select id="caS"><option value="">— اختر —</option>${cand.map(s=>`<option value="${s.id}">${esc(pnT(s))}${s[key]?" — ("+esc(s[key].replace("الصف ",""))+")":""}</option>`).join("")}</select></div>
  <p class="note" style="text-align:center">أو أضف طالبًا جديدًا:</p><div class="grid"><div class="fld"><label>الاسم بالعربية</label><input id="caA"></div><div class="fld"><label>الاسم بالفرنسية — Nom en français</label><input id="caF" dir="ltr"></div></div>`,
  `<button class="btn p" onclick="clsAddSave('${c}')">حفظ</button><button class="btn o" onclick="closeModal()">إلغاء</button>`)}
async function clsAddSave(c){const key=clsKey(),id=$("#caS").value,a=$("#caA").value.trim(),f=$("#caF").value.trim();
  try{if(id){const s=byName_(id);await put("people",{...s,[key]:c})}
    else if(a||f){await put("people",{id:uid("p"),cat:"students",name:a||f,nameFr:f,gender:SEC==="g"?"أنثى":"ذكر",status:"نشط",[key]:c,regNo:nextReg("students"),start:today(),sec:SEC})}
    else{toast("اختر طالبًا أو اكتب اسمًا");return}
    closeModal();toast("✓ تمت الإضافة");render()}catch(e){saveErr(e)}}
function seedCount(){return SEED.h.reduce((a,h)=>a+h.st.length,0)}
function seedOffer(){
  if(!can.write())return;
  if(!SEED){modal("📥 استيراد من Excel",`<p>اختر <b>استمارة متابعة الدروس الأسبوعية</b> (ملف Excel بالشكل المعتاد)، أو ملف البيانات <b>markaz-salam-data.json</b>.</p><p class="note">يُضاف الطلاب الجدد تلقائيًا، وتُسجَّل مواضع الحفظ والمراجعة في المتابعة. ولا يتكرر أي اسم موجود.</p><p class="note">البيانات تبقى على هذا الجهاز فقط، ولا تُنشر على الإنترنت.</p><input type="file" id="sdF" accept="*/*">`,`<button class="btn p" onclick="seedLoad()">متابعة</button><button class="btn o" onclick="lsSet('salam_seed1','later');closeModal()">لاحقًا</button>`);return}
  modal("📥 استيراد بيانات المركز",`<p>وُجد في الملف:</p>
   <ul style="line-height:2">${SEED.h.map(h=>`<li><b>حلقة ${esc(h.name)}</b> — الشيخ ${esc(h.teacher)} — ${h.st.length} طالبًا</li>`).join("")}</ul>
   <p>المجموع: <b>${SEED.h.length}</b> حلقات، <b>${seedCount()}</b> طالبًا.${SEED.subj.length?`<br>المواد: ${SEED.subj.map(esc).join("، ")}.`:""}</p>
   <div class="grid"><div class="fld"><label>القسم</label><select id="sdSec"><option value="b" ${(SEED.sec||"b")==="b"?"selected":""}>قسم البنين</option><option value="g" ${SEED.sec==="g"?"selected":""}>قسم البنات</option></select></div><div class="fld"><label>تاريخ المتابعة (نهاية الأسبوع)</label><input type="date" id="sdDt" value="${today()}"></div></div>
   <label style="display:flex;gap:10px;align-items:center;margin:8px 0;cursor:pointer"><input type="checkbox" style="width:20px;height:20px;flex:none" id="sdW" checked><span>تسجيل مواضع الحفظ والمراجعة والتقديرات في المتابعة بهذا التاريخ</span></label>
   <label style="display:flex;gap:10px;align-items:center;margin:8px 0;cursor:pointer"><input type="checkbox" style="width:20px;height:20px;flex:none" id="sdS" ${SEED.subj.length&&!center.subj_ar?"checked":""} ${SEED.subj.length?"":"disabled"}><span>اعتماد هذه المواد لقسم العربية والتربية الإسلامية</span></label>
   <p class="note">لن يُكرَّر أي اسم موجود مسبقًا. ويبقى بعد ذلك باب الإضافة والتعديل والفصل والانفصال والتخرج مفتوحًا كالمعتاد.</p>`,
   `<button class="btn p" onclick="seedRun()">استيراد الآن</button><button class="btn o" onclick="lsSet('salam_seed1','later');closeModal()">لاحقًا</button>`);
}
async function seedRun(){
  const withW=$("#sdW")&&$("#sdW").checked,withS=$("#sdS")&&$("#sdS").checked&&SEED.subj.length,SX=($("#sdSec")&&$("#sdSec").value)||"b",dt=($("#sdDt")&&$("#sdDt").value)||today();closeModal();
  const oldSec=SEC;SEC=SX;document.body.dataset.sec=SX;window.__bulk=1;let nT=0,nH=0,nS=0,nU=0;
  try{
    for(const h of SEED.h){
      let t=D.people.find(p=>p.cat==="teachers"&&p.name===h.teacher);
      if(!t){t={id:uid("p"),cat:"teachers",name:h.teacher,gender:SX==="g"?"أنثى":"ذكر",status:"نشط",job:"مدرس حلقة "+h.name,regNo:nextReg("teachers"),sec:SX};await put("people",t);nT++}
      let x=D.halaqat.find(q=>q.name===h.name);
      if(!x){x={id:uid("h"),name:h.name,teacherId:t.id,gender:SX==="g"?"بنات":"بنون",sec:SX};await put("halaqat",x);nH++}
      const rec={};
      for(const r of h.st){
        let s=D.people.find(p=>p.cat==="students"&&p.name===r.n&&p.halaqa===x.name);
        const hp=qT(r.hs,r.hf,r.he,r.ht),rp=qT(r.rs,r.rf,r.re,r.rt);
        if(s&&(hp||rp)){const u={...s};if(hp)u.hifzPos=hp;if(rp)u.revPos=rp;if(r.amt)u.dailyAmt=r.amt;await put("people",u);nU++}
        if(!s){s={id:uid("p"),cat:"students",name:r.n,gender:SX==="g"?"أنثى":"ذكر",status:"نشط",halaqa:x.name,dailyAmt:r.amt||"",hifzPos:hp,revPos:rp,regNo:nextReg("students"),start:dt,sec:SX};await put("people",s);nS++}
        if(withW&&(hp||rp||r.note)){const c={att:hp||rp?"ح":""};
          Object.entries({hs:r.hs,hf:r.hf,he:r.he,ht:r.ht,hg:r.hg,rs:r.rs,rf:r.rf,re:r.re,rt:r.rt,rg:r.rg,note:r.note}).forEach(([k,v])=>{if(v)c[k]=v});
          if(hp)c.hifz=hp;if(rp)c.rev=rp;if(!c.att)delete c.att;rec[s.id]=c}
      }
      if(withW&&Object.keys(rec).length){const id=x.id+"_"+dt,old=D.daily.find(d=>d.id===id);await put("daily",{id,halaqaId:x.id,halaqa:x.name,date:dt,rec:{...((old&&old.rec)||{}),...rec},sec:SX})}
    }
    const c={...center};if(withS)c.subj_ar=SEED.subj.map(n=>n+":1").join("، ");
    if(!c.tt_b)c.tt_b=TT_DEF;if(!c.tt_g)c.tt_g=TT_DEF;await saveCenter(c);
    lsSet("salam_seed1","done");
    toast(`✓ تم: ${nS} طالبًا جديدًا، ${nU} محدَّثًا، ${nH} حلقات جديدة، ${nT} مدرسين`);SEED=null;
  }catch(e){saveErr(e)}finally{window.__bulk=0;SEC=oldSec;document.body.dataset.sec=SEC;render()}
}
function seedAuto(){try{if(!can.write()||lsGet("salam_seed1","")||!$("#lock").classList.contains("hide"))return;if($("#ov")){setTimeout(seedAuto,4000);return}if(RAW.halaqat.some(h=>(h.sec||"b")==="b"))return;setTimeout(seedOffer,900)}catch(e){}}

/* ---------- student status: graduation / dismissal / withdrawal ---------- */
const STATUS_ACT=[["متخرج","🎓 تخرّج","g"],["منفصل","🚪 انفصال (انسحاب)","w"],["مفصول","⛔ فصل","r"],["متوقف","⏸ إيقاف مؤقت","w"],["نشط","✅ إعادة التفعيل","g"]];
function statusForm(id){
  const p=byId("people",id);if(!p)return;
  modal("تغيير حالة — "+esc(p.name),`<p>الحالة الحالية: <b>${esc(p.status||"نشط")}</b>${p.statusDate?` منذ ${esc(p.statusDate)}`:""}${p.statusReason?` — ${esc(p.statusReason)}`:""}</p>
   <div class="grid"><div class="fld"><label>الحالة الجديدة</label><select id="stN">${STATUS_ACT.filter(a=>a[0]!==(p.status||"نشط")).map(a=>`<option value="${a[0]}">${a[1]}</option>`).join("")}</select></div>
   <div class="fld"><label>التاريخ</label><input type="date" id="stD" value="${today()}"></div>
   <div class="fld full"><label>السبب / ملاحظة</label><input id="stR" placeholder="مثال: ختم القرآن الكريم، انتقال، قرار الإدارة…"></div></div>`,
   `<button class="btn p" onclick="statusSave('${id}')">حفظ</button><button class="btn o" onclick="closeModal()">إلغاء</button>`);
}
async function statusSave(id){
  const p=byId("people",id),n=$("#stN").value,d=$("#stD").value,r=$("#stR").value.trim();
  const hist=[...(p.statusLog||[]),{from:p.status||"نشط",to:n,date:d,reason:r}];
  try{await put("people",{...p,status:n,statusDate:d,statusReason:r,statusLog:hist});closeModal();toast("✓ الحالة الآن: "+n)}catch(e){saveErr(e)}
}

/* ---------- timetable (جدول توزيع الحصص) ---------- */
const ttGet=()=>JSON.parse(JSON.stringify(center["tt_"+SEC]||TT_DEF));
function ttCell(v){if(!v)return "";return v.split(/\s*\|\s*/).map(part=>{const [a,f]=part.split(/\s+\/\s+/);return `<div class="ttp"><b>${esc(a||"")}</b>${f?`<span dir="ltr">${esc(f)}</span>`:""}</div>`}).join("")}
function ttTable(tt,li){const L=tt.levels[li];if(!L)return "";
  return `<table class="tbl tt"><tr><th>المــدّة<br><small>La durée</small></th>${(L.days||tt.days).map(d=>`<th>${esc(d)}</th>`).join("")}<th>الملاحظة</th></tr>${(L.slots||tt.slots).map((s,i)=>`<tr><td class="c ttt" dir="ltr">${esc(s)}</td>${(L.days||tt.days).map((d,j)=>`<td>${ttCell(((L.c[i]||[])[j])||"")}</td>`).join("")}<td>${esc(((L.note||[])[i])||"")}</td></tr>`).join("")}</table>`}
function vTimes(){
  const tt=ttGet();view.lv=Math.min(view.lv||0,tt.levels.length-1);
  if(view.ttEdit&&can.write())return ttEditor();
  let h=`<div class="sec-title"><h2>🗓️ جدول توزيع الحصص</h2><div class="tools">${can.write()?`<button class="btn o" onclick="view.ttEdit=ttGet();render()">✏️ تعديل الجدول</button><button class="btn o" onclick="ttAddCM()">＋ جداول الفرنسية CP/CM</button>`:""}<button class="btn o" onclick="ttPrint(0)">🖨️ طباعة هذا المستوى</button><button class="btn p" onclick="ttPrint(1)">🖨️ طباعة كل المستويات</button></div></div>`;
  h+=`<div class="subtabs">${tt.levels.map((L,i)=>`<button class="${view.lv===i?"on":""}" onclick="view.lv=${i};render()">${esc(L.n)}</button>`).join("")}</div>`;
  return h+`<div class="panel fit">${ttTable(tt,view.lv)}</div><p class="note">لكل خانة: العربية ثم « / » ثم الفرنسية. ولحصتين في خانة واحدة افصل بينهما بـ « | ».</p>`;
}
function ttPrint(all){const tt=ttGet();const idx=all?tt.levels.map((_,i)=>i):[view.lv||0];
  printHTML(idx.map((i,k)=>`<div class="paper" style="${k?"page-break-before:always":""}">${paperHead("جدول توزيع الحصص — "+esc(tt.levels[i].n))}${ttTable(tt,i)}<div class="sign"><span>${sigDG()}</span><span>ختم المركز</span></div></div>`).join(""),true)}
function ttEditor(){
  const T=view.ttEdit,i=view.lv||0,L=T.levels[i];
  let h=`<div class="sec-title"><h2>✏️ تعديل جدول الحصص</h2></div><div class="subtabs">${T.levels.map((x,k)=>`<button class="${i===k?"on":""}" onclick="ttSync();view.lv=${k};render()">${esc(x.n)}</button>`).join("")}<button onclick="ttSync();view.ttEdit.levels.push({n:'المستوى ('+(view.ttEdit.levels.length+1)+')',c:[]});view.lv=view.ttEdit.levels.length-1;render()">＋ مستوى</button></div>
  <div class="panel"><div class="grid"><div class="fld"><label>اسم المستوى</label><input id="ttN" value="${esc(L.n)}"></div><div class="fld"><label>الأيام (افصل بفاصلة)</label><input id="ttD" value="${esc((L.days||T.days).join("، "))}" onchange="ttSync();{const dd=this.value.split(/[،,]/).map(x=>x.trim()).filter(Boolean),LL=view.ttEdit.levels[view.lv||0];if(LL.days)LL.days=dd;else view.ttEdit.days=dd}render()"></div></div>
  <div class="fit"><table class="tbl tte"><tr><th>المدة</th>${(L.days||T.days).map(d=>`<th>${esc(d)}</th>`).join("")}<th>ملاحظة</th><th></th></tr>${(L.slots||T.slots).map((s,r)=>`<tr><td><input data-s="${r}" value="${esc(s)}" dir="ltr"></td>${(L.days||T.days).map((d,c)=>`<td><textarea data-r="${r}" data-c="${c}" rows="2">${esc(((L.c[r]||[])[c])||"")}</textarea></td>`).join("")}<td><input data-n="${r}" value="${esc(((L.note||[])[r])||"")}"></td><td><button class="btn o s" onclick="ttSync();ttDelSlot(${r})">✕</button></td></tr>`).join("")}</table></div>
  <div class="tools"><button class="btn o s" onclick="ttSync();(view.ttEdit.levels[view.lv||0].slots||view.ttEdit.slots).push('');render()">＋ حصة</button>${T.levels.length>1?`<button class="btn o s" onclick="ttSync();view.ttEdit.levels.splice(${i},1);view.lv=0;render()">🗑️ حذف هذا المستوى</button>`:""}<span class="sp"></span><button class="btn o" onclick="view.ttEdit=null;render()">إلغاء</button><button class="btn p" onclick="ttSave()">💾 حفظ الجدول</button></div></div>`;
  return h;
}
function ttDelSlot(r){const T=view.ttEdit,L=T.levels[view.lv||0];if(L.slots){L.slots.splice(r,1);L.c.splice(r,1);L.note&&L.note.splice(r,1)}else{T.slots.splice(r,1);T.levels.forEach(l=>{if(!l.slots){l.c.splice(r,1);l.note&&l.note.splice(r,1)}})}render()}
const P="استراحة الصلاة / Pause prière";
const CP_TT=(()=>{const S=["18h30 à 19h00","19h00 à 19h30","19h30 à 19h50","19h50 à 20h30","20h30 à 20h45","20h45 à 21h15"],D=["الإثنين","الثلاثاء"],pp=[P,P];return [
 {n:"CP 1re–2e — الأسبوع 1",days:D,slots:S,c:[["Lecture / Écriture","Lecture / Écriture"],["Initiation à l’ortho","Initiation à l’ortho"],["Numération","Opération"],["Langage","Langage"],pp,["Écriture","Écriture"]]},
 {n:"CP 1re–2e — الأسبوع 2",days:D,slots:S,c:[["Lecture / Écriture","Contrôle d’I.O"],["I.O. (révision)","Contrôle de langage"],["Maths (révision)","Contrôle de maths"],["Langage (révision)","Lecture"],pp,["Écriture","Écriture"]]}]})();
const CM_TT=(()=>{const S1=["18h30 à 19h00","19h00 à 19h30","19h30 à 20h00","20h00 à 20h30","20h30 à 20h45","20h45 à 21h15"],S2=["18h30 à 19h00","19h00 à 19h30","19h30 à 20h00","20h00 à 20h30","20h30 à 20h45","20h45 à 21h00"],pp=[P,P];
 return [
 {n:"CM 5e–6e — الأسبوع 1 (أ)",days:["الإثنين","الثلاثاء"],slots:S1,c:[["Lecture","Rédaction"],["Maths (num)","Opération"],["Grammaire","Conjugaison"],["Exo Grammaire","Exo Conjugaison"],pp,["Exo Maths","Exo (Opération)"]]},
 {n:"CM 5e–6e — الأسبوع 2 (أ)",days:["الإثنين","الثلاثاء"],slots:S1,c:[["Dictée prépa","Contrôle de Lecture"],["Conjugaison","Contrôle de Gram/conj"],["Grammaire","Contrôle de Maths"],["Mesure","Dictée"],pp,["Lecture","Questions de dictée"]]},
 {n:"CM 5e–6e — الأسبوع 1 (ب)",days:["الإثنين","الثلاثاء"],slots:S2,c:[["Lecture","Élocution"],["Maths (num)","Opération"],["Grammaire","Conjugaison"],["Exo Grammaire","Exo Conjugaison"],pp,["Exo Maths","Mesure"]]},
 {n:"CM 5e–6e — الأسبوع 2 (ب)",days:["الإثنين","الثلاثاء"],slots:S2,c:[["Dictée prépa","Contrôle de Lecture"],["Conjugaison","Contrôle de Gram/conj"],["Grammaire","Contrôle de Gram/conj"],["Rédaction","Dictée – Quest."],pp,["Maths (REV.)","Contrôle de Maths"]]}]})();
async function ttAddCM(){const t=ttGet();if(t.levels.some(l=>l.n===CM_TT[0].n)){toast("جداول الفرنسية مضافة من قبل");return}
  t.levels.push(...JSON.parse(JSON.stringify([...CP_TT,...CM_TT])));try{await saveCenter({...center,["tt_"+SEC]:t});toast("✓ أُضيفت جداول الفرنسية (CP وCM)");render()}catch(e){saveErr(e)}}
function ttSync(){const T=view.ttEdit;if(!T)return;const L=T.levels[view.lv||0];const n=$("#ttN");if(n)L.n=n.value.trim()||L.n;
  document.querySelectorAll(".tte [data-s]").forEach(e=>(L.slots||T.slots)[+e.dataset.s]=e.value.trim());
  document.querySelectorAll(".tte [data-r]").forEach(e=>{const r=+e.dataset.r,c=+e.dataset.c;L.c[r]=L.c[r]||[];L.c[r][c]=e.value.trim()});
  document.querySelectorAll(".tte [data-n]").forEach(e=>{L.note=L.note||[];L.note[+e.dataset.n]=e.value.trim()})}
async function ttSave(){ttSync();try{await saveCenter({...center,["tt_"+SEC]:view.ttEdit});view.ttEdit=null;toast("✓ تم حفظ الجدول");render()}catch(e){saveErr(e)}}

/* ---------- weekly follow-up form (استمارة متابعة الدروس الأسبوعية) ---------- */
function weekStart(d){const x=new Date(d+"T12:00:00");const k=(x.getDay()+1)%7;x.setDate(x.getDate()-k);return x.toISOString().slice(0,10)}
function addDays(d,n){const x=new Date(d+"T12:00:00");x.setDate(x.getDate()+n);return x.toISOString().slice(0,10)}
function weeklyHTML(){
  const x=byId("halaqat",view.hid);if(!x)return `<div class="empty">لا توجد حلقات</div>`;
  const from=view.wk||weekStart(today()),to=addDays(from,6),t=byId("people",x.teacherId);
  const docs=D.daily.filter(d=>d.halaqaId===x.id&&d.date>=from&&d.date<=to).sort((a,b)=>a.date.localeCompare(b.date));
  const st=activeStudents().filter(s=>s.halaqa===x.name).sort(byName);
  const rows=st.map((s,i)=>{const R=docs.map(d=>d.rec&&d.rec[s.id]).filter(Boolean);
    const hf=R.find(r=>r.hs),hl=[...R].reverse().find(r=>r.hs),rf=R.find(r=>r.rs),rl=[...R].reverse().find(r=>r.rs);
    const g=k=>([...R].reverse().find(r=>r[k])||{})[k]||"",nt=R.map(r=>r.note).filter(Boolean).join(" ؛ ");
    return `<tr><td class="c">${i+1}</td><td>${pn(s)}</td><td class="c">${esc(s.dailyAmt||"")}</td><td>${esc(hf?hf.hs:"")}</td><td class="c">${esc(hf?hf.hf||"":"")}</td><td>${esc(hl?(hl.he||hl.hs):"")}</td><td class="c">${esc(hl?(hl.ht||hl.hf||""):"")}</td><td class="c">${esc(g("hg"))}</td><td>${esc(rf?rf.rs:"")}</td><td class="c">${esc(rf?rf.rf||"":"")}</td><td>${esc(rl?(rl.re||rl.rs):"")}</td><td class="c">${esc(rl?(rl.rt||rl.rf||""):"")}</td><td class="c">${esc(g("rg"))}</td><td>${esc(nt)}</td></tr>`}).join("");
  const sx=SEC==="g"?["قسم البنات","Les filles"]:["قسم البنين","Les garçons"];
  return `<div class="paper wk"><table class="wkh"><tr><td><b>${esc(center.name)} (${sx[0]})</b></td><td><img src="icon-192.png" alt=""></td><td dir="ltr" style="text-align:left"><b>${esc((frName().toUpperCase()).toUpperCase())} (${sx[1]})</b></td></tr></table>
  <table class="wkh2"><tr><td><b>استمارة متابعة الدروس الأسبوعية</b></td><td>حلقة <b>${esc(x.name)}</b></td><td>الشيخ / <b>${esc(t?t.name:"")}</b></td><td>التاريخ: من ${arDate(from)} إلى ${arDate(to)}</td></tr></table>
  <table class="tbl wkt"><tr><th rowspan="2">م</th><th rowspan="2">الاسم</th><th>مقدار اليومي</th><th colspan="2">بداية الحفظ</th><th colspan="2">نهاية الحفظ</th><th rowspan="2">التقدير</th><th colspan="2">بداية المراجعة</th><th colspan="2">نهاية المراجعة</th><th rowspan="2">التقدير</th><th rowspan="2">ملاحظة</th></tr>
  <tr><th>للحفظ</th><th>سورة</th><th>آية</th><th>سورة</th><th>آية</th><th>سورة</th><th>آية</th><th>سورة</th><th>آية</th></tr>${rows||`<tr><td colspan="14" class="c">لا يوجد طلاب في هذه الحلقة</td></tr>`}</table>
  <div class="sign"><span>توقيع الشيخ: ............</span><span>المراقب: ${esc(postName("sup"))}<br>............</span><span>${sigDG()}</span></div></div>`;
}

/* ---------- ملخص الأسبوع في الرئيسية ---------- */
function homeWeekly(){
  if(!D.halaqat.length)return "";
  const e=new Date(),b=new Date(e.getFullYear(),e.getMonth(),e.getDate()-6),f=d=>d.getFullYear()+"-"+pad2(d.getMonth()+1)+"-"+pad2(d.getDate());
  const from=f(b),to=f(e);
  const rows=D.halaqat.slice().sort((x,y)=>x.name.localeCompare(y.name,"ar")).map(x=>{
    const dl=D.daily.filter(d=>d.halaqaId===x.id&&d.date>=from&&d.date<=to);
    let pres=0,tot=0,hifz=0,rev=0;
    dl.forEach(d=>Object.values(d.rec||{}).forEach(r=>{if(r.att){tot++;if(r.att==="ح"||r.att==="ت")pres++}if(r.hifz||r.hf||r.he)hifz++;if(r.rev||r.rf||r.re)rev++}));
    const n=D.people.filter(p=>p.cat==="students"&&isAct(p)&&p.halaqa===x.name).length;
    return `<tr><td>${esc(x.name)}</td><td class="c">${n}</td><td class="c">${dl.length||"—"}</td><td class="c">${tot?Math.round(pres/tot*100)+"%":"—"}</td><td class="c">${hifz||"—"}</td><td class="c">${rev||"—"}</td></tr>`}).join("");
  return `<div class="panel"><h3>📅 ملخص الأسبوع (آخر 7 أيام)</h3><div class="scroll"><table class="tbl"><tr><th>الحلقة</th><th class="c">الطلاب</th><th class="c">أيام المتابعة</th><th class="c">الحضور</th><th class="c">مرات الحفظ</th><th class="c">مرات المراجعة</th></tr>${rows}</table></div></div>`;
}

/* ---------- طلبات الدخول: تقديم الطلب وقبوله ---------- */
var REQS=[],REQ_ME=null;
function signupToggle(on){signupInit();$("#sgf").classList.toggle("hide",!on);const lf=$("#login form");lf.classList.toggle("hide",!!on);$("#sgM").textContent=""}
async function doSignup(e){
  e.preventDefault();const f=new FormData(e.target),m=$("#sgM");m.textContent="";
  const name=String(f.get("name")||"").trim(),em=loginId(f.get("email")),pw=String(f.get("pass")||""),post=String(f.get("post")||"teacher"),code=String(f.get("code")||"").trim().toUpperCase();
  if(!code){m.textContent="رمز الدعوة مطلوب";return false}
  if(!name){m.textContent="الاسم مطلوب";return false}
  if(pw.length<8){m.textContent="كلمة المرور 8 أحرف على الأقل";return false}
  try{sessionStorage.setItem("salam_req",JSON.stringify({name,post,code}));await firebase.auth().createUserWithEmailAndPassword(em,pw)}
  catch(err){sessionStorage.removeItem("salam_req");m.textContent=err.code==="auth/email-already-in-use"?"هذا الرقم/البريد مسجَّل من قبل — ارجع وادخل بكلمة مرورك":err.code==="auth/weak-password"?"كلمة المرور ضعيفة":err.code==="auth/invalid-email"?"الرقم أو البريد غير صحيح":/network/.test(err.code||"")?"لا يوجد اتصال بالإنترنت":"تعذّر إرسال الطلب: "+(err.code||"")}
  return false;
}
function reqWatch(){
  if(window.__reqW||!FS||!ME)return;window.__reqW=1;
  try{const p=JSON.parse(sessionStorage.getItem("salam_req")||"null");
    if(p){sessionStorage.removeItem("salam_req");FS.doc("requests/"+ME).set({email:ME,name:p.name,post:p.post,code:p.code||"",status:"pending",ts:new Date().toISOString()}).catch(e=>{window.__reqErr=e.code;render()})}}catch(e){}
  FS.doc("requests/"+ME).onSnapshot(s=>{REQ_ME=s.exists?s.data():null;if(ROLE==="none")render()},()=>{});
}
function noneHTML(){
  const st=REQ_ME&&(REQ_ME.status||"pending");
  const out=`<br><br><button class="btn o" onclick="logout()">تسجيل الخروج</button>`;
  if(st==="pending")return `<div class="empty">⏳ طلب دخولك قيد المراجعة من إدارة المركز.<br>سيُفعَّل حسابك تلقائيًا بعد الموافقة — أبقِ التطبيق مفتوحًا أو ارجع إليه لاحقًا.${out}</div>`;
  if(st==="مرفوض")return `<div class="empty">تعذّر قبول طلبك. تواصل مع إدارة المركز.${out}</div>`;
  return `<div class="empty"><p>حسابك غير مخوّل بعد. أرسل طلب دخول لتراجعه الإدارة:</p>${window.__reqErr==="permission-denied"?`<p style="color:var(--red)">رمز الدعوة غير صحيح. اطلبه من مسؤول المركز.</p>`:""}<form id="nqf" class="grid" style="max-width:340px;margin:10px auto" onsubmit="return false"><div class="fld"><label>الاسم الكامل</label><input name="name"></div><div class="fld"><label>رمز الدعوة</label><input name="code" dir="ltr" autocomplete="off" style="text-transform:uppercase"></div><div class="fld"><label>المنصب المطلوب</label><select name="post">${POSTS.filter(p=>!["visitor","parent","founder"].includes(p[0])).map(([k,l])=>`<option value="${k}" ${k==="teacher"?"selected":""}>${l}</option>`).join("")}</select></div><button class="btn p" onclick="sendReqForm()">إرسال الطلب</button></form>${out}</div>`;
}
async function sendReqForm(){const f=readForm("nqf");if(!String(f.name||"").trim()){toast("اكتب اسمك");return}if(!String(f.code||"").trim()){toast("اكتب رمز الدعوة");return}try{await FS.doc("requests/"+ME).set({email:ME,name:f.name.trim(),post:f.post,code:String(f.code).trim().toUpperCase(),status:"pending",ts:new Date().toISOString()});window.__reqErr="";toast("أُرسل الطلب")}catch(e){window.__reqErr=e.code;if(e.code==="permission-denied"){render()}else saveErr(e)}}
function reqHTML(){
  const l=(REQS||[]).filter(r=>(r.status||"pending")==="pending");
  if(!l.length)return "";
  return `<div class="grp" style="margin-top:16px">🔔 طلبات الدخول (${l.length})</div><div class="list" style="margin:8px 0">${l.map(r=>`<div class="row"><div class="grow"><div class="nm">${esc(r.name||"")}</div><div class="mt"><span dir="ltr">${esc(showId(r.id))}</span> · يطلب: ${esc((POST[r.post]||{}).l||"")}</div></div><button class="btn p s" onclick="reqAccept('${esc(r.id)}')">قبول</button><button class="btn d s" onclick="reqReject('${esc(r.id)}')">رفض</button></div>`).join("")}</div>`;
}
function reqAccept(id){
  const r=REQS.find(x=>x.id===id);if(!r)return;
  modal("قبول طلب الدخول",`<form id="rqf" class="grid" onsubmit="return false"><div class="fld"><label>الاسم</label><input name="name" value="${esc(r.name||"")}"></div><div class="fld"><label>المنصب</label><select name="post" onchange="postFill(this.form)">${postOpts(r.post||"teacher")}</select><span class="note phint">الصلاحيات: ${RLV[(POST[r.post]||POST.teacher).r]}</span></div><div class="fld"><label>القسم</label><select name="usec"><option value="all">القسمان معًا</option><option value="b">قسم البنين فقط</option><option value="g">قسم البنات فقط</option></select></div></form><p class="note">انتبه: منصب «المؤسِّسة» و«المدير العام» يمنح كل الصلاحيات وإدارة المستخدمين.</p>`,`<button class="btn p" onclick="reqDo('${esc(id)}')">قبول وتفعيل الحساب</button><button class="btn o" onclick="closeModal()">إلغاء</button>`);
}
async function reqDo(id){
  const f=readForm("rqf"),role=(POST[f.post]||{}).r;if(!role){toast("اختر المنصب");return}
  try{const a=accFrom(id);a[ROLEARR[role]].push(id);a.sec[id]=f.usec||"all";a.posts[id]=f.post;a.names[id]=String(f.name||"").trim()||id;
    await FS.doc("settings/access").set(a);await FS.doc("requests/"+id).delete();closeModal();toast("✓ فُعِّل الحساب");setTimeout(openSettings,300)}catch(e){saveErr(e)}
}
async function reqReject(id){const r=REQS.find(x=>x.id===id);if(!r)return;try{const {id:_,...b}=r;await FS.doc("requests/"+id).set({...b,status:"مرفوض"});toast("رُفض الطلب");setTimeout(openSettings,300)}catch(e){saveErr(e)}}

/* ---------- رمز الدعوة وإعادة تعيين كلمة المرور (للمالك) ---------- */
var INVITE=null;
const genCode=()=>{const c="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let r="";const b=crypto.getRandomValues(new Uint8Array(6));b.forEach(x=>r+=c[x%c.length]);return r};
function inviteHTML(){
  if(ROLE!=="owner"||!FS)return "";
  if(INVITE===null)loadInvite();
  return `<div class="grp" style="margin-top:16px">🎟️ رمز الدعوة</div><div class="row"><div class="grow"><div class="nm" id="invCode" dir="ltr" style="font-family:monospace;font-size:20px;letter-spacing:3px">${esc(INVITE||"…")}</div><div class="mt">يُطلب مع «طلب حساب جديد». أعطِه لمن تريد انضمامه، وجدّده متى شئت.</div></div><button class="btn o s" onclick="newInvite()">تجديد</button></div>`;
}
async function loadInvite(){try{INVITE="";const d=await FS.doc("settings/invite").get();if(d.exists&&d.data().code)INVITE=d.data().code;else{INVITE=genCode();await FS.doc("settings/invite").set({code:INVITE})}const el=$("#invCode");if(el)el.textContent=INVITE}catch(e){INVITE=null}}
async function newInvite(){try{INVITE=genCode();await FS.doc("settings/invite").set({code:INVITE});const el=$("#invCode");if(el)el.textContent=INVITE;toast("✓ رمز جديد (الرمز القديم لم يعد يعمل)")}catch(e){saveErr(e)}}
function resetUserPass(em){
  if(!String(em).endsWith("@"+DOM)){
    modal("إعادة تعيين كلمة المرور",`<p>سيُرسَل رابط تغيير كلمة المرور إلى البريد:</p><p dir="ltr"><b>${esc(em)}</b></p>`,`<button class="btn p" onclick="sendReset('${esc(em)}')">إرسال الرابط</button><button class="btn o" onclick="closeModal()">إلغاء</button>`);return}
  modal("إعادة تعيين كلمة المرور",`<p>هذا الحساب مسجَّل برقم هاتف (لا بريد فعلي)، فلا يصله رابط. الطريقة:</p><ol style="line-height:1.9;padding-inline-start:20px"><li>افتح Firebase ← <b>Authentication ← Users</b>.</li><li>ابحث عن <b dir="ltr">${esc(em)}</b> ← ⋮ ← <b>Delete account</b>.</li><li>اكتب هنا كلمة المرور الجديدة واضغط الزر؛ تبقى صلاحياته كما هي.</li></ol><form id="rpf" class="grid" onsubmit="return false"><div class="fld"><label>كلمة المرور الجديدة (8 أحرف على الأقل)</label><input name="pass" type="text" dir="ltr" autocomplete="off"></div></form>`,`<button class="btn p" onclick="recreateAcc('${esc(em)}')">إنشاء الحساب بكلمة المرور الجديدة</button><button class="btn o" onclick="closeModal()">إغلاق</button>`);
}
async function sendReset(em){try{await firebase.auth().sendPasswordResetEmail(em);closeModal();toast("✓ أُرسل الرابط إلى "+em)}catch(e){toast("تعذّر الإرسال: "+(e.code||""))}}
async function recreateAcc(em){const f=readForm("rpf");if(String(f.pass||"").length<8){toast("كلمة المرور 8 أحرف على الأقل");return}
  try{const sec=firebase.apps.find(a=>a.name==="sec")||firebase.initializeApp(FIREBASE_CONFIG,"sec");await sec.auth().createUserWithEmailAndPassword(em,f.pass);await sec.auth().signOut();closeModal();toast("✓ أُنشئ الحساب بكلمة المرور الجديدة")}
  catch(e){toast(e.code==="auth/email-already-in-use"?"الحساب القديم ما زال موجودًا — احذفه من Firebase أولًا":"تعذّر: "+(e.code||""))}}
