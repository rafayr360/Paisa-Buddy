import { useState, useMemo, useEffect } from "react";
import { 
  Search, Plus, Download, MoreHorizontal, Pencil, Trash2, X,
  Home, Utensils, Car, Zap, ShoppingBag, Heart, Film, Dumbbell, 
  Plane, BookOpen, Coffee, Wallet, ArrowDownRight, ArrowUpRight, Calendar, PiggyBank,
  ArrowUpDown, SlidersHorizontal
} from "lucide-react";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "../components/ui/dropdown-menu";
import { useGlobal } from "../context/GlobalContext";
import TransactionModal from "../components/TransactionModal";

// --- Themes for categories ---
const THEMES = {
  indigo:  { bgCard: "bg-indigo-50 dark:bg-indigo-950/30", border: "border-indigo-200 dark:border-indigo-900/50", iconBg: "text-indigo-600 dark:text-indigo-400", text: "text-indigo-700 dark:text-indigo-300", badgeBg: "bg-indigo-100 dark:bg-indigo-900/50", badgeText: "text-indigo-700 dark:text-indigo-300" },
  emerald: { bgCard: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-900/50", iconBg: "text-emerald-600 dark:text-emerald-400", text: "text-emerald-700 dark:text-emerald-300", badgeBg: "bg-emerald-100 dark:bg-emerald-900/50", badgeText: "text-emerald-700 dark:text-emerald-300" },
  amber:   { bgCard: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-900/50", iconBg: "text-amber-600 dark:text-amber-400", text: "text-amber-700 dark:text-amber-300", badgeBg: "bg-amber-100 dark:bg-amber-900/50", badgeText: "text-amber-700 dark:text-amber-300" },
  rose:    { bgCard: "bg-rose-50 dark:bg-rose-950/30", border: "border-rose-200 dark:border-rose-900/50", iconBg: "text-rose-600 dark:text-rose-400", text: "text-rose-700 dark:text-rose-300", badgeBg: "bg-rose-100 dark:bg-rose-900/50", badgeText: "text-rose-700 dark:text-rose-300" },
  blue:    { bgCard: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-900/50", iconBg: "text-blue-600 dark:text-blue-400", text: "text-blue-700 dark:text-blue-300", badgeBg: "bg-blue-100 dark:bg-blue-900/50", badgeText: "text-blue-700 dark:text-blue-300" },
  violet:  { bgCard: "bg-violet-50 dark:bg-violet-950/30", border: "border-violet-200 dark:border-violet-900/50", iconBg: "text-violet-600 dark:text-violet-400", text: "text-violet-700 dark:text-violet-300", badgeBg: "bg-violet-100 dark:bg-violet-900/50", badgeText: "text-violet-700 dark:text-violet-300" },
  pink:    { bgCard: "bg-pink-50 dark:bg-pink-950/30", border: "border-pink-200 dark:border-pink-900/50", iconBg: "text-pink-600 dark:text-pink-400", text: "text-pink-700 dark:text-pink-300", badgeBg: "bg-pink-100 dark:bg-pink-900/50", badgeText: "text-pink-700 dark:text-pink-300" },
  cyan:    { bgCard: "bg-cyan-50 dark:bg-cyan-950/30", border: "border-cyan-200 dark:border-cyan-900/50", iconBg: "text-cyan-600 dark:text-cyan-400", text: "text-cyan-700 dark:text-cyan-300", badgeBg: "bg-cyan-100 dark:bg-cyan-900/50", badgeText: "text-cyan-700 dark:text-cyan-300" },
};

// --- Categories List ---
const CATEGORIES = {
  expense: [
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
    { label: "Savings Transfer",icon: PiggyBank,  theme: "emerald" },
  ],
  income: [
    { label: "Salary",         icon: Wallet,      theme: "emerald" },
    { label: "Freelance",      icon: BookOpen,    theme: "blue"    },
    { label: "Investments",    icon: ArrowUpRight,theme: "indigo"  },
    { label: "Other Income",   icon: Plus,        theme: "amber"   },
  ]
};

// Get today's date formatted as YYYY-MM-DD
const getTodayStr = () => new Date().toISOString().split('T')[0];
const getDaysAgoStr = (days) => {
  const d = new Date(); d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
};

// --- Helpers ---
function formatGroupDate(dateStr) {
  if (dateStr === getTodayStr()) return "Today";
  if (dateStr === getDaysAgoStr(1)) return "Yesterday";
  return new Date(dateStr).toLocaleDateString("en-US", { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
}

function getCategoryData(label, type) {
  const list = type === 'income' ? CATEGORIES.income : CATEGORIES.expense;
  return list.find(c => c.label === label) || list[0];
}

export default function TransactionsPage() {
  const { transactions, addTransaction, updateTransaction, deleteTransaction, formatAmount, currencySymbol, parseAmountToBase, getConvertedAmount, globalSearch, setGlobalSearch } = useGlobal();
  const [searchTerm, setSearchTerm] = useState(globalSearch || "");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc"); // date_desc | date_asc | amount_desc | amount_asc | category
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const activeFilterCount = [filterType !== "all", filterCategory !== "all", !!searchTerm].filter(Boolean).length;

  // Sync with global search when component mounts or global search changes
  useEffect(() => {
    if (globalSearch) setSearchTerm(globalSearch);
  }, [globalSearch]);

  // Clear global search when local search is cleared
  const handleSearchChange = (val) => {
    setSearchTerm(val);
    if (!val) setGlobalSearch("");
  };

  // --- Handlers ---
  const handleSave = async (data) => {
    const parsedData = { ...data, amount: parseAmountToBase(data.amount) };
    if (editTarget) {
      await updateTransaction(editTarget.id, parsedData);
      setEditTarget(null);
    } else {
      await addTransaction(parsedData);
    }
  };

  const handleDelete = async () => {
    await deleteTransaction(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleExportCSV = () => {
    // 1. Convert filtered data to CSV string
    const headers = ["Date", "Title", "Category", "Type", "Amount"];
    const csvRows = [headers.join(",")];
    
    filteredTransactions.forEach(t => {
      // Escape commas in title/category if any
      const title = `"${t.title.replace(/"/g, '""')}"`;
      const cat = `"${t.category}"`;
      const formattedAmt = formatAmount(t.amount).replace(/,/g, '');
      const amt = t.type === 'expense' ? `-${formattedAmt}` : `${formattedAmt}`;
      csvRows.push([t.date, title, cat, t.type, amt].join(","));
    });
    
    const csvData = csvRows.join("\n");
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    
    // 2. Trigger download
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", `transactions_export_${getTodayStr()}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // --- Derived Data ---
  const filteredTransactions = useMemo(() => {
    let result = transactions.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" ? true : t.type === filterType;
      const matchesCategory = filterCategory === "all" ? true : t.category === filterCategory;
      return matchesSearch && matchesType && matchesCategory;
    });

    // Apply sort
    switch (sortBy) {
      case "date_asc":
        result = [...result].sort((a, b) => {
          if (a.date !== b.date) return new Date(a.date) - new Date(b.date);
          return (a.createdAt || "").localeCompare(b.createdAt || "");
        });
        break;
      case "date_desc":
        result = [...result].sort((a, b) => {
          if (a.date !== b.date) return new Date(b.date) - new Date(a.date);
          return (b.createdAt || "").localeCompare(a.createdAt || "");
        });
        break;
      case "amount_desc":  result = [...result].sort((a, b) => b.amount - a.amount); break;
      case "amount_asc":   result = [...result].sort((a, b) => a.amount - b.amount); break;
      case "category":     result = [...result].sort((a, b) => a.category.localeCompare(b.category)); break;
      default: break;
    }
    return result;
  }, [transactions, searchTerm, filterType, filterCategory, sortBy]);

  const groupedTransactions = useMemo(() => {
    // For amount/category sorts, group all under one section to preserve order
    if (sortBy === "amount_desc" || sortBy === "amount_asc" || sortBy === "category") {
      return filteredTransactions.length > 0 
        ? [{ date: "__sorted__", label: sortBy === "category" ? "Sorted by Category" : sortBy === "amount_desc" ? "Highest Amount First" : "Lowest Amount First", items: filteredTransactions }] 
        : [];
    }
    const groups = {};
    filteredTransactions.forEach(t => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });
    return Object.keys(groups)
      .sort((a, b) => sortBy === "date_asc" ? new Date(a) - new Date(b) : new Date(b) - new Date(a))
      .map(date => ({ date, label: null, items: groups[date] }));
  }, [filteredTransactions, sortBy]);


  return (
    <div className="max-w-[1200px] mx-auto pb-24">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Transactions</h1>
          <p className="text-muted-foreground mt-1 text-sm">View and manage all your financial activity.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-lg text-sm font-medium hover:bg-secondary transition-colors shadow-sm">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Add Transaction
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by title or category..." 
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 bg-card border-border w-full text-foreground" 
          />
          {searchTerm && (
            <button onClick={() => handleSearchChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {/* Category Filter */}
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            className="appearance-none px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Categories</option>
            {filterType === "all" ? (
              Object.values(CATEGORIES).flat().map(c => (
                <option key={c.label} value={c.label}>{c.label}</option>
              ))
            ) : (
              CATEGORIES[filterType].map(c => (
                <option key={c.label} value={c.label}>{c.label}</option>
              ))
            )}
          </select>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="date_desc">📅 Newest First</option>
            <option value="date_asc">📅 Oldest First</option>
            <option value="amount_desc">💰 Amount: High to Low</option>
            <option value="amount_asc">💰 Amount: Low to High</option>
            <option value="category">🗂️ Category A–Z</option>
          </select>

          {/* Type Toggle */}
          <div className="flex p-1 bg-secondary rounded-xl shrink-0">
            {["all", "income", "expense"].map(type => (
              <button 
                key={type}
                onClick={() => {
                  setFilterType(type);
                  setFilterCategory("all"); // Reset category when type changes to prevent mismatched states
                }}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all capitalize ${filterType === type ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active Filter Bar */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-3 mb-5 text-sm">
          <span className="text-muted-foreground">
            {filteredTransactions.length} result{filteredTransactions.length !== 1 ? "s" : ""} found
          </span>
          <button
            onClick={() => { setSearchTerm(""); setFilterType("all"); setFilterCategory("all"); setGlobalSearch(""); setSortBy("date_desc"); }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-100 dark:border-rose-900/50 hover:bg-rose-100 transition-colors"
          >
            <X className="w-3 h-3" /> Clear all filters
          </button>
        </div>
      )}

      {/* Transactions List */}
      <div className="space-y-6">
        {groupedTransactions.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border shadow-sm">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No transactions found</h3>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          groupedTransactions.map(group => (
            <div key={group.date} className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
              <div className="bg-secondary px-5 py-3 border-b border-border flex items-center gap-2">
                {group.label 
                  ? <><ArrowUpDown className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-semibold text-foreground">{group.label}</span></>
                  : <><Calendar className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-semibold text-foreground">{formatGroupDate(group.date)}</span></>
                }
              </div>
              <div className="divide-y divide-border">
                {group.items.map(t => {
                  const catData = getCategoryData(t.category, t.type);
                  const theme = THEMES[catData.theme];
                  const Icon = catData.icon;
                  const isExpense = t.type === 'expense';

                  return (
                    <div key={t.id} className="flex items-center justify-between p-5 hover:bg-secondary/50 transition-colors group">
                      
                      {/* Left: Icon & Details */}
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${theme.bgCard}`}>
                          <Icon className={`w-5 h-5 ${theme.iconBg}`} />
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-semibold text-foreground truncate">{t.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${theme.badgeBg} ${theme.badgeText}`}>
                              {t.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount & Actions */}
                      <div className="flex items-center gap-4 shrink-0 ml-2">
                        <span className={`text-base md:text-lg font-bold whitespace-nowrap ${isExpense ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {isExpense ? '-' : '+'}{currencySymbol}{formatAmount(t.amount)}
                        </span>
                        
                        {/* Actions Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                              <MoreHorizontal className="w-5 h-5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => setEditTarget(t)}>
                              <Pencil className="w-4 h-4 mr-2 text-muted-foreground" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDeleteTarget(t)} className="text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/30">
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      <TransactionModal open={addOpen} onClose={() => setAddOpen(false)} onSave={handleSave} initial={null} />
      {editTarget && <TransactionModal open={!!editTarget} onClose={() => setEditTarget(null)} onSave={handleSave} initial={editTarget} />}
      {deleteTarget && (
        <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <DialogContent className="max-w-sm">
            <div className="flex flex-col items-center gap-4 pt-2 pb-1 text-center">
              <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center"><Trash2 className="w-6 h-6 text-rose-600 dark:text-rose-400" /></div>
              <div>
                <DialogTitle className="text-center">Delete Transaction?</DialogTitle>
                <p className="text-sm text-muted-foreground mt-2">Are you sure you want to delete <span className="font-semibold text-foreground">"{deleteTarget.title}"</span>? This action cannot be undone.</p>
              </div>
              <div className="flex gap-3 w-full pt-2">
                <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary">Cancel</button>
                <button onClick={handleDelete} className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600">Delete</button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
    </div>
  );
}
