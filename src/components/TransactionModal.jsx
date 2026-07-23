import { useState } from "react";
import {
  Home, Utensils, Car, Zap, ShoppingBag, Heart, Film, Dumbbell,
  Plane, BookOpen, Coffee, Wallet, ArrowUpRight, Plus, PiggyBank
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { useGlobal } from "../context/GlobalContext";

const THEMES = {
  indigo:  { bgCard: "bg-indigo-50 dark:bg-indigo-950/30", border: "border-indigo-200 dark:border-indigo-900/50", iconBg: "text-indigo-600 dark:text-indigo-400", text: "text-indigo-700 dark:text-indigo-300", badgeBg: "bg-indigo-100 dark:bg-indigo-900/50" },
  emerald: { bgCard: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-900/50", iconBg: "text-emerald-600 dark:text-emerald-400", text: "text-emerald-700 dark:text-emerald-300", badgeBg: "bg-emerald-100 dark:bg-emerald-900/50" },
  amber:   { bgCard: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-900/50", iconBg: "text-amber-600 dark:text-amber-400", text: "text-amber-700 dark:text-amber-300", badgeBg: "bg-amber-100 dark:bg-amber-900/50" },
  rose:    { bgCard: "bg-rose-50 dark:bg-rose-950/30", border: "border-rose-200 dark:border-rose-900/50", iconBg: "text-rose-600 dark:text-rose-400", text: "text-rose-700 dark:text-rose-300", badgeBg: "bg-rose-100 dark:bg-rose-900/50" },
  blue:    { bgCard: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-900/50", iconBg: "text-blue-600 dark:text-blue-400", text: "text-blue-700 dark:text-blue-300", badgeBg: "bg-blue-100 dark:bg-blue-900/50" },
  violet:  { bgCard: "bg-violet-50 dark:bg-violet-950/30", border: "border-violet-200 dark:border-violet-900/50", iconBg: "text-violet-600 dark:text-violet-400", text: "text-violet-700 dark:text-violet-300", badgeBg: "bg-violet-100 dark:bg-violet-900/50" },
  pink:    { bgCard: "bg-pink-50 dark:bg-pink-950/30", border: "border-pink-200 dark:border-pink-900/50", iconBg: "text-pink-600 dark:text-pink-400", text: "text-pink-700 dark:text-pink-300", badgeBg: "bg-pink-100 dark:bg-pink-900/50" },
  cyan:    { bgCard: "bg-cyan-50 dark:bg-cyan-950/30", border: "border-cyan-200 dark:border-cyan-900/50", iconBg: "text-cyan-600 dark:text-cyan-400", text: "text-cyan-700 dark:text-cyan-300", badgeBg: "bg-cyan-100 dark:bg-cyan-900/50" },
};

export const CATEGORIES = {
  expense: [
    { label: "Housing",         icon: Home,        theme: "indigo"  },
    { label: "Food & Dining",   icon: Utensils,    theme: "emerald" },
    { label: "Transport",       icon: Car,         theme: "amber"   },
    { label: "Utilities",       icon: Zap,         theme: "cyan"    },
    { label: "Shopping",        icon: ShoppingBag, theme: "blue"    },
    { label: "Health",          icon: Heart,       theme: "rose"    },
    { label: "Entertainment",   icon: Film,        theme: "violet"  },
    { label: "Gym & Fitness",   icon: Dumbbell,    theme: "pink"    },
    { label: "Travel",          icon: Plane,       theme: "indigo"  },
    { label: "Education",       icon: BookOpen,    theme: "blue"    },
    { label: "Coffee & Cafe",   icon: Coffee,      theme: "amber"   },
    { label: "Savings Transfer",icon: PiggyBank,   theme: "emerald" },
  ],
  income: [
    { label: "Salary",          icon: Wallet,      theme: "emerald" },
    { label: "Freelance",       icon: BookOpen,    theme: "blue"    },
    { label: "Investments",     icon: ArrowUpRight, theme: "indigo" },
    { label: "Other Income",    icon: Plus,        theme: "amber"   },
  ]
};

const getTodayStr = () => new Date().toISOString().split('T')[0];

export default function TransactionModal({ open, onClose, onSave, initial, defaultType }) {
  const isEdit = !!initial;
  const { getConvertedAmount, currencySymbol } = useGlobal();
  const initialAmount = initial?.amount ? getConvertedAmount(initial.amount).toString() : "";
  const startType = initial?.type || defaultType || "expense";

  const [type, setType] = useState(startType);
  const [title, setTitle] = useState(initial?.title || "");
  const [amount, setAmount] = useState(initialAmount);
  const [date, setDate] = useState(initial?.date || getTodayStr());
  const [category, setCategory] = useState(initial?.category || CATEGORIES[startType][0].label);

  const handleTypeChange = (newType) => {
    setType(newType);
    setCategory(CATEGORIES[newType][0].label);
  };

  const handleSave = () => {
    if (!title || !amount || Number(amount) <= 0 || !date) return;
    onSave({ title, type, amount: Number(amount), date, category });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
          <DialogDescription>{isEdit ? "Update details for this transaction." : "Record a new income or expense."}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          {/* Type Toggle */}
          <div className="flex p-1 bg-secondary rounded-xl">
            <button
              onClick={() => handleTypeChange("expense")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${type === 'expense' ? 'bg-card text-rose-600 dark:text-rose-400 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >Expense</button>
            <button
              onClick={() => handleTypeChange("income")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${type === 'income' ? 'bg-card text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >Income</button>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Amount ({currencySymbol})</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">{currencySymbol}</span>
              <Input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="pl-7 bg-secondary text-foreground text-lg font-semibold" autoFocus />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Title / Description</label>
            <Input
              placeholder={type === 'income' ? "e.g. Salary / Freelance" : "e.g. Morning Coffee"}
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="bg-secondary text-foreground"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Date</label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-secondary text-foreground" />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Category</label>
            <div className="grid grid-cols-4 gap-2 max-h-[140px] overflow-y-auto pr-1">
              {CATEGORIES[type].map(opt => {
                const t = THEMES[opt.theme];
                const isSelected = category === opt.label;
                return (
                  <button key={opt.label} onClick={() => setCategory(opt.label)} title={opt.label}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 hover:bg-secondary/80 transition-all text-center ${isSelected ? `${t.bgCard} ${t.border}` : "bg-secondary border-transparent"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSelected ? t.badgeBg : "bg-muted"}`}>
                      <opt.icon className={`w-4 h-4 ${isSelected ? t.iconBg : "text-muted-foreground"}`} />
                    </div>
                    <span className={`text-[10px] font-medium truncate w-full ${isSelected ? t.text : "text-muted-foreground"}`}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary">Cancel</button>
            <button onClick={handleSave} disabled={!amount || !title}
              className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-colors disabled:opacity-50 ${type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-primary hover:bg-primary/90'}`}>
              {isEdit ? "Save Changes" : "Add Transaction"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
