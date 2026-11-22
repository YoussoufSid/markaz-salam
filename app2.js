/* ==========================================================
   مركز السلام — الوحدات المتقدمة
   الدرجات والشهادات · ملف الطالب الشامل · الرسوم البيانية · القسم الداخلي
   ========================================================== */

/* ---------------- shared helpers ---------------- */
const TERMS=[["T1","الفصل الأول","1er trimestre"],["T2","الفصل الثاني","2e trimestre"],["T3","الفصل الثالث","3e trimestre"]];
const DEPTS={ar:{n:"قسم اللغة العربية والتربية الإسلامية",k:"arClass"},fr:{n:"قسم اللغة الفرنسية والمواد العصرية",k:"frClass"}};
const DEF_SUBJ={
  ar:"القرآن الكريم:2، التوحيد:1، الفقه:2، الحديث:1، السيرة النبوية:1، التفسير:1، النحو:2، الصرف:1، المطالعة والقراءة:2، الإملاء والخط:1، التعبير:1، المحفوظات:1",
  fr:"Lecture:2, Écriture:1, Dictée:1, Grammaire et conjugaison:2, Expression écrite:1, Mathématiques:3, Sciences:2, Histoire-Géographie:1, Éducation civique et morale:1, Anglais:1"
};
function subjects(dep){
  return String(center["subj_"+dep]||DEF_SUBJ[dep]).split(/[،,\n]/).map(x=>x.trim()).filter(Boolean)
    .map(x=>{const m=x.match(/^(.*?)(?:\s*[:：]\s*(\d+(?:\.\d+)?))?$/);return {n:m[1].trim(),c:Number(m[2]||1)}}).filter(x=>x.n);
}
const maxOf=dep=>num(center["max_"+dep])||10;
const curYear=()=>center.year||String(new Date().getFullYear());
const gid=(sid,dep,term)=>(sid+"_"+dep+"_"+curYear()+"_"+term).replace(/[^\w.\-~:@+]/g,"-");
function mention(p,fr){return p>=90?(fr?"Excellent":"ممتاز"):p>=80?(fr?"Très bien":"جيد جدًا"):p>=70?(fr?"Bien":"جيد"):p>=60?(fr?"Assez bien":"مستحسن"):p>=50?(fr?"Passable":"مقبول"):(fr?"Insuffisant":"ضعيف")}
const fmt=(v,d=2)=>v==null||isNaN(v)?"—":Number(v).toFixed(d).replace(/\.?0+$/,"");

/* averages for one class/term (term "AN" = annual mean of available terms) */
function classResults(dep,cls,term){
  const key=DEPTS[dep].k,subs=subjects(dep),mx=maxOf(dep);
  const st=activeStudents().filter(s=>s[key]===cls).sort(byName);
  const gradeOf=(sid,t)=>D.grades.find(g=>g.id===gid(sid,dep,t));
  const avgFor=(g)=>{if(!g||!g.marks)return null;let sw=0,sc=0;subs.forEach(su=>{const v=g.marks[su.n];if(v!==""&&v!=null&&!isNaN(v)){sw+=Number(v)*su.c;sc+=su.c}});return sc?sw/sc:null};
  let rows=st.map(s=>{
    if(term==="AN"){const avs=TERMS.map(t=>avgFor(gradeOf(s.id,t[0]))).filter(v=>v!=null);return {s,avg:avs.length?avs.reduce((a,b)=>a+b,0)/avs.length:null,terms:TERMS.map(t=>avgFor(gradeOf(s.id,t[0])))}}
    const g=gradeOf(s.id,term);return {s,g,avg:avgFor(g)};
  });
  const ranked=rows.filter(r=>r.avg!=null).sort((a,b)=>b.avg-a.avg);
  ranked.forEach((r,i)=>{r.rank=(i>0&&Math.abs(ranked[i-1].avg-r.avg)<1e-9)?ranked[i-1].rank:i+1});
  const cavg=ranked.length?ranked.reduce((a,r)=>a+r.avg,0)/ranked.length:null;
  const pass=ranked.filter(r=>r.avg/mx*100>=50).length;
  return {rows,ranked,cavg,pass,mx,subs};
}

/* ================= GRADES VIEW ================= */
function vGrades(){
  view.dep=view.dep||"ar";view.term=view.term||"T1";view.gtab=view.gtab||"entry";
  const dep=view.dep,key=DEPTS[dep].k;
  const used=CLASSES.filter(c=>activeStudents().some(s=>s[key]===c));
  if(!view.cls||!CLASSES.includes(view.cls))view.cls=used[0]||CLASSES[0];
  let h=`<div class="sec-title"><h2>📚 الدرجات والشهادات الفصلية</h2></div>
  <div class="subtabs">${Object.entries(DEPTS).map(([k,d])=>`<button class="${dep===k?"on":""}" onclick="gSet('dep','${k}')">${d.n}</button>`).join("")}</div>
  <div class="tools"><select onchange="gSet('cls',this.value)"><optgroup label="المرحلة الابتدائية">${CLASSES.slice(0,6).map(c=>`<option value="${c}" ${view.cls===c?"selected":""}>${c}</option>`).join("")}</optgroup><optgroup label="المرحلة الإعدادية">${CLASSES.slice(6).map(c=>`<option value="${c}" ${view.cls===c?"selected":""}>${c}</option>`).join("")}</optgroup></select>
   <select onchange="gSet('term',this.value)">${TERMS.map(t=>`<option value="${t[0]}" ${view.term===t[0]?"selected":""}>${t[1]}</option>`).join("")}${view.gtab==="res"?`<option value="AN" ${view.term==="AN"?"selected":""}>النتيجة السنوية</option>`:""}</select>
   <span class="note">السنة ${esc(curYear())} · الدرجة من ${maxOf(dep)}</span><span class="sp"></span>
   <div class="subtabs" style="margin:0"><button class="${view.gtab==="entry"?"on":""}" onclick="gSet('gtab','entry')">✍️ رصد الدرجات</button><button class="${view.gtab==="res"?"on":""}" onclick="gSet('gtab','res')">🏆 النتائج والترتيب</button></div></div>`;
  return h+(view.gtab==="res"?gradesResults():gradesEntry());
}
function gSet(k,v){const f=()=>{view[k]=v;if(k==="gtab"&&v==="entry"&&view.term==="AN")view.term="T1";view.gedit=null;view.dirty=false;render()};if(view.dirty)confirmDiscard(f);else f()}
function gradesEntry(){
  const dep=view.dep,key=DEPTS[dep].k,subs=subjects(dep),mx=maxOf(dep),ro=!can.daily();
  if(view.term==="AN")view.term="T1";
  const st=activeStudents().filter(s=>s[key]===view.cls).sort(byName);
  if(!st.length)return `<div class="empty">لا يوجد طلاب في ${esc(view.cls)} — حدّد الصف في بيانات الطلاب.</div>`;
  if(!view.gedit){view.gedit={};st.forEach(s=>{const g=D.grades.find(x=>x.id===gid(s.id,dep,view.term));view.gedit[s.id]=JSON.parse(JSON.stringify(g?{marks:g.marks||{},abs:g.abs||"",conduct:g.conduct||"",remark:g.remark||""}:{marks:{},abs:"",conduct:"",remark:""}))})}
  let h=`<div class="note" style="margin-bottom:8px">اكتب الدرجة من ${mx} لكل مادة (المعامل بين القوسين). اتركها فارغة إن لم يُختبر الطالب فيها.</div><div class="scroll"><table class="tbl gtbl"><tr><th style="min-width:150px">الطالب</th>${subs.map(su=>`<th class="c" style="min-width:64px">${esc(su.n)}<br><span class="note">(${su.c})</span></th>`).join("")}<th class="c">الغياب</th><th class="c">السلوك</th><th style="min-width:140px">ملاحظة المعلم</th><th class="c">المعدل</th></tr>`;
  st.forEach(s=>{const e=view.gedit[s.id];let sw=0,sc=0;subs.forEach(su=>{const v=e.marks[su.n];if(v!==""&&v!=null&&!isNaN(v)){sw+=Number(v)*su.c;sc+=su.c}});
    h+=`<tr><td><b>${esc(s.name)}</b></td>${subs.map(su=>`<td class="c"><input class="gin" type="number" min="0" max="${mx}" step="0.25" ${ro?"disabled":""} value="${esc(e.marks[su.n]??"")}" onchange="gMark('${s.id}',${JSON.stringify(su.n).replace(/"/g,"&quot;")},this)"></td>`).join("")}
    <td class="c"><input class="gin" type="number" min="0" ${ro?"disabled":""} value="${esc(e.abs)}" onchange="gF('${s.id}','abs',this.value)"></td>
    <td class="c"><select ${ro?"disabled":""} onchange="gF('${s.id}','conduct',this.value)"><option></option>${["ممتاز","جيد جدًا","جيد","مقبول","يحتاج إلى متابعة"].map(o=>`<option ${e.conduct===o?"selected":""}>${o}</option>`).join("")}</select></td>
    <td><input class="gin" style="width:100%" ${ro?"disabled":""} value="${esc(e.remark)}" onchange="gF('${s.id}','remark',this.value)"></td>
    <td class="c" id="av_${s.id}"><b>${sc?fmt(sw/sc):"—"}</b></td></tr>`});
  h+=`</table></div>`;
  if(!ro)h+=`<div class="savebar">${view.dirty?`<span class="msg">● تعديلات غير محفوظة</span>`:`<span class="note">محفوظ</span>`}<button class="btn p" onclick="saveGrades()">💾 حفظ الدرجات</button></div>`;
  return h;
}
function gDirty(){if(!view.dirty){view.dirty=true;const m=$(".savebar .msg, .savebar .note");if(m){m.className="msg";m.textContent="● تعديلات غير محفوظة"}}}
function gMark(sid,sub,inp){const mx=maxOf(view.dep);let v=inp.value;if(v!==""){v=Math.max(0,Math.min(mx,Number(v)));inp.value=v}view.gedit[sid].marks[sub]=v===""?"":v;gDirty();
  const subs=subjects(view.dep);let sw=0,sc=0;subs.forEach(su=>{const x=view.gedit[sid].marks[su.n];if(x!==""&&x!=null&&!isNaN(x)){sw+=Number(x)*su.c;sc+=su.c}});const c=$("#av_"+sid);if(c)c.innerHTML=`<b>${sc?fmt(sw/sc):"—"}</b>`}
function gF(sid,k,v){view.gedit[sid][k]=v;gDirty()}
async function saveGrades(){
  const dep=view.dep,term=view.term;let n=0;
  try{for(const [sid,e] of Object.entries(view.gedit)){const s=byId("people",sid);const id=gid(sid,dep,term),old=D.grades.find(g=>g.id===id);
      const has=Object.values(e.marks).some(v=>v!==""&&v!=null)||e.abs||e.conduct||e.remark;if(!has&&!old)continue;
      if(old&&JSON.stringify({m:old.marks||{},a:old.abs||"",c:old.conduct||"",r:old.remark||""})===JSON.stringify({m:e.marks,a:e.abs,c:e.conduct,r:e.remark}))continue;
      await put("grades",{...(old||{}),id,studentId:sid,studentName:s.name,dep,cls:view.cls,term,year:curYear(),date:today(),marks:e.marks,abs:e.abs,conduct:e.conduct,remark:e.remark});n++}
    const ids=Object.keys(view.gedit);view.dirty=false;view.gedit=null;toast("تم حفظ درجات "+n+" طالبًا");render();if(typeof syncPortal==="function")setTimeout(()=>syncPortal(ids),1500);
  }catch(err){saveErr(err)}
}
function gradesResults(){
  const dep=view.dep,term=view.term,R=classResults(dep,view.cls,term),mx=R.mx;
  if(!R.rows.length)return `<div class="empty">لا يوجد طلاب في ${esc(view.cls)}</div>`;
  const best=R.ranked[0];
  let h=`<div class="stats"><div class="stat"><div class="v">${R.rows.length}</div><div class="k">عدد طلاب الصف</div></div><div class="stat"><div class="v">${fmt(R.cavg)}</div><div class="k">معدل الصف من ${mx}</div></div>
   <div class="stat"><div class="v">${R.ranked.length?Math.round(R.pass/R.ranked.length*100)+"%":"—"}</div><div class="k">نسبة النجاح (≥ ${mx/2})</div></div><div class="stat gold"><div class="v" style="font-size:16px">${best?"🥇 "+esc(best.s.name):"—"}</div><div class="k">الأول على الصف ${best?"("+fmt(best.avg)+")":""}</div></div></div>
   <div class="tools"><button class="btn p" onclick="printBulletins()">🖨️ طباعة كل الشهادات</button><button class="btn o" onclick="printClassSheet()">🖨️ محضر نتائج الصف</button>${nmPick()}</div>
   <div class="list">`;
  const order=[...R.ranked,...R.rows.filter(r=>r.avg==null)];
  h+=order.map(r=>{const pc=r.avg!=null?r.avg/mx*100:null;return `<div class="row">${r.rank?`<div class="rank r${Math.min(r.rank,4)}">${r.rank}</div>`:`<div class="rank">—</div>`}${avHTML(r.s,38)}<div class="grow"><div class="nm">${esc(r.s.name)}</div><div class="mt">${term==="AN"?r.terms.map((v,i)=>`${TERMS[i][1]}: ${fmt(v)}`).join(" · "):(r.g&&r.g.conduct?"السلوك: "+esc(r.g.conduct):"")}</div></div>
    <div style="min-width:120px"><div class="bar"><i style="width:${pc||0}%;background:${pc==null?"#ccc":pc>=50?"var(--g2)":"var(--red)"}"></i></div><div class="mt">${fmt(r.avg)} / ${mx}${pc!=null?" — "+mention(pc):""}</div></div>
    ${r.avg!=null?`<button class="btn o s" onclick="printBulletin('${r.s.id}')">📄 الشهادة</button>`:""}</div>`}).join("");
  return h+`</div>`;
}

/* ---------- bulletins ---------- */
function bulletinHTML(sid,dep,cls,term){
  const R=classResults(dep,cls,term),r=R.rows.find(x=>x.s.id===sid);if(!r)return "";
  const s=r.s,mx=R.mx,fr=dep==="fr",an=term==="AN",tName=an?(fr?"Résultats annuels":"النتيجة السنوية"):TERMS.find(t=>t[0]===term)[fr?2:1];
  const pc=r.avg!=null?r.avg/mx*100:null,g=r.g||{};
  const L=fr?{t:"Bulletin de notes",sub:"Matière",co:"Coef.",no:"Note /"+mx,nc:"Note × Coef.",tot:"Total",avg:"Moyenne",rank:"Rang",eff:"Effectif",cavg:"Moyenne de la classe",app:"Appréciation",abs:"Absences",cond:"Conduite",obs:"Observations du maître",dec:"Décision",ok:"Admis(e)",ko:"Non admis(e)",m:"Le Maître",d:"Le Directeur",p:"Le Parent",cl:"Classe",yr:"Année scolaire",nm:"Nom et prénom",mat:"Matricule"}
                :{t:"الشهادة الفصلية",sub:"المادة",co:"المعامل",no:"الدرجة /"+mx,nc:"الدرجة × المعامل",tot:"المجموع",avg:"المعدل",rank:"الترتيب",eff:"عدد الطلاب",cavg:"معدل الصف",app:"التقدير",abs:"الغياب",cond:"السلوك",obs:"ملاحظة المعلم",dec:"القرار",ok:"ناجح(ة)",ko:"راسب(ة)",m:"المعلم",d:"المدير",p:"ولي الأمر",cl:"الصف",yr:"السنة الدراسية",nm:"الاسم واللقب",mat:"رقم التسجيل"};
  const head=fr?`<div class="ph" style="direction:ltr"><img src="icon-192.png" alt=""><div class="t"><b>${esc(frName())}</b><span class="note">${esc(locFr())} · ${SEC==="g"?"Section filles":"Section garçons"}</span><span style="display:block;color:var(--gold);font-weight:700">Section française et matières modernes</span></div><div class="d">${(d=>Number(d.slice(8))+" "+MONTHS_FR[Number(d.slice(5,7))-1]+" "+d.slice(0,4))(today())}</div></div>`:paperHead("").replace("<h2></h2>","")+`<div style="text-align:center;color:var(--gold);font-weight:700;margin-top:-8px">${DEPTS[dep].n}</div>`;
  let rows="";
  if(an){rows=`<tr><th>${fr?"Trimestre":"الفصل"}</th><th class="c">${L.avg}</th></tr>`+TERMS.map((t,i)=>`<tr><td>${t[fr?2:1]}</td><td class="c">${fmt(r.terms[i])}</td></tr>`).join("")}
  else{let tw=0,tc=0;rows=`<tr><th>${L.sub}</th><th class="c">${L.co}</th><th class="c">${L.no}</th><th class="c">${L.nc}</th></tr>`+R.subs.map(su=>{const v=(g.marks||{})[su.n];const ok=v!==""&&v!=null&&!isNaN(v);if(ok){tw+=Number(v)*su.c;tc+=su.c}return `<tr><td>${esc(su.n)}</td><td class="c">${su.c}</td><td class="c">${ok?fmt(v):"—"}</td><td class="c">${ok?fmt(Number(v)*su.c):"—"}</td></tr>`}).join("")+`<tr><th>${L.tot}</th><th class="c">${tc}</th><th></th><th class="c">${fmt(tw)}</th></tr>`}
  return `<div class="paper bulletin" dir="${fr?"ltr":"rtl"}" style="${fr?"text-align:left":""}">${head}
   <h2>${L.t} — ${tName}</h2>
   <table class="tbl" style="margin-bottom:10px"><tr><th>${L.nm}</th><td><b>${pn(s)}</b></td><th>${L.mat}</th><td>${esc(s.regNo||"")}</td></tr><tr><th>${L.cl}</th><td>${esc(fr?(CLASSES_FR[CLASSES.indexOf(cls)]||cls)+(CLASSES.indexOf(cls)<6?" — Primaire":" — Collège"):cls)}</td><th>${L.yr}</th><td>${esc(curYear())}</td></tr></table>
   <table class="tbl">${rows}</table>
   <table class="tbl" style="margin-top:10px"><tr><th>${L.avg}</th><td class="c" style="font-size:16px"><b>${fmt(r.avg)} / ${mx}</b></td><th>${L.rank}</th><td class="c"><b>${r.rank||"—"}</b> / ${R.ranked.length}</td></tr>
   <tr><th>${L.cavg}</th><td class="c">${fmt(R.cavg)}</td><th>${L.app}</th><td class="c">${pc!=null?mention(pc,fr):"—"}</td></tr>
   ${an?`<tr><th>${L.dec}</th><td class="c" colspan="3"><b>${pc==null?"—":pc>=50?L.ok:L.ko}</b></td></tr>`:`<tr><th>${L.abs}</th><td class="c">${esc(g.abs||"0")}</td><th>${L.cond}</th><td class="c">${esc(g.conduct||"—")}</td></tr><tr><th>${L.obs}</th><td colspan="3">${esc(g.remark||"")}</td></tr>`}</table>
   <div class="sign"><span>${L.m}: ............</span><span>${L.d}: ${esc(postName("dg"))}<br>............</span><span>${L.p}: ............</span></div></div>`;
}
function printBulletin(sid){const h=bulletinHTML(sid,view.dep,view.cls,view.term);modal("الشهادة",`<div class="fit" id="bfit">${h}</div>`,`<button class="btn p" onclick="printHTML($('#bfit').innerHTML)">🖨️ طباعة / PDF</button><button class="btn o" onclick="closeModal()">إغلاق</button>`,true);setTimeout(()=>fitZoom($("#bfit")),30)}
function printBulletins(){const R=classResults(view.dep,view.cls,view.term);printHTML(R.rows.filter(r=>r.avg!=null).map(r=>bulletinHTML(r.s.id,view.dep,view.cls,view.term)).join('<div style="page-break-after:always"></div>'))}
function printClassSheet(){
  const dep=view.dep,term=view.term,R=classResults(dep,view.cls,term),an=term==="AN";
  const order=[...R.ranked,...R.rows.filter(r=>r.avg==null)];
  printHTML(`<div class="paper">${paperHead("محضر نتائج "+esc(view.cls)+" — "+(an?"النتيجة السنوية":TERMS.find(t=>t[0]===term)[1]))}<div style="text-align:center;color:var(--gold);font-weight:700;margin:-6px 0 10px">${DEPTS[dep].n} · ${esc(curYear())}</div>
   <table class="tbl"><tr><th class="c">الترتيب</th><th>الاسم</th>${an?TERMS.map(t=>`<th class="c">${t[1]}</th>`).join(""):R.subs.map(su=>`<th class="c" style="font-size:10px">${esc(su.n)}</th>`).join("")}<th class="c">المعدل</th><th>التقدير</th></tr>
   ${order.map(r=>`<tr><td class="c">${r.rank||"—"}</td><td>${pn(r.s)}</td>${an?r.terms.map(v=>`<td class="c">${fmt(v)}</td>`).join(""):R.subs.map(su=>`<td class="c">${fmt(((r.g||{}).marks||{})[su.n])}</td>`).join("")}<td class="c"><b>${fmt(r.avg)}</b></td><td>${r.avg!=null?mention(r.avg/R.mx*100):""}</td></tr>`).join("")}</table>
   <p>معدل الصف: <b>${fmt(R.cavg)}</b> / ${R.mx} — الناجحون: <b>${R.pass}</b> من ${R.ranked.length}</p><div class="sign"><span>المعلم: ............</span><span>${sigDG()}</span></div></div>`);
}

/* ================= STUDENT 360° PROFILE ================= */
function vStudent(){
  const s=byId("people",view.sid);if(!s)return `<div class="empty">الطالب غير موجود</div>`;
  const g=s.gender==="أنثى",mem=Math.min(30,num(s.memorized)),m=monthOf(today());
  // attendance heatmap (last 56 days)
  const days=[];for(let i=55;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);days.push(d.getFullYear()+"-"+pad2(d.getMonth()+1)+"-"+pad2(d.getDate()))}
  const attOn=d=>{const doc=D.daily.find(x=>x.date===d&&x.rec&&x.rec[s.id]);return doc?doc.rec[s.id].att||"":null};
  const c={};ATT.forEach(a=>c[a[0]]=0);days.forEach(d=>{const a=attOn(d);if(a)c[a]++});const tot=Object.values(c).reduce((a,b)=>a+b,0);
  const hz=D.daily.filter(d=>d.rec&&d.rec[s.id]&&(d.rec[s.id].hifz||d.rec[s.id].rev)).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6);
  const ex=D.exams.filter(e=>e.studentId===s.id).sort((a,b)=>b.date.localeCompare(a.date));
  const gr=Object.keys(DEPTS).map(dep=>{const cls=s[DEPTS[dep].k];if(!cls)return null;return {dep,cls,terms:TERMS.map(t=>{const R=classResults(dep,cls,t[0]),r=R.rows.find(x=>x.s.id===s.id);return r&&r.avg!=null?{avg:r.avg,rank:r.rank,n:R.ranked.length,mx:R.mx}:null})}}).filter(Boolean);
  const hq=D.halaqat.find(x=>x.name===s.halaqa);
  const permits=(D.permits||[]).filter(p=>p.studentId===s.id).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
  return `<div class="sec-title"><button class="back" onclick="history.length&&view.from?go(view.from.name,view.from):go('list',{cat:'students'})">${BK()}</button><h2>ملف ${g?"الطالبة":"الطالب"}</h2></div>
  <div class="prof">
   <div class="pcard"><div class="pph">${s.photo?`<img src="${s.photo}" alt="">`:`<span>${esc((s.name||"?")[0])}</span>`}</div>
    <div class="pnm">${esc(s.name)}</div><div class="mt">${esc(s.regNo||"")} · ${esc(s.regime||"")}${s.room?" · 🛏️ "+esc(s.room):""}</div>
    <div class="pchips"><span class="chip">📖 القرآن: ${esc(s.level||"—")}${s.halaqa?" · "+esc(s.halaqa):""}</span><span class="chip">📖 المسجَّل: ${hifzCount(s.id).n} آية (${hifzCount(s.id).pct}%)</span><span class="chip">🕌 العربي: ${esc(s.arClass||"—")}</span><span class="chip">🇫🇷 الفرنسي: ${esc(s.frClass||"—")}</span></div>
    <div class="pact">${can.write()?`<button class="btn p s" onclick="openForm('students','${s.id}')">✏️ تعديل</button><button class="btn o s" onclick="statusForm('${s.id}')">🔁 الحالة: ${esc(s.status||"نشط")}</button>`:""}${can.daily()?`<button class="btn o s" onclick="examForm('','${s.id}')">📝 اختبار</button>`:""}${can.fin()?`<button class="btn o s" onclick="payModal('${s.id}','${m}')">💰 دفع</button>`:""}${s.guardianPhone?`<button class="btn wa s" onclick="parentWA('${s.id}')">واتساب لولي الأمر</button>`:""}<button class="btn o s" onclick="go('reports',{rep:'idcards',icScope:'one',sid:'${s.id}'})">🪪 البطاقة</button><button class="btn o s" onclick="go('reports',{rep:'student',sid:'${s.id}'})">🖨️ بطاقة المتابعة</button>${s.regime==="نظام داخلي"&&can.daily()?`<button class="btn o s" onclick="permitForm('${s.id}')">🚪 إذن خروج</button>`:""}</div>
    <div class="pinfo">${[["تاريخ الميلاد",s.birth?arDate(s.birth)+" ("+age(s.birth)+")":""],["ولي الأمر",s.guardian],["هاتفه",s.guardianPhone],["الحي",s.address],["المدرس",hq?teacherName(hq.teacherId):""],["تاريخ الالتحاق",s.start?arDate(s.start):""],["ملاحظات صحية",s.health]].filter(x=>x[1]).map(x=>`<div><span>${x[0]}</span>${esc(x[1])}</div>`).join("")}</div>
   </div>
   <div class="pmain">
    <div class="panel"><h3>📖 خريطة الحفظ — ${mem} من 30 جزءًا</h3><div class="juz">${Array.from({length:30},(_,i)=>{const j=i+1,on=j>30-mem;return `<div class="${on?"on":""}" title="الجزء ${j}">${j}</div>`}).join("")}</div><div class="note">يبدأ العدّ من جزء عمّ (30) صعودًا إلى الجزء الأول.</div></div>
    <div class="panel"><h3>🗓️ الحضور في الأسابيع الثمانية الأخيرة</h3><div class="heat">${days.map(d=>{const a=attOn(d);return `<i class="${a===null?"":a==="ح"?"h1":a==="ت"?"h3":a==="غ"?"h2":a==="س"?"h4":""}" title="${arDate(d)}${a?" — "+(ATT.find(x=>x[0]===a)||[,""])[1]:""}"></i>`}).join("")}</div>
     <div class="note" style="margin-top:6px">${ATT.map(a=>`${a[1]}: ${c[a[0]]}`).join(" · ")}${tot?" — نسبة الحضور "+Math.round((c["ح"]+c["ت"])/tot*100)+"%":""}</div></div>
    ${gr.length?`<div class="panel"><h3>📚 الدرجات الفصلية (${esc(curYear())})</h3><table class="tbl"><tr><th>القسم</th>${TERMS.map(t=>`<th class="c">${t[1]}</th>`).join("")}</tr>${gr.map(x=>`<tr><td>${x.dep==="ar"?"العربي":"الفرنسي"} — ${esc(x.cls)}</td>${x.terms.map(t=>`<td class="c">${t?`<b>${fmt(t.avg)}</b>/${t.mx}<br><span class="note">الترتيب ${t.rank}/${t.n}</span>`:"—"}</td>`).join("")}</tr>`).join("")}</table></div>`:""}
    ${hz.length?`<div class="panel"><h3>✅ آخر المتابعات</h3><table class="tbl"><tr><th>التاريخ</th><th>الحفظ</th><th>التقدير</th><th>المراجعة</th></tr>${hz.map(d=>{const q=d.rec[s.id];return `<tr><td>${arDate(d.date)}</td><td>${esc(q.hifz||"")}</td><td>${esc(q.hg||"")}</td><td>${esc(q.rev||"")}${q.rg?" ("+esc(q.rg)+")":""}</td></tr>`}).join("")}</table></div>`:""}
    ${ex.length?`<div class="panel"><h3>📝 الاختبارات</h3><div class="list">${ex.map(e=>`<div class="row"><div class="grow"><div>${esc(e.type)}${e.scope?" — "+esc(e.scope):""}</div><div class="mt">${arDate(e.date)}</div></div><span class="tag ${num(e.total)>=60?"":"r"}">${num(e.total)}/100 — ${esc(e.grade)}</span>${num(e.total)>=60?`<button class="btn o s" onclick="certificate('${e.id}')">🏅</button>`:""}</div>`).join("")}</div></div>`:""}
    ${can.fin()&&feeOf(s)?`<div class="panel"><h3>💰 الرسوم</h3><div class="list">${feeMonths(s,6).map(mm=>{const f=feeOf(s),p=paidFor(s.id,mm);return `<div class="row"><div class="grow">${monthName(mm)}</div><span class="tag ${p>=f?"":p?"w":"r"}">${p>=f?"مدفوع":"المتبقي "+money(f-p)}</span></div>`}).join("")}</div></div>`:""}
    ${permits.length?`<div class="panel"><h3>🚪 أذونات الخروج</h3><div class="list">${permits.map(permitRow).join("")}</div></div>`:""}
   </div></div>`;
}
function openStudent(id){closeModal();go("student",{sid:id,from:{name:view.name,cat:view.cat,hid:view.hid}})}

/* ================= DASHBOARD CHARTS ================= */
function barsSVG(items,opt){ // items: [{l,v,v2}]
  opt=opt||{};const W=Math.max(260,items.length*(opt.two?34:26)),H=150,pad=22,mx=Math.max(1,opt.max||Math.max(...items.map(i=>Math.max(i.v||0,i.v2||0))));
  const bw=(W-pad)/items.length;
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" preserveAspectRatio="none" style="width:100%;height:${H}px">
   <line x1="0" y1="${H-pad}" x2="${W}" y2="${H-pad}" stroke="var(--ln)"/>
   ${items.map((it,i)=>{const x=i*bw+4,h1=(it.v||0)/mx*(H-pad-14),h2=(it.v2||0)/mx*(H-pad-14),w=opt.two?(bw-8)/2:bw-8;
     return `<g><rect x="${x}" y="${H-pad-h1}" width="${w}" height="${h1}" rx="3" fill="${it.c||opt.c||"var(--g2)"}"><title>${esc(it.l)}: ${it.t||it.v}</title></rect>${opt.two?`<rect x="${x+w+2}" y="${H-pad-h2}" width="${w}" height="${h2}" rx="3" fill="${opt.c2||"var(--red)"}"><title>${esc(it.l)}: ${it.t2||it.v2}</title></rect>`:""}
     <text x="${x+(opt.two?w:w/2)}" y="${H-6}" font-size="9" text-anchor="middle" fill="var(--mut)">${esc(it.l)}</text>${opt.lab&&it.v?`<text x="${x+w/2}" y="${H-pad-h1-3}" font-size="9" text-anchor="middle" fill="var(--tx)">${it.t||it.v}</text>`:""}</g>`}).join("")}</svg>`;
}
function homeCharts(){
  const st=activeStudents();
  // attendance by recorded day (last 14)
  const byDay={};D.daily.forEach(d=>{byDay[d.date]=byDay[d.date]||[0,0];Object.values(d.rec||{}).forEach(r=>{if(r.att){byDay[d.date][1]++;if(r.att==="ح"||r.att==="ت")byDay[d.date][0]++}})});
  const ds=Object.keys(byDay).sort().slice(-14);
  const att=ds.map(d=>{const [p,t]=byDay[d];const v=t?Math.round(p/t*100):0;return {l:Number(d.slice(8))+"/"+Number(d.slice(5,7)),v,t:v+"%",c:v>=85?"var(--g2)":v>=70?"var(--org)":"var(--red)"}});
  const B=[["0",0,0],["1–5",1,5],["6–10",6,10],["11–15",11,15],["16–20",16,20],["21–29",21,29],["30",30,30]];
  const mem=B.map(b=>({l:b[0],v:st.filter(s=>{const n=num(s.memorized);return n>=b[1]&&n<=b[2]}).length,c:b[0]==="30"?"var(--gold)":"var(--g2)"}));
  let h=`<div class="charts"><div class="panel"><h3>📈 نسبة الحضور (آخر ${ds.length||0} أيام مسجَّلة)</h3>${ds.length?barsSVG(att,{max:100,lab:1}):'<div class="note">لا توجد متابعات بعد</div>'}</div>
   <div class="panel"><h3>📖 توزيع الطلاب حسب الأجزاء المحفوظة</h3>${st.length?barsSVG(mem,{lab:1}):'<div class="note">لا يوجد طلاب بعد</div>'}</div>`;
  if(can.fin()){const m=monthOf(today());const ms=[5,4,3,2,1,0].map(k=>addMonths(m,-k));
    const fin=ms.map(mm=>{const i=D.finance.filter(f=>f.kind!=="expense"&&monthOf(f.date)===mm).reduce((a,f)=>a+num(f.amount),0),e=D.finance.filter(f=>f.kind==="expense"&&monthOf(f.date)===mm).reduce((a,f)=>a+num(f.amount),0);return {l:monthName(mm).split(" ")[0].slice(0,6),v:i,v2:e,t:money(i),t2:money(e)}});
    h+=`<div class="panel"><h3>💰 الإيرادات <span style="color:var(--g2)">■</span> والمصروفات <span style="color:var(--red)">■</span> — آخر 6 أشهر</h3>${barsSVG(fin,{two:1})}</div>`}
  return h+`</div>`;
}

/* ================= BOARDING (القسم الداخلي) ================= */
const boarders=()=>activeStudents().filter(s=>s.regime==="نظام داخلي").sort(byName);
function vBoard(){
  view.btab=view.btab||"rooms";let T=[["rooms","🛏️ الغرف"],["roll","🌙 التفقد"],["permits","🚪 أذونات الخروج"]];if(ROLE==="guard"){T=[T[2]];view.btab="permits"}
  const out=(D.permits||[]).filter(p=>p.status==="خارج"),late=out.filter(p=>p.until&&p.until<nowLocal());
  let h=`<div class="sec-title"><h2>🛏️ القسم الداخلي</h2></div>
  <div class="stats"><div class="stat"><div class="v">${boarders().length}</div><div class="k">طالب في النظام الداخلي</div></div><div class="stat"><div class="v">${D.rooms.length}</div><div class="k">غرفة</div></div><div class="stat"><div class="v">${out.length}</div><div class="k">خارج المركز الآن</div></div><div class="stat"><div class="v" style="color:${late.length?"var(--red)":"var(--g)"}">${late.length}</div><div class="k">متأخر عن العودة</div></div></div>
  <div class="subtabs">${T.map(([k,l])=>`<button class="${view.btab===k?"on":""}" onclick="bSet('btab','${k}')">${l}</button>`).join("")}</div>`;
  return h+({rooms:boardRooms,roll:boardRoll,permits:boardPermits}[view.btab])();
}
function bSet(k,v){const f=()=>{view[k]=v;view.edit=null;view.dirty=false;render()};if(view.dirty)confirmDiscard(f);else f()}
function nowLocal(){const d=new Date();return d.getFullYear()+"-"+pad2(d.getMonth()+1)+"-"+pad2(d.getDate())+"T"+pad2(d.getHours())+":"+pad2(d.getMinutes())}
function boardRooms(){
  const bs=boarders(),noRoom=bs.filter(s=>!s.room);
  let h=`<div class="tools">${can.write()?`<button class="btn p" onclick="roomForm()">＋ غرفة جديدة</button>`:""}${noRoom.length?`<span class="tag w">${noRoom.length} طالبًا داخليًا بلا غرفة</span>`:""}</div>`;
  if(!D.rooms.length)return h+`<div class="empty">لا توجد غرف بعد — أضف الغرف ثم وزّع عليها طلاب النظام الداخلي.</div>`;
  return h+`<div class="tiles">`+[...D.rooms].sort(byName).map(r=>{const occ=bs.filter(s=>s.room===r.name),cap=num(r.capacity);return `<div class="tile" style="cursor:default"><div class="l" style="font-size:17px">🛏️ ${esc(r.name)}</div><div class="s">${esc([r.floor,r.supervisorId&&teacherName(r.supervisorId)].filter(Boolean).join(" · "))}</div>
   <div class="n" style="margin-top:4px">${occ.length}${cap?`<span class="note"> / ${cap}</span>`:""}</div><div class="bar"><i style="width:${cap?Math.min(100,occ.length/cap*100):0}%;background:${cap&&occ.length>cap?"var(--red)":"var(--g2)"}"></i></div>
   <div class="mt" style="margin-top:6px">${occ.map(s=>`<a href="#" onclick="openStudent('${s.id}');return false">${esc(s.name)}</a>`).join("، ")||"فارغة"}</div>
   ${can.write()?`<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap"><button class="btn o s" onclick="roomAssign('${r.id}')">＋ إسكان طلاب</button><button class="btn o s" onclick="roomForm('${r.id}')">تعديل</button></div>`:""}</div>`}).join("")+`</div>`;
}
function roomForm(id){
  const r=id?D.rooms.find(x=>x.id===id):{};const sup=D.people.filter(p=>p.cat==="supervisors"&&isAct(p)).sort(byName);
  modal(id?"تعديل الغرفة":"غرفة جديدة",`<form id="rmf" class="grid" onsubmit="return false"><div class="fld"><label>اسم/رقم الغرفة</label><input name="name" value="${esc(r.name||"")}"></div><div class="fld"><label>عدد الأسرّة</label><input name="capacity" type="number" min="1" value="${esc(r.capacity||"")}"></div><div class="fld"><label>الطابق / الجناح</label><input name="floor" value="${esc(r.floor||"")}"></div><div class="fld"><label>المراقب المسؤول</label><select name="supervisorId"><option value="">—</option>${sup.map(p=>`<option value="${p.id}" ${r.supervisorId===p.id?"selected":""}>${esc(p.name)}</option>`).join("")}</select></div></form>`,
   `<button class="btn p" onclick="saveRoom('${id||""}')">حفظ</button>${id&&!boarders().some(s=>s.room===r.name)?`<button class="btn d" onclick="del('rooms','${id}').then(closeModal)">حذف</button>`:""}<button class="btn o" onclick="closeModal()">إلغاء</button>`);
}
async function saveRoom(id){const f=readForm("rmf");if(!f.name){toast("اسم الغرفة مطلوب");return}if(D.rooms.some(r=>r.name===f.name&&r.id!==id)){toast("الاسم مستعمل");return}
  const old=id?D.rooms.find(x=>x.id===id):null;try{await put("rooms",{...(old||{}),...f,id:id||uid("r")});if(old&&old.name!==f.name)for(const s of boarders().filter(s=>s.room===old.name))await put("people",{...s,room:f.name});closeModal();toast("تم الحفظ")}catch(e){saveErr(e)}}
function roomAssign(id){
  const r=D.rooms.find(x=>x.id===id),cand=boarders().filter(s=>s.room!==r.name);
  if(!cand.length){toast("لا يوجد طلاب داخليون آخرون");return}
  modal("إسكان في "+esc(r.name),`<div id="rml">${cand.map(s=>`<label class="chk"><input type="checkbox" value="${s.id}"> <span class="grow">${esc(s.name)}</span><span class="note">${s.room?"حاليًا: "+esc(s.room):"بلا غرفة"}</span></label>`).join("")}</div>`,`<button class="btn p" id="rmY">إسكان المحددين</button><button class="btn o" onclick="closeModal()">إلغاء</button>`);
  $("#rmY").onclick=async()=>{const ids=[...document.querySelectorAll("#rml input:checked")].map(i=>i.value);try{for(const sid of ids)await put("people",{...byId("people",sid),room:r.name});closeModal();toast("تم")}catch(e){saveErr(e)}};
}
function boardRoll(){
  view.date=view.date||today();view.per=view.per||"ليلي";
  const id=SEC+"_"+view.date+"_"+view.per,doc=D.board.find(d=>d.id===id),bs=boarders(),ro=!can.daily();
  const outIds=new Set((D.permits||[]).filter(p=>p.status==="خارج").map(p=>p.studentId));
  if(!view.edit){view.edit=JSON.parse(JSON.stringify((doc&&doc.rec)||{}));bs.forEach(s=>{if(outIds.has(s.id)&&!view.edit[s.id])view.edit[s.id]="إ"})}
  let h=`<div class="tools"><input type="date" value="${view.date}" onchange="bSet('date',this.value)"><select onchange="bSet('per',this.value)">${["صباحي","مسائي","ليلي"].map(p=>`<option ${view.per===p?"selected":""}>${p}</option>`).join("")}</select>${ro?"":`<button class="btn o s" onclick="boarders().forEach(s=>{if(!view.edit[s.id])view.edit[s.id]='ح'});view.dirty=true;render()">الكل حاضر</button>`}${doc?"":`<span class="tag w">لم يُسجَّل بعد</span>`}</div>`;
  if(!bs.length)return h+`<div class="empty">لا يوجد طلاب في النظام الداخلي — حدّد «النظام» في بيانات الطالب.</div>`;
  const rooms=[...new Set(bs.map(s=>s.room||"بلا غرفة"))].sort();
  h+=rooms.map(rn=>`<div class="panel"><h3>🛏️ ${esc(rn)}</h3><div class="list">${bs.filter(s=>(s.room||"بلا غرفة")===rn).map(s=>{const v=view.edit[s.id]||"";return `<div class="row">${avHTML(s,34)}<div class="grow nm">${esc(s.name)}${outIds.has(s.id)?' <span class="tag w">بإذن خارج المركز</span>':""}</div><div class="seg">${[["ح","حاضر","a1"],["غ","غائب","a2"],["إ","بإذن","a4"]].map(a=>`<button class="${v===a[0]?"on "+a[2]:""}" ${ro?"disabled":""} title="${a[1]}" onclick="view.edit['${s.id}']=view.edit['${s.id}']==='${a[0]}'?'':'${a[0]}';view.dirty=true;const y=scrollY;render();scrollTo(0,y)">${a[0]}</button>`).join("")}</div></div>`}).join("")}</div></div>`).join("");
  if(!ro)h+=`<div class="savebar">${view.dirty?`<span class="msg">● تعديلات غير محفوظة</span>`:`<span class="note">محفوظ</span>`}<button class="btn p" onclick="saveRoll()">💾 حفظ التفقد</button></div>`;
  return h;
}
async function saveRoll(){const rec={};Object.entries(view.edit).forEach(([k,v])=>{if(v)rec[k]=v});try{await put("board",{id:SEC+"_"+view.date+"_"+view.per,date:view.date,per:view.per,rec});view.dirty=false;view.edit=null;const ab=Object.values(rec).filter(v=>v==="غ").length;toast("تم حفظ التفقد"+(ab?" — غياب: "+ab:""));render()}catch(e){saveErr(e)}}
function permitRow(p){const late=p.status==="خارج"&&p.until&&p.until<nowLocal();return `<div class="row"><div class="grow"><div class="nm">${esc(p.studentName)} <span class="note">— ${esc(p.type||"خروج")}</span></div><div class="mt">من ${esc((p.from||"").replace("T"," "))} إلى ${esc((p.until||"").replace("T"," "))}${p.reason?" · "+esc(p.reason):""}${p.escort?" · المرافق: "+esc(p.escort):""}${p.returnedAt?" · عاد: "+esc(p.returnedAt.replace("T"," ")):""}</div></div>
  <span class="tag ${p.status==="عاد"?"":late?"r":"w"}">${p.status==="عاد"?"عاد":late?"متأخر":"خارج"}</span>${p.status==="خارج"&&can.permit()?`<button class="btn p s" onclick="permitBack('${p.id}')">✓ عاد</button>`:""}<button class="btn o s" onclick="printPermit('${p.id}')">🖨️</button></div>`}
function boardPermits(){
  const ps=[...(D.permits||[])].sort((a,b)=>(a.status==="خارج"?0:1)-(b.status==="خارج"?0:1)||b.date.localeCompare(a.date)).slice(0,60);
  return `<div class="tools">${can.permit()?`<button class="btn p" onclick="permitForm()">＋ إذن جديد</button>`:""}</div>`+(ps.length?`<div class="list">${ps.map(permitRow).join("")}</div>`:`<div class="empty">لا توجد أذونات</div>`);
}
function permitForm(sid){
  const bs=boarders();if(!bs.length){toast("لا يوجد طلاب داخليون");return}const n=nowLocal(),t=new Date();t.setHours(t.getHours()+4);
  const until=t.getFullYear()+"-"+pad2(t.getMonth()+1)+"-"+pad2(t.getDate())+"T"+pad2(t.getHours())+":"+pad2(t.getMinutes());
  modal("🚪 إذن خروج",`<form id="pmf" class="grid" onsubmit="return false"><div class="fld full"><label>الطالب</label><select name="studentId">${bs.map(s=>`<option value="${s.id}" ${s.id===sid?"selected":""}>${esc(s.name)}${s.room?" — "+esc(s.room):""}</option>`).join("")}</select></div>
   <div class="fld"><label>النوع</label><select name="type"><option>خروج مؤقت</option><option>زيارة أسرية</option><option>عطلة نهاية الأسبوع</option><option>علاج</option><option>أخرى</option></select></div><div class="fld"><label>المرافق (ولي الأمر أو من ينوب عنه)</label><input name="escort"></div>
   <div class="fld"><label>من</label><input name="from" type="datetime-local" value="${n}"></div><div class="fld"><label>العودة المتوقعة</label><input name="until" type="datetime-local" value="${until}"></div>
   <div class="fld full"><label>السبب</label><input name="reason"></div></form>`,`<button class="btn p" onclick="savePermit()">حفظ وطباعة</button><button class="btn o" onclick="closeModal()">إلغاء</button>`);
}
async function savePermit(){const f=readForm("pmf"),s=byId("people",f.studentId);if(!f.until||f.until<=f.from){toast("تحقق من وقت العودة");return}
  const p={id:uid("pm"),...f,studentName:s.name,room:s.room||"",status:"خارج",date:f.from.slice(0,10),by:ME||""};try{await put("permits",p);closeModal();printPermit(p.id,p)}catch(e){saveErr(e)}}
async function permitBack(id){const p=D.permits.find(x=>x.id===id);try{await put("permits",{...p,status:"عاد",returnedAt:nowLocal()});toast("سُجّلت العودة")}catch(e){saveErr(e)}}
function permitHTML(p){return `<div class="paper" style="max-width:600px">${paperHead("إذن خروج — النظام الداخلي")}<table class="tbl"><tr><th>الطالب</th><td colspan="3"><b>${pnS(p.studentId,p.studentName)}</b>${p.room?" — الغرفة: "+esc(p.room):""}</td></tr><tr><th>النوع</th><td>${esc(p.type||"")}</td><th>المرافق</th><td>${esc(p.escort||"")}</td></tr><tr><th>من</th><td>${esc((p.from||"").replace("T"," "))}</td><th>العودة المتوقعة</th><td>${esc((p.until||"").replace("T"," "))}</td></tr><tr><th>السبب</th><td colspan="3">${esc(p.reason||"")}</td></tr><tr><th>وقت العودة الفعلي</th><td colspan="3">${p.returnedAt?esc(p.returnedAt.replace("T"," ")):"..................."}</td></tr></table><div class="sign"><span>المراقب: ............</span><span>المرافق: ............</span><span>الإدارة: ............</span></div></div>`}
function printPermit(id,obj){const p=obj||D.permits.find(x=>x.id===id);LASTP=p;modal("إذن الخروج",permitHTML(p),`<button class="btn p" onclick="printHTML(permitHTML(LASTP))">🖨️ طباعة</button><button class="btn o" onclick="closeModal()">إغلاق</button>`,true)}
let LASTP=null;

/* months a student actually owes: from max(enrolment, school-year start) to now */
function feeMonths(s,n){const m=monthOf(today()),st=[monthOf(s.start||(s.created||"").slice(0,10)),monthOf(center.yearStart||"")].filter(Boolean).sort().pop()||"0000-00";
  return Array.from({length:n||6},(_,k)=>addMonths(m,-k)).filter(mm=>mm>=st)}
