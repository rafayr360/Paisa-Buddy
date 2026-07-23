import { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, PiggyBank, Download, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { useGlobal } from "../context/GlobalContext";

const CATEGORY_COLORS = {
  "Housing": "#6366f1",
  "Food & Dining": "#10b981",
  "Transport": "#f59e0b",
  "Utilities": "#06b6d4",
  "Entertainment": "#8b5cf6",
  "Shopping": "#3b82f6",
  "Health": "#f43f5e",
  "Salary": "#10b981",
  "Other Income": "#f59e0b",
};

const getColor = (cat) => CATEGORY_COLORS[cat] || "#94a3b8";

// Aggregates live transactions into report structure
function generateReportData(transactions, range) {
  let daysLimit = 30;
  let periodLabel = "W"; // for grouping flow
  let groupCount = 4;
  
  if (range === "week") { daysLimit = 7; periodLabel = "D"; groupCount = 7; }
  else if (range === "month") { daysLimit = 30; periodLabel = "W"; groupCount = 4; }
  else if (range === "3months") { daysLimit = 90; periodLabel = "M"; groupCount = 3; }
  else if (range === "6months") { daysLimit = 180; periodLabel = "M"; groupCount = 6; }
  else if (range === "year") { daysLimit = 365; periodLabel = "M"; groupCount = 12; }

  const now = new Date();
  const limitDate = new Date(); limitDate.setDate(now.getDate() - daysLimit);
  const prevLimitDate = new Date(); prevLimitDate.setDate(limitDate.getDate() - daysLimit);

  let totalIncome = 0;
  let totalExpenses = 0;
  let prevIncome = 0;
  let prevExpenses = 0;
  const catMap = {};

  // Initialize Flow and Compare arrays with zeroes
  const flowMap = Array.from({length: groupCount}, (_, i) => ({
    name: `${periodLabel}${i+1}`,
    income: 0,
    expenses: 0,
    prevExpenses: 0
  }));

  transactions.forEach(t => {
    const d = new Date(t.date);
    const isCurrent = d >= limitDate;
    const isPrevious = d >= prevLimitDate && d < limitDate;

    if (isCurrent) {
      if (t.type === "income") totalIncome += t.amount;
      else {
        totalExpenses += t.amount;
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
      }
      // Bucket into flow
      const diffTime = Math.abs(now - d);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const bucketIdx = Math.min(groupCount - 1, Math.floor(((daysLimit - diffDays) / daysLimit) * groupCount));
      if (flowMap[bucketIdx]) {
        if (t.type === "income") flowMap[bucketIdx].income += t.amount;
        else flowMap[bucketIdx].expenses += t.amount;
      }
    } else if (isPrevious) {
      if (t.type === "income") prevIncome += t.amount;
      else prevExpenses += t.amount;
      
      const diffTime = Math.abs(limitDate - d);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const bucketIdx = Math.min(groupCount - 1, Math.floor(((daysLimit - diffDays) / daysLimit) * groupCount));
      if (flowMap[bucketIdx] && t.type === "expense") {
         flowMap[bucketIdx].prevExpenses += t.amount;
      }
    }
  });

  const categories = Object.keys(catMap).map(k => ({
    name: k,
    value: catMap[k],
    color: getColor(k)
  })).sort((a,b) => b.value - a.value);

  const compare = flowMap.map(f => ({
    name: f.name,
    current: f.expenses,
    previous: f.prevExpenses
  }));

  return {
    flow: flowMap,
    totalIncome, totalExpenses,
    prevIncome, prevExpenses,
    categories,
    compare
  };
}

const TIME_TABS = [
  { key:"week",    label:"This Week"  },
  { key:"month",   label:"This Month" },
  { key:"3months", label:"3 Months"   },
  { key:"6months", label:"6 Months"   },
  { key:"year",    label:"This Year"  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function pctChange(current, prev) {
  if (!prev) return 0;
  return Math.round(((current - prev) / prev) * 100);
}

const CustomTooltip = ({ active, payload, label, currencySymbol, formatAmount }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-xl shadow-lg px-4 py-3">
      <p className="text-xs font-semibold text-muted-foreground mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name}: {currencySymbol}{formatAmount ? formatAmount(p.value) : p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

// ── Summary Card ──────────────────────────────────────────────────────────────
// decreaseIsGood=true  → DOWN arrow = GREEN  (e.g. Total Expenses going down is good)
// decreaseIsGood=false → DOWN arrow = RED    (e.g. Income going down is bad)
function StatCard({ theme, label, value, pct, icon: Icon, decreaseIsGood = false }) {
  const isUp  = pct > 0;
  const isDown = pct < 0;
  const noChange = pct === 0;

  // good = true means GREEN badge, false means RED badge
  let good;
  if (noChange)       good = true;                   // neutral — show green
  else if (isUp)      good = !decreaseIsGood;         // going up: good if increase is good
  else                good = decreaseIsGood;          // going down: good if decrease is good

  const themeClasses = {
    emerald: {
      card: "bg-emerald-50 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-900/50",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
      icon: "text-emerald-600 dark:text-emerald-400",
      text: "text-emerald-800 dark:text-emerald-300",
      label: "text-emerald-700/70 dark:text-emerald-300/70"
    },
    rose: {
      card: "bg-rose-50 border-rose-300 dark:bg-rose-950/30 dark:border-rose-900/50",
      iconBg: "bg-rose-100 dark:bg-rose-900/50",
      icon: "text-rose-600 dark:text-rose-400",
      text: "text-rose-800 dark:text-rose-300",
      label: "text-rose-700/70 dark:text-rose-300/70"
    },
    indigo: {
      card: "bg-indigo-50 border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-900/50",
      iconBg: "bg-indigo-100 dark:bg-indigo-900/50",
      icon: "text-indigo-700 dark:text-indigo-400",
      text: "text-indigo-800 dark:text-indigo-300",
      label: "text-indigo-700/70 dark:text-indigo-300/70"
    },
    amber: {
      card: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50",
      iconBg: "bg-amber-100 dark:bg-amber-900/50",
      icon: "text-amber-700 dark:text-amber-500",
      text: "text-amber-800 dark:text-amber-400",
      label: "text-amber-700/70 dark:text-amber-500/70"
    }
  };

  const t = themeClasses[theme];

  return (
    <div className={`rounded-2xl border-2 p-5 shadow-sm ${t.card}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.iconBg}`}>
          <Icon className={`w-5 h-5 ${t.icon}`} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${good ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400"}`}>
          {isDown
            ? <ArrowDownRight className="w-3.5 h-3.5" />
            : <ArrowUpRight   className="w-3.5 h-3.5" />}
          {Math.abs(pct)}%
        </div>
      </div>
      <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${t.label}`}>{label}</p>
      <p className={`text-2xl font-bold ${t.text}`}>
        {value}
      </p>
    </div>
  );
}

export default function ReportsPage() {
  const { transactions, formatAmount, currencySymbol } = useGlobal();
  const [range, setRange] = useState("month");
  
  // Calculate dynamic data based on the real transactions
  const d = generateReportData(transactions, range);

  const netSavings     = d.totalIncome - d.totalExpenses;
  const prevNetSavings = d.prevIncome  - d.prevExpenses;
  const savingsRate    = d.totalIncome > 0 ? Math.round((netSavings / d.totalIncome) * 100) : 0;
  const prevRate       = d.prevIncome  > 0 ? Math.round((prevNetSavings / d.prevIncome) * 100) : 0;
  const totalCat       = d.categories.reduce((s, c) => s + c.value, 0);

  const incomePct   = pctChange(d.totalIncome,   d.prevIncome);
  const expensePct  = pctChange(d.totalExpenses,  d.prevExpenses);
  const savingsPct  = pctChange(netSavings,        prevNetSavings);
  const ratePct     = pctChange(savingsRate,        prevRate);

  const handleDownloadReport = () => {
    const today = new Date().toISOString().split('T')[0];
    const rangeLabel = TIME_TABS.find(t => t.key === range)?.label || range;
    const rows = [];

    // ── Section 1: Summary ──
    rows.push([`Paisa Buddy Financial Report — ${rangeLabel}`]);
    rows.push([`Generated on: ${today}`]);
    rows.push([]);
    rows.push(["SUMMARY"]);
    rows.push(["Metric", "Value"]);
    rows.push(["Total Income",    `${currencySymbol}${formatAmount(d.totalIncome)}`]);
    rows.push(["Total Expenses",  `${currencySymbol}${formatAmount(d.totalExpenses)}`]);
    rows.push(["Net Savings",     `${currencySymbol}${formatAmount(netSavings)}`]);
    rows.push(["Savings Rate",    `${savingsRate}%`]);
    rows.push([]);

    // ── Section 2: Category Breakdown ──
    rows.push(["SPENDING BY CATEGORY"]);
    rows.push(["Category", "Amount", "% of Total"]);
    d.categories.forEach(c => {
      const pct = totalCat > 0 ? Math.round((c.value / totalCat) * 100) : 0;
      rows.push([c.name, `${currencySymbol}${formatAmount(c.value)}`, `${pct}%`]);
    });
    rows.push([]);

    // ── Section 3: All Transactions in Range ──
    const now = new Date();
    const daysMap = { week: 7, month: 30, "3months": 90, "6months": 180, year: 365 };
    const daysLimit = daysMap[range] || 30;
    const limitDate = new Date(); limitDate.setDate(now.getDate() - daysLimit);

    const rangeTxns = transactions
      .filter(t => new Date(t.date) >= limitDate)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    rows.push(["ALL TRANSACTIONS"]);
    rows.push(["Date", "Title", "Category", "Type", "Amount"]);
    rangeTxns.forEach(t => {
      const safeTitle = `"${(t.title || "").replace(/"/g, '""')}"`;
      const amt = t.type === "expense"
        ? `-${formatAmount(t.amount).replace(/,/g, "")}`
        : `${formatAmount(t.amount).replace(/,/g, "")}`;
      rows.push([t.date, safeTitle, t.category, t.type, amt]);
    });

    // ── Convert to CSV ──
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `paisa_buddy_report_${rangeLabel.replace(/ /g, "_")}_${today}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[1200px] mx-auto pb-24">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Analytics & Reports</h1>
          <p className="text-muted-foreground mt-1 text-sm">Visualize your financial health and spending patterns.</p>
        </div>
        <button
          onClick={handleDownloadReport}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" /> Download Report
        </button>
      </div>


      {/* Time Range Tabs */}
      <div className="flex items-center gap-1 bg-secondary p-1 rounded-xl mb-8 w-fit">
        {TIME_TABS.map(tab => (
          <button key={tab.key} onClick={() => setRange(tab.key)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={range === tab.key
              ? { background:"#6366f1", color:"#fff", boxShadow:"0 2px 8px rgba(99,102,241,0.3)" }
              : { }}
            >
            <span className={range === tab.key ? "" : "text-muted-foreground"}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Summary Cards — all dynamic */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Income ↑ = good, ↓ = bad */}
        <StatCard
          theme="emerald"
          label="TOTAL INCOME" value={`${currencySymbol}${formatAmount(d.totalIncome)}`} pct={incomePct} icon={TrendingUp}
          decreaseIsGood={false} />
        {/* Expenses ↑ = bad, ↓ = GOOD */}
        <StatCard
          theme="rose"
          label="TOTAL EXPENSES" value={`${currencySymbol}${formatAmount(d.totalExpenses)}`} pct={expensePct} icon={TrendingDown}
          decreaseIsGood={true} />
        {/* Net Savings ↑ = good, ↓ = bad */}
        <StatCard
          theme="indigo"
          label="NET SAVINGS" value={`${currencySymbol}${formatAmount(netSavings)}`} pct={savingsPct} icon={PiggyBank}
          decreaseIsGood={false} />
        {/* Savings Rate ↑ = good, ↓ = bad */}
        <StatCard
          theme="amber"
          label="SAVINGS RATE" value={`${savingsRate}%`} pct={ratePct} icon={DollarSign}
          decreaseIsGood={false} />
      </div>

      {/* Cash Flow Area Chart */}
      <Card className="shadow-sm border-border mb-6">
        <CardHeader className="pb-2 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Cash Flow</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Income vs Expenses — {TIME_TABS.find(t=>t.key===range)?.label}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{background:"#10b981"}} /><span className="text-xs text-slate-500">Income</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{background:"#f43f5e"}} /><span className="text-xs text-slate-500">Expenses</span></div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.flow} margin={{ top:10, right:10, left:-10, bottom:0 }}>
                <defs>
                  <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border, #e2e8f0)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize:12, fill:"#94a3b8" }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize:12, fill:"#94a3b8" }} tickFormatter={v=>`${currencySymbol}${v>=1000?(v/1000)+'k':v}`} />
                <Tooltip content={<CustomTooltip currencySymbol={currencySymbol} formatAmount={formatAmount} />} cursor={{stroke: "var(--secondary, rgba(241, 245, 249, 0.1))", strokeWidth: 1}} />
                <Area type="monotone" dataKey="income"   name="Income"   stroke="#10b981" strokeWidth={2.5} fill="url(#gIncome)"  dot={false} activeDot={{r:5,fill:"#10b981"}} />
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f43f5e" strokeWidth={2.5} fill="url(#gExpense)" dot={false} activeDot={{r:5,fill:"#f43f5e"}} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Donut + Bar Chart — both react to range */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">

        {/* Spending Donut — range-aware */}
        <Card className="lg:col-span-2 shadow-sm border-border">
          <CardHeader className="pb-2 border-b border-border/50">
            <h3 className="text-base font-semibold text-foreground">Spending Breakdown</h3>
            <p className="text-xs text-muted-foreground">{TIME_TABS.find(t=>t.key===range)?.label} by category</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col items-center">
              <div className="relative w-44 h-44 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={d.categories} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                      {d.categories.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip currencySymbol={currencySymbol} formatAmount={formatAmount} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-lg font-bold text-foreground">{currencySymbol}{formatAmount(totalCat)}</span>
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Total</span>
                </div>
              </div>
              <div className="w-full space-y-2.5">
                {d.categories.map(c => (
                  <div key={c.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:c.color}} />
                      <span className="text-sm text-foreground">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full" style={{width:`${(c.value/totalCat)*100}%`,background:c.color}} />
                      </div>
                      <span className="text-sm font-semibold text-foreground w-16 text-right">{currencySymbol}{formatAmount(c.value)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Month-over-Month Bar — range-aware */}
        <Card className="lg:col-span-3 shadow-sm border-border">
          <CardHeader className="pb-2 border-b border-border/50">
            <h3 className="text-base font-semibold text-foreground">Expense Comparison</h3>
            <p className="text-xs text-muted-foreground">Current vs previous period — {TIME_TABS.find(t=>t.key===range)?.label}</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.compare} margin={{top:10,right:10,left:-10,bottom:0}} barGap={6} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border, #e2e8f0)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:12,fill:"#94a3b8"}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize:12,fill:"#94a3b8"}} tickFormatter={v=>`${currencySymbol}${v>=1000?(v/1000)+'k':v}`} />
                  <Tooltip content={<CustomTooltip currencySymbol={currencySymbol} formatAmount={formatAmount} />} cursor={{fill:"var(--secondary, rgba(241, 245, 249, 0.1))", opacity: 0.5}} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{paddingTop:16,fontSize:12,color:"#64748b"}} />
                  <Bar dataKey="previous" name="Previous" fill="#e0e7ff" radius={[6,6,0,0]} />
                  <Bar dataKey="current"  name="Current"  fill="#6366f1" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Categories Ranked — range-aware */}
      <Card className="shadow-sm border-border">
        <CardHeader className="pb-2 border-b border-border/50">
          <h3 className="text-base font-semibold text-foreground">Top Spending Categories</h3>
          <p className="text-xs text-muted-foreground">Ranked by amount — {TIME_TABS.find(t=>t.key===range)?.label}</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...d.categories].sort((a,b)=>b.value-a.value).slice(0,5).map((c, i) => {
              const pct = Math.round((c.value / totalCat) * 100);
              return (
                <div key={c.name} className="flex items-center gap-4">
                  <span className="text-sm font-bold text-slate-400 w-4">#{i+1}</span>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:`${c.color}22`}}>
                    <div className="w-3 h-3 rounded-full" style={{background:c.color}} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-semibold text-foreground">{c.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{pct}%</span>
                        <span className="text-sm font-bold text-foreground">{currencySymbol}{formatAmount(c.value)}</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{width:`${pct}%`,background:c.color}} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
