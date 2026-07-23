import { useState } from "react";
import { Plus, MoreHorizontal, Pencil, Trash2, Target, PiggyBank, Trophy, Home, Car, Plane, BookOpen, Laptop, Heart, Dumbbell, Star, TrendingUp, CheckCircle2, Calendar } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "../components/ui/dropdown-menu";
import { Search } from "lucide-react";
import { useGlobal } from "../context/GlobalContext";

const THEMES = {
  emerald: { bgCard: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-900/50", iconBg: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300", badgeBg: "bg-emerald-100 dark:bg-emerald-900/50", badgeText: "text-emerald-700 dark:text-emerald-300" },
  blue:    { bgCard: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-900/50", iconBg: "text-blue-600 dark:text-blue-400", bar: "bg-blue-500", text: "text-blue-700 dark:text-blue-300", badgeBg: "bg-blue-100 dark:bg-blue-900/50", badgeText: "text-blue-700 dark:text-blue-300" },
  amber:   { bgCard: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-900/50", iconBg: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500", text: "text-amber-700 dark:text-amber-300", badgeBg: "bg-amber-100 dark:bg-amber-900/50", badgeText: "text-amber-700 dark:text-amber-300" },
  violet:  { bgCard: "bg-violet-50 dark:bg-violet-950/30", border: "border-violet-200 dark:border-violet-900/50", iconBg: "text-violet-600 dark:text-violet-400", bar: "bg-violet-500", text: "text-violet-700 dark:text-violet-300", badgeBg: "bg-violet-100 dark:bg-violet-900/50", badgeText: "text-violet-700 dark:text-violet-300" },
  indigo:  { bgCard: "bg-indigo-50 dark:bg-indigo-950/30", border: "border-indigo-200 dark:border-indigo-900/50", iconBg: "text-indigo-600 dark:text-indigo-400", bar: "bg-indigo-500", text: "text-indigo-700 dark:text-indigo-300", badgeBg: "bg-indigo-100 dark:bg-indigo-900/50", badgeText: "text-indigo-700 dark:text-indigo-300" },
  rose:    { bgCard: "bg-rose-50 dark:bg-rose-950/30", border: "border-rose-200 dark:border-rose-900/50", iconBg: "text-rose-600 dark:text-rose-400", bar: "bg-rose-500", text: "text-rose-700 dark:text-rose-300", badgeBg: "bg-rose-100 dark:bg-rose-900/50", badgeText: "text-rose-700 dark:text-rose-300" },
  pink:    { bgCard: "bg-pink-50 dark:bg-pink-950/30", border: "border-pink-200 dark:border-pink-900/50", iconBg: "text-pink-600 dark:text-pink-400", bar: "bg-pink-500", text: "text-pink-700 dark:text-pink-300", badgeBg: "bg-pink-100 dark:bg-pink-900/50", badgeText: "text-pink-700 dark:text-pink-300" },
  cyan:    { bgCard: "bg-cyan-50 dark:bg-cyan-950/30", border: "border-cyan-200 dark:border-cyan-900/50", iconBg: "text-cyan-600 dark:text-cyan-400", bar: "bg-cyan-500", text: "text-cyan-700 dark:text-cyan-300", badgeBg: "bg-cyan-100 dark:bg-cyan-900/50", badgeText: "text-cyan-700 dark:text-cyan-300" },
};

const GOAL_OPTIONS = [
  { label:"Emergency Fund", icon:PiggyBank, theme:"emerald" },
  { label:"New Car",        icon:Car,       theme:"blue"    },
  { label:"Vacation",       icon:Plane,     theme:"amber"   },
  { label:"Education",      icon:BookOpen,  theme:"violet"  },
  { label:"New Home",       icon:Home,      theme:"indigo"  },
  { label:"Laptop/Tech",    icon:Laptop,    theme:"cyan"    },
  { label:"Health Fund",    icon:Heart,     theme:"rose"    },
  { label:"Fitness",        icon:Dumbbell,  theme:"pink"    },
  { label:"Custom Goal",    icon:Star,      theme:"amber"   },
];

function daysLeft(dateStr) {
  const diff = new Date(dateStr) - new Date();
  return Math.max(0, Math.ceil(diff / (1000*60*60*24)));
}

function GoalModal({ open, onClose, onSave, initial }) {
  const isEdit = !!initial;
  const { getConvertedAmount, currencySymbol } = useGlobal();
  const [name,    setName]    = useState(initial?.name    || GOAL_OPTIONS[0].label);
  const [target,  setTarget]  = useState(initial?.target ? getConvertedAmount(initial.target).toString() : "");
  const [current, setCurrent] = useState(initial?.current ? getConvertedAmount(initial.current).toString() : "0");
  const [date,    setDate]    = useState(initial?.date    || "");
  const [theme,   setTheme]   = useState(initial?.theme   || "emerald");
  const [icon,    setIcon]    = useState(initial?.icon    || PiggyBank);

  function pickPreset(opt) { setName(opt.label); setTheme(opt.theme); setIcon(opt.icon); }

  function handleSave() {
    if (!target || Number(target) <= 0) return;
    onSave({ name, theme, target: Number(target), current: Number(current)||0, date });
    onClose();
  }

  const t = THEMES[theme] || THEMES.emerald;
  const pct = target ? Math.min((Number(current)||0)/Number(target)*100,100) : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Goal" : "Create New Goal"}</DialogTitle>
          <DialogDescription>{isEdit ? "Update your savings goal details." : "Set a new financial goal to work towards."}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Goal Type</label>
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
              {GOAL_OPTIONS.map(opt => {
                const ot = THEMES[opt.theme]; const isSel = name === opt.label;
                const cardBorder = isSel ? ot.border : "border-transparent";
                const bgClasses = isSel ? ot.bgCard : "bg-secondary";
                const iconBgColor = isSel ? ot.iconBg : "bg-muted";
                const iconColor = isSel ? "text-white" : "text-muted-foreground";
                const textColor = isSel ? ot.text : "text-muted-foreground";

                return (
                  <button key={opt.label} onClick={() => pickPreset(opt)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 hover:bg-secondary/80 transition-all text-center ${bgClasses} ${cardBorder}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBgColor.replace("text-", "bg-").split(" ")[0]}`}>
                      <opt.icon className={`w-4 h-4 ${iconColor}`} />
                    </div>
                    <span className={`text-xs font-medium leading-tight ${textColor}`}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Goal Name</label>
            <Input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Buy iPhone 16" className="bg-secondary text-foreground" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Target Amount ($)</label>
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input type="number" value={target} onChange={e=>setTarget(e.target.value)} placeholder="5000" className="pl-7 bg-secondary text-foreground" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Already Saved ($)</label>
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input type="number" value={current} onChange={e=>setCurrent(e.target.value)} placeholder="0" className="pl-7 bg-secondary text-foreground" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Target Date</label>
            <Input type="date" value={date} onChange={e=>setDate(e.target.value)} className="bg-secondary text-foreground" />
          </div>
          {target && (
            <div className={`rounded-xl p-4 border-2 ${t.bgCard} ${t.border}`}>
              <div className="flex justify-between items-center mb-2">
                <span className={`text-sm font-semibold ${t.text}`}>{name || "Your Goal"}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.badgeBg} ${t.badgeText}`}>{Math.round(pct)}%</span>
              </div>
              <div className="h-2 rounded-full bg-secondary/80">
                <div className={`h-full rounded-full transition-all ${t.bar}`} style={{width:`${pct}%`}} />
              </div>
              <p className={`text-xs mt-2 ${t.text}`}>{currencySymbol}{current||"0"} saved of {currencySymbol}{target||"0"}</p>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={!target||Number(target)<=0} className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40">
              {isEdit ? "Save Changes" : "Create Goal"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddFundsModal({ open, onClose, onAdd, goal }) {
  const [amount, setAmount] = useState("");
  const { formatAmount, currencySymbol } = useGlobal();
  const t = THEMES[goal?.theme] || THEMES.emerald;
  function handleAdd() {
    if (!amount || Number(amount) <= 0) return;
    onAdd(Number(amount)); setAmount(""); onClose();
  }
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Funds</DialogTitle>
          <DialogDescription>How much did you save towards <span className="font-semibold">{goal?.name}</span>?</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {goal && (
            <div className={`rounded-xl p-4 border-2 ${t.bgCard} ${t.border}`}>
              <div className="flex justify-between mb-2">
                <span className={`text-sm font-semibold ${t.text}`}>{goal.name}</span>
                <span className={`text-sm font-bold ${t.text}`}>{currencySymbol}{formatAmount(goal.current)} / {currencySymbol}{formatAmount(goal.target)}</span>
              </div>
              <div className="h-2.5 rounded-full bg-secondary/80">
                <div className={`h-full rounded-full ${t.bar}`} style={{width:`${Math.min(goal.current/goal.target*100,100)}%`}} />
              </div>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Amount to Add ($)</label>
            <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="e.g. 200" className="pl-7 bg-secondary text-foreground" autoFocus />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary">Cancel</button>
            <button onClick={handleAdd} disabled={!amount||Number(amount)<=0} className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-40 ${t.iconBg.replace("text-", "bg-").split(" ")[0]}`}>
              Add {currencySymbol}{amount||"0"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeleteModal({ open, onClose, onConfirm, name }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <div className="flex flex-col items-center gap-4 pt-2 pb-1 text-center">
          <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center"><Trash2 className="w-6 h-6 text-rose-600 dark:text-rose-400" /></div>
          <div>
            <DialogTitle className="text-center">Delete Goal?</DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">Are you sure you want to delete <span className="font-semibold text-foreground">"{name}"</span>? This cannot be undone.</p>
          </div>
          <div className="flex gap-3 w-full">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary">Cancel</button>
            <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600">Delete</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function SavingsPage() {
  const { savings: goals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, formatAmount, currencySymbol, parseAmountToBase, addTransaction } = useGlobal();
  const [searchTerm, setSearchTerm] = useState("");
  const [addOpen,     setAddOpen]     = useState(false);
  const [editTarget,  setEditTarget]  = useState(null);
  const [deleteTarget,setDeleteTarget]= useState(null);
  const [fundsTarget, setFundsTarget] = useState(null);

  const filteredGoals = goals.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const totalSaved   = filteredGoals.reduce((s,g) => s+g.current, 0);
  const totalTarget  = filteredGoals.reduce((s,g) => s+g.target,  0);
  const completed    = filteredGoals.filter(g => g.current >= g.target).length;
  const nearest      = [...filteredGoals].filter(g=>g.current<g.target).sort((a,b)=>((a.target-a.current)/a.target)-((b.target-b.current)/b.target))[0];

  const handleAdd = async (data) => { 
    await addSavingsGoal({...data, target: parseAmountToBase(data.target), current: parseAmountToBase(data.current)}); 
    setAddOpen(false); 
  }
  const handleEdit = async (data) => { 
    await updateSavingsGoal(editTarget.id, {...data, target: parseAmountToBase(data.target), current: parseAmountToBase(data.current)}); 
    setEditTarget(null); 
  }
  const handleDelete = async () => { await deleteSavingsGoal(deleteTarget.id); setDeleteTarget(null); }
  
  // Phase 3: Relational Logic - Deduct from main balance
  const handleAddFunds = async (amt) => {
    const baseAmt = parseAmountToBase(amt);
    const updatedCurrent = Math.min(fundsTarget.current + baseAmt, fundsTarget.target);
    await updateSavingsGoal(fundsTarget.id, { current: updatedCurrent });
    
    // Automatically log this transfer as an expense so it deducts from total balance
    await addTransaction({
      title: `Transfer to ${fundsTarget.name}`,
      type: "expense",
      amount: baseAmt,
      date: new Date().toISOString().split('T')[0],
      category: "Savings Transfer"
    });

    setFundsTarget(null);
  }

  return (
    <div className="max-w-[1200px] mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Savings Goals</h1>
          <p className="text-muted-foreground mt-1 text-sm">Track your progress towards your financial milestones.</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search goals..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-card border-border w-full text-foreground" 
            />
          </div>
          <button onClick={()=>setAddOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm w-full md:w-auto justify-center">
            <Plus className="w-4 h-4" /> New Goal
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <Card className="shadow-sm border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-100 dark:bg-emerald-900/50">
              <PiggyBank className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider mb-1 text-emerald-700/70 dark:text-emerald-300/70">Total Saved</p>
              <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">{currencySymbol}{formatAmount(totalSaved)}</p>
              <p className="text-xs mt-1 text-emerald-700/70 dark:text-emerald-300/70">of {currencySymbol}{formatAmount(totalTarget)} across all goals</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-indigo-200 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-950/30">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/50">
              <Trophy className="w-6 h-6 text-indigo-700 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider mb-1 text-indigo-700/70 dark:text-indigo-300/70">Goals Achieved</p>
              <p className="text-2xl font-bold text-indigo-800 dark:text-indigo-300">{completed} <span className="text-base font-normal">of {goals.length}</span></p>
              <p className="text-xs mt-1 text-indigo-700/70 dark:text-indigo-300/70">{goals.length - completed} still in progress</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-100 dark:bg-amber-900/50">
              <Target className="w-6 h-6 text-amber-700 dark:text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider mb-1 text-amber-700/70 dark:text-amber-500/70">Next Milestone</p>
              <p className="text-lg font-bold leading-tight text-amber-800 dark:text-amber-400">{nearest?.name || "All done! 🎉"}</p>
              {nearest && <p className="text-xs mt-1 text-amber-700/70 dark:text-amber-500/70">{currencySymbol}{formatAmount(nearest.target-nearest.current)} remaining</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredGoals.map(goal => {
          const t        = THEMES[goal.theme] || THEMES.emerald;
          const pct      = Math.min((goal.current/goal.target)*100, 100);
          const isDone   = goal.current >= goal.target;
          const remaining= Math.max(goal.target - goal.current, 0);
          const days     = goal.date ? daysLeft(goal.date) : null;
          const opt      = GOAL_OPTIONS.find(g => g.label === goal.name);
          const Icon     = opt ? opt.icon : Target;

          const cardBorder = isDone ? "border-emerald-300 dark:border-emerald-900/50" : t.border;
          const iconBgColor = isDone ? "bg-emerald-500 text-white" : t.badgeBg + " " + t.iconBg;
          const textClasses = t.text;

          return (
            <div key={goal.id} className={`rounded-2xl border-2 shadow-sm hover:shadow-xl transition-all duration-200 ${t.bgCard} ${cardBorder}`}>
              <div className="p-5">
                {/* Card Header */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${iconBgColor}`}>
                      {isDone ? <CheckCircle2 className="w-6 h-6 text-white" /> : <Icon className="w-6 h-6" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">{goal.name}</h4>
                      {goal.date && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Calendar className={`w-3 h-3 ${textClasses}`} />
                          <span className={`text-xs ${textClasses}`}>
                            {isDone ? "Completed!" : `${days} days left`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/60 transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={()=>setFundsTarget(goal)}>
                        <TrendingUp className="w-4 h-4 text-emerald-500" /> Add Funds
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={()=>setEditTarget(goal)}>
                        <Pencil className="w-4 h-4 text-muted-foreground" /> Edit Goal
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={()=>setDeleteTarget(goal)} className="text-rose-600 hover:bg-rose-50 focus:bg-rose-50 dark:focus:bg-rose-950/30">
                        <Trash2 className="w-4 h-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Amounts */}
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-4xl font-bold text-foreground">{currencySymbol}{formatAmount(goal.current)}</p>
                    <p className="text-xs text-muted-foreground mt-1">of <span className="font-semibold text-foreground">{currencySymbol}{formatAmount(goal.target)}</span> goal</p>
                  </div>
                  <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${isDone ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400" : t.badgeBg + " " + t.badgeText}`}>
                    {Math.round(pct)}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-3 rounded-full overflow-hidden mb-4 bg-secondary/80">
                  <div className={`h-full rounded-full transition-all duration-700 ${isDone ? "bg-emerald-500" : t.bar}`} style={{width:`${pct}%`}} />
                </div>

                {/* Footer Actions */}
                {isDone ? (
                  <div className="flex items-center justify-center gap-2 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/50">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">🎉 Goal Achieved!</span>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={()=>setFundsTarget(goal)}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 shadow-sm ${isDone ? "bg-emerald-500" : t.iconBg.replace("text-", "bg-").split(" ")[0]}`}>
                      + Add Funds
                    </button>
                    <div className="flex flex-col items-end justify-center px-3 py-1.5 rounded-xl bg-background/50">
                      <span className="text-xs text-muted-foreground">Remaining</span>
                      <span className={`text-sm font-bold ${t.text}`}>{currencySymbol}{formatAmount(remaining)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Add New Goal Card */}
        <button onClick={()=>setAddOpen(true)}
          className="min-h-[280px] rounded-2xl border-2 border-dashed border-border bg-card/50 hover:border-emerald-500/50 hover:bg-secondary/50 transition-all duration-200 flex flex-col items-center justify-center gap-3 group">
          <div className="w-14 h-14 rounded-xl bg-secondary group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 flex items-center justify-center transition-colors">
            <Plus className="w-7 h-7 text-muted-foreground group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Add New Goal</p>
            <p className="text-xs text-muted-foreground mt-0.5">Start saving towards something</p>
          </div>
        </button>
      </div>

      {/* Modals */}
      <GoalModal  open={addOpen}       onClose={()=>setAddOpen(false)}     onSave={handleAdd}     initial={null} />
      {editTarget   && <GoalModal    open={!!editTarget}   onClose={()=>setEditTarget(null)}   onSave={handleEdit}     initial={editTarget} />}
      {deleteTarget && <DeleteModal  open={!!deleteTarget} onClose={()=>setDeleteTarget(null)} onConfirm={handleDelete} name={deleteTarget?.name} />}
      {fundsTarget  && <AddFundsModal open={!!fundsTarget} onClose={()=>setFundsTarget(null)}  onAdd={handleAddFunds}  goal={fundsTarget} />}
    </div>
  );
}
