import { useState } from "react";
import {
  Plus, MoreHorizontal, Pencil, Trash2, TrendingUp, AlertTriangle,
  Home, Utensils, Car, Zap, ShoppingBag, Heart, Film, Dumbbell,
  Plane, BookOpen, Coffee, Wallet, CheckCircle2, Search
} from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "../components/ui/dialog";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator
} from "../components/ui/dropdown-menu";
import { useGlobal } from "../context/GlobalContext";

// ─── Theme configs (fully static inline-style approach to avoid Tailwind purge) ──
const THEMES = {
  indigo:  { bgCard: "bg-indigo-50 dark:bg-indigo-950/30", border: "border-indigo-200 dark:border-indigo-900/50", iconBg: "text-indigo-600 dark:text-indigo-400", bar: "bg-indigo-500", text: "text-indigo-700 dark:text-indigo-300", badgeBg: "bg-indigo-100 dark:bg-indigo-900/50", badgeText: "text-indigo-700 dark:text-indigo-300" },
  emerald: { bgCard: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-900/50", iconBg: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300", badgeBg: "bg-emerald-100 dark:bg-emerald-900/50", badgeText: "text-emerald-700 dark:text-emerald-300" },
  amber:   { bgCard: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-900/50", iconBg: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500", text: "text-amber-700 dark:text-amber-300", badgeBg: "bg-amber-100 dark:bg-amber-900/50", badgeText: "text-amber-700 dark:text-amber-300" },
  rose:    { bgCard: "bg-rose-50 dark:bg-rose-950/30", border: "border-rose-200 dark:border-rose-900/50", iconBg: "text-rose-600 dark:text-rose-400", bar: "bg-rose-500", text: "text-rose-700 dark:text-rose-300", badgeBg: "bg-rose-100 dark:bg-rose-900/50", badgeText: "text-rose-700 dark:text-rose-300" },
  blue:    { bgCard: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-900/50", iconBg: "text-blue-600 dark:text-blue-400", bar: "bg-blue-500", text: "text-blue-700 dark:text-blue-300", badgeBg: "bg-blue-100 dark:bg-blue-900/50", badgeText: "text-blue-700 dark:text-blue-300" },
  violet:  { bgCard: "bg-violet-50 dark:bg-violet-950/30", border: "border-violet-200 dark:border-violet-900/50", iconBg: "text-violet-600 dark:text-violet-400", bar: "bg-violet-500", text: "text-violet-700 dark:text-violet-300", badgeBg: "bg-violet-100 dark:bg-violet-900/50", badgeText: "text-violet-700 dark:text-violet-300" },
  pink:    { bgCard: "bg-pink-50 dark:bg-pink-950/30", border: "border-pink-200 dark:border-pink-900/50", iconBg: "text-pink-600 dark:text-pink-400", bar: "bg-pink-500", text: "text-pink-700 dark:text-pink-300", badgeBg: "bg-pink-100 dark:bg-pink-900/50", badgeText: "text-pink-700 dark:text-pink-300" },
  cyan:    { bgCard: "bg-cyan-50 dark:bg-cyan-950/30", border: "border-cyan-200 dark:border-cyan-900/50", iconBg: "text-cyan-600 dark:text-cyan-400", bar: "bg-cyan-500", text: "text-cyan-700 dark:text-cyan-300", badgeBg: "bg-cyan-100 dark:bg-cyan-900/50", badgeText: "text-cyan-700 dark:text-cyan-300" },
};

const CATEGORY_OPTIONS = [
  { label: "Housing",        icon: Home,        theme: "indigo"  },
  { label: "Food & Dining",  icon: Utensils,    theme: "emerald" },
  { label: "Transport",      icon: Car,         theme: "amber"   },
  { label: "Utilities",      icon: Zap,         theme: "cyan"    },
  { label: "Shopping",       icon: ShoppingBag, theme: "blue"    },
  { label: "Health",         icon: Heart,       theme: "rose"    },
  { label: "Entertainment",  icon: Film,        theme: "violet"  },
  { label: "Gym & Fitness",  icon: Dumbbell,    theme: "pink"    },
  { label: "Travel",         icon: Plane,       theme: "indigo"  },
  { label: "Education",      icon: BookOpen,    theme: "blue"    },
  { label: "Coffee & Cafe",  icon: Coffee,      theme: "amber"   },
];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ─── Budget Modal ─────────────────────────────────────────────────────────────
function BudgetModal({ open, onClose, onSave, initial }) {
  const { getConvertedAmount, formatAmount, currencySymbol } = useGlobal();
  const [category, setCategory] = useState(initial?.category || CATEGORY_OPTIONS[0].label);
  const initialLimit = initial?.limit ? getConvertedAmount(initial.limit).toString() : "";
  const [limit,    setLimit]    = useState(initialLimit);
  const isEdit = !!initial;

  const selectedOpt = CATEGORY_OPTIONS.find(c => c.label === category) || CATEGORY_OPTIONS[0];
  const t = THEMES[selectedOpt.theme];

  function handleSave() {
    if (!limit || isNaN(Number(limit)) || Number(limit) <= 0) return;
    onSave({ category, theme: selectedOpt.theme, limit: Number(limit) });
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Budget" : "Create New Budget"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the spending limit for this category." : "Set a monthly spending limit for a category."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Category Picker */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Category</label>
            <div className="grid grid-cols-3 gap-2 max-h-[160px] overflow-y-auto pr-1">
              {CATEGORY_OPTIONS.map((opt) => {
                const ot = THEMES[opt.theme];
                const isSelected = category === opt.label;
                const cardBorder = isSelected ? ot.border : "border-transparent";
                const bgClasses = isSelected ? ot.bgCard : "bg-secondary";
                const iconBgColor = isSelected ? ot.iconBg : "bg-muted";
                const iconColor = isSelected ? "text-white" : "text-muted-foreground";
                const textColor = isSelected ? ot.text : "text-muted-foreground";
                return (
                  <button
                    key={opt.label}
                    onClick={() => setCategory(opt.label)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 hover:bg-secondary/80 transition-all text-center ${bgClasses} ${cardBorder}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBgColor.replace("text-", "bg-").split(" ")[0]}`}>
                      <opt.icon className={`w-4 h-4 ${iconColor}`} />
                    </div>
                    <span className={`text-xs font-medium leading-tight ${textColor}`}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Monthly Limit */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Monthly Limit ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
              <Input type="number" placeholder="e.g. 500" value={limit} onChange={e => setLimit(e.target.value)} className="pl-7 bg-secondary text-foreground" />
            </div>
          </div>

          {/* Live Preview */}
          {limit && (
            <div className={`rounded-xl p-4 border-2 ${t.bgCard} ${t.border}`}>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${t.iconBg.replace("text-", "bg-").split(" ")[0]}`}>
                    <selectedOpt.icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className={`text-sm font-semibold ${t.text}`}>{category}</span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.badgeBg} ${t.badgeText}`}>
                  {currencySymbol}{initial?.spent ? formatAmount(initial.spent) : "0.00"} / {currencySymbol}{limit}
                </span>
              </div>
              <div className="h-2 rounded-full bg-secondary/80">
                <div className={`h-full rounded-full transition-all ${t.bar}`} style={{ width: `${Math.min(((initial?.spent||0)/Number(limit))*100, 100)}%` }} />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={!limit || Number(limit) <= 0} className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              {isEdit ? "Save Changes" : "Create Budget"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteConfirmModal({ open, onClose, onConfirm, category }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <div className="flex flex-col items-center gap-4 pt-2 pb-1 text-center">
          <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <DialogTitle className="text-center">Delete Budget?</DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Are you sure you want to delete <span className="font-semibold text-foreground">"{category}"</span>? This cannot be undone.
            </p>
          </div>
          <div className="flex gap-3 w-full pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors">
              Cancel
            </button>
            <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors">
              Delete
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BudgetsPage() {
  const { budgets, addBudget, updateBudget, deleteBudget, transactions, formatAmount, currencySymbol, parseAmountToBase } = useGlobal();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [searchTerm, setSearchTerm] = useState("");
  const [addOpen,      setAddOpen]      = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Auto-calculate spent amount dynamically based on transactions
  const currentYear = new Date().getFullYear();
  const enrichedBudgets = budgets.map(b => {
    const spent = transactions
      .filter(t => {
        if (t.type !== "expense" || t.category !== b.category) return false;
        const d = new Date(t.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);
    return { ...b, spent };
  });

  const filteredBudgets = enrichedBudgets.filter(b => 
    b.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalLimit = filteredBudgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = filteredBudgets.reduce((s, b) => s + b.spent, 0);
  const totalPct   = totalLimit ? Math.round((totalSpent / totalLimit) * 100) : 0;
  const onTrack    = filteredBudgets.filter(b => (b.spent / b.limit) < 0.8).length;
  const warnings   = filteredBudgets.filter(b => { const p = b.spent/b.limit; return p >= 0.8 && p < 1; }).length;
  const exceeded   = filteredBudgets.filter(b => b.spent >= b.limit).length;

  const handleAdd = async (data) => { await addBudget({ ...data, limit: parseAmountToBase(data.limit) }); setAddOpen(false); };
  const handleEdit = async (data) => { await updateBudget(editTarget.id, { ...data, limit: parseAmountToBase(data.limit) }); setEditTarget(null); };
  const handleDelete = async () => { await deleteBudget(deleteTarget.id); setDeleteTarget(null); };

  return (
    <div className="max-w-[1200px] mx-auto pb-24">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Budgets</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage your monthly spending limits per category.</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search budgets..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-card border-border w-full text-foreground" 
            />
          </div>
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className="appearance-none pl-4 pr-8 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {MONTHS.map((m, i) => <option key={m} value={i}>{m} 2026</option>)}
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">▾</div>
          </div>
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> New Budget
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <Card className="shadow-sm border-indigo-200 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-950/30">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/50">
              <Wallet className="w-6 h-6 text-indigo-700 dark:text-indigo-400" />
            </div>
            <div className="w-full">
              <p className="text-xs font-medium uppercase tracking-wider mb-1 text-indigo-700/70 dark:text-indigo-300/70">Total Budget</p>
              <div className="amount-display">
                <span className="text-xl md:text-2xl font-bold text-indigo-800 dark:text-indigo-300 truncate max-w-full">
                  {currencySymbol}{formatAmount(totalSpent)}
                </span>
                <span className="text-xs md:text-sm text-indigo-700/70 dark:text-indigo-300/70 whitespace-nowrap">
                  / {currencySymbol}{formatAmount(totalLimit)}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2 w-full">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-indigo-200 dark:bg-indigo-950">
                  <div className="h-full rounded-full transition-all bg-indigo-500" style={{ width: `${Math.min(totalPct, 100)}%` }} />
                </div>
                <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 shrink-0">{totalPct}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-100 dark:bg-emerald-900/50">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider mb-1 text-emerald-700/70 dark:text-emerald-300/70">On Track</p>
              <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">{onTrack} <span className="text-base font-normal">categories</span></p>
              <p className="text-xs mt-1 text-emerald-700/70 dark:text-emerald-300/70">
                {onTrack > 0 ? "Spending is within safe limits" : "No categories on track yet"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-rose-100 dark:bg-rose-900/50">
              <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider mb-1 text-rose-700/70 dark:text-rose-300/70">Needs Attention</p>
              <p className="text-2xl font-bold text-rose-800 dark:text-rose-300">{warnings + exceeded} <span className="text-base font-normal">categories</span></p>
              <p className="text-xs mt-1 text-rose-700/70 dark:text-rose-300/70">{exceeded} exceeded · {warnings} near limit</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredBudgets.map((budget) => {
          const pct       = Math.min((budget.spent / budget.limit) * 100, 100);
          const rawPct    = (budget.spent / budget.limit) * 100;
          const isWarn    = rawPct >= 80 && rawPct < 100;
          const isDanger  = rawPct >= 100;
          const t         = THEMES[budget.theme] || THEMES.indigo;
          const opt       = CATEGORY_OPTIONS.find(c => c.label === budget.category);
          const Icon      = opt ? opt.icon : Home;
          const remaining = Math.max(budget.limit - budget.spent, 0);
          const barColor  = isDanger ? "bg-rose-500" : isWarn ? "bg-amber-500" : t.bar;
          const cardBorder = isDanger ? "border-rose-300 dark:border-rose-900/50" : isWarn ? "border-amber-300 dark:border-amber-900/50" : t.border;
          const cardBg = isDanger ? "bg-rose-50 dark:bg-rose-950/30" : isWarn ? "bg-amber-50 dark:bg-amber-950/30" : t.bgCard;
          const iconBgColor = isDanger ? "bg-rose-500 text-white" : isWarn ? "bg-amber-500 text-white" : t.badgeBg + " " + t.iconBg;

          return (
            <div
              key={budget.id}
              className={`rounded-2xl border-2 shadow-sm hover:shadow-xl transition-all duration-200 ${cardBg} ${cardBorder}`}
            >
              <div className="p-5">
                {/* Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm shrink-0 ${iconBgColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-bold text-foreground truncate">{budget.category}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5 whitespace-nowrap">Monthly Budget</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/60 transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditTarget(budget)}>
                        <Pencil className="w-4 h-4 text-muted-foreground" /> Edit Budget
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setDeleteTarget(budget)} className="text-rose-600 hover:bg-rose-50 focus:bg-rose-50">
                        <Trash2 className="w-4 h-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Amount */}
                <div className="flex flex-col mb-4">
                  <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground break-words overflow-hidden">
                    {currencySymbol}{formatAmount(budget.spent)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 whitespace-nowrap">
                    of <span className="font-semibold text-foreground">{currencySymbol}{formatAmount(budget.limit)}</span> limit
                  </p>
                </div>

                <div className="absolute top-5 right-12">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${isDanger ? "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400" : isWarn ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400" : t.badgeBg + " " + t.badgeText}`}>
                    {Math.round(rawPct)}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-3 rounded-full overflow-hidden mb-3 bg-secondary">
                  <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
                </div>

                {/* Status Footer */}
                <div className="flex items-center justify-between pt-1">
                  {isDanger ? (
                    <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                      <AlertTriangle className="w-3.5 h-3.5" /><span className="text-xs font-semibold">Budget exceeded!</span>
                    </div>
                  ) : isWarn ? (
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5" /><span className="text-xs font-semibold">Approaching limit</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">On track</span>
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground font-medium">{currencySymbol}{formatAmount(remaining)} left</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Category Card */}
        <button
          onClick={() => setAddOpen(true)}
          className="min-h-[230px] rounded-2xl border-2 border-dashed border-border bg-card/50 hover:border-indigo-500/50 hover:bg-secondary/50 transition-all duration-200 flex flex-col items-center justify-center gap-3 group"
        >
          <div className="w-12 h-12 rounded-xl bg-secondary group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 flex items-center justify-center transition-colors">
            <Plus className="w-6 h-6 text-muted-foreground group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Add Category</p>
            <p className="text-xs text-muted-foreground mt-0.5">Track a new spending limit</p>
          </div>
        </button>
      </div>

      {/* Modals */}
      <BudgetModal open={addOpen} onClose={() => setAddOpen(false)} onSave={handleAdd} initial={null} />
      {editTarget && <BudgetModal open={!!editTarget} onClose={() => setEditTarget(null)} onSave={handleEdit} initial={editTarget} />}
      {deleteTarget && <DeleteConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} category={deleteTarget?.category} />}
    </div>
  );
}
