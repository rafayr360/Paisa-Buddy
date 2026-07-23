import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Shield, TrendingUp, Zap, ArrowRight, PieChart, Wallet, Globe, ChevronDown, CheckCircle, BarChart2, Camera, Brain } from "lucide-react";
import { useGlobal } from "../context/GlobalContext";

const FEATURES = [
  { title: "AI Financial Buddy", desc: "Talk to your money. Type 'Spent 500 on dinner' and it's logged. Our AI understands natural language so finance feels effortless.", icon: Brain, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
  { title: "Smart Budgeting", desc: "Set monthly limits per category. Watch live progress bars update in real-time. Never overspend again.", icon: PieChart, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  { title: "Receipt Scanner", desc: "Snap a photo of any bill. Our AI reads it and logs the transaction automatically. Zero manual entry.", icon: Camera, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { title: "Savings Goals", desc: "Create goals for your dreams — car, house, vacation. Track progress with beautiful visual charts.", icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { title: "Multi-Currency", desc: "PKR, USD, EUR, INR — switch instantly. Real-time exchange rates always keep your numbers accurate.", icon: Globe, color: "text-fuchsia-400", bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/20" },
  { title: "Bank-Level Security", desc: "Firebase-backed auth with encrypted cloud storage. Your financial data is private and protected.", icon: Shield, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
];

const FAQS = [
  { q: "Is Paisa Buddy free to use?", a: "Yes! Paisa Buddy is completely free. Create an account and access all core features including AI insights, budgeting, savings goals, and transaction tracking at no cost." },
  { q: "Is my financial data safe?", a: "Absolutely. We use Firebase with industry-standard encryption. Your data is stored securely in the cloud, accessible only by you. We never sell or share your financial information." },
  { q: "Can I use it for PKR / Pakistani Rupees?", a: "Yes! Paisa Buddy supports PKR, USD, EUR, GBP, INR and more. You can switch your currency anytime from Settings and all amounts convert automatically using live exchange rates." },
  { q: "How does the AI feature work?", a: "Just type something like 'Spent 800 on biryani' or 'Got 50,000 salary' in the AI bar on the dashboard. Our Gemini-powered AI understands your intent and logs it as a transaction instantly." },
];

function StatCard({ value, label, color }) {
  return (
    <div className={`flex flex-col items-center p-6 rounded-2xl bg-white/[0.03] border border-white/5`}>
      <span className={`text-4xl font-black ${color} mb-1`}>{value}</span>
      <span className="text-slate-400 text-sm font-medium">{label}</span>
    </div>
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 ${open ? "bg-white/[0.04]" : "bg-white/[0.02]"}`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-6 text-left gap-4">
        <span className="font-semibold text-white text-base">{q}</span>
        <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-6 pb-6 text-slate-400 text-sm leading-relaxed">{a}</div>}
    </div>
  );
}

export default function LandingPage() {
  const { user } = useGlobal();

  return (
    <div className="min-h-screen bg-[#0a0c14] text-slate-100 selection:bg-indigo-500/30 overflow-x-hidden font-sans">
      <style>{`
        @keyframes gradient-x { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        .animate-gradient-x { background-size:200% 200%; animation:gradient-x 8s ease infinite; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        .animate-float { animation:float 4s ease-in-out infinite; }
        .animate-float-slow { animation:float 6s ease-in-out infinite; }
        @keyframes pulse-glow { 0%,100%{opacity:.4} 50%{opacity:.8} }
        .glow-indigo { animation:pulse-glow 3s ease-in-out infinite; }
      `}</style>

      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-700/10 rounded-full blur-[140px] glow-indigo" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-violet-700/10 rounded-full blur-[140px] glow-indigo" style={{animationDelay:"1.5s"}} />
        <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] bg-fuchsia-700/5 rounded-full blur-[100px]" />
      </div>

      {/* ── NAV ── */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-10 py-5 max-w-7xl mx-auto border-b border-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Wallet className="text-white w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">Paisa Buddy</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how" className="hover:text-white transition-colors">How it Works</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          <a href="#about" className="hover:text-white transition-colors">About</a>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <Link to="/dashboard" className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-all font-bold text-sm shadow-lg shadow-indigo-600/20">
              Dashboard →
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden sm:block">Login</Link>
              <Link to="/login" className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-all font-bold text-sm shadow-lg shadow-indigo-600/20">
                Get Started Free
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 pt-24 pb-16 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-8">
          <Sparkles className="w-3.5 h-3.5" /> Powered by Gemini AI
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.08]">
          Stop Guessing.<br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 animate-gradient-x">
            Start Winning.
          </span>
        </h1>
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-4 leading-relaxed">
          Paisa Buddy is the AI-powered finance companion that tracks your money, warns before you overspend, and helps you save — automatically.
        </p>
        <p className="text-indigo-300/70 text-base font-medium italic mb-10">"Your pocket. Your power. Your future."</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <Link to="/login" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 transition-all font-bold text-base shadow-2xl shadow-indigo-600/30 flex items-center justify-center gap-2 group">
            Start for Free <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a href="#features" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] transition-all font-bold text-base">
            See Features ↓
          </a>
        </div>

        {/* Dashboard Mockup — CSS Built */}
        <div className="relative max-w-5xl mx-auto">
          <div className="absolute inset-0 bg-indigo-600/20 blur-[100px] rounded-full" />
          <div className="relative rounded-3xl border border-white/10 bg-[#0d1117] p-4 md:p-6 shadow-[0_0_60px_rgba(79,70,229,0.15)] overflow-hidden">
            {/* Mock header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center"><Wallet className="w-4 h-4 text-white" /></div>
                <span className="text-xs font-bold text-slate-300">Dashboard</span>
              </div>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500/60" />
                <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
              </div>
            </div>
            {/* Mock stat cards */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label:"Total Balance", val:"$11,337", color:"border-indigo-500/30 bg-indigo-950/40", text:"text-indigo-300" },
                { label:"Income", val:"+$15,000", color:"border-emerald-500/30 bg-emerald-950/40", text:"text-emerald-300" },
                { label:"Expenses", val:"-$3,662", color:"border-rose-500/30 bg-rose-950/40", text:"text-rose-300" },
              ].map(c=>(
                <div key={c.label} className={`rounded-2xl border-2 p-3 md:p-4 ${c.color}`}>
                  <p className="text-[10px] text-slate-500 font-medium mb-1">{c.label}</p>
                  <p className={`text-sm md:text-xl font-black ${c.text}`}>{c.val}</p>
                </div>
              ))}
            </div>
            {/* Mock chart + activity */}
            <div className="grid grid-cols-5 gap-3">
              <div className="col-span-3 rounded-2xl bg-white/[0.03] border border-white/5 p-4">
                <p className="text-xs font-bold text-slate-400 mb-3">Spending by Category</p>
                <div className="flex items-end gap-2 h-16">
                  {[60,85,40,95,30,70,55].map((h,i)=>(
                    <div key={i} className="flex-1 rounded-t-sm bg-indigo-500/30 hover:bg-indigo-500/60 transition-colors" style={{height:`${h}%`}} />
                  ))}
                </div>
              </div>
              <div className="col-span-2 rounded-2xl bg-white/[0.03] border border-white/5 p-4">
                <p className="text-xs font-bold text-slate-400 mb-3">Recent Activity</p>
                <div className="space-y-2">
                  {[{t:"Coffee",a:"-$4.50",c:"text-rose-400"},{t:"Salary",a:"+$5,000",c:"text-emerald-400"},{t:"Netflix",a:"-$15",c:"text-rose-400"}].map(r=>(
                    <div key={r.t} className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400">{r.t}</span>
                      <span className={`text-[10px] font-bold ${r.c}`}>{r.a}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* AI bar mock */}
            <div className="mt-3 rounded-2xl bg-indigo-950/50 border border-indigo-500/20 px-4 py-3 flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-xs text-slate-500 italic">"Spent 500 on groceries today..."</span>
              <div className="ml-auto w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            {/* Floating badge */}
            <div className="absolute top-6 right-6 animate-float px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-xl hidden md:flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-300">Budget on track</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard value="10K+" label="Active Users" color="text-indigo-400" />
          <StatCard value="₨2B+" label="Tracked Monthly" color="text-emerald-400" />
          <StatCard value="99.9%" label="Uptime" color="text-violet-400" />
          <StatCard value="4.9★" label="User Rating" color="text-amber-400" />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold uppercase tracking-widest mb-5">
            <BarChart2 className="w-3.5 h-3.5" /> Features
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">Built for people who take<br /><span className="text-indigo-400">money seriously.</span></h2>
          <p className="text-slate-400 max-w-xl mx-auto">Everything you need, nothing you don't. Simple, smart, and powerful.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <div key={i} className={`group p-7 rounded-3xl bg-white/[0.02] border ${f.border} hover:bg-white/[0.04] transition-all duration-300 hover:-translate-y-1`}>
              <div className={`w-14 h-14 rounded-2xl ${f.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <f.icon className={`w-7 h-7 ${f.color}`} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-24 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Up and running in <span className="text-indigo-400">60 seconds.</span></h2>
          <p className="text-slate-400">No complicated setup. Just sign in and start.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step:"01", title:"Create Account", desc:"Sign up free with your email. No credit card required. Your dashboard is ready instantly.", icon:Wallet, color:"text-indigo-400" },
            { step:"02", title:"Add Transactions", desc:"Type naturally or scan a receipt. Set up your budgets and savings goals in minutes.", icon:Zap, color:"text-violet-400" },
            { step:"03", title:"Watch It Work", desc:"Get AI insights, real-time alerts, and beautiful reports. Your money, finally under control.", icon:TrendingUp, color:"text-emerald-400" },
          ].map((s, i) => (
            <div key={i} className="relative p-7 rounded-3xl bg-white/[0.02] border border-white/5 text-center">
              <div className="absolute top-4 right-4 text-5xl font-black text-white/[0.04]">{s.step}</div>
              <div className={`w-14 h-14 rounded-2xl bg-white/[0.05] flex items-center justify-center mb-4 mx-auto`}>
                <s.icon className={`w-7 h-7 ${s.color}`} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-16 px-6 max-w-4xl mx-auto">
        <div className="relative rounded-3xl bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/20 p-10 md:p-14 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-violet-600/5" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-black mb-4">Ready to take control?</h2>
            <p className="text-slate-400 mb-8 text-lg max-w-xl mx-auto">Join thousands already mastering their finances. Free forever. No excuses.</p>
            <Link to="/login" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-bold text-base transition-all shadow-2xl shadow-indigo-600/30 group">
              Start Free Today <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-6 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black mb-3">Frequently Asked <span className="text-indigo-400">Questions</span></h2>
          <p className="text-slate-400">Everything you need to know before getting started.</p>
        </div>
        <div className="space-y-3">
          {FAQS.map((faq, i) => <FAQItem key={i} {...faq} />)}
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" className="py-24 px-6 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-6">About Us</div>
            <h2 className="text-3xl md:text-4xl font-black mb-5 leading-tight">We built this because <span className="text-indigo-400">we needed it too.</span></h2>
            <p className="text-slate-400 leading-relaxed mb-4">Paisa Buddy was born out of frustration with spreadsheets and complicated apps. We wanted something that just works — fast, intelligent, and beautiful.</p>
            <p className="text-slate-400 leading-relaxed">Built with React, Firebase, and powered by Google Gemini AI. We believe everyone deserves a personal finance tool that's actually enjoyable to use.</p>
          </div>
          <div className="space-y-4">
            {[
              { label:"Mission", val:"Make financial clarity accessible to everyone." },
              { label:"Vision", val:"A world where no one is surprised by their bank balance." },
            ].map(item=>(
              <div key={item.label} className="p-5 rounded-2xl bg-white/[0.03] border border-white/5">
                <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest mb-1">{item.label}</p>
                <p className="text-white font-semibold text-sm">{item.val}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Wallet className="text-white w-4 h-4" />
                </div>
                <span className="font-bold text-white">Paisa Buddy</span>
              </div>
              <p className="text-slate-500 text-sm">Your AI-powered finance companion for the modern world.</p>
            </div>
            <div>
              <p className="text-white font-bold text-sm mb-3">Product</p>
              <div className="space-y-2 text-slate-500 text-sm">
                <a href="#features" className="block hover:text-white transition-colors">Features</a>
                <a href="#how" className="block hover:text-white transition-colors">How it Works</a>
                <Link to="/login" className="block hover:text-white transition-colors">Get Started</Link>
              </div>
            </div>
            <div>
              <p className="text-white font-bold text-sm mb-3">Company</p>
              <div className="space-y-2 text-slate-500 text-sm">
                <a href="#about" className="block hover:text-white transition-colors">About</a>
                <a href="#faq" className="block hover:text-white transition-colors">FAQ</a>
                <Link to="/privacy" className="block hover:text-white transition-colors">Privacy Policy</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-600 text-sm">© 2026 Paisa Buddy AI. All rights reserved.</p>
            <p className="text-slate-600 text-sm italic">"Your pocket. Your power. Your future."</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
