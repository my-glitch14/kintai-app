import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import ReportCharts from "./ReportCharts";

const DEFAULT_EMPLOYEES = [
  { id: 1, empNo: "E001", password: "pass001", name: "田中 太郎", dept: "営業部",
    leaveGrants: [{ grantDate: "2024-04-01", days: 10, expiryDate: "2026-03-31" }, { grantDate: "2025-04-01", days: 11, expiryDate: "2027-03-31" }],
    pendingGrant: { grantDate: "2026-04-01", days: 12 } },
  { id: 2, empNo: "E002", password: "pass002", name: "鈴木 花子", dept: "開発部",
    leaveGrants: [{ grantDate: "2024-10-01", days: 8, expiryDate: "2026-09-30" }, { grantDate: "2025-10-01", days: 10, expiryDate: "2027-09-30" }],
    pendingGrant: { grantDate: "2026-10-01", days: 11 } },
  { id: 3, empNo: "E003", password: "pass003", name: "佐藤 次郎", dept: "総務部",
    leaveGrants: [{ grantDate: "2025-01-01", days: 10, expiryDate: "2027-01-01" }],
    pendingGrant: { grantDate: "2026-01-01", days: 11 } },
  { id: 4, empNo: "E004", password: "pass004", name: "山田 美咲", dept: "マーケティング部",
    leaveGrants: [{ grantDate: "2024-07-01", days: 12, expiryDate: "2026-06-30" }, { grantDate: "2025-07-01", days: 14, expiryDate: "2027-06-30" }],
    pendingGrant: { grantDate: "2026-07-01", days: 16 } },
  { id: 5, empNo: "E005", password: "pass005", name: "伊藤 健一", dept: "開発部",
    leaveGrants: [{ grantDate: "2025-06-01", days: 10, expiryDate: "2027-05-31" }],
    pendingGrant: { grantDate: "2026-06-01", days: 11 } },
];

const ADMIN = { empNo: "ADMIN", password: "admin123" };
const DAYS = ["月","火","水","木","金","土","日"];
const today = new Date(); today.setHours(0,0,0,0);
const fmt = d => new Date(d).toLocaleDateString("ja-JP", { year:"numeric", month:"2-digit", day:"2-digit" });
const fmtTime = d => d.toLocaleTimeString("ja-JP", { hour:"2-digit", minute:"2-digit" });
const daysDiff = dateStr => { const d = new Date(dateStr); d.setHours(0,0,0,0); return Math.ceil((d - today) / 86400000); };

function load(key, def) { try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : def; } catch { return def; } }
function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

function loadEmployees() { return load("kintai_employees", DEFAULT_EMPLOYEES); }
function saveEmployees(e) { save("kintai_employees", e); }

function genRecords(employees) {
  const records = {};
  employees.forEach(emp => {
    records[emp.id] = [];
    for (let i = 20; i >= 1; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      const inH = 8 + Math.floor(Math.random()*2), inM = Math.floor(Math.random()*60);
      const outH = 17 + Math.floor(Math.random()*3), outM = Math.floor(Math.random()*60);
      const ci = new Date(d); ci.setHours(inH, inM, 0);
      const co = new Date(d); co.setHours(outH, outM, 0);
      records[emp.id].push({ id: Date.now()+i, date: fmt(d), clockIn: fmtTime(ci), clockOut: fmtTime(co), hours: ((co-ci)/3600000).toFixed(1) });
    }
  });
  return records;
}

function genLeaves() {
  return {
    1: [{ id: 1, date: "2026/03/05", type: "年次有給", reason: "私用", status: "承認済" }],
    2: [{ id: 2, date: "2026/03/10", type: "年次有給", reason: "通院", status: "申請中" }],
    3: [], 4: [{ id: 3, date: "2026/02/20", type: "年次有給", reason: "旅行", status: "承認済" }],
    5: [{ id: 4, date: "2026/03/15", type: "年次有給", reason: "家族の用事", status: "却下" }],
  };
}

function genShifts(employees) {
  const shifts = {};
  employees.forEach(emp => {
    shifts[emp.id] = { 月:"09:00-18:00", 火:"09:00-18:00", 水:"09:00-18:00", 木:"09:00-18:00", 金:"09:00-18:00", 土:"", 日:"" };
  });
  return shifts;
}

function calcLeaveStats(emp, leaves) {
  const usedCount = (leaves[emp.id]||[]).filter(l=>l.status==="承認済").length;
  const totalGranted = emp.leaveGrants.reduce((s,g)=>s+g.days,0);
  return { usedCount, totalGranted, remaining: totalGranted - usedCount };
}

// ── スタイル定数 ─────────────────────────────────────────────────
const th = { textAlign:"left", padding:"12px 16px", color:"#64748b", fontWeight:"600", background:"#f8fafc" };
const cell = (extra={}) => ({ padding:"12px 16px", color:"#1f2937", ...extra });

// ── Login ────────────────────────────────────────────────────────
function LoginScreen({ employees, onLogin }) {
  const [empNo, setEmpNo] = useState(""); const [pw, setPw] = useState(""); const [show, setShow] = useState(false); const [err, setErr] = useState("");
  const login = () => {
    setErr("");
    if (empNo===ADMIN.empNo && pw===ADMIN.password) { onLogin(null,"admin"); return; }
    const emp = employees.find(e=>e.empNo===empNo && e.password===pw);
    emp ? onLogin(emp,"employee") : setErr("従業員番号またはパスワードが正しくありません。");
  };
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#1d4ed8,#1e3a8a)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
      <div style={{background:"white",borderRadius:"16px",boxShadow:"0 20px 60px rgba(0,0,0,0.3)",width:"100%",maxWidth:"380px",padding:"40px"}}>
        <div style={{textAlign:"center",marginBottom:"32px"}}>
          <div style={{fontSize:"48px",marginBottom:"12px"}}>🏢</div>
          <h1 style={{fontSize:"20px",fontWeight:"bold",color:"#1e293b",margin:"0 0 4px"}}>勤怠管理システム</h1>
          <p style={{fontSize:"13px",color:"#94a3b8",margin:0}}>従業員番号とパスワードでログイン</p>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
          <div><label style={{fontSize:"13px",fontWeight:"600",color:"#475569",display:"block",marginBottom:"6px"}}>従業員番号</label>
            <input type="text" placeholder="例：E001" value={empNo} onChange={e=>setEmpNo(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:"8px",padding:"10px 14px",fontSize:"14px",boxSizing:"border-box"}} /></div>
          <div><label style={{fontSize:"13px",fontWeight:"600",color:"#475569",display:"block",marginBottom:"6px"}}>パスワード</label>
            <div style={{position:"relative"}}>
              <input type={show?"text":"password"} placeholder="パスワードを入力" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:"8px",padding:"10px 50px 10px 14px",fontSize:"14px",boxSizing:"border-box"}} />
              <button onClick={()=>setShow(v=>!v)} style={{position:"absolute",right:"12px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#94a3b8",fontSize:"12px",cursor:"pointer"}}>{show?"隠す":"表示"}</button>
            </div></div>
          {err && <p style={{color:"#ef4444",fontSize:"12px",background:"#fef2f2",borderRadius:"6px",padding:"8px 12px",margin:0}}>{err}</p>}
          <button onClick={login} style={{background:"#2563eb",color:"white",border:"none",borderRadius:"8px",padding:"12px",fontSize:"15px",fontWeight:"bold",cursor:"pointer"}}>ログイン</button>
        </div>
        <div style={{marginTop:"24px",background:"#f8fafc",borderRadius:"8px",padding:"12px",fontSize:"12px",color:"#94a3b8"}}>
          <p style={{fontWeight:"600",color:"#64748b",margin:"0 0 4px"}}>デモ用アカウント</p>
          <p style={{margin:"2px 0"}}>従業員：E001〜E005 ／ pass001〜pass005</p>
          <p style={{margin:0}}>管理者：ADMIN ／ admin123</p>
        </div>
      </div>
    </div>
  );
}

// ── LeaveDetail ──────────────────────────────────────────────────
function LeaveDetailPanel({ emp, leaves }) {
  const { usedCount, remaining } = calcLeaveStats(emp, leaves);
  const ng = emp.pendingGrant, dt = daysDiff(ng.grantDate);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
      <div style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",padding:"16px"}}>
        <h3 style={{fontWeight:"600",color:"#1f2937",marginBottom:"12px",marginTop:0}}>🎁 次回有給付与</h3>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#eff6ff",borderRadius:"12px",padding:"16px 20px"}}>
          <div><p style={{fontSize:"12px",color:"#3b82f6",fontWeight:"600",margin:"0 0 4px"}}>付与予定日</p><p style={{fontSize:"15px",fontWeight:"bold",color:"#1e40af",margin:"0 0 2px"}}>{fmt(ng.grantDate)}</p><p style={{fontSize:"12px",color:"#93c5fd",margin:0}}>付与日数：{ng.days}日</p></div>
          <div style={{textAlign:"right"}}><p style={{fontSize:"28px",fontWeight:"bold",color:"#2563eb",margin:0}}>{dt}<span style={{fontSize:"14px",marginLeft:"4px"}}>日後</span></p></div>
        </div>
      </div>
      <div style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",padding:"16px"}}>
        <h3 style={{fontWeight:"600",color:"#1f2937",marginBottom:"12px",marginTop:0}}>📋 付与・消失スケジュール</h3>
        {emp.leaveGrants.map((g,i)=>{
          const dL=daysDiff(g.expiryDate), ex=dL<0, ur=!ex&&dL<=60, wa=!ex&&dL<=180&&dL>60;
          return <div key={i} style={{borderRadius:"12px",border:`2px solid ${ex?"#e5e7eb":ur?"#fca5a5":wa?"#fde047":"#86efac"}`,background:ex?"#f9fafb":ur?"#fef2f2":wa?"#fffbeb":"#f0fdf4",padding:"16px",marginBottom:"12px",opacity:ex?0.6:1}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div><p style={{fontSize:"12px",color:"#6b7280",margin:"0 0 2px"}}>付与日：{fmt(g.grantDate)}</p><p style={{fontSize:"14px",fontWeight:"bold",color:"#1f2937",margin:0}}>付与日数：{g.days}日</p></div>
              <div style={{textAlign:"right"}}><p style={{fontSize:"12px",color:ex?"#9ca3af":ur?"#dc2626":wa?"#ca8a04":"#16a34a",margin:"0 0 2px"}}>消失期限：{fmt(g.expiryDate)}</p>
                {ex?<span style={{fontSize:"12px",background:"#e5e7eb",color:"#6b7280",padding:"2px 8px",borderRadius:"9999px"}}>消失済み</span>
                  :<p style={{fontSize:"18px",fontWeight:"bold",color:ur?"#dc2626":wa?"#ca8a04":"#16a34a",margin:0}}>あと {dL} 日 {ur&&"⚠️"}</p>}
              </div>
            </div>
            {!ex&&<div style={{marginTop:"8px",height:"6px",background:"white",borderRadius:"9999px",overflow:"hidden"}}><div style={{height:"100%",borderRadius:"9999px",background:ur?"#f87171":wa?"#facc15":"#4ade80",width:`${Math.max(3,Math.min(100,(dL/730)*100))}%`}}/></div>}
          </div>;
        })}
      </div>
      <div style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",padding:"16px"}}>
        <h3 style={{fontWeight:"600",color:"#1f2937",marginBottom:"12px",marginTop:0}}>📊 有給サマリー</h3>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"12px"}}>
          {[["付与合計",`${emp.leaveGrants.reduce((s,g)=>s+g.days,0)}日`,"#1f2937"],["取得済み",`${usedCount}日`,"#f97316"],["残日数",`${remaining}日`,"#2563eb"]].map(([l,v,c])=>(
            <div key={l} style={{background:"#f8fafc",borderRadius:"8px",padding:"12px",textAlign:"center"}}><p style={{fontSize:"20px",fontWeight:"bold",color:c,margin:"0 0 4px"}}>{v}</p><p style={{fontSize:"12px",color:"#94a3b8",margin:0}}>{l}</p></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── DeptFilter ───────────────────────────────────────────────────
function DeptFilter({ depts, selected, onChange }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"16px",flexWrap:"wrap"}}>
      <span style={{fontSize:"13px",color:"#64748b",fontWeight:"600"}}>部署：</span>
      {depts.map(d=><button key={d} onClick={()=>onChange(d)} style={{padding:"4px 14px",borderRadius:"9999px",fontSize:"12px",fontWeight:"600",cursor:"pointer",border:"none",background:selected===d?"#2563eb":"#e5e7eb",color:selected===d?"white":"#374151"}}>{d}</button>)}
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────
export default function App() {
  const [employees, setEmployees] = useState(loadEmployees);
  const [authUser, setAuthUser] = useState(null);
  const [authRole, setAuthRole] = useState(null);
  const [records, setRecords] = useState(()=>genRecords(loadEmployees()));
  const [leaves, setLeaves] = useState(genLeaves);
  const [shifts, setShifts] = useState(()=>load("kintai_shifts", genShifts(loadEmployees())));
  const [fixReqs, setFixReqs] = useState(()=>load("kintai_fix", [])); // 打刻修正申請
  const [onlineStatus, setOnlineStatus] = useState({}); // リアルタイム出勤状況
  const [intervalHours, setIntervalHours] = useState(()=>load("kintai_interval",11));
  const [tab, setTab] = useState("dashboard");
  const [clockedIn, setClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState(null);
  const [leaveForm, setLeaveForm] = useState({ date:"", type:"年次有給", reason:"" });
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [fixForm, setFixForm] = useState({ date:"", clockIn:"", clockOut:"", reason:"" });
  const [showFixForm, setShowFixForm] = useState(false);
  const [adminTab, setAdminTab] = useState("realtime");
  const [filterDept, setFilterDept] = useState("すべて");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editPwId, setEditPwId] = useState(null);
  const [newPw, setNewPw] = useState("");
  const [newEmp, setNewEmp] = useState({ empNo:"", password:"", name:"", dept:"", annualLeave:10 });
  const [addError, setAddError] = useState("");
  const [editShiftId, setEditShiftId] = useState(null);

  const updateEmployees = ne => { setEmployees(ne); saveEmployees(ne); };
  const handleLogin = (emp, role) => { setAuthUser(emp); setAuthRole(role); setTab("dashboard"); setFilterDept("すべて"); };
  const handleLogout = () => { setAuthUser(null); setAuthRole(null); setClockedIn(false); setClockInTime(null); };

  // 出勤時にリアルタイム状態を更新
  const clockIn = () => {
    setClockedIn(true); setClockInTime(new Date());
    if (authUser) setOnlineStatus(s=>({...s,[authUser.id]:{ name:authUser.name, dept:authUser.dept, since:fmtTime(new Date()) }}));
  };
  const clockOut = () => {
    setClockedIn(false); setClockInTime(null);
    if (authUser) setOnlineStatus(s=>{ const n={...s}; delete n[authUser.id]; return n; });
  };

  if (!authUser && !authRole) return <LoginScreen employees={employees} onLogin={handleLogin} />;

  const btn = active => ({ padding:"8px 16px", borderRadius:"8px", fontWeight:"600", fontSize:"13px", cursor:"pointer", border:"none", background:active?"#2563eb":"white", color:active?"white":"#4b5563" });

  const submitLeave = () => {
    if (!leaveForm.date||!leaveForm.reason) return;
    setLeaves(l=>({...l,[authUser.id]:[...(l[authUser.id]||[]),{id:Date.now(),...leaveForm,status:"申請中"}]}));
    setLeaveForm({date:"",type:"年次有給",reason:""}); setShowLeaveForm(false);
  };
  const approveLeave = (empId,lvId,status) => setLeaves(l=>({...l,[empId]:l[empId].map(lv=>lv.id===lvId?{...lv,status}:lv)}));

  const submitFix = () => {
    if (!fixForm.date||!fixForm.clockIn||!fixForm.clockOut||!fixForm.reason) return;
    const req = { id:Date.now(), empId:authUser.id, empName:authUser.name, dept:authUser.dept, ...fixForm, status:"申請中" };
    const updated = [...fixReqs, req]; setFixReqs(updated); save("kintai_fix", updated);
    setFixForm({date:"",clockIn:"",clockOut:"",reason:""}); setShowFixForm(false);
  };
  const approveFix = (id, status) => {
    const updated = fixReqs.map(r=>r.id===id?{...r,status}:r); setFixReqs(updated); save("kintai_fix",updated);
  };

  const addEmployee = () => {
    setAddError("");
    if (!newEmp.empNo||!newEmp.password||!newEmp.name||!newEmp.dept){setAddError("すべての項目を入力してください");return;}
    if (employees.find(e=>e.empNo===newEmp.empNo)){setAddError("その従業員番号はすでに使用されています");return;}
    const gd=new Date().toISOString().slice(0,10), ex=new Date(new Date().setFullYear(new Date().getFullYear()+2)).toISOString().slice(0,10), nx=new Date(new Date().setFullYear(new Date().getFullYear()+1)).toISOString().slice(0,10);
    const emp={id:Date.now(),empNo:newEmp.empNo,password:newEmp.password,name:newEmp.name,dept:newEmp.dept,leaveGrants:[{grantDate:gd,days:parseInt(newEmp.annualLeave),expiryDate:ex}],pendingGrant:{grantDate:nx,days:parseInt(newEmp.annualLeave)}};
    const ne=[...employees,emp]; updateEmployees(ne);
    setShifts(s=>{const ns={...s,[emp.id]:{月:"09:00-18:00",火:"09:00-18:00",水:"09:00-18:00",木:"09:00-18:00",金:"09:00-18:00",土:"",日:""}};save("kintai_shifts",ns);return ns;});
    setNewEmp({empNo:"",password:"",name:"",dept:"",annualLeave:10}); setShowAddForm(false); setAddError("");
  };
  const resetPassword = id => { if(!newPw) return; updateEmployees(employees.map(e=>e.id===id?{...e,password:newPw}:e)); setEditPwId(null); setNewPw(""); };
  const deleteEmployee = id => { if(!window.confirm("この従業員を削除しますか？")) return; updateEmployees(employees.filter(e=>e.id!==id)); };

  const saveShift = (empId, day, val) => {
    const ns={...shifts,[empId]:{...shifts[empId],[day]:val}}; setShifts(ns); save("kintai_shifts",ns);
  };

  // インターバルチェック
  const checkInterval = (empId) => {
    const recs = records[empId]||[];
    const alerts = [];
    for (let i=1;i<recs.length;i++) {
      const prev=recs[i-1], cur=recs[i];
      if (!prev.clockOut||!cur.clockIn) continue;
      const prevOut=new Date(`${prev.date.replace(/\//g,"-")} ${prev.clockOut}`);
      const curIn=new Date(`${cur.date.replace(/\//g,"-")} ${cur.clockIn}`);
      const diff=(curIn-prevOut)/3600000;
      if (diff < intervalHours) alerts.push({date:cur.date, interval:diff.toFixed(1)});
    }
    return alerts;
  };

  // エクスポート
  const exportData = (type, format) => {
    let rows=[], filename="";
    if (type==="report") {
      filename="勤務レポート";
      rows=filtered.map(emp=>{
        const recs=records[emp.id]||[], total=recs.reduce((s,r)=>s+parseFloat(r.hours),0), ot=Math.max(0,total-recs.length*8);
        const {usedCount,remaining}=calcLeaveStats(emp,leaves);
        return {従業員番号:emp.empNo,氏名:emp.name,部署:emp.dept,出勤日数:recs.length,総勤務時間:total.toFixed(1),平均勤務時間:recs.length?(total/recs.length).toFixed(1):0,残業時間:ot.toFixed(1),有給取得済み:usedCount,有給残日数:remaining};
      });
    } else {
      filename="勤怠履歴";
      filtered.forEach(emp=>(records[emp.id]||[]).forEach(r=>rows.push({従業員番号:emp.empNo,氏名:emp.name,部署:emp.dept,日付:r.date,出勤時刻:r.clockIn,退勤時刻:r.clockOut,勤務時間:r.hours})));
    }
    if (format==="csv") {
      const bom="\uFEFF", header=Object.keys(rows[0]||{}).join(","), body=rows.map(r=>Object.values(r).join(",")).join("\n");
      saveAs(new Blob([bom+header+"\n"+body],{type:"text/csv;charset=utf-8;"}),`${filename}_${fmt(today)}.csv`);
    } else {
      const ws=XLSX.utils.json_to_sheet(rows), wb=XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb,ws,filename);
      saveAs(new Blob([XLSX.write(wb,{bookType:"xlsx",type:"array"})],{type:"application/octet-stream"}),`${filename}_${fmt(today)}.xlsx`);
    }
  };

  const allDepts=["すべて",...Array.from(new Set(employees.map(e=>e.dept)))];
  const filtered=filterDept==="すべて"?employees:employees.filter(e=>e.dept===filterDept);
  const pendingLeaves=employees.flatMap(emp=>(leaves[emp.id]||[]).filter(l=>l.status==="申請中").map(l=>({...l,emp})));
  const pendingFix=fixReqs.filter(r=>r.status==="申請中");
  const OT=20;
  const empStats=employees.map(emp=>{const recs=records[emp.id]||[],total=recs.reduce((s,r)=>s+parseFloat(r.hours),0);return{emp,recs,total,overtime:Math.max(0,total-recs.length*8)};});
  const alertCount=empStats.filter(e=>e.overtime>=OT).length;

  const Header=({sub,title})=>(
    <header style={{background:"#1d4ed8",color:"white",padding:"16px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 2px 8px rgba(0,0,0,0.2)"}}>
      <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
        <span style={{fontSize:"24px"}}>🏢</span><span style={{fontWeight:"bold",fontSize:"17px"}}>勤怠管理システム</span>
        {sub&&<span style={{background:"#facc15",color:"#713f12",fontSize:"11px",fontWeight:"bold",padding:"2px 8px",borderRadius:"4px"}}>{sub}</span>}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
        {title&&<span style={{fontSize:"13px",opacity:0.8}}>{title}</span>}
        <button onClick={handleLogout} style={{background:"white",color:"#1d4ed8",border:"none",borderRadius:"6px",padding:"6px 14px",fontSize:"13px",fontWeight:"600",cursor:"pointer"}}>ログアウト</button>
      </div>
    </header>
  );

  // ══════════════════════════════════════════════════════════════
  // 従業員画面
  // ══════════════════════════════════════════════════════════════
  if (authRole==="employee" && authUser) {
    const empRecords=records[authUser.id]||[], empLeaves=leaves[authUser.id]||[];
    const {usedCount,remaining}=calcLeaveStats(authUser,leaves);
    const totalHours=empRecords.reduce((s,r)=>s+parseFloat(r.hours),0).toFixed(1);
    const myShift=shifts[authUser.id]||{};
    const myFix=fixReqs.filter(r=>r.empId===authUser.id);
    const intervalAlerts=checkInterval(authUser.id);

    return (
      <div style={{minHeight:"100vh",background:"#f1f5f9",fontFamily:"sans-serif"}}>
        <Header title={`${authUser.empNo}｜${authUser.name}`}/>
        <div style={{maxWidth:"700px",margin:"0 auto",padding:"16px"}}>
          <div style={{display:"flex",gap:"8px",marginBottom:"16px",flexWrap:"wrap"}}>
            {[["dashboard","ダッシュボード"],["attendance","打刻・履歴"],["shift","シフト確認"],["leave","有給申請"],["leaveDetail","有給スケジュール"]].map(([key,label])=>(
              <button key={key} onClick={()=>setTab(key)} style={btn(tab===key)}>{label}</button>
            ))}
          </div>

          {/* ダッシュボード */}
          {tab==="dashboard"&&(
            <div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"12px",marginBottom:"16px"}}>
                {[["出勤日数",`${empRecords.length}日`,"📅","#2563eb"],["今月の勤務時間",`${totalHours}h`,"⏱️","#16a34a"],["有給残日数",`${remaining}日`,"🌴","#ea580c"]].map(([label,val,icon,color])=>(
                  <div key={label} style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",padding:"16px",textAlign:"center"}}>
                    <div style={{fontSize:"24px",marginBottom:"4px"}}>{icon}</div><div style={{fontSize:"22px",fontWeight:"bold",color}}>{val}</div><div style={{fontSize:"11px",color:"#94a3b8",marginTop:"4px"}}>{label}</div>
                  </div>
                ))}
              </div>
              {intervalAlerts.length>0&&<div style={{background:"#fef2f2",border:"1px solid #fca5a5",borderRadius:"12px",padding:"12px",marginBottom:"12px",fontSize:"13px",color:"#b91c1c"}}>
                ⚠️ <strong>勤務間インターバル不足</strong>：{intervalAlerts.map(a=>`${a.date}（${a.interval}時間）`).join("、")} — 基準：{intervalHours}時間
              </div>}
              {authUser.leaveGrants.filter(g=>daysDiff(g.expiryDate)>=0&&daysDiff(g.expiryDate)<=60).map((g,i)=>(
                <div key={i} style={{background:"#fef2f2",border:"1px solid #fca5a5",borderRadius:"12px",padding:"12px",marginBottom:"12px",fontSize:"13px",color:"#b91c1c"}}>⚠️ <strong>{fmt(g.expiryDate)}</strong> に有給 <strong>{g.days}日分</strong> が消失します（あと {daysDiff(g.expiryDate)} 日）</div>
              ))}
              <div style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",padding:"16px"}}>
                <h3 style={{fontWeight:"600",color:"#1f2937",marginBottom:"12px",marginTop:0}}>直近の勤怠</h3>
                <table style={{width:"100%",fontSize:"13px",borderCollapse:"collapse"}}>
                  <thead><tr style={{color:"#94a3b8",borderBottom:"1px solid #e5e7eb"}}>{["日付","出勤","退勤","時間"].map(h=><th key={h} style={{textAlign:"left",paddingBottom:"8px",fontWeight:"600"}}>{h}</th>)}</tr></thead>
                  <tbody>{empRecords.slice(0,5).map((r,i)=><tr key={i} style={{borderBottom:"1px solid #f1f5f9"}}>
                    <td style={{padding:"8px 0",color:"#1f2937"}}>{r.date}</td><td style={{padding:"8px 0",color:"#2563eb"}}>{r.clockIn}</td><td style={{padding:"8px 0",color:"#ef4444"}}>{r.clockOut}</td><td style={{padding:"8px 0",fontWeight:"600",color:"#1f2937"}}>{r.hours}h</td>
                  </tr>)}</tbody>
                </table>
              </div>
            </div>
          )}

          {/* 打刻・履歴 */}
          {tab==="attendance"&&(
            <div>
              <div style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",padding:"24px",marginBottom:"16px",textAlign:"center"}}>
                <p style={{color:"#94a3b8",fontSize:"13px",marginBottom:"16px"}}>現在時刻: {fmtTime(new Date())}</p>
                {!clockedIn
                  ?<button onClick={clockIn} style={{background:"#22c55e",color:"white",border:"none",borderRadius:"16px",padding:"16px 40px",fontSize:"17px",fontWeight:"bold",cursor:"pointer"}}>🟢 出勤</button>
                  :<div><p style={{color:"#16a34a",fontWeight:"600",marginBottom:"12px"}}>出勤中 🟢（{fmtTime(clockInTime)}〜）</p><button onClick={clockOut} style={{background:"#ef4444",color:"white",border:"none",borderRadius:"16px",padding:"16px 40px",fontSize:"17px",fontWeight:"bold",cursor:"pointer"}}>🔴 退勤</button></div>}
              </div>
              {/* 打刻修正申請 */}
              <div style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",padding:"16px",marginBottom:"16px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
                  <h3 style={{fontWeight:"600",color:"#1f2937",margin:0}}>🔧 打刻修正申請</h3>
                  <button onClick={()=>setShowFixForm(v=>!v)} style={{...btn(showFixForm),padding:"6px 14px",fontSize:"12px"}}>{showFixForm?"キャンセル":"＋ 修正申請"}</button>
                </div>
                {showFixForm&&<div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"12px",background:"#f8fafc",borderRadius:"8px",padding:"12px"}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}}>
                    {[["日付","date","date"],["出勤時刻","clockIn","time"],["退勤時刻","clockOut","time"]].map(([l,k,t])=>(
                      <div key={k}><label style={{fontSize:"12px",color:"#475569",display:"block",marginBottom:"3px"}}>{l}</label><input type={t} value={fixForm[k]} onChange={e=>setFixForm(f=>({...f,[k]:e.target.value}))} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:"6px",padding:"6px 10px",fontSize:"12px",boxSizing:"border-box"}}/></div>
                    ))}
                  </div>
                  <div><label style={{fontSize:"12px",color:"#475569",display:"block",marginBottom:"3px"}}>修正理由</label><input type="text" placeholder="例：打ち忘れ" value={fixForm.reason} onChange={e=>setFixForm(f=>({...f,reason:e.target.value}))} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:"6px",padding:"6px 10px",fontSize:"12px",boxSizing:"border-box"}}/></div>
                  <button onClick={submitFix} style={{...btn(true),padding:"8px 20px",alignSelf:"flex-start"}}>申請する</button>
                </div>}
                {myFix.length===0?<p style={{color:"#94a3b8",fontSize:"13px",margin:0}}>修正申請履歴はありません</p>
                  :myFix.map(r=><div key={r.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",border:"1px solid #e5e7eb",borderRadius:"8px",padding:"8px 12px",marginBottom:"6px",fontSize:"13px"}}>
                    <div><span style={{fontWeight:"600",color:"#1f2937"}}>{r.date}</span><span style={{color:"#6b7280",marginLeft:"8px"}}>{r.clockIn}〜{r.clockOut}</span><span style={{color:"#9ca3af",marginLeft:"8px",fontSize:"12px"}}>{r.reason}</span></div>
                    <span style={{padding:"2px 10px",borderRadius:"9999px",fontSize:"12px",fontWeight:"600",background:r.status==="承認済"?"#dcfce7":r.status==="却下"?"#fee2e2":"#fef9c3",color:r.status==="承認済"?"#15803d":r.status==="却下"?"#dc2626":"#a16207"}}>{r.status}</span>
                  </div>)}
              </div>
              <div style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",padding:"16px"}}>
                <h3 style={{fontWeight:"600",color:"#1f2937",marginBottom:"12px",marginTop:0}}>勤怠履歴</h3>
                <div style={{overflowY:"auto",maxHeight:"300px"}}>
                  <table style={{width:"100%",fontSize:"13px",borderCollapse:"collapse"}}>
                    <thead><tr style={{color:"#94a3b8",borderBottom:"1px solid #e5e7eb"}}>{["日付","出勤","退勤","勤務時間"].map(h=><th key={h} style={{textAlign:"left",paddingBottom:"8px",fontWeight:"600"}}>{h}</th>)}</tr></thead>
                    <tbody>{empRecords.map((r,i)=><tr key={i} style={{borderBottom:"1px solid #f1f5f9"}}>
                      <td style={{padding:"8px 0",color:"#1f2937"}}>{r.date}</td><td style={{padding:"8px 0",color:"#2563eb"}}>{r.clockIn}</td><td style={{padding:"8px 0",color:"#ef4444"}}>{r.clockOut}</td><td style={{padding:"8px 0",fontWeight:"600",color:"#1f2937"}}>{r.hours}h</td>
                    </tr>)}</tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* シフト確認 */}
          {tab==="shift"&&(
            <div style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",padding:"16px"}}>
              <h3 style={{fontWeight:"600",color:"#1f2937",marginBottom:"16px",marginTop:0}}>📅 今週のシフト</h3>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"8px"}}>
                {DAYS.map(day=>{
                  const val=myShift[day]||"", isWeekend=day==="土"||day==="日";
                  return <div key={day} style={{textAlign:"center",background:isWeekend?"#f8fafc":"#eff6ff",borderRadius:"10px",padding:"12px 6px"}}>
                    <p style={{fontSize:"13px",fontWeight:"700",color:isWeekend?"#94a3b8":"#1d4ed8",margin:"0 0 6px"}}>{day}</p>
                    {val?<><p style={{fontSize:"12px",color:"#1f2937",margin:"0 0 2px",fontWeight:"600"}}>{val.split("-")[0]}</p><p style={{fontSize:"11px",color:"#6b7280",margin:0}}>〜 {val.split("-")[1]}</p></>
                      :<p style={{fontSize:"12px",color:"#d1d5db",margin:0}}>休み</p>}
                  </div>;
                })}
              </div>
            </div>
          )}

          {/* 有給申請 */}
          {tab==="leave"&&(
            <div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"12px",marginBottom:"16px"}}>
                {[["付与合計",`${authUser.leaveGrants.reduce((s,g)=>s+g.days,0)}日`],["取得済み",`${usedCount}日`],["残日数",`${remaining}日`]].map(([l,v])=>(
                  <div key={l} style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",padding:"12px",textAlign:"center"}}><div style={{fontSize:"18px",fontWeight:"bold",color:"#2563eb"}}>{v}</div><div style={{fontSize:"12px",color:"#94a3b8"}}>{l}</div></div>
                ))}
              </div>
              {!showLeaveForm?<button onClick={()=>setShowLeaveForm(true)} style={{...btn(true),width:"100%",marginBottom:"16px",padding:"12px"}}>＋ 有給申請</button>
                :<div style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",padding:"16px",marginBottom:"16px"}}>
                  <h3 style={{fontWeight:"600",color:"#1f2937",marginBottom:"12px",marginTop:0}}>有給申請</h3>
                  <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                    <div><label style={{fontSize:"13px",color:"#475569",display:"block",marginBottom:"4px"}}>取得日</label><input type="date" value={leaveForm.date} onChange={e=>setLeaveForm(f=>({...f,date:e.target.value}))} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:"6px",padding:"8px 12px",fontSize:"13px",boxSizing:"border-box"}}/></div>
                    <div><label style={{fontSize:"13px",color:"#475569",display:"block",marginBottom:"4px"}}>種別</label><select value={leaveForm.type} onChange={e=>setLeaveForm(f=>({...f,type:e.target.value}))} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:"6px",padding:"8px 12px",fontSize:"13px"}}><option>年次有給</option><option>特別休暇</option><option>慶弔休暇</option></select></div>
                    <div><label style={{fontSize:"13px",color:"#475569",display:"block",marginBottom:"4px"}}>理由</label><input type="text" placeholder="例：通院、私用など" value={leaveForm.reason} onChange={e=>setLeaveForm(f=>({...f,reason:e.target.value}))} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:"6px",padding:"8px 12px",fontSize:"13px",boxSizing:"border-box"}}/></div>
                    <div style={{display:"flex",gap:"8px"}}><button onClick={submitLeave} style={{...btn(true),padding:"10px 20px"}}>申請する</button><button onClick={()=>setShowLeaveForm(false)} style={{...btn(false),padding:"10px 20px"}}>キャンセル</button></div>
                  </div>
                </div>}
              <div style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",padding:"16px"}}>
                <h3 style={{fontWeight:"600",color:"#1f2937",marginBottom:"12px",marginTop:0}}>申請履歴</h3>
                {empLeaves.length===0?<p style={{color:"#94a3b8",fontSize:"13px"}}>申請履歴はありません</p>
                  :empLeaves.map(lv=><div key={lv.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",border:"1px solid #e5e7eb",borderRadius:"8px",padding:"10px 14px",fontSize:"13px",marginBottom:"8px"}}>
                    <div><span style={{fontWeight:"600",color:"#1f2937"}}>{lv.date}</span><span style={{color:"#6b7280",marginLeft:"8px"}}>{lv.type}</span><span style={{color:"#9ca3af",marginLeft:"8px",fontSize:"12px"}}>{lv.reason}</span></div>
                    <span style={{padding:"2px 10px",borderRadius:"9999px",fontSize:"12px",fontWeight:"600",background:lv.status==="承認済"?"#dcfce7":lv.status==="却下"?"#fee2e2":"#fef9c3",color:lv.status==="承認済"?"#15803d":lv.status==="却下"?"#dc2626":"#a16207"}}>{lv.status}</span>
                  </div>)}
              </div>
            </div>
          )}

          {tab==="leaveDetail"&&<LeaveDetailPanel emp={authUser} leaves={leaves}/>}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // 管理者画面
  // ══════════════════════════════════════════════════════════════
  return (
    <div style={{minHeight:"100vh",background:"#f1f5f9",fontFamily:"sans-serif"}}>
      <Header sub="管理者"/>
      <div style={{maxWidth:"960px",margin:"0 auto",padding:"16px"}}>
        <div style={{display:"flex",gap:"8px",marginBottom:"16px",flexWrap:"wrap"}}>
          {[["realtime","🟢 出勤状況"],["employees","従業員管理"],["shifts","シフト管理"],["leaves","有給申請"],["fixreqs","打刻修正"],["report","勤務レポート"],["leaveSchedule","有給スケジュール"]].map(([key,label])=>(
            <button key={key} onClick={()=>setAdminTab(key)} style={{...btn(adminTab===key),position:"relative"}}>
              {label}
              {key==="fixreqs"&&pendingFix.length>0&&<span style={{position:"absolute",top:"-6px",right:"-6px",background:"#ef4444",color:"white",fontSize:"10px",fontWeight:"bold",borderRadius:"9999px",padding:"1px 5px"}}>{pendingFix.length}</span>}
            </button>
          ))}
        </div>
        <DeptFilter depts={allDepts} selected={filterDept} onChange={setFilterDept}/>

        {/* ① リアルタイム出勤状況 */}
        {adminTab==="realtime"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"12px",marginBottom:"16px"}}>
              {[["現在出勤中",`${Object.keys(onlineStatus).length}名`,"🟢"],["本日の従業員数",`${employees.length}名`,"👥"],["承認待ち",`${pendingLeaves.length+pendingFix.length}件`,"📋"]].map(([l,v,icon])=>(
                <div key={l} style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",padding:"16px",textAlign:"center"}}>
                  <div style={{fontSize:"24px",marginBottom:"4px"}}>{icon}</div><div style={{fontSize:"22px",fontWeight:"bold",color:"#2563eb"}}>{v}</div><div style={{fontSize:"11px",color:"#94a3b8",marginTop:"4px"}}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",padding:"16px"}}>
              <h3 style={{fontWeight:"600",color:"#1f2937",marginBottom:"12px",marginTop:0}}>🟢 現在出勤中の従業員</h3>
              {Object.keys(onlineStatus).length===0
                ?<p style={{color:"#94a3b8",fontSize:"13px"}}>現在出勤中の従業員はいません</p>
                :Object.entries(onlineStatus).map(([id,info])=>(
                  <div key={id} style={{display:"flex",alignItems:"center",gap:"12px",border:"1px solid #dcfce7",background:"#f0fdf4",borderRadius:"8px",padding:"12px 16px",marginBottom:"8px"}}>
                    <span style={{width:"10px",height:"10px",borderRadius:"50%",background:"#22c55e",display:"inline-block"}}></span>
                    <span style={{fontWeight:"700",color:"#1f2937"}}>{info.name}</span>
                    <span style={{color:"#6b7280",fontSize:"13px"}}>{info.dept}</span>
                    <span style={{color:"#16a34a",fontSize:"13px",marginLeft:"auto"}}>出勤中（{info.since}〜）</span>
                  </div>
                ))}
            </div>
            <div style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",padding:"16px",marginTop:"16px"}}>
              <h3 style={{fontWeight:"600",color:"#1f2937",marginBottom:"12px",marginTop:0}}>⚙️ インターバル基準時間の設定</h3>
              <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                <span style={{fontSize:"13px",color:"#475569"}}>勤務間インターバル基準：</span>
                <input type="number" value={intervalHours} min="1" max="24" onChange={e=>{const v=parseInt(e.target.value);setIntervalHours(v);save("kintai_interval",v);}} style={{width:"70px",border:"1px solid #e2e8f0",borderRadius:"6px",padding:"6px 10px",fontSize:"14px",fontWeight:"bold"}}/>
                <span style={{fontSize:"13px",color:"#475569"}}>時間</span>
                <span style={{fontSize:"12px",color:"#94a3b8"}}>（この時間未満の場合にアラート表示）</span>
              </div>
            </div>
          </div>
        )}

        {/* 従業員管理 */}
        {adminTab==="employees"&&(
          <div>
            <button onClick={()=>setShowAddForm(v=>!v)} style={{...btn(showAddForm),marginBottom:"16px",padding:"10px 20px"}}>{showAddForm?"✕ キャンセル":"＋ 従業員を追加"}</button>
            {showAddForm&&<div style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",padding:"20px",marginBottom:"16px"}}>
              <h3 style={{fontWeight:"600",color:"#1f2937",marginTop:0,marginBottom:"16px"}}>新しい従業員を追加</h3>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                {[["従業員番号","empNo","text","例：E006"],["パスワード（初期）","password","password","初期パスワード"],["氏名","name","text","例：山本 一郎"],["部署","dept","text","例：営業部"]].map(([label,key,type,ph])=>(
                  <div key={key}><label style={{fontSize:"13px",color:"#475569",display:"block",marginBottom:"4px"}}>{label}</label><input type={type} placeholder={ph} value={newEmp[key]} onChange={e=>setNewEmp(f=>({...f,[key]:e.target.value}))} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:"6px",padding:"8px 12px",fontSize:"13px",boxSizing:"border-box"}}/></div>
                ))}
                <div><label style={{fontSize:"13px",color:"#475569",display:"block",marginBottom:"4px"}}>年次有給付与日数</label><input type="number" value={newEmp.annualLeave} onChange={e=>setNewEmp(f=>({...f,annualLeave:e.target.value}))} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:"6px",padding:"8px 12px",fontSize:"13px",boxSizing:"border-box"}}/></div>
              </div>
              {addError&&<p style={{color:"#ef4444",fontSize:"12px",margin:"8px 0 0"}}>{addError}</p>}
              <button onClick={addEmployee} style={{...btn(true),marginTop:"16px",padding:"10px 24px"}}>追加する</button>
            </div>}
            <div style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",overflow:"auto"}}>
              <table style={{width:"100%",fontSize:"13px",borderCollapse:"collapse",minWidth:"600px"}}>
                <thead><tr>{["従業員番号","氏名","部署","有給残日数","パスワード変更","削除"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>{filtered.map(emp=>{
                  const {remaining}=calcLeaveStats(emp,leaves);
                  return <tr key={emp.id} style={{borderTop:"1px solid #f1f5f9"}}>
                    <td style={cell({color:"#94a3b8",fontFamily:"monospace"})}>{emp.empNo}</td>
                    <td style={cell({fontWeight:"700"})}>{emp.name}</td>
                    <td style={cell({color:"#6b7280"})}>{emp.dept}</td>
                    <td style={cell({fontWeight:"bold",color:"#2563eb"})}>{remaining}日</td>
                    <td style={cell()}>{editPwId===emp.id
                      ?<div style={{display:"flex",gap:"6px",alignItems:"center"}}><input type="password" placeholder="新しいパスワード" value={newPw} onChange={e=>setNewPw(e.target.value)} style={{border:"1px solid #e2e8f0",borderRadius:"6px",padding:"4px 8px",fontSize:"12px",width:"140px"}}/><button onClick={()=>resetPassword(emp.id)} style={{background:"#2563eb",color:"white",border:"none",borderRadius:"6px",padding:"4px 10px",fontSize:"12px",cursor:"pointer"}}>保存</button><button onClick={()=>{setEditPwId(null);setNewPw("");}} style={{background:"#e5e7eb",color:"#374151",border:"none",borderRadius:"6px",padding:"4px 10px",fontSize:"12px",cursor:"pointer"}}>✕</button></div>
                      :<button onClick={()=>setEditPwId(emp.id)} style={{background:"#f1f5f9",color:"#374151",border:"none",borderRadius:"6px",padding:"4px 12px",fontSize:"12px",cursor:"pointer"}}>🔑 変更</button>}</td>
                    <td style={cell()}><button onClick={()=>deleteEmployee(emp.id)} style={{background:"#fee2e2",color:"#dc2626",border:"none",borderRadius:"6px",padding:"4px 12px",fontSize:"12px",cursor:"pointer"}}>🗑️ 削除</button></td>
                  </tr>;
                })}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* ② シフト管理 */}
        {adminTab==="shifts"&&(
          <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
            {filtered.map(emp=>(
              <div key={emp.id} style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",padding:"16px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
                  <div><span style={{fontWeight:"700",color:"#1f2937",fontSize:"14px"}}>{emp.name}</span><span style={{color:"#94a3b8",fontSize:"12px",marginLeft:"8px"}}>{emp.dept}</span></div>
                  <button onClick={()=>setEditShiftId(editShiftId===emp.id?null:emp.id)} style={{...btn(editShiftId===emp.id),padding:"5px 14px",fontSize:"12px"}}>{editShiftId===emp.id?"✓ 保存":"✏️ 編集"}</button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"6px"}}>
                  {DAYS.map(day=>{
                    const val=(shifts[emp.id]||{})[day]||"", isWeekend=day==="土"||day==="日";
                    return <div key={day} style={{textAlign:"center",background:isWeekend?"#f8fafc":"#eff6ff",borderRadius:"8px",padding:"8px 4px"}}>
                      <p style={{fontSize:"12px",fontWeight:"700",color:isWeekend?"#94a3b8":"#1d4ed8",margin:"0 0 4px"}}>{day}</p>
                      {editShiftId===emp.id
                        ?<input type="text" value={val} onChange={e=>saveShift(emp.id,day,e.target.value)} placeholder="09:00-18:00" style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:"4px",padding:"3px 4px",fontSize:"10px",textAlign:"center",boxSizing:"border-box"}}/>
                        :val?<p style={{fontSize:"11px",color:"#1f2937",margin:0,fontWeight:"600"}}>{val}</p>:<p style={{fontSize:"11px",color:"#d1d5db",margin:0}}>休み</p>}
                    </div>;
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 有給申請管理 */}
        {adminTab==="leaves"&&(
          <div>
            {pendingLeaves.filter(l=>filterDept==="すべて"||l.emp.dept===filterDept).length>0&&<div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:"12px",padding:"12px 16px",marginBottom:"16px",fontSize:"13px",color:"#92400e"}}>📋 承認待ち <strong>{pendingLeaves.filter(l=>filterDept==="すべて"||l.emp.dept===filterDept).length}件</strong></div>}
            <div style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",overflow:"auto"}}>
              <table style={{width:"100%",fontSize:"13px",borderCollapse:"collapse",minWidth:"600px"}}>
                <thead><tr>{["従業員","部署","日付","種別","理由","操作"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>{filtered.flatMap(emp=>(leaves[emp.id]||[]).map(lv=>(
                  <tr key={lv.id} style={{borderTop:"1px solid #f1f5f9"}}>
                    <td style={cell({fontWeight:"700"})}>{emp.name}</td><td style={cell({color:"#6b7280"})}>{emp.dept}</td><td style={cell()}>{lv.date}</td><td style={cell()}>{lv.type}</td><td style={cell({color:"#6b7280"})}>{lv.reason}</td>
                    <td style={cell()}>{lv.status==="申請中"?<div style={{display:"flex",gap:"6px"}}><button onClick={()=>approveLeave(emp.id,lv.id,"承認済")} style={{background:"#22c55e",color:"white",border:"none",borderRadius:"6px",padding:"4px 10px",fontSize:"12px",cursor:"pointer"}}>承認</button><button onClick={()=>approveLeave(emp.id,lv.id,"却下")} style={{background:"#f87171",color:"white",border:"none",borderRadius:"6px",padding:"4px 10px",fontSize:"12px",cursor:"pointer"}}>却下</button></div>:<span style={{padding:"2px 10px",borderRadius:"9999px",fontSize:"12px",fontWeight:"600",background:lv.status==="承認済"?"#dcfce7":"#fee2e2",color:lv.status==="承認済"?"#15803d":"#dc2626"}}>{lv.status}</span>}</td>
                  </tr>
                )))}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* ③ 打刻修正申請管理 */}
        {adminTab==="fixreqs"&&(
          <div>
            {pendingFix.length>0&&<div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:"12px",padding:"12px 16px",marginBottom:"16px",fontSize:"13px",color:"#92400e"}}>🔧 承認待ちの修正申請が <strong>{pendingFix.length}件</strong> あります</div>}
            <div style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",overflow:"auto"}}>
              <table style={{width:"100%",fontSize:"13px",borderCollapse:"collapse",minWidth:"600px"}}>
                <thead><tr>{["従業員","部署","日付","修正後出勤","修正後退勤","理由","操作"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>{fixReqs.filter(r=>filterDept==="すべて"||r.dept===filterDept).map(r=>(
                  <tr key={r.id} style={{borderTop:"1px solid #f1f5f9"}}>
                    <td style={cell({fontWeight:"700"})}>{r.empName}</td><td style={cell({color:"#6b7280"})}>{r.dept}</td><td style={cell()}>{r.date}</td><td style={cell({color:"#2563eb"})}>{r.clockIn}</td><td style={cell({color:"#ef4444"})}>{r.clockOut}</td><td style={cell({color:"#6b7280"})}>{r.reason}</td>
                    <td style={cell()}>{r.status==="申請中"?<div style={{display:"flex",gap:"6px"}}><button onClick={()=>approveFix(r.id,"承認済")} style={{background:"#22c55e",color:"white",border:"none",borderRadius:"6px",padding:"4px 10px",fontSize:"12px",cursor:"pointer"}}>承認</button><button onClick={()=>approveFix(r.id,"却下")} style={{background:"#f87171",color:"white",border:"none",borderRadius:"6px",padding:"4px 10px",fontSize:"12px",cursor:"pointer"}}>却下</button></div>:<span style={{padding:"2px 10px",borderRadius:"9999px",fontSize:"12px",fontWeight:"600",background:r.status==="承認済"?"#dcfce7":"#fee2e2",color:r.status==="承認済"?"#15803d":"#dc2626"}}>{r.status}</span>}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* 勤務レポート */}
        {adminTab==="report"&&(
          <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
            <div style={{display:"flex",gap:"8px",flexWrap:"wrap",padding:"4px 0"}}>
              <span style={{fontSize:"13px",color:"#64748b",fontWeight:"600",alignSelf:"center"}}>勤務レポート：</span>
              <button onClick={()=>exportData("report","xlsx")} style={{background:"#16a34a",color:"white",border:"none",borderRadius:"8px",padding:"8px 16px",fontSize:"13px",fontWeight:"600",cursor:"pointer"}}>📥 Excel</button>
              <button onClick={()=>exportData("report","csv")} style={{background:"#0891b2",color:"white",border:"none",borderRadius:"8px",padding:"8px 16px",fontSize:"13px",fontWeight:"600",cursor:"pointer"}}>📥 CSV</button>
              <span style={{fontSize:"13px",color:"#64748b",fontWeight:"600",alignSelf:"center",marginLeft:"8px"}}>勤怠履歴：</span>
              <button onClick={()=>exportData("attendance","xlsx")} style={{background:"#16a34a",color:"white",border:"none",borderRadius:"8px",padding:"8px 16px",fontSize:"13px",fontWeight:"600",cursor:"pointer"}}>📥 Excel</button>
              <button onClick={()=>exportData("attendance","csv")} style={{background:"#0891b2",color:"white",border:"none",borderRadius:"8px",padding:"8px 16px",fontSize:"13px",fontWeight:"600",cursor:"pointer"}}>📥 CSV</button>
            </div>
            <ReportCharts/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"12px"}}>
              {[["総従業員数",`${filtered.length}名`,"👥",false],["承認待ち申請",`${pendingLeaves.filter(l=>filterDept==="すべて"||l.emp.dept===filterDept).length}件`,"📋",false],["残業アラート",`${empStats.filter(e=>(filterDept==="すべて"||e.emp.dept===filterDept)&&e.overtime>=OT).length}名`,"🚨",alertCount>0]].map(([l,v,icon,alert])=>(
                <div key={l} style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",padding:"16px",textAlign:"center",border:alert?"2px solid #fca5a5":"2px solid transparent"}}>
                  <div style={{fontSize:"24px",marginBottom:"4px"}}>{icon}</div><div style={{fontSize:"22px",fontWeight:"bold",color:alert?"#dc2626":"#2563eb"}}>{v}</div><div style={{fontSize:"11px",color:"#94a3b8",marginTop:"4px"}}>{l}</div>
                </div>
              ))}
            </div>
            {empStats.filter(e=>(filterDept==="すべて"||e.emp.dept===filterDept)&&e.overtime>=OT).length>0&&(
              <div style={{background:"#fef2f2",border:"1px solid #fca5a5",borderRadius:"12px",padding:"16px"}}>
                <h3 style={{fontWeight:"600",color:"#b91c1c",marginBottom:"12px",marginTop:0}}>🚨 残業アラート（基準：{OT}時間超）</h3>
                {empStats.filter(e=>(filterDept==="すべて"||e.emp.dept===filterDept)&&e.overtime>=OT).sort((a,b)=>b.overtime-a.overtime).map(({emp,recs,total,overtime})=>{
                  const sv=overtime>=OT*2;
                  return <div key={emp.id} style={{borderRadius:"10px",border:`1px solid ${sv?"#f87171":"#fca5a5"}`,background:sv?"#fee2e2":"white",padding:"14px 16px",marginBottom:"10px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
                      <div><span style={{fontWeight:"700",color:"#1f2937"}}>{emp.name}</span><span style={{color:"#9ca3af",fontSize:"12px",marginLeft:"8px"}}>{emp.dept}</span></div>
                      <div style={{display:"flex",alignItems:"center",gap:"8px"}}><span style={{fontSize:"17px",fontWeight:"bold",color:sv?"#b91c1c":"#ef4444"}}>+{overtime.toFixed(1)}h超過</span>{sv&&<span style={{background:"#dc2626",color:"white",fontSize:"11px",padding:"2px 8px",borderRadius:"9999px"}}>⚠️ 要対応</span>}</div>
                    </div>
                    <div style={{height:"6px",background:"#fecaca",borderRadius:"9999px",overflow:"hidden"}}><div style={{height:"100%",borderRadius:"9999px",background:sv?"#dc2626":"#f87171",width:`${Math.min(100,(overtime/OT)*100)}%`}}/></div>
                    <p style={{fontSize:"12px",color:"#9ca3af",margin:"6px 0 0"}}>総勤務時間 {total.toFixed(1)}h ／ 出勤 {recs.length}日</p>
                  </div>;
                })}
              </div>
            )}
            <div style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",padding:"16px",overflow:"auto"}}>
              <h3 style={{fontWeight:"600",color:"#1f2937",marginBottom:"12px",marginTop:0}}>従業員別 勤務時間サマリー</h3>
              <table style={{width:"100%",fontSize:"13px",borderCollapse:"collapse",minWidth:"500px"}}>
                <thead><tr style={{borderBottom:"1px solid #e5e7eb"}}>{["氏名","出勤日数","総勤務時間","平均/日","残業時間","インターバル","状態"].map(h=><th key={h} style={{...th,background:"transparent",padding:"0 0 8px"}}>{h}</th>)}</tr></thead>
                <tbody>{empStats.filter(e=>filterDept==="すべて"||e.emp.dept===filterDept).map(({emp,recs,total,overtime})=>{
                  const isAlert=overtime>=OT, isSevere=overtime>=OT*2, ivAlerts=checkInterval(emp.id);
                  return <tr key={emp.id} style={{borderBottom:"1px solid #f1f5f9",background:isSevere?"#fef2f2":isAlert?"#fff7ed":"white"}}>
                    <td style={{padding:"10px 0",fontWeight:"700",color:"#1f2937"}}>{emp.name}</td>
                    <td style={{padding:"10px 0",color:"#1f2937"}}>{recs.length}日</td>
                    <td style={{padding:"10px 0",color:"#1f2937"}}>{total.toFixed(1)}h</td>
                    <td style={{padding:"10px 0",color:"#2563eb"}}>{recs.length?(total/recs.length).toFixed(1):"—"}h</td>
                    <td style={{padding:"10px 0",fontWeight:"bold",color:isSevere?"#dc2626":isAlert?"#ea580c":"#94a3b8"}}>{overtime>0?`+${overtime.toFixed(1)}h`:"—"}</td>
                    <td style={{padding:"10px 0"}}>{ivAlerts.length>0?<span style={{background:"#fef9c3",color:"#a16207",fontSize:"11px",padding:"2px 8px",borderRadius:"9999px",fontWeight:"600"}}>⚠️ {ivAlerts.length}件</span>:<span style={{color:"#94a3b8",fontSize:"12px"}}>正常</span>}</td>
                    <td style={{padding:"10px 0"}}><span style={{padding:"2px 10px",borderRadius:"9999px",fontSize:"12px",fontWeight:"600",background:isSevere?"#fee2e2":isAlert?"#ffedd5":"#dcfce7",color:isSevere?"#dc2626":isAlert?"#ea580c":"#16a34a"}}>{isSevere?"要対応":isAlert?"アラート":"正常"}</span></td>
                  </tr>;
                })}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* 有給スケジュール */}
        {adminTab==="leaveSchedule"&&(
          <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
            <div style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",padding:"16px"}}>
              <h3 style={{fontWeight:"600",color:"#1f2937",marginBottom:"12px",marginTop:0}}>⚠️ 有給消失アラート（60日以内）</h3>
              {(()=>{const items=filtered.flatMap(emp=>emp.leaveGrants.filter(g=>daysDiff(g.expiryDate)>=0&&daysDiff(g.expiryDate)<=60).map((g,i)=>(<div key={`${emp.id}-${i}`} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#fef2f2",border:"1px solid #fca5a5",borderRadius:"8px",padding:"12px 16px",marginBottom:"8px"}}><div><p style={{fontWeight:"700",color:"#1f2937",margin:"0 0 2px"}}>{emp.name} <span style={{color:"#9ca3af",fontSize:"12px",fontWeight:"400"}}>{emp.dept}</span></p><p style={{fontSize:"12px",color:"#dc2626",margin:0}}>消失日：{fmt(g.expiryDate)}　消失日数：{g.days}日</p></div><span style={{fontWeight:"bold",color:"#dc2626",fontSize:"17px"}}>あと {daysDiff(g.expiryDate)} 日</span></div>)));return items.length?items:<p style={{color:"#94a3b8",fontSize:"13px"}}>60日以内に消失する有給はありません</p>;})()}
            </div>
            <div style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",padding:"16px",overflow:"auto"}}>
              <h3 style={{fontWeight:"600",color:"#1f2937",marginBottom:"12px",marginTop:0}}>🎁 今後の有給付与スケジュール</h3>
              <table style={{width:"100%",fontSize:"13px",borderCollapse:"collapse",minWidth:"400px"}}>
                <thead><tr style={{borderBottom:"1px solid #e5e7eb"}}>{["氏名","部署","付与予定日","付与日数","あと"].map(h=><th key={h} style={{...th,background:"transparent",padding:"0 0 8px"}}>{h}</th>)}</tr></thead>
                <tbody>{[...filtered].sort((a,b)=>daysDiff(a.pendingGrant.grantDate)-daysDiff(b.pendingGrant.grantDate)).map(emp=>(
                  <tr key={emp.id} style={{borderBottom:"1px solid #f1f5f9"}}>
                    <td style={{padding:"10px 0",fontWeight:"700",color:"#1f2937"}}>{emp.name}</td><td style={{padding:"10px 0",color:"#6b7280"}}>{emp.dept}</td><td style={{padding:"10px 0",color:"#1f2937"}}>{fmt(emp.pendingGrant.grantDate)}</td><td style={{padding:"10px 0",fontWeight:"bold",color:"#2563eb"}}>{emp.pendingGrant.days}日</td><td style={{padding:"10px 0",color:"#6b7280"}}>{daysDiff(emp.pendingGrant.grantDate)}日後</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
