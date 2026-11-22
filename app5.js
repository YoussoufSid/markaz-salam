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
