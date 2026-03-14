import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

// ── ダミーデータ生成 ──────────────────────────────────────────────
function genMonthlyData() {
  const months = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,"0")}`;
    months.push({
      month: label,
      勤務時間: Math.round(150 + Math.random() * 40),
      前年同月: Math.round(145 + Math.random() * 40),
      残業時間: Math.round(10 + Math.random() * 25),
      有給取得率: Math.round(30 + Math.random() * 50),
    });
  }
  return months;
}

const data = genMonthlyData();

// 前月比・前年比を計算
const latest = data[data.length - 1];
const prev = data[data.length - 2];
const momWork = latest && prev ? ((latest.勤務時間 - prev.勤務時間) / prev.勤務時間 * 100).toFixed(1) : 0;
const yoyWork = latest ? ((latest.勤務時間 - latest.前年同月) / latest.前年同月 * 100).toFixed(1) : 0;
const momOt = latest && prev ? ((latest.残業時間 - prev.残業時間) / prev.残業時間 * 100).toFixed(1) : 0;
const momLeave = latest && prev ? ((latest.有給取得率 - prev.有給取得率) / prev.有給取得率 * 100).toFixed(1) : 0;

function Badge({ value }) {
  const up = parseFloat(value) > 0;
  const zero = parseFloat(value) === 0;
  return (
    <span style={{
      fontSize: "12px", fontWeight: "700", padding: "2px 8px", borderRadius: "9999px",
      background: zero ? "#f1f5f9" : up ? "#fef2f2" : "#f0fdf4",
      color: zero ? "#64748b" : up ? "#dc2626" : "#16a34a",
      marginLeft: "8px"
    }}>
      {up ? "▲" : zero ? "－" : "▼"} {Math.abs(value)}%
    </span>
  );
}

function Card({ title, value, unit, badge, color }) {
  return (
    <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.1)", padding: "16px", flex: 1 }}>
      <p style={{ fontSize: "12px", color: "#94a3b8", margin: "0 0 6px" }}>{title}</p>
      <div style={{ display: "flex", alignItems: "center" }}>
        <span style={{ fontSize: "24px", fontWeight: "bold", color }}>{value}</span>
        <span style={{ fontSize: "13px", color: "#6b7280", marginLeft: "4px" }}>{unit}</span>
        <Badge value={badge} />
      </div>
    </div>
  );
}

function ChartBox({ title, children }) {
  return (
    <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.1)", padding: "20px" }}>
      <h3 style={{ fontWeight: "600", color: "#1f2937", marginTop: 0, marginBottom: "16px", fontSize: "14px" }}>{title}</h3>
      {children}
    </div>
  );
}

export default function ReportCharts() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* KPIカード */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <Card title={`今月の勤務時間（前月比）`} value={latest?.勤務時間} unit="h" badge={momWork} color="#2563eb" />
        <Card title={`今月の勤務時間（前年同月比）`} value={latest?.勤務時間} unit="h" badge={yoyWork} color="#7c3aed" />
        <Card title={`今月の残業時間（前月比）`} value={latest?.残業時間} unit="h" badge={momOt} color="#dc2626" />
        <Card title={`今月の有給取得率（前月比）`} value={latest?.有給取得率} unit="%" badge={momLeave} color="#16a34a" />
      </div>

      {/* 勤務時間 前月比・前年比 棒グラフ */}
      <ChartBox title="📊 月別勤務時間（当月 vs 前年同月）">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} interval={1} />
            <YAxis tick={{ fontSize: 11 }} unit="h" />
            <Tooltip formatter={(v, n) => [`${v}h`, n]} />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Bar dataKey="勤務時間" fill="#2563eb" radius={[4,4,0,0]} name="当月" />
            <Bar dataKey="前年同月" fill="#93c5fd" radius={[4,4,0,0]} name="前年同月" />
          </BarChart>
        </ResponsiveContainer>
      </ChartBox>

      {/* 残業時間 折れ線 */}
      <ChartBox title="⏰ 月別残業時間の推移">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} interval={1} />
            <YAxis tick={{ fontSize: 11 }} unit="h" />
            <Tooltip formatter={(v) => [`${v}h`, "残業時間"]} />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Line type="monotone" dataKey="残業時間" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} name="残業時間" />
          </LineChart>
        </ResponsiveContainer>
      </ChartBox>

      {/* 有給取得率 折れ線 */}
      <ChartBox title="🌴 月別有給取得率の推移">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} interval={1} />
            <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
            <Tooltip formatter={(v) => [`${v}%`, "有給取得率"]} />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Line type="monotone" dataKey="有給取得率" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} name="有給取得率" />
          </LineChart>
        </ResponsiveContainer>
      </ChartBox>

    </div>
  );
}
