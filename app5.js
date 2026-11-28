/* ===== لوحة المؤشرات · التنبيهات الذكية · خطة الحفظ · كشف المتأخرات ===== */
const KPI_DAYS=30;
const daysAgo=n=>{const d=new Date();d.setDate(d.getDate()-n);return d.getFullYear()+"-"+pad2(d.getMonth()+1)+"-"+pad2(d.getDate())};
/* آيات الحفظ المسجَّلة لطالب منذ تاريخ معيّن (دون تكرار) */
function hifzSince(sid,from){
  const off=[];let t=0;SURAH.forEach(q=>{off.push(t);t+=q.a});
  const pos=(n,a)=>{const i=SURAH.findIndex(q=>q.n===n);return i<0?-1:off[i]+Math.max(1,Math.min(SURAH[i].a,Number(a)||1))-1};
  const bm=new Uint8Array(t);let rec=0,last=null;
  D.daily.forEach(d=>{if(from&&d.date<from)return;const r=d.rec&&d.rec[sid];if(!r||!r.hs||String(r.hs).startsWith("الجزء"))return;
    let a=pos(r.hs,r.hf),b=pos(r.he||r.hs,r.ht||r.hf);if(a<0||b<0)return;if(b<a){const x=a;a=b;b=x}
    rec++;for(let i=a;i<=b;i++)bm[i]=1});
  let n=0;for(let i=0;i<t;i++)n+=bm[i];return {n,rec}
}
/* آخر موضع حفظ مسجَّل (سورة + آية) */
function hifzLast(sid){
  let best=null;D.daily.forEach(d=>{const r=d.rec&&d.rec[sid];if(!r||!r.hs||String(r.hs).startsWith("الجزء"))return;if(!best||d.date>=best.d)best={d:d.date,s:r.he||r.hs,a:r.ht||r.hf}});
  return best?best.s+(best.a?" : "+best.a:""):"—"
}
/* إحصاءات طالب خلال نافذة زمنية */
function stuStats(s,from){
  let p=0,ab=0,tot=0,hz=0;
  D.daily.forEach(d=>{if(d.date<from)return;const r=d.rec&&d.rec[s.id];if(!r||!r.att)return;if(r.att==="س")return;tot++;if(r.att==="غ")ab++;else p++});
  const h=hifzSince(s.id,from);
  const plan=num(s.planH),exp=plan*p,ach=exp?Math.round(h.n/exp*100):null;
  return {p,ab,tot,rate:tot?ab/tot:0,ayat:h.n,hrec:h.rec,plan,exp,ach}
}
function riskOf(s,from,halaqaHasHifz){
  const st=stuStats(s,from),why=[];
  if(st.tot>=4&&st.rate>=0.3)why.push("غياب "+Math.round(st.rate*100)+"%");
  if(st.plan&&st.p>=4&&st.ach!==null&&st.ach<50)why.push("إنجاز الخطة "+st.ach+"%");
  else if(!st.plan&&halaqaHasHifz&&st.p>=5&&st.ayat===0)why.push("لا حفظ مسجَّل");
  return {st,why}
}
function allRisks(){
  const from=daysAgo(KPI_DAYS),out=[];
  D.halaqat.forEach(h=>{
    const ss=studentsOf(h);const has=ss.some(s=>hifzSince(s.id,from).rec>0);
    ss.forEach(s=>{const r=riskOf(s,from,has);if(r.why.length)out.push({s,h,...r})})
  });
  return out.sort((a,b)=>b.why.length-a.why.length||b.st.rate-a.st.rate)
}
/* متأخرات الرسوم: آخر 6 أشهر حتى الشهر الحالي */
function arrearsRows(){
  const cur=monthOf(today()),ms=[];for(let i=5;i>=0;i--)ms.push(addMonths(cur,-i));
  const rows=[];
  activeStudents().forEach(s=>{
    const fee=feeOf(s);if(!fee)return;const sm=s.start?monthOf(s.start):"";
    let tot=0,cnt=0;ms.forEach(m=>{if(sm&&m<sm)return;const r=Math.max(0,fee-paidFor(s.id,m));if(r>0){tot+=r;cnt++}});
    if(tot>0)rows.push({s,tot,cnt,fee})
  });
  return rows.sort((a,b)=>b.tot-a.tot)
}
/* تنبيهات ذكية للرئيسية */
function smartAlerts(){
  let n=0,h="";
  try{
    const rk=allRisks();
    if(rk.length){n++;h+=`<div class="alert w">📉 ${rk.length} طالبًا معرّضون للتعثر (غياب كثير أو حفظ ضعيف) — <a href="#" onclick="go('kpi');return false">عرض لوحة المؤشرات</a></div>`}
    if(can.fin()){const ar=arrearsRows().filter(r=>r.cnt>=2);if(ar.length){n++;h+=`<div class="alert r">💰 ${ar.length} طالبًا عليهم متأخرات شهرين فأكثر — <a href="#" onclick="arrearsReport();return false">كشف المتأخرات</a></div>`}}
  }catch(e){}
  return {n,h}
}
/* لوحة المؤشرات */
function vKpi(){
  const from=daysAgo(KPI_DAYS),st=activeStudents();
  let P=0,T=0,AY=0;
  const rows=D.halaqat.slice().sort(byName).map(h=>{
    const ss=studentsOf(h);let p=0,t=0,ay=0,ex=0,ac=0;
    ss.forEach(s=>{const x=stuStats(s,from);p+=x.p;t+=x.tot;ay+=x.ayat;ex+=x.exp;ac+=x.plan?Math.min(x.ayat,x.exp*2):0});
    P+=p;T+=t;AY+=ay;
    return {h,n:ss.length,att:t?Math.round(p/t*100):null,avg:ss.length?Math.round(ay/ss.length):0,ach:ex?Math.round(ac/ex*100):null}
  });
  const rk=allRisks();
  const cur=monthOf(today());let feeBlk="";
  if(can.fin()){
    let due=0,paid=0;st.forEach(s=>{const f=feeOf(s);due+=f;paid+=Math.min(f,paidFor(s.id,cur))});
    const ar=arrearsRows(),arT=ar.reduce((a,r)=>a+r.tot,0);
    feeBlk=`<div class="stat gold"><div class="v">${due?Math.round(paid/due*100):0}%</div><div class="k">تحصيل رسوم ${monthName(cur)}</div></div><div class="stat gold"><div class="v" style="color:var(--red)">${money(arT)}</div><div class="k">متأخرات 6 أشهر (${ar.length} طالبًا)</div></div>`
  }
  const top=st.map(s=>({s,a:hifzSince(s.id,from).n})).filter(x=>x.a>0).sort((a,b)=>b.a-a.a).slice(0,5);
  const col=v=>v===null?"":v>=85?"var(--g)":v>=70?"var(--org)":"var(--red)";
  let h=`<div class="sec-title"><h2>📊 لوحة المؤشرات</h2></div><div class="note" style="margin-bottom:8px">آخر ${KPI_DAYS} يومًا من المتابعة المسجَّلة. المستأذنون لا يُحسبون غيابًا.</div>
  <div class="stats"><div class="stat"><div class="v" style="color:${col(T?Math.round(P/T*100):null)}">${T?Math.round(P/T*100)+"%":"—"}</div><div class="k">نسبة الحضور</div></div>
  <div class="stat"><div class="v">${AY.toLocaleString("fr-FR")}</div><div class="k">آية مسجَّلة حفظًا</div></div>
  <div class="stat"><div class="v" style="color:${rk.length?"var(--red)":"var(--g)"}">${rk.length}</div><div class="k">معرّضون للتعثر</div></div>${feeBlk}</div>
  <div class="panel"><h3>مقارنة الحلقات</h3><div class="scroll"><table class="tbl"><tr><th>الحلقة</th><th>الطلاب</th><th>الحضور</th><th>آيات/طالب</th><th>إنجاز الخطة</th></tr>${rows.map(r=>`<tr><td>${esc(r.h.name)}</td><td class="c">${r.n}</td><td class="c" style="color:${col(r.att)};font-weight:700">${r.att===null?"—":r.att+"%"}</td><td class="c">${r.avg}</td><td class="c" style="color:${col(r.ach)};font-weight:700">${r.ach===null?"—":r.ach+"%"}</td></tr>`).join("")||`<tr><td colspan="5" class="c">لا حلقات</td></tr>`}</table></div></div>`;
  h+=`<div class="panel"><h3>⚠️ طلاب يحتاجون متابعة (${rk.length})</h3>${rk.length?rk.slice(0,40).map(x=>`<div class="row"><div class="grow"><div class="nm"><a href="#" onclick="openDetail('${x.s.id}');return false">${esc(x.s.name)}</a></div><div class="mt">${esc(x.h.name)} · ${x.why.join(" · ")}</div></div>${x.s.guardianPhone&&x.st.rate>=0.3?`<a class="btn wa s" href="#" onclick="absWA('${x.s.id}');return false">واتساب</a>`:""}</div>`).join(""):`<div class="alert ok">لا طلاب متعثرون — الحمد لله.</div>`}</div>`;
  if(top.length)h+=`<div class="panel"><h3>🏅 الأكثر حفظًا هذا الشهر</h3>${top.map((x,i)=>`<div class="row"><div class="grow"><div class="nm">${i+1}. ${esc(x.s.name)}</div><div class="mt">${esc(x.s.halaqa||"")}</div></div><span class="tag">${x.a} آية</span></div>`).join("")}</div>`;
  h+=`<div class="panel"><h3>🛠 أدوات</h3><div class="tools"><button class="btn o" onclick="planModal()">🎯 تعيين خطة حفظ لحلقة</button><button class="btn o" onclick="planSheet()">🖨 كشف خطة الحفظ</button>${can.fin()?`<button class="btn o" onclick="arrearsReport()">🖨 كشف المتأخرات</button>`:""}</div></div>`;
  return h
}
/* تعيين خطة لحلقة كاملة */
function planModal(){
  const hs=D.halaqat.slice().sort(byName);if(!hs.length){toast("لا توجد حلقات");return}
  modal("🎯 خطة الحفظ والمراجعة",`<form id="plf" class="grid" onsubmit="return false"><div class="fld"><label>الحلقة</label><select name="h">${hs.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("")}</select></div><div class="fld"><label>الحفظ اليومي (آيات)</label><input name="planH" type="number" min="0" max="60"></div><div class="fld"><label>المراجعة اليومية (صفحات)</label><input name="planR" type="number" min="0" max="20"></div></form><div class="note">تُطبَّق على كل طلاب الحلقة، ويمكن تعديلها لكل طالب من ملفه.</div>`,`<button class="btn p" onclick="planSave()">تطبيق</button>`)
}
async function planSave(){
  const f=readForm("plf"),h=byId("halaqat",f.h);if(!h)return;
  const ss=studentsOf(h);if(!ss.length){toast("لا طلاب في الحلقة");return}
  try{for(const s of ss){const o={...s,planH:f.planH||"",planR:f.planR||""};await put("people",o)}closeModal();toast("✓ طُبّقت الخطة على "+ss.length+" طالبًا");render()}catch(e){saveErr(e)}
}
/* كشف خطة الحفظ (طباعة) */
function planSheet(){
  const hs=D.halaqat.slice().sort(byName);if(!hs.length){toast("لا توجد حلقات");return}
  const from=daysAgo(KPI_DAYS);
  const body=hs.map(x=>{const ss=studentsOf(x);return `<h3 style="margin:14px 0 4px">${esc(x.name)}</h3><table class="tbl"><tr><th>#</th><th>الطالب</th><th>آخر موضع</th><th>الحفظ اليومي</th><th>المراجعة</th><th>إنجاز ${KPI_DAYS} يومًا</th><th>ملاحظات</th></tr>${ss.map((s,i)=>{const t=stuStats(s,from);return `<tr><td class="c">${i+1}</td><td>${esc(s.name)}</td><td>${esc(hifzLast(s.id))}</td><td class="c">${s.planH?s.planH+" آية":"—"}</td><td class="c">${s.planR?s.planR+" صفحة":"—"}</td><td class="c">${t.ach===null?(t.ayat?t.ayat+" آية":"—"):t.ach+"%"}</td><td></td></tr>`}).join("")}</table>`}).join("");
  printHTML(`<div class="paper">${paperHead("كشف خطة الحفظ والمراجعة")}${body}</div>`)
}
/* كشف المتأخرات */
function arrearsReport(){
  if(!can.fin()){toast("غير مصرّح");return}
  const rows=arrearsRows();if(!rows.length){toast("لا متأخرات 🎉");return}
  const tot=rows.reduce((a,r)=>a+r.tot,0);
  const msg=r=>`السلام عليكم ورحمة الله وبركاته،\nنذكّركم بأن على الطالب/الطالبة ${r.s.name} متأخرات رسوم ${r.cnt} ${r.cnt>2?"أشهر":"شهر/شهرين"} في ${center.name}، المبلغ الإجمالي: ${money(r.tot)}.\nجزاكم الله خيرًا على تعاونكم.`;
  modal("💰 كشف المتأخرات",`<div class="stats"><div class="stat"><div class="v">${rows.length}</div><div class="k">طالبًا</div></div><div class="stat"><div class="v" style="color:var(--red)">${money(tot)}</div><div class="k">الإجمالي</div></div></div><div class="list">${rows.map(r=>`<div class="row"><div class="grow"><div class="nm">${esc(r.s.name)}</div><div class="mt">${esc(r.s.halaqa||"")} · ${r.cnt} أشهر · ${money(r.tot)}</div></div>${r.s.guardianPhone?`<a class="btn wa s" target="_blank" rel="noopener" href="https://wa.me/${phoneIntl(r.s.guardianPhone)}?text=${encodeURIComponent(msg(r))}">واتساب</a>`:""}</div>`).join("")}</div>`,`<button class="btn p" onclick="arrearsPrint()">🖨 طباعة</button>`,true)
}
function arrearsPrint(){
  const rows=arrearsRows(),tot=rows.reduce((a,r)=>a+r.tot,0);
  printHTML(`<div class="paper">${paperHead("كشف متأخرات الرسوم")}<table class="tbl"><tr><th>#</th><th>الطالب</th><th>الحلقة</th><th>أشهر</th><th>المبلغ</th></tr>${rows.map((r,i)=>`<tr><td class="c">${i+1}</td><td>${esc(r.s.name)}</td><td>${esc(r.s.halaqa||"")}</td><td class="c">${r.cnt}</td><td class="c">${money(r.tot)}</td></tr>`).join("")}<tr><td colspan="4"><b>الإجمالي</b></td><td class="c"><b>${money(tot)}</b></td></tr></table></div>`)
}

/* ===== الإعدادات: بطاقة الحساب وملخص المركز لمن لا يملك صلاحية التعديل ===== */
function acctCard(){
  const nm=(typeof CUR!=="undefined"&&CUR&&CUR.name)||(FS?ME:"")||"المستخدم";
  const po=(typeof CUR!=="undefined"&&CUR)?postOf(CUR):(FS&&ACCESS.posts&&POST[ACCESS.posts[ME]]?POST[ACCESS.posts[ME]].l:"");
  return `<div class="row" style="margin-bottom:10px"><div class="grow"><div class="nm">${esc(nm)}${po?` · ${esc(po)}`:""}</div><div class="mt">${esc(RLV[ROLE]||"")}</div>${FS?`<div class="mt" dir="ltr" style="text-align:start">${esc(ME)}</div>`:""}</div>${can.write()?"":`<span class="tag n">صلاحيات محدودة</span>`}</div>`;
}
function centerSummary(){
  return `<div class="note" style="margin-bottom:8px">${esc(center.name)}${center.loc?" — "+esc(center.loc):""}${center.phone?" — <span dir=\"ltr\">"+esc(center.phone)+"</span>":""}${center.year?" — "+esc(center.year):""}<br>إعدادات المركز يعدّلها أصحاب صلاحية التعديل فقط.</div>`;
}

/* ===== الرئيسية: تحية حسب الوقت + "اليوم في لمحة" ===== */
function greet(){const h=new Date().getHours();return h<12?"صباح الخير":h<18?"مساء الخير":"مساء النور"}
function whoName(){
  if(typeof CUR!=="undefined"&&CUR&&CUR.name)return CUR.name+(postOf(CUR)?" · "+postOf(CUR):"");
  if(FS){const p=(ACCESS.posts||{})[ME];const pl=POST[p]?POST[p].l:"";if(typeof MAINOWNER!=="undefined"&&MAINOWNER)return "المالك"+(pl?" · "+pl:"");return pl}
  return ""
}
function glanceHTML(){
  try{
    const t=today(),wd=new Date().getDay(),todays=D.daily.filter(d=>d.date===t);
    let pres=0,tot=0;todays.forEach(d=>Object.values(d.rec||{}).forEach(r=>{if(r.att){tot++;if(r.att==="ح"||r.att==="ت")pres++}}));
    const miss=wd===5?0:D.halaqat.filter(x=>!todays.some(d=>d.halaqaId===x.id)).length;
    const rk=allRisks().length;const items=[];
    items.push(`<button onclick="go('daily',{date:today()})" class="${miss?"w":""}"><b>${D.halaqat.length-miss}/${D.halaqat.length}</b><span>حلقات سُجِّلت متابعتها اليوم</span></button>`);
    items.push(`<button onclick="go('kpi')" class="${rk?"w":""}"><b>${rk}</b><span>طلاب يحتاجون متابعة</span></button>`);
    if(can.fin()){const cur=monthOf(t);const un=activeStudents().filter(s=>feeOf(s)>paidFor(s.id,cur)).length;items.push(`<button onclick="go('finance',{tab:'fees',month:'${cur}',only:1})" class="${un?"w":""}"><b>${un}</b><span>لم يُكملوا رسوم الشهر</span></button>`)}
    return `<div class="glance">${items.join("")}</div>`
  }catch(e){return ""}
}

/* ===== تطوير المالية ===== */
/* توزيع دفعة على أقدم المتأخرات: يعيد [[شهر،مبلغ]...] */
function splitPayment(s,amount,chosen){
  const fee=feeOf(s),cur=monthOf(today()),sm=s.start?monthOf(s.start):"";let ms=[];
  for(let i=5;i>=0;i--){const m=addMonths(cur,-i);if(!sm||m>=sm)ms.push(m)}
  if(chosen&&!ms.includes(chosen)&&chosen<=cur)ms.unshift(chosen);
  ms=[...new Set(ms)].sort();let left=amount;const out=[];
  for(const m of ms){if(left<=0)break;const need=Math.max(0,fee-paidFor(s.id,m));if(!need)continue;const a=Math.min(need,left);out.push([m,a]);left-=a}
  if(left>0){const t=chosen||cur;const i=out.findIndex(x=>x[0]===t);if(i>=0)out[i][1]+=left;else out.push([t,left])}
  return out.length?out:[[chosen||cur,amount]]
}
/* تعديل دفعة رسوم */
function feeEdit(id){
  const o=D.finance.find(x=>x.id===id);if(!o)return;
  modal("تعديل دفعة — "+esc(o.studentName||""),`<form id="fef" class="grid" onsubmit="return false"><div class="fld"><label>عن شهر</label><input name="month" type="month" value="${o.month||""}"></div><div class="fld"><label>المبلغ</label><input name="amount" type="number" min="1" value="${o.amount}"></div><div class="fld"><label>التاريخ</label><input name="date" type="date" value="${o.date||""}"></div><div class="fld"><label>طريقة الدفع</label><select name="method">${METHODS.map(x=>`<option ${x===o.method?"selected":""}>${x}</option>`).join("")}</select></div><div class="fld full"><label>الدافع / ملاحظة</label><input name="note" value="${esc(o.note||"")}"></div></form>`,`<button class="btn p" onclick="feeEditSave('${id}')">حفظ</button><button class="btn o" onclick="closeModal()">إلغاء</button>`)
}
async function feeEditSave(id){
  const o=D.finance.find(x=>x.id===id),f=readForm("fef");if(!o||num(f.amount)<=0){toast("أدخل المبلغ");return}
  try{await put("finance",{...o,...f,amount:num(f.amount)});closeModal();toast("تم التعديل");render()}catch(e){saveErr(e)}
}
/* الرواتب */
function salPaid(pid,m){return D.finance.filter(f=>f.kind==="expense"&&f.cat==="رواتب"&&f.personId===pid&&f.month===m).reduce((a,f)=>a+num(f.amount),0)}
function payAllSalaries(){
  const m=view.month,st=activeStaff().filter(p=>num(p.salary)>salPaid(p.id,m));
  if(!st.length){toast("كل الرواتب مصروفة لهذا الشهر");return}
  const tot=st.reduce((a,p)=>a+num(p.salary)-salPaid(p.id,m),0);
  modal("💸 صرف رواتب الجميع — "+monthName(m),`<p>سيُسجَّل صرف المتبقي من راتب <b>${st.length}</b> عاملًا، بمجموع <b>${money(tot)}</b>.</p><div class="fld"><label>التاريخ</label><input id="paD" type="date" value="${today()}"></div><div class="fld"><label>طريقة الدفع</label><select id="paM">${METHODS.map(x=>`<option>${x}</option>`).join("")}</select></div>`,`<button class="btn p" id="paY">تأكيد الصرف</button><button class="btn o" onclick="closeModal()">إلغاء</button>`);
  $("#paY").onclick=async()=>{try{const d=$("#paD").value||today(),me=$("#paM").value;for(const p of st){await put("finance",{id:uid("f"),kind:"expense",cat:"رواتب",personId:p.id,personName:p.name,month:m,date:d,method:me,amount:num(p.salary)-salPaid(p.id,m)})}closeModal();toast("✓ صُرفت رواتب "+st.length+" عاملًا");render()}catch(e){saveErr(e)}}
}
function salarySlip(pid,m){
  const p=byId("people",pid),rows=D.finance.filter(f=>f.kind==="expense"&&f.cat==="رواتب"&&f.personId===pid&&f.month===m).sort((a,b)=>a.date.localeCompare(b.date));
  const paid=rows.reduce((a,f)=>a+num(f.amount),0);
  printHTML(`<div class="paper" style="max-width:600px">${paperHead("قسيمة راتب")}<table class="tbl"><tr><th>الاسم</th><td>${esc(p.name)}</td><th>الشهر</th><td>${monthName(m)}</td></tr><tr><th>الوظيفة</th><td>${esc(p.job||CATS[p.cat].s)}</td><th>الراتب الشهري</th><td>${money(p.salary)}</td></tr>${rows.map(f=>`<tr><th>دفعة ${arDate(f.date)}</th><td colspan="3">${money(f.amount)} — ${esc(f.method||"")}</td></tr>`).join("")}<tr><th>المصروف</th><td><b>${money(paid)}</b></td><th>المتبقي</th><td>${money(Math.max(0,num(p.salary)-paid))}</td></tr></table><div class="sign"><span>المحاسب: ${esc(postName("acc"))}<br>التوقيع: ..................</span><span>توقيع المستلم: ..................</span></div></div>`)
}
function payrollSheet(){
  const m=view.month,st=activeStaff().filter(p=>num(p.salary)>0).sort(byName);let T=0,P=0;
  const rows=st.map((p,i)=>{const pd=salPaid(p.id,m);T+=num(p.salary);P+=pd;return `<tr><td class="c">${i+1}</td><td>${esc(p.name)}</td><td>${esc(p.job||CATS[p.cat].s)}</td><td class="c">${money(p.salary)}</td><td class="c">${money(pd)}</td><td class="c">${money(Math.max(0,num(p.salary)-pd))}</td><td></td></tr>`}).join("");
  printHTML(`<div class="paper">${paperHead("كشف رواتب "+monthName(m))}<table class="tbl"><tr><th>#</th><th>الاسم</th><th>الوظيفة</th><th>الراتب</th><th>المصروف</th><th>المتبقي</th><th>التوقيع</th></tr>${rows}<tr><td colspan="3"><b>الإجمالي</b></td><td class="c"><b>${money(T)}</b></td><td class="c"><b>${money(P)}</b></td><td class="c"><b>${money(Math.max(0,T-P))}</b></td><td></td></tr></table></div>`,true)
}
/* تصدير CSV (يفتح في Excel) */
function finCSV(scope){
  const m=view.month,ys=center.yearStart||(m.slice(0,4)+"-01-01");
  const rows=D.finance.filter(f=>scope==="month"?monthOf(f.date)===m:(f.date>=ys&&monthOf(f.date)<=m)).sort((a,b)=>a.date.localeCompare(b.date));
  const K={fee:"رسوم طالب",income:"إيراد",expense:"مصروف"};
  const q=v=>'"'+String(v==null?"":v).replace(/"/g,'""')+'"';
  const out=[["التاريخ","النوع","البند/المصدر","الطالب/العامل","الشهر","المبلغ","طريقة الدفع","البيان","رقم الإيصال"].map(q).join(",")];
  rows.forEach(f=>out.push([f.date,K[f.kind]||f.kind,f.cat||f.source||"",f.studentName||f.personName||"",f.month||"",num(f.amount),f.method||"",f.desc||f.note||"",f.receipt||""].map(q).join(",")));
  const blob=new Blob(["\ufeff"+out.join("\r\n")],{type:"text/csv;charset=utf-8"}),a=document.createElement("a");
  a.href=URL.createObjectURL(blob);a.download="المالية_"+(scope==="month"?m:ys.slice(0,4))+".csv";document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);
  toast("✓ تم تصدير "+rows.length+" قيدًا")
}
/* رسم بياني: آخر 6 أشهر */
function finChart(){
  const m=view.month,ms=[];for(let i=5;i>=0;i--)ms.push(addMonths(m,-i));
  const data=ms.map(x=>{const S=sumData(D.finance.filter(f=>monthOf(f.date)===x));return {x,ti:S.ti,te:S.te}});
  const mx=Math.max(1,...data.map(d=>Math.max(d.ti,d.te)));
  return `<div class="panel" style="margin-top:12px"><h3>📈 الإيرادات والمصروفات — آخر 6 أشهر</h3>${data.map(d=>`<div style="margin:8px 0"><div class="mt" style="margin-bottom:3px">${monthName(d.x)}</div><div style="display:flex;align-items:center;gap:6px"><div style="height:12px;border-radius:6px;background:var(--g2);width:${Math.round(d.ti/mx*100)}%;min-width:${d.ti?3:0}px"></div><span class="mt">${money(d.ti)}</span></div><div style="display:flex;align-items:center;gap:6px;margin-top:2px"><div style="height:12px;border-radius:6px;background:var(--gold);width:${Math.round(d.te/mx*100)}%;min-width:${d.te?3:0}px"></div><span class="mt">${money(d.te)}</span></div></div>`).join("")}<div class="mt"><span style="color:var(--g2)">■</span> إيرادات &nbsp; <span style="color:var(--gold)">■</span> مصروفات</div></div>`
}
/* رصيد الصندوق */
function cashPanel(){
  const m=view.month,S=sumData(D.finance.filter(f=>monthOf(f.date)<=m)),ob=num(center.openBal),bal=ob+S.bal;
  const canSet=ROLE==="owner"||ROLE==="local";
  return `<div class="panel" style="margin-top:12px"><h3>🏦 رصيد الصندوق حتى نهاية ${monthName(m)}</h3><div class="stats"><div class="stat"><div class="v">${money(ob)}</div><div class="k">رصيد افتتاحي</div></div><div class="stat"><div class="v" style="color:${bal<0?"var(--red)":"var(--g)"}">${money(bal)}</div><div class="k">الرصيد الحالي</div></div></div>${canSet?`<button class="btn o s" onclick="openBalSet()">تعيين الرصيد الافتتاحي</button>`:""}<div class="note">الرصيد = الافتتاحي + كل الإيرادات − كل المصروفات المسجَّلة في التطبيق (آخر 13 شهرًا محمّلة).</div></div>`
}
function openBalSet(){
  modal("الرصيد الافتتاحي",`<div class="fld"><label>المبلغ</label><input id="obv" type="number" value="${num(center.openBal)||""}"></div><p class="note">الرصيد الموجود في الصندوق قبل أول قيد مسجَّل في التطبيق.</p>`,`<button class="btn p" id="obY">حفظ</button><button class="btn o" onclick="closeModal()">إلغاء</button>`);
  $("#obY").onclick=async()=>{try{await saveCenter({...center,openBal:num($("#obv").value)});closeModal();toast("تم الحفظ");render()}catch(e){saveErr(e)}}
}
