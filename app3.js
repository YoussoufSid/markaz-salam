/* ==========================================================
   مركز السلام — الأمان وسهولة الاستخدام
   سجل العمليات · سلة المحذوفات · القفل التلقائي · النسخ المشفّر · إجراءات سريعة
   ========================================================== */
const NOLOG=["logs","trash"];
const COLN={people:"الأشخاص",halaqat:"الحلقات",daily:"المتابعة",finance:"المالية",staffatt:"حضور العاملين",exams:"الاختبارات",grades:"الدرجات",rooms:"الغرف",board:"التفقد",permits:"الأذونات"};
const recLabel=o=>o?(o.name||o.studentName||o.personName||o.halaqa||o.title||o.receipt||o.date||o.id):"";

/* ---------------- activity log ---------------- */
let logBusy=Promise.resolve();
function logAct(a,col,obj){
  if(NOLOG.includes(col))return;
  const d=today(),id="log_"+SEC+"_"+d,who=(CUR&&CUR.name)||ME||"—",t=new Date().toTimeString().slice(0,5);
  const e={t,u:who,a,c:COLN[col]||col,n:String(recLabel(obj)).slice(0,60)};
  if(FS){FS.collection("logs").doc(id).set({date:d,sec:SEC,e:firebase.firestore.FieldValue.arrayUnion(e)},{merge:true}).catch(()=>{});return}
  logBusy=logBusy.then(async()=>{try{const old=RAW.logs.find(x=>x.id===id);const ent=((old&&old.e)||[]).concat(e).slice(-400);await put("logs",{id,date:d,e:ent})}catch(err){}});
}
function openLog(){
  const ls=[...D.logs].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,14);
  modal("📜 سجل العمليات",ls.length?ls.map(l=>`<div class="grp" style="margin:10px 0 4px">${dayName(l.date)} ${arDate(l.date)}</div><div class="list">${[...(l.e||[])].reverse().map(e=>`<div class="row logrow"><span class="lt">${esc(e.t)}</span><span class="tag ${e.a==="حذف"?"r":e.a==="إضافة"?"":"n"}">${esc(e.a)}</span><div class="grow"><b>${esc(e.n)}</b> <span class="note">· ${esc(e.c)}</span></div><span class="note">👤 ${esc(e.u)}</span></div>`).join("")}</div>`).join(""):`<div class="empty">لا توجد عمليات مسجَّلة بعد</div>`,"",true);
}

/* ---------------- recycle bin ---------------- */
async function toTrash(col,obj){if(NOLOG.includes(col)||!obj)return;await put("trash",{id:("t_"+col+"_"+obj.id).slice(0,190),col,data:obj,date:today(),label:String(recLabel(obj)).slice(0,80),by:(CUR&&CUR.name)||ME||""})}
function openTrash(){
  const ts=[...D.trash].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,80);
  modal("🗑️ سلة المحذوفات",`<p class="note">كل ما يُحذف يبقى هنا 60 يومًا ويمكن استرجاعه.</p>`+(ts.length?`<div class="list">${ts.map(t=>`<div class="row"><div class="grow"><div class="nm">${esc(t.label)}</div><div class="mt">${esc(COLN[t.col]||t.col)} · حُذف ${arDate(t.date)}${t.by?" · بواسطة "+esc(t.by):""}</div></div><button class="btn p s" onclick="restoreTrash('${t.id}')">↩︎ استرجاع</button>${can.owner()?`<button class="btn d s" onclick="purgeTrash('${t.id}')">حذف نهائي</button>`:""}</div>`).join("")}</div>`:`<div class="empty">السلة فارغة</div>`),"",true);
}
async function restoreTrash(id){const t=D.trash.find(x=>x.id===id);if(!t)return;try{await put(t.col,t.data);await del("trash",id);logAct("استرجاع",t.col,t.data);toast("✓ تم الاسترجاع");openTrash()}catch(e){saveErr(e)}}
async function purgeTrash(id){try{await del("trash",id);openTrash()}catch(e){saveErr(e)}}
function autoPurge(){if(FS)return;const lim=new Date();lim.setDate(lim.getDate()-60);const l=lim.toISOString().slice(0,10);const before=RAW.trash.length;RAW.trash=RAW.trash.filter(t=>t.date>=l);if(RAW.trash.length!==before)lsSet(lsKey("trash"),RAW.trash);
  const lg=new Date();lg.setDate(lg.getDate()-120);const l2=lg.toISOString().slice(0,10);RAW.logs=RAW.logs.filter(x=>x.date>=l2);lsSet(lsKey("logs"),RAW.logs)}

/* ---------------- idle auto-lock ---------------- */
let lastAct=Date.now();
["pointerdown","keydown","touchstart","wheel"].forEach(ev=>document.addEventListener(ev,()=>{lastAct=Date.now()},{passive:true}));
const lockMin=()=>{const v=lsGet("salam_lockmin",0);return Number(v)};
setInterval(()=>{const m=lockMin();if(!m||!hasPin())return;const lk=$("#lock");if(!lk.classList.contains("hide")||!$("#splash").classList.contains("hide"))return;if(Date.now()-lastAct>m*60000){if(view.dirty)return;SELU=CUR&&CUR.id!=="visitor"?CUR:SELU;showLock("unlock")}},20000);

/* ---------------- encrypted backup ---------------- */
const b64=buf=>btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function deriveKey(pw,salt){const k=await crypto.subtle.importKey("raw",new TextEncoder().encode(pw),"PBKDF2",false,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:150000,hash:"SHA-256"},k,{name:"AES-GCM",length:256},false,["encrypt","decrypt"])}
async function encryptJSON(obj,pw){const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));const key=await deriveKey(pw,salt);
  // chunked base64 to avoid call-stack limits on large data
  const ct=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},key,new TextEncoder().encode(JSON.stringify(obj))));let s="";for(let i=0;i<ct.length;i+=32768)s+=String.fromCharCode(...ct.subarray(i,i+32768));
  return {app:"markaz-salam",enc:1,salt:b64(salt),iv:b64(iv),data:btoa(s),exported:new Date().toISOString()}}
async function decryptJSON(o,pw){const key=await deriveKey(pw,unb64(o.salt));const pt=await crypto.subtle.decrypt({name:"AES-GCM",iv:unb64(o.iv)},key,unb64(o.data));return JSON.parse(new TextDecoder().decode(pt))}
function backupDialog(){
  modal("⬇ نسخة احتياطية",`<p>تحفظ النسخة كل بيانات ${FS?"القسم المسموح لك":"هذا الجهاز"} في ملف واحد.</p>
   <label class="chk"><input type="checkbox" id="bkEnc" checked onchange="$('#bkPwW').style.display=this.checked?'':'none'"> <span class="grow"><b>تشفير بكلمة مرور</b> (موصى به — لا يقرأ الملفَ أحدٌ بدونها)</span></label>
   <div id="bkPwW" class="grid" style="margin-top:8px"><div class="fld"><label>كلمة مرور النسخة (6 أحرف فأكثر)</label><input id="bkPw" type="password" dir="ltr"></div><div class="fld"><label>تأكيدها</label><input id="bkPw2" type="password" dir="ltr"></div></div>
   <p class="note">⚠️ احفظ كلمة المرور في مكان آمن: إن ضاعت لا يمكن فتح النسخة المشفّرة أبدًا.</p>`,
   `<button class="btn p" onclick="doBackup()">⬇ حفظ النسخة</button><button class="btn o" onclick="closeModal()">إلغاء</button>`);
}
async function doBackup(){
  const enc=$("#bkEnc").checked,pw=($("#bkPw")||{}).value||"";
  if(enc&&(pw.length<6||pw!==$("#bkPw2").value)){toast("كلمة المرور قصيرة أو غير متطابقة");return}
  closeModal();await backup(enc?pw:"");
}

/* ---------------- quick actions ---------------- */
function quickActions(){
  const A=[];
  if(can.write())A.push(["plus","تسجيل طالب","go('list',{cat:'students'});setTimeout(()=>openForm('students'),60)"]);
  if(can.daily())A.push(["check","متابعة اليوم","go('daily',{date:today()})"],["award","رصد الدرجات","go('grades')"],["exam","اختبار تحفيظ","examForm()"]);
  if(can.finW())A.push(["wallet","تسجيل دفعة","go('finance',{tab:'fees'})"]);
  if(can.permit())A.push(["bed","إذن خروج","permitForm()"]);
  A.push(["search","بحث","openSearch()"],["printer","التقارير","go('reports')"]);
  return `<div class="qa">${A.map(a=>`<button onclick="${a[2]}"><i>${ICP[a[0]]?ico(a[0],22):a[0]}</i><span>${a[1]}</span></button>`).join("")}</div>`;
}

/* ---------------- mobile bottom bar ---------------- */
function renderBottom(){
  const b=$("#bnav");if(!b)return;if(ROLE==="parent"||ROLE==="none"){b.innerHTML="";return}
  const cur=TOP[view.name]||view.name;
  const items=[["home","home","الرئيسية"],["people","users","الأشخاص"],["daily","check","المتابعة"],["grades","award","الدرجات"]];
  b.innerHTML=items.map(([k,ic,l])=>`<button class="${cur===k?"on":""}" onclick="go('${k}')">${ico(ic,22)}<span>${l}</span></button>`).join("")+`<button onclick="document.body.classList.toggle('menu')">${ico("menu",22)}<span>المزيد</span></button>`;
}

/* ---------------- keyboard ---------------- */
document.addEventListener("keydown",e=>{
  if(!$("#lock").classList.contains("hide"))return;
  if(e.key==="Escape"){if($("#ov"))closeModal();else document.body.classList.remove("menu")}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();openSearch()}
});

/* ---------------- line icons (consistent, crisp) ---------------- */
const ICP={
 home:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
 users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
 book:'<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
 check:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
 exam:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/>',
 award:'<circle cx="12" cy="8" r="6"/><path d="M15.5 13 17 22l-5-3-5 3 1.5-9"/>',
 bed:'<path d="M2 4v16M2 9h17a3 3 0 0 1 3 3v8M2 16h20"/><circle cx="7" cy="12" r="1.6"/>',
 wallet:'<rect x="2" y="5" width="20" height="15" rx="2.5"/><path d="M2 10h20M16 15h2"/>',
 printer:'<path d="M6 9V2h12v7"/><rect x="6" y="14" width="12" height="8" rx="1"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>',
 settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
 globe:'<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>',
 refresh:'<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
 uswitch:'<circle cx="10" cy="8" r="4"/><path d="M2 21v-1a6 6 0 0 1 12 0v1"/><path d="M19 8v6M16 11h6"/>',
 lock:'<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
 logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
 search:'<circle cx="11" cy="11" r="7.5"/><path d="m21 21-4.3-4.3"/>',
 moon:'<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
 plus:'<circle cx="12" cy="12" r="9.5"/><path d="M12 8v8M8 12h8"/>',
 calendar:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
 phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
 menu:'<path d="M3 6h18M3 12h18M3 18h18"/>',
 bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
 chart:'<path d="M3 3v18h18"/><path d="M7 16v-4M12 16V8M17 16v-7"/>',
 kids:'<circle cx="9" cy="7" r="3.5"/><circle cx="17" cy="9" r="2.5"/><path d="M2 21v-1a6 6 0 0 1 12 0v1M14 21v-1a4 4 0 0 1 8 0v1"/>'
};
function ico(n,sz){return `<svg class="ic" width="${sz||20}" height="${sz||20}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICP[n]||""}</svg>`}

/* daily verse for the home banner */
const VERSES=[
 ["وَقُل رَّبِّ زِدْنِي عِلْمًا","سورة طه، الآية 114"],
 ["إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ","سورة الإسراء، الآية 9"],
 ["وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا","سورة المزمل، الآية 4"],
 ["وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ","سورة القمر، الآية 17"],
 ["إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ","سورة الحجر، الآية 9"]
];
const dailyVerse=()=>VERSES[Math.floor(Date.now()/864e5)%VERSES.length];

/* ---------------- Quran picker (surah + ayah range) ---------------- */
const SURAH="الفاتحة:7|البقرة:286|آل عمران:200|النساء:176|المائدة:120|الأنعام:165|الأعراف:206|الأنفال:75|التوبة:129|يونس:109|هود:123|يوسف:111|الرعد:43|إبراهيم:52|الحجر:99|النحل:128|الإسراء:111|الكهف:110|مريم:98|طه:135|الأنبياء:112|الحج:78|المؤمنون:118|النور:64|الفرقان:77|الشعراء:227|النمل:93|القصص:88|العنكبوت:69|الروم:60|لقمان:34|السجدة:30|الأحزاب:73|سبأ:54|فاطر:45|يس:83|الصافات:182|ص:88|الزمر:75|غافر:85|فصلت:54|الشورى:53|الزخرف:89|الدخان:59|الجاثية:37|الأحقاف:35|محمد:38|الفتح:29|الحجرات:18|ق:45|الذاريات:60|الطور:49|النجم:62|القمر:55|الرحمن:78|الواقعة:96|الحديد:29|المجادلة:22|الحشر:24|الممتحنة:13|الصف:14|الجمعة:11|المنافقون:11|التغابن:18|الطلاق:12|التحريم:12|الملك:30|القلم:52|الحاقة:52|المعارج:44|نوح:28|الجن:28|المزمل:20|المدثر:56|القيامة:40|الإنسان:31|المرسلات:50|النبأ:40|النازعات:46|عبس:42|التكوير:29|الانفطار:19|المطففين:36|الانشقاق:25|البروج:22|الطارق:17|الأعلى:19|الغاشية:26|الفجر:30|البلد:20|الشمس:15|الليل:21|الضحى:11|الشرح:8|التين:8|العلق:19|القدر:5|البينة:8|الزلزلة:8|العاديات:11|القارعة:11|التكاثر:8|العصر:3|الهمزة:9|الفيل:5|قريش:4|الماعون:7|الكوثر:3|الكافرون:6|النصر:3|المسد:5|الإخلاص:4|الفلق:5|الناس:6".split("|").map((x,i)=>{const [n,a]=x.split(":");return {i:i+1,n,a:+a}});
const surahBy=n=>SURAH.find(s=>s.n===n);
/* text form kept for reports/portal: "البقرة 1–10" or "الجزء 30" */
function qText(s,f,t,e){if(!s)return "";if(s.startsWith("الجزء"))return s;const a=s+(f?" "+f:"");if(e&&e!==s)return a+" – "+e+(t?" "+t:"");return a+(t&&t!==f?"–"+t:"")}
function surahOptions(sel,withJuz){
  let h=`<option value=""></option><optgroup label="السور">${SURAH.map(s=>`<option value="${s.n}" ${sel===s.n?"selected":""}>${s.i}. ${s.n} (${s.a})</option>`).join("")}</optgroup>`;
  if(withJuz)h+=`<optgroup label="الأجزاء">${Array.from({length:30},(_,i)=>"الجزء "+(i+1)).map(j=>`<option ${sel===j?"selected":""}>${j}</option>`).join("")}</optgroup>`;
  return h;
}
/* one picker block: kind "h" (hifz) or "r" (review) */
function qPicker(sid,kind,r,ro,last){
  const S=r[kind+"s"]||"",F=r[kind+"f"]||"",T=r[kind+"t"]||"",E=r[kind+"e"]||S,isJ=S.startsWith("الجزء"),mf=(surahBy(S)||{}).a||"",mt=(surahBy(E)||{}).a||"";
  const lbl=kind==="h"?"الحفظ الجديد":"المراجعة",dis=ro?"disabled":"";
  return `<div class="qp"><label>${lbl}${last?` <span class="hint">السابق: ${esc(last)}</span>`:""}</label>
   <div class="qrow"><span class="ql">من</span><select ${dis} onchange="qSet('${sid}','${kind}','s',this.value)">${surahOptions(S,kind==="r")}</select>${isJ?"":`<input type="number" min="1" ${mf?`max="${mf}"`:""} placeholder="آية" ${dis} value="${esc(F)}" onchange="qSet('${sid}','${kind}','f',this.value)">`}</div>
   ${isJ||!S?"":`<div class="qrow"><span class="ql">إلى</span><select ${dis} onchange="qSet('${sid}','${kind}','e',this.value)">${surahOptions(E,false)}</select><input type="number" min="1" ${mt?`max="${mt}"`:""} placeholder="آية" ${dis} value="${esc(T)}" onchange="qSet('${sid}','${kind}','t',this.value)"></div>`}</div>`;
}
function qSet(sid,kind,k,v){
  const r=view.edit[sid]=view.edit[sid]||{};
  const sur=surahBy(k==="s"?v:k==="e"?v:k==="t"?(r[kind+"e"]||r[kind+"s"]):r[kind+"s"]);
  if((k==="f"||k==="t")&&v!==""){v=Math.max(1,Math.min(sur?sur.a:999,Number(v)))}
  r[kind+k]=v===""?"":String(v);
  if(k==="s"){r[kind+"e"]=v&&!v.startsWith("الجزء")?v:"";if(!v||v.startsWith("الجزء")){r[kind+"f"]="";r[kind+"t"]=""}else if(kind==="h"){
    const prev=D.daily.filter(d=>d.halaqaId===view.hid&&d.date<view.date&&d.rec&&d.rec[sid]&&(d.rec[sid].he||d.rec[sid].hs)===v).sort((a,b)=>b.date.localeCompare(a.date))[0];
    const nx=prev&&Number(prev.rec[sid].ht)?Number(prev.rec[sid].ht)+1:1;r.hf=String(Math.min(nx,(sur||{}).a||nx));r.ht=""}else{r.rf="";r.rt=""}}
  if(k==="e"&&v!==r[kind+"s"])r[kind+"t"]="";
  if(r[kind+"f"]&&r[kind+"t"]&&(r[kind+"e"]||r[kind+"s"])===r[kind+"s"]&&Number(r[kind+"t"])<Number(r[kind+"f"]))r[kind+"t"]=r[kind+"f"];
  r[kind==="h"?"hifz":"rev"]=qText(r[kind+"s"],r[kind+"f"],r[kind+"t"],r[kind+"e"]);
  view.dirty=true;const y=scrollY;render();scrollTo(0,y);
}

/* ---------------- remove host-injected "Powered by Netlify" badge ---------------- */
(function(){
  const bad=el=>{if(!el||el.nodeType!==1||el.closest&&el.closest("#app,#side,#topbar,.ov,#lock,#splash,#print"))return false;
    const t=(el.tagName||"")+" "+(el.id||"")+" "+(typeof el.className==="string"?el.className:"");
    if(/netlify/i.test(t))return true;
    if(el.tagName==="IFRAME"&&/netlify/i.test(el.src||""))return true;
    const a=el.tagName==="A"?el:null;if(a&&/netlify\.com/i.test(a.href||""))return true;
    const tx=(el.textContent||"").trim();return tx.length<60&&/powered\s*by/i.test(tx)&&/netlify/i.test(tx)};
  const custom=el=>el&&el.tagName&&el.tagName.includes("-")&&!el.closest("#app");
  const shadowBad=el=>{try{return el.shadowRoot&&/netlify/i.test(el.shadowRoot.innerHTML||"")}catch(e){return false}};
  const OWN=new Set(["splash","gate","lock","login","upd","shell","print","rf","app","bnav"]),SAFE=new Set(["SCRIPT","STYLE","LINK","NOSCRIPT","TEMPLATE","HEAD","BODY"]);
  const foreign=el=>!SAFE.has(el.tagName)&&!el.hasAttribute("data-own")&&!OWN.has(el.id)&&!(el.closest&&el.closest("[data-own],#shell"));
  const sweepTop=()=>{if(!document.body)return;[...document.body.children,...document.documentElement.children].forEach(el=>{if(el.tagName==="HEAD"||el.tagName==="BODY")return;if(custom(el)||shadowBad(el)||bad(el)||foreign(el))el.remove()})};
  try{new MutationObserver(sweepTop).observe(document.documentElement,{childList:true});document.addEventListener("DOMContentLoaded",()=>new MutationObserver(sweepTop).observe(document.body,{childList:true}))}catch(e){}
  setInterval(sweepTop,1500);document.addEventListener("DOMContentLoaded",sweepTop);
  const sweep=root=>{sweepTop();(root.querySelectorAll?[root,...root.querySelectorAll("body>*,body>*>*,a[href*='netlify'],iframe,[id*='netlify' i],[class*='netlify' i]")]:[]).forEach(el=>{if(bad(el))el.remove()})};
  const st=document.createElement("style");st.textContent="#netlify-badge,[id*='netlify-badge' i],[class*='netlify-badge' i],a[href*='netlify.com'][style*='fixed'],iframe[src*='netlify']{display:none!important}";document.head.appendChild(st);
  new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1&&n.parentElement===document.body||n.parentElement===document.documentElement){if(bad(n))n.remove();else sweep(n)}}))).observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(()=>sweep(document.body),1500);setTimeout(()=>sweep(document.body),5000);
})();

