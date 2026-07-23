import { useState, useMemo, useRef, useEffect } from "react";
import { 
  Wallet, TrendingUp, TrendingDown, Lightbulb, MoreHorizontal, Coffee, Wifi, ShoppingBag, 
  DollarSign, MonitorPlay, Mic, Camera, Send, Sparkles, Plus, QrCode, ArrowDownRight, ArrowUpRight, Home, Utensils, Car, Zap, Heart, Film, Dumbbell, Plane, BookOpen, PiggyBank, CheckCircle2, AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Progress } from "./ui/progress";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Link } from "react-router-dom";
import { useGlobal } from "../context/GlobalContext";
import { parseCommandWithAI, parseReceiptWithAI, generateFinanceInsights } from "../lib/gemini";
import TransactionModal from "./TransactionModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";

// --- Themes for categories (Same as Transactions/Budgets) ---
const THEMES = {
  indigo:  { hex: "#6366f1", bgCard: "bg-indigo-50 dark:bg-indigo-950/30", border: "border-indigo-200 dark:border-indigo-900/50", iconBg: "text-indigo-600 dark:text-indigo-400", text: "text-indigo-700 dark:text-indigo-300", badgeBg: "bg-indigo-100 dark:bg-indigo-900/50", badgeText: "text-indigo-700 dark:text-indigo-300" },
  emerald: { hex: "#10b981", bgCard: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-900/50", iconBg: "text-emerald-600 dark:text-emerald-400", text: "text-emerald-700 dark:text-emerald-300", badgeBg: "bg-emerald-100 dark:bg-emerald-900/50", badgeText: "text-emerald-700 dark:text-emerald-300" },
  amber:   { hex: "#f59e0b", bgCard: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-900/50", iconBg: "text-amber-600 dark:text-amber-400", text: "text-amber-700 dark:text-amber-300", badgeBg: "bg-amber-100 dark:bg-amber-900/50", badgeText: "text-amber-700 dark:text-amber-300" },
  rose:    { hex: "#f43f5e", bgCard: "bg-rose-50 dark:bg-rose-950/30", border: "border-rose-200 dark:border-rose-900/50", iconBg: "text-rose-600 dark:text-rose-400", text: "text-rose-700 dark:text-rose-300", badgeBg: "bg-rose-100 dark:bg-rose-900/50", badgeText: "text-rose-700 dark:text-rose-300" },
  blue:    { hex: "#3b82f6", bgCard: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-900/50", iconBg: "text-blue-600 dark:text-blue-400", text: "text-blue-700 dark:text-blue-300", badgeBg: "bg-blue-100 dark:bg-blue-900/50", badgeText: "text-blue-700 dark:text-blue-300" },
  violet:  { hex: "#8b5cf6", bgCard: "bg-violet-50 dark:bg-violet-950/30", border: "border-violet-200 dark:border-violet-900/50", iconBg: "text-violet-600 dark:text-violet-400", text: "text-violet-700 dark:text-violet-300", badgeBg: "bg-violet-100 dark:bg-violet-900/50", badgeText: "text-violet-700 dark:text-violet-300" },
  pink:    { hex: "#ec4899", bgCard: "bg-pink-50 dark:bg-pink-950/30", border: "border-pink-200 dark:border-pink-900/50", iconBg: "text-pink-600 dark:text-pink-400", text: "text-pink-700 dark:text-pink-300", badgeBg: "bg-pink-100 dark:bg-pink-900/50", badgeText: "text-pink-700 dark:text-pink-300" },
  cyan:    { hex: "#06b6d4", bgCard: "bg-cyan-50 dark:bg-cyan-950/30", border: "border-cyan-200 dark:border-cyan-900/50", iconBg: "text-cyan-600 dark:text-cyan-400", text: "text-cyan-700 dark:text-cyan-300", badgeBg: "bg-cyan-100 dark:bg-cyan-900/50", badgeText: "text-cyan-700 dark:text-cyan-300" },
};

const CATEGORIES = [
  { label: "Housing",        icon: Home,        theme: "indigo"  },
  { label: "Food & Dining",  icon: Utensils,    theme: "emerald" },
  { label: "Transport",      icon: Car,         theme: "amber"   },
  { label: "Utilities",      icon: Zap,         theme: "cyan"    },
  { label: "Shopping",       icon: ShoppingBag, theme: "blue"    },
  { label: "Entertainment",  icon: Film,        theme: "violet"  },
  { label: "Other Income",   icon: Plus,        theme: "amber"   },
  { label: "Salary",         icon: Wallet,      theme: "emerald" },
  { label: "Coffee & Cafe",  icon: Coffee,      theme: "amber"   },
  { label: "Savings Transfer",icon: PiggyBank,  theme: "emerald" },
];

function getCategoryData(label) {
  return CATEGORIES.find(c => c.label === label) || CATEGORIES[0];
}

export default function Dashboard() {
  const { 
    transactions, addTransaction, user, formatAmount, currencySymbol, currency, 
    budgets, savings, updateSavingsGoal, updateBudget, parseAmountToBase, exchangeRates, getConvertedAmount
  } = useGlobal();
  const [aiInput, setAiInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [scanToast, setScanToast] = useState(false);
  const [aiToast, setAiToast] = useState({ show: false, message: "" });
  const [chipLoading, setChipLoading] = useState(null); // index of chip being processed
  const [isListening, setIsListening] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  
  const userName = user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "User";

  const handleAISubmit = async () => {
    if (!aiInput.trim() || isProcessing) return;
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      alert("Please add your VITE_GEMINI_API_KEY to the .env file.");
      return;
    }

    setIsProcessing(true);

    try {
      // Build context snapshot so AI knows what savings goals & budget categories exist
      const context = {
        savingsGoals: savings || [],
        budgetCategories: budgets || [],
        currency,
      };

      // Add a safety timeout: if AI takes more than 15s, something is wrong
      const result = await Promise.race([
        parseCommandWithAI(aiInput, context),
        new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 15000))
      ]);

      if (result.action === "OFF_TOPIC") {
        setAiToast({ show: true, message: `🤖 I only help with finances. Try: "Spent 200 on dinner".` });
        setTimeout(() => setAiToast({ show: false, message: "" }), 4000);
      } else if (result.action === "ERROR") {
        setAiToast({ show: true, message: `❌ ${result.message || "Could not understand."}` });
        setTimeout(() => setAiToast({ show: false, message: "" }), 4000);
      } else {
        // Step 2: Show confirmation UI instead of direct saving
        setPendingAction(result);
      }
    } catch (error) {
      console.error("Submission error:", error);
      const msg = error.message === "TIMEOUT" ? "AI response is too slow. Try again." : "Kuch masla hua. Dobara koshish karein.";
      setAiToast({ show: true, message: `❌ ${msg}` });
      setTimeout(() => setAiToast({ show: false, message: "" }), 4000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    const result = pendingAction;
    setPendingAction(null); // Close modal instantly
    setIsProcessing(true);

    try {
      if (result.action === "ADD_TRANSACTION") {
        await addTransaction({
          title: result.title,
          amount: parseAmountToBase ? parseAmountToBase(result.amount) : result.amount,
          type: result.type,
          category: result.category,
          date: new Date().toISOString().split('T')[0],
        });
        setAiInput("");
        setAiToast({ show: true, message: `✅ Logged: ${result.title} — ${currencySymbol}${result.amount}` });

      } else if (result.action === "ADD_SAVINGS") {
        const goal = (savings || []).find(g => g.name?.toLowerCase() === result.goalName?.toLowerCase());
        if (!goal) {
          setAiToast({ show: true, message: `❌ Savings goal "${result.goalName}" not found.` });
        } else {
          const amountInBase = parseAmountToBase ? parseAmountToBase(result.amount) : result.amount;
          await updateSavingsGoal(goal.id, { current: (goal.current || 0) + amountInBase });
          await addTransaction({
            title: `Transfer to ${goal.name}`,
            amount: amountInBase,
            type: "expense",
            category: "Savings Transfer",
            date: new Date().toISOString().split('T')[0],
          });
          setAiInput("");
          setAiToast({ show: true, message: `✅ Added ${currencySymbol}${result.amount} to "${goal.name}"` });
        }

      } else if (result.action === "UPDATE_BUDGET") {
        const budget = (budgets || []).find(b => b.category?.toLowerCase() === result.categoryName?.toLowerCase());
        if (!budget) {
          setAiToast({ show: true, message: `❌ Budget category "${result.categoryName}" not found.` });
        } else {
          const amountInBase = parseAmountToBase ? parseAmountToBase(result.amount) : result.amount;
          await updateBudget(budget.id, { limit: (budget.limit || 0) + amountInBase });
          setAiInput("");
          setAiToast({ show: true, message: `✅ Added ${currencySymbol}${result.amount} to "${budget.category}" budget` });
        }
      }
    } catch (err) {
      console.error("Action execution error:", err);
      setAiToast({ show: true, message: "❌ Something went wrong." });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setAiToast({ show: false, message: "" }), 4000);
    }
  };

  const handleQuickSave = async (data) => {
    await addTransaction({ ...data, amount: parseAmountToBase ? parseAmountToBase(data.amount) : data.amount });
  };

  const handleScanClick = () => {
    fileInputRef.current?.click();
  };

  // --- AI Insights Logic ---
  const fetchInsights = async () => {
    if (!transactions.length || loadingInsights) return;
    
    try {
      setLoadingInsights(true);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      // 1. Prepare Converted Data for AI
      const monthlyTrans = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });

      const totalSpentConverted = monthlyTrans
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + getConvertedAmount(t.amount), 0);

      const categoryTotals = {};
      monthlyTrans.filter(t => t.type === "expense").forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + getConvertedAmount(t.amount);
      });

      const topCategories = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([name, val]) => `${name}: ${currencySymbol}${Math.round(val)}`);

      const budgetAlerts = budgets.map(b => {
        const spent = monthlyTrans
          .filter(t => t.category === b.category && t.type === "expense")
          .reduce((sum, t) => sum + getConvertedAmount(t.amount), 0);
        const limit = getConvertedAmount(b.limit);
        return { category: b.category, pct: limit ? Math.round((spent/limit)*100) : 0 };
      }).filter(a => a.pct >= 80);

      const savingsProgress = savings.map(s => ({
        name: s.name,
        pct: s.target ? Math.round((s.current / s.target) * 100) : 0
      }));

      const aiData = { topCategories, budgetAlerts, savingsProgress };
      const aiContext = { currency, totalSpent: Math.round(totalSpentConverted) };

      const res = await generateFinanceInsights(aiData, aiContext);
      setInsights(res);
    } catch (err) {
      console.error("Insights Fetch Error:", err);
      setInsights([
        "Apne monthly budgets set karein taake bachat ho sakay.",
        "Rozana ke kharche track karna bachat ki pehli seerhi hai.",
        "Is maheenay food par thora control karne ki koshish karein."
      ]);
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    // Only fetch once when transactions are first loaded
    if (transactions.length > 0 && insights.length === 0) {
      const timer = setTimeout(fetchInsights, 2000);
      return () => clearTimeout(timer);
    }
  }, [transactions.length > 0]); // Fetch once on initial load if data exists



  const handleMicClick = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setAiToast({ show: false, message: "" });
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setAiToast({ show: true, message: "❌ Speech recognition not supported in this browser." });
      setTimeout(() => setAiToast({ show: false, message: "" }), 3000);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setAiToast({ show: true, message: "🎙️ Listening... speak now" });
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setAiInput(transcript);
      setAiToast({ show: true, message: `🎙️ Heard: "${transcript}"` });
      
      // Auto-submit after voice is captured
      setTimeout(() => {
        setAiToast({ show: false, message: "" });
        document.getElementById('ai-submit-btn')?.click();
      }, 800);
    };

    recognition.onerror = (event) => {
      if (event.error !== 'aborted') {
        setAiToast({ show: true, message: "❌ Voice error. Try again." });
        setTimeout(() => setAiToast({ show: false, message: "" }), 3000);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Only clear toast if we were still in "Listening" state
      setAiToast(prev => prev.message.includes("Listening") ? { show: false, message: "" } : prev);
    };

    recognition.start();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Reset file input so same file can be scanned again if needed
    e.target.value = "";

    setIsProcessing(true);
    setAiToast({ show: true, message: "📸 Scanning receipt... Please wait" });

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64Data = reader.result.split(',')[1];
          const mimeType = file.type;

          const result = await parseReceiptWithAI(base64Data, mimeType);
          
          if (result.error) {
            setAiToast({ show: true, message: `❌ ${result.error}` });
            setTimeout(() => setAiToast({ show: false, message: "" }), 4000);
          } else {
            // AUTO-CONVERT: If receipt currency differs from app currency, convert automatically
            let finalAmount = result.amount;
            let conversionNote = "";

            const receiptCurrency = result.currency?.toUpperCase();
            const appCurrency = currency?.toUpperCase();

            if (receiptCurrency && appCurrency && receiptCurrency !== appCurrency && exchangeRates) {
              const rateFrom = exchangeRates[receiptCurrency] || 1;
              const rateTo = exchangeRates[appCurrency] || 1;
              // Convert: amount in receipt currency -> USD -> app currency
              const inUSD = result.amount / rateFrom;
              finalAmount = Math.round((inUSD * rateTo) * 100) / 100;
              conversionNote = ` (converted from ${receiptCurrency} ${result.amount})`;
            }

            setPendingAction({
              ...result,
              amount: finalAmount,
              currency: appCurrency || receiptCurrency,
              conversionNote,
              action: "ADD_TRANSACTION",
              type: "expense",
              date: new Date().toISOString().split('T')[0]
            });
            setAiToast({ show: false, message: "" });
          }
        } catch (err) {
          console.error("Reader onload error:", err);
          setAiToast({ show: true, message: "❌ Scanning error. Try a clearer photo." });
          setTimeout(() => setAiToast({ show: false, message: "" }), 4000);
        } finally {
          setIsProcessing(false);
        }
      };
      reader.onerror = () => {
        setAiToast({ show: true, message: "❌ Failed to read image." });
        setIsProcessing(false);
      };
    } catch (err) {
      console.error(err);
      setAiToast({ show: true, message: "❌ Scan Failed. Please try again." });
      setIsProcessing(false);
      setTimeout(() => setAiToast({ show: false, message: "" }), 3000);
    }
  };

  // Directly save a suggestion chip transaction without needing Gemini API
  const handleChipClick = async (s, index) => {
    if (chipLoading !== null) return;
    setChipLoading(index);
    try {
      await addTransaction({
        title: s.text.split(" — ")[0], // e.g. "Coffee" from "Coffee — ₨80"
        type: s.type || "expense",
        amount: parseAmountToBase ? parseAmountToBase(s.amount) : s.amount,
        date: new Date().toISOString().split('T')[0],
        category: s.category || "Other Income",
      });
      setAiToast({ show: true, message: `✅ Logged: ${s.text}` });
      setTimeout(() => setAiToast({ show: false, message: "" }), 3000);
    } catch (e) {
      setAiToast({ show: true, message: `❌ Failed to log transaction` });
      setTimeout(() => setAiToast({ show: false, message: "" }), 3000);
    }
    setChipLoading(null);
  };

  // Calculate totals
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpenses;
  
  // Calculate budget limit dynamically based on set budgets
  const budgetLimit = budgets ? budgets.reduce((sum, b) => sum + b.limit, 0) : 0;
  const budgetSpentPct = budgetLimit > 0 ? Math.min((totalExpenses / budgetLimit) * 100, 100) : 0;

  // Calculate simple previous month income trend
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const prevMonthIncome = transactions.filter(t => {
    if (t.type !== 'income') return false;
    const d = new Date(t.date);
    return d.getMonth() === (currentMonth === 0 ? 11 : currentMonth - 1) && 
           d.getFullYear() === (currentMonth === 0 ? currentYear - 1 : currentYear);
  }).reduce((sum, t) => sum + t.amount, 0);

  const currentMonthIncome = transactions.filter(t => {
    if (t.type !== 'income') return false;
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).reduce((sum, t) => sum + t.amount, 0);

  let incomeTrendText = "No previous data";
  let incomeTrendIcon = null;
  if (prevMonthIncome > 0) {
    const pct = Math.round(((currentMonthIncome - prevMonthIncome) / prevMonthIncome) * 100);
    incomeTrendIcon = pct >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5"/> : <ArrowDownRight className="w-3 h-3 mr-0.5"/>;
    incomeTrendText = `${Math.abs(pct)}%`;
  } else if (currentMonthIncome > 0) {
    incomeTrendText = "New income";
  }

  // Calculate chart data (Group expenses by category)
  const spendingData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const grouped = {};
    expenses.forEach(t => {
      if (!grouped[t.category]) grouped[t.category] = 0;
      grouped[t.category] += t.amount;
    });
    return Object.entries(grouped).map(([name, value]) => {
      const catTheme = THEMES[getCategoryData(name).theme];
      return { name, value, color: catTheme.hex };
    }).sort((a, b) => b.value - a.value);
  }, [transactions]);
  
  // ── Smart Personalized Suggestion Chips ─────────────────────────
  // Phase 1: random defaults. Phase 2: learns from transaction history.
  const suggestions = useMemo(() => {
    // Default amounts per currency
    const defaults = {
      PKR: { food: 200, coffee: 80, transport: 150 },
      INR: { food: 100, coffee: 40, transport: 50 },
      EUR: { food: 10, coffee: 3, transport: 5 },
      GBP: { food: 8, coffee: 3, transport: 4 },
      USD: { food: 12, coffee: 5, transport: 8 },
    };
    const d = defaults[currency] || defaults.USD;

    // Static random suggestions (shown to new users or initially)
    const staticChips = [
      { text: `Coffee — ${currencySymbol}${d.coffee}`,   icon: Sparkles, color: "text-amber-500",   amount: d.coffee,    category: "Coffee & Cafe",  type: "expense" },
      { text: `Lunch — ${currencySymbol}${d.food}`,      icon: Sparkles, color: "text-emerald-500", amount: d.food,      category: "Food & Dining", type: "expense" },
      { text: `Transport — ${currencySymbol}${d.transport}`, icon: Sparkles, color: "text-indigo-500", amount: d.transport, category: "Transport",      type: "expense" },
    ];

    // If user has enough transaction history, override with their most frequent habits
    if (transactions.length >= 5) {
      // Count frequency per category
      const freq = {};
      transactions
        .filter(t => t.type === "expense")
        .forEach(t => {
          if (!freq[t.category]) freq[t.category] = { count: 0, totalAmount: 0, titles: [] };
          freq[t.category].count += 1;
          freq[t.category].totalAmount += t.amount;
          if (t.title) freq[t.category].titles.push(t.title);
        });

      // Sort by frequency, take top 3
      const topCats = Object.entries(freq)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 3);

      if (topCats.length >= 2) {
        const chipColors = ["text-amber-500", "text-emerald-500", "text-indigo-500"];
        return topCats.map(([cat, data], i) => {
          // Use the most common title in that category
          const titleFreq = {};
          data.titles.forEach(t => { titleFreq[t] = (titleFreq[t] || 0) + 1; });
          const topTitle = Object.entries(titleFreq).sort((a, b) => b[1] - a[1])[0]?.[0] || cat;
          const avgAmount = (data.totalAmount / data.count);
          // Convert avg back to display currency (already stored in base USD)
          const displayAmount = parseAmountToBase 
            ? Math.round(avgAmount * (1 / (parseAmountToBase(1) || 1)))
            : Math.round(avgAmount);
          return {
            text: `${topTitle} — ${currencySymbol}${displayAmount}`,
            icon: Sparkles,
            color: chipColors[i] || "text-indigo-500",
            amount: displayAmount,
            category: cat,
            type: "expense",
          };
        });
      }
    }

    return staticChips;
  }, [transactions, currency, currencySymbol, parseAmountToBase]);

  return (
    <div className="max-w-[1200px] mx-auto min-h-full flex flex-col relative">

      {/* Scan Coming Soon Toast */}
      {scanToast && (
        <div className="fixed top-24 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-card border border-border rounded-xl shadow-lg text-sm font-medium text-foreground animate-in slide-in-from-right-5 duration-300">
          <Camera className="w-4 h-4 text-indigo-500" />
          Receipt scanning coming soon! 📸
        </div>
      )}

      {/* AI Action Toast */}
      {aiToast.show && (
        <div className="fixed top-24 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-card border border-border rounded-xl shadow-lg text-sm font-medium text-foreground animate-in slide-in-from-right-5 duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          {aiToast.message}
        </div>
      )}

      {/* Welcome & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Welcome back, {userName}</h1>
          <p className="text-muted-foreground mt-1 text-sm">Here's what's happening with your finances today.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleScanClick}
            className="flex flex-col items-center justify-center w-14 h-14 bg-card border border-border rounded-2xl shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group">
            <QrCode className="w-5 h-5 text-muted-foreground group-hover:text-indigo-600 transition-colors" />
            <span className="text-[9px] font-bold mt-1 text-muted-foreground group-hover:text-indigo-600 uppercase">Scan</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex flex-col items-center justify-center w-14 h-14 bg-indigo-600 border border-indigo-700 rounded-2xl shadow-sm hover:bg-indigo-700 hover:shadow-md transition-all group">
            <Plus className="w-5 h-5 text-white" />
            <span className="text-[9px] font-bold mt-1 text-white uppercase">Add</span>
          </button>
        </div>
      </div>

      {/* Hidden File Input for Receipt Scan */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
        capture="environment"
      />

      {/* Quick Add Modal */}
      <TransactionModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleQuickSave}
        initial={null}
      />

      {/* AI Confirmation Modal */}
      <Dialog open={!!pendingAction} onOpenChange={() => setPendingAction(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Confirm AI Action
            </DialogTitle>
            <DialogDescription>
              Please verify the details extracted by AI.
            </DialogDescription>
          </DialogHeader>

          {pendingAction && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                    {pendingAction.action.replace("_", " ")}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Title / Details</p>
                  <p className="text-base font-bold text-foreground">{pendingAction.title || pendingAction.goalName || pendingAction.categoryName}</p>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Transaction Title</p>
                    <p className="text-lg font-bold text-foreground">{pendingAction.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Category</p>
                    <p className="text-sm font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-lg inline-block">{pendingAction.category}</p>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Amount</p>
                  <p className="text-3xl font-black text-foreground">
                    {currencySymbol}{pendingAction.amount}
                  </p>
                  {pendingAction.conversionNote && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Auto-converted{pendingAction.conversionNote}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setPendingAction(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-secondary transition-all"
                >
                  Discard
                </button>
                <button 
                  onClick={handleConfirmAction}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 shadow-sm transition-all"
                >
                  Confirm & Add
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Top Cards (Pastel Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        
        {/* Total Balance */}
        <div className="rounded-2xl border-2 p-5 shadow-sm bg-indigo-50 border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-900/50">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/50">
              <Wallet className="w-5 h-5 text-indigo-700 dark:text-indigo-400" />
            </div>
            <div className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">
              Total Balance
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-indigo-800 dark:text-indigo-300 break-words overflow-hidden">
            {currencySymbol}{formatAmount(balance)}
          </p>
          <div className="mt-4 pt-4 border-t border-indigo-200/50 dark:border-indigo-900/50 flex justify-between items-center text-xs">
            <span className="text-indigo-700/70 dark:text-indigo-300/70 font-medium">Monthly Budget Remaining</span>
            <span className="font-bold text-indigo-700 dark:text-indigo-300">
              {budgetLimit > 0 ? `${currencySymbol}${formatAmount(budgetLimit - totalExpenses)}` : 'No budget set'}
            </span>
          </div>
        </div>

        {/* Income & Expenses */}
        <div className="rounded-2xl border-2 p-5 shadow-sm bg-emerald-50 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-900/50">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/50">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
              Total Income
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-emerald-800 dark:text-emerald-300 break-words overflow-hidden">
            +{currencySymbol}{formatAmount(totalIncome)}
          </p>
          <div className="mt-4 pt-4 border-t border-emerald-200/50 dark:border-emerald-900/50 flex justify-between items-center text-xs">
            <span className="text-emerald-700/70 dark:text-emerald-300/70 font-medium">Compared to last month</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center">
              {incomeTrendIcon}{incomeTrendText}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border-2 p-5 shadow-sm relative overflow-hidden bg-rose-50 border-rose-300 dark:bg-rose-950/30 dark:border-rose-900/50">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-100 dark:bg-rose-900/50">
              <TrendingDown className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-rose-100 text-rose-700">
              Total Expenses
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-rose-800 dark:text-rose-300 break-words overflow-hidden">
            -{currencySymbol}{formatAmount(totalExpenses)}
          </p>
          <div className="mt-4 pt-4 border-t border-rose-200/50 dark:border-rose-900/50 flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-rose-700/70 dark:text-rose-300/70 font-medium">Budget limits used</span>
              <span className="font-bold text-rose-700 dark:text-rose-300">{budgetLimit > 0 ? `${Math.round(budgetSpentPct)}%` : '0%'}</span>
            </div>
            <Progress value={budgetSpentPct} className="h-1.5 bg-rose-200 dark:bg-rose-950 [&>div]:bg-rose-500" />
          </div>
        </div>

      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Spending by Category Chart */}
        <Card className="lg:col-span-2 shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50">
            <div>
              <h3 className="text-base font-semibold text-foreground">Spending by Category</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Where your money went this month.</p>
            </div>
            <Link to="/reports" className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors">
               <MoreHorizontal className="w-5 h-5" />
            </Link>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative w-48 h-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={spendingData} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={3} dataKey="value" nameKey="name" stroke="none">
                      {spendingData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip 
                      formatter={(v, name) => [`${currencySymbol}${formatAmount(v)}`, name]}
                      separator=" "
                      contentStyle={{
                        backgroundColor: "rgba(15, 23, 42, 0.9)",
                        backdropFilter: "blur(8px)",
                        color: "#fff",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "600",
                        padding: "8px 12px",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                      }}
                      itemStyle={{ color: "#fff", padding: "2px 0" }}
                      cursor={{ fill: 'transparent' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4">
                  <span className="text-lg md:text-xl font-bold text-foreground text-center break-words w-full">
                    {currencySymbol}{formatAmount(totalExpenses)}
                  </span>
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mt-0.5">Spent</span>
                </div>
              </div>
              
              <div className="flex-1 w-full space-y-3">
                {spendingData.slice(0, 4).map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${item.color}20` }}>
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                      </div>
                      <span className="text-sm font-semibold text-foreground">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="text-xs font-bold text-muted-foreground w-8 text-right shrink-0">{Math.round((item.value/totalExpenses)*100)}%</span>
                      <span className="text-sm font-bold text-foreground truncate">{currencySymbol}{formatAmount(item.value)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Insights & Recent Activity Column */}
        <div className="flex flex-col gap-6">
          
          {/* AI Insights Card */}
          <Card className="shadow-sm border-indigo-100 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-background overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Sparkles className="w-12 h-12 text-indigo-600" />
            </div>
            <CardHeader className="pb-2 border-b border-indigo-100/50 dark:border-indigo-900/50 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Buddy's Insights</h3>
              </div>
              <button 
                onClick={fetchInsights} 
                disabled={loadingInsights}
                className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 hover:bg-indigo-100 transition-colors disabled:opacity-50"
                title="Get fresh insights"
              >
                <Sparkles className={`w-3.5 h-3.5 ${loadingInsights ? 'animate-spin' : ''}`} />
              </button>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {loadingInsights ? (
                <div className="space-y-2">
                  <div className="h-4 bg-indigo-100/50 dark:bg-indigo-900/20 rounded animate-pulse w-full" />
                  <div className="h-4 bg-indigo-100/50 dark:bg-indigo-900/20 rounded animate-pulse w-3/4" />
                </div>
              ) : insights.length > 0 ? (
                insights.map((text, i) => (
                  <div key={i} className="flex gap-3 items-start animate-in fade-in slide-in-from-left-2 duration-500" style={{ animationDelay: `${i * 150}ms` }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <p className="text-xs leading-relaxed text-indigo-900/80 dark:text-indigo-300/80 font-medium italic">
                      "{text}"
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground italic">Add more transactions to get personalized advice!</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity List */}
          <Card className="shadow-sm border-border flex flex-col flex-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50">
              <div>
                <h3 className="text-base font-semibold text-foreground">Recent Activity</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Your latest transactions.</p>
              </div>
              <Link to="/transactions" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-wider">
                See All
              </Link>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <div className="divide-y divide-border">
                {transactions.slice(0, 5).map((t) => {
                  const catData = getCategoryData(t.category);
                  const theme = THEMES[catData.theme];
                  const Icon = catData.icon;
                  const isExpense = t.type === 'expense';

                  return (
                    <div key={t.id} className="flex items-center justify-between p-4 hover:bg-secondary transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${theme.badgeBg}`}>
                          <Icon className={`w-4 h-4 ${theme.iconBg}`} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{t.title}</p>
                          <p className={`text-[10px] uppercase font-bold tracking-wider mt-0.5 ${theme.iconBg}`}>{t.category}</p>
                        </div>
                      </div>
                      <span className={`text-sm font-bold whitespace-nowrap ml-2 ${isExpense ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {isExpense ? '-' : '+'}{currencySymbol}{formatAmount(Math.abs(t.amount))}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Floating Paisa Buddy AI Input Bar */}
      <div className="sticky bottom-0 pb-2 pt-6 mt-auto pointer-events-none z-50 w-full">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-2">
          
          {/* Suggestion Chips */}
          <div className="flex items-center gap-2 pointer-events-auto overflow-x-auto w-full px-2 hide-scrollbar pb-1">
            {suggestions.map((s, i) => (
              <button 
                key={i}
                onClick={() => handleChipClick(s, i)}
                disabled={chipLoading !== null}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-card border border-border shadow-sm text-xs font-medium text-foreground hover:text-indigo-600 hover:border-indigo-500 transition-colors flex items-center gap-1.5 disabled:opacity-60"
              >
                {chipLoading === i 
                  ? <div className="w-3 h-3 border border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  : <s.icon className={`w-3 h-3 ${s.color}`} />
                }
                {s.text}
              </button>
            ))}
          </div>

          {/* Glassmorphic Input Bar */}
          <div className="w-full bg-background/70 backdrop-blur-xl border border-border shadow-2xl rounded-2xl p-2 pointer-events-auto ring-1 ring-foreground/5">
            <div className="flex items-center gap-2 bg-card rounded-xl px-4 py-2.5 border border-border shadow-inner focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <input 
                type="text" 
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAISubmit()}
                placeholder={isProcessing ? "Paisa Buddy is thinking..." : `Try: "Spent 200 on chai" or "Add 500 to Emergency Fund"...`}
                disabled={isProcessing}
                className="flex-1 bg-transparent border-none text-sm font-medium text-foreground focus:outline-none placeholder:text-muted-foreground py-1 disabled:opacity-50"
              />
              <button 
                onClick={handleMicClick}
                disabled={isProcessing || isListening}
                className={`p-2 transition-colors rounded-lg hover:bg-secondary ${isListening ? 'text-rose-500 animate-pulse' : 'text-muted-foreground hover:text-indigo-600'}`}
              >
                <Mic className="w-5 h-5" />
              </button>
              <button 
                onClick={handleScanClick}
                disabled={isProcessing}
                className="p-2 text-muted-foreground hover:text-indigo-600 transition-colors rounded-lg hover:bg-secondary disabled:opacity-50"
              >
                <Camera className="w-5 h-5" />
              </button>
              <button 
                id="ai-submit-btn"
                onClick={handleAISubmit}
                disabled={isProcessing}
                className={`p-2.5 rounded-lg flex items-center justify-center transition-all ml-1 shadow-sm ${
                  aiInput.trim() && !isProcessing ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md hover:-translate-y-0.5" : "bg-secondary text-muted-foreground cursor-not-allowed"
                }`}
              >
                {isProcessing ? <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
