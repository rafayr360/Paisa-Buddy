import { useState } from "react";
import { Mail, Lock, AlertCircle, Loader2, User, Eye, EyeOff, ShieldCheck, CheckCircle2, Wallet, ArrowLeft } from "lucide-react";
import { useGlobal } from "../context/GlobalContext";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { Input } from "../components/ui/input";

// ── Validation Helpers ──────────────────────────────────────────
const validateEmail = (email) => {
  if (!email) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return "Enter a valid email address.";
  return "";
};

const validatePassword = (password) => {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Must be at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Include at least one uppercase letter.";
  if (!/[a-z]/.test(password)) return "Include at least one lowercase letter.";
  if (!/[0-9]/.test(password)) return "Include at least one number.";
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) return "Include at least one special character (!@#$%).";
  return "";
};

const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score++;
  if (score <= 1) return { score: 1, label: "Weak", color: "bg-rose-500" };
  if (score === 2) return { score: 2, label: "Fair", color: "bg-amber-500" };
  if (score === 3) return { score: 3, label: "Good", color: "bg-yellow-400" };
  if (score === 4) return { score: 4, label: "Strong", color: "bg-emerald-500" };
  return { score: 5, label: "Very Strong", color: "bg-emerald-400" };
};

// ── Input Field Component ────────────────────────────────────────
function AuthInput({ icon: Icon, type, value, onChange, placeholder, error, rightElement, label, hint }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">{label}</label>}
      <div className={`relative group`}>
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors pointer-events-none" />
        <Input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`pl-12 py-7 bg-white/[0.03] border ${error ? "border-rose-500/50 focus:border-rose-500/70" : "border-white/10 focus:border-indigo-500/50"} focus:ring-0 rounded-2xl transition-all font-semibold text-white placeholder:text-slate-600 text-sm`}
        />
        {rightElement && <div className="absolute right-4 top-1/2 -translate-y-1/2">{rightElement}</div>}
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-rose-400 font-medium ml-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
        </p>
      )}
      {hint && !error && <p className="text-xs text-slate-600 ml-1">{hint}</p>}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────
export default function AuthPage() {
  const [mode, setMode] = useState("login"); // "login" | "signup" | "forgot" | "verify"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const { login, signup, sendPasswordReset, user, logout, resendVerification } = useGlobal();
  const navigate = useNavigate();

  if (user && user.emailVerified) return <Navigate to="/dashboard" replace />;

  const strength = getPasswordStrength(password);

  // ── Validate & Submit Login ──
  const handleLogin = async (e) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    const passErr = !password ? "Password is required." : "";
    if (emailErr || passErr) { setErrors({ email: emailErr, password: passErr }); return; }
    setErrors({});
    setServerError("");
    setLoading(true);
    try {
      const res = await login(email, password);
      if (!res.user.emailVerified) {
        setServerError("Your email is not verified. Please check your inbox.");
        setMode("verify");
        // Keep user logged in but they will be restricted by ProtectedRoute until verified
        setLoading(false);
        return;
      }
      navigate("/dashboard");
    } catch (err) {
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setServerError("Invalid email or password. Please try again.");
      } else if (err.code === "auth/too-many-requests") {
        setServerError("Too many attempts. Please wait a moment and try again.");
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    } finally { setLoading(false); }
  };

  // ── Validate & Submit Signup ──
  const handleSignup = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!name || name.trim().length < 2) newErrors.name = "Name must be at least 2 characters.";
    if (/[0-9!@#$%^&*]/.test(name)) newErrors.name = "Name should only contain letters.";
    const emailErr = validateEmail(email);
    if (emailErr) newErrors.email = emailErr;
    const passErr = validatePassword(password);
    if (passErr) newErrors.password = passErr;
    if (!confirmPassword) newErrors.confirmPassword = "Please confirm your password.";
    else if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match.";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    setServerError("");
    setLoading(true);
    try {
      await signup(email, password, name);
      setMode("verify");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setServerError("This email is already registered. Please log in instead.");
      } else {
        setServerError("Could not create account. Please try again.");
      }
    } finally { setLoading(false); }
  };

  // ── Forgot Password ──
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    if (emailErr) { setErrors({ email: emailErr }); return; }
    setErrors({});
    setServerError("");
    setLoading(true);
    try {
      await sendPasswordReset(email);
      setResetSent(true);
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setServerError("No account found with this email address.");
      } else {
        setServerError("Could not send reset email. Please try again.");
      }
    } finally { setLoading(false); }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setErrors({});
    setServerError("");
    setResetSent(false);
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-sans selection:bg-indigo-500/30 overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: "1s" }} />

      <div className="max-w-[1000px] w-full bg-white/[0.03] backdrop-blur-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[680px] border border-white/10 relative z-10">

        {/* ── Left Branding Panel — Premium Dark Design ── */}
        <div className="hidden md:flex md:w-[45%] flex-col justify-between p-10 text-white relative overflow-hidden"
          style={{ background: "linear-gradient(145deg, #0a0a1a 0%, #0f0a2e 40%, #130d3a 70%, #0d1220 100%)" }}>

          {/* Deep space background stars */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(30)].map((_, i) => (
              <div key={i} className="absolute rounded-full bg-white"
                style={{
                  width: `${Math.random() * 2 + 1}px`,
                  height: `${Math.random() * 2 + 1}px`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  opacity: Math.random() * 0.5 + 0.1,
                  animation: `pulse ${Math.random() * 3 + 2}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 3}s`
                }}
              />
            ))}
          </div>

          {/* Glowing orbs */}
          <div className="absolute top-[-5%] right-[-10%] w-72 h-72 rounded-full opacity-20 pointer-events-none"
            style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }} />
          <div className="absolute bottom-[10%] left-[-15%] w-80 h-80 rounded-full opacity-15 pointer-events-none"
            style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)" }} />
          <div className="absolute top-[40%] right-[-5%] w-48 h-48 rounded-full opacity-10 pointer-events-none"
            style={{ background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)" }} />

          {/* Subtle grid lines */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

          {/* Top: Logo */}
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg border border-indigo-500/30"
                style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}>
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-white">Paisa Buddy</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Live • Secure</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Middle: Main heading + floating stat cards */}
          <div className="relative z-10 space-y-8">

            {/* Heading */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-bold uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse inline-block" />
                {mode === "signup" ? "New Account" : mode === "forgot" ? "Password Reset" : mode === "verify" ? "Email Verification" : "Secure Login"}
              </div>
              <h1 className="text-4xl font-black leading-tight tracking-tight">
                {mode === "signup" ? <>Start your<br /><span style={{ background: "linear-gradient(90deg, #a78bfa, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>journey.</span></> :
                 mode === "forgot" ? <>Reset your<br /><span style={{ background: "linear-gradient(90deg, #a78bfa, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>password.</span></> :
                 mode === "verify" ? <>Verify your<br /><span style={{ background: "linear-gradient(90deg, #a78bfa, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>inbox.</span></> :
                 <>Welcome<br /><span style={{ background: "linear-gradient(90deg, #a78bfa, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>back.</span></>}
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed font-medium max-w-[260px]">
                {mode === "signup" ? "Join thousands mastering their finances with AI-powered insights." :
                 mode === "forgot" ? "We'll send a secure reset link to your inbox instantly." :
                 mode === "verify" ? "Check your inbox for the verification link to continue." :
                 "Access your dashboard and take full control of your financial future."}
              </p>
            </div>

            {/* Floating mini stat cards */}
            <div className="space-y-3">
              {/* Balance card */}
              <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-white/[0.07] backdrop-blur-sm"
                style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))", border: "1px solid rgba(99,102,241,0.3)" }}>
                  <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">Total Savings</p>
                  <p className="text-base font-black text-white">₨ 2,40,000</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">+12.5%</span>
                </div>
              </div>

              {/* Spending trend mini chart card */}
              <div className="p-3.5 rounded-2xl border border-white/[0.07] backdrop-blur-sm"
                style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">Monthly Spending</p>
                  <span className="text-[10px] font-bold text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded-full">-3.2%</span>
                </div>
                {/* Mini bar chart */}
                <div className="flex items-end gap-1 h-8">
                  {[40, 65, 45, 80, 55, 70, 50, 90, 60, 75, 45, 85].map((h, i) => (
                    <div key={i} className="flex-1 rounded-sm transition-all"
                      style={{
                        height: `${h}%`,
                        background: i === 11
                          ? "linear-gradient(180deg, #6366f1, #8b5cf6)"
                          : "rgba(99,102,241,0.2)",
                      }} />
                  ))}
                </div>
              </div>

              {/* AI insight pill */}
              <div className="flex items-center gap-3 p-3 rounded-2xl border border-violet-500/20"
                style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(99,102,241,0.05))" }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L9.19 8.63L2 9.24L7 13.97L5.82 21L12 17.27L18.18 21L17 13.97L22 9.24L14.81 8.63L12 2Z"/>
                  </svg>
                </div>
                <p className="text-[11px] text-violet-300 font-semibold leading-snug">
                  AI detected ₨12,000 saving opportunity this month
                </p>
              </div>
            </div>
          </div>

          {/* Bottom: Security badge */}
          <div className="relative z-10">
            <div className="flex items-center gap-4 p-4 rounded-2xl border border-white/[0.07]"
              style={{ background: "rgba(255,255,255,0.02)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #059669, #10b981)", boxShadow: "0 0 16px rgba(16,185,129,0.3)" }}>
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-black text-white tracking-wide">Bank-grade Security</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">256-bit AES • End-to-end encrypted</p>
              </div>
              <div className="ml-auto flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                    style={{ opacity: 0.4 + i * 0.3, animation: `pulse ${1 + i * 0.5}s ease-in-out infinite` }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Form ── */}
        <div className="flex-1 p-8 md:p-14 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">

            {/* ── EMAIL VERIFICATION SCREEN ── */}
            {mode === "verify" && (
              <div className="text-center">
                <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-black text-white mb-3">Verify Your Email</h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-2">
                  We sent a verification link to:
                </p>
                <p className="text-indigo-400 font-bold text-sm mb-6">{email}</p>
                <p className="text-slate-500 text-xs leading-relaxed mb-6">
                  Click the link in the email to activate your account, then come back to log in.
                </p>
                
                <div className="p-4 mb-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3 text-left mx-auto max-w-sm">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-amber-200/90 text-xs leading-relaxed">
                    <strong className="text-amber-400 font-bold block mb-0.5">Important Note:</strong>
                    If you don't see the email in your inbox within a few minutes, please make sure to check your <strong>Spam</strong> or <strong>Junk</strong> folder.
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={async () => {
                      setLoading(true);
                      try {
                        // Normally user is logged out here, but if they aren't, resend works.
                        // If they are logged out, they need to log in to get a new link.
                        // We will prompt them to log in if it fails.
                        await resendVerification();
                        setServerError("A new link has been sent!");
                      } catch (err) {
                        setServerError("Please log in to request a new link.");
                        switchMode("login");
                      }
                      setLoading(false);
                    }}
                    disabled={loading}
                    className="w-full py-4 bg-white/[0.05] border border-white/10 text-white rounded-2xl text-sm font-bold hover:bg-white/10 transition-all flex justify-center items-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Resend Link"}
                  </button>
                  {user ? (
                    <button
                      onClick={async () => {
                        setLoading(true);
                        setServerError("");
                        try {
                          await user.reload();
                          if (user.emailVerified) {
                            window.location.reload(); // Force app to re-evaluate routes with fresh token
                          } else {
                            setServerError("Your email is still not verified. Please check your inbox or spam folder.");
                          }
                        } catch (err) {
                          switchMode("login");
                        }
                        setLoading(false);
                      }}
                      className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-500 transition-all flex justify-center items-center gap-2"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "I've Verified My Email"}
                    </button>
                  ) : (
                    <button
                      onClick={() => switchMode("login")}
                      className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-500 transition-all"
                    >
                      Go to Login
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── FORGOT PASSWORD SCREEN ── */}
            {mode === "forgot" && (
              <div>
                <button onClick={() => switchMode("login")} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium mb-8">
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </button>
                <h2 className="text-2xl font-black text-white mb-2">Forgot Password?</h2>
                <p className="text-slate-400 text-sm mb-8">Enter your registered email and we'll send you a reset link.</p>

                {resetSent ? (
                  <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                    <p className="text-emerald-300 font-bold text-sm">Reset link sent!</p>
                    <p className="text-slate-400 text-xs mt-1">Check your inbox at <span className="text-white font-semibold">{email}</span></p>
                    <button onClick={() => switchMode("login")} className="mt-5 text-indigo-400 hover:text-indigo-300 text-sm font-bold transition-colors">
                      Back to Login
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-5">
                    {serverError && (
                      <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-2xl flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{serverError}
                      </div>
                    )}
                    <AuthInput icon={Mail} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" error={errors.email} label="Email Address" />
                    <button type="submit" disabled={loading} className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-60 flex justify-center items-center gap-2">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Link"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* ── LOGIN FORM ── */}
            {mode === "login" && (
              <div>
                <div className="mb-8">
                  <h2 className="text-2xl font-black text-white tracking-tight">Sign In</h2>
                  <p className="text-slate-400 mt-1.5 text-sm">Access your dashboard and manage your wealth.</p>
                </div>
                {serverError && (
                  <div className="mb-5 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-2xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{serverError}
                  </div>
                )}
                <form onSubmit={handleLogin} className="space-y-5">
                  <AuthInput icon={Mail} type="email" value={email} onChange={e => { setEmail(e.target.value); setErrors(p=>({...p,email:""})); }} placeholder="name@example.com" error={errors.email} label="Email Address" />
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Password</label>
                      <button type="button" onClick={() => { setEmail(email); switchMode("forgot"); }} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors pointer-events-none" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={e => { setPassword(e.target.value); setErrors(p=>({...p,password:""})); }}
                        placeholder="••••••••"
                        className={`pl-12 py-7 bg-white/[0.03] border ${errors.password ? "border-rose-500/50" : "border-white/10 focus:border-indigo-500/50"} focus:ring-0 rounded-2xl transition-all font-semibold text-white placeholder:text-slate-600 text-sm`}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && <p className="flex items-center gap-1.5 text-xs text-rose-400 font-medium ml-1"><AlertCircle className="w-3.5 h-3.5" />{errors.password}</p>}
                  </div>
                  <button type="submit" disabled={loading} className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-60 flex justify-center items-center gap-2 mt-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
                  </button>
                </form>
                <p className="text-sm text-slate-500 font-medium text-center mt-8">
                  Don't have an account?{" "}
                  <button onClick={() => switchMode("signup")} className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors">Create one free</button>
                </p>
              </div>
            )}

            {/* ── SIGNUP FORM ── */}
            {mode === "signup" && (
              <div>
                <div className="mb-8">
                  <h2 className="text-2xl font-black text-white tracking-tight">Create Account</h2>
                  <p className="text-slate-400 mt-1.5 text-sm">Free forever. No credit card required.</p>
                </div>
                {serverError && (
                  <div className="mb-5 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-2xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{serverError}
                  </div>
                )}
                <form onSubmit={handleSignup} className="space-y-4">
                  <AuthInput icon={User} type="text" value={name} onChange={e => { setName(e.target.value); setErrors(p=>({...p,name:""})); }} placeholder="Your Full Name" error={errors.name} label="Full Name" />
                  <AuthInput icon={Mail} type="email" value={email} onChange={e => { setEmail(e.target.value); setErrors(p=>({...p,email:""})); }} placeholder="name@example.com" error={errors.email} label="Email Address" />

                  {/* Password with strength meter */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors pointer-events-none" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={e => { setPassword(e.target.value); setErrors(p=>({...p,password:""})); }}
                        placeholder="Min 8 chars, uppercase, number, symbol"
                        className={`pl-12 py-7 bg-white/[0.03] border ${errors.password ? "border-rose-500/50" : "border-white/10 focus:border-indigo-500/50"} focus:ring-0 rounded-2xl transition-all font-semibold text-white placeholder:text-slate-600 text-sm`}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {/* Strength Bar */}
                    {password && (
                      <div className="mt-2 ml-1">
                        <div className="flex gap-1 mb-1">
                          {[1,2,3,4,5].map(i => (
                            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength.score ? strength.color : "bg-white/10"}`} />
                          ))}
                        </div>
                        <p className="text-xs font-medium text-slate-500">Strength: <span className={strength.score >= 4 ? "text-emerald-400" : strength.score >= 3 ? "text-yellow-400" : "text-rose-400"}>{strength.label}</span></p>
                      </div>
                    )}
                    {errors.password && <p className="flex items-center gap-1.5 text-xs text-rose-400 font-medium ml-1"><AlertCircle className="w-3.5 h-3.5" />{errors.password}</p>}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Confirm Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors pointer-events-none" />
                      <Input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={e => { setConfirmPassword(e.target.value); setErrors(p=>({...p,confirmPassword:""})); }}
                        placeholder="Re-enter your password"
                        className={`pl-12 py-7 bg-white/[0.03] border ${errors.confirmPassword ? "border-rose-500/50" : confirmPassword && confirmPassword === password ? "border-emerald-500/40" : "border-white/10 focus:border-indigo-500/50"} focus:ring-0 rounded-2xl transition-all font-semibold text-white placeholder:text-slate-600 text-sm`}
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                        {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="flex items-center gap-1.5 text-xs text-rose-400 font-medium ml-1"><AlertCircle className="w-3.5 h-3.5" />{errors.confirmPassword}</p>}
                    {confirmPassword && confirmPassword === password && !errors.confirmPassword && (
                      <p className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium ml-1"><CheckCircle2 className="w-3.5 h-3.5" />Passwords match</p>
                    )}
                  </div>

                  <button type="submit" disabled={loading} className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-60 flex justify-center items-center gap-2 mt-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
                  </button>
                </form>
                <p className="text-sm text-slate-500 font-medium text-center mt-6">
                  Already have an account?{" "}
                  <button onClick={() => switchMode("login")} className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors">Sign in</button>
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
