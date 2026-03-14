import { useState } from "react";
import ReportCharts from "./ReportCharts";

const DEFAULT_EMPLOYEES = [
  { id: 1, empNo: "E001", password: "pass001", name: "田中 太郎", dept: "営業部",
    leaveGrants: [
      { grantDate: "2024-04-01", days: 10, expiryDate: "2026-03-31" },
      { grantDate: "2025-04-01", days: 11, expiryDate: "2027-03-31" },
    ],
    pendingGrant: { grantDate: "2026-04-01", days: 12 },
  },
  { id: 2, empNo: "E002", password: "pass002", name: "鈴木 花子", dept: "開発部",
    leaveGrants: [
      { grantDate: "2024-10-01", days: 8, expiryDate: "2026-09-30" },
      { grantDate: "2025-10-01", days: 10, expiryDate: "2027-09-30" },
    ],
    pendingGrant: { grantDate: "2026-10-01", days: 11 },
  },
  { id: 3, empNo: "E003", password: "pass003", name: "佐藤 次郎", dept: "総務部",
    leaveGrants: [{ grantDate: "2025-01-01", days: 10, expiryDate: "2027-01-01" }],
    pendingGrant: { grantDate: "2026-01-01", days: 11 },
  },
  { id: 4, empNo: "E004", password: "pass004", name: "山田 美咲", dept: "マーケティング部",
    leaveGrants: [
      { grantDate: "2024-07-01", days: 12, expiryDate: "2026-06-30" },
      { grantDate: "2025-07-01", days: 14, expiryDate: "2027-06-30" },
    ],
    pendingGrant: { grantDate: "2026-07-01", days: 16 },
  },
  { id: 5, empNo: "E005", password: "pass005", name: "伊藤 健一", dept: "開発部",
    leaveGrants: [{ grantDate: "2025-06-01", days: 10, expiryDate: "2027-05-31" }],
    pendingGrant: { grantDate: "2026-06-01", days: 11 },
  },
];

const ADMIN = { empNo: "ADMIN", password: "admin123" };
const today = new Date(); today.setHours(0,0,0,0);
const fmt = d => new Date(d).toLocaleDateString("ja-JP", { year:"numeric", month:"2-digit", day:"2-digit" });
const fmtTime = d => d.toLocaleTimeString("ja-JP", { hour:"2-digit", minute:"2-digit" });
const daysDiff = dateStr => { const d = new Date(dateStr); d.setHours(0,0,0,0); return Math.ceil((d - today) / 86400000); };

function loadEmployees() {
  try { const s = localStorage.getItem("kintai_employees"); return s ? JSON.parse(s) : DEFAULT_EMPLOYEES; }
  catch { return DEFAULT_EMPLOYEES; }
}
function saveEmployees(emps) {
  try { localStorage.setItem("kintai_employees", JSON.stringify(emps)); } catch {}
}

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
      records[emp.id].push({ date: fmt(d), clockIn: fmtTime(ci), clockOut: fmtTime(co), hours: ((co-ci)/3600000).toFixed(1) });
    }
  });
  return records;
}

function genLeaves() {
  return {
    1: [{ id: 1, date: "2026/03/05", type: "年次有給", reason: "私用", status: "承認済" }],
    2: [{ id: 2, date: "2026/03/10", type: "年次有給", reason: "通院", status: "申請中" }],
    3: [],
    4: [{ id: 3, date: "2026/02/20", type: "年次有給", reason: "旅行", status: "承認済" }],
    5: [{ id: 4, date: "2026/03/15", type: "年次有給", reason: "家族の用事", status: "却下" }],
  };
}

function calcLeaveStats(emp, leaves) {
  const usedCount = (leaves[emp.id] || []).filter(l => l.status === "承認済").length;
  const totalGranted = emp.leaveGrants.reduce((s, g) => s + g.days, 0);
  return { usedCount, totalGranted, remaining: totalGranted - usedCount };
}

const cell = (extra = {}) => ({ padding: "12px 16px", color: "#1f2937", ...extra });
const th = { textAlign: "left", padding: "12px 16px", color: "#64748b", fontWeight: "600", background: "#f8fafc" };

// ─── Login ───────────────────────────────────────────────────────
function LoginScreen({ employees, onLogin }) {
  const [empNo, setEmpNo] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = () => {
    setError("");
    if (empNo === ADMIN.empNo && password === ADMIN.password) { onLogin(null, "admin"); return; }
    const emp = employees.find(e => e.empNo === empNo && e.password === password);
    emp ? onLogin(emp, "employee") : setError("従業員番号またはパスワードが正しくありません。");
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
          <div>
            <label style={{fontSize:"13px",fontWeight:"600",color:"#475569",display:"block",marginBottom:"6px"}}>従業員番号</label>
            <input type="text" placeholder="例：E001" value={empNo} onChange={e=>setEmpNo(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}
              style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:"8px",padding:"10px 14px",fontSize:"14px",boxSizing:"border-box"}} />
          </div>
          <div>
            <label style={{fontSize:"13px",fontWeight:"600",color:"#475569",display:"block",marginBottom:"6px"}}>パスワード</label>
            <div style={{position:"relative"}}>
              <input type={showPw?"text":"password"} placeholder="パスワードを入力" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:"8px",padding:"10px 50px 10px 14px",fontSize:"14px",boxSizing:"border-box"}} />
              <button onClick={()=>setShowPw(v=>!v)} style={{position:"absolute",right:"12px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#94a3b8",fontSize:"12px",cursor:"pointer"}}>{showPw?"隠す":"表示"}</button>
            </div>
          </div>
          {error && <p style={{color:"#ef4444",fontSize:"12px",background:"#fef2f2",borderRadius:"6px",padding:"8px 12px",margin:0}}>{error}</p>}
          <button onClick={handleLogin} style={{background:"#2563eb",color:"white",border:"none",borderRadius:"8px",padding:"12px",fontSize:"15px",fontWeight:"bold",cursor:"pointer"}}>ログイン</button>
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

// ─── Leave Detail ────────────────────────────────────────────────
function LeaveDetailPanel({ emp, leaves }) {
  const { usedCount, remaining } = calcLeaveStats(emp, leaves);
  const nextGrant = emp.pendingGrant;
  const daysToNext = daysDiff(nextGrant.grantDate);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
      <div style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",padding:"16px"}}>
        <h3 style={{fontWeight:"600",color:"#1f2937",marginBottom:"12px",marginTop:0}}>🎁 次回有給付与</h3>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#eff6ff",borderRadius:"12px",padding:"16px 20px"}}>
          <div>
            <p style={{fontSize:"12px",color:"#3b82f6",fontWeight:"600",margin:"0 0 4px"}}>付与予定日</p>
            <p style={{fontSize:"15px",fontWeight:"bold",color:"#1e40af",margin:"0 0 2px"}}>{fmt(nextGrant.grantDate)}</p>
            <p style={{fontSize:"12px",color:"#93c5fd",margin:0}}>付与日数：{nextGrant.days}日</p>
          </div>
          <div style={{textAlign:"right"}}>
            <p style={{fontSize:"28px",fontWeight:"bold",color:"#2563eb",margin:0}}>{daysToNext}<span style={{fontSize:"14px",marginLeft:"4px"}}>日後</span></p>
          </div>
        </div>
      </div>
      <div style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",padding:"16px"}}>
        <h3 style={{fontWeight:"600",color:"#1f2937",marginBottom:"12px",marginTop:0}}>📋 有給付与・消失スケジュール</h3>
        {emp.leaveGrants.map((g, i) => {
          const dLeft = daysDiff(g.expiryDate);
          const isExpired = dLeft < 0, isUrgent = !isExpired && dLeft <= 60, isWarning = !isExpired && dLeft <= 180 && dLeft > 60;
          const border = isExpired?"#e5e7eb":isUrgent?"#fca5a5":isWarning?"#fde047":"#86efac";
          const bg = isExpired?"#f9fafb":isUrgent?"#fef2f2":isWarning?"#fffbeb":"#f0fdf4";
          const tc = isExpired?"#9ca3af":isUrgent?"#dc2626":isWarning?"#ca8a04":"#16a34a";
          return (
            <div key={i} style={{borderRadius:"12px",border:`2px solid ${border}`,background:bg,padding:"16px",marginBottom:"12px",opacity:isExpired?0.6:1}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <p style={{fontSize:"12px",color:"#6b7280",margin:"0 0 2px"}}>付与日：{fmt(g.grantDate)}</p>
                  <p style={{fontSize:"14px",fontWeight:"bold",color:"#1f2937",margin:0}}>付与日数：{g.days}日</p>
                </div>
                <div style={{textAlign:"right"}}>
                  <p style={{fontSize:"12px",color:tc,margin:"0 0 2px"}}>消失期限：{fmt(g.expiryDate)}</p>
                  {isExpired
                    ? <span style={{fontSize:"12px",background:"#e5e7eb",color:"#6b7280",padding:"2px 8px",borderRadius:"9999px"}}>消失済み</span>
                    : <p style={{fontSize:"18px",fontWeight:"bold",color:tc,margin:0}}>あと {dLeft} 日 {isUrgent&&"⚠️"}</p>}
                </div>
              </div>
              {!isExpired && (
                <div style={{marginTop:"8px",height:"6px",background:"white",borderRadius:"9999px",overflow:"hidden"}}>
                  <div style={{height:"100%",borderRadius:"9999px",background:isUrgent?"#f87171":isWarning?"#facc15":"#4ade80",width:`${Math.max(3,Math.min(100,(dLeft/730)*100))}%`}} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",padding:"16px"}}>
        <h3 style={{fontWeight:"600",color:"#1f2937",marginBottom:"12px",marginTop:0}}>📊 有給サマリー</h3>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"12px"}}>
          {[["付与合計",`${emp.leaveGrants.reduce((s,g)=>s+g.days,0)}日`,"#1f2937"],["取得済み",`${usedCount}日`,"#f97316"],["残日数",`${remaining}日`,"#2563eb"]].map(([l,v,c])=>(
            <div key={l} style={{background:"#f8fafc",borderRadius:"8px",padding:"12px",textAlign:"center"}}>
              <p style={{fontSize:"20px",fontWeight:"bold",color:c,margin:"0 0 4px"}}>{v}</p>
              <p style={{fontSize:"12px",color:"#94a3b8",margin:0}}>{l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Dept Filter ─────────────────────────────────────────────────
function DeptFilter({ depts, selected, onChange }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"16px",flexWrap:"wrap"}}>
      <span style={{fontSize:"13px",color:"#64748b",fontWeight:"600"}}>部署：</span>
      {depts.map(d => (
        <button key={d} onClick={()=>onChange(d)}
          style={{padding:"4px 14px",borderRadius:"9999px",fontSize:"12px",fontWeight:"600",cursor:"pointer",border:"none",
            background:selected===d?"#2563eb":"#e5e7eb",color:selected===d?"white":"#374151"}}>
          {d}
        </button>
      ))}
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────
export default function App() {
  const [employees, setEmployees] = useState(loadEmployees);
  const [authUser, setAuthUser] = useState(null);
  const [authRole, setAuthRole] = useState(null);
  const [records] = useState(() => genRecords(loadEmployees()));
  const [leaves, setLeaves] = useState(genLeaves);
  const [tab, setTab] = useState("dashboard");
  const [clockedIn, setClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState(null);
  const [leaveForm, setLeaveForm] = useState({ date:"", type:"年次有給", reason:"" });
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [adminTab, setAdminTab] = useState("employees");
  const [filterDept, setFilterDept] = useState("すべて");

  // 従業員管理用
  const [showAddForm, setShowAddForm] = useState(false);
  const [editPwId, setEditPwId] = useState(null);
  const [newPw, setNewPw] = useState("");
  const [newEmp, setNewEmp] = useState({ empNo:"", password:"", name:"", dept:"", annualLeave:10 });
  const [addError, setAddError] = useState("");

  const updateEmployees = newEmps => { setEmployees(newEmps); saveEmployees(newEmps); };
  const handleLogin = (emp, role) => { setAuthUser(emp); setAuthRole(role); setTab("dashboard"); setFilterDept("すべて"); };
  const handleLogout = () => { setAuthUser(null); setAuthRole(null); setClockedIn(false); setClockInTime(null); setShowLeaveForm(false); };

  if (!authUser && !authRole) return <LoginScreen employees={employees} onLogin={handleLogin} />;

  const btn = active => ({ padding:"8px 16px", borderRadius:"8px", fontWeight:"600", fontSize:"13px", cursor:"pointer", border:"none", background:active?"#2563eb":"white", color:active?"white":"#4b5563" });

  const submitLeave = () => {
    if (!leaveForm.date || !leaveForm.reason) return;
    setLeaves(l => ({ ...l, [authUser.id]: [...(l[authUser.id]||[]), { id:Date.now(), ...leaveForm, status:"申請中" }] }));
    setLeaveForm({ date:"", type:"年次有給", reason:"" }); setShowLeaveForm(false);
  };
  const approveLeave = (empId, leaveId, status) => setLeaves(l => ({ ...l, [empId]: l[empId].map(lv => lv.id===leaveId ? {...lv,status} : lv) }));

  const addEmployee = () => {
    setAddError("");
    if (!newEmp.empNo||!newEmp.password||!newEmp.name||!newEmp.dept) { setAddError("すべての項目を入力してください"); return; }
    if (employees.find(e=>e.empNo===newEmp.empNo)) { setAddError("その従業員番号はすでに使用されています"); return; }
    const gd = new Date().toISOString().slice(0,10);
    const ex = new Date(new Date().setFullYear(new Date().getFullYear()+2)).toISOString().slice(0,10);
    const nx = new Date(new Date().setFullYear(new Date().getFullYear()+1)).toISOString().slice(0,10);
    const emp = { id:Date.now(), empNo:newEmp.empNo, password:newEmp.password, name:newEmp.name, dept:newEmp.dept,
      leaveGrants:[{ grantDate:gd, days:parseInt(newEmp.annualLeave), expiryDate:ex }],
      pendingGrant:{ grantDate:nx, days:parseInt(newEmp.annualLeave) } };
    updateEmployees([...employees, emp]);
    setNewEmp({ empNo:"", password:"", name:"", dept:"", annualLeave:10 });
    setShowAddForm(false); setAddError("");
  };
  const resetPassword = id => { if (!newPw) return; updateEmployees(employees.map(e=>e.id===id?{...e,password:newPw}:e)); setEditPwId(null); setNewPw(""); };
  const deleteEmployee = id => { if (!window.confirm("この従業員を削除しますか？")) return; updateEmployees(employees.filter(e=>e.id!==id)); };

  const allDepts = ["すべて", ...Array.from(new Set(employees.map(e=>e.dept)))];
  const filtered = filterDept==="すべて" ? employees : employees.filter(e=>e.dept===filterDept);
  const pendingLeaves = employees.flatMap(emp=>(leaves[emp.id]||[]).filter(l=>l.status==="申請中").map(l=>({...l,emp})));
  const OT = 20;
  const empStats = employees.map(emp => {
    const recs = records[emp.id]||[];
    const total = recs.reduce((s,r)=>s+parseFloat(r.hours),0);
    return { emp, recs, total, overtime: Math.max(0,total-recs.length*8) };
  });
  const alertCount = empStats.filter(e=>e.overtime>=OT).length;

  const Header = ({sub, title}) => (
    <header style={{background:"#1d4ed8",color:"white",padding:"16px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 2px 8px rgba(0,0,0,0.2)"}}>
      <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
        <span style={{fontSize:"24px"}}>🏢</span>
        <span style={{fontWeight:"bold",fontSize:"17px"}}>勤怠管理システム</span>
        {sub && <span style={{background:"#facc15",color:"#713f12",fontSize:"11px",fontWeight:"bold",padding:"2px 8px",borderRadius:"4px"}}>{sub}</span>}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
        {title && <span style={{fontSize:"13px",opacity:0.8}}>{title}</span>}
        <button onClick={handleLogout} style={{background:"white",color:"#1d4ed8",border:"none",borderRadius:"6px",padding:"6px 14px",fontSize:"13px",fontWeight:"600",cursor:"pointer"}}>ログアウト</button>
      </div>
    </header>
  );

  // ── 従業員画面 ──────────────────────────────────────────────────
  if (authRole==="employee" && authUser) {
    const empRecords = records[authUser.id]||[];
    const empLeaves = leaves[authUser.id]||[];
    const { usedCount, remaining } = calcLeaveStats(authUser, leaves);
    const totalHours = empRecords.reduce((s,r)=>s+parseFloat(r.hours),0).toFixed(1);

    return (
      <div style={{minHeight:"100vh",background:"#f1f5f9",fontFamily:"sans-serif"}}>
        <Header title={`${authUser.empNo}｜${authUser.name}`} />
        <div style={{maxWidth:"700px",margin:"0 auto",padding:"16px"}}>
          <div style={{display:"flex",gap:"8px",marginBottom:"16px",flexWrap:"wrap"}}>
            {[["dashboard","ダッシュボード"],["attendance","打刻・履歴"],["leave","有給申請"],["leaveDetail","有給スケジュール"]].map(([key,label])=>(
              <button key={key} onClick={()=>setTab(key)} style={btn(tab===key)}>{label}</button>
            ))}
          </div>

          {tab==="dashboard" && (
            <div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"12px",marginBottom:"16px"}}>
                {[["出勤日数",`${empRecords.length}日`,"📅","#2563eb"],["今月の勤務時間",`${totalHours}h`,"⏱️","#16a34a"],["有給残日数",`${remaining}日`,"🌴","#ea580c"]].map(([label,val,icon,color])=>(
                  <div key={label} style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",padding:"16px",textAlign:"center"}}>
                    <div style={{fontSize:"24px",marginBottom:"4px"}}>{icon}</div>
                    <div style={{fontSize:"22px",fontWeight:"bold",color}}>{val}</div>
                    <div style={{fontSize:"11px",color:"#94a3b8",marginTop:"4px"}}>{label}</div>
                  </div>
                ))}
              </div>
              {authUser.leaveGrants.filter(g=>daysDiff(g.expiryDate)>=0&&daysDiff(g.expiryDate)<=60).map((g,i)=>(
                <div key={i} style={{background:"#fef2f2",border:"1px solid #fca5a5",borderRadius:"12px",padding:"12px",marginBottom:"12px",fontSize:"13px",color:"#b91c1c"}}>
                  ⚠️ <strong>{fmt(g.expiryDate)}</strong> に有給 <strong>{g.days}日分</strong> が消失します（あと {daysDiff(g.expiryDate)} 日）
                </div>
              ))}
              <div style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",padding:"16px"}}>
                <h3 style={{fontWeight:"600",color:"#1f2937",marginBottom:"12px",marginTop:0}}>直近の勤怠</h3>
                <table style={{width:"100%",fontSize:"13px",borderCollapse:"collapse"}}>
                  <thead><tr style={{color:"#94a3b8",borderBottom:"1px solid #e5e7eb"}}>{["日付","出勤","退勤","時間"].map(h=><th key={h} style={{textAlign:"left",paddingBottom:"8px",fontWeight:"600"}}>{h}</th>)}</tr></thead>
                  <tbody>{empRecords.slice(0,5).map((r,i)=>(
                    <tr key={i} style={{borderBottom:"1px solid #f1f5f9"}}>
                      <td style={{padding:"8px 0",color:"#1f2937"}}>{r.date}</td>
                      <td style={{padding:"8px 0",color:"#2563eb"}}>{r.clockIn}</td>
                      <td style={{padding:"8px 0",color:"#ef4444"}}>{r.clockOut}</td>
                      <td style={{padding:"8px 0",fontWeight:"600",color:"#1f2937"}}>{r.hours}h</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}

          {tab==="attendance" && (
            <div>
              <div style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",padding:"24px",marginBottom:"16px",textAlign:"center"}}>
                <p style={{color:"#94a3b8",fontSize:"13px",marginBottom:"16px"}}>現在時刻: {fmtTime(new Date())}</p>
                {!clockedIn
                  ? <button onClick={()=>{setClockedIn(true);setClockInTime(new Date());}} style={{background:"#22c55e",color:"white",border:"none",borderRadius:"16px",padding:"16px 40px",fontSize:"17px",fontWeight:"bold",cursor:"pointer"}}>🟢 出勤</button>
                  : <div>
                      <p style={{color:"#16a34a",fontWeight:"600",marginBottom:"12px"}}>出勤中 🟢（{fmtTime(clockInTime)}〜）</p>
                      <button onClick={()=>{setClockedIn(false);setClockInTime(null);}} style={{background:"#ef4444",color:"white",border:"none",borderRadius:"16px",padding:"16px 40px",fontSize:"17px",fontWeight:"bold",cursor:"pointer"}}>🔴 退勤</button>
                    </div>}
              </div>
              <div style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",padding:"16px"}}>
                <h3 style={{fontWeight:"600",color:"#1f2937",marginBottom:"12px",marginTop:0}}>勤怠履歴</h3>
                <div style={{overflowY:"auto",maxHeight:"300px"}}>
                  <table style={{width:"100%",fontSize:"13px",borderCollapse:"collapse"}}>
                    <thead><tr style={{color:"#94a3b8",borderBottom:"1px solid #e5e7eb"}}>{["日付","出勤","退勤","勤務時間"].map(h=><th key={h} style={{textAlign:"left",paddingBottom:"8px",fontWeight:"600"}}>{h}</th>)}</tr></thead>
                    <tbody>{empRecords.map((r,i)=>(
                      <tr key={i} style={{borderBottom:"1px solid #f1f5f9"}}>
                        <td style={{padding:"8px 0",color:"#1f2937"}}>{r.date}</td>
                        <td style={{padding:"8px 0",color:"#2563eb"}}>{r.clockIn}</td>
                        <td style={{padding:"8px 0",color:"#ef4444"}}>{r.clockOut}</td>
                        <td style={{padding:"8px 0",fontWeight:"600",color:"#1f2937"}}>{r.hours}h</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab==="leave" && (
            <div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"12px",marginBottom:"16px"}}>
                {[["付与合計",`${authUser.leaveGrants.reduce((s,g)=>s+g.days,0)}日`],["取得済み",`${usedCount}日`],["残日数",`${remaining}日`]].map(([l,v])=>(
                  <div key={l} style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",padding:"12px",textAlign:"center"}}>
                    <div style={{fontSize:"18px",fontWeight:"bold",color:"#2563eb"}}>{v}</div>
                    <div style={{fontSize:"12px",color:"#94a3b8"}}>{l}</div>
                  </div>
                ))}
              </div>
              {!showLeaveForm
                ? <button onClick={()=>setShowLeaveForm(true)} style={{...btn(true),width:"100%",marginBottom:"16px",padding:"12px"}}>＋ 有給申請</button>
                : <div style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",padding:"16px",marginBottom:"16px"}}>
                    <h3 style={{fontWeight:"600",color:"#1f2937",marginBottom:"12px",marginTop:0}}>有給申請</h3>
                    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                      <div>
                        <label style={{fontSize:"13px",color:"#475569",display:"block",marginBottom:"4px"}}>取得日</label>
                        <input type="date" value={leaveForm.date} onChange={e=>setLeaveForm(f=>({...f,date:e.target.value}))} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:"6px",padding:"8px 12px",fontSize:"13px",boxSizing:"border-box"}} />
                      </div>
                      <div>
                        <label style={{fontSize:"13px",color:"#475569",display:"block",marginBottom:"4px"}}>種別</label>
                        <select value={leaveForm.type} onChange={e=>setLeaveForm(f=>({...f,type:e.target.value}))} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:"6px",padding:"8px 12px",fontSize:"13px"}}>
                          <option>年次有給</option><option>特別休暇</option><option>慶弔休暇</option>
                        </select>
                      </div>
                      <div>
                        <label style={{fontSize:"13px",color:"#475569",display:"block",marginBottom:"4px"}}>理由</label>
                        <input type="text" placeholder="例：通院、私用など" value={leaveForm.reason} onChange={e=>setLeaveForm(f=>({...f,reason:e.target.value}))} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:"6px",padding:"8px 12px",fontSize:"13px",boxSizing:"border-box"}} />
                      </div>
                      <div style={{display:"flex",gap:"8px"}}>
                        <button onClick={submitLeave} style={{...btn(true),padding:"10px 20px"}}>申請する</button>
                        <button onClick={()=>setShowLeaveForm(false)} style={{...btn(false),padding:"10px 20px"}}>キャンセル</button>
                      </div>
                    </div>
                  </div>}
              <div style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",padding:"16px"}}>
                <h3 style={{fontWeight:"600",color:"#1f2937",marginBottom:"12px",marginTop:0}}>申請履歴</h3>
                {empLeaves.length===0 ? <p style={{color:"#94a3b8",fontSize:"13px"}}>申請履歴はありません</p>
                  : empLeaves.map(lv=>(
                    <div key={lv.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",border:"1px solid #e5e7eb",borderRadius:"8px",padding:"10px 14px",fontSize:"13px",marginBottom:"8px"}}>
                      <div>
                        <span style={{fontWeight:"600",color:"#1f2937"}}>{lv.date}</span>
                        <span style={{color:"#6b7280",marginLeft:"8px"}}>{lv.type}</span>
                        <span style={{color:"#9ca3af",marginLeft:"8px",fontSize:"12px"}}>{lv.reason}</span>
                      </div>
                      <span style={{padding:"2px 10px",borderRadius:"9999px",fontSize:"12px",fontWeight:"600",
                        background:lv.status==="承認済"?"#dcfce7":lv.status==="却下"?"#fee2e2":"#fef9c3",
                        color:lv.status==="承認済"?"#15803d":lv.status==="却下"?"#dc2626":"#a16207"}}>{lv.status}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {tab==="leaveDetail" && <LeaveDetailPanel emp={authUser} leaves={leaves} />}
        </div>
      </div>
    );
  }

  // ── 管理者画面 ──────────────────────────────────────────────────
  return (
    <div style={{minHeight:"100vh",background:"#f1f5f9",fontFamily:"sans-serif"}}>
      <Header sub="管理者" />
      <div style={{maxWidth:"960px",margin:"0 auto",padding:"16px"}}>
        <div style={{display:"flex",gap:"8px",marginBottom:"16px",flexWrap:"wrap"}}>
          {[["employees","従業員管理"],["leaves","有給申請管理"],["report","勤務レポート"],["leaveSchedule","有給スケジュール"]].map(([key,label])=>(
            <button key={key} onClick={()=>setAdminTab(key)} style={btn(adminTab===key)}>{label}</button>
          ))}
        </div>

        {/* 部署フィルター（全タブ共通） */}
        <DeptFilter depts={allDepts} selected={filterDept} onChange={setFilterDept} />

        {/* 従業員管理 */}
        {adminTab==="employees" && (
          <div>
            <button onClick={()=>setShowAddForm(v=>!v)} style={{...btn(showAddForm),marginBottom:"16px",padding:"10px 20px"}}>
              {showAddForm?"✕ キャンセル":"＋ 従業員を追加"}
            </button>
            {showAddForm && (
              <div style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",padding:"20px",marginBottom:"16px"}}>
                <h3 style={{fontWeight:"600",color:"#1f2937",marginTop:0,marginBottom:"16px"}}>新しい従業員を追加</h3>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                  {[["従業員番号","empNo","text","例：E006"],["パスワード（初期）","password","password","初期パスワード"],["氏名","name","text","例：山本 一郎"],["部署","dept","text","例：営業部"]].map(([label,key,type,ph])=>(
                    <div key={key}>
                      <label style={{fontSize:"13px",color:"#475569",display:"block",marginBottom:"4px"}}>{label}</label>
                      <input type={type} placeholder={ph} value={newEmp[key]} onChange={e=>setNewEmp(f=>({...f,[key]:e.target.value}))}
                        style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:"6px",padding:"8px 12px",fontSize:"13px",boxSizing:"border-box"}} />
                    </div>
                  ))}
                  <div>
                    <label style={{fontSize:"13px",color:"#475569",display:"block",marginBottom:"4px"}}>年次有給付与日数</label>
                    <input type="number" value={newEmp.annualLeave} onChange={e=>setNewEmp(f=>({...f,annualLeave:e.target.value}))}
                      style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:"6px",padding:"8px 12px",fontSize:"13px",boxSizing:"border-box"}} />
                  </div>
                </div>
                {addError && <p style={{color:"#ef4444",fontSize:"12px",margin:"8px 0 0"}}>{addError}</p>}
                <button onClick={addEmployee} style={{...btn(true),marginTop:"16px",padding:"10px 24px"}}>追加する</button>
              </div>
            )}
            <div style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",overflow:"auto"}}>
              <table style={{width:"100%",fontSize:"13px",borderCollapse:"collapse",minWidth:"600px"}}>
                <thead><tr>{["従業員番号","氏名","部署","有給残日数","パスワード変更","削除"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {filtered.map(emp=>{
                    const {remaining}=calcLeaveStats(emp,leaves);
                    return (
                      <tr key={emp.id} style={{borderTop:"1px solid #f1f5f9"}}>
                        <td style={cell({color:"#94a3b8",fontFamily:"monospace"})}>{emp.empNo}</td>
                        <td style={cell({fontWeight:"700"})}>{emp.name}</td>
                        <td style={cell({color:"#6b7280"})}>{emp.dept}</td>
                        <td style={cell({fontWeight:"bold",color:"#2563eb"})}>{remaining}日</td>
                        <td style={cell()}>
                          {editPwId===emp.id
                            ? <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
                                <input type="password" placeholder="新しいパスワード" value={newPw} onChange={e=>setNewPw(e.target.value)}
                                  style={{border:"1px solid #e2e8f0",borderRadius:"6px",padding:"4px 8px",fontSize:"12px",width:"140px"}} />
                                <button onClick={()=>resetPassword(emp.id)} style={{background:"#2563eb",color:"white",border:"none",borderRadius:"6px",padding:"4px 10px",fontSize:"12px",cursor:"pointer"}}>保存</button>
                                <button onClick={()=>{setEditPwId(null);setNewPw("");}} style={{background:"#e5e7eb",color:"#374151",border:"none",borderRadius:"6px",padding:"4px 10px",fontSize:"12px",cursor:"pointer"}}>✕</button>
                              </div>
                            : <button onClick={()=>setEditPwId(emp.id)} style={{background:"#f1f5f9",color:"#374151",border:"none",borderRadius:"6px",padding:"4px 12px",fontSize:"12px",cursor:"pointer"}}>🔑 変更</button>}
                        </td>
                        <td style={cell()}>
                          <button onClick={()=>deleteEmployee(emp.id)} style={{background:"#fee2e2",color:"#dc2626",border:"none",borderRadius:"6px",padding:"4px 12px",fontSize:"12px",cursor:"pointer"}}>🗑️ 削除</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 有給申請管理 */}
        {adminTab==="leaves" && (
          <div>
            {pendingLeaves.filter(l=>filterDept==="すべて"||l.emp.dept===filterDept).length>0 && (
              <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:"12px",padding:"12px 16px",marginBottom:"16px",fontSize:"13px",color:"#92400e"}}>
                📋 承認待ちの申請が <strong>{pendingLeaves.filter(l=>filterDept==="すべて"||l.emp.dept===filterDept).length}件</strong> あります
              </div>
            )}
            <div style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",overflow:"auto"}}>
              <table style={{width:"100%",fontSize:"13px",borderCollapse:"collapse",minWidth:"600px"}}>
                <thead><tr>{["従業員","部署","日付","種別","理由","操作"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {filtered.flatMap(emp=>(leaves[emp.id]||[]).map(lv=>(
                    <tr key={lv.id} style={{borderTop:"1px solid #f1f5f9"}}>
                      <td style={cell({fontWeight:"700"})}>{emp.name}</td>
                      <td style={cell({color:"#6b7280"})}>{emp.dept}</td>
                      <td style={cell()}>{lv.date}</td>
                      <td style={cell()}>{lv.type}</td>
                      <td style={cell({color:"#6b7280"})}>{lv.reason}</td>
                      <td style={cell()}>
                        {lv.status==="申請中"
                          ? <div style={{display:"flex",gap:"6px"}}>
                              <button onClick={()=>approveLeave(emp.id,lv.id,"承認済")} style={{background:"#22c55e",color:"white",border:"none",borderRadius:"6px",padding:"4px 10px",fontSize:"12px",cursor:"pointer"}}>承認</button>
                              <button onClick={()=>approveLeave(emp.id,lv.id,"却下")} style={{background:"#f87171",color:"white",border:"none",borderRadius:"6px",padding:"4px 10px",fontSize:"12px",cursor:"pointer"}}>却下</button>
                            </div>
                          : <span style={{padding:"2px 10px",borderRadius:"9999px",fontSize:"12px",fontWeight:"600",background:lv.status==="承認済"?"#dcfce7":"#fee2e2",color:lv.status==="承認済"?"#15803d":"#dc2626"}}>{lv.status}</span>}
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 勤務レポート */}
        {adminTab==="report" && (
          <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
            <ReportCharts />
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"12px"}}>
              {[
                ["総従業員数",`${filtered.length}名`,"👥",false],
                ["承認待ち申請",`${pendingLeaves.filter(l=>filterDept==="すべて"||l.emp.dept===filterDept).length}件`,"📋",false],
                ["残業アラート",`${empStats.filter(e=>(filterDept==="すべて"||e.emp.dept===filterDept)&&e.overtime>=OT).length}名`,"🚨",alertCount>0],
              ].map(([l,v,icon,alert])=>(
                <div key={l} style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",padding:"16px",textAlign:"center",border:alert?"2px solid #fca5a5":"2px solid transparent"}}>
                  <div style={{fontSize:"24px",marginBottom:"4px"}}>{icon}</div>
                  <div style={{fontSize:"22px",fontWeight:"bold",color:alert?"#dc2626":"#2563eb"}}>{v}</div>
                  <div style={{fontSize:"11px",color:"#94a3b8",marginTop:"4px"}}>{l}</div>
                </div>
              ))}
            </div>
            {empStats.filter(e=>(filterDept==="すべて"||e.emp.dept===filterDept)&&e.overtime>=OT).length>0 && (
              <div style={{background:"#fef2f2",border:"1px solid #fca5a5",borderRadius:"12px",padding:"16px"}}>
                <h3 style={{fontWeight:"600",color:"#b91c1c",marginBottom:"12px",marginTop:0}}>🚨 残業アラート（基準：{OT}時間超）</h3>
                {empStats.filter(e=>(filterDept==="すべて"||e.emp.dept===filterDept)&&e.overtime>=OT).sort((a,b)=>b.overtime-a.overtime).map(({emp,recs,total,overtime})=>{
                  const severe=overtime>=OT*2;
                  return (
                    <div key={emp.id} style={{borderRadius:"10px",border:`1px solid ${severe?"#f87171":"#fca5a5"}`,background:severe?"#fee2e2":"white",padding:"14px 16px",marginBottom:"10px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
                        <div><span style={{fontWeight:"700",color:"#1f2937"}}>{emp.name}</span><span style={{color:"#9ca3af",fontSize:"12px",marginLeft:"8px"}}>{emp.dept}</span></div>
                        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                          <span style={{fontSize:"17px",fontWeight:"bold",color:severe?"#b91c1c":"#ef4444"}}>+{overtime.toFixed(1)}h超過</span>
                          {severe && <span style={{background:"#dc2626",color:"white",fontSize:"11px",padding:"2px 8px",borderRadius:"9999px"}}>⚠️ 要対応</span>}
                        </div>
                      </div>
                      <div style={{height:"6px",background:"#fecaca",borderRadius:"9999px",overflow:"hidden"}}>
                        <div style={{height:"100%",borderRadius:"9999px",background:severe?"#dc2626":"#f87171",width:`${Math.min(100,(overtime/OT)*100)}%`}} />
                      </div>
                      <p style={{fontSize:"12px",color:"#9ca3af",margin:"6px 0 0"}}>総勤務時間 {total.toFixed(1)}h ／ 出勤 {recs.length}日</p>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",padding:"16px",overflow:"auto"}}>
              <h3 style={{fontWeight:"600",color:"#1f2937",marginBottom:"12px",marginTop:0}}>従業員別 勤務時間サマリー</h3>
              <table style={{width:"100%",fontSize:"13px",borderCollapse:"collapse",minWidth:"500px"}}>
                <thead><tr style={{borderBottom:"1px solid #e5e7eb"}}>{["氏名","出勤日数","総勤務時間","平均/日","残業時間","状態"].map(h=><th key={h} style={{...th,background:"transparent",padding:"0 0 8px"}}>{h}</th>)}</tr></thead>
                <tbody>
                  {empStats.filter(e=>filterDept==="すべて"||e.emp.dept===filterDept).map(({emp,recs,total,overtime})=>{
                    const isAlert=overtime>=OT, isSevere=overtime>=OT*2;
                    return (
                      <tr key={emp.id} style={{borderBottom:"1px solid #f1f5f9",background:isSevere?"#fef2f2":isAlert?"#fff7ed":"white"}}>
                        <td style={{padding:"10px 0",fontWeight:"700",color:"#1f2937"}}>{emp.name}</td>
                        <td style={{padding:"10px 0",color:"#1f2937"}}>{recs.length}日</td>
                        <td style={{padding:"10px 0",color:"#1f2937"}}>{total.toFixed(1)}h</td>
                        <td style={{padding:"10px 0",color:"#2563eb"}}>{recs.length?(total/recs.length).toFixed(1):"—"}h</td>
                        <td style={{padding:"10px 0",fontWeight:"bold",color:isSevere?"#dc2626":isAlert?"#ea580c":"#94a3b8"}}>{overtime>0?`+${overtime.toFixed(1)}h`:"—"}</td>
                        <td style={{padding:"10px 0"}}>
                          <span style={{padding:"2px 10px",borderRadius:"9999px",fontSize:"12px",fontWeight:"600",background:isSevere?"#fee2e2":isAlert?"#ffedd5":"#dcfce7",color:isSevere?"#dc2626":isAlert?"#ea580c":"#16a34a"}}>
                            {isSevere?"要対応":isAlert?"アラート":"正常"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 有給スケジュール */}
        {adminTab==="leaveSchedule" && (
          <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
            <div style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",padding:"16px"}}>
              <h3 style={{fontWeight:"600",color:"#1f2937",marginBottom:"12px",marginTop:0}}>⚠️ 有給消失アラート（60日以内）</h3>
              {(() => {
                const items = filtered.flatMap(emp=>emp.leaveGrants.filter(g=>daysDiff(g.expiryDate)>=0&&daysDiff(g.expiryDate)<=60).map((g,i)=>(
                  <div key={`${emp.id}-${i}`} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#fef2f2",border:"1px solid #fca5a5",borderRadius:"8px",padding:"12px 16px",marginBottom:"8px"}}>
                    <div>
                      <p style={{fontWeight:"700",color:"#1f2937",margin:"0 0 2px"}}>{emp.name} <span style={{color:"#9ca3af",fontSize:"12px",fontWeight:"400"}}>{emp.dept}</span></p>
                      <p style={{fontSize:"12px",color:"#dc2626",margin:0}}>消失日：{fmt(g.expiryDate)}　消失日数：{g.days}日</p>
                    </div>
                    <span style={{fontWeight:"bold",color:"#dc2626",fontSize:"17px"}}>あと {daysDiff(g.expiryDate)} 日</span>
                  </div>
                )));
                return items.length ? items : <p style={{color:"#94a3b8",fontSize:"13px"}}>60日以内に消失する有給はありません</p>;
              })()}
            </div>
            <div style={{background:"white",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",padding:"16px",overflow:"auto"}}>
              <h3 style={{fontWeight:"600",color:"#1f2937",marginBottom:"12px",marginTop:0}}>🎁 今後の有給付与スケジュール</h3>
              <table style={{width:"100%",fontSize:"13px",borderCollapse:"collapse",minWidth:"400px"}}>
                <thead><tr style={{borderBottom:"1px solid #e5e7eb"}}>{["氏名","部署","付与予定日","付与日数","あと"].map(h=><th key={h} style={{...th,background:"transparent",padding:"0 0 8px"}}>{h}</th>)}</tr></thead>
                <tbody>
                  {[...filtered].sort((a,b)=>daysDiff(a.pendingGrant.grantDate)-daysDiff(b.pendingGrant.grantDate)).map(emp=>(
                    <tr key={emp.id} style={{borderBottom:"1px solid #f1f5f9"}}>
                      <td style={{padding:"10px 0",fontWeight:"700",color:"#1f2937"}}>{emp.name}</td>
                      <td style={{padding:"10px 0",color:"#6b7280"}}>{emp.dept}</td>
                      <td style={{padding:"10px 0",color:"#1f2937"}}>{fmt(emp.pendingGrant.grantDate)}</td>
                      <td style={{padding:"10px 0",fontWeight:"bold",color:"#2563eb"}}>{emp.pendingGrant.days}日</td>
                      <td style={{padding:"10px 0",color:"#6b7280"}}>{daysDiff(emp.pendingGrant.grantDate)}日後</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

