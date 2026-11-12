/* ===== app4: centre data import, timetable, weekly follow-up form, student status actions ===== */
let SEED=null;
const TT_DEF={"days": ["الإثنين", "الثلاثاء"], "slots": ["18h40 à 19h20", "19h20 à 20h00", "20h00 à 20h40", "20h40 à 21h30"], "levels": [{"n": "المستوى (1)", "c": [["التربية الإسلامية: التوحيد والفقه / Éducation islamique", "القراءة والكتابة / Lecture - Écriture"], ["القراءة والكتابة / Lecture - Écriture", "المحادثة / Conversation"], ["الحساب / Maths", "الحساب / Maths"], ["المحادثة / Conversation", "التربية الإسلامية / Éducation islamique"]]}, {"n": "المستوى (2)", "c": [["القراءة والكتابة / Lecture - Écriture", "التربية الإسلامية 1: التوحيد والفقه / Éducation islamique"], ["المحادثة / Conversation", "القراءة والكتابة / Lecture - Écriture"], ["التربية الإسلامية 2: الحديث والسيرة / Éducation islamique", "الحساب / Maths"], ["", "المحادثة / Conversation"]]}, {"n": "المستوى (3)", "c": [["القراءة والكتابة / Lecture - Écriture", "التوحيد"], ["التربية الإسلامية 1: التوحيد والفقه / Éducation islamique", "التربية الإسلامية 2: الحديث والسيرة / Éducation islamique"], ["الحساب / Maths", "الفقه"], ["المحادثة / Conversation", "القراءة والكتابة / Lecture - Écriture"]]}, {"n": "المستوى (4)", "c": [["القراءة والكتابة / Lecture - Écriture", "المحادثة / Conversation"], ["التربية الإسلامية: التوحيد والفقه / Éducation islamique", "التربية الإسلامية: الحديث والسيرة / Éducation islamique"], ["الحساب / Maths", "القواعد (النحو والصرف) / Grammaire - Morphologie"], ["المحادثة / Conversation | التجويد", "القراءة والكتابة / Lecture - Écriture"]]}, {"n": "المستوى (5)", "c": [["القراءة والكتابة / Lecture - Écriture", "المحادثة / Conversation"], ["التربية الإسلامية: التوحيد والفقه / Éducation islamique", "التربية الإسلامية: الحديث والسيرة / Éducation islamique"], ["الحساب / Maths", "القواعد (النحو والصرف) / Grammaire - Morphologie"], ["المحادثة / Conversation | التجويد", "القراءة والكتابة / Lecture - Écriture"]]}, {"n": "المستوى (6)", "c": [["القراءة والكتابة / Lecture - Écriture", "المحادثة / Conversation"], ["التربية الإسلامية: التوحيد والفقه / Éducation islamique", "التربية الإسلامية: الحديث والسيرة / Éducation islamique"], ["الحساب / Maths", "القواعد (النحو والصرف) / Grammaire - Morphologie"], ["الإنشاء | التجويد", "القراءة والكتابة / Lecture - Écriture"]]}]};

const qT=(s,f,e,t)=>{if(!s)return "";if(/^الجزء/.test(s))return s;const a=s+(f?" "+f:"");if(e&&e!==s)return a+" – "+e+(t?" "+t:"");return a+(t&&t!==f?"–"+t:"")};
/* ---------- one-time import of the centre's existing lists (boys section) ---------- */
async function seedLoad(){const f=$("#sdF")&&$("#sdF").files[0];if(!f){toast("اختر الملف أولًا");return}
  try{const o=JSON.parse(await f.text());if(o.type!=="markaz-salam-seed"||!Array.isArray(o.h))throw 0;SEED=o;closeModal();seedOffer()}catch(e){toast("الملف غير صالح")}}
function seedCount(){return SEED.h.reduce((a,h)=>a+h.st.length,0)}
function seedOffer(){
  if(!can.write())return;
  if(!SEED){modal("📥 استيراد بيانات المركز",`<p>اختر ملف البيانات <b>بيانات_مركز_السلام_للاستيراد.json</b> (أو ملف Excel لاستمارة المتابعة بعد حفظه بصيغة JSON من المطور).</p><p class="note">البيانات تبقى على هذا الجهاز فقط، ولا تُنشر على الإنترنت.</p><input type="file" id="sdF">`,`<button class="btn p" onclick="seedLoad()">متابعة</button><button class="btn o" onclick="lsSet('salam_seed1','later');closeModal()">لاحقًا</button>`);return}
  modal("📥 استيراد بيانات المركز",`<p>وُجدت بيانات المركز من الملفين المرسَلين:</p>
   <ul style="line-height:2">${SEED.h.map(h=>`<li><b>حلقة ${esc(h.name)}</b> — الشيخ ${esc(h.teacher)} — ${h.st.length} طالبًا</li>`).join("")}</ul>
   <p>المجموع: <b>${SEED.h.length}</b> حلقات، <b>${seedCount()}</b> طالبًا، <b>${SEED.h.length}</b> مدرسين — في <b>قسم البنين</b>.<br>المواد: ${SEED.subj.map(esc).join("، ")}.<br>وجدول توزيع الحصص للمستويات الستة.</p>
   <label style="display:flex;gap:10px;align-items:center;margin:8px 0;cursor:pointer"><input type="checkbox" style="width:20px;height:20px;flex:none" id="sdW" checked><span>تسجيل مواضع الحفظ والمراجعة من الاستمارة كمتابعةٍ بتاريخ اليوم</span></label>
   <label style="display:flex;gap:10px;align-items:center;margin:8px 0;cursor:pointer"><input type="checkbox" style="width:20px;height:20px;flex:none" id="sdS" checked><span>اعتماد هذه المواد لقسم العربية والتربية الإسلامية</span></label>
   <p class="note">لن يُكرَّر أي اسم موجود مسبقًا. ويبقى بعد ذلك باب الإضافة والتعديل والفصل والانفصال والتخرج مفتوحًا كالمعتاد.</p>`,
   `<button class="btn p" onclick="seedRun()">استيراد الآن</button><button class="btn o" onclick="lsSet('salam_seed1','later');closeModal()">لاحقًا</button>`);
}
async function seedRun(){
  const withW=$("#sdW")&&$("#sdW").checked,withS=$("#sdS")&&$("#sdS").checked;closeModal();
  const oldSec=SEC;SEC="b";document.body.dataset.sec="b";window.__bulk=1;let nT=0,nH=0,nS=0;const dt=today();
  try{
    for(const h of SEED.h){
      let t=D.people.find(p=>p.cat==="teachers"&&p.name===h.teacher);
      if(!t){t={id:uid("p"),cat:"teachers",name:h.teacher,gender:"ذكر",status:"نشط",job:"مدرس حلقة "+h.name,regNo:nextReg("teachers"),sec:"b"};await put("people",t);nT++}
      let x=D.halaqat.find(q=>q.name===h.name);
      if(!x){x={id:uid("h"),name:h.name,teacherId:t.id,gender:"بنون",sec:"b"};await put("halaqat",x);nH++}
      const rec={};
      for(const r of h.st){
        let s=D.people.find(p=>p.cat==="students"&&p.name===r.n&&p.halaqa===x.name);
        const hp=qT(r.hs,r.hf,r.he,r.ht),rp=qT(r.rs,r.rf,r.re,r.rt);
        if(!s){s={id:uid("p"),cat:"students",name:r.n,gender:"ذكر",status:"نشط",halaqa:x.name,dailyAmt:r.amt||"",hifzPos:hp,revPos:rp,regNo:nextReg("students"),start:dt,sec:"b"};await put("people",s);nS++}
        if(withW&&(hp||rp||r.note)){const c={att:hp||rp?"ح":""};
          Object.entries({hs:r.hs,hf:r.hf,he:r.he,ht:r.ht,hg:r.hg,rs:r.rs,rf:r.rf,re:r.re,rt:r.rt,rg:r.rg,note:r.note}).forEach(([k,v])=>{if(v)c[k]=v});
          if(hp)c.hifz=hp;if(rp)c.rev=rp;if(!c.att)delete c.att;rec[s.id]=c}
      }
      if(withW&&Object.keys(rec).length){const id=x.id+"_"+dt,old=D.daily.find(d=>d.id===id);await put("daily",{id,halaqaId:x.id,halaqa:x.name,date:dt,rec:{...((old&&old.rec)||{}),...rec},sec:"b"})}
    }
    const c={...center};if(withS)c.subj_ar=SEED.subj.map(n=>n+":1").join("، ");
    if(!c.tt_b)c.tt_b=TT_DEF;if(!c.tt_g)c.tt_g=TT_DEF;await saveCenter(c);
    lsSet("salam_seed1","done");
    toast(`✓ تم الاستيراد: ${nH} حلقات، ${nS} طالبًا، ${nT} مدرسين`);
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
  return `<table class="tbl tt"><tr><th>المــدّة<br><small>La durée</small></th>${tt.days.map(d=>`<th>${esc(d)}</th>`).join("")}<th>الملاحظة</th></tr>${tt.slots.map((s,i)=>`<tr><td class="c ttt" dir="ltr">${esc(s)}</td>${tt.days.map((d,j)=>`<td>${ttCell(((L.c[i]||[])[j])||"")}</td>`).join("")}<td>${esc(((L.note||[])[i])||"")}</td></tr>`).join("")}</table>`}
function vTimes(){
  const tt=ttGet();view.lv=Math.min(view.lv||0,tt.levels.length-1);
  if(view.ttEdit&&can.write())return ttEditor();
  let h=`<div class="sec-title"><h2>🗓️ جدول توزيع الحصص</h2><div class="tools">${can.write()?`<button class="btn o" onclick="view.ttEdit=ttGet();render()">✏️ تعديل الجدول</button>`:""}<button class="btn o" onclick="ttPrint(0)">🖨️ طباعة هذا المستوى</button><button class="btn p" onclick="ttPrint(1)">🖨️ طباعة كل المستويات</button></div></div>`;
  h+=`<div class="subtabs">${tt.levels.map((L,i)=>`<button class="${view.lv===i?"on":""}" onclick="view.lv=${i};render()">${esc(L.n)}</button>`).join("")}</div>`;
  return h+`<div class="panel fit">${ttTable(tt,view.lv)}</div><p class="note">لكل خانة: العربية ثم « / » ثم الفرنسية. ولحصتين في خانة واحدة افصل بينهما بـ « | ».</p>`;
}
function ttPrint(all){const tt=ttGet();const idx=all?tt.levels.map((_,i)=>i):[view.lv||0];
  printHTML(idx.map((i,k)=>`<div class="paper" style="${k?"page-break-before:always":""}">${paperHead("جدول توزيع الحصص — "+esc(tt.levels[i].n))}${ttTable(tt,i)}<div class="sign"><span>${sigDG()}</span><span>ختم المركز</span></div></div>`).join(""),true)}
function ttEditor(){
  const T=view.ttEdit,i=view.lv||0,L=T.levels[i];
  let h=`<div class="sec-title"><h2>✏️ تعديل جدول الحصص</h2></div><div class="subtabs">${T.levels.map((x,k)=>`<button class="${i===k?"on":""}" onclick="ttSync();view.lv=${k};render()">${esc(x.n)}</button>`).join("")}<button onclick="ttSync();view.ttEdit.levels.push({n:'المستوى ('+(view.ttEdit.levels.length+1)+')',c:[]});view.lv=view.ttEdit.levels.length-1;render()">＋ مستوى</button></div>
  <div class="panel"><div class="grid"><div class="fld"><label>اسم المستوى</label><input id="ttN" value="${esc(L.n)}"></div><div class="fld"><label>الأيام (افصل بفاصلة)</label><input id="ttD" value="${esc(T.days.join("، "))}" onchange="ttSync();view.ttEdit.days=this.value.split(/[،,]/).map(x=>x.trim()).filter(Boolean);render()"></div></div>
  <div class="fit"><table class="tbl tte"><tr><th>المدة</th>${T.days.map(d=>`<th>${esc(d)}</th>`).join("")}<th>ملاحظة</th><th></th></tr>${T.slots.map((s,r)=>`<tr><td><input data-s="${r}" value="${esc(s)}" dir="ltr"></td>${T.days.map((d,c)=>`<td><textarea data-r="${r}" data-c="${c}" rows="2">${esc(((L.c[r]||[])[c])||"")}</textarea></td>`).join("")}<td><input data-n="${r}" value="${esc(((L.note||[])[r])||"")}"></td><td><button class="btn o s" onclick="ttSync();view.ttEdit.slots.splice(${r},1);view.ttEdit.levels.forEach(l=>{l.c.splice(${r},1);l.note&&l.note.splice(${r},1)});render()">✕</button></td></tr>`).join("")}</table></div>
  <div class="tools"><button class="btn o s" onclick="ttSync();view.ttEdit.slots.push('');render()">＋ حصة</button>${T.levels.length>1?`<button class="btn o s" onclick="ttSync();view.ttEdit.levels.splice(${i},1);view.lv=0;render()">🗑️ حذف هذا المستوى</button>`:""}<span class="sp"></span><button class="btn o" onclick="view.ttEdit=null;render()">إلغاء</button><button class="btn p" onclick="ttSave()">💾 حفظ الجدول</button></div></div>`;
  return h;
}
function ttSync(){const T=view.ttEdit;if(!T)return;const L=T.levels[view.lv||0];const n=$("#ttN");if(n)L.n=n.value.trim()||L.n;
  document.querySelectorAll(".tte [data-s]").forEach(e=>T.slots[+e.dataset.s]=e.value.trim());
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
  return `<div class="paper wk"><table class="wkh"><tr><td><b>${esc(center.name)} (${sx[0]})</b></td><td><img src="icon-192.png" alt=""></td><td dir="ltr" style="text-align:left"><b>${esc((center.nameFr||"MARKAZ AS-SALAM POUR LES ÉTUDES CORANIQUES").toUpperCase())} (${sx[1]})</b></td></tr></table>
  <table class="wkh2"><tr><td><b>استمارة متابعة الدروس الأسبوعية</b></td><td>حلقة <b>${esc(x.name)}</b></td><td>الشيخ / <b>${esc(t?t.name:"")}</b></td><td>التاريخ: من ${arDate(from)} إلى ${arDate(to)}</td></tr></table>
  <table class="tbl wkt"><tr><th rowspan="2">م</th><th rowspan="2">الاسم</th><th>مقدار اليومي</th><th colspan="2">بداية الحفظ</th><th colspan="2">نهاية الحفظ</th><th rowspan="2">التقدير</th><th colspan="2">بداية المراجعة</th><th colspan="2">نهاية المراجعة</th><th rowspan="2">التقدير</th><th rowspan="2">ملاحظة</th></tr>
  <tr><th>للحفظ</th><th>سورة</th><th>آية</th><th>سورة</th><th>آية</th><th>سورة</th><th>آية</th><th>سورة</th><th>آية</th></tr>${rows||`<tr><td colspan="14" class="c">لا يوجد طلاب في هذه الحلقة</td></tr>`}</table>
  <div class="sign"><span>توقيع الشيخ: ............</span><span>المراقب: ${esc(postName("sup"))}<br>............</span><span>${sigDG()}</span></div></div>`;
}
