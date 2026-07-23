import { useState, useRef, useEffect } from "react";
import { Search, Bell, HelpCircle, LogOut, AlertTriangle, X, BookOpen, PieChart, Wallet, TrendingUp, Keyboard } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Input } from "./ui/input";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "./ui/dropdown-menu";
import { useGlobal } from "../context/GlobalContext";
import { useNavigate } from "react-router-dom";

// --- Help Modal ---
function HelpModal({ open, onClose }) {
  if (!open) return null;
  const tips = [
    { icon: Wallet, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-950/30", title: "Add Transactions", desc: "Go to Transactions page and click 'Add Transaction', or use the + button on the Dashboard." },
    { icon: PieChart, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30", title: "Set a Budget", desc: "Open the Budgets page, create a budget for each category and track your spending limits." },
    { icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30", title: "View Reports", desc: "Go to Analytics to see charts of your income vs expenses, spending breakdown, and trends." },
    { icon: BookOpen, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950/30", title: "Savings Goals", desc: "Set savings goals on the Savings page and track your progress towards each goal." },
    { icon: Keyboard, color: "text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-950/30", title: "AI Assistant", desc: "Use the Paisa Buddy AI bar at the bottom of the dashboard to log transactions by typing naturally." },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">Help & Quick Guide</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Get started with Paisa Buddy</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {tips.map((tip, i) => (
            <div key={i} className={`flex items-start gap-3 p-4 rounded-xl ${tip.bg} border border-border/30`}>
              <div className="w-9 h-9 rounded-lg bg-card flex items-center justify-center shrink-0 shadow-sm">
                <tip.icon className={`w-4 h-4 ${tip.color}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{tip.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-border">
          <p className="text-xs text-center text-muted-foreground">Paisa Buddy — Your Smart Finance Manager 💰</p>
        </div>
      </div>
    </div>
  );
}

export default function Header() {
  const { user, logout, budgets, transactions, globalSearch, setGlobalSearch } = useGlobal();
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(globalSearch);
  const [hasUnread, setHasUnread] = useState(false);
  const prevAlertsCount = useRef(parseInt(localStorage.getItem(`last_seen_alerts_${user?.uid}`) || "0"));
  const debounceRef = useRef(null);

  // Debounce search: after 300ms, update global state + navigate to /transactions
  const handleSearchChange = (value) => {
    setLocalSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setGlobalSearch(value);
      if (value.trim()) {
        navigate("/transactions");
      }
    }, 300);
  };

  // Sync if globalSearch is cleared externally (e.g., page change)
  useEffect(() => {
    setLocalSearch(globalSearch);
  }, [globalSearch]);

  const budgetAlerts = (() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const alerts = [];

    budgets.forEach(b => {
      const spent = transactions
        .filter(t => t.type === "expense" && t.category === b.category)
        .filter(t => {
          const d = new Date(t.date);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const pct = b.limit ? Math.round((spent / b.limit) * 100) : 0;
      if (pct >= 80) {
        alerts.push({ category: b.category, pct });
      }
    });
    return alerts;
  })();

  // Notify user only when a NEW alert is added
  useEffect(() => {
    const savedCount = parseInt(localStorage.getItem(`last_seen_alerts_${user?.uid}`) || "0");
    if (budgetAlerts.length > savedCount) {
      setHasUnread(true);
    } else {
      setHasUnread(false);
    }
  }, [budgetAlerts.length, user?.uid]);

  return (
    <>
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <header className="h-20 bg-background border-b border-border flex items-center justify-between px-8 sticky top-0 z-10">
        <h2 className="text-lg font-medium text-foreground">Budget Overview</h2>

        <div className="flex items-center gap-6 flex-1 justify-end">
          {/* Global Search */}
          <div className="relative max-w-md w-full hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search transactions..."
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 bg-surface text-sm border-border rounded-lg"
            />
            {localSearch && (
              <button
                onClick={() => { setLocalSearch(""); setGlobalSearch(""); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 text-muted-foreground">
            {/* Notifications Bell */}
            <DropdownMenu onOpenChange={(open) => { 
              if (open) {
                setHasUnread(false);
                localStorage.setItem(`last_seen_alerts_${user?.uid}`, budgetAlerts.length.toString());
              }
            }}>
              <DropdownMenuTrigger asChild>
                <button className="relative hover:text-foreground transition-colors p-2">
                  <Bell className="w-5 h-5" />
                  {hasUnread && budgetAlerts.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="px-3 py-2 text-sm font-semibold text-foreground">Notifications</div>
                <DropdownMenuSeparator />
                {budgetAlerts.length === 0 ? (
                  <div className="p-4 text-sm text-center text-muted-foreground">You're all caught up! 🎉</div>
                ) : (
                  budgetAlerts.map((alert, i) => (
                    <DropdownMenuItem key={i} className="flex flex-col items-start gap-1 p-3 cursor-default">
                      <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="font-semibold text-sm">Budget Alert</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        You've used {alert.pct}% of your <span className="font-semibold">{alert.category}</span> budget.
                      </span>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Help Button */}
            <button
              onClick={() => setHelpOpen(true)}
              className="hover:text-foreground transition-colors p-2 hover:bg-secondary rounded-lg"
              title="Help & Guide"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="h-8 w-px bg-border"></div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/settings")}
              className="flex items-center gap-3 hover:bg-secondary p-1 pr-2 rounded-xl transition-colors cursor-pointer group"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground leading-none group-hover:text-indigo-600 transition-colors">
                  {user?.displayName || user?.email?.split('@')[0] || "User"}
                </p>
              </div>
              <Avatar className="w-9 h-9 border border-border group-hover:border-indigo-300 transition-colors shadow-sm">
                <AvatarImage src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || user?.email?.charAt(0) || 'U'}&background=4F46E5&color=fff`} />
                <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            </button>

            <button
              onClick={logout}
              title="Log Out"
              className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors ml-2"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
