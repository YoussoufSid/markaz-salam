"""Smoke test — بيانات تجريبية فقط (لا أسماء حقيقية). Usage: ./test.sh"""
import sys, subprocess, time
from playwright.sync_api import sync_playwright
PORT = 8798
srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
errs = []
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": 1100, "height": 900}, accept_downloads=True)
        pg.on("pageerror", lambda e: errs.append("PAGE: " + str(e)))
        pg.goto(f"http://localhost:{PORT}/index.html"); pg.wait_for_timeout(1500)
        pg.evaluate("['splash','gate','lock'].forEach(i=>{const e=document.getElementById(i);e&&e.classList.add('hide')});localStorage.setItem('salam_tips','9999')")
        r = pg.evaluate("""async()=>{
          const d=n=>{const x=new Date();x.setDate(x.getDate()-n);return x.getFullYear()+'-'+pad2(x.getMonth()+1)+'-'+pad2(x.getDate())};
          await put('halaqat',{id:'h1',name:'حلقة تجريبية',gender:'بنين'});
          for(let i=1;i<=6;i++)await put('people',{id:'s'+i,cat:'students',name:'طالب '+i,halaqa:'حلقة تجريبية',gender:'ذكر',guardianPhone:'70111015',monthlyFee:'5000',start:d(100)});
          await put('people',{id:'t1',cat:'teachers',name:'مدرس',salary:'50000',gender:'ذكر'});
          for(let k=1;k<=8;k++){const rec={};for(let i=1;i<=6;i++)rec['s'+i]={att:(i===1&&k<6)?'غ':'ح',hs:'البقرة',hf:String(k*3-2),he:'البقرة',ht:String(k*3)};await put('daily',{id:'d'+k,date:d(k),halaqaId:'h1',rec})}
          const out={};
          for(const v of Object.keys(TITLES)){if(v==='list'||v==='student'||v==='halaqa'||v==='grades')continue;go(v)}
          go('kpi');out.kpi=document.querySelector('main').innerText.length>50;
          out.risks=allRisks().length;
          planModal();document.querySelector('#plf [name=planH]').value='3';await planSave();
          payModal('s1',monthOf(today()));document.querySelector('#payf [name=amount]').value='12000';document.querySelector('#payf [name=dist]').value='old';await savePay('s1');
          out.fees=D.finance.filter(f=>f.kind==='fee').length;closeModal();
          go('finance',{tab:'sum'});out.sum=document.querySelector('main').innerText.includes('رصيد الصندوق');
          dqModal();out.dq=!!document.querySelector('.md');closeModal();
          bulkWA();out.bw=BW.list.length;closeModal();
          arrearsReport();closeModal();planSheet();payrollSheet();salarySlip('t1',monthOf(today()));
          openPerms();closeModal();openSettings();closeModal();
          termReport();document.querySelector('#trf [name=from]').value=d(30);await termRun();out.term=TERMHTML.length>100;closeModal();
          return out}""")
        print(r)
        assert r["kpi"] and r["risks"] >= 1 and r["fees"] == 3 and r["sum"] and r["dq"] and r["bw"] == 6 and r["term"], "assertion failed"
        b.close()
finally:
    srv.kill()
if errs:
    print("\n".join(errs)); sys.exit(1)
print("OK — smoke test passed")
